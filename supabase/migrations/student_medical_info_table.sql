-- Student medical information table
CREATE TABLE IF NOT EXISTS student_medical_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Medical conditions
  conditions TEXT, -- Comma-separated or free-text list of medical conditions
  allergies TEXT, -- Food, medication, environmental allergies
  medications TEXT, -- Current medications student takes

  -- Care instructions
  dietary_restrictions TEXT, -- Dietary needs (vegetarian, gluten-free, etc.)
  physical_limitations TEXT, -- PE restrictions, mobility issues
  emergency_instructions TEXT, -- What to do in case of emergency

  -- Healthcare providers
  doctor_name TEXT,
  doctor_phone TEXT,
  insurance_provider TEXT,
  insurance_policy_number TEXT,

  -- Additional notes
  notes TEXT, -- Any other important medical information

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_medical_info_student_id ON student_medical_info(student_id);

-- Comments
COMMENT ON TABLE student_medical_info IS 'Medical information for students - sensitive data';
COMMENT ON COLUMN student_medical_info.conditions IS 'Medical conditions (e.g., asthma, diabetes, epilepsy)';
COMMENT ON COLUMN student_medical_info.allergies IS 'Known allergies (food, medication, environmental)';
COMMENT ON COLUMN student_medical_info.medications IS 'Current medications the student takes';
COMMENT ON COLUMN student_medical_info.emergency_instructions IS 'Specific instructions for medical emergencies';

-- RLS Policies
ALTER TABLE student_medical_info ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to student_medical_info"
  ON student_medical_info FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Teachers can view medical info for students in their classes
CREATE POLICY "Teachers can view medical info for their students"
  ON student_medical_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = student_medical_info.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Parents can view/manage medical info for their children
CREATE POLICY "Parents can view medical info for their children"
  ON student_medical_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_child_links.parent_id = auth.uid()
      AND parent_child_links.child_id = student_medical_info.student_id
    )
  );

CREATE POLICY "Parents can insert medical info for their children"
  ON student_medical_info FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_child_links.parent_id = auth.uid()
      AND parent_child_links.child_id = student_medical_info.student_id
    )
  );

CREATE POLICY "Parents can update medical info for their children"
  ON student_medical_info FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_child_links.parent_id = auth.uid()
      AND parent_child_links.child_id = student_medical_info.student_id
    )
  );

-- Students can view their own medical info
CREATE POLICY "Students can view their own medical info"
  ON student_medical_info FOR SELECT
  USING (
    student_medical_info.student_id = auth.uid()
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_student_medical_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_student_medical_info_updated_at
  BEFORE UPDATE ON student_medical_info
  FOR EACH ROW
  EXECUTE FUNCTION update_student_medical_info_updated_at();
