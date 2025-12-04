-- Student Notes Table
-- Allows teachers to add notes about students with sentiment, category, and optional value

CREATE TABLE IF NOT EXISTS student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  category TEXT NOT NULL CHECK (category IN ('academic', 'behavior', 'responsibility', 'custom')),
  custom_category TEXT, -- only used when category = 'custom'
  value INTEGER, -- positive for positive sentiment, negative for negative, null for neutral
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Modification tracking
  modified_at TIMESTAMPTZ, -- when the note was last modified
  modified_by UUID REFERENCES profiles(id) ON DELETE SET NULL -- admin who modified
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_student_notes_class_id ON student_notes(class_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_student_id ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_teacher_id ON student_notes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_notes_created_at ON student_notes(created_at DESC);

-- Enable RLS
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- Teachers can insert notes for their own classes
CREATE POLICY "Teachers can insert notes for their classes"
  ON student_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = student_notes.class_id
      AND classes.teacher_id = auth.uid()
    )
    AND teacher_id = auth.uid()
  );

-- Teachers can view notes they created
CREATE POLICY "Teachers can view their own notes"
  ON student_notes FOR SELECT
  USING (teacher_id = auth.uid());

-- Teachers can also view all notes for classes they teach
CREATE POLICY "Teachers can view notes for their classes"
  ON student_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = student_notes.class_id
      AND classes.teacher_id = auth.uid()
    )
  );

-- Teachers can update their own notes
CREATE POLICY "Teachers can update their own notes"
  ON student_notes FOR UPDATE
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Teachers can delete their own notes
CREATE POLICY "Teachers can delete their own notes"
  ON student_notes FOR DELETE
  USING (teacher_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins can manage all notes"
  ON student_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
