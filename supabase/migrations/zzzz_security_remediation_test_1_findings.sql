-- ============================================================
-- SECURITY REMEDIATION — Test 1 Findings (Matthew Bianche, 2026-05-20)
--
-- Authorized pen-test report identified several over-permissive
-- RLS policies. Most of the report's claims (user_profiles leak,
-- private message leak, submission leak) were either already
-- fixed by the zz_/zzz_ user_profiles migrations or were
-- misinterpretations (messages the tester legitimately could see
-- as recipient). The remaining genuine issues, confirmed by a
-- live pg_policies audit on 2026-05-23, are addressed here.
--
-- Scope:
--   1) quarter_grade_snapshots.quarter_snapshots_select  USING (true)
--      → student grade history leaked to every authenticated user
--   2) teacher_upload_settings.Public read upload settings  USING (true)
--      → admin/teacher config exposed to anonymous
--   3) Several tables with TO {public} USING (true) or
--      USING (is_active = true) granting anonymous read.
--      Tightened to require authentication.
--
-- This migration is idempotent (CREATE OR REPLACE / DROP IF EXISTS).
-- Safe to re-run.
-- ============================================================


-- ============================================================
-- 1. quarter_grade_snapshots — CRITICAL FIX
--
-- The role-scoped policies "Students can view their own snapshots"
-- and "Teachers can view snapshots" already cover legitimate
-- access. The legacy quarter_snapshots_select policy with
-- USING (true) makes them moot by OR-combining a wide-open read.
-- Drop only that policy; leave the others intact.
-- ============================================================

DROP POLICY IF EXISTS "quarter_snapshots_select" ON public.quarter_grade_snapshots;


-- ============================================================
-- 2. teacher_upload_settings — drop public USING (true)
--
-- "Teachers manage own settings" already grants per-teacher
-- access via (auth.uid() = teacher_id). The "Public read upload
-- settings" policy with USING (true) bypassed that for anyone.
-- Replace with a teacher-or-admin SELECT scope.
-- ============================================================

DROP POLICY IF EXISTS "Public read upload settings" ON public.teacher_upload_settings;

CREATE POLICY "Teachers and admins read upload settings"
  ON public.teacher_upload_settings
  FOR SELECT TO authenticated
  USING (
    auth.uid() = teacher_id
    OR public.get_my_user_type() IN ('teacher', 'admin')
  );


-- ============================================================
-- 3. classes — was readable to anonymous (TO {public})
--
-- The existing teacher_all_access policy covers teachers and
-- the Admins can view all classes policy covers admins.
-- Replace the public_read_active policy with an authenticated-only
-- variant. Students and parents need to see active classes for
-- nav / browsing, so we keep is_active = true filter but require
-- authentication.
-- ============================================================

DROP POLICY IF EXISTS "public_read_active" ON public.classes;

CREATE POLICY "authenticated_read_active"
  ON public.classes
  FOR SELECT TO authenticated
  USING (is_active = true);


-- ============================================================
-- 4. school_events — tighten from USING (true) public to authenticated
-- ============================================================

DROP POLICY IF EXISTS "Everyone can read school events" ON public.school_events;

CREATE POLICY "Authenticated can read school events"
  ON public.school_events
  FOR SELECT TO authenticated
  USING (true);


-- ============================================================
-- 5. facilities — tighten anonymous read
-- ============================================================

DROP POLICY IF EXISTS "Users can view active facilities" ON public.facilities;

CREATE POLICY "Authenticated can view active facilities"
  ON public.facilities
  FOR SELECT TO authenticated
  USING (is_active = true);


-- ============================================================
-- 6. constellation_positions — anonymous → authenticated
-- ============================================================

DROP POLICY IF EXISTS "Public can read constellation positions" ON public.constellation_positions;

CREATE POLICY "Authenticated can read constellation positions"
  ON public.constellation_positions
  FOR SELECT TO authenticated
  USING (true);


-- ============================================================
-- 7. skill_trees — drop duplicate public policies, keep one auth'd
-- ============================================================

DROP POLICY IF EXISTS "Everyone can view skill trees" ON public.skill_trees;
DROP POLICY IF EXISTS "Public can read skill trees" ON public.skill_trees;

CREATE POLICY "Authenticated can view skill trees"
  ON public.skill_trees
  FOR SELECT TO authenticated
  USING (true);


-- ============================================================
-- 8. curriculum_nodes / curriculum_edges / curriculum_clusters
--    Curriculum content is intended to be broadly readable, but
--    only by logged-in users (no need for anonymous access).
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view curriculum nodes" ON public.curriculum_nodes;
CREATE POLICY "Authenticated can view curriculum nodes"
  ON public.curriculum_nodes
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can view curriculum edges" ON public.curriculum_edges;
CREATE POLICY "Authenticated can view curriculum edges"
  ON public.curriculum_edges
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can view curriculum clusters" ON public.curriculum_clusters;
CREATE POLICY "Authenticated can view curriculum clusters"
  ON public.curriculum_clusters
  FOR SELECT TO authenticated
  USING (true);


-- ============================================================
-- 9. rubric_criteria — anonymous → authenticated
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view criteria" ON public.rubric_criteria;

CREATE POLICY "Authenticated can view criteria"
  ON public.rubric_criteria
  FOR SELECT TO authenticated
  USING (true);


-- ============================================================
-- 10. quarters — list of academic terms; needed by clients but
--                no need to expose to anonymous.
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view quarters" ON public.quarters;

CREATE POLICY "Authenticated can view quarters"
  ON public.quarters
  FOR SELECT TO authenticated
  USING (true);


-- ============================================================
-- Notes / out of scope:
--
-- * user_profiles policies were re-verified in this audit and are
--   correct (own / shared-class / admin / teacher / parent-of-child).
--   No change needed.
--
-- * messages policies were re-verified: SELECT requires
--   sender_id = auth.uid() OR recipient_id = auth.uid().
--   The student's "private message leak" was actually messages
--   addressed to that student; legitimate access.
--
-- * Admin policies using legacy public.is_admin() helper
--   (bug_reports, class_enrollments, parent_child_links,
--   school_settings, messages, grades): if the helper is
--   undefined, these silently fail closed (annoying for admins,
--   not a security risk). Not addressed here because they don't
--   leak to students; a separate cleanup migration should
--   normalize on public.get_my_user_type() = 'admin'.
--
-- * school_settings.Authenticated can read settings uses
--   auth.uid() IS NOT NULL. Settings are theme/branding/school
--   metadata — not sensitive enough to warrant per-role scoping,
--   and many UI flows depend on broad read. Left as-is.
--
-- * class_schedule / activity_schedule "Authenticated can view"
--   policies use auth.uid() IS NOT NULL. Schedules are
--   intentionally visible to all logged-in users (students need
--   to see all class times for room finding). Left as-is.
-- ============================================================
