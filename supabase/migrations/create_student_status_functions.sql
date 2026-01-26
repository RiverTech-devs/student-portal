-- Create student status functions
-- Run this in Supabase SQL Editor to fix 404 errors for mark_student_as_past

-- ============================================
-- STEP 1: Add columns to user_profiles if missing
-- ============================================
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS student_status TEXT DEFAULT 'active';

-- Add check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_student_status_check'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_student_status_check
    CHECK (student_status IN ('active', 'past'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS left_date DATE;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS left_reason TEXT;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_student_status
ON user_profiles(student_status) WHERE user_type = 'student';

-- ============================================
-- STEP 2: Update class_enrollments constraint
-- ============================================
-- First, update any non-standard status values to 'inactive'
UPDATE class_enrollments
SET status = 'inactive'
WHERE status NOT IN ('active', 'inactive', 'archived');

-- Drop existing constraint if any
ALTER TABLE class_enrollments
DROP CONSTRAINT IF EXISTS class_enrollments_status_check;

-- Add new constraint allowing archived status
DO $$
BEGIN
  ALTER TABLE class_enrollments
  ADD CONSTRAINT class_enrollments_status_check
  CHECK (status IN ('active', 'inactive', 'archived'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- STEP 3: Create mark_student_as_past function
-- ============================================
DROP FUNCTION IF EXISTS mark_student_as_past(UUID, DATE, TEXT);

CREATE OR REPLACE FUNCTION mark_student_as_past(
  p_student_id UUID,
  p_left_date DATE DEFAULT CURRENT_DATE,
  p_left_reason TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update student status
  UPDATE public.user_profiles
  SET
    student_status = 'past',
    left_date = p_left_date,
    left_reason = p_left_reason
  WHERE id = p_student_id AND user_type = 'student';

  -- Archive all active enrollments (preserves grades and history)
  UPDATE public.class_enrollments
  SET status = 'archived'
  WHERE student_id = p_student_id AND status = 'active';
END;
$$;

-- ============================================
-- STEP 4: Create reactivate_student function
-- ============================================
DROP FUNCTION IF EXISTS reactivate_student(UUID);

CREATE OR REPLACE FUNCTION reactivate_student(
  p_student_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update student status back to active
  UPDATE public.user_profiles
  SET
    student_status = 'active',
    left_date = NULL,
    left_reason = NULL
  WHERE id = p_student_id AND user_type = 'student';

  -- Note: Enrollments remain archived - admin must manually re-enroll student in classes
END;
$$;

-- ============================================
-- STEP 5: Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION mark_student_as_past(UUID, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_student_as_past(UUID, DATE, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION reactivate_student(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reactivate_student(UUID) TO service_role;
