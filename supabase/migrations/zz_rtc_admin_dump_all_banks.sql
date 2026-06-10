-- ============================================================
-- Admin Bank Dump RPC: admin_dump_all_banks()
-- Moves every student's full bank balance back into their wallet
-- (tax-free), zeroes the bank accounts, and logs each move as a
-- bank_withdraw transaction. Intended for end-of-year cleanup so no
-- RTC is left stranded in savings.
-- Named zz_* so it sorts AFTER rtc_bank_system.sql (which creates the
-- rtc_bank_accounts table) under the project's alphabetical migration order.
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_dump_all_banks()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_account RECORD;
  v_new_wallet INTEGER;
  v_accounts_dumped INTEGER := 0;
  v_total_moved INTEGER := 0;
BEGIN
  -- Caller must be admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE auth_user_id = auth.uid() AND user_type = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  -- Loop every bank account with a positive balance
  FOR v_account IN
    SELECT ba.id, ba.user_id, ba.balance
    FROM public.rtc_bank_accounts ba
    WHERE ba.balance > 0
    FOR UPDATE
  LOOP
    -- Lock the wallet row, then credit the full bank balance back
    SELECT rtc_balance INTO v_new_wallet
    FROM public.user_profiles
    WHERE id = v_account.user_id
    FOR UPDATE;

    -- Skip orphaned bank accounts whose profile is missing
    IF v_new_wallet IS NULL THEN
      CONTINUE;
    END IF;

    v_new_wallet := v_new_wallet + v_account.balance;

    UPDATE public.user_profiles
    SET rtc_balance = v_new_wallet
    WHERE id = v_account.user_id;

    -- Zero out the bank account
    UPDATE public.rtc_bank_accounts
    SET balance = 0
    WHERE id = v_account.id;

    -- Log as a (tax-free) bank withdrawal
    INSERT INTO public.rtc_transactions (
      user_id, amount, transaction_type, description, balance_after, created_by
    ) VALUES (
      v_account.user_id, v_account.balance, 'bank_withdraw',
      'Admin bank dump: returned ' || v_account.balance || ' RTC from bank to wallet (tax-free)',
      v_new_wallet, auth.uid()
    );

    v_accounts_dumped := v_accounts_dumped + 1;
    v_total_moved := v_total_moved + v_account.balance;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'accounts_dumped', v_accounts_dumped,
    'total_moved', v_total_moved
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_dump_all_banks() TO authenticated;
