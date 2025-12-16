-- Add date of birth field to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

COMMENT ON COLUMN user_profiles.date_of_birth IS 'Student date of birth';
