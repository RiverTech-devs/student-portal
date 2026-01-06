-- Add status column to classes table for tracking class lifecycle
-- Status values: 'active' (default), 'closed' (ended but viewable for records)

ALTER TABLE classes
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed'));

-- Set all existing classes to 'active' (should already be due to default, but explicit)
UPDATE classes SET status = 'active' WHERE status IS NULL;

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);

-- Comment explaining the status values
COMMENT ON COLUMN classes.status IS 'Class lifecycle status: active = ongoing class, closed = ended class (still visible in reports/history)';
