-- Track which due date reminders have been sent to prevent duplicates
CREATE TABLE IF NOT EXISTS due_date_reminder_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL,
  student_id UUID NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate reminders
  UNIQUE(assignment_id, student_id)
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_due_reminders_sent_at
ON due_date_reminder_notifications(sent_at);

-- Clean up old records (reminders older than 30 days)
-- This can be run periodically to keep the table small
CREATE OR REPLACE FUNCTION cleanup_old_due_reminders()
RETURNS void AS $$
BEGIN
  DELETE FROM due_date_reminder_notifications
  WHERE sent_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;
