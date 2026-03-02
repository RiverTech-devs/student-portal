-- Migration: Enrollment Applications System
-- Creates the enrollment_applications table for the enrollment/registration pipeline

-- Table: enrollment_applications
CREATE TABLE IF NOT EXISTS enrollment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT UNIQUE NOT NULL,
  school_year TEXT NOT NULL, -- e.g., '2026-2027'
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'denied', 'waitlisted', 'withdrawn')),
  application_type TEXT NOT NULL DEFAULT 'new'
    CHECK (application_type IN ('new', 're-enrollment')),
  family_application_id UUID DEFAULT gen_random_uuid(),
    -- Shared across sibling applications submitted together

  -- Student Info (Step 1 — one row per student)
  student_first_name TEXT NOT NULL,
  student_last_name TEXT NOT NULL,
  student_dob DATE NOT NULL,
  student_gender TEXT,
  student_grade_applying TEXT NOT NULL,
  student_enrollment_type TEXT DEFAULT 'full-time'
    CHECK (student_enrollment_type IN ('full-time', 'homeschool')),
  student_email TEXT, -- Optional: only required for full-time students
  student_previous_school TEXT,
  student_address_line1 TEXT,
  student_address_line2 TEXT,
  student_city TEXT,
  student_state TEXT,
  student_zip TEXT,

  -- Parent/Guardian Info (Step 2)
  parent1_first_name TEXT NOT NULL,
  parent1_last_name TEXT NOT NULL,
  parent1_email TEXT NOT NULL,
  parent1_phone TEXT NOT NULL,
  parent1_relationship TEXT, -- mother, father, guardian, other
  parent2_first_name TEXT,
  parent2_last_name TEXT,
  parent2_email TEXT,
  parent2_phone TEXT,
  parent2_relationship TEXT,

  -- Emergency Contacts (Step 3) — stored as JSONB array
  emergency_contacts JSONB DEFAULT '[]',
    -- Each: { name, relationship, phone, is_authorized_pickup: bool }

  -- Medical Info (Step 4)
  medical_allergies TEXT,
  medical_conditions TEXT,
  medical_medications TEXT,
  medical_doctor_name TEXT,
  medical_doctor_phone TEXT,
  medical_insurance_provider TEXT,
  medical_insurance_policy TEXT,
  medical_notes TEXT,

  -- Agreements (Step 5)
  agreed_to_terms BOOLEAN DEFAULT false,
  agreed_to_privacy BOOLEAN DEFAULT false,
  parent_signature TEXT, -- typed name as signature
  signature_date DATE,

  -- Metadata
  existing_student_id UUID REFERENCES user_profiles(id),
  existing_parent_id UUID REFERENCES user_profiles(id),
  reviewed_by UUID REFERENCES user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  denial_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-increment application number function
CREATE OR REPLACE FUNCTION generate_application_number(p_school_year TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_prefix TEXT;
  max_num INT;
  next_num INT;
BEGIN
  -- Extract the first year from school_year (e.g., '2026' from '2026-2027')
  year_prefix := split_part(p_school_year, '-', 1);

  -- Find the max existing number for this school year
  SELECT COALESCE(MAX(
    CAST(split_part(application_number, '-', 3) AS INT)
  ), 0)
  INTO max_num
  FROM enrollment_applications
  WHERE school_year = p_school_year;

  next_num := max_num + 1;

  RETURN 'ENR-' || year_prefix || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enrollment_status ON enrollment_applications(status);
CREATE INDEX IF NOT EXISTS idx_enrollment_school_year ON enrollment_applications(school_year);
CREATE INDEX IF NOT EXISTS idx_enrollment_parent_email ON enrollment_applications(parent1_email);
CREATE INDEX IF NOT EXISTS idx_enrollment_student_name ON enrollment_applications(student_last_name, student_first_name);
CREATE INDEX IF NOT EXISTS idx_enrollment_family_id ON enrollment_applications(family_application_id);

-- Comments
COMMENT ON TABLE enrollment_applications IS 'Enrollment/registration applications for prospective and returning families';
COMMENT ON COLUMN enrollment_applications.family_application_id IS 'Shared UUID across sibling applications submitted together as one family';
COMMENT ON COLUMN enrollment_applications.student_email IS 'Optional — only required for full-time students; NULL for homeschool';

-- RLS Policies
ALTER TABLE enrollment_applications ENABLE ROW LEVEL SECURITY;

-- Admins have full CRUD
CREATE POLICY "Admins have full access to enrollment_applications"
  ON enrollment_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Parents (authenticated) can view their own applications
CREATE POLICY "Parents can view their own enrollment applications"
  ON enrollment_applications FOR SELECT
  USING (
    parent1_email = (
      SELECT email FROM user_profiles WHERE id = auth.uid()
    )
    OR existing_parent_id = auth.uid()
  );

-- Parents can update their own draft/submitted applications
CREATE POLICY "Parents can update their own applications"
  ON enrollment_applications FOR UPDATE
  USING (
    (
      parent1_email = (
        SELECT email FROM user_profiles WHERE id = auth.uid()
      )
      OR existing_parent_id = auth.uid()
    )
    AND status IN ('draft', 'submitted')
  );

-- Anonymous users can insert new applications (public form)
CREATE POLICY "Anon can insert enrollment applications"
  ON enrollment_applications FOR INSERT
  WITH CHECK (true);

-- Grant anon INSERT permission
GRANT INSERT ON enrollment_applications TO anon;
GRANT SELECT, UPDATE ON enrollment_applications TO authenticated;
GRANT ALL ON enrollment_applications TO authenticated;

-- Trigger: auto-update updated_at on modification
CREATE OR REPLACE FUNCTION update_enrollment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enrollment_updated_at
  BEFORE UPDATE ON enrollment_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_updated_at();
