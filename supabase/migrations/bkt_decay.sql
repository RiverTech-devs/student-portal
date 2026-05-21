-- Phase 2 slice 3 — BKT mastery decay.
--
-- Skills the student hasn't been tested on in a while should drift back
-- toward the cold prior — otherwise stale data props up false confidence.
-- Each 30-day interval since last_evidence_at applies one decay step:
--
--   p_new = 0.9 * p_old + 0.1 * floor_prior
--
-- which is a discrete Ornstein–Uhlenbeck-style pull. The closed form for
-- k steps is p_k = 0.9^k * p_0 + (1 - 0.9^k) * floor_prior, so we can
-- apply any backlog of missed intervals in a single UPDATE.
--
-- We use a conservative flat floor_prior = 0.05 rather than the contextual
-- (cold/sibling/prereqs-met) prior the client computes for FIRST encounter.
-- Decay isn't about cold-starting from a clean slate — it's about saying
-- "the evidence is stale". The student's prereq state is also drifting
-- (everyone decays in parallel) so the relative ordering is preserved
-- without per-skill graph traversal in SQL.
--
-- Trade-offs:
-- - We do NOT downgrade the discrete `state` column. The achieved-mastery
--   badge stays; only p_mastered + mastery_score reflect the decay. A
--   follow-up slice can extend skill_progress_with_decay to surface a
--   `needs_review` effective_state when p_mastered drops below threshold.
-- - decay_steps_applied tracks how many 30-day pulses the row has already
--   absorbed. Real student responses reset it to 0 (portal does this in
--   upsertSkillProgress) so fresh evidence wipes the decay backlog.

ALTER TABLE skill_progress
ADD COLUMN IF NOT EXISTS decay_steps_applied INTEGER DEFAULT 0 CHECK (decay_steps_applied >= 0);

COMMENT ON COLUMN skill_progress.decay_steps_applied IS
  'Number of 30-day decay pulses already applied to p_mastered since last_evidence_at. Reset to 0 when a real student response writes a new p_mastered. Prevents double-decay between cron runs.';

-- ============================================================
-- The decay function. Idempotent: safe to call multiple times per day;
-- only rows where intervals_elapsed > decay_steps_applied get touched.
-- Returns the number of rows updated.
-- ============================================================
CREATE OR REPLACE FUNCTION public.apply_skill_decay()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    WITH calc AS (
        SELECT
            id,
            p_mastered AS p_now,
            COALESCE(decay_steps_applied, 0) AS steps_applied,
            FLOOR(EXTRACT(EPOCH FROM (NOW() - last_evidence_at)) / (30.0 * 86400))::INT AS intervals_elapsed
        FROM skill_progress
        WHERE last_evidence_at IS NOT NULL
          AND p_mastered IS NOT NULL
    ),
    due AS (
        SELECT
            id,
            p_now,
            intervals_elapsed,
            (intervals_elapsed - steps_applied) AS intervals_due
        FROM calc
        WHERE intervals_elapsed - steps_applied > 0
    )
    UPDATE skill_progress sp
    SET
        p_mastered = POWER(0.9, due.intervals_due)::REAL * due.p_now
                     + (1 - POWER(0.9, due.intervals_due)::REAL) * 0.05,
        mastery_score = ROUND(
            (POWER(0.9, due.intervals_due)::REAL * due.p_now
             + (1 - POWER(0.9, due.intervals_due)::REAL) * 0.05) * 100
        )::INT,
        decay_steps_applied = due.intervals_elapsed,
        updated_at = NOW()
    FROM due
    WHERE sp.id = due.id;

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected;
END;
$$;

COMMENT ON FUNCTION public.apply_skill_decay() IS
  'Applies BKT mastery decay to all skill_progress rows whose evidence is older than 30 days × steps already applied. One step = p_new = 0.9*p + 0.1*0.05. Closed-form so any backlog is caught up in a single call. Returns the row count touched.';

-- ============================================================
-- Schedule: daily at 03:30 UTC (off-peak). Matches the rtc_bank_system
-- pattern. pg_cron must be enabled in the Supabase project.
-- ============================================================
DO $$
BEGIN
    -- Drop any existing schedule with this name so re-running the migration
    -- doesn't fail on duplicate, and pick up new timing if we change it.
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'bkt-daily-decay';
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

SELECT cron.schedule(
    'bkt-daily-decay',
    '30 3 * * *',
    $$SELECT public.apply_skill_decay()$$
);

-- ============================================================
-- Manual trigger for admins / tests. Anyone with execute access can call:
--   SELECT public.apply_skill_decay();
-- and the function will respect RLS via SECURITY DEFINER (running as the
-- function owner — typically the postgres role, which has write access
-- to skill_progress).
-- ============================================================
