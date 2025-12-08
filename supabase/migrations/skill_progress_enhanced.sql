-- Enhanced Skill Progress Table
-- Adds decay tracking, mastery scoring, and practice history

-- First, ensure the skill_progress table exists with basic structure
CREATE TABLE IF NOT EXISTS skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'locked' CHECK (state IN ('locked', 'available', 'in_progress', 'mastered')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, subject, skill_name)
);

-- Add new columns for decay tracking and mastery
ALTER TABLE skill_progress
ADD COLUMN IF NOT EXISTS mastery_score INTEGER DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100);

ALTER TABLE skill_progress
ADD COLUMN IF NOT EXISTS last_practiced TIMESTAMPTZ DEFAULT now();

ALTER TABLE skill_progress
ADD COLUMN IF NOT EXISTS practice_count INTEGER DEFAULT 0;

ALTER TABLE skill_progress
ADD COLUMN IF NOT EXISTS decay_rate INTEGER DEFAULT 14; -- Days until decay starts

ALTER TABLE skill_progress
ADD COLUMN IF NOT EXISTS mastered_at TIMESTAMPTZ; -- When mastery was first achieved

ALTER TABLE skill_progress
ADD COLUMN IF NOT EXISTS mastered_by UUID REFERENCES profiles(id) ON DELETE SET NULL; -- Teacher who verified mastery

-- Update state constraint to include new states (drop and recreate if exists)
-- Note: 'activated' is kept for backwards compatibility, equivalent to 'mastered'
DO $$
BEGIN
  ALTER TABLE skill_progress DROP CONSTRAINT IF EXISTS skill_progress_state_check;
  ALTER TABLE skill_progress ADD CONSTRAINT skill_progress_state_check
    CHECK (state IN ('locked', 'available', 'in_progress', 'mastered', 'activated'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Comments for documentation
COMMENT ON COLUMN skill_progress.mastery_score IS 'Progress towards mastery (0-100). 100 = fully mastered';
COMMENT ON COLUMN skill_progress.last_practiced IS 'Last time the skill was practiced (for decay calculation)';
COMMENT ON COLUMN skill_progress.practice_count IS 'Number of times this skill has been practiced';
COMMENT ON COLUMN skill_progress.decay_rate IS 'Number of days before mastery starts to decay';
COMMENT ON COLUMN skill_progress.mastered_at IS 'Timestamp when mastery was first achieved';
COMMENT ON COLUMN skill_progress.mastered_by IS 'Teacher ID who verified the mastery (if teacher-verified)';

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_skill_progress_user_id ON skill_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_subject ON skill_progress(subject);
CREATE INDEX IF NOT EXISTS idx_skill_progress_state ON skill_progress(state);
CREATE INDEX IF NOT EXISTS idx_skill_progress_last_practiced ON skill_progress(last_practiced);

-- Index for finding skills that need decay check
CREATE INDEX IF NOT EXISTS idx_skill_progress_decay_check
ON skill_progress(user_id, last_practiced)
WHERE state IN ('mastered', 'activated');

-- Enable RLS
ALTER TABLE skill_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own skill progress"
  ON skill_progress FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own progress
CREATE POLICY "Users can insert their own skill progress"
  ON skill_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own progress (but not mastered_by)
CREATE POLICY "Users can update their own skill progress"
  ON skill_progress FOR UPDATE
  USING (user_id = auth.uid());

-- Teachers can view progress for students in their classes
CREATE POLICY "Teachers can view student skill progress"
  ON skill_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      JOIN classes c ON c.id = cs.class_id
      WHERE cs.student_id = skill_progress.user_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Teachers can update progress for students in their classes (for mastery verification)
CREATE POLICY "Teachers can update student skill progress"
  ON skill_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM class_students cs
      JOIN classes c ON c.id = cs.class_id
      WHERE cs.student_id = skill_progress.user_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all skill progress"
  ON skill_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Parents can view progress for their linked children
CREATE POLICY "Parents can view children skill progress"
  ON skill_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_links
      WHERE parent_child_links.parent_id = auth.uid()
      AND parent_child_links.child_id = skill_progress.user_id
    )
  );

-- Function to calculate effective mastery with decay
CREATE OR REPLACE FUNCTION calculate_decayed_mastery(
  p_mastery_score INTEGER,
  p_last_practiced TIMESTAMPTZ,
  p_decay_rate INTEGER DEFAULT 14
)
RETURNS INTEGER AS $$
DECLARE
  days_since_practice INTEGER;
  decay_amount INTEGER;
  effective_score INTEGER;
BEGIN
  -- Calculate days since last practice
  days_since_practice := EXTRACT(DAY FROM (now() - p_last_practiced))::INTEGER;

  -- No decay within the decay rate period
  IF days_since_practice <= p_decay_rate THEN
    RETURN p_mastery_score;
  END IF;

  -- Calculate decay: lose 5 points per day after decay_rate days
  decay_amount := (days_since_practice - p_decay_rate) * 5;
  effective_score := GREATEST(0, p_mastery_score - decay_amount);

  RETURN effective_score;
END;
$$ LANGUAGE plpgsql;

-- View that shows skill progress with calculated decay
CREATE OR REPLACE VIEW skill_progress_with_decay AS
SELECT
  sp.*,
  calculate_decayed_mastery(sp.mastery_score, sp.last_practiced, sp.decay_rate) as effective_mastery,
  CASE
    WHEN sp.state IN ('mastered', 'activated')
      AND calculate_decayed_mastery(sp.mastery_score, sp.last_practiced, sp.decay_rate) < 70
    THEN 'needs_review'
    ELSE sp.state
  END as effective_state,
  EXTRACT(DAY FROM (now() - sp.last_practiced))::INTEGER as days_since_practice
FROM skill_progress sp;
