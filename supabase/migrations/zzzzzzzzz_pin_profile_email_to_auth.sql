-- ============================================================
-- Pin user_profiles.email to the confirmed Supabase Auth email.
--
-- Context: the Profile page now lets any account holder change the
-- address they sign in with (portal/index.html -> app.changeEmail()).
-- That change goes through Supabase Auth, which only swaps the address
-- after the confirmation links are clicked. The client then mirrors the
-- confirmed value onto user_profiles.email, because that column — not
-- auth.users — is what the rest of the app reads:
--   * send-notification-email picks recipients from it
--   * enrollment_applications RLS matches parent/student email against it
--   * directory + duplicate-account checks compare against it
--
-- Problem this closes: `email` was never in the protected-column list,
-- so a student or parent could already set their profile email to
-- ANY address straight from the browser console:
--   supabase.from('user_profiles')
--           .update({ email: 'someone.else@example.com' })
--           .eq('auth_user_id', myUid)
-- That doesn't move their login (Auth is separate), but it does
-- redirect their notification email and can shadow another family's
-- address in the enrollment RLS lookups.
--
-- Fix: students and parents may still write `email`, but ONLY to the
-- address Supabase Auth currently holds for them. Anything else is
-- silently reverted, exactly like rtc_balance. The legitimate sync
-- (PortalAuth._syncProfileEmail / confirm.html) writes precisely that
-- value, so it passes; a hand-rolled console update does not.
--
-- Admins and teachers are unaffected — they keep editing student
-- profile emails as a record, same as before.
-- ============================================================

-- ------------------------------------------------------------
-- Helper: the caller's CURRENT auth email.
--
-- Reads auth.users rather than the JWT's email claim on purpose. The
-- claim in an already-issued token is stale until the next refresh, so
-- right after a confirmed email change it would still carry the OLD
-- address and this trigger would revert the very sync it's meant to
-- allow. auth.users is the live value.
--
-- SECURITY DEFINER so the invoker-context trigger below can reach
-- auth.users, mirroring how get_my_user_type() is used from the same
-- trigger.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_auth_email()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_auth_email() TO authenticated;

-- ------------------------------------------------------------
-- protect_user_profile_columns, canonical body + the email rule.
--
-- Body copied verbatim from zzz_fix_protect_profile_invoker_canonical.sql
-- as that file instructs. In particular:
--   * NO "SECURITY DEFINER" clause — it must stay SECURITY INVOKER so
--     current_user is the real caller. Marking it DEFINER re-opens the
--     rtc_bank_deposit double-credit exploit.
--   * the current_user NOT IN ('authenticated','anon') bypass stays, so
--     trusted SECURITY DEFINER RPCs still move protected columns.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_user_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_caller_type TEXT;
  v_auth_email  TEXT;
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

  -- email is semi-protected: writable, but only to the address Supabase
  -- Auth actually holds for this caller. That is exactly what the
  -- post-confirmation sync writes. Case-insensitive because Auth
  -- normalises addresses to lower case and the mirror shouldn't fight it.
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    v_auth_email := public.get_my_auth_email();

    IF v_auth_email IS NULL
       OR lower(NEW.email) IS DISTINCT FROM lower(v_auth_email) THEN
      NEW.email := OLD.email;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Re-bind the trigger in case something dropped it between definitions.
DROP TRIGGER IF EXISTS trigger_protect_profile_columns ON public.user_profiles;
CREATE TRIGGER trigger_protect_profile_columns
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_profile_columns();
