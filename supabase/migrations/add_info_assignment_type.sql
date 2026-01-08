-- Add 'info' to allowed assignment_type values
-- This allows creating information-only assignments that don't require submission

-- Drop the old constraint FIRST (before any updates)
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_assignment_type_check;

-- Now update any NULL or invalid values to 'regular'
UPDATE assignments SET assignment_type = 'regular'
WHERE assignment_type IS NULL
   OR assignment_type NOT IN ('regular', 'game', 'skill_mastery', 'info');

-- Add the new constraint with 'info' included
ALTER TABLE assignments ADD CONSTRAINT assignments_assignment_type_check
  CHECK (assignment_type IN ('regular', 'game', 'skill_mastery', 'info'));
