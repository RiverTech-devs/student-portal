-- Student waivers/consent forms table
CREATE TABLE IF NOT EXISTS student_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Waiver flags
  insurance BOOLEAN DEFAULT false,
  media_release BOOLEAN DEFAULT false,
  waiver_liability BOOLEAN DEFAULT false,
  emergency_medical_auth BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_waivers_student_id ON student_waivers(student_id);

-- Comments
COMMENT ON TABLE student_waivers IS 'Student waiver and consent form status';
COMMENT ON COLUMN student_waivers.insurance IS 'Insurance waiver signed';
COMMENT ON COLUMN student_waivers.media_release IS 'Media/photo release signed';
COMMENT ON COLUMN student_waivers.waiver_liability IS 'Waiver and Release of Liability signed';
COMMENT ON COLUMN student_waivers.emergency_medical_auth IS 'Emergency Medical Authorization signed';

-- RLS Policies
ALTER TABLE student_waivers ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to student_waivers"
  ON student_waivers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Teachers can view waivers for students in their classes
CREATE POLICY "Teachers can view waivers for their students"
  ON student_waivers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = student_waivers.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Parents can view waivers for their children
CREATE POLICY "Parents can view waivers for their children"
  ON student_waivers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_child_links.parent_id = auth.uid()
      AND parent_child_links.child_id = student_waivers.student_id
    )
  );

-- Students can view their own waivers
CREATE POLICY "Students can view their own waivers"
  ON student_waivers FOR SELECT
  USING (
    student_waivers.student_id = auth.uid()
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_student_waivers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_student_waivers_updated_at
  BEFORE UPDATE ON student_waivers
  FOR EACH ROW
  EXECUTE FUNCTION update_student_waivers_updated_at();
