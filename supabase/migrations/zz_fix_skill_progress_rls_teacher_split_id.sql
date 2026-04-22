-- ============================================================
-- FIX: Teacher view of a student's skill tree was empty.
--
-- Two compounding problems observed against prod pg_policies:
--
--   1. The teacher-read policy was named "Teachers view student
--      skills" and referenced a `class_students` table that does
--      not exist in this schema (the real table has always been
--      `class_enrollments`). In Postgres, an RLS policy whose
--      expression references a missing relation errors at query
--      time, which can poison the SELECT even when a sibling
--      permissive policy would otherwise allow access.
--
--   2. Both teacher-read and parent-read policies compared against
--      `auth.uid()` directly, but `classes.teacher_id` and
--      `parent_child_links.parent_id` both store `user_profiles.id`,
--      so split-id teachers/parents (id != auth_user_id) were
--      silently denied. This is the same class of bug
--      zz_fix_split_id_rls_skill_notifications.sql addressed for
--      student-self writes.
--
-- The earlier partial patch applied via the SQL editor created
-- policies with slightly different names than the ones actually
-- installed, so the broken originals stuck around alongside the
-- new ones. This migration drops every legacy variant by exact
-- name and rebuilds the student-self / teacher-read / parent-read
-- policies against the correct tables, using get_my_profile_id()
-- to accept either auth.uid() or the caller's profile id.
-- ============================================================

-- 1. Drop every existing policy on skill_progress by its actual name.
DROP POLICY IF EXISTS "Teachers view student skills"               ON public.skill_progress;
DROP POLICY IF EXISTS "Teachers can view student skill progress"   ON public.skill_progress;
DROP POLICY IF EXISTS "Teachers can update student skill progress" ON public.skill_progress;
DROP POLICY IF EXISTS "Parents view children skills"               ON public.skill_progress;
DROP POLICY IF EXISTS "Parents can view children skill progress"   ON public.skill_progress;
DROP POLICY IF EXISTS "Users can view own skill progress"          ON public.skill_progress;
DROP POLICY IF EXISTS "Users can view their own skill progress"    ON public.skill_progress;
DROP POLICY IF EXISTS "Users can insert own skill progress"        ON public.skill_progress;
DROP POLICY IF EXISTS "Users can insert their own skill progress"  ON public.skill_progress;
DROP POLICY IF EXISTS "Users can update own skill progress"        ON public.skill_progress;
DROP POLICY IF EXISTS "Users can update their own skill progress"  ON public.skill_progress;
DROP POLICY IF EXISTS "Users can manage own skill progress"        ON public.skill_progress;

-- 2. Student-self (split-id aware).
CREATE POLICY "Users can view their own skill progress"
  ON public.skill_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id = public.get_my_profile_id());

CREATE POLICY "Users can insert their own skill progress"
  ON public.skill_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id = public.get_my_profile_id());

CREATE POLICY "Users can update their own skill progress"
  ON public.skill_progress FOR UPDATE TO authenticated
  USING      (user_id = auth.uid() OR user_id = public.get_my_profile_id())
  WITH CHECK (user_id = auth.uid() OR user_id = public.get_my_profile_id());

-- 3. Teacher-read / teacher-update: join through class_enrollments,
--    accept both auth.uid() and profile.id for the teacher match.
CREATE POLICY "Teachers can view student skill progress"
  ON public.skill_progress FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON c.id = ce.class_id
      WHERE ce.student_id = skill_progress.user_id
        AND ce.status = 'active'
        AND (c.teacher_id           = auth.uid()
          OR c.teacher_id           = public.get_my_profile_id()
          OR c.secondary_teacher_id = auth.uid()
          OR c.secondary_teacher_id = public.get_my_profile_id())
    )
  );

CREATE POLICY "Teachers can update student skill progress"
  ON public.skill_progress FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON c.id = ce.class_id
      WHERE ce.student_id = skill_progress.user_id
        AND ce.status = 'active'
        AND (c.teacher_id           = auth.uid()
          OR c.teacher_id           = public.get_my_profile_id()
          OR c.secondary_teacher_id = auth.uid()
          OR c.secondary_teacher_id = public.get_my_profile_id())
    )
  );

-- 4. Parent-read: same split-id pattern for the parent.
CREATE POLICY "Parents can view children skill progress"
  ON public.skill_progress FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_child_links pcl
      WHERE pcl.child_id = skill_progress.user_id
        AND (pcl.parent_id = auth.uid() OR pcl.parent_id = public.get_my_profile_id())
    )
  );
