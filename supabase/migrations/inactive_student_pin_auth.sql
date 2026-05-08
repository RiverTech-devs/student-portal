-- ============================================================
-- Inactive Student PIN Auth
-- A 4-char PIN that staff can set on a student so the student can
-- sign in without remembering their email/password. Used primarily
-- for inactive (student_status = 'past') students who still need to
-- access games + skill tree + RTC, but don't have grade/class access.
--
-- The PIN is the front-door secret only. The actual session is a
-- normal Supabase auth session minted by the pin-login edge function
-- (which calls auth.admin.generateLink and returns the OTP). RLS
-- continues to govern what the session can see.
-- ============================================================

-- ------------------------------------------------------------
-- Columns on user_profiles
-- ------------------------------------------------------------
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS games_pin TEXT,
  ADD COLUMN IF NOT EXISTS games_pin_set_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS games_pin_set_at TIMESTAMPTZ;

-- Enforce 4-char alphanumeric uppercase format. NULL = no PIN set.
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_games_pin_format;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_games_pin_format
  CHECK (games_pin IS NULL OR games_pin ~ '^[A-Z0-9]{4}$');

-- Lookups during PIN login go through the (first_name, last_name, games_pin) tuple.
-- The partial index keeps it lean: only rows that actually have a PIN.
CREATE INDEX IF NOT EXISTS idx_user_profiles_games_pin_lookup
  ON public.user_profiles (lower(first_name), lower(last_name), games_pin)
  WHERE games_pin IS NOT NULL;

-- ------------------------------------------------------------
-- staff_set_student_pin(p_user_id, p_pin)
--   Set a student's PIN. Pass p_pin = NULL (or empty) to clear it.
--   Caller must be admin or teacher.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.staff_set_student_pin(
  p_user_id UUID,
  p_pin TEXT
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
  v_normalized_pin TEXT;
BEGIN
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

  -- Normalize: trim, uppercase, treat empty string as NULL (clear)
  v_normalized_pin := NULLIF(upper(trim(COALESCE(p_pin, ''))), '');

  IF v_normalized_pin IS NOT NULL AND v_normalized_pin !~ '^[A-Z0-9]{4}$' THEN
    RETURN json_build_object('success', false, 'error', 'PIN must be exactly 4 letters or digits');
  END IF;

  UPDATE public.user_profiles
  SET games_pin = v_normalized_pin,
      games_pin_set_by = v_caller_id,
      games_pin_set_at = CASE WHEN v_normalized_pin IS NULL THEN NULL ELSE now() END
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'pin_set', v_normalized_pin IS NOT NULL,
    'pin', v_normalized_pin
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_set_student_pin(UUID, TEXT) TO authenticated;

-- ------------------------------------------------------------
-- pin_lookup_student(p_first_name, p_last_name, p_pin)
--   Used by the pin-login edge function (via service role) to
--   resolve a name + PIN to a student. Returns the student's
--   user_profiles.id and auth_user_id. service_role only —
--   not exposed to authenticated callers, since direct PIN
--   guessing should go through the edge function (rate limited
--   at the function level).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pin_lookup_student(
  p_first_name TEXT,
  p_last_name TEXT,
  p_pin TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row RECORD;
  v_normalized_pin TEXT;
BEGIN
  IF p_first_name IS NULL OR p_last_name IS NULL OR p_pin IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'first_name, last_name, and pin are required');
  END IF;

  v_normalized_pin := upper(trim(p_pin));

  IF v_normalized_pin !~ '^[A-Z0-9]{4}$' THEN
    RETURN json_build_object('success', false, 'error', 'Invalid PIN format');
  END IF;

  SELECT id, auth_user_id, first_name, last_name
  INTO v_row
  FROM public.user_profiles
  WHERE lower(trim(first_name)) = lower(trim(p_first_name))
    AND lower(trim(last_name)) = lower(trim(p_last_name))
    AND games_pin = v_normalized_pin
    AND user_type = 'student'
  LIMIT 1;

  IF v_row.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No match');
  END IF;

  RETURN json_build_object(
    'success', true,
    'user_id', v_row.id,
    'auth_user_id', v_row.auth_user_id,
    'first_name', v_row.first_name,
    'last_name', v_row.last_name
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.pin_lookup_student(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pin_lookup_student(TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.pin_lookup_student(TEXT, TEXT, TEXT) TO service_role;

-- ------------------------------------------------------------
-- staff_get_student_pin_status(p_user_id)
--   Returns the student's PIN in plain text so staff can see / read it
--   to remind a forgetful student. Admin or teacher only.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.staff_get_student_pin_status(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_type TEXT;
  v_pin TEXT;
  v_set_at TIMESTAMPTZ;
BEGIN
  SELECT user_type INTO v_caller_type
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_caller_type NOT IN ('admin', 'teacher') THEN
    RETURN json_build_object('success', false, 'error', 'Admin or teacher access required');
  END IF;

  SELECT games_pin, games_pin_set_at INTO v_pin, v_set_at
  FROM public.user_profiles
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'has_pin', v_pin IS NOT NULL,
    'pin', v_pin,
    'pin_set_at', v_set_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_get_student_pin_status(UUID) TO authenticated;

-- ------------------------------------------------------------
-- _generate_games_pin()
--   Internal helper: returns a fresh random 4-char PIN drawn from a
--   confusion-resistant alphabet (no 0/O, 1/I, L). Loops until it
--   finds one not already in use, so the (name, PIN) tuple stays
--   meaningful for lookup.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._generate_games_pin()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_alphabet TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_len INTEGER := length(v_alphabet);
  v_pin TEXT;
  v_attempt INTEGER := 0;
BEGIN
  LOOP
    v_pin :=
      substr(v_alphabet, 1 + floor(random() * v_len)::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * v_len)::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * v_len)::int, 1) ||
      substr(v_alphabet, 1 + floor(random() * v_len)::int, 1);

    -- Uniqueness across the whole table is overkill, but cheap and
    -- avoids the corner case where two students with the same name
    -- end up with the same PIN. Bail out after 50 attempts so we
    -- don't loop forever in a pathologically full table.
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE games_pin = v_pin) THEN
      RETURN v_pin;
    END IF;

    v_attempt := v_attempt + 1;
    EXIT WHEN v_attempt >= 50;
  END LOOP;

  RETURN v_pin;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._generate_games_pin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._generate_games_pin() FROM authenticated;
GRANT EXECUTE ON FUNCTION public._generate_games_pin() TO service_role;

-- ------------------------------------------------------------
-- staff_regenerate_student_pin(p_user_id)
--   Lets staff roll a new random PIN for a student (e.g. when the
--   student forgot the old one and the staff member just wants a
--   fresh one to read out). Admin or teacher only.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.staff_regenerate_student_pin(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_type TEXT;
  v_target_type TEXT;
  v_pin TEXT;
BEGIN
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

  IF v_target_type IS NULL OR v_target_type <> 'student' THEN
    RETURN json_build_object('success', false, 'error', 'Student not found');
  END IF;

  v_pin := public._generate_games_pin();

  UPDATE public.user_profiles
  SET games_pin = v_pin,
      games_pin_set_by = v_caller_id,
      games_pin_set_at = now()
  WHERE id = p_user_id;

  RETURN json_build_object('success', true, 'pin', v_pin);
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_regenerate_student_pin(UUID) TO authenticated;

-- ------------------------------------------------------------
-- Patch mark_student_as_past so it auto-generates a games PIN when
-- the student doesn't have one yet. Inactive students need PIN
-- access by definition, and they routinely forget it — having staff
-- remember to set one manually is the wrong default.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.mark_student_as_past(UUID, DATE, TEXT);

CREATE OR REPLACE FUNCTION public.mark_student_as_past(
  p_student_id UUID,
  p_left_date DATE DEFAULT CURRENT_DATE,
  p_left_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing_pin TEXT;
  v_pin TEXT;
BEGIN
  -- Move the student to past status
  UPDATE public.user_profiles
  SET
    student_status = 'past',
    left_date = p_left_date,
    left_reason = p_left_reason
  WHERE id = p_student_id AND user_type = 'student';

  -- Archive active enrollments (preserves grades and history)
  UPDATE public.class_enrollments
  SET status = 'archived'
  WHERE student_id = p_student_id AND status = 'active';

  -- Auto-generate a games PIN if the student doesn't already have one.
  -- Inactive students need PIN access by definition.
  SELECT games_pin INTO v_existing_pin
  FROM public.user_profiles
  WHERE id = p_student_id;

  IF v_existing_pin IS NULL THEN
    v_pin := public._generate_games_pin();
    UPDATE public.user_profiles
    SET games_pin = v_pin,
        games_pin_set_at = now()
    WHERE id = p_student_id;
  ELSE
    v_pin := v_existing_pin;
  END IF;

  RETURN json_build_object('success', true, 'pin', v_pin);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_student_as_past(UUID, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_student_as_past(UUID, DATE, TEXT) TO service_role;

-- ------------------------------------------------------------
-- Refresh admin_bank_list_students to include has_pin / pin_masked
-- so the Bank Helper UI can show PIN status without an extra round
-- trip per student.
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
      COALESCE(ba.balance, 0) AS bank_balance,
      (up.games_pin IS NOT NULL) AS has_pin,
      up.games_pin AS pin
    FROM public.user_profiles up
    LEFT JOIN public.rtc_bank_accounts ba ON ba.user_id = up.id
    WHERE up.user_type = 'student'
  ) t;

  RETURN json_build_object('success', true, 'students', v_rows);
END;
$$;
