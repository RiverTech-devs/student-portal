-- Add class_id to teacher_sheets so sheets are per-class
ALTER TABLE teacher_sheets
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Index for fast lookup by class
CREATE INDEX IF NOT EXISTS idx_teacher_sheets_class_id ON teacher_sheets(class_id);
