-- Allow teachers to update enrollments for their own classes
-- This enables teachers to remove students (set status to 'removed')

-- Helper function to check if user is teacher of a class
-- SECURITY DEFINER bypasses RLS to avoid recursion issues
CREATE OR REPLACE FUNCTION is_teacher_of_class(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM classes
    WHERE id = p_class_id
    AND teacher_id = auth.uid()
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_teacher_of_class(UUID) TO authenticated;

-- Policy using the helper function (short-circuits via function call)
CREATE POLICY "Teachers can update enrollments for their classes"
  ON class_enrollments FOR UPDATE
  USING (is_teacher_of_class(class_id))
  WITH CHECK (is_teacher_of_class(class_id));
