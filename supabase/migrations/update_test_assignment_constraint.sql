-- Update test_assignments constraint to require class_id
-- Individual student assignments must also specify a class for grade integration

-- Drop existing constraint
ALTER TABLE test_assignments DROP CONSTRAINT IF EXISTS test_assignment_scope;

-- Add new constraint: class_id is always required, student_id is optional
-- When student_id is set, it's an individual assignment within that class
-- When student_id is NULL, it's assigned to the entire class
ALTER TABLE test_assignments ADD CONSTRAINT test_assignment_scope CHECK (
  class_id IS NOT NULL
);

-- Add comment for documentation
COMMENT ON CONSTRAINT test_assignment_scope ON test_assignments IS
  'class_id is always required for grade integration. student_id is optional - when set, assigns to individual student within the class; when NULL, assigns to entire class.';

-- ============================================================================
-- Update RLS helper function to handle new assignment logic
-- ============================================================================
CREATE OR REPLACE FUNCTION is_assigned_to_test(p_test_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM test_assignments ta
    LEFT JOIN class_enrollments ce ON ce.class_id = ta.class_id AND ce.student_id = auth.uid()
    WHERE ta.test_id = p_test_id
    AND ta.is_active = true
    AND (
      -- Direct individual assignment
      ta.student_id = auth.uid()
      OR
      -- Class-wide assignment (student_id is NULL) and user is enrolled in class
      (ta.student_id IS NULL AND ce.student_id IS NOT NULL)
    )
  );
$$;
