-- Attendance System
-- Tracks student attendance days, class schedules, and daily/class attendance

-- ============================================
-- Student Schedule - Which days each student should attend school
-- ============================================
CREATE TABLE IF NOT EXISTS student_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  -- 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_student_schedule_student_id ON student_schedule(student_id);
CREATE INDEX IF NOT EXISTS idx_student_schedule_day ON student_schedule(day_of_week);

-- ============================================
-- Class Schedule - Which days/periods each class meets
-- ============================================
CREATE TABLE IF NOT EXISTS class_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  period INTEGER NOT NULL CHECK (period >= 1 AND period <= 10),
  -- Periods 1-10 to accommodate various school schedules
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, day_of_week, period)
);

CREATE INDEX IF NOT EXISTS idx_class_schedule_class_id ON class_schedule(class_id);
CREATE INDEX IF NOT EXISTS idx_class_schedule_day ON class_schedule(day_of_week);
CREATE INDEX IF NOT EXISTS idx_class_schedule_period ON class_schedule(period);

-- ============================================
-- Daily Attendance - School-wide attendance record
-- ============================================
CREATE TABLE IF NOT EXISTS daily_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'left_early', 'late_left_early')),
  excused BOOLEAN DEFAULT false,
  excuse_note TEXT,
  arrived_at_period INTEGER CHECK (arrived_at_period IS NULL OR (arrived_at_period >= 1 AND arrived_at_period <= 10)),
  left_at_period INTEGER CHECK (left_at_period IS NULL OR (left_at_period >= 1 AND left_at_period <= 10)),
  marked_by UUID NOT NULL,
  marked_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID,
  updated_at TIMESTAMPTZ,
  UNIQUE(student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_attendance_student_id ON daily_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_date ON daily_attendance(date);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_status ON daily_attendance(status);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_student_date ON daily_attendance(student_id, date);

-- ============================================
-- Class Attendance - Per-class attendance (teacher-marked)
-- ============================================
CREATE TABLE IF NOT EXISTS class_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  student_id UUID NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'left_early', 'late_left_early')),
  notes TEXT,
  marked_by UUID NOT NULL,
  marked_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID,
  updated_at TIMESTAMPTZ,
  UNIQUE(class_id, student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_class_attendance_class_id ON class_attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_student_id ON class_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_class_attendance_date ON class_attendance(date);
CREATE INDEX IF NOT EXISTS idx_class_attendance_class_date ON class_attendance(class_id, date);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE student_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_attendance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for student_schedule
-- ============================================

-- Admins can do everything
CREATE POLICY "Admins can manage student schedules"
  ON student_schedule FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Teachers can view student schedules
CREATE POLICY "Teachers can view student schedules"
  ON student_schedule FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'teacher'
    )
  );

-- Students can view their own schedule
CREATE POLICY "Students can view own schedule"
  ON student_schedule FOR SELECT
  USING (student_id = auth.uid());

-- Parents can view their children's schedules
CREATE POLICY "Parents can view children schedules"
  ON student_schedule FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_id = auth.uid() AND child_id = student_schedule.student_id
    )
  );

-- ============================================
-- RLS Policies for class_schedule
-- ============================================

-- Anyone authenticated can view class schedules
CREATE POLICY "Authenticated can view class schedules"
  ON class_schedule FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage all class schedules
CREATE POLICY "Admins can manage class schedules"
  ON class_schedule FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Teachers can manage their own class schedules
CREATE POLICY "Teachers can manage own class schedules"
  ON class_schedule FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE id = class_schedule.class_id AND teacher_id = auth.uid()
    )
  );

-- ============================================
-- RLS Policies for daily_attendance
-- ============================================

-- Admins can do everything
CREATE POLICY "Admins can manage daily attendance"
  ON daily_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Teachers can view and mark daily attendance
CREATE POLICY "Teachers can view daily attendance"
  ON daily_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'teacher'
    )
  );

CREATE POLICY "Teachers can insert daily attendance"
  ON daily_attendance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'teacher'
    )
  );

CREATE POLICY "Teachers can update daily attendance"
  ON daily_attendance FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'teacher'
    )
  );

-- Students can view their own attendance
CREATE POLICY "Students can view own daily attendance"
  ON daily_attendance FOR SELECT
  USING (student_id = auth.uid());

-- Parents can view their children's attendance
CREATE POLICY "Parents can view children daily attendance"
  ON daily_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_id = auth.uid() AND child_id = daily_attendance.student_id
    )
  );

-- ============================================
-- RLS Policies for class_attendance
-- ============================================

-- Admins can do everything
CREATE POLICY "Admins can manage class attendance"
  ON class_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- Teachers can manage attendance for their classes
CREATE POLICY "Teachers can manage own class attendance"
  ON class_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE id = class_attendance.class_id AND teacher_id = auth.uid()
    )
  );

-- Teachers can view all class attendance
CREATE POLICY "Teachers can view all class attendance"
  ON class_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'teacher'
    )
  );

-- Students can view their own class attendance
CREATE POLICY "Students can view own class attendance"
  ON class_attendance FOR SELECT
  USING (student_id = auth.uid());

-- Parents can view their children's class attendance
CREATE POLICY "Parents can view children class attendance"
  ON class_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_id = auth.uid() AND child_id = class_attendance.student_id
    )
  );
