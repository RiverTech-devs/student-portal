-- Emergency contacts table for students
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship TEXT NOT NULL, -- e.g., 'Mother', 'Father', 'Guardian', 'Grandparent', 'Aunt', 'Uncle', 'Other'
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  email TEXT,
  is_primary BOOLEAN DEFAULT false,
  can_pickup BOOLEAN DEFAULT true, -- Authorized to pick up student
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_student_id ON emergency_contacts(student_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_is_primary ON emergency_contacts(is_primary) WHERE is_primary = true;

-- Comments
COMMENT ON TABLE emergency_contacts IS 'Emergency contact information for students';
COMMENT ON COLUMN emergency_contacts.is_primary IS 'Primary emergency contact to call first';
COMMENT ON COLUMN emergency_contacts.can_pickup IS 'Whether this person is authorized to pick up the student';

-- RLS Policies
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to emergency_contacts"
  ON emergency_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Teachers can view emergency contacts for students in their classes
CREATE POLICY "Teachers can view emergency contacts for their students"
  ON emergency_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = emergency_contacts.student_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Parents can view/manage emergency contacts for their children
CREATE POLICY "Parents can view emergency contacts for their children"
  ON emergency_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_child_links.parent_id = auth.uid()
      AND parent_child_links.child_id = emergency_contacts.student_id
    )
  );

CREATE POLICY "Parents can insert emergency contacts for their children"
  ON emergency_contacts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_child_links.parent_id = auth.uid()
      AND parent_child_links.child_id = emergency_contacts.student_id
    )
  );

CREATE POLICY "Parents can update emergency contacts for their children"
  ON emergency_contacts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_child_links.parent_id = auth.uid()
      AND parent_child_links.child_id = emergency_contacts.student_id
    )
  );

CREATE POLICY "Parents can delete emergency contacts for their children"
  ON emergency_contacts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_child_links.parent_id = auth.uid()
      AND parent_child_links.child_id = emergency_contacts.student_id
    )
  );

-- Students can view their own emergency contacts
CREATE POLICY "Students can view their own emergency contacts"
  ON emergency_contacts FOR SELECT
  USING (
    emergency_contacts.student_id = auth.uid()
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_emergency_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_emergency_contacts_updated_at
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_emergency_contacts_updated_at();
