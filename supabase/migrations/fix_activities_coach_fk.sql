-- Fix activities.coach_id to reference user_profiles.auth_user_id instead of auth.users
-- This allows PostgREST to resolve: coach:user_profiles!coach_id(...)
-- Requires auth_user_id to have a unique index (it should already from the original schema)

-- Ensure auth_user_id has a unique index (safe if it already exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);

-- Drop the old FK referencing auth.users
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_coach_id_fkey;

-- Add new FK referencing user_profiles.auth_user_id
ALTER TABLE activities
  ADD CONSTRAINT activities_coach_id_fkey
  FOREIGN KEY (coach_id) REFERENCES user_profiles(auth_user_id) ON DELETE SET NULL;
