-- ============================================================
-- Auto-PIN for unclaimed inactive students.
--
-- Context: in this codebase, account_status = 'inactive' means a
-- pre-created student profile that hasn't been claimed yet. Teachers
-- still grade these profiles. The "claim" happens later when the
-- student goes through the Activate Account flow with their username
-- + email + password.
--
-- We now want a half-claim path: the student uses a 4-char PIN to
-- sign in to a games-only session (Games + Skills + RTC) without
-- having to do the email/password activation. The PIN should always
-- exist for inactive students so staff can read it out from the
-- account info — students forget often, so making staff remember to
-- set one manually is the wrong default.
--
-- This migration:
--   1. Adds a BEFORE INSERT trigger that fills games_pin whenever a
--      new inactive student is created.
--   2. Backfills games_pin for any existing inactive students who
--      don't already have one.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Trigger function
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._auto_pin_for_inactive_student()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only act on student profiles being inserted as inactive
  -- without an explicit PIN. Staff can still pre-set one via the
  -- INSERT payload if they want a specific value.
  IF NEW.user_type = 'student'
     AND NEW.account_status = 'inactive'
     AND NEW.games_pin IS NULL THEN
    NEW.games_pin := public._generate_games_pin();
    NEW.games_pin_set_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_pin_for_inactive_student ON public.user_profiles;

CREATE TRIGGER trg_auto_pin_for_inactive_student
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public._auto_pin_for_inactive_student();

-- ------------------------------------------------------------
-- 2. Backfill existing inactive students
-- ------------------------------------------------------------
-- Loop one row at a time so each PIN goes through _generate_games_pin
-- (which checks for collisions against the rest of the table).
DO $$
DECLARE
  v_row RECORD;
  v_pin TEXT;
BEGIN
  FOR v_row IN
    SELECT id
    FROM public.user_profiles
    WHERE user_type = 'student'
      AND account_status = 'inactive'
      AND games_pin IS NULL
  LOOP
    v_pin := public._generate_games_pin();
    UPDATE public.user_profiles
    SET games_pin = v_pin,
        games_pin_set_at = now()
    WHERE id = v_row.id;
  END LOOP;
END
$$;

-- ------------------------------------------------------------
-- 3. pin_attach_auth_user(p_profile_id, p_auth_user_id, p_email)
--    Called by the pin-login edge function (via service role) when
--    a PIN-claiming student doesn't yet have an auth.users row. The
--    edge function creates the auth user first, then asks us to link
--    it to the profile. account_status stays 'inactive' and
--    can_login stays false — the regular email/password Activate
--    Account flow keeps working as a future upgrade path.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pin_attach_auth_user(
  p_profile_id UUID,
  p_auth_user_id UUID,
  p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing_auth UUID;
BEGIN
  SELECT auth_user_id INTO v_existing_auth
  FROM public.user_profiles
  WHERE id = p_profile_id;

  -- Race-safe: if another concurrent sign-in already attached an auth
  -- user, just report success with the existing one — the OTP path
  -- works against either.
  IF v_existing_auth IS NOT NULL THEN
    RETURN json_build_object('success', true, 'auth_user_id', v_existing_auth, 'already_attached', true);
  END IF;

  UPDATE public.user_profiles
  SET auth_user_id = p_auth_user_id,
      email = COALESCE(email, p_email)
  WHERE id = p_profile_id;

  RETURN json_build_object('success', true, 'auth_user_id', p_auth_user_id, 'already_attached', false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.pin_attach_auth_user(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pin_attach_auth_user(UUID, UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.pin_attach_auth_user(UUID, UUID, TEXT) TO service_role;
