-- ============================================================
-- GRIDFALL Terminal Quest — persistence tables.
--
-- 1) tech_quest_saves: one RPG save per student (JSONB blob the
--    game fully owns: xp, level, badges, per-quest step progress
--    and code solutions). Cross-device resume.
-- 2) tech_project_log: append-only teacher-rubric evidence for the
--    ~80 Technology PROJECT nodes (physical robotics builds, CAD,
--    presentations) that a terminal cannot honestly assess.
--    Same trust model as pe_training_log: teacher rows verified,
--    split-id-aware RLS via class enrollment.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tech_quest_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  save JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tech_quest_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own quest save"
  ON public.tech_quest_saves FOR ALL TO authenticated
  USING      (user_id = auth.uid() OR user_id = public.get_my_profile_id())
  WITH CHECK (user_id = auth.uid() OR user_id = public.get_my_profile_id());

CREATE POLICY "Teachers can view student quest saves"
  ON public.tech_quest_saves FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON c.id = ce.class_id
      WHERE ce.student_id = tech_quest_saves.user_id
        AND ce.status = 'active'
        AND (c.teacher_id           = auth.uid()
          OR c.teacher_id           = public.get_my_profile_id()
          OR c.secondary_teacher_id = auth.uid()
          OR c.secondary_teacher_id = public.get_my_profile_id())
    )
  );

CREATE POLICY "Parents can view children quest saves"
  ON public.tech_quest_saves FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_child_links pcl
      WHERE pcl.child_id = tech_quest_saves.user_id
        AND (pcl.parent_id = auth.uid() OR pcl.parent_id = public.get_my_profile_id())
    )
  );

CREATE POLICY "Admins can manage quest saves"
  ON public.tech_quest_saves FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles up
      WHERE (up.id = auth.uid() OR up.id = public.get_my_profile_id()) AND up.user_type = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles up
      WHERE (up.id = auth.uid() OR up.id = public.get_my_profile_id()) AND up.user_type = 'admin')
  );

-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tech_project_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,                 -- curriculum_nodes.id (T-RB018, T17, ...). No FK: history outlives reworks.
  entry_type TEXT NOT NULL DEFAULT 'rubric' CHECK (entry_type IN ('rubric','note')),
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,   -- rubric: {scores:[1-4 x4]}
  notes TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  recorded_by UUID REFERENCES public.user_profiles(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tech_project_user_node ON public.tech_project_log (user_id, node_id, recorded_at DESC);

ALTER TABLE public.tech_project_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tech project log"
  ON public.tech_project_log FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id = public.get_my_profile_id());

CREATE POLICY "Teachers can view student tech project log"
  ON public.tech_project_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON c.id = ce.class_id
      WHERE ce.student_id = tech_project_log.user_id
        AND ce.status = 'active'
        AND (c.teacher_id           = auth.uid()
          OR c.teacher_id           = public.get_my_profile_id()
          OR c.secondary_teacher_id = auth.uid()
          OR c.secondary_teacher_id = public.get_my_profile_id())
    )
  );

CREATE POLICY "Teachers can insert student tech project log"
  ON public.tech_project_log FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON c.id = ce.class_id
      WHERE ce.student_id = tech_project_log.user_id
        AND ce.status = 'active'
        AND (c.teacher_id           = auth.uid()
          OR c.teacher_id           = public.get_my_profile_id()
          OR c.secondary_teacher_id = auth.uid()
          OR c.secondary_teacher_id = public.get_my_profile_id())
    )
  );

CREATE POLICY "Teachers can update student tech project log"
  ON public.tech_project_log FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON c.id = ce.class_id
      WHERE ce.student_id = tech_project_log.user_id
        AND ce.status = 'active'
        AND (c.teacher_id           = auth.uid()
          OR c.teacher_id           = public.get_my_profile_id()
          OR c.secondary_teacher_id = auth.uid()
          OR c.secondary_teacher_id = public.get_my_profile_id())
    )
  );

CREATE POLICY "Parents can view children tech project log"
  ON public.tech_project_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_child_links pcl
      WHERE pcl.child_id = tech_project_log.user_id
        AND (pcl.parent_id = auth.uid() OR pcl.parent_id = public.get_my_profile_id())
    )
  );

CREATE POLICY "Admins can manage tech project log"
  ON public.tech_project_log FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles up
      WHERE (up.id = auth.uid() OR up.id = public.get_my_profile_id()) AND up.user_type = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles up
      WHERE (up.id = auth.uid() OR up.id = public.get_my_profile_id()) AND up.user_type = 'admin')
  );
