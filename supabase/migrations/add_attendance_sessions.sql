-- Attendance Sessions table
-- Tracks when attendance was taken for a class, so missing attendance isn't held against students
-- If no session exists for a class/date/period, attendance was never taken (class may have been canceled)

CREATE TABLE IF NOT EXISTS class_attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  period INTEGER CHECK (period IS NULL OR (period >= 1 AND period <= 10)),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'canceled')),
  -- 'completed' = attendance was taken
  -- 'canceled' = class was explicitly canceled (no attendance needed)
  cancel_reason TEXT, -- Optional reason for cancellation
  taken_by UUID NOT NULL,
  taken_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID,
  updated_at TIMESTAMPTZ
);

-- Create unique index using COALESCE to handle NULL periods
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_sessions_unique
ON class_attendance_sessions (class_id, date, COALESCE(period, 0));

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_id ON class_attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON class_attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_date ON class_attendance_sessions(class_id, date);

-- Enable RLS
ALTER TABLE class_attendance_sessions ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage attendance sessions"
  ON class_attendance_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Teachers can manage sessions for their classes
CREATE POLICY "Teachers can manage own class attendance sessions"
  ON class_attendance_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE id = class_attendance_sessions.class_id AND teacher_id = auth.uid()
    )
  );

-- Teachers can view all attendance sessions
CREATE POLICY "Teachers can view all attendance sessions"
  ON class_attendance_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'teacher'
    )
  );

-- Students can view attendance sessions for their enrolled classes
CREATE POLICY "Students can view enrolled class attendance sessions"
  ON class_attendance_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_enrollments
      WHERE class_id = class_attendance_sessions.class_id
        AND student_id = auth.uid()
        AND status = 'active'
    )
  );

-- Parents can view attendance sessions for their children's classes
CREATE POLICY "Parents can view children class attendance sessions"
  ON class_attendance_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links pcl
      JOIN class_enrollments ce ON ce.student_id = pcl.child_id
      WHERE pcl.parent_id = auth.uid()
        AND ce.class_id = class_attendance_sessions.class_id
        AND ce.status = 'active'
    )
  );

COMMENT ON TABLE class_attendance_sessions IS 'Tracks when attendance was taken or class was canceled. If no session exists for a class/date/period, attendance was never taken and students should not be penalized.';
