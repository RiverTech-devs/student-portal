-- Function to permanently delete a class and all related data
-- Uses SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION hard_delete_class(p_class_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment_ids UUID[];
  v_assignment_ids UUID[];
  v_discussion_ids UUID[];
BEGIN
  -- Get all enrollment IDs for this class
  SELECT ARRAY_AGG(id) INTO v_enrollment_ids
  FROM class_enrollments
  WHERE class_id = p_class_id;

  -- Get all assignment IDs for this class
  SELECT ARRAY_AGG(id) INTO v_assignment_ids
  FROM assignments
  WHERE class_id = p_class_id;

  -- Get all discussion IDs for this class
  SELECT ARRAY_AGG(id) INTO v_discussion_ids
  FROM class_discussions
  WHERE class_id = p_class_id;

  -- Delete discussion replies
  IF v_discussion_ids IS NOT NULL THEN
    DELETE FROM discussion_replies WHERE discussion_id = ANY(v_discussion_ids);
  END IF;
  DELETE FROM class_discussions WHERE class_id = p_class_id;

  -- Delete assignment related records
  IF v_assignment_ids IS NOT NULL THEN
    DELETE FROM assignment_templates WHERE original_assignment_id = ANY(v_assignment_ids);
    DELETE FROM assignment_submissions WHERE assignment_id = ANY(v_assignment_ids);
    DELETE FROM assignment_students WHERE assignment_id = ANY(v_assignment_ids);
  END IF;
  DELETE FROM assignments WHERE class_id = p_class_id;

  -- Delete enrollment related records
  IF v_enrollment_ids IS NOT NULL THEN
    DELETE FROM quarter_grade_snapshots WHERE enrollment_id = ANY(v_enrollment_ids);
    DELETE FROM enrollment_history WHERE enrollment_id = ANY(v_enrollment_ids);
  END IF;
  DELETE FROM enrollment_history WHERE class_id = p_class_id;
  DELETE FROM class_enrollments WHERE class_id = p_class_id;

  -- Delete other class-related records
  DELETE FROM class_attendance WHERE class_id = p_class_id;
  DELETE FROM class_attendance_sessions WHERE class_id = p_class_id;
  DELETE FROM class_schedule WHERE class_id = p_class_id;
  DELETE FROM grade_categories WHERE class_id = p_class_id;
  DELETE FROM student_notes WHERE class_id = p_class_id;
  DELETE FROM homework_assignments WHERE class_id = p_class_id;

  -- Finally delete the class
  DELETE FROM classes WHERE id = p_class_id;
END;
$$;

-- Grant execute to authenticated users (admin check should be done in the app)
GRANT EXECUTE ON FUNCTION hard_delete_class TO authenticated;
