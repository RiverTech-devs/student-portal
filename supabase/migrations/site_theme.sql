-- Add site theme columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS site_theme TEXT DEFAULT 'default-dark';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS site_theme_custom JSONB DEFAULT NULL;
