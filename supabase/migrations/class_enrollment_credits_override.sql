-- Per-student credit override for a class.
--
-- A class normally carries a fixed credit value (classes.credits, default 1).
-- This adds an optional per-enrollment override so a teacher or admin can set
-- a different credit value for an individual student in that class (e.g. a
-- partial-credit or extra-credit arrangement) without changing the class
-- default for everyone else.
--
-- NULL means "no override" -> fall back to classes.credits (then 1).
--
-- No new RLS needed: class_enrollments already has UPDATE policies for the
-- class's teacher (teacher_enrollment_update_policy.sql) and for admins
-- (parent_child_links_admin_policies.sql). Students have no UPDATE policy, so
-- they cannot alter their own credit value.

-- Ensure the class-level default credit column exists (the classes table was
-- created outside the migration history). Existing rows default to 1 credit.
-- Idempotent: safe whether or not the column already exists.
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS credits NUMERIC(4,2) DEFAULT 1;

COMMENT ON COLUMN classes.credits IS
  'Default credit value earned for passing this class. Overridable per student via class_enrollments.credits_override.';

ALTER TABLE class_enrollments
ADD COLUMN IF NOT EXISTS credits_override NUMERIC(4,2);

COMMENT ON COLUMN class_enrollments.credits_override IS
  'Optional per-student credit value for this class. NULL = use classes.credits. Set by teacher/admin.';
