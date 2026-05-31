-- Track WHERE a skill_progress row came from.
--
-- Background: math-tutor (the desktop app at densanon-devs/math-tutor)
-- pushes mastery updates to skill_progress under the student's own JWT.
-- The teacher dashboard needs to distinguish those auto-pushes from
-- manual teacher updates so it can render a focused "Math Tutor Activity"
-- feed without rescanning Mathletics / Dojo / homework pushes.
--
-- Schema additions are NULLABLE with a sensible default so existing rows
-- stay interpretable — anything pre-migration is treated as 'manual'.

ALTER TABLE skill_progress
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

ALTER TABLE skill_progress
  ADD COLUMN IF NOT EXISTS client_version TEXT;

-- Soft constraint: allow new sources later without a migration.
DO $$
BEGIN
  ALTER TABLE skill_progress DROP CONSTRAINT IF EXISTS skill_progress_source_check;
  ALTER TABLE skill_progress
    ADD CONSTRAINT skill_progress_source_check
    CHECK (source IS NULL OR source IN (
      'manual',         -- teacher entered manually via the portal
      'math-tutor',     -- desktop app at densanon-devs/math-tutor
      'mathletics',     -- in-portal math competition
      'dojo',           -- in-portal skill dojo
      'homework',       -- pushed by an assignment system
      'other'
    ));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

COMMENT ON COLUMN skill_progress.source IS
  'Where this row was last written. Default ''manual''. ''math-tutor'' '
  'is the desktop app at densanon-devs/math-tutor. Drives the teacher '
  '''Math Tutor Activity'' dashboard card.';

COMMENT ON COLUMN skill_progress.client_version IS
  'Free-text version stamp from the writer (e.g., math-tutor-0.1.0). '
  'For incident forensics — never gate behavior on this.';

-- Index for the teacher dashboard ''recent math-tutor updates'' query.
CREATE INDEX IF NOT EXISTS idx_skill_progress_source_updated
  ON skill_progress(source, updated_at DESC)
  WHERE source = 'math-tutor';
