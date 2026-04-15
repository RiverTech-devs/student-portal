-- ============================================================
-- Close the INSERT side of the user_type / rtc_balance self-promotion hole
--
-- The v2 UPDATE trigger (protect_user_profile_columns) reverts attempts
-- to change user_type / rtc_balance / account_status / can_login /
-- enrollment_type on direct UPDATEs. But there was no corresponding
-- INSERT guard:
--
--   - RLS policy "Users can create own profile" only requires
--     id = auth.uid(); it doesn't constrain user_type.
--   - create_signup_profile RPC does constrain it, but it's not the only
--     way into user_profiles — a client can just call .insert() directly
--     with whatever user_type they want.
--   - Net effect: a brand-new authenticated user (no profile yet) could
--     land as 'admin' from their first insert, trivially promoting
--     themselves before any app code runs.
--
-- This trigger mirrors the v2 UPDATE-side approach:
--   - SECURITY INVOKER so current_user reflects the real caller.
--   - If current_user is the owner of a SECURITY DEFINER RPC
--     (create_signup_profile, create_enrollment_profile, …), trust the
--     RPC to have done its own checks.
--   - Otherwise, the caller is coming in via PostgREST as
--     'authenticated' / 'anon'. Enforce:
--       * user_type must be 'student' or 'parent'
--       * rtc_balance must be NULL or 0  (force to 0)
--       * account_status can still be set by the client for signup UX,
--         but we leave that alone for now — account flow uses it.
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_user_profile_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
-- NOT SECURITY DEFINER. We need current_user to reflect the actual caller.
SET search_path = ''
AS $$
BEGIN
  -- SECURITY DEFINER RPC callers (their current_user is the function owner,
  -- never 'authenticated' / 'anon'). Trust them.
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- Direct PostgREST INSERT. Only 'student' and 'parent' may self-register.
  -- Admins and teachers are created via create_enrollment_profile or by an
  -- existing admin, both of which bypass this branch via the owner check.
  IF NEW.user_type IS DISTINCT FROM 'student' AND NEW.user_type IS DISTINCT FROM 'parent' THEN
    RAISE EXCEPTION 'Only student and parent profiles may be self-created (got: %)', NEW.user_type;
  END IF;

  -- Force rtc_balance to 0 on direct INSERT. A future attacker setting
  -- NEW.rtc_balance = 999999 on creation would otherwise bypass the
  -- UPDATE trigger entirely.
  IF NEW.rtc_balance IS DISTINCT FROM 0 THEN
    NEW.rtc_balance := 0;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_validate_user_profile_insert ON public.user_profiles;
CREATE TRIGGER trigger_validate_user_profile_insert
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_profile_insert();
