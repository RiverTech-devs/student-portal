-- Fix assignment_students foreign key constraint to reference user_profiles instead of auth.users
-- This allows assigning to records-only students (who don't have auth accounts)

-- Drop the existing foreign key constraint on student_id
ALTER TABLE assignment_students
DROP CONSTRAINT IF EXISTS assignment_students_student_id_fkey;

-- Add new foreign key constraint referencing user_profiles instead of auth.users
ALTER TABLE assignment_students
ADD CONSTRAINT assignment_students_student_id_fkey
FOREIGN KEY (student_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
