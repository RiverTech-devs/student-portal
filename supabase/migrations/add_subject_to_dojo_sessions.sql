-- Add a subject column to math_dojo_sessions so the same table can record
-- practice sessions for more than one subject (Math Dojo + the new English
-- Lyceum trainer, which logs sessions with subject='Reading').
--
-- ADDITIVE ONLY — no existing data is modified or deleted. The default 'Math'
-- backfills every existing row to its true subject, so all current Math Dojo
-- analytics keep working unchanged. Readers that want Math-only numbers should
-- filter with `.eq('subject','Math')`.

ALTER TABLE math_dojo_sessions
ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT 'Math';

-- Most weekly/teacher queries scan by (user_id, created_at); add subject to a
-- composite index so per-subject activity rollups stay fast.
CREATE INDEX IF NOT EXISTS idx_math_dojo_sessions_user_subject
    ON math_dojo_sessions(user_id, subject, created_at DESC);

COMMENT ON COLUMN math_dojo_sessions.subject IS
'Curriculum subject this practice session belongs to (matches skill_progress.subject). ''Math'' = Math Dojo; ''Reading'' = English Lyceum. Defaults to ''Math'' for backwards compatibility.';
