-- ============================================================
-- RTC Privilege System
-- Adds purchaseable time-limited privileges (e.g., Homework Pass, Seat Choice)
-- Students spend RTC on privileges that last a set number of days
-- Expired privileges are cleaned up lazily (on load), no cron needed
-- ============================================================

-- 1A. Expand transaction type CHECK constraint to include spend_privilege
ALTER TABLE rtc_transactions DROP CONSTRAINT IF EXISTS rtc_transactions_transaction_type_check;
ALTER TABLE rtc_transactions ADD CONSTRAINT rtc_transactions_transaction_type_check
  CHECK (transaction_type IN (
    'earn_manual', 'earn_skill', 'earn_assignment', 'earn_arcade',
    'spend_cosmetic', 'spend_reward', 'admin_adjustment',
    'bank_deposit', 'bank_withdraw', 'bank_interest', 'bank_tax',
    'spend_privilege'
  ));

-- Update process_rtc_transaction to accept spend_privilege
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
    'spend_cosmetic', 'spend_reward', 'admin_adjustment',
    'bank_deposit', 'bank_withdraw', 'bank_interest', 'bank_tax',
    'spend_privilege'
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

-- ============================================================
-- 1B. rtc_privileges table (the catalog)
-- ============================================================
CREATE TABLE IF NOT EXISTS rtc_privileges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price > 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  icon TEXT DEFAULT '🎖️',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rtc_privileges_active ON rtc_privileges(is_active, sort_order);

ALTER TABLE rtc_privileges ENABLE ROW LEVEL SECURITY;

-- Admins have full access
DROP POLICY IF EXISTS "Admins full access to privileges" ON rtc_privileges;
CREATE POLICY "Admins full access to privileges" ON rtc_privileges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND user_type = 'admin'
    )
  );

-- Teachers have full access
DROP POLICY IF EXISTS "Teachers full access to privileges" ON rtc_privileges;
CREATE POLICY "Teachers full access to privileges" ON rtc_privileges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND user_type = 'teacher'
    )
  );

-- Students can view active privileges only
DROP POLICY IF EXISTS "Students view active privileges" ON rtc_privileges;
CREATE POLICY "Students view active privileges" ON rtc_privileges
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND user_type = 'student'
    )
  );

GRANT SELECT ON rtc_privileges TO authenticated;
GRANT ALL ON rtc_privileges TO service_role;

-- ============================================================
-- 1C. rtc_student_privileges table (ownership/grants)
-- ============================================================
CREATE TABLE IF NOT EXISTS rtc_student_privileges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  privilege_id UUID NOT NULL REFERENCES rtc_privileges(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  price_paid INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_rtc_student_privileges_student ON rtc_student_privileges(student_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rtc_student_privileges_expires ON rtc_student_privileges(expires_at) WHERE is_active = true;

ALTER TABLE rtc_student_privileges ENABLE ROW LEVEL SECURITY;

-- Students can view their own grants
DROP POLICY IF EXISTS "Students view own privilege grants" ON rtc_student_privileges;
CREATE POLICY "Students view own privilege grants" ON rtc_student_privileges
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Admins have full access
DROP POLICY IF EXISTS "Admins full access to student privileges" ON rtc_student_privileges;
CREATE POLICY "Admins full access to student privileges" ON rtc_student_privileges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND user_type = 'admin'
    )
  );

-- Teachers can view all student privileges
DROP POLICY IF EXISTS "Teachers view student privileges" ON rtc_student_privileges;
CREATE POLICY "Teachers view student privileges" ON rtc_student_privileges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND user_type = 'teacher'
    )
  );

GRANT SELECT ON rtc_student_privileges TO authenticated;
GRANT ALL ON rtc_student_privileges TO service_role;

-- ============================================================
-- 1D. rtc_purchase_privilege(p_privilege_id UUID) — SECURITY DEFINER RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.rtc_purchase_privilege(p_privilege_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_privilege RECORD;
  v_wallet_balance INTEGER;
  v_new_balance INTEGER;
  v_grant_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_tx_result JSON;
BEGIN
  -- Resolve user from auth.uid()
  SELECT id INTO v_user_id
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Load privilege (must be active)
  SELECT id, name, price, duration_days, is_active
  INTO v_privilege
  FROM public.rtc_privileges
  WHERE id = p_privilege_id;

  IF v_privilege.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Privilege not found');
  END IF;

  IF NOT v_privilege.is_active THEN
    RETURN json_build_object('success', false, 'error', 'This privilege is no longer available');
  END IF;

  -- Lazy expiry: mark expired grants as inactive
  UPDATE public.rtc_student_privileges
  SET is_active = false
  WHERE student_id = v_user_id
    AND is_active = true
    AND expires_at <= now();

  -- Check no active grant exists for this privilege (one-at-a-time)
  IF EXISTS (
    SELECT 1 FROM public.rtc_student_privileges
    WHERE student_id = v_user_id
      AND privilege_id = p_privilege_id
      AND is_active = true
  ) THEN
    RETURN json_build_object('success', false, 'error', 'You already have this privilege active');
  END IF;

  -- Lock wallet, check sufficient balance
  SELECT rtc_balance INTO v_wallet_balance
  FROM public.user_profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_wallet_balance < v_privilege.price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient RTC balance (need ' || v_privilege.price || ', have ' || v_wallet_balance || ')');
  END IF;

  -- Debit wallet
  v_new_balance := v_wallet_balance - v_privilege.price;
  UPDATE public.user_profiles
  SET rtc_balance = v_new_balance
  WHERE id = v_user_id;

  -- Log spend_privilege transaction
  INSERT INTO public.rtc_transactions (
    user_id, amount, transaction_type, description, balance_after, created_by
  ) VALUES (
    v_user_id, -v_privilege.price, 'spend_privilege',
    'Purchased privilege: ' || v_privilege.name,
    v_new_balance, v_user_id
  );

  -- Insert grant with expires_at = now() + duration_days
  v_expires_at := now() + (v_privilege.duration_days || ' days')::INTERVAL;

  INSERT INTO public.rtc_student_privileges (
    student_id, privilege_id, price_paid, expires_at
  ) VALUES (
    v_user_id, p_privilege_id, v_privilege.price, v_expires_at
  ) RETURNING id INTO v_grant_id;

  RETURN json_build_object(
    'success', true,
    'grant_id', v_grant_id,
    'new_balance', v_new_balance,
    'expires_at', v_expires_at
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_purchase_privilege(UUID) TO authenticated;

-- ============================================================
-- 1E. rtc_get_store_data() — SECURITY DEFINER RPC
-- Returns wallet_balance, catalog privileges, student's active grants
-- ============================================================
CREATE OR REPLACE FUNCTION public.rtc_get_store_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_wallet_balance INTEGER;
  v_catalog JSON;
  v_grants JSON;
BEGIN
  -- Resolve user from auth.uid()
  SELECT id INTO v_user_id
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Get wallet balance
  SELECT rtc_balance INTO v_wallet_balance
  FROM public.user_profiles
  WHERE id = v_user_id;

  -- Lazy expiry: mark expired grants as inactive
  UPDATE public.rtc_student_privileges
  SET is_active = false
  WHERE student_id = v_user_id
    AND is_active = true
    AND expires_at <= now();

  -- Get all active catalog privileges
  SELECT COALESCE(json_agg(p ORDER BY p.sort_order, p.name), '[]'::json) INTO v_catalog
  FROM (
    SELECT id, name, description, price, duration_days, icon, sort_order
    FROM public.rtc_privileges
    WHERE is_active = true
    ORDER BY sort_order, name
  ) p;

  -- Get student's active grants with joined privilege info
  SELECT COALESCE(json_agg(g ORDER BY g.expires_at), '[]'::json) INTO v_grants
  FROM (
    SELECT sp.id, sp.privilege_id, sp.purchased_at, sp.expires_at, sp.price_paid, sp.is_active,
           rp.name, rp.icon, rp.description
    FROM public.rtc_student_privileges sp
    JOIN public.rtc_privileges rp ON rp.id = sp.privilege_id
    WHERE sp.student_id = v_user_id
      AND sp.is_active = true
    ORDER BY sp.expires_at
  ) g;

  RETURN json_build_object(
    'success', true,
    'wallet_balance', v_wallet_balance,
    'catalog', v_catalog,
    'grants', v_grants
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_get_store_data() TO authenticated;
