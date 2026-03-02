-- Activities (Sports & Clubs) Management Tables
-- ================================================

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sport', 'club')),
  description TEXT,
  season TEXT NOT NULL DEFAULT 'year-round' CHECK (season IN ('fall', 'winter', 'spring', 'year-round')),
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  location TEXT,
  schedule TEXT,
  max_capacity INTEGER,
  tryout_required BOOLEAN DEFAULT false,
  tryout_date DATE,
  tryout_info TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_season ON activities(season);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_coach_id ON activities(coach_id);

-- Comments
COMMENT ON TABLE activities IS 'Sports teams and clubs/extracurricular activities';
COMMENT ON COLUMN activities.type IS 'sport or club';
COMMENT ON COLUMN activities.season IS 'fall, winter, spring, or year-round';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activities_updated_at
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

-- RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins have full access to activities"
  ON activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Teachers/coaches can view all activities
CREATE POLICY "Teachers can view activities"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'teacher'
    )
  );

-- Students can view active activities
CREATE POLICY "Students can view active activities"
  ON activities FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'student'
    )
  );

-- Parents can view active activities
CREATE POLICY "Parents can view active activities"
  ON activities FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'parent'
    )
  );

-- ================================================
-- Activity Enrollments table
CREATE TABLE IF NOT EXISTS activity_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'tryout', 'waitlisted', 'inactive')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, student_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_enrollments_activity ON activity_enrollments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_enrollments_student ON activity_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_enrollments_status ON activity_enrollments(status);

-- Comments
COMMENT ON TABLE activity_enrollments IS 'Student enrollments in activities (sports/clubs)';

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_activity_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_activity_enrollments_updated_at
  BEFORE UPDATE ON activity_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_enrollments_updated_at();

-- RLS
ALTER TABLE activity_enrollments ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins have full access to activity_enrollments"
  ON activity_enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Coaches can view enrollments for their activities
CREATE POLICY "Coaches can view their activity enrollments"
  ON activity_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id = activity_enrollments.activity_id
      AND activities.coach_id = auth.uid()
    )
  );

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON activity_enrollments FOR SELECT
  USING (student_id = auth.uid());

-- Parents can view their children's enrollments
CREATE POLICY "Parents can view children enrollments"
  ON activity_enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_child_links.parent_id = auth.uid()
      AND parent_child_links.child_id = activity_enrollments.student_id
    )
  );
