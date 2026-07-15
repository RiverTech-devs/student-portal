-- ============================================================
-- PE Training Log — append-only record of physical capability.
--
-- Unlike quiz subjects, Physical mastery is evidenced by RECORDED
-- PERFORMANCE: fitness measurements (mile time, push-ups, plank...),
-- teacher-observed motor-skill checklists, sport rubrics, and
-- self-logged activity sessions. Each row is one dated entry;
-- history is never overwritten (append-only like math_dojo_sessions).
--
-- verified=true  → teacher/admin-recorded assessment (counts toward mastery)
-- verified=false → student self-log (counts toward habit streaks only)
--
-- Students may only INSERT unverified rows for themselves.
-- Teachers may INSERT/UPDATE rows for students in their classes
-- (split-id aware, same pattern as zz_fix_skill_progress_rls_teacher_split_id.sql).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pe_training_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,                -- curriculum_nodes.id (P1, P-312, ...). No FK: history outlives curriculum reworks.
  entry_type TEXT NOT NULL CHECK (entry_type IN ('measurement','checklist','rubric','activity','plan_review')),
  value NUMERIC,                        -- measurement value (seconds, reps, cm, laps) — NULL for checklist/rubric/activity
  unit TEXT,                            -- 'seconds' | 'reps' | 'cm' | 'laps' | 'jumps'
  detail JSONB NOT NULL DEFAULT '{}'::jsonb, -- checklist: {items:[0|1|2,...]} · rubric: {scores:[1-4 x4]} · activity: {kind, minutes}
  notes TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  recorded_by UUID REFERENCES public.user_profiles(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pe_log_user_node ON public.pe_training_log (user_id, node_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_pe_log_user_time ON public.pe_training_log (user_id, recorded_at DESC);

ALTER TABLE public.pe_training_log ENABLE ROW LEVEL SECURITY;

-- 1. Student-self (split-id aware). SELECT own history; INSERT only
--    unverified self-logs. No student UPDATE/DELETE — append-only.
CREATE POLICY "Users can view their own pe log"
  ON public.pe_training_log FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id = public.get_my_profile_id());

CREATE POLICY "Users can insert their own unverified pe log"
  ON public.pe_training_log FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() OR user_id = public.get_my_profile_id())
    AND verified = false
    AND (recorded_by IS NULL OR recorded_by = auth.uid() OR recorded_by = public.get_my_profile_id())
  );

-- 2. Teacher read/insert/update for students in their classes
--    (both auth.uid() and profile id accepted for the teacher match).
CREATE POLICY "Teachers can view student pe log"
  ON public.pe_training_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON c.id = ce.class_id
      WHERE ce.student_id = pe_training_log.user_id
        AND ce.status = 'active'
        AND (c.teacher_id           = auth.uid()
          OR c.teacher_id           = public.get_my_profile_id()
          OR c.secondary_teacher_id = auth.uid()
          OR c.secondary_teacher_id = public.get_my_profile_id())
    )
  );

CREATE POLICY "Teachers can insert student pe log"
  ON public.pe_training_log FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON c.id = ce.class_id
      WHERE ce.student_id = pe_training_log.user_id
        AND ce.status = 'active'
        AND (c.teacher_id           = auth.uid()
          OR c.teacher_id           = public.get_my_profile_id()
          OR c.secondary_teacher_id = auth.uid()
          OR c.secondary_teacher_id = public.get_my_profile_id())
    )
  );

CREATE POLICY "Teachers can update student pe log"
  ON public.pe_training_log FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON c.id = ce.class_id
      WHERE ce.student_id = pe_training_log.user_id
        AND ce.status = 'active'
        AND (c.teacher_id           = auth.uid()
          OR c.teacher_id           = public.get_my_profile_id()
          OR c.secondary_teacher_id = auth.uid()
          OR c.secondary_teacher_id = public.get_my_profile_id())
    )
  );

-- 3. Parent-read (split-id aware).
CREATE POLICY "Parents can view children pe log"
  ON public.pe_training_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_child_links pcl
      WHERE pcl.child_id = pe_training_log.user_id
        AND (pcl.parent_id = auth.uid() OR pcl.parent_id = public.get_my_profile_id())
    )
  );

-- 4. Admin full access.
CREATE POLICY "Admins can manage pe log"
  ON public.pe_training_log FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE (up.id = auth.uid() OR up.id = public.get_my_profile_id())
        AND up.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE (up.id = auth.uid() OR up.id = public.get_my_profile_id())
        AND up.user_type = 'admin'
    )
  );
