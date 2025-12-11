-- Add phone and address fields to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address_line1 TEXT,
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

COMMENT ON COLUMN user_profiles.phone IS 'Primary phone number';
COMMENT ON COLUMN user_profiles.address_line1 IS 'Street address line 1';
COMMENT ON COLUMN user_profiles.address_line2 IS 'Street address line 2 (apt, suite, etc.)';
COMMENT ON COLUMN user_profiles.city IS 'City';
COMMENT ON COLUMN user_profiles.state IS 'State/Province';
COMMENT ON COLUMN user_profiles.zip_code IS 'ZIP/Postal code';
