-- Track individual Math Dojo practice sessions for weekly activity reporting
CREATE TABLE IF NOT EXISTS math_dojo_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    mode TEXT NOT NULL DEFAULT 'testing',
    skills_practiced INTEGER NOT NULL DEFAULT 0,
    total_correct INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    accuracy INTEGER GENERATED ALWAYS AS (
        CASE WHEN total_questions > 0
            THEN ROUND((total_correct::numeric / total_questions) * 100)
            ELSE 0
        END
    ) STORED,
    skill_details JSONB,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_math_dojo_sessions_user_id ON math_dojo_sessions(user_id);
CREATE INDEX idx_math_dojo_sessions_created_at ON math_dojo_sessions(created_at DESC);
CREATE INDEX idx_math_dojo_sessions_user_week ON math_dojo_sessions(user_id, created_at DESC);

ALTER TABLE math_dojo_sessions ENABLE ROW LEVEL SECURITY;

-- Students can view their own sessions
CREATE POLICY "Students can view own dojo sessions"
    ON math_dojo_sessions FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR user_id = public.get_my_profile_id()
    );

-- Students can insert their own sessions
CREATE POLICY "Students can insert own dojo sessions"
    ON math_dojo_sessions FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        OR user_id = public.get_my_profile_id()
    );

-- Teachers can view sessions for students in their classes
CREATE POLICY "Teachers can view student dojo sessions"
    ON math_dojo_sessions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.class_enrollments ce
            JOIN public.classes c ON ce.class_id = c.id
            WHERE ce.student_id = math_dojo_sessions.user_id
              AND ce.status = 'active'
              AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
        )
    );

-- Admins can view all sessions
CREATE POLICY "Admins can view all dojo sessions"
    ON math_dojo_sessions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE (id = auth.uid() OR auth_user_id = auth.uid())
              AND user_type = 'admin'
        )
    );

-- Parents can view their children's sessions
CREATE POLICY "Parents can view child dojo sessions"
    ON math_dojo_sessions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.parent_child_links pcl
            WHERE pcl.child_id = math_dojo_sessions.user_id
              AND pcl.parent_id = auth.uid()
        )
    );
