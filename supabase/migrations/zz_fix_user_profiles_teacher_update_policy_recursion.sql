-- ============================================================
-- Stop user_profiles UPDATE recursion via the Teachers policy.
--
-- The Teachers UPDATE policy on user_profiles joins class_enrollments
-- and classes:
--   USING (get_my_user_type() = 'teacher' AND EXISTS (
--     SELECT 1 FROM class_enrollments ce JOIN classes c ON ...
--     WHERE ce.student_id = user_profiles.id AND ...
--   ))
--
-- Postgres evaluates ALL permissive UPDATE policies on a target row,
-- not just one. So even when an *admin* updates a profile, this
-- expression is evaluated. The EXISTS subquery hits class_enrollments
-- and classes, both of which have their own RLS policies — and at
-- least one of those policies references user_profiles (most likely
-- to check teacher membership). That cross-policy reference is what
-- the planner flags as "infinite recursion detected in policy for
-- relation user_profiles", because the policy graph forms a cycle:
-- user_profiles -> class_enrollments -> user_profiles.
--
-- Fix: wrap the teacher-membership check in a SECURITY DEFINER
-- helper with `SET row_security = off`. The helper queries
-- class_enrollments / classes with RLS disabled, so no policies on
-- those tables fire and no cycle is detected. The teacher policy on
-- user_profiles becomes a simple boolean call, no cross-table join
-- visible to the planner.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_my_student(p_student_id UUID)
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
  IF v_uid IS NULL THEN RETURN FALSE; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.class_enrollments ce
    JOIN public.classes c ON c.id = ce.class_id
    WHERE ce.student_id = p_student_id
      AND ce.status = 'active'
      AND (c.teacher_id           = v_uid
        OR c.teacher_id           = v_pid
        OR c.secondary_teacher_id = v_uid
        OR c.secondary_teacher_id = v_pid)
  ) INTO v_match;
  RETURN COALESCE(v_match, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_my_student(UUID) TO authenticated, anon;

-- Rebuild the Teachers UPDATE policy to use the helper.
DROP POLICY IF EXISTS "Teachers can update student profiles" ON public.user_profiles;
CREATE POLICY "Teachers can update student profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    public.get_my_user_type() = 'teacher'
    AND public.is_my_student(user_profiles.id)
  );
