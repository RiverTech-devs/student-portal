-- Persist Math Dojo sub-skill gating progress on the user profile.
-- Stored as JSONB keyed by "${tier}_${domain}" → array of completed sub-skill ids,
-- mirroring the structure of state.completedSubSkills in games/math-dojo.html.
-- Example:
--   {
--     "7_Probability": ["basic", "complement"],
--     "6_Area": ["rectangle", "square", "triangle"]
--   }
--
-- This is ADDITIVE ONLY — no existing data is modified or deleted.
-- Nullable so every existing row stays valid without a backfill.

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS dojo_subskill_progress JSONB DEFAULT '{}'::jsonb;

-- No index needed — this column is only ever queried by user_profiles.id,
-- which is already the primary key.

COMMENT ON COLUMN user_profiles.dojo_subskill_progress IS
'Math Dojo sub-skill gating state: { "tier_domain": ["subSkillId", ...], ... }. Written by portal handleDogoSubSkillProgress, read by sendDogoSubSkillProgress on Dojo load. Maps to state.completedSubSkills in games/math-dojo.html.';
