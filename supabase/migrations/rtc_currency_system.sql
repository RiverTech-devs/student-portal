-- ============================================================
-- RTC (River Tech Currency) System
-- Adds a virtual currency for student rewards and incentives
-- ============================================================

-- 1A. Add rtc_balance column to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS rtc_balance INTEGER NOT NULL DEFAULT 0;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_rtc_balance_check'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_rtc_balance_check CHECK (rtc_balance >= 0);
  END IF;
END $$;

-- 1B. Create rtc_transactions table
CREATE TABLE IF NOT EXISTS rtc_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'earn_manual', 'earn_skill', 'earn_assignment', 'earn_arcade',
    'spend_cosmetic', 'spend_reward', 'admin_adjustment'
  )),
  description TEXT,
  reference_id TEXT,
  reference_type TEXT,
  balance_after INTEGER NOT NULL,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rtc_transactions_user_id ON rtc_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_rtc_transactions_created_at ON rtc_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_rtc_transactions_type ON rtc_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_rtc_transactions_reference ON rtc_transactions(reference_id, reference_type);

-- Enable RLS
ALTER TABLE rtc_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 1C. RLS Policies
-- ============================================================

-- Students: NO access to rtc_transactions (they see balance via user_profiles only)

-- Teachers: SELECT + INSERT for their students (via class_enrollments)
CREATE POLICY "Teachers can view their students transactions"
  ON rtc_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.user_type = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = rtc_transactions.user_id
        AND ce.status = 'active'
        AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    )
  );

CREATE POLICY "Teachers can insert transactions for their students"
  ON rtc_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.user_type = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = rtc_transactions.user_id
        AND ce.status = 'active'
        AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    )
  );

-- Admins: Full CRUD on all transactions
CREATE POLICY "Admins have full access to transactions"
  ON rtc_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.user_type = 'admin'
    )
  );

-- Parents: SELECT on their linked children's transactions
CREATE POLICY "Parents can view their childrens transactions"
  ON rtc_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.user_type = 'parent'
    )
    AND EXISTS (
      SELECT 1 FROM parent_child_links pcl
      WHERE pcl.parent_id = auth.uid()
        AND pcl.child_id = rtc_transactions.user_id
    )
  );

-- ============================================================
-- 1D. Core RPC: process_rtc_transaction()
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_rtc_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Validate transaction type
  IF p_transaction_type NOT IN (
    'earn_manual', 'earn_skill', 'earn_assignment', 'earn_arcade',
    'spend_cosmetic', 'spend_reward', 'admin_adjustment'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid transaction type');
  END IF;

  -- Prevent duplicate rewards via reference_id + reference_type + user_id
  IF p_reference_id IS NOT NULL AND p_reference_type IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.rtc_transactions
      WHERE user_id = p_user_id
        AND reference_id = p_reference_id
        AND reference_type = p_reference_type
    ) THEN
      RETURN json_build_object('success', false, 'error', 'Duplicate transaction: reward already granted');
    END IF;
  END IF;

  -- Lock the user row to prevent race conditions
  SELECT rtc_balance INTO v_current_balance
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  v_new_balance := v_current_balance + p_amount;

  -- Prevent negative balances on spends (not admin adjustments)
  IF v_new_balance < 0 AND p_transaction_type != 'admin_adjustment' THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Clamp to 0 for admin adjustments that go negative
  IF v_new_balance < 0 THEN
    v_new_balance := 0;
  END IF;

  -- Update balance
  UPDATE public.user_profiles
  SET rtc_balance = v_new_balance
  WHERE id = p_user_id;

  -- Insert transaction record
  INSERT INTO public.rtc_transactions (
    user_id, amount, transaction_type, description,
    reference_id, reference_type, balance_after, created_by
  ) VALUES (
    p_user_id, p_amount, p_transaction_type, p_description,
    p_reference_id, p_reference_type, v_new_balance, p_created_by
  ) RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_rtc_transaction TO authenticated;

-- ============================================================
-- 1E. Admin Override RPC: admin_set_rtc_balance()
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_set_rtc_balance(
  p_user_id UUID,
  p_new_balance INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_balance INTEGER;
  v_delta INTEGER;
  v_transaction_id UUID;
  v_caller_type TEXT;
BEGIN
  -- Check caller is admin
  SELECT user_type INTO v_caller_type
  FROM public.user_profiles
  WHERE id = auth.uid();

  IF v_caller_type != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Only admins can set balances directly');
  END IF;

  IF p_new_balance < 0 THEN
    RETURN json_build_object('success', false, 'error', 'Balance cannot be negative');
  END IF;

  -- Lock and get current balance
  SELECT rtc_balance INTO v_current_balance
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  v_delta := p_new_balance - v_current_balance;

  -- Update balance directly
  UPDATE public.user_profiles
  SET rtc_balance = p_new_balance
  WHERE id = p_user_id;

  -- Log as admin_adjustment
  INSERT INTO public.rtc_transactions (
    user_id, amount, transaction_type, description,
    balance_after, created_by
  ) VALUES (
    p_user_id, v_delta, 'admin_adjustment',
    'Admin balance override: set to ' || p_new_balance,
    p_new_balance, auth.uid()
  ) RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', p_new_balance,
    'delta', v_delta
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_rtc_balance TO authenticated;

-- ============================================================
-- 1F. Auto-reward triggers
-- ============================================================

-- Skill mastery trigger: awards 50 RTC when skill state changes to 'mastered' or 'activated'
CREATE OR REPLACE FUNCTION public.rtc_skill_mastery_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Only fire when state changes to mastered or activated
  IF (NEW.state IN ('mastered', 'activated')) AND (OLD.state IS DISTINCT FROM NEW.state) THEN
    SELECT public.process_rtc_transaction(
      p_user_id := NEW.user_id,
      p_amount := 50,
      p_transaction_type := 'earn_skill',
      p_description := 'Skill mastery: ' || COALESCE(NEW.skill_name, 'Unknown skill'),
      p_reference_id := NEW.id::TEXT,
      p_reference_type := 'skill_progress'
    ) INTO v_result;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_rtc_skill_mastery ON skill_progress;
CREATE TRIGGER trigger_rtc_skill_mastery
  AFTER UPDATE ON skill_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.rtc_skill_mastery_reward();

-- Assignment trigger: awards RTC based on score tiers
-- 90%+ = 30 RTC, 80%+ = 20 RTC, 70%+ = 10 RTC
CREATE OR REPLACE FUNCTION public.rtc_assignment_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSON;
  v_reward INTEGER;
  v_score INTEGER;
BEGIN
  v_score := COALESCE(NEW.final_score, 0);

  -- Determine reward tier
  IF v_score >= 90 THEN
    v_reward := 30;
  ELSIF v_score >= 80 THEN
    v_reward := 20;
  ELSIF v_score >= 70 THEN
    v_reward := 10;
  ELSE
    RETURN NEW; -- No reward below 70%
  END IF;

  -- Award RTC (duplicate check via reference_id prevents double awards)
  SELECT public.process_rtc_transaction(
    p_user_id := NEW.student_id,
    p_amount := v_reward,
    p_transaction_type := 'earn_assignment',
    p_description := 'Assignment score: ' || v_score || '% on ' || COALESCE(NEW.title, 'assignment'),
    p_reference_id := NEW.id::TEXT,
    p_reference_type := 'homework_assignments'
  ) INTO v_result;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_rtc_assignment_reward ON homework_assignments;
CREATE TRIGGER trigger_rtc_assignment_reward
  AFTER INSERT OR UPDATE OF final_score ON homework_assignments
  FOR EACH ROW
  WHEN (NEW.final_score IS NOT NULL)
  EXECUTE FUNCTION public.rtc_assignment_reward();

-- ============================================================
-- 1G. RTC Spend Categories
-- ============================================================

CREATE TABLE IF NOT EXISTS rtc_spend_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rtc_spend_categories ENABLE ROW LEVEL SECURITY;

-- Admins: Full CRUD on categories
CREATE POLICY "Admins have full access to spend categories"
  ON rtc_spend_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.user_type = 'admin'
    )
  );

-- Teachers and students: SELECT active categories only
CREATE POLICY "Teachers can view active spend categories"
  ON rtc_spend_categories FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.user_type = 'teacher'
    )
  );

CREATE POLICY "Students can view active spend categories"
  ON rtc_spend_categories FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.user_type = 'student'
    )
  );

-- Add category_id column to rtc_transactions
ALTER TABLE rtc_transactions ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES rtc_spend_categories(id);

-- ============================================================
-- Done! RTC currency system is ready.
-- ============================================================
