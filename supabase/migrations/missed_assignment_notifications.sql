-- Track which missed-assignment notifications have been sent to prevent duplicates
CREATE TABLE IF NOT EXISTS missed_assignment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL,
  student_id UUID NOT NULL,
  parent_id UUID NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate notifications per assignment/student/parent combo
  UNIQUE(assignment_id, student_id, parent_id)
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_missed_notifs_sent_at
ON missed_assignment_notifications(sent_at);

-- Clean up old records (notifications older than 30 days)
-- This can be run periodically to keep the table small
CREATE OR REPLACE FUNCTION cleanup_old_missed_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM missed_assignment_notifications
  WHERE sent_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;
