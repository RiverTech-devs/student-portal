-- ============================================================
-- Add 'inactive' as a third student_status value.
--
-- Terminology after this migration:
--   active   — current student with full grade/class access
--   inactive — still at the school but doesn't have grade/class access
--              (e.g. taking a break, mid-transition, special arrangement).
--              These are the students who need the games PIN sign-in.
--   past     — no longer attends the school. Data is preserved for
--              historical records; no auto-PIN is generated for them.
--
-- Inactive students get their games PIN auto-generated at the moment we
-- flag them inactive — they need it by definition, and they routinely
-- forget it.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Widen the CHECK constraint on student_status
-- ------------------------------------------------------------
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_student_status_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_student_status_check
  CHECK (student_status IN ('active', 'inactive', 'past'));

-- ------------------------------------------------------------
-- 2. Revert mark_student_as_past to "just mark them past".
--    Past = left the school. No auto-PIN.
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
BEGIN
  UPDATE public.user_profiles
  SET student_status = 'past',
      left_date = p_left_date,
      left_reason = p_left_reason
  WHERE id = p_student_id AND user_type = 'student';

  -- Archive active enrollments to preserve grade history but stop the
  -- student from appearing in rosters.
  UPDATE public.class_enrollments
  SET status = 'archived'
  WHERE student_id = p_student_id AND status = 'active';

  -- We do NOT clear the games PIN here — if the student already had
  -- one (e.g. they went from inactive → past), leave it intact so
  -- they can still access their games archive if they ever want to.
  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_student_as_past(UUID, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_student_as_past(UUID, DATE, TEXT) TO service_role;

-- ------------------------------------------------------------
-- 3. mark_student_as_inactive(p_student_id, p_reason)
--    Sets status = 'inactive' and auto-generates a games PIN if the
--    student doesn't already have one. Enrollments are left alone —
--    grade/class access is enforced separately (UI + future RLS).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_student_as_inactive(
  p_student_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_type TEXT;
  v_existing_status TEXT;
  v_existing_pin TEXT;
  v_pin TEXT;
BEGIN
  SELECT user_type INTO v_caller_type
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_caller_type NOT IN ('admin', 'teacher') THEN
    RETURN json_build_object('success', false, 'error', 'Admin or teacher access required');
  END IF;

  SELECT student_status, games_pin INTO v_existing_status, v_existing_pin
  FROM public.user_profiles
  WHERE id = p_student_id AND user_type = 'student';

  IF v_existing_status IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Student not found');
  END IF;

  UPDATE public.user_profiles
  SET student_status = 'inactive',
      left_reason = COALESCE(NULLIF(trim(p_reason), ''), left_reason)
  WHERE id = p_student_id;

  -- Auto-generate a games PIN if the student doesn't already have one.
  -- This is the whole reason mark_student_as_inactive exists as a
  -- separate verb from mark_student_as_past.
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

GRANT EXECUTE ON FUNCTION public.mark_student_as_inactive(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_student_as_inactive(UUID, TEXT) TO service_role;

-- ------------------------------------------------------------
-- 4. reactivate_student now handles both inactive → active and
--    past → active. Clears left_date and left_reason. Leaves the
--    games PIN alone (in case the student gets flipped inactive
--    again later; admins can regenerate explicitly if needed).
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.reactivate_student(UUID);

CREATE OR REPLACE FUNCTION public.reactivate_student(p_student_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.user_profiles
  SET student_status = 'active',
      left_date = NULL,
      left_reason = NULL
  WHERE id = p_student_id AND user_type = 'student';

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reactivate_student(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_student(UUID) TO service_role;
