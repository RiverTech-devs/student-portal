-- Add course_weight column to classes table
-- Values: 'normal' (default), 'honors' (+0.5 GPA boost), 'ap' (+1.0 GPA boost), 'dual_credit' (+1.0 GPA boost)
-- Only admins can modify this field

ALTER TABLE classes
ADD COLUMN IF NOT EXISTS course_weight TEXT DEFAULT 'normal';

-- Add a check constraint to ensure valid values
ALTER TABLE classes
ADD CONSTRAINT valid_course_weight
CHECK (course_weight IN ('normal', 'honors', 'ap', 'dual_credit'));

-- Add a comment for documentation
COMMENT ON COLUMN classes.course_weight IS 'Course weight for GPA calculation: normal (standard), honors (+0.5), ap (+1.0), dual_credit (+1.0)';

-- Create an index for potential filtering by course weight
CREATE INDEX IF NOT EXISTS idx_classes_course_weight
ON classes(course_weight);
