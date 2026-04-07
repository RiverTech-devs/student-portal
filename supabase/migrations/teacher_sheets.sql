-- Teacher Sheets: spreadsheet-like notes stored as CSV
CREATE TABLE IF NOT EXISTS teacher_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Sheet',
  csv_data TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_teacher_sheets_user_id ON teacher_sheets(user_id);

-- RLS policies
ALTER TABLE teacher_sheets ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sheets
CREATE POLICY "Users can view their own sheets"
  ON teacher_sheets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sheets"
  ON teacher_sheets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sheets"
  ON teacher_sheets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sheets"
  ON teacher_sheets FOR DELETE
  USING (auth.uid() = user_id);
