-- Fix RLS policy on quarters table to allow admins to create/modify quarters
-- The previous policy only allowed 'teacher' user_type, blocking admins

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Only teachers can modify quarters" ON quarters;

-- Create new policy that allows both teachers AND admins to modify quarters
CREATE POLICY "Teachers and admins can modify quarters"
ON quarters
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_type IN ('teacher', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.user_type IN ('teacher', 'admin')
  )
);
