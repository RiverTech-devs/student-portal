CREATE TABLE IF NOT EXISTS email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_email_log_sent_at ON email_log(sent_at DESC);
CREATE INDEX idx_email_log_type ON email_log(email_type);
CREATE INDEX idx_email_log_recipient ON email_log(recipient_email);

-- RLS: only admins can read
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read email log" ON email_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND user_type = 'admin')
  );
-- Insert allowed for all authenticated users (sendEmailWithTracking runs as any user)
CREATE POLICY "Authenticated users can insert email log" ON email_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Auto-cleanup older than 90 days
CREATE OR REPLACE FUNCTION cleanup_old_email_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM email_log WHERE sent_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;
