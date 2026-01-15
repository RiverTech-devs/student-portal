-- Fix foreign key constraints to reference user_profiles instead of auth.users
-- This allows managing data for students with unactivated accounts

-- Emergency contacts: change student_id FK from auth.users to user_profiles
ALTER TABLE emergency_contacts
DROP CONSTRAINT IF EXISTS emergency_contacts_student_id_fkey;

ALTER TABLE emergency_contacts
ADD CONSTRAINT emergency_contacts_student_id_fkey
FOREIGN KEY (student_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Student medical info: change student_id FK from auth.users to user_profiles
ALTER TABLE student_medical_info
DROP CONSTRAINT IF EXISTS student_medical_info_student_id_fkey;

ALTER TABLE student_medical_info
ADD CONSTRAINT student_medical_info_student_id_fkey
FOREIGN KEY (student_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Student waivers: change student_id FK from auth.users to user_profiles
ALTER TABLE student_waivers
DROP CONSTRAINT IF EXISTS student_waivers_student_id_fkey;

ALTER TABLE student_waivers
ADD CONSTRAINT student_waivers_student_id_fkey
FOREIGN KEY (student_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Student strikes: change student_id FK from auth.users to user_profiles
ALTER TABLE student_strikes
DROP CONSTRAINT IF EXISTS student_strikes_student_id_fkey;

ALTER TABLE student_strikes
ADD CONSTRAINT student_strikes_student_id_fkey
FOREIGN KEY (student_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
