-- Fix parent_child_links foreign key constraint to reference user_profiles instead of auth.users
-- This allows linking records-only students (who don't have auth accounts) to parents

-- Drop the existing foreign key constraint on child_id
ALTER TABLE parent_child_links
DROP CONSTRAINT IF EXISTS parent_child_links_child_id_fkey;

-- Add new foreign key constraint referencing user_profiles instead of auth.users
ALTER TABLE parent_child_links
ADD CONSTRAINT parent_child_links_child_id_fkey
FOREIGN KEY (child_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
