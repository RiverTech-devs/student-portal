-- Admin RLS policies using security definer function to avoid recursion
-- Run this AFTER the is_admin() function has been created

-- ============================================
-- PARENT_CHILD_LINKS - Already fixed via SQL Editor
-- These policies use is_admin() function
-- ============================================

-- ============================================
-- CLASS_ENROLLMENTS - Add missing admin policies
-- ============================================

-- Admin INSERT policy
CREATE POLICY "Admins can insert enrollments"
  ON class_enrollments FOR INSERT
  WITH CHECK (is_admin());

-- Admin UPDATE policy
CREATE POLICY "Admins can update enrollments"
  ON class_enrollments FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admin DELETE policy
CREATE POLICY "Admins can delete enrollments"
  ON class_enrollments FOR DELETE
  USING (is_admin());

-- ============================================
-- GRADES - Add admin SELECT policy
-- ============================================

CREATE POLICY "Admins can view all grades"
  ON grades FOR SELECT
  USING (is_admin());

-- ============================================
-- USER_PROFILES - Add admin INSERT policy
-- ============================================

CREATE POLICY "Admins can create user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (is_admin());
