-- ============================================================
-- FIX: protect_user_profile_columns must bypass SECURITY DEFINER RPCs
--
-- BUG (money-duplication exploit):
-- The BEFORE UPDATE trigger reverts rtc_balance/user_type/etc. for
-- any caller whose auth.uid() maps to a student. The original design
-- assumed that SECURITY DEFINER RPCs like rtc_bank_deposit would
-- bypass the trigger because they "run as the function owner" — but
-- that's incorrect. SECURITY DEFINER swaps the DB role (current_user)
-- to the function owner, but auth.uid() is PostgREST HTTP auth and
-- is PRESERVED through the RPC. So get_my_user_type() still returns
-- 'student', the trigger fires, and silently reverts the wallet debit
-- that rtc_bank_deposit is trying to make.
--
-- REPRO:
-- Student calls rtc_bank_deposit(10). Function locks wallet (100),
-- runs UPDATE user_profiles SET rtc_balance = 90. Trigger sees caller
-- is student, reverts NEW.rtc_balance to 100. Function then credits
-- bank (+10) and writes a bank_deposit row. Result: free 10 RTC in
-- the bank with the wallet untouched. Spam the button to scale.
--
-- FIX:
-- PostgREST calls come in as one of two DB roles: 'authenticated' or
-- 'anon'. Inside a SECURITY DEFINER function, current_user switches
-- to the function owner (postgres / supabase_admin / etc.), which is
-- never 'authenticated' or 'anon'. Use that to detect trusted context
-- and skip the revert in the trigger.
--
-- NAMING: prefixed zz_ so it sorts alphabetically AFTER
-- secure_user_profiles_rls.sql and fix_user_profiles_rls_lockout.sql
-- and wins on a fresh migration apply.
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_user_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_type TEXT;
BEGIN
  -- Inside a SECURITY DEFINER RPC (rtc_bank_deposit, rtc_bank_withdraw,
  -- process_rtc_transaction, admin_set_rtc_balance, etc.), current_user
  -- is the function owner — never 'authenticated' or 'anon'. Trust
  -- those callers and allow the change.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- Direct client UPDATE path (from PostgREST). Look up the caller
  -- via the SECURITY DEFINER helper to avoid RLS recursion.
  v_caller_type := public.get_my_user_type();

  -- Admins and teachers may change any column directly.
  IF v_caller_type IN ('admin', 'teacher') THEN
    RETURN NEW;
  END IF;

  -- Students and parents: revert any attempt to change protected
  -- columns to their prior value. Legitimate changes to these go
  -- through the SECURITY DEFINER RPCs above, which hit the bypass.
  NEW.rtc_balance       := OLD.rtc_balance;
  NEW.user_type         := OLD.user_type;
  NEW.account_status    := OLD.account_status;
  NEW.can_login         := OLD.can_login;
  NEW.enrollment_type   := OLD.enrollment_type;

  RETURN NEW;
END;
$$;

-- Trigger definition is unchanged from the earlier migration; we only
-- replaced the function body. Re-binding here is a no-op if the
-- trigger already points at this function, and a safety net if an
-- older name is still attached.
DROP TRIGGER IF EXISTS trigger_protect_profile_columns ON public.user_profiles;
CREATE TRIGGER trigger_protect_profile_columns
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_profile_columns();
