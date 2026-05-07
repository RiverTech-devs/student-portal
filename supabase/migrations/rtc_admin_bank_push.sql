-- ============================================================
-- RTC Admin Bank Push
-- Lets admins and teachers move RTC between a student's wallet and bank
-- on the student's behalf — for students who can't access the system
-- themselves (inactive/past students, or anyone who asks an adult to do
-- it for them). Admin override: no early-withdrawal tax is applied.
-- ============================================================

-- ------------------------------------------------------------
-- admin_bank_deposit_for_student(p_user_id, p_amount, p_note)
--   Move p_amount from the student's wallet to their bank.
--   Caller must be an admin or teacher. Logged with created_by = caller.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_bank_deposit_for_student(
  p_user_id UUID,
  p_amount INTEGER,
  p_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_type TEXT;
  v_target_type TEXT;
  v_wallet_balance INTEGER;
  v_bank_balance INTEGER;
  v_new_wallet INTEGER;
  v_new_bank INTEGER;
  v_description TEXT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Resolve caller and authorize
  SELECT id, user_type INTO v_caller_id, v_caller_type
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Caller not found');
  END IF;

  IF v_caller_type NOT IN ('admin', 'teacher') THEN
    RETURN json_build_object('success', false, 'error', 'Admin or teacher access required');
  END IF;

  -- Target must be a student
  SELECT user_type INTO v_target_type
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_target_type IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Student not found');
  END IF;

  IF v_target_type <> 'student' THEN
    RETURN json_build_object('success', false, 'error', 'Target user is not a student');
  END IF;

  -- Lock wallet, check balance
  SELECT rtc_balance INTO v_wallet_balance
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_wallet_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient wallet balance (need ' || p_amount || ', have ' || COALESCE(v_wallet_balance, 0) || ')'
    );
  END IF;

  -- Upsert + lock bank account
  INSERT INTO public.rtc_bank_accounts (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO v_bank_balance
  FROM public.rtc_bank_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Move money
  v_new_wallet := v_wallet_balance - p_amount;
  v_new_bank := v_bank_balance + p_amount;

  UPDATE public.user_profiles
  SET rtc_balance = v_new_wallet
  WHERE id = p_user_id;

  UPDATE public.rtc_bank_accounts
  SET balance = v_new_bank
  WHERE user_id = p_user_id;

  v_description := 'Deposited ' || p_amount || ' RTC to bank (pushed by '
    || v_caller_type || ')'
    || CASE WHEN p_note IS NOT NULL AND p_note <> '' THEN ': ' || p_note ELSE '' END;

  INSERT INTO public.rtc_transactions (
    user_id, amount, transaction_type, description, balance_after, created_by
  ) VALUES (
    p_user_id, -p_amount, 'bank_deposit', v_description, v_new_wallet, v_caller_id
  );

  RETURN json_build_object(
    'success', true,
    'new_wallet_balance', v_new_wallet,
    'new_bank_balance', v_new_bank
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_bank_deposit_for_student(UUID, INTEGER, TEXT) TO authenticated;

-- ------------------------------------------------------------
-- admin_bank_withdraw_for_student(p_user_id, p_amount, p_note)
--   Move p_amount from the student's bank to their wallet.
--   No tax — admin override is the whole reason this exists.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_bank_withdraw_for_student(
  p_user_id UUID,
  p_amount INTEGER,
  p_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_type TEXT;
  v_target_type TEXT;
  v_wallet_balance INTEGER;
  v_bank_balance INTEGER;
  v_new_wallet INTEGER;
  v_new_bank INTEGER;
  v_description TEXT;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  SELECT id, user_type INTO v_caller_id, v_caller_type
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Caller not found');
  END IF;

  IF v_caller_type NOT IN ('admin', 'teacher') THEN
    RETURN json_build_object('success', false, 'error', 'Admin or teacher access required');
  END IF;

  SELECT user_type INTO v_target_type
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_target_type IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Student not found');
  END IF;

  IF v_target_type <> 'student' THEN
    RETURN json_build_object('success', false, 'error', 'Target user is not a student');
  END IF;

  -- Lock bank, check balance
  SELECT balance INTO v_bank_balance
  FROM public.rtc_bank_accounts
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_bank_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Student has no bank account yet');
  END IF;

  IF v_bank_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient bank balance (need ' || p_amount || ', have ' || v_bank_balance || ')'
    );
  END IF;

  SELECT rtc_balance INTO v_wallet_balance
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  v_new_bank := v_bank_balance - p_amount;
  v_new_wallet := v_wallet_balance + p_amount;

  UPDATE public.rtc_bank_accounts
  SET balance = v_new_bank
  WHERE user_id = p_user_id;

  UPDATE public.user_profiles
  SET rtc_balance = v_new_wallet
  WHERE id = p_user_id;

  v_description := 'Withdrew ' || p_amount || ' RTC from bank (pushed by '
    || v_caller_type || ', no tax)'
    || CASE WHEN p_note IS NOT NULL AND p_note <> '' THEN ': ' || p_note ELSE '' END;

  INSERT INTO public.rtc_transactions (
    user_id, amount, transaction_type, description, balance_after, created_by
  ) VALUES (
    p_user_id, p_amount, 'bank_withdraw', v_description, v_new_wallet, v_caller_id
  );

  RETURN json_build_object(
    'success', true,
    'new_wallet_balance', v_new_wallet,
    'new_bank_balance', v_new_bank
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_bank_withdraw_for_student(UUID, INTEGER, TEXT) TO authenticated;

-- ------------------------------------------------------------
-- admin_bank_list_students()
--   Returns all students (active + past) with wallet and bank balances,
--   for the staff bank-helper UI. Caller must be admin or teacher.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_bank_list_students()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_type TEXT;
  v_rows JSON;
BEGIN
  SELECT user_type INTO v_caller_type
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_caller_type NOT IN ('admin', 'teacher') THEN
    RETURN json_build_object('success', false, 'error', 'Admin or teacher access required');
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.last_name, t.first_name), '[]'::json) INTO v_rows
  FROM (
    SELECT
      up.id,
      up.first_name,
      up.last_name,
      up.grade_level,
      COALESCE(up.student_status, 'active') AS student_status,
      COALESCE(up.rtc_balance, 0) AS wallet_balance,
      COALESCE(ba.balance, 0) AS bank_balance
    FROM public.user_profiles up
    LEFT JOIN public.rtc_bank_accounts ba ON ba.user_id = up.id
    WHERE up.user_type = 'student'
  ) t;

  RETURN json_build_object('success', true, 'students', v_rows);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_bank_list_students() TO authenticated;
