-- School Settings Table
-- Key-value store for system-wide settings

CREATE TABLE IF NOT EXISTS school_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Insert default values
INSERT INTO school_settings (key, value) VALUES
  ('school_name', 'River Tech Academy'),
  ('current_school_year', '2024-2025')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings
CREATE POLICY "Authenticated can read settings"
  ON school_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
  ON school_settings FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can insert settings"
  ON school_settings FOR INSERT
  WITH CHECK (is_admin());

-- Grant permissions
GRANT ALL ON school_settings TO authenticated;
GRANT ALL ON school_settings TO service_role;
