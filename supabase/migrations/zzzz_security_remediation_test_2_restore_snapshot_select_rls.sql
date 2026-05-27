-- ============================================================
-- RESTORE scoped SELECT on quarter_grade_snapshots
-- + allow admin overrides on archived quarters
--
-- Regression fix for the pen-test remediation in
-- zzzz_security_remediation_test_1_findings.sql.
--
-- That migration dropped policy "quarter_snapshots_select"
-- believing it was the legacy wide-open USING (true) policy,
-- and that role-scoped policies "Students can view their own
-- snapshots" / "Teachers can view snapshots" still covered
-- access. Those role-scoped policies DO NOT EXIST in this
-- database -- they were never created in any migration. And by
-- the time test_1 ran, "quarter_snapshots_select" had already
-- been replaced (in fix_quarter_snapshots_select_rls.sql) with a
-- properly SCOPED policy using can_view_enrollment(), NOT the old
-- USING (true) leak.
--
-- Net effect after test_1: quarter_grade_snapshots had RLS
-- enabled with NO SELECT policy at all, so no direct table read
-- returned any row. Students/teachers were unaffected because
-- they read grades through SECURITY DEFINER RPCs, but the admin
-- grade-override editor reads the table directly. Symptom:
--   - SELECT .single() -> 0 rows -> HTTP 406
--   - INSERT fallback  -> collides with the existing (now
--     invisible) row on the (enrollment_id, quarter_id) unique
--     constraint -> HTTP 409
--
-- This migration restores the SCOPED SELECT policy (this does
-- NOT reopen the pen-test finding -- can_view_enrollment scopes
-- access per role and is not USING (true)), and lets admins
-- write to archived quarters so they can correct historical
-- grades.
--
-- Idempotent / safe to re-run.
-- ============================================================

-- 0. Ensure the access-check helper exists. fix_quarter_snapshots_select_rls.sql
--    defined it, but that migration was never applied to the live DB (the live
--    table carried the USING(true) policy until test_1 dropped it), so we create
--    it here to keep this migration self-contained. SECURITY DEFINER + empty
--    search_path avoids RLS recursion.
CREATE OR REPLACE FUNCTION public.can_view_enrollment(p_enrollment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student_id UUID;
  v_class_id UUID;
  v_caller_id UUID;
  v_caller_type TEXT;
BEGIN
  v_caller_id := auth.uid();

  SELECT ce.student_id, ce.class_id INTO v_student_id, v_class_id
  FROM public.class_enrollments ce
  WHERE ce.id = p_enrollment_id;

  IF v_student_id IS NULL THEN RETURN FALSE; END IF;

  SELECT user_type INTO v_caller_type
  FROM public.user_profiles
  WHERE auth_user_id = v_caller_id OR id = v_caller_id
  LIMIT 1;

  -- Admins can view all
  IF v_caller_type = 'admin' THEN RETURN TRUE; END IF;

  -- Students can view their own
  IF v_student_id = v_caller_id THEN RETURN TRUE; END IF;

  -- Teachers can view their class students
  IF v_caller_type = 'teacher' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = v_class_id
      AND (c.teacher_id = v_caller_id OR c.secondary_teacher_id = v_caller_id)
    );
  END IF;

  -- Parents can view their children
  IF v_caller_type = 'parent' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.parent_child_links pcl
      WHERE pcl.parent_id = v_caller_id
      AND pcl.child_id = v_student_id
    );
  END IF;

  RETURN FALSE;
END;
$$;

-- 1. Restore the scoped SELECT policy (admins, the student
--    themselves, the class teacher, and linked parents).
DROP POLICY IF EXISTS "quarter_snapshots_select" ON public.quarter_grade_snapshots;

CREATE POLICY "quarter_snapshots_select"
ON public.quarter_grade_snapshots
FOR SELECT
TO authenticated
USING (public.can_view_enrollment(enrollment_id));

-- 2. Allow INSERT on non-archived quarters OR by an admin
--    (admin override tool must reach historical/archived quarters).
DROP POLICY IF EXISTS "quarter_snapshots_insert" ON public.quarter_grade_snapshots;

CREATE POLICY "quarter_snapshots_insert"
ON public.quarter_grade_snapshots
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_user_type() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.quarters q
    WHERE q.id = quarter_id
    AND q.is_archived = false
  )
);

-- 3. Allow UPDATE on non-archived quarters OR by an admin.
DROP POLICY IF EXISTS "quarter_snapshots_update" ON public.quarter_grade_snapshots;

CREATE POLICY "quarter_snapshots_update"
ON public.quarter_grade_snapshots
FOR UPDATE
TO authenticated
USING (
  public.get_my_user_type() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.quarters q
    WHERE q.id = quarter_id
    AND q.is_archived = false
  )
)
WITH CHECK (
  public.get_my_user_type() = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.quarters q
    WHERE q.id = quarter_id
    AND q.is_archived = false
  )
);
