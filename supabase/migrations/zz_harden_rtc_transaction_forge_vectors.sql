-- ============================================================
-- HARDEN process_rtc_transaction — close the remaining forge vectors
--
-- Closes:
--  1. earn_arcade accepted ANY positive amount with no cap. A student
--     could call process_rtc_transaction('earn_arcade', 999999) and
--     mint RTC. Legit arcade awards are 5/10/15 (ArcadeManager.js).
--  2. spend_cosmetic / spend_reward accepted positive amounts. Because
--     the body does v_new := v_current + p_amount, a positive-amount
--     spend CREDITS the caller instead of debiting. Another mint path.
--  3. earn_* accepted negative amounts, which corrupts ledger signs.
--  4. Caller role was looked up via WHERE id = auth.uid(), which is
--     the stale pattern fixed for user_profiles in fix_user_profiles_rls_lockout.
--     Silently returns NULL for users with split id/auth_user_id, so
--     legitimate teachers/admins on older accounts hit "unauthorized".
--  5. spend_reward rejected teacher/admin-on-behalf calls because the
--     own-account check didn't allow trusted callers. process_irl_purchase
--     has been broken since the Apr 10 tightening because of this.
--
-- Also rewrites four stale RLS policies on rtc_transactions that still
-- used the `up.id = auth.uid()` pattern. Same shape as the user_profiles
-- rewrite from fb64b5d — switched to get_my_user_type() which resolves
-- via auth_user_id internally.
--
-- New behavior:
--  - earn_* requires p_amount > 0
--  - spend_* requires p_amount < 0
--  - earn_arcade capped at 20 RTC per call (legit max is 15)
--  - earn_arcade rate limit: max 100 RTC per 5-minute rolling window per
--    user (teachers/admins awarding on-behalf are exempt)
--  - spend_cosmetic / spend_reward / earn_arcade allow p_user_id != caller
--    only when caller is teacher/admin (enables process_irl_purchase)
--  - "own account" check accepts either v_caller_profile_id or auth.uid()
--    so split-id users aren't wrongly rejected
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
  v_caller_type TEXT;
  v_actual_created_by UUID;
  v_caller_profile_id UUID;
  v_recent_arcade INTEGER;
  v_is_self BOOLEAN;
BEGIN
  -- Validate transaction type. Bank/privilege types go through their
  -- own dedicated RPCs and are intentionally excluded here.
  IF p_transaction_type NOT IN (
    'earn_manual', 'earn_skill', 'earn_assignment', 'earn_arcade',
    'spend_cosmetic', 'spend_reward', 'admin_adjustment'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid transaction type');
  END IF;

  -- === SIGN AND AMOUNT-CAP CHECKS ===

  IF p_transaction_type LIKE 'earn\_%' ESCAPE '\' AND p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Earn transactions require a positive amount');
  END IF;

  IF p_transaction_type LIKE 'spend\_%' ESCAPE '\' AND p_amount >= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Spend transactions require a negative amount');
  END IF;

  -- Per-call cap on earn_arcade. Legit max reward is 15 (ranked win).
  IF p_transaction_type = 'earn_arcade' AND p_amount > 20 THEN
    RETURN json_build_object('success', false, 'error', 'earn_arcade amount exceeds per-call cap');
  END IF;

  -- === RESOLVE CALLER ===
  v_actual_created_by := COALESCE(auth.uid(), p_created_by);
  v_caller_type := public.get_my_user_type();

  SELECT id INTO v_caller_profile_id
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  -- "Is p_user_id the caller themselves?" — accept either their profile id
  -- or their auth.uid() to tolerate split-id accounts.
  v_is_self := (p_user_id = v_caller_profile_id OR p_user_id = auth.uid());

  -- === AUTHORIZATION ===

  IF p_transaction_type = 'admin_adjustment' THEN
    IF v_caller_type IS DISTINCT FROM 'admin' THEN
      RETURN json_build_object('success', false, 'error', 'Only admins can make admin adjustments');
    END IF;

  ELSIF p_transaction_type = 'earn_manual' THEN
    IF v_caller_type NOT IN ('teacher', 'admin') THEN
      RETURN json_build_object('success', false, 'error', 'Only teachers/admins can award manual RTC');
    END IF;

  ELSIF p_transaction_type IN ('earn_skill', 'earn_assignment') THEN
    -- Only the skill/assignment triggers or teacher/admin may grant these.
    IF pg_trigger_depth() = 0
       AND (v_caller_type IS NULL OR v_caller_type NOT IN ('teacher', 'admin')) THEN
      RETURN json_build_object('success', false, 'error', 'Skill/assignment rewards are system-granted only');
    END IF;

  ELSIF p_transaction_type IN ('earn_arcade', 'spend_cosmetic', 'spend_reward') THEN
    -- Own-account by default, OR teacher/admin acting on a student.
    IF NOT v_is_self AND v_caller_type NOT IN ('teacher', 'admin') THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Arcade/spend transactions must be for your own account'
      );
    END IF;
  END IF;

  -- === RATE LIMIT: earn_arcade (self only) ===
  -- Prevents a console forger from spamming the 20-RTC-per-call mint.
  -- Teachers/admins granting arcade RTC on behalf of a student are
  -- exempt because they've already passed the role check above.
  IF p_transaction_type = 'earn_arcade'
     AND v_caller_type NOT IN ('teacher', 'admin') THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_recent_arcade
    FROM public.rtc_transactions
    WHERE user_id = p_user_id
      AND transaction_type = 'earn_arcade'
      AND created_at > now() - interval '5 minutes';

    IF v_recent_arcade + p_amount > 100 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Arcade earnings are rate-limited (100 RTC per 5 minutes)'
      );
    END IF;
  END IF;

  -- === DUPLICATE-REWARD PROTECTION ===
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

  -- === APPLY THE TRANSACTION ===
  SELECT rtc_balance INTO v_current_balance
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  v_new_balance := v_current_balance + p_amount;

  IF v_new_balance < 0 AND p_transaction_type != 'admin_adjustment' THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  IF v_new_balance < 0 THEN
    v_new_balance := 0;
  END IF;

  UPDATE public.user_profiles
  SET rtc_balance = v_new_balance
  WHERE id = p_user_id;

  INSERT INTO public.rtc_transactions (
    user_id, amount, transaction_type, description,
    reference_id, reference_type, balance_after, created_by
  ) VALUES (
    p_user_id, p_amount, p_transaction_type, p_description,
    p_reference_id, p_reference_type, v_new_balance, v_actual_created_by
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
-- Rewrite the four stale RLS policies on rtc_transactions.
-- All of these previously used `up.id = auth.uid()` which silently
-- fails for users whose user_profiles.id ≠ auth_user_id.
-- ============================================================

DROP POLICY IF EXISTS "Admins have full access to transactions" ON public.rtc_transactions;
CREATE POLICY "Admins have full access to transactions"
  ON public.rtc_transactions
  FOR ALL TO authenticated
  USING (public.get_my_user_type() = 'admin')
  WITH CHECK (public.get_my_user_type() = 'admin');

DROP POLICY IF EXISTS "Parents can view their childrens transactions" ON public.rtc_transactions;
CREATE POLICY "Parents can view their childrens transactions"
  ON public.rtc_transactions
  FOR SELECT TO authenticated
  USING (
    public.get_my_user_type() = 'parent'
    AND EXISTS (
      SELECT 1 FROM public.parent_child_links pcl
      WHERE pcl.parent_id = auth.uid()
        AND pcl.child_id = rtc_transactions.user_id
    )
  );

DROP POLICY IF EXISTS "Teachers can insert transactions for their students" ON public.rtc_transactions;
CREATE POLICY "Teachers can insert transactions for their students"
  ON public.rtc_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_user_type() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON ce.class_id = c.id
      WHERE ce.student_id = rtc_transactions.user_id
        AND ce.status = 'active'
        AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Teachers can view their students transactions" ON public.rtc_transactions;
CREATE POLICY "Teachers can view their students transactions"
  ON public.rtc_transactions
  FOR SELECT TO authenticated
  USING (
    public.get_my_user_type() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON ce.class_id = c.id
      WHERE ce.student_id = rtc_transactions.user_id
        AND ce.status = 'active'
        AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    )
  );
