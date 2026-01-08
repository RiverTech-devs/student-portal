-- Add 'info' to allowed assignment_type values
-- This allows creating information-only assignments that don't require submission

ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_assignment_type_check;

ALTER TABLE assignments ADD CONSTRAINT assignments_assignment_type_check
  CHECK (assignment_type IN ('regular', 'game', 'skill_mastery', 'info'));
