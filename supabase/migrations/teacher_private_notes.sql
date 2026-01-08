-- Teacher Private Notes Table
-- Private notes for teachers to track student observations, skills, and progress
-- These are ONLY visible to the creating teacher (not admins, parents, or students)

CREATE TABLE teacher_private_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX idx_teacher_private_notes_class ON teacher_private_notes(class_id);
CREATE INDEX idx_teacher_private_notes_student ON teacher_private_notes(student_id);
CREATE INDEX idx_teacher_private_notes_teacher ON teacher_private_notes(teacher_id);
CREATE INDEX idx_teacher_private_notes_created ON teacher_private_notes(created_at DESC);

-- RLS: ONLY the creating teacher can access their own notes
ALTER TABLE teacher_private_notes ENABLE ROW LEVEL SECURITY;

-- Single policy for all operations - only the teacher who created the note can access it
CREATE POLICY "Teachers can manage their own private notes"
  ON teacher_private_notes FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());
