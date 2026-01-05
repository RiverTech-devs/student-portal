-- Add student_status column to user_profiles
-- Allows marking students as 'active' or 'past' (graduated/left)
-- Past students' records are preserved but they are excluded from active class operations

-- Add student_status column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS student_status TEXT DEFAULT 'active' CHECK (student_status IN ('active', 'past'));

-- Add left_date to track when student left (for past students)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS left_date DATE;

-- Add left_reason to track why student left
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS left_reason TEXT;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_student_status
ON user_profiles(student_status) WHERE user_type = 'student';

-- Update class_enrollments to have an 'archived' status for past students
-- This preserves their enrollment history while removing them from active class lists
-- First, update any non-standard status values to 'inactive'
UPDATE class_enrollments
SET status = 'inactive'
WHERE status NOT IN ('active', 'inactive', 'archived');

-- Drop existing constraint if any
ALTER TABLE class_enrollments
DROP CONSTRAINT IF EXISTS class_enrollments_status_check;

-- Add new constraint allowing archived status
ALTER TABLE class_enrollments
ADD CONSTRAINT class_enrollments_status_check
CHECK (status IN ('active', 'inactive', 'archived'));

-- Create function to mark student as past and archive their enrollments
CREATE OR REPLACE FUNCTION mark_student_as_past(
  p_student_id UUID,
  p_left_date DATE DEFAULT CURRENT_DATE,
  p_left_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update student status
  UPDATE user_profiles
  SET
    student_status = 'past',
    left_date = p_left_date,
    left_reason = p_left_reason
  WHERE id = p_student_id AND user_type = 'student';

  -- Archive all active enrollments (preserves grades and history)
  UPDATE class_enrollments
  SET status = 'archived'
  WHERE student_id = p_student_id AND status = 'active';
END;
$$;

-- Create function to reactivate a past student
CREATE OR REPLACE FUNCTION reactivate_student(
  p_student_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update student status back to active
  UPDATE user_profiles
  SET
    student_status = 'active',
    left_date = NULL,
    left_reason = NULL
  WHERE id = p_student_id AND user_type = 'student';

  -- Note: Enrollments remain archived - admin must manually re-enroll student in classes
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_student_as_past TO authenticated;
GRANT EXECUTE ON FUNCTION reactivate_student TO authenticated;
