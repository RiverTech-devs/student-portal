-- Fix Testing Center RLS Policies - Avoid infinite recursion
-- The issue was policies on child tables querying parent tables, triggering their RLS

-- ============================================================================
-- Drop all existing policies first
-- ============================================================================

-- Tests policies
DROP POLICY IF EXISTS "Teachers view own tests" ON tests;
DROP POLICY IF EXISTS "Admins view all tests" ON tests;
DROP POLICY IF EXISTS "Teachers can create tests" ON tests;
DROP POLICY IF EXISTS "Teachers can update own tests" ON tests;
DROP POLICY IF EXISTS "Teachers can delete own tests" ON tests;
DROP POLICY IF EXISTS "Students view assigned tests" ON tests;

-- Test questions policies
DROP POLICY IF EXISTS "Teachers manage own test questions" ON test_questions;
DROP POLICY IF EXISTS "Admins view all test questions" ON test_questions;
DROP POLICY IF EXISTS "Students view assigned test questions" ON test_questions;

-- Test assignments policies
DROP POLICY IF EXISTS "Teachers manage own test assignments" ON test_assignments;
DROP POLICY IF EXISTS "Admins view all test assignments" ON test_assignments;
DROP POLICY IF EXISTS "Students view own test assignments" ON test_assignments;

-- Test submissions policies
DROP POLICY IF EXISTS "Students view own submissions" ON test_submissions;
DROP POLICY IF EXISTS "Students create own submissions" ON test_submissions;
DROP POLICY IF EXISTS "Students update own in-progress submissions" ON test_submissions;
DROP POLICY IF EXISTS "Teachers view test submissions" ON test_submissions;
DROP POLICY IF EXISTS "Teachers grade submissions" ON test_submissions;
DROP POLICY IF EXISTS "Admins view all submissions" ON test_submissions;
DROP POLICY IF EXISTS "Parents view children submissions" ON test_submissions;

-- Test question grades policies
DROP POLICY IF EXISTS "Students view own question grades" ON test_question_grades;
DROP POLICY IF EXISTS "Teachers manage question grades" ON test_question_grades;
DROP POLICY IF EXISTS "Admins view all question grades" ON test_question_grades;
DROP POLICY IF EXISTS "Parents view children question grades" ON test_question_grades;

-- Drop old helper function
DROP FUNCTION IF EXISTS is_testing_admin();

-- ============================================================================
-- Create helper functions with SECURITY DEFINER to bypass RLS
-- ============================================================================

-- Check if user is teacher or admin
CREATE OR REPLACE FUNCTION is_teacher_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_type IN ('teacher', 'admin')
  );
$$;

-- Check if user owns a specific test (bypasses RLS)
CREATE OR REPLACE FUNCTION owns_test(test_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tests
    WHERE id = test_id
    AND owner_id = auth.uid()
  );
$$;

-- Check if student is assigned to a test (bypasses RLS)
CREATE OR REPLACE FUNCTION is_assigned_to_test(p_test_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM test_assignments ta
    LEFT JOIN class_enrollments ce ON ce.class_id = ta.class_id AND ce.student_id = auth.uid()
    WHERE ta.test_id = p_test_id
    AND ta.is_active = true
    AND (ta.student_id = auth.uid() OR ce.student_id IS NOT NULL)
  );
$$;

-- ============================================================================
-- TESTS TABLE POLICIES (Simplified)
-- ============================================================================

-- Teachers/admins can view their own tests
CREATE POLICY "tests_select_owner"
  ON tests FOR SELECT
  USING (owner_id = auth.uid());

-- Students can view active assigned tests
CREATE POLICY "tests_select_assigned"
  ON tests FOR SELECT
  USING (status = 'active' AND is_assigned_to_test(id));

-- Teachers/admins can create tests
CREATE POLICY "tests_insert"
  ON tests FOR INSERT
  WITH CHECK (owner_id = auth.uid() AND is_teacher_or_admin());

-- Owners can update their tests
CREATE POLICY "tests_update"
  ON tests FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Owners can delete their tests
CREATE POLICY "tests_delete"
  ON tests FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================================
-- TEST_QUESTIONS TABLE POLICIES
-- ============================================================================

-- Test owners can manage questions
CREATE POLICY "test_questions_owner"
  ON test_questions FOR ALL
  USING (owns_test(test_id))
  WITH CHECK (owns_test(test_id));

-- Students can view questions for assigned tests
CREATE POLICY "test_questions_assigned"
  ON test_questions FOR SELECT
  USING (is_assigned_to_test(test_id));

-- ============================================================================
-- TEST_ASSIGNMENTS TABLE POLICIES
-- ============================================================================

-- Test owners can manage assignments
CREATE POLICY "test_assignments_owner"
  ON test_assignments FOR ALL
  USING (owns_test(test_id))
  WITH CHECK (owns_test(test_id));

-- Students can view their assignments
CREATE POLICY "test_assignments_student"
  ON test_assignments FOR SELECT
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM class_enrollments
      WHERE class_id = test_assignments.class_id
      AND student_id = auth.uid()
      AND status = 'active'
    )
  );

-- ============================================================================
-- TEST_SUBMISSIONS TABLE POLICIES
-- ============================================================================

-- Students can manage their own submissions
CREATE POLICY "test_submissions_student_select"
  ON test_submissions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "test_submissions_student_insert"
  ON test_submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "test_submissions_student_update"
  ON test_submissions FOR UPDATE
  USING (student_id = auth.uid() AND status = 'in_progress')
  WITH CHECK (student_id = auth.uid());

-- Test owners can view and grade submissions
CREATE POLICY "test_submissions_owner_select"
  ON test_submissions FOR SELECT
  USING (owns_test(test_id));

CREATE POLICY "test_submissions_owner_update"
  ON test_submissions FOR UPDATE
  USING (owns_test(test_id))
  WITH CHECK (owns_test(test_id));

-- Parents can view children's submissions
CREATE POLICY "test_submissions_parent"
  ON test_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_id = auth.uid()
      AND child_id = test_submissions.student_id
    )
  );

-- ============================================================================
-- TEST_QUESTION_GRADES TABLE POLICIES
-- ============================================================================

-- Students can view their own grades
CREATE POLICY "test_question_grades_student"
  ON test_question_grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_submissions
      WHERE id = test_question_grades.submission_id
      AND student_id = auth.uid()
    )
  );

-- Test owners can manage grades
CREATE POLICY "test_question_grades_owner"
  ON test_question_grades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM test_submissions ts
      WHERE ts.id = test_question_grades.submission_id
      AND owns_test(ts.test_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_submissions ts
      WHERE ts.id = test_question_grades.submission_id
      AND owns_test(ts.test_id)
    )
  );

-- Parents can view children's grades
CREATE POLICY "test_question_grades_parent"
  ON test_question_grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_submissions ts
      JOIN parent_child_links pcl ON pcl.child_id = ts.student_id
      WHERE ts.id = test_question_grades.submission_id
      AND pcl.parent_id = auth.uid()
    )
  );

-- ============================================================================
-- Grant execute permissions on helper functions
-- ============================================================================
GRANT EXECUTE ON FUNCTION is_teacher_or_admin TO authenticated;
GRANT EXECUTE ON FUNCTION owns_test TO authenticated;
GRANT EXECUTE ON FUNCTION is_assigned_to_test TO authenticated;
