-- Migration: Add missing fields to enrollment_applications
-- Adds: student phone, expanded emergency contact fields,
-- dietary/physical/emergency medical fields, and waiver checkboxes

-- Student phone number (Step 1)
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS student_phone TEXT;

-- Medical fields that exist in student_medical_info but were missing from enrollment (Step 4)
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS medical_dietary_restrictions TEXT;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS medical_physical_limitations TEXT;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS medical_emergency_instructions TEXT;

-- Waiver/consent checkboxes (Step 5)
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS waiver_insurance BOOLEAN DEFAULT false;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS waiver_media_release BOOLEAN DEFAULT false;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS waiver_liability BOOLEAN DEFAULT false;
ALTER TABLE enrollment_applications ADD COLUMN IF NOT EXISTS waiver_emergency_medical_auth BOOLEAN DEFAULT false;

-- Note: emergency_contacts JSONB array items will now also include:
--   email (optional), phone_secondary (optional), notes (optional)
-- No schema change needed since it's JSONB, just expanded in the form.
