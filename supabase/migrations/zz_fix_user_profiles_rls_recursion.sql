-- ============================================================
-- Re-fix infinite recursion in user_profiles RLS policies
--
-- Migrations sort alphabetically. fix_user_profiles_rls_lockout.sql
-- (f) runs BEFORE secure_user_profiles_rls.sql (s). The "secure"
-- migration drops every user_profiles policy via DROP IF EXISTS and
-- re-creates them with `EXISTS (SELECT 1 FROM public.user_profiles
-- me WHERE me.id = auth.uid() ...)` subqueries — which retrigger the
-- same policies and cause Postgres error 42P17 (infinite recursion).
--
-- Symptom: admins editing any column on user_profiles (e.g.
-- enrollment_type via admin-student-management) get a 500 with
-- "infinite recursion detected in policy for relation user_profiles".
--
-- Fix: rebuild the policies using the public.get_my_user_type()
-- SECURITY DEFINER helper (created in fix_user_profiles_rls_lockout)
-- which bypasses RLS. zz_ prefix ensures this migration sorts after
-- secure_user_profiles_rls.sql so it lands as the final state.
-- ============================================================

-- 1. Make sure the helper exists (idempotent re-create).
CREATE OR REPLACE FUNCTION public.get_my_user_type()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT user_type FROM public.user_profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_user_type() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_user_type() TO anon;

-- 2. Drop all user_profiles policies that secure_user_profiles_rls.sql
--    re-installed (and any other recursive variants).
DROP POLICY IF EXISTS "Students can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Teachers can view relevant profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Parents can view own and children profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Teachers can update student profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Teachers can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Parents can view children profiles" ON public.user_profiles;

-- 3. SELECT policies (no self-referencing subqueries).
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Teachers can view profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (public.get_my_user_type() = 'teacher');

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (public.get_my_user_type() = 'admin');

CREATE POLICY "Parents can view children profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    public.get_my_user_type() = 'parent'
    AND (
      auth_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.parent_child_links pcl
        WHERE pcl.parent_id = auth.uid()
          AND pcl.child_id = user_profiles.id
      )
    )
  );

-- 4. UPDATE policies.
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Teachers can update student profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    public.get_my_user_type() = 'teacher'
    AND EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON ce.class_id = c.id
      WHERE ce.student_id = user_profiles.id
        AND ce.status = 'active'
        AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    )
  );

CREATE POLICY "Admins can update any profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (public.get_my_user_type() = 'admin')
  WITH CHECK (public.get_my_user_type() = 'admin');

-- 5. DELETE policy.
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE TO authenticated
  USING (public.get_my_user_type() = 'admin');

-- 6. Also re-apply the protect_user_profile_columns trigger fix
--    (uses helper to avoid recursion when looking up caller type).
CREATE OR REPLACE FUNCTION public.protect_user_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_type TEXT;
BEGIN
  v_caller_type := public.get_my_user_type();

  -- Admins and teachers can change anything.
  IF v_caller_type IN ('admin', 'teacher') THEN
    RETURN NEW;
  END IF;

  -- Students/parents: revert protected columns.
  NEW.rtc_balance       := OLD.rtc_balance;
  NEW.user_type         := OLD.user_type;
  NEW.account_status    := OLD.account_status;
  NEW.can_login         := OLD.can_login;
  NEW.enrollment_type   := OLD.enrollment_type;

  RETURN NEW;
END;
$$;
