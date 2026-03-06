-- Enable RLS on attendance_alert_notifications
ALTER TABLE attendance_alert_notifications ENABLE ROW LEVEL SECURITY;

-- Teachers and admins can insert dedup records (used when sending attendance alerts)
CREATE POLICY "Teachers and admins can insert attendance alert dedup records"
  ON attendance_alert_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'teacher')
    )
  );

-- Teachers and admins can read attendance alert records
CREATE POLICY "Teachers and admins can read attendance alert records"
  ON attendance_alert_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type IN ('admin', 'teacher')
    )
  );
