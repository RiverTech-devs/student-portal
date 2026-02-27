-- Material Requests Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS material_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('supplies', 'technology', 'furniture', 'books', 'other')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  admin_notes TEXT,
  status_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_material_requests_status ON material_requests(status);
CREATE INDEX IF NOT EXISTS idx_material_requests_user_id ON material_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_material_requests_created_at ON material_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers and admins can insert their own requests
CREATE POLICY "Users can insert material requests"
  ON material_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own material requests
CREATE POLICY "Users can view own material requests"
  ON material_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can view all material requests
CREATE POLICY "Admins can view all material requests"
  ON material_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Policy: Admins can update material requests
CREATE POLICY "Admins can update material requests"
  ON material_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Policy: Admins can delete material requests
CREATE POLICY "Admins can delete material requests"
  ON material_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON material_requests TO authenticated;
GRANT ALL ON material_requests TO service_role;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_material_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_material_requests_updated_at
  BEFORE UPDATE ON material_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_material_requests_updated_at();
