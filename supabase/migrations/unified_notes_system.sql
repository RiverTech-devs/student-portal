-- Unified Notes System
-- One table for all new notes: per-student, per-class, per-teacher (about a teacher),
-- or any combination. Legacy tables (student_notes, teacher_class_notes,
-- teacher_private_notes) are left untouched; the portal Notes tab and Riven
-- read them alongside this table and write new notes here.

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  -- Targets: any combination, at least one required
  student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  about_teacher_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('academic','behavior','responsibility','attendance','communication','general','custom')),
  custom_category TEXT,
  sentiment TEXT NOT NULL DEFAULT 'neutral'
    CHECK (sentiment IN ('positive','negative','neutral')),
  -- 'private' = author only; 'staff' = all teachers + admins
  visibility TEXT NOT NULL DEFAULT 'staff'
    CHECK (visibility IN ('private','staff')),
  note TEXT NOT NULL,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  CONSTRAINT notes_has_target
    CHECK (student_id IS NOT NULL OR class_id IS NOT NULL OR about_teacher_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_notes_student ON notes(student_id);
CREATE INDEX IF NOT EXISTS idx_notes_class ON notes(class_id);
CREATE INDEX IF NOT EXISTS idx_notes_about_teacher ON notes(about_teacher_id);
CREATE INDEX IF NOT EXISTS idx_notes_author ON notes(author_id);
CREATE INDEX IF NOT EXISTS idx_notes_note_date ON notes(note_date DESC);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Staff (teachers + admins) can create notes they author
CREATE POLICY "Staff can insert own notes" ON notes
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type IN ('teacher','admin')
    )
  );

-- Authors always see their own notes; staff-visible notes are readable by all staff
CREATE POLICY "Authors and staff can read notes" ON notes
  FOR SELECT USING (
    author_id = auth.uid()
    OR (
      visibility = 'staff'
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND user_type IN ('teacher','admin')
      )
    )
  );

-- Authors can edit/delete their own notes
CREATE POLICY "Authors can update own notes" ON notes
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own notes" ON notes
  FOR DELETE USING (author_id = auth.uid());

-- Admins can edit/delete any staff-visible note. Private notes stay
-- author-only (matching legacy teacher_private_notes behavior).
CREATE POLICY "Admins update staff notes" ON notes
  FOR UPDATE USING (
    visibility = 'staff'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins delete staff notes" ON notes
  FOR DELETE USING (
    visibility = 'staff'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );
