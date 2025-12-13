-- Student Strikes Table
-- Tracks disciplinary strikes against students with automatic decay after 3 months

CREATE TABLE IF NOT EXISTS student_strikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_student_strikes_student_id ON student_strikes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_strikes_created_at ON student_strikes(created_at DESC);

-- Comments
COMMENT ON TABLE student_strikes IS 'Disciplinary strikes for students. Max 3 active strikes at a time. Strikes decay (delete) 3 months from when the most recent strike was given.';
COMMENT ON COLUMN student_strikes.issued_by IS 'Admin who issued the strike';
COMMENT ON COLUMN student_strikes.reason IS 'Reason for the strike';

-- Enable RLS
ALTER TABLE student_strikes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to student_strikes"
  ON student_strikes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Teachers can view strikes for students in their classes
CREATE POLICY "Teachers can view strikes for their students"
  ON student_strikes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = student_strikes.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Parents can view strikes for their children
CREATE POLICY "Parents can view strikes for their children"
  ON student_strikes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_child_links.parent_id = auth.uid()
      AND parent_child_links.child_id = student_strikes.student_id
    )
  );

-- Students can view their own strikes
CREATE POLICY "Students can view their own strikes"
  ON student_strikes FOR SELECT
  USING (
    student_strikes.student_id = auth.uid()
  );
