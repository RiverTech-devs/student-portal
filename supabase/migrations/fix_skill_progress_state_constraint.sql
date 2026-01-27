-- Fix skill_progress state constraint to include 'activated' state
-- The original migration's DO block may have failed silently

-- Drop the existing constraint
ALTER TABLE skill_progress DROP CONSTRAINT IF EXISTS skill_progress_state_check;

-- Recreate with all valid states including 'activated'
ALTER TABLE skill_progress ADD CONSTRAINT skill_progress_state_check
  CHECK (state IN ('locked', 'available', 'in_progress', 'mastered', 'activated'));
