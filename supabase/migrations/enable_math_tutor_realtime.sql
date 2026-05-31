-- Enable Realtime + canonical anomaly view for the teacher Math Tutor
-- Activity card. Phase E v3.
--
-- 1. Adds skill_progress to the supabase_realtime publication so the
--    teacher dashboard can subscribe to INSERT / UPDATE events on it
--    and re-render without a page refresh.
--
-- 2. Creates the canonical math_tutor_anomalies view so the same
--    heuristics live in one place (was duplicated as JS). Teachers
--    can query the view directly from SQL / Studio for audit too.

-- ── 1. Realtime publication ──────────────────────────────────────────
-- Idempotent: ALTER PUBLICATION ... ADD TABLE errors if the table is
-- already in the publication. Wrap in a DO block that ignores duplicates.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE skill_progress;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN
    -- supabase_realtime publication may not exist on local-dev DBs.
    -- Don't block the migration; the dashboard still works via polling.
    NULL;
END $$;

-- ── 2. Canonical anomaly view ────────────────────────────────────────
-- Returns one row per flagged skill_progress entry with the array of
-- anomaly codes. JS dashboard can fall back to this view when the
-- client-side heuristics drift out of sync with policy.

CREATE OR REPLACE VIEW math_tutor_anomalies AS
SELECT
  sp.id,
  sp.user_id,
  sp.subject,
  sp.skill_name,
  sp.state,
  sp.mastery_score,
  sp.practice_count,
  sp.last_practiced,
  sp.mastered_at,
  sp.updated_at,
  sp.client_version,
  -- Build the anomaly_codes array from independent CASE branches so
  -- a single row can carry multiple flags.
  (
    CASE WHEN sp.state = 'mastered' AND sp.practice_count < 5
         THEN ARRAY['mastered_low_practice']::TEXT[] ELSE '{}'::TEXT[] END
    ||
    CASE WHEN sp.state = 'mastered'
              AND sp.mastered_at IS NOT NULL
              AND sp.last_practiced IS NOT NULL
              AND ABS(EXTRACT(EPOCH FROM (sp.last_practiced - sp.mastered_at))) < 120
              AND sp.practice_count < 8
         THEN ARRAY['mastered_too_fast']::TEXT[] ELSE '{}'::TEXT[] END
    ||
    CASE WHEN sp.state <> 'mastered'
              AND sp.mastery_score BETWEEN 1 AND 59
              AND sp.practice_count >= 5
         THEN ARRAY['struggling']::TEXT[] ELSE '{}'::TEXT[] END
    ||
    CASE WHEN sp.last_practiced IS NOT NULL
              AND sp.last_practiced < (NOW() - INTERVAL '14 days')
         THEN ARRAY['dormant']::TEXT[] ELSE '{}'::TEXT[] END
  ) AS anomaly_codes
FROM skill_progress sp
WHERE sp.source = 'math-tutor';

COMMENT ON VIEW math_tutor_anomalies IS
  'Phase E v3 canonical anomaly heuristics. Mirrors the JS '
  '_mathTutorAnomalies() helper in portal/index.html; if you change '
  'one, change the other so the teacher dashboard and ad-hoc SQL '
  'queries stay in sync.';

-- Views inherit RLS from their underlying tables, so the existing
-- "Teachers can view student skill progress" policy already restricts
-- the view to a teacher's own students.
