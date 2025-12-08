-- Homework Assignments Table
-- Allows teachers to assign specific skills or games as homework

CREATE TABLE IF NOT EXISTS homework_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who assigned and who it's for
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL, -- Optional class context

  -- What's being assigned
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('skill_practice', 'game', 'skill_mastery')),

  -- Skill-related fields
  subject TEXT, -- e.g., 'Math', 'Art', 'Programming'
  skill_name TEXT, -- Specific skill from skill tree
  target_mastery_score INTEGER CHECK (target_mastery_score >= 0 AND target_mastery_score <= 100),

  -- Game-related fields
  game_id TEXT, -- e.g., 'mathspire', 'wordquest'
  game_config JSONB DEFAULT '{}', -- Game-specific settings (difficulty, topics, etc.)
  min_play_time INTEGER, -- Minimum minutes to play
  min_score INTEGER, -- Minimum score to achieve

  -- Assignment details
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,

  -- Timing
  assigned_at TIMESTAMPTZ DEFAULT now(),
  due_date TIMESTAMPTZ,

  -- Completion tracking
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue', 'excused')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Results
  final_score INTEGER,
  time_spent INTEGER, -- Minutes spent on assignment
  attempts INTEGER DEFAULT 0,

  -- Teacher feedback
  feedback TEXT,
  grade TEXT, -- Optional letter grade or score
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_homework_student_id ON homework_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_teacher_id ON homework_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_homework_class_id ON homework_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_homework_status ON homework_assignments(status);
CREATE INDEX IF NOT EXISTS idx_homework_due_date ON homework_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_homework_subject_skill ON homework_assignments(subject, skill_name);

-- Index for finding pending assignments
CREATE INDEX IF NOT EXISTS idx_homework_pending
ON homework_assignments(student_id, due_date)
WHERE status IN ('assigned', 'in_progress');

-- Comments
COMMENT ON TABLE homework_assignments IS 'Teacher-assigned skill practice or game homework';
COMMENT ON COLUMN homework_assignments.assignment_type IS 'skill_practice = practice a skill, game = play a specific game, skill_mastery = achieve mastery in a skill';
COMMENT ON COLUMN homework_assignments.game_config IS 'JSON config for game settings like difficulty, specific topics to cover';
COMMENT ON COLUMN homework_assignments.target_mastery_score IS 'For skill_mastery type, the score student needs to achieve';

-- Enable RLS
ALTER TABLE homework_assignments ENABLE ROW LEVEL SECURITY;

-- Students can view their own assignments
CREATE POLICY "Students can view their own assignments"
  ON homework_assignments FOR SELECT
  USING (student_id = auth.uid());

-- Students can update their own assignments (for progress tracking)
CREATE POLICY "Students can update their own assignments"
  ON homework_assignments FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Teachers can view assignments they created
CREATE POLICY "Teachers can view their assignments"
  ON homework_assignments FOR SELECT
  USING (teacher_id = auth.uid());

-- Teachers can view assignments for students in their classes
CREATE POLICY "Teachers can view class student assignments"
  ON homework_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      JOIN classes c ON c.id = cs.class_id
      WHERE cs.student_id = homework_assignments.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Teachers can create assignments for students in their classes
CREATE POLICY "Teachers can create assignments for their students"
  ON homework_assignments FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid()
    AND (
      class_id IS NULL
      OR EXISTS (
        SELECT 1 FROM classes
        WHERE classes.id = homework_assignments.class_id
        AND classes.teacher_id = auth.uid()
      )
    )
  );

-- Teachers can update assignments they created
CREATE POLICY "Teachers can update their assignments"
  ON homework_assignments FOR UPDATE
  USING (teacher_id = auth.uid());

-- Teachers can delete assignments they created
CREATE POLICY "Teachers can delete their assignments"
  ON homework_assignments FOR DELETE
  USING (teacher_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins can manage all assignments"
  ON homework_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Parents can view assignments for their linked children
CREATE POLICY "Parents can view children assignments"
  ON homework_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_child_links.parent_id = auth.uid()
      AND parent_child_links.child_id = homework_assignments.student_id
    )
  );

-- Function to check and update overdue assignments
CREATE OR REPLACE FUNCTION update_overdue_assignments()
RETURNS void AS $$
BEGIN
  UPDATE homework_assignments
  SET status = 'overdue'
  WHERE status IN ('assigned', 'in_progress')
  AND due_date < now();
END;
$$ LANGUAGE plpgsql;

-- Skill Practice Sessions Table
-- Tracks individual practice sessions for analytics
CREATE TABLE IF NOT EXISTS skill_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- What was practiced
  subject TEXT NOT NULL,
  skill_name TEXT NOT NULL,

  -- Source of practice
  source_type TEXT NOT NULL CHECK (source_type IN ('game', 'assignment', 'manual', 'quiz')),
  source_id UUID, -- Reference to game session or assignment
  game_id TEXT, -- Which game was used

  -- Session details
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Performance
  score INTEGER, -- 0-100 performance score
  correct_count INTEGER,
  total_count INTEGER,

  -- Progress impact
  mastery_before INTEGER,
  mastery_after INTEGER,
  mastery_gained INTEGER GENERATED ALWAYS AS (mastery_after - mastery_before) STORED,

  -- Linked homework assignment (if any)
  homework_id UUID REFERENCES homework_assignments(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user ON skill_practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_skill ON skill_practice_sessions(subject, skill_name);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_date ON skill_practice_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_homework ON skill_practice_sessions(homework_id);

-- Enable RLS
ALTER TABLE skill_practice_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view and insert their own sessions
CREATE POLICY "Users can view their own practice sessions"
  ON skill_practice_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own practice sessions"
  ON skill_practice_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Teachers can view sessions for their students
CREATE POLICY "Teachers can view student practice sessions"
  ON skill_practice_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      JOIN classes c ON c.id = cs.class_id
      WHERE cs.student_id = skill_practice_sessions.user_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all practice sessions"
  ON skill_practice_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Parents can view their children's sessions
CREATE POLICY "Parents can view children practice sessions"
  ON skill_practice_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_child_links.parent_id = auth.uid()
      AND parent_child_links.child_id = skill_practice_sessions.user_id
    )
  );

-- Function to update skill progress after a practice session
CREATE OR REPLACE FUNCTION update_skill_after_practice()
RETURNS TRIGGER AS $$
DECLARE
  current_mastery INTEGER;
  new_mastery INTEGER;
  score_bonus INTEGER;
BEGIN
  -- Get current mastery
  SELECT mastery_score INTO current_mastery
  FROM skill_progress
  WHERE user_id = NEW.user_id
    AND subject = NEW.subject
    AND skill_name = NEW.skill_name;

  -- Default to 0 if no record exists
  current_mastery := COALESCE(current_mastery, 0);

  -- Calculate mastery gain based on performance
  -- High scores gain more, but with diminishing returns at higher mastery levels
  IF NEW.score IS NOT NULL THEN
    score_bonus := GREATEST(0, (NEW.score - 50) / 10); -- 0-5 bonus based on score
    new_mastery := LEAST(100, current_mastery + score_bonus + 2); -- Base 2 points + bonus
  ELSE
    new_mastery := LEAST(100, current_mastery + 1); -- Just practiced, small gain
  END IF;

  -- Store before/after values
  NEW.mastery_before := current_mastery;
  NEW.mastery_after := new_mastery;

  -- Update skill_progress table
  INSERT INTO skill_progress (user_id, subject, skill_name, mastery_score, last_practiced, practice_count, state)
  VALUES (NEW.user_id, NEW.subject, NEW.skill_name, new_mastery, now(), 1,
    CASE WHEN new_mastery >= 80 THEN 'mastered' ELSE 'in_progress' END)
  ON CONFLICT (user_id, subject, skill_name)
  DO UPDATE SET
    mastery_score = new_mastery,
    last_practiced = now(),
    practice_count = skill_progress.practice_count + 1,
    state = CASE
      WHEN new_mastery >= 80 THEN 'mastered'
      WHEN skill_progress.state = 'locked' THEN 'available'
      ELSE 'in_progress'
    END,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update skill progress after practice
DROP TRIGGER IF EXISTS trigger_update_skill_after_practice ON skill_practice_sessions;
CREATE TRIGGER trigger_update_skill_after_practice
  BEFORE INSERT ON skill_practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_skill_after_practice();
