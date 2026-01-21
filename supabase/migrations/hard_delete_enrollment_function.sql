-- Function to permanently delete an enrollment and all related data
-- Uses SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION hard_delete_enrollment(p_enrollment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id UUID;
  v_class_id UUID;
  v_assignment_ids UUID[];
BEGIN
  -- Get enrollment details
  SELECT student_id, class_id INTO v_student_id, v_class_id
  FROM class_enrollments
  WHERE id = p_enrollment_id;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Enrollment not found';
  END IF;

  -- Get all assignment IDs for this class
  SELECT ARRAY_AGG(id) INTO v_assignment_ids
  FROM assignments
  WHERE class_id = v_class_id;

  -- Delete assignment submissions for this student in this class
  IF v_assignment_ids IS NOT NULL THEN
    DELETE FROM assignment_submissions
    WHERE student_id = v_student_id
    AND assignment_id = ANY(v_assignment_ids);
  END IF;

  -- Delete grade snapshots for this enrollment
  DELETE FROM quarter_grade_snapshots WHERE enrollment_id = p_enrollment_id;

  -- Delete enrollment history for this enrollment
  DELETE FROM enrollment_history WHERE enrollment_id = p_enrollment_id;

  -- Delete the enrollment record
  DELETE FROM class_enrollments WHERE id = p_enrollment_id;
END;
$$;

-- Grant execute to authenticated users (admin check should be done in the app)
GRANT EXECUTE ON FUNCTION hard_delete_enrollment TO authenticated;
