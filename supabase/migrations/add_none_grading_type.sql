-- Add 'none' to allowed grading_type values
-- This allows info-only assignments that have no grading

-- Drop the old constraint first
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_grading_type_check;

-- Add the new constraint with 'none' included
ALTER TABLE assignments ADD CONSTRAINT assignments_grading_type_check
  CHECK (grading_type IN ('rubric', 'points', 'none'));
