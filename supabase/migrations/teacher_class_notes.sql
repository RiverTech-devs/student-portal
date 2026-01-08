-- Teacher Class Notes Table
-- Private notes for teachers to track class activities, plans, and observations
-- These are ONLY visible to the creating teacher (not admins, parents, or students)

CREATE TABLE teacher_class_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  note_date DATE DEFAULT CURRENT_DATE,  -- Date the note is about (e.g., class date)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX idx_teacher_class_notes_class ON teacher_class_notes(class_id);
CREATE INDEX idx_teacher_class_notes_teacher ON teacher_class_notes(teacher_id);
CREATE INDEX idx_teacher_class_notes_date ON teacher_class_notes(note_date DESC);
CREATE INDEX idx_teacher_class_notes_created ON teacher_class_notes(created_at DESC);

-- RLS: ONLY the creating teacher can access their own notes
ALTER TABLE teacher_class_notes ENABLE ROW LEVEL SECURITY;

-- Single policy for all operations - only the teacher who created the note can access it
CREATE POLICY "Teachers can manage their own class notes"
  ON teacher_class_notes FOR ALL
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());
