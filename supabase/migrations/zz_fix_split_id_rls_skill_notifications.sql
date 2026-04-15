-- ============================================================
-- FIX: Math Dojo / Mathletics / Wasteland silently drop progress
-- writes for users whose user_profiles.id ≠ auth.uid() (split-id
-- accounts, e.g. those created via the Supabase admin invite path
-- or migrated from an older unified scheme).
--
-- Symptom observed:
--   * Students play Math Dojo, complete a skill, watch the UI say
--     "mastered", but no RTC is awarded and the skill tree in the
--     portal doesn't update. Same for Mathletics and Wasteland.
--
-- Root cause:
--   The client-side handlers (index.html::saveSkillToSupabase,
--   handleSkillPractice, handleGameSessionComplete, portal/index.html::
--   handleDogoSkillProgress, …) write using:
--
--     user_id = portalAuth.getUserInfo().profile.id   // user_profiles.id
--
--   But the existing RLS policies on skill_progress (from
--   skill_progress_enhanced.sql), skill_practice_sessions (from
--   homework_assignments.sql) and notifications (from
--   notifications_table.sql) compare:
--
--     USING (user_id = auth.uid())
--
--   For legacy unified accounts where user_profiles.id == auth.uid(),
--   both comparisons succeed and Math Dojo works. For split-id
--   accounts where user_profiles.id != auth.uid(), the INSERT / SELECT
--   / UPDATE is silently rejected by RLS, the skill mastery trigger
--   never fires, and no RTC is awarded. From the student's perspective
--   the game appears to "not work".
--
--   This is the same class of bug that zz_harden_rtc_transaction_forge_
--   vectors.sql fixed for rtc_transactions (using get_my_user_type()
--   which resolves via auth_user_id internally).
--
-- Fix:
--   1. Add a SECURITY DEFINER helper public.get_my_profile_id() that
--      resolves the caller's user_profiles.id via auth_user_id.
--   2. Rewrite the student-self policies on skill_progress,
--      skill_practice_sessions, and notifications to accept either
--      match:
--        user_id = auth.uid()                   -- legacy unified
--        OR user_id = public.get_my_profile_id() -- split-id
--
--   The dual-match is intentional: some older rows were inserted
--   with user_id = auth.uid() when the account was unified, and those
--   must remain readable after a profile migration. New inserts go
--   through the profile.id path.
-- ============================================================

-- 1. Helper: resolve the caller's user_profiles.id.
--    SECURITY DEFINER so it bypasses user_profiles RLS (no recursion).
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT id FROM public.user_profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO anon;

-- ============================================================
-- 2. skill_progress — student-self policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own skill progress" ON public.skill_progress;
CREATE POLICY "Users can view their own skill progress"
  ON public.skill_progress FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id = public.get_my_profile_id()
  );

DROP POLICY IF EXISTS "Users can insert their own skill progress" ON public.skill_progress;
CREATE POLICY "Users can insert their own skill progress"
  ON public.skill_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR user_id = public.get_my_profile_id()
  );

DROP POLICY IF EXISTS "Users can update their own skill progress" ON public.skill_progress;
CREATE POLICY "Users can update their own skill progress"
  ON public.skill_progress FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id = public.get_my_profile_id()
  )
  WITH CHECK (
    user_id = auth.uid()
    OR user_id = public.get_my_profile_id()
  );

-- ============================================================
-- 3. skill_practice_sessions — student-self policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own practice sessions" ON public.skill_practice_sessions;
CREATE POLICY "Users can view their own practice sessions"
  ON public.skill_practice_sessions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id = public.get_my_profile_id()
  );

DROP POLICY IF EXISTS "Users can insert their own practice sessions" ON public.skill_practice_sessions;
CREATE POLICY "Users can insert their own practice sessions"
  ON public.skill_practice_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR user_id = public.get_my_profile_id()
  );

-- ============================================================
-- 4. notifications — student-self policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id = public.get_my_profile_id()
  );

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id = public.get_my_profile_id()
  )
  WITH CHECK (
    user_id = auth.uid()
    OR user_id = public.get_my_profile_id()
  );

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id = public.get_my_profile_id()
  );

-- ============================================================
-- Done. Split-id students now hit the Math Dojo / Mathletics /
-- Wasteland gamification path successfully: skill_progress upserts
-- land, the rtc_skill_mastery_reward trigger fires, and RTC is
-- awarded via process_rtc_transaction as designed.
-- ============================================================
