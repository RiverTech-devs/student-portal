-- ============================================================
-- FIX: Assignments tab returns 500 / statement timeout (57014)
--
-- Symptom:
--   Portal → Class → Assignments tab fails to load for ALL roles
--   (teacher, admin, student, parent). Console shows:
--     code: "57014"
--     message: "canceling statement due to statement timeout"
--   at portal/index.html:17338 (viewClassAssignments catch).
--
-- Root cause:
--   RLS policies on public.assignments were originally set up
--   via the Supabase SQL editor and never captured in a migration
--   file (rls-audit.js confirms: no RLS entries for this table in
--   git). After the recent user_profiles overhaul
--   (fix_user_profiles_rls_lockout.sql +
--    zz_fix_protect_profile_trigger_invoker_v2.sql +
--    zz_fix_split_id_rls_skill_notifications.sql), any surviving
--   assignments policy of the form:
--       EXISTS (SELECT 1 FROM user_profiles
--               WHERE id = auth.uid() AND user_type = 'teacher')
--   now re-enters the user_profiles policy chain (which requires
--   auth_user_id = auth.uid()) for every candidate row. The
--   combined evaluation blows past Supabase's 8s statement budget
--   and the whole SELECT errors out.
--
-- Fix:
--   Rebuild the public.assignments policies from scratch using the
--   SECURITY DEFINER helpers that the rest of the schema has
--   already standardized on:
--     public.get_my_user_type()    — from fix_user_profiles_rls_lockout
--     public.get_my_profile_id()   — from zz_fix_split_id_rls_skill_notifications
--   Both bypass user_profiles RLS, so the assignments policy
--   evaluates in O(1) lookups instead of cascading.
--
--   Supporting columns are already indexed:
--     idx_assignments_class_id, idx_assignments_class_published_due,
--     idx_classes_teacher_id, idx_class_enrollments_class_status,
--     idx_user_profiles_auth_user_id (unique).
-- ============================================================

-- 0. Make sure RLS is on (idempotent)
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- 1. Drop every existing policy on public.assignments so we can
--    rebuild cleanly. We don't know the names since they were
--    created via SQL editor, so enumerate dynamically.
DO $$
DECLARE
  pol_name TEXT;
BEGIN
  FOR pol_name IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'public.assignments'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.assignments', pol_name);
  END LOOP;
END $$;

-- ============================================================
-- 2. SELECT policies
-- ============================================================

-- Admins see everything
CREATE POLICY "assignments_select_admin"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (public.get_my_user_type() = 'admin');

-- Teachers see assignments in classes they teach (primary or secondary)
-- Uses classes.teacher_id / classes.secondary_teacher_id directly, so no
-- user_profiles subquery is involved.
CREATE POLICY "assignments_select_teacher"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = assignments.class_id
        AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    )
  );

-- Students see published assignments in their enrolled classes.
-- Accepts both legacy (student_id = auth.uid()) and split-id
-- (student_id = user_profiles.id via get_my_profile_id()) rows.
CREATE POLICY "assignments_select_student"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      WHERE ce.class_id = assignments.class_id
        AND ce.status = 'active'
        AND (
          ce.student_id = auth.uid()
          OR ce.student_id = public.get_my_profile_id()
        )
    )
  );

-- Parents see published assignments in their child's classes.
CREATE POLICY "assignments_select_parent"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.parent_child_links pcl
      JOIN public.class_enrollments ce ON ce.student_id = pcl.child_id
      WHERE pcl.parent_id = auth.uid()
        AND ce.class_id = assignments.class_id
        AND ce.status = 'active'
    )
  );

-- ============================================================
-- 3. INSERT / UPDATE / DELETE — teachers (for their classes) + admins
-- ============================================================

CREATE POLICY "assignments_insert_teacher"
  ON public.assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = assignments.class_id
        AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    )
  );

CREATE POLICY "assignments_insert_admin"
  ON public.assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_user_type() = 'admin');

CREATE POLICY "assignments_update_teacher"
  ON public.assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = assignments.class_id
        AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = assignments.class_id
        AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    )
  );

CREATE POLICY "assignments_update_admin"
  ON public.assignments FOR UPDATE
  TO authenticated
  USING (public.get_my_user_type() = 'admin')
  WITH CHECK (public.get_my_user_type() = 'admin');

CREATE POLICY "assignments_delete_teacher"
  ON public.assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = assignments.class_id
        AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    )
  );

CREATE POLICY "assignments_delete_admin"
  ON public.assignments FOR DELETE
  TO authenticated
  USING (public.get_my_user_type() = 'admin');

-- ============================================================
-- 4. Refresh query planner statistics so the new policy plans well
-- ============================================================
ANALYZE public.assignments;
ANALYZE public.classes;
ANALYZE public.class_enrollments;
ANALYZE public.parent_child_links;

-- ============================================================
-- Done. Assignments tab should load in <1s for all roles.
-- ============================================================
