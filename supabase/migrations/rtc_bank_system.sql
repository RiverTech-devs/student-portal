-- ============================================================
-- RTC Bank System
-- Adds savings bank with compound interest, deposits, withdrawals, and tax
-- ============================================================

-- 1A. Expand transaction type CHECK constraint to include bank types
ALTER TABLE rtc_transactions DROP CONSTRAINT IF EXISTS rtc_transactions_transaction_type_check;
ALTER TABLE rtc_transactions ADD CONSTRAINT rtc_transactions_transaction_type_check
  CHECK (transaction_type IN (
    'earn_manual', 'earn_skill', 'earn_assignment', 'earn_arcade',
    'spend_cosmetic', 'spend_reward', 'admin_adjustment',
    'bank_deposit', 'bank_withdraw', 'bank_interest', 'bank_tax'
  ));

-- Update process_rtc_transaction to accept the 4 new bank types
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
    'bank_deposit', 'bank_withdraw', 'bank_interest', 'bank_tax'
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

-- 1B. Add bank_interest_rate to school_settings
INSERT INTO school_settings (key, value) VALUES ('bank_interest_rate', '10') ON CONFLICT (key) DO NOTHING;

-- 1C. Create rtc_bank_accounts table
CREATE TABLE IF NOT EXISTS rtc_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  last_interest_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rtc_bank_accounts_user_id ON rtc_bank_accounts(user_id);

ALTER TABLE rtc_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Students can view their own bank account
DROP POLICY IF EXISTS "Students can view own bank account" ON rtc_bank_accounts;
CREATE POLICY "Students can view own bank account" ON rtc_bank_accounts
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
    )
  );

-- Admins have full access
DROP POLICY IF EXISTS "Admins full access to bank accounts" ON rtc_bank_accounts;
CREATE POLICY "Admins full access to bank accounts" ON rtc_bank_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE auth_user_id = auth.uid() AND user_type = 'admin'
    )
  );

GRANT SELECT ON rtc_bank_accounts TO authenticated;
GRANT ALL ON rtc_bank_accounts TO service_role;

-- ============================================================
-- 1D. rtc_bank_deposit(p_amount INTEGER) — SECURITY DEFINER RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.rtc_bank_deposit(p_amount INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_wallet_balance INTEGER;
  v_bank_balance INTEGER;
  v_new_wallet INTEGER;
  v_new_bank INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Resolve user from auth.uid()
  SELECT id INTO v_user_id
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Lock wallet row, check sufficient balance
  SELECT rtc_balance INTO v_wallet_balance
  FROM public.user_profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_wallet_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient wallet balance');
  END IF;

  -- Upsert bank account and lock
  INSERT INTO public.rtc_bank_accounts (user_id, balance)
  VALUES (v_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO v_bank_balance
  FROM public.rtc_bank_accounts
  WHERE user_id = v_user_id
  FOR UPDATE;

  -- Debit wallet
  v_new_wallet := v_wallet_balance - p_amount;
  UPDATE public.user_profiles
  SET rtc_balance = v_new_wallet
  WHERE id = v_user_id;

  -- Credit bank
  v_new_bank := v_bank_balance + p_amount;
  UPDATE public.rtc_bank_accounts
  SET balance = v_new_bank
  WHERE user_id = v_user_id;

  -- Log bank_deposit transaction (negative amount = wallet debit)
  INSERT INTO public.rtc_transactions (
    user_id, amount, transaction_type, description, balance_after, created_by
  ) VALUES (
    v_user_id, -p_amount, 'bank_deposit', 'Deposited ' || p_amount || ' RTC to bank', v_new_wallet, v_user_id
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

GRANT EXECUTE ON FUNCTION public.rtc_bank_deposit(INTEGER) TO authenticated;

-- ============================================================
-- 1E. rtc_bank_withdraw(p_amount INTEGER) — SECURITY DEFINER RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.rtc_bank_withdraw(p_amount INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_wallet_balance INTEGER;
  v_bank_balance INTEGER;
  v_new_wallet INTEGER;
  v_new_bank INTEGER;
  v_interest_rate INTEGER;
  v_tax INTEGER := 0;
  v_total_debit INTEGER;
  v_is_tax_free BOOLEAN;
  v_current_day INTEGER;
  v_days_in_month INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Resolve user from auth.uid()
  SELECT id INTO v_user_id
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Get interest rate
  SELECT value::INTEGER INTO v_interest_rate
  FROM public.school_settings
  WHERE key = 'bank_interest_rate';

  IF v_interest_rate IS NULL THEN
    v_interest_rate := 10;
  END IF;

  -- Determine tax-free window (last 7 days of month)
  v_current_day := EXTRACT(DAY FROM now())::INTEGER;
  v_days_in_month := EXTRACT(DAY FROM (date_trunc('month', now()) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER;
  v_is_tax_free := v_current_day > (v_days_in_month - 7);

  -- Calculate tax
  IF NOT v_is_tax_free THEN
    v_tax := GREATEST(10, FLOOR(p_amount * v_interest_rate / 100.0)::INTEGER);
  END IF;

  v_total_debit := p_amount + v_tax;

  -- Lock bank row, check sufficient balance
  SELECT balance INTO v_bank_balance
  FROM public.rtc_bank_accounts
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_bank_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No bank account found');
  END IF;

  IF v_bank_balance < v_total_debit THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient bank balance (need ' || v_total_debit || ', have ' || v_bank_balance || ')');
  END IF;

  -- Lock wallet row
  SELECT rtc_balance INTO v_wallet_balance
  FROM public.user_profiles
  WHERE id = v_user_id
  FOR UPDATE;

  -- Debit bank
  v_new_bank := v_bank_balance - v_total_debit;
  UPDATE public.rtc_bank_accounts
  SET balance = v_new_bank
  WHERE user_id = v_user_id;

  -- Credit wallet
  v_new_wallet := v_wallet_balance + p_amount;
  UPDATE public.user_profiles
  SET rtc_balance = v_new_wallet
  WHERE id = v_user_id;

  -- Log bank_withdraw transaction (positive amount = wallet credit)
  INSERT INTO public.rtc_transactions (
    user_id, amount, transaction_type, description, balance_after, created_by
  ) VALUES (
    v_user_id, p_amount, 'bank_withdraw', 'Withdrew ' || p_amount || ' RTC from bank', v_new_wallet, v_user_id
  );

  -- Log bank_tax transaction if tax > 0
  IF v_tax > 0 THEN
    INSERT INTO public.rtc_transactions (
      user_id, amount, transaction_type, description, balance_after, created_by
    ) VALUES (
      v_user_id, -v_tax, 'bank_tax', 'Early withdrawal tax on ' || p_amount || ' RTC', v_new_wallet, v_user_id
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'new_wallet_balance', v_new_wallet,
    'new_bank_balance', v_new_bank,
    'tax', v_tax,
    'is_tax_free', v_is_tax_free,
    'total_debited_from_bank', v_total_debit
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_bank_withdraw(INTEGER) TO authenticated;

-- ============================================================
-- 1F. rtc_bank_get_info() — SECURITY DEFINER RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.rtc_bank_get_info()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_wallet_balance INTEGER;
  v_bank_balance INTEGER;
  v_interest_rate INTEGER;
  v_is_tax_free BOOLEAN;
  v_current_day INTEGER;
  v_days_in_month INTEGER;
  v_transactions JSON;
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

  -- Get bank balance (default 0 if no account)
  SELECT COALESCE(balance, 0) INTO v_bank_balance
  FROM public.rtc_bank_accounts
  WHERE user_id = v_user_id;

  IF v_bank_balance IS NULL THEN
    v_bank_balance := 0;
  END IF;

  -- Get interest rate
  SELECT value::INTEGER INTO v_interest_rate
  FROM public.school_settings
  WHERE key = 'bank_interest_rate';

  IF v_interest_rate IS NULL THEN
    v_interest_rate := 10;
  END IF;

  -- Tax-free window calculation
  v_current_day := EXTRACT(DAY FROM now())::INTEGER;
  v_days_in_month := EXTRACT(DAY FROM (date_trunc('month', now()) + INTERVAL '1 month' - INTERVAL '1 day'))::INTEGER;
  v_is_tax_free := v_current_day > (v_days_in_month - 7);

  -- Last 20 bank transactions
  SELECT COALESCE(json_agg(t ORDER BY t.created_at DESC), '[]'::json) INTO v_transactions
  FROM (
    SELECT id, amount, transaction_type, description, balance_after, created_at
    FROM public.rtc_transactions
    WHERE user_id = v_user_id
      AND transaction_type IN ('bank_deposit', 'bank_withdraw', 'bank_interest', 'bank_tax')
    ORDER BY created_at DESC
    LIMIT 20
  ) t;

  RETURN json_build_object(
    'success', true,
    'wallet_balance', v_wallet_balance,
    'bank_balance', v_bank_balance,
    'interest_rate', v_interest_rate,
    'is_tax_free', v_is_tax_free,
    'tax_free_starts_day', v_days_in_month - 6,
    'days_in_month', v_days_in_month,
    'current_day', v_current_day,
    'transactions', v_transactions
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_bank_get_info() TO authenticated;

-- ============================================================
-- 1G. rtc_apply_monthly_interest() — SECURITY DEFINER, service_role only
-- ============================================================
CREATE OR REPLACE FUNCTION public.rtc_apply_monthly_interest()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_interest_rate INTEGER;
  v_account RECORD;
  v_interest INTEGER;
  v_count INTEGER := 0;
  v_month_start TIMESTAMPTZ;
BEGIN
  -- Get interest rate
  SELECT value::INTEGER INTO v_interest_rate
  FROM public.school_settings
  WHERE key = 'bank_interest_rate';

  IF v_interest_rate IS NULL OR v_interest_rate <= 0 THEN
    RETURN json_build_object('success', true, 'message', 'No interest rate set or rate is 0', 'accounts_credited', 0);
  END IF;

  v_month_start := date_trunc('month', now());

  -- Loop all bank accounts with positive balance that haven't received interest this month
  FOR v_account IN
    SELECT ba.id, ba.user_id, ba.balance
    FROM public.rtc_bank_accounts ba
    WHERE ba.balance > 0
      AND (ba.last_interest_at IS NULL OR ba.last_interest_at < v_month_start)
    FOR UPDATE
  LOOP
    v_interest := FLOOR(v_account.balance * v_interest_rate / 100.0)::INTEGER;

    IF v_interest > 0 THEN
      -- Credit interest to bank balance
      UPDATE public.rtc_bank_accounts
      SET balance = balance + v_interest,
          last_interest_at = now()
      WHERE id = v_account.id;

      -- Log bank_interest transaction
      INSERT INTO public.rtc_transactions (
        user_id, amount, transaction_type, description, balance_after, created_by
      ) VALUES (
        v_account.user_id, v_interest, 'bank_interest',
        'Monthly interest: ' || v_interest_rate || '% on ' || v_account.balance || ' RTC',
        (SELECT rtc_balance FROM public.user_profiles WHERE id = v_account.user_id),
        v_account.user_id
      );

      v_count := v_count + 1;
    ELSE
      -- Still mark as processed even if interest rounds to 0
      UPDATE public.rtc_bank_accounts
      SET last_interest_at = now()
      WHERE id = v_account.id;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'accounts_credited', v_count,
    'interest_rate', v_interest_rate
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_apply_monthly_interest() TO service_role;

-- ============================================================
-- 1H. pg_cron job — run on 1st of each month at 00:05
-- ============================================================
-- Note: pg_cron must be enabled in your Supabase project
SELECT cron.schedule('rtc-monthly-interest', '5 0 1 * *', $$SELECT public.rtc_apply_monthly_interest()$$);

-- ============================================================
-- 1I. admin_trigger_bank_interest() — admin-only manual trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_trigger_bank_interest()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_result JSON;
BEGIN
  -- Check if caller is admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE auth_user_id = auth.uid() AND user_type = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  -- Reset last_interest_at for all accounts so interest can be applied again
  UPDATE public.rtc_bank_accounts
  SET last_interest_at = NULL;

  -- Apply interest
  SELECT public.rtc_apply_monthly_interest() INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_trigger_bank_interest() TO authenticated;
