-- ============================================================
-- EMERGENCY FIX: User profiles RLS policies lock everyone out
--
-- Problem: The teacher/admin/parent SELECT policies do subqueries
-- on user_profiles to check the caller's role, but those inner
-- queries are ALSO subject to RLS — creating a circular dependency
-- that blocks all reads.
--
-- Fix: Replace the role-specific SELECT policies with simple,
-- non-recursive ones. Use a SECURITY DEFINER helper to check
-- the caller's role without triggering RLS recursion.
-- ============================================================

-- Drop ALL the broken SELECT policies
DROP POLICY IF EXISTS "Students can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Teachers can view relevant profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Parents can view own and children profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Anon can check username availability" ON public.user_profiles;

-- Drop the broken UPDATE policies (same recursion issue)
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Teachers can update student profiles" ON public.user_profiles;

-- Drop the DELETE policy
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;

-- ============================================================
-- Helper: Get caller's user_type without triggering RLS
-- This function is SECURITY DEFINER so it bypasses RLS entirely.
-- ============================================================
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

-- ============================================================
-- Rebuilt SELECT policies (no self-referencing subqueries)
-- ============================================================

-- All authenticated users can read their own profile
-- (uses auth_user_id for safety — some older profiles may
--  have id != auth.uid())
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- Teachers can view all profiles they need
-- (uses the helper function to avoid recursion)
CREATE POLICY "Teachers can view profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (public.get_my_user_type() = 'teacher');

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (public.get_my_user_type() = 'admin');

-- Parents can view own profile + children's profiles
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

-- ============================================================
-- Rebuilt UPDATE policies
-- ============================================================

-- Users can update their own profile row
-- (the protect_user_profile_columns trigger still blocks
--  sensitive column changes for students)
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Teachers can update student profiles in their classes
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

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (public.get_my_user_type() = 'admin')
  WITH CHECK (public.get_my_user_type() = 'admin');

-- ============================================================
-- DELETE policy (admin only)
-- ============================================================
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE TO authenticated
  USING (public.get_my_user_type() = 'admin');

-- ============================================================
-- Also fix the protect_user_profile_columns trigger to use
-- auth_user_id instead of id for the caller lookup
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_user_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_type TEXT;
BEGIN
  -- Use the helper to avoid RLS recursion
  v_caller_type := public.get_my_user_type();

  -- Admins and teachers can change anything
  IF v_caller_type IN ('admin', 'teacher') THEN
    RETURN NEW;
  END IF;

  -- For students and parents: revert protected columns
  NEW.rtc_balance       := OLD.rtc_balance;
  NEW.user_type         := OLD.user_type;
  NEW.account_status    := OLD.account_status;
  NEW.can_login         := OLD.can_login;
  NEW.enrollment_type   := OLD.enrollment_type;

  RETURN NEW;
END;
$$;

-- ============================================================
-- Done. Logins should work again immediately.
-- ============================================================
