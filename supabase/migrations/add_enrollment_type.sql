-- Add enrollment_type column to user_profiles table
-- Values: 'full-time' (default) or 'homeschool'
-- Only applicable to students (user_type = 'student')

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS enrollment_type TEXT DEFAULT 'full-time';

-- Add a check constraint to ensure valid values
ALTER TABLE user_profiles
ADD CONSTRAINT valid_enrollment_type
CHECK (enrollment_type IN ('full-time', 'homeschool') OR enrollment_type IS NULL);

-- Add a comment for documentation
COMMENT ON COLUMN user_profiles.enrollment_type IS 'Student enrollment type: full-time or homeschool. Only applies to users with user_type = student';

-- Create an index for potential filtering by enrollment type
CREATE INDEX IF NOT EXISTS idx_user_profiles_enrollment_type
ON user_profiles(enrollment_type)
WHERE user_type = 'student';
