-- Testing Center RLS Policies Migration
-- Enables Row Level Security on all testing center tables
-- Teachers/admins can manage their own tests, students can take assigned tests

-- ============================================================================
-- Helper function to check if user is admin
-- ============================================================================
CREATE OR REPLACE FUNCTION is_testing_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  );
END;
$$;

-- ============================================================================
-- TESTS TABLE POLICIES
-- ============================================================================
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Teachers/admins can view their own tests
CREATE POLICY "Teachers view own tests"
  ON tests FOR SELECT
  USING (owner_id = auth.uid());

-- Admins can view ALL tests
CREATE POLICY "Admins view all tests"
  ON tests FOR SELECT
  USING (is_testing_admin());

-- Teachers/admins can create tests
CREATE POLICY "Teachers can create tests"
  ON tests FOR INSERT
  WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('teacher', 'admin')
    )
  );

-- Teachers/admins can update their own tests
CREATE POLICY "Teachers can update own tests"
  ON tests FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Teachers/admins can delete their own tests
CREATE POLICY "Teachers can delete own tests"
  ON tests FOR DELETE
  USING (owner_id = auth.uid());

-- Students can view active tests assigned to them
CREATE POLICY "Students view assigned tests"
  ON tests FOR SELECT
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM test_assignments ta
      LEFT JOIN class_enrollments ce ON ce.class_id = ta.class_id AND ce.student_id = auth.uid()
      WHERE ta.test_id = tests.id
      AND ta.is_active = true
      AND (
        ta.student_id = auth.uid() OR
        ce.student_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- TEST_QUESTIONS TABLE POLICIES
-- ============================================================================
ALTER TABLE test_questions ENABLE ROW LEVEL SECURITY;

-- Teachers can manage questions for their own tests
CREATE POLICY "Teachers manage own test questions"
  ON test_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_questions.test_id
      AND tests.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_questions.test_id
      AND tests.owner_id = auth.uid()
    )
  );

-- Admins can view all test questions
CREATE POLICY "Admins view all test questions"
  ON test_questions FOR SELECT
  USING (is_testing_admin());

-- Students can view questions for tests assigned to them
CREATE POLICY "Students view assigned test questions"
  ON test_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tests t
      JOIN test_assignments ta ON ta.test_id = t.id
      LEFT JOIN class_enrollments ce ON ce.class_id = ta.class_id
      WHERE t.id = test_questions.test_id
      AND t.status = 'active'
      AND ta.is_active = true
      AND (ta.student_id = auth.uid() OR ce.student_id = auth.uid())
    )
  );

-- ============================================================================
-- TEST_ASSIGNMENTS TABLE POLICIES
-- ============================================================================
ALTER TABLE test_assignments ENABLE ROW LEVEL SECURITY;

-- Teachers can manage assignments for their own tests
CREATE POLICY "Teachers manage own test assignments"
  ON test_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_assignments.test_id
      AND tests.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_assignments.test_id
      AND tests.owner_id = auth.uid()
    )
  );

-- Admins can view all test assignments
CREATE POLICY "Admins view all test assignments"
  ON test_assignments FOR SELECT
  USING (is_testing_admin());

-- Students can view their own test assignments
CREATE POLICY "Students view own test assignments"
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
ALTER TABLE test_submissions ENABLE ROW LEVEL SECURITY;

-- Students can view their own submissions
CREATE POLICY "Students view own submissions"
  ON test_submissions FOR SELECT
  USING (student_id = auth.uid());

-- Students can create their own submissions
CREATE POLICY "Students create own submissions"
  ON test_submissions FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type = 'student'
    )
  );

-- Students can update their own in-progress submissions
CREATE POLICY "Students update own in-progress submissions"
  ON test_submissions FOR UPDATE
  USING (
    student_id = auth.uid() AND
    status = 'in_progress'
  )
  WITH CHECK (
    student_id = auth.uid()
  );

-- Teachers can view submissions for their tests
CREATE POLICY "Teachers view test submissions"
  ON test_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_submissions.test_id
      AND tests.owner_id = auth.uid()
    )
  );

-- Teachers can update submissions for grading
CREATE POLICY "Teachers grade submissions"
  ON test_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_submissions.test_id
      AND tests.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tests
      WHERE tests.id = test_submissions.test_id
      AND tests.owner_id = auth.uid()
    )
  );

-- Admins can view all submissions
CREATE POLICY "Admins view all submissions"
  ON test_submissions FOR SELECT
  USING (is_testing_admin());

-- Parents can view their children's submissions
CREATE POLICY "Parents view children submissions"
  ON test_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_id = auth.uid()
      AND student_id = test_submissions.student_id
    )
  );

-- ============================================================================
-- TEST_QUESTION_GRADES TABLE POLICIES
-- ============================================================================
ALTER TABLE test_question_grades ENABLE ROW LEVEL SECURITY;

-- Students can view grades for their own submissions
CREATE POLICY "Students view own question grades"
  ON test_question_grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_submissions
      WHERE id = test_question_grades.submission_id
      AND student_id = auth.uid()
    )
  );

-- Teachers can manage grades for their test submissions
CREATE POLICY "Teachers manage question grades"
  ON test_question_grades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM test_submissions ts
      JOIN tests t ON t.id = ts.test_id
      WHERE ts.id = test_question_grades.submission_id
      AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_submissions ts
      JOIN tests t ON t.id = ts.test_id
      WHERE ts.id = test_question_grades.submission_id
      AND t.owner_id = auth.uid()
    )
  );

-- Admins can view all question grades
CREATE POLICY "Admins view all question grades"
  ON test_question_grades FOR SELECT
  USING (is_testing_admin());

-- Parents can view their children's question grades
CREATE POLICY "Parents view children question grades"
  ON test_question_grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_submissions ts
      JOIN parent_child_links psl ON psl.child_id = ts.student_id
      WHERE ts.id = test_question_grades.submission_id
      AND psl.parent_id = auth.uid()
    )
  );

-- ============================================================================
-- Grant execute permission on helper function
-- ============================================================================
GRANT EXECUTE ON FUNCTION is_testing_admin TO authenticated;
