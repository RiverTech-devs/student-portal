-- ============================================================
-- CRITICAL FIX v2: protect_user_profile_columns must be SECURITY INVOKER
--
-- v1 (zz_fix_protect_profile_trigger_bypass_for_security_definer.sql)
-- kept the trigger function declared SECURITY DEFINER and tried to detect
-- "am I inside a trusted RPC?" by checking current_user. That check is a
-- no-op: inside a SECURITY DEFINER function body, current_user is ALWAYS
-- the function owner, regardless of how the function was invoked. So v1's
-- check was always true and the trigger became a no-op, re-opening direct
-- student UPDATEs against rtc_balance (Matthew's original attack vector).
--
-- FIX: drop SECURITY DEFINER from the trigger function. SECURITY INVOKER
-- (default) makes current_user reflect the actual caller:
--   - Direct UPDATE from PostgREST:  current_user = 'authenticated' → restrict
--   - UPDATE issued from inside a SECURITY DEFINER RPC (rtc_bank_deposit,
--     process_rtc_transaction, admin_set_rtc_balance, …): that RPC has
--     already swapped current_user to its owner (postgres / supabase_admin)
--     by the time the trigger fires → bypass
--
-- The helper `get_my_user_type()` is itself SECURITY DEFINER, so the RLS
-- recursion the original migration was worried about is still avoided on
-- the restrict path.
-- ============================================================

-- NOTE: NO "SECURITY DEFINER" clause on this function. That is the fix.
CREATE OR REPLACE FUNCTION public.protect_user_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_caller_type TEXT;
BEGIN
  -- If we're not coming in through PostgREST directly, we're being invoked
  -- from inside a SECURITY DEFINER function whose own body is responsible
  -- for authorizing the caller (rtc_bank_deposit, process_rtc_transaction,
  -- admin_set_rtc_balance, etc.). Trust that context.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- Direct PostgREST UPDATE path. Look up the acting user's role via the
  -- SECURITY DEFINER helper so we don't recurse through user_profiles RLS.
  v_caller_type := public.get_my_user_type();

  -- Admins and teachers may change any column directly.
  IF v_caller_type IN ('admin', 'teacher') THEN
    RETURN NEW;
  END IF;

  -- Students and parents: silently revert any attempt to change protected
  -- columns to their prior value. Legitimate changes flow through the
  -- SECURITY DEFINER RPCs above, which hit the bypass branch.
  NEW.rtc_balance       := OLD.rtc_balance;
  NEW.user_type         := OLD.user_type;
  NEW.account_status    := OLD.account_status;
  NEW.can_login         := OLD.can_login;
  NEW.enrollment_type   := OLD.enrollment_type;

  RETURN NEW;
END;
$$;

-- Rebind the trigger so it points at the rewritten function.
DROP TRIGGER IF EXISTS trigger_protect_profile_columns ON public.user_profiles;
CREATE TRIGGER trigger_protect_profile_columns
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_profile_columns();
