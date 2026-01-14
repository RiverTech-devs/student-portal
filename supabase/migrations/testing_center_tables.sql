-- Testing Center Tables Migration
-- Creates all tables needed for the Testing Center feature
-- Tests are assigned to classes and grades flow into the quarterly gradebook

-- ============================================================================
-- Table 1: tests - Test metadata and settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership (teacher/admin who created the test)
  owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Test metadata
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER DEFAULT 30,

  -- Status management
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),

  -- Settings
  shuffle_questions BOOLEAN DEFAULT false,
  show_results_to_student BOOLEAN DEFAULT true,
  allow_retakes BOOLEAN DEFAULT false,
  max_retakes INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tests_owner_id ON tests(owner_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
CREATE INDEX IF NOT EXISTS idx_tests_created_at ON tests(created_at DESC);

-- ============================================================================
-- Table 2: test_questions - Questions for each test
-- ============================================================================
CREATE TABLE IF NOT EXISTS test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,

  -- Question content
  question_order INTEGER NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'write_in')),
  question_text TEXT NOT NULL,

  -- For multiple choice questions
  options JSONB, -- Array of option strings, e.g., ["Option A", "Option B", "Option C", "Option D"]
  correct_answer_index INTEGER, -- Index of correct option (0-based), NULL for write_in

  -- Points (default 10 for write_in, 1 for multiple_choice typically)
  max_points INTEGER DEFAULT 10,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_order ON test_questions(test_id, question_order);

-- ============================================================================
-- Table 3: test_assignments - Links tests to classes or individual students
-- ============================================================================
CREATE TABLE IF NOT EXISTS test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,

  -- Assignment scope: either class_id OR student_id, not both
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Assignment details
  assigned_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  due_date TIMESTAMPTZ,

  -- Link to assignments table for grade integration
  -- When a test is assigned to a class, we create a corresponding assignment entry
  linked_assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Constraint: must have either class_id or student_id, but not both
  CONSTRAINT test_assignment_scope CHECK (
    (class_id IS NOT NULL AND student_id IS NULL) OR
    (class_id IS NULL AND student_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_test_assignments_test_id ON test_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_class_id ON test_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_student_id ON test_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_linked_assignment ON test_assignments(linked_assignment_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_due_date ON test_assignments(due_date);

-- ============================================================================
-- Table 4: test_submissions - Student test attempts and scores
-- ============================================================================
CREATE TABLE IF NOT EXISTS test_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  test_assignment_id UUID REFERENCES test_assignments(id) ON DELETE SET NULL,

  -- Answers stored as JSONB: { "question_id": answer_value }
  -- answer_value is integer (option index) for MC, string for write-in
  answers JSONB NOT NULL DEFAULT '{}',

  -- Scoring
  auto_score NUMERIC(5,2), -- Score percentage from auto-graded MC questions
  final_score NUMERIC(5,2), -- Final score percentage after all grading complete
  max_possible_score INTEGER, -- Total possible points
  total_points_earned NUMERIC(5,2), -- Actual points earned

  -- Status
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),

  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  time_spent_seconds INTEGER,

  -- Link to assignment_submissions for grade integration
  linked_submission_id UUID REFERENCES assignment_submissions(id) ON DELETE SET NULL,

  -- Attempt tracking (for retakes)
  attempt_number INTEGER DEFAULT 1,

  -- Unique constraint: one submission per student per test per attempt
  UNIQUE(test_id, student_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_test_submissions_test_id ON test_submissions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_student_id ON test_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_status ON test_submissions(status);
CREATE INDEX IF NOT EXISTS idx_test_submissions_linked ON test_submissions(linked_submission_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_submitted_at ON test_submissions(submitted_at DESC);

-- ============================================================================
-- Table 5: test_question_grades - Per-question grading details
-- ============================================================================
CREATE TABLE IF NOT EXISTS test_question_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES test_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,

  -- Grading
  points_earned NUMERIC(5,2),
  is_correct BOOLEAN, -- For MC questions
  feedback TEXT, -- Teacher feedback for write-in questions

  -- Who graded (NULL for auto-graded MC questions)
  graded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,

  -- Unique constraint: one grade per question per submission
  UNIQUE(submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_test_question_grades_submission ON test_question_grades(submission_id);
CREATE INDEX IF NOT EXISTS idx_test_question_grades_question ON test_question_grades(question_id);

-- ============================================================================
-- Helper function: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS tests_updated_at ON tests;
CREATE TRIGGER tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW
  EXECUTE FUNCTION update_tests_updated_at();

DROP TRIGGER IF EXISTS test_questions_updated_at ON test_questions;
CREATE TRIGGER test_questions_updated_at
  BEFORE UPDATE ON test_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_tests_updated_at();

-- ============================================================================
-- Helper function: Calculate test submission score
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_test_submission_score(p_submission_id UUID)
RETURNS TABLE(
  total_points_earned NUMERIC,
  max_possible_points INTEGER,
  final_score_percentage NUMERIC,
  mc_correct INTEGER,
  mc_total INTEGER,
  writein_graded INTEGER,
  writein_total INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_earned NUMERIC := 0;
  v_max_possible INTEGER := 0;
  v_mc_correct INTEGER := 0;
  v_mc_total INTEGER := 0;
  v_writein_graded INTEGER := 0;
  v_writein_total INTEGER := 0;
  v_test_id UUID;
BEGIN
  -- Get test_id from submission
  SELECT ts.test_id INTO v_test_id
  FROM test_submissions ts
  WHERE ts.id = p_submission_id;

  -- Count MC questions and correct answers
  SELECT
    COUNT(*) FILTER (WHERE tqg.is_correct = true),
    COUNT(*),
    COALESCE(SUM(tqg.points_earned), 0),
    COALESCE(SUM(tq.max_points), 0)
  INTO v_mc_correct, v_mc_total, v_total_earned, v_max_possible
  FROM test_questions tq
  LEFT JOIN test_question_grades tqg ON tqg.question_id = tq.id AND tqg.submission_id = p_submission_id
  WHERE tq.test_id = v_test_id
    AND tq.question_type = 'multiple_choice';

  -- Count write-in questions
  SELECT
    COUNT(*) FILTER (WHERE tqg.points_earned IS NOT NULL),
    COUNT(*),
    COALESCE(SUM(tqg.points_earned), 0),
    COALESCE(SUM(tq.max_points), 0)
  INTO v_writein_graded, v_writein_total
  FROM test_questions tq
  LEFT JOIN test_question_grades tqg ON tqg.question_id = tq.id AND tqg.submission_id = p_submission_id
  WHERE tq.test_id = v_test_id
    AND tq.question_type = 'write_in';

  -- Add write-in points to totals
  SELECT
    v_total_earned + COALESCE(SUM(tqg.points_earned), 0),
    v_max_possible + COALESCE(SUM(tq.max_points), 0)
  INTO v_total_earned, v_max_possible
  FROM test_questions tq
  LEFT JOIN test_question_grades tqg ON tqg.question_id = tq.id AND tqg.submission_id = p_submission_id
  WHERE tq.test_id = v_test_id
    AND tq.question_type = 'write_in';

  RETURN QUERY SELECT
    v_total_earned,
    v_max_possible,
    CASE WHEN v_max_possible > 0 THEN (v_total_earned / v_max_possible) * 100 ELSE 0 END,
    v_mc_correct,
    v_mc_total,
    v_writein_graded,
    v_writein_total;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_test_submission_score TO authenticated;
