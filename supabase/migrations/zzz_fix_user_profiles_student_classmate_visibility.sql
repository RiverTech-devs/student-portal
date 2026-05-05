-- ============================================================
-- Restore student visibility into classmates' and teachers' names.
--
-- zz_fix_user_profiles_drop_recursive_legacy_policies.sql dropped:
--   * "Allow lookup of student profiles for linking"
--   * "Anyone can view teacher and admin profiles"
-- which were the only SELECT policies that let a student read any
-- profile other than their own. The remaining helper-based set
-- only grants SELECT to admins, teachers, parents-of-children,
-- and self.
--
-- Symptom: discussion boards (and any other class-scoped UI that
-- joins user_profiles for display names) render every author as
-- "Unknown User" when viewed by a student. The discussion query
-- in portal/index.html selects author profiles via
-- `from('user_profiles').in('id', authorIds)` — RLS filters out
-- every row that isn't the calling student's own.
--
-- Fix: add a narrowly-scoped SELECT policy that lets any
-- authenticated user read profiles of users they share an active
-- class with (classmates + the teacher / secondary teacher of
-- those classes). Wrapped in a SECURITY DEFINER helper with
-- row_security = off so the inner joins on class_enrollments /
-- classes never re-trigger user_profiles RLS (the same recursion
-- pattern the prior zz_fix_user_profiles_* migrations defended
-- against).
--
-- This is strictly narrower than the dropped public-role policies:
-- before, every authenticated user could enumerate every student
-- and every teacher/admin profile. Now, a user can only read the
-- profile of someone they actually share a class with.
-- ============================================================

-- 1. SECURITY DEFINER helper: do I share an active class with target_profile_id?
--    classes.teacher_id / secondary_teacher_id are stored in the split-id
--    pattern (sometimes auth.uid, sometimes user_profiles.id) — match both.
CREATE OR REPLACE FUNCTION public.user_shares_class_with(target_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
SET row_security = off
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_pid UUID := public.get_my_profile_id();
  v_match BOOLEAN;
BEGIN
  IF v_uid IS NULL OR target_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Self always allowed (covered by existing self-policy too, but harmless).
  IF target_profile_id = v_pid OR target_profile_id = v_uid THEN
    RETURN TRUE;
  END IF;

  -- Classmate: target is enrolled in any class I'm enrolled in.
  SELECT EXISTS (
    SELECT 1
    FROM public.class_enrollments my_e
    JOIN public.class_enrollments their_e ON my_e.class_id = their_e.class_id
    WHERE my_e.student_id IN (v_pid, v_uid)
      AND their_e.student_id = target_profile_id
      AND my_e.status = 'active'
      AND their_e.status = 'active'
  ) INTO v_match;
  IF COALESCE(v_match, FALSE) THEN RETURN TRUE; END IF;

  -- Teacher (or secondary teacher) of one of my classes.
  SELECT EXISTS (
    SELECT 1
    FROM public.class_enrollments my_e
    JOIN public.classes c ON c.id = my_e.class_id
    JOIN public.user_profiles up ON up.id = target_profile_id
    WHERE my_e.student_id IN (v_pid, v_uid)
      AND my_e.status = 'active'
      AND (
        c.teacher_id           = up.id
        OR c.teacher_id           = up.auth_user_id
        OR c.secondary_teacher_id = up.id
        OR c.secondary_teacher_id = up.auth_user_id
      )
  ) INTO v_match;
  IF COALESCE(v_match, FALSE) THEN RETURN TRUE; END IF;

  -- Reverse direction: I'm a teacher and target is one of my students.
  -- (Already covered by the existing "Teachers can view profiles" policy,
  --  but kept here so the helper is symmetric and reusable elsewhere.)
  SELECT EXISTS (
    SELECT 1
    FROM public.classes c
    JOIN public.class_enrollments ce ON ce.class_id = c.id
    WHERE ce.student_id = target_profile_id
      AND ce.status = 'active'
      AND (
        c.teacher_id           = v_uid
        OR c.teacher_id           = v_pid
        OR c.secondary_teacher_id = v_uid
        OR c.secondary_teacher_id = v_pid
      )
  ) INTO v_match;
  RETURN COALESCE(v_match, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_shares_class_with(UUID) TO authenticated, anon;

-- 2. SELECT policy. Permissive policies OR with the existing helper-based
--    set, so admins / teachers / parents / self keep their broader access.
DROP POLICY IF EXISTS "Users can view shared class members" ON public.user_profiles;
CREATE POLICY "Users can view shared class members" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (public.user_shares_class_with(id));
