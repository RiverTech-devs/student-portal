-- ============================================================
-- CANONICAL fix: protect_user_profile_columns must be SECURITY INVOKER.
--
-- This is the same fix as zz_fix_protect_profile_trigger_invoker_v2.sql.
-- The reason it has to be re-applied here is a migration-ordering bug:
--
--   zz_fix_protect_profile_trigger_invoker_v2.sql   ← lands the fix
--   zz_fix_user_profiles_helper_force_rls.sql       ← reverts to DEFINER
--   zz_fix_user_profiles_rls_recursion.sql          ← reverts to DEFINER
--
-- Files sort alphabetically (no timestamp prefixes), and the two
-- zz_fix_user_profiles_* files come AFTER zz_fix_protect_*, so they
-- each CREATE OR REPLACE the function with SECURITY DEFINER and the
-- broken body (no `current_user NOT IN ('authenticated','anon')`
-- bypass). End result on a fresh deploy: the trigger silently reverts
-- wallet debits done inside SECURITY DEFINER RPCs, which means
-- rtc_bank_deposit credits the bank without actually debiting the
-- wallet — students end up with both balances.
--
-- This file uses a zzz_ prefix so it sorts last and isn't accidentally
-- overridden by any future zz_* file. If anyone touches
-- protect_user_profile_columns in another migration, copy this
-- function body verbatim or the exploit returns.
-- ============================================================

-- NOTE: NO "SECURITY DEFINER" clause on this function. That is the fix.
-- SECURITY INVOKER (default) keeps current_user as the actual caller:
--   - PostgREST direct UPDATE  → current_user = 'authenticated' → restrict
--   - From inside a trusted SECURITY DEFINER RPC                → bypass
CREATE OR REPLACE FUNCTION public.protect_user_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_caller_type TEXT;
BEGIN
  -- Trusted RPC context: rtc_bank_deposit, rtc_bank_withdraw,
  -- process_rtc_transaction, admin_set_rtc_balance, the bank-helper
  -- and PIN RPCs, etc. Inside a SECURITY DEFINER function the role
  -- has already been swapped to the function owner (postgres /
  -- supabase_admin), which is never 'authenticated' or 'anon'.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- Direct PostgREST UPDATE path. SECURITY DEFINER helper so we
  -- don't recurse through user_profiles RLS.
  v_caller_type := public.get_my_user_type();

  -- Admins and teachers may change any column directly.
  IF v_caller_type IN ('admin', 'teacher') THEN
    RETURN NEW;
  END IF;

  -- Students and parents: silently revert any attempt to change
  -- protected columns. Legitimate changes flow through the SECURITY
  -- DEFINER RPCs above, which hit the bypass branch.
  NEW.rtc_balance       := OLD.rtc_balance;
  NEW.user_type         := OLD.user_type;
  NEW.account_status    := OLD.account_status;
  NEW.can_login         := OLD.can_login;
  NEW.enrollment_type   := OLD.enrollment_type;

  RETURN NEW;
END;
$$;

-- Re-bind the trigger in case something dropped it between definitions.
DROP TRIGGER IF EXISTS trigger_protect_profile_columns ON public.user_profiles;
CREATE TRIGGER trigger_protect_profile_columns
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_profile_columns();
