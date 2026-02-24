-- Add button color scheme preference to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS button_color_scheme TEXT DEFAULT 'ocean';
