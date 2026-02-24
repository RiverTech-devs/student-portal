-- Track which attendance alert notifications have been sent to prevent duplicates
CREATE TABLE IF NOT EXISTS attendance_alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  student_id UUID NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  attendance_type TEXT NOT NULL DEFAULT 'daily',
  sent_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate alerts per recipient/student/date/status/type combo
  UNIQUE(recipient_id, student_id, date, status, attendance_type)
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_attendance_alerts_sent_at
ON attendance_alert_notifications(sent_at);

-- Clean up old records (alerts older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_attendance_alerts()
RETURNS void AS $$
BEGIN
  DELETE FROM attendance_alert_notifications
  WHERE sent_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;
