-- Add node_id column to skill_progress to bridge to curriculum_nodes.
-- This is ADDITIVE ONLY — no existing data is modified or deleted.
-- The column is optional (nullable) so all existing rows remain valid.

ALTER TABLE skill_progress
ADD COLUMN IF NOT EXISTS node_id TEXT;

-- Index for lookups by node_id
CREATE INDEX IF NOT EXISTS idx_skill_progress_node_id ON skill_progress(node_id);

-- Backfill node_id for existing rows by matching subject + skill_name
-- to curriculum_nodes legacy_subject + legacy_name
UPDATE skill_progress sp
SET node_id = cn.id
FROM curriculum_nodes cn
WHERE sp.node_id IS NULL
  AND cn.legacy_subject = sp.subject
  AND cn.legacy_name = sp.skill_name;
