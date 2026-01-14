-- Add 'test' to allowed assignment_type values
-- This allows tests from the Testing Center to be linked to the assignments table
-- so test scores flow into the quarterly gradebook

-- Drop existing constraint
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_assignment_type_check;

-- Add new constraint with 'test' included
ALTER TABLE assignments ADD CONSTRAINT assignments_assignment_type_check
  CHECK (assignment_type IN ('regular', 'game', 'skill_mastery', 'info', 'test'));

-- Add comment for documentation
COMMENT ON CONSTRAINT assignments_assignment_type_check ON assignments IS
  'Allowed assignment types: regular (homework), game (play-based), skill_mastery (practice until mastered), info (announcement), test (Testing Center exam)';
