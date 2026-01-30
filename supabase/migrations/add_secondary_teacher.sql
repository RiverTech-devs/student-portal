-- Add secondary teacher support to classes
-- A secondary teacher can add assignments, grade, add notes, and take attendance
-- but cannot delete/close/edit the class or manage its roster.

-- A. Add column and index
ALTER TABLE classes ADD COLUMN IF NOT EXISTS secondary_teacher_id UUID REFERENCES user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_classes_secondary_teacher ON classes(secondary_teacher_id);

-- B. Update is_teacher_of_class() to recognize secondary teachers
CREATE OR REPLACE FUNCTION is_teacher_of_class(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM classes
    WHERE id = p_class_id
    AND (teacher_id = auth.uid() OR secondary_teacher_id = auth.uid())
  );
$$;

GRANT EXECUTE ON FUNCTION is_teacher_of_class(UUID) TO authenticated;

-- C. Update inline RLS policies that check classes.teacher_id directly

-- 1. class_schedule: "Teachers can manage own class schedules"
DROP POLICY IF EXISTS "Teachers can manage own class schedules" ON class_schedule;
CREATE POLICY "Teachers can manage own class schedules"
  ON class_schedule FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE id = class_schedule.class_id
      AND (teacher_id = auth.uid() OR secondary_teacher_id = auth.uid())
    )
  );

-- 2. class_attendance: "Teachers can manage own class attendance"
DROP POLICY IF EXISTS "Teachers can manage own class attendance" ON class_attendance;
CREATE POLICY "Teachers can manage own class attendance"
  ON class_attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE id = class_attendance.class_id
      AND (teacher_id = auth.uid() OR secondary_teacher_id = auth.uid())
    )
  );

-- 3. student_notes: "Teachers can insert notes for their classes"
DROP POLICY IF EXISTS "Teachers can insert notes for their classes" ON student_notes;
CREATE POLICY "Teachers can insert notes for their classes"
  ON student_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = student_notes.class_id
      AND (classes.teacher_id = auth.uid() OR classes.secondary_teacher_id = auth.uid())
    )
    AND teacher_id = auth.uid()
  );

-- 4. student_notes: "Teachers can view notes for their classes"
DROP POLICY IF EXISTS "Teachers can view notes for their classes" ON student_notes;
CREATE POLICY "Teachers can view notes for their classes"
  ON student_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = student_notes.class_id
      AND (classes.teacher_id = auth.uid() OR classes.secondary_teacher_id = auth.uid())
    )
  );

-- 5. homework_assignments: "Teachers can view class student assignments"
DROP POLICY IF EXISTS "Teachers can view class student assignments" ON homework_assignments;
CREATE POLICY "Teachers can view class student assignments"
  ON homework_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      JOIN classes c ON c.id = cs.class_id
      WHERE cs.student_id = homework_assignments.student_id
      AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    )
  );

-- 6. homework_assignments: "Teachers can create assignments for their students"
DROP POLICY IF EXISTS "Teachers can create assignments for their students" ON homework_assignments;
CREATE POLICY "Teachers can create assignments for their students"
  ON homework_assignments FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid()
    AND (
      class_id IS NULL
      OR EXISTS (
        SELECT 1 FROM classes
        WHERE classes.id = homework_assignments.class_id
        AND (classes.teacher_id = auth.uid() OR classes.secondary_teacher_id = auth.uid())
      )
    )
  );

-- 7. skill_practice_sessions: "Teachers can view student practice sessions"
DROP POLICY IF EXISTS "Teachers can view student practice sessions" ON skill_practice_sessions;
CREATE POLICY "Teachers can view student practice sessions"
  ON skill_practice_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      JOIN classes c ON c.id = cs.class_id
      WHERE cs.student_id = skill_practice_sessions.user_id
      AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    )
  );

-- 8. discussion_posts: "posts_update"
DROP POLICY IF EXISTS "posts_update" ON public.discussion_posts;
CREATE POLICY "posts_update" ON public.discussion_posts
FOR UPDATE TO authenticated
USING (
  (author_id = auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.discussion_threads t ON t.class_id = c.id
    WHERE t.id = discussion_posts.thread_id
    AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
  ))
)
WITH CHECK (
  (author_id = auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.discussion_threads t ON t.class_id = c.id
    WHERE t.id = discussion_posts.thread_id
    AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
  ))
);

-- 9. discussion_threads: "threads_update"
DROP POLICY IF EXISTS "threads_update" ON public.discussion_threads;
CREATE POLICY "threads_update" ON public.discussion_threads
FOR UPDATE TO authenticated
USING (
  public.is_member_of_class(class_id) AND
  ((created_by = auth.uid()) OR
   (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = discussion_threads.class_id AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid()))))
)
WITH CHECK (
  public.is_member_of_class(class_id) AND
  ((created_by = auth.uid()) OR
   (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = discussion_threads.class_id AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid()))))
);
