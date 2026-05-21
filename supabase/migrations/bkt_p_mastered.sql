-- Phase 2 — Bayesian Knowledge Tracing (BKT) per-skill mastery probability.
--
-- Additive only. The existing mastery_score (0-100 int) and discrete state
-- columns remain so existing UI and analytics keep working. The discrete
-- state is now derivable from p_mastered using fixed thresholds:
--   p >= 0.85 → mastered
--   p >= 0.60 → activated
--   p >= 0.30 → in_progress
--   p >= 0.05 → available
--   else      → locked
-- but we don't enforce that in the DB so legacy callers don't break.
--
-- last_evidence_at is when a real student response last updated p_mastered.
-- Distinct from last_practiced (which counts any practice touch) so the
-- forthcoming decay job can target stale Bayesian estimates specifically.

ALTER TABLE skill_progress
ADD COLUMN IF NOT EXISTS p_mastered REAL DEFAULT 0.05 CHECK (p_mastered >= 0 AND p_mastered <= 1);

ALTER TABLE skill_progress
ADD COLUMN IF NOT EXISTS last_evidence_at TIMESTAMPTZ;

COMMENT ON COLUMN skill_progress.p_mastered IS
  'Bayesian probability of mastery (0.0–1.0). Updated per question via the BKT update rule. The integer mastery_score is kept in sync (= round(p*100)) for legacy callers.';

COMMENT ON COLUMN skill_progress.last_evidence_at IS
  'Timestamp of the most recent BKT update from a real student response. Used by the future decay job to identify stale estimates. Distinct from last_practiced which may include passive touches.';

-- Backfill p_mastered from the existing integer mastery_score so we don't
-- reset every student's progress to 0.05. Clamp to (0.01, 0.99) to keep
-- update math well-conditioned (denominators in the Bayes step are never
-- exactly zero).
UPDATE skill_progress
SET p_mastered = LEAST(0.99, GREATEST(0.01, mastery_score::REAL / 100.0))
WHERE mastery_score IS NOT NULL AND mastery_score > 0;

-- Backfill last_evidence_at from last_practiced for existing rows so the
-- future decay job has a sensible starting point.
UPDATE skill_progress
SET last_evidence_at = last_practiced
WHERE last_evidence_at IS NULL AND last_practiced IS NOT NULL;

-- Index for the decay job: find users whose evidence is stale enough to
-- decay. Partial index keeps it small (only rows that have been touched).
CREATE INDEX IF NOT EXISTS idx_skill_progress_last_evidence_at
ON skill_progress(user_id, last_evidence_at)
WHERE last_evidence_at IS NOT NULL;
