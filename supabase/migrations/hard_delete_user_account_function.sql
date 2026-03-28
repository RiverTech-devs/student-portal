CREATE OR REPLACE FUNCTION hard_delete_user_account(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_enrollment_ids UUID[];
BEGIN
  -- Validate user exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Collect enrollment IDs for this user (needed for cascade deletes)
  SELECT ARRAY_AGG(id) INTO v_enrollment_ids
  FROM class_enrollments
  WHERE student_id = p_user_id;

  -- 1. test_question_grades (graded_by)
  DELETE FROM test_question_grades WHERE graded_by = p_user_id;

  -- 2. test_submissions (student_id or graded_by)
  DELETE FROM test_submissions WHERE student_id = p_user_id OR graded_by = p_user_id;

  -- 3. test_assignments (student_id or assigned_by)
  DELETE FROM test_assignments WHERE student_id = p_user_id OR assigned_by = p_user_id;

  -- 4. tests (owner_id) — cascade handles test_questions
  DELETE FROM tests WHERE owner_id = p_user_id;

  -- 5. assignment_submissions (student_id)
  DELETE FROM assignment_submissions WHERE student_id = p_user_id;

  -- 6. assignment_students (student_id)
  DELETE FROM assignment_students WHERE student_id = p_user_id;

  -- 7. assignment_grades (student_id or graded_by)
  DELETE FROM assignment_grades WHERE student_id = p_user_id OR graded_by = p_user_id;

  -- 8. homework_assignments (teacher_id or student_id)
  DELETE FROM homework_assignments WHERE teacher_id = p_user_id OR student_id = p_user_id;

  -- 9. skill_practice_sessions (user_id)
  DELETE FROM skill_practice_sessions WHERE user_id = p_user_id;

  -- 10. skill_progress (user_id)
  DELETE FROM skill_progress WHERE user_id = p_user_id;

  -- 11-12. quarter_grade_snapshots and enrollment_history (via enrollment_ids)
  IF v_enrollment_ids IS NOT NULL THEN
    DELETE FROM quarter_grade_snapshots WHERE enrollment_id = ANY(v_enrollment_ids);
    DELETE FROM enrollment_history WHERE enrollment_id = ANY(v_enrollment_ids);
  END IF;

  -- 13. class_enrollments (student_id)
  DELETE FROM class_enrollments WHERE student_id = p_user_id;

  -- 14. class_attendance (student_id)
  DELETE FROM class_attendance WHERE student_id = p_user_id;

  -- 15. daily_attendance (student_id)
  DELETE FROM daily_attendance WHERE student_id = p_user_id;

  -- 16. student_schedule (student_id)
  DELETE FROM student_schedule WHERE student_id = p_user_id;

  -- 17. teacher_private_notes (student_id or teacher_id)
  DELETE FROM teacher_private_notes WHERE student_id = p_user_id OR teacher_id = p_user_id;

  -- 18. teacher_class_notes (teacher_id)
  DELETE FROM teacher_class_notes WHERE teacher_id = p_user_id;

  -- 19. student_notes (student_id or teacher_id)
  DELETE FROM student_notes WHERE student_id = p_user_id OR teacher_id = p_user_id;

  -- 20. student_medical_info (student_id)
  DELETE FROM student_medical_info WHERE student_id = p_user_id;

  -- 21. emergency_contacts (student_id)
  DELETE FROM emergency_contacts WHERE student_id = p_user_id;

  -- 22. student_waivers (student_id)
  DELETE FROM student_waivers WHERE student_id = p_user_id;

  -- 23. student_strikes (student_id)
  DELETE FROM student_strikes WHERE student_id = p_user_id;

  -- 24. parent_child_links (parent_id or child_id)
  DELETE FROM parent_child_links WHERE parent_id = p_user_id OR child_id = p_user_id;

  -- 25. notifications (user_id)
  DELETE FROM notifications WHERE user_id = p_user_id;

  -- 26. attendance_alert_notifications (recipient_id or student_id)
  DELETE FROM attendance_alert_notifications WHERE recipient_id = p_user_id OR student_id = p_user_id;

  -- 27. due_date_reminder_notifications (student_id)
  DELETE FROM due_date_reminder_notifications WHERE student_id = p_user_id;

  -- 28. missed_assignment_notifications (student_id or parent_id)
  DELETE FROM missed_assignment_notifications WHERE student_id = p_user_id OR parent_id = p_user_id;

  -- 29. bug_reports — SET NULL instead of delete (preserve reports)
  UPDATE bug_reports SET user_id = NULL WHERE user_id = p_user_id;

  -- 30. material_requests — SET NULL instead of delete
  UPDATE material_requests SET user_id = NULL WHERE user_id = p_user_id;

  -- 31. enrollment_applications — SET NULL on user references
  UPDATE enrollment_applications SET existing_student_id = NULL WHERE existing_student_id = p_user_id;
  UPDATE enrollment_applications SET existing_parent_id = NULL WHERE existing_parent_id = p_user_id;

  -- 32. classes — SET NULL on teacher references (don't delete classes)
  UPDATE classes SET teacher_id = NULL WHERE teacher_id = p_user_id;
  UPDATE classes SET secondary_teacher_id = NULL WHERE secondary_teacher_id = p_user_id;

  -- 33. school_events — SET NULL on created_by
  UPDATE school_events SET created_by = NULL WHERE created_by = p_user_id;

  -- 34. RTC transactions
  DELETE FROM rtc_transactions WHERE user_id = p_user_id;

  -- 35. RTC cosmetic purchases
  DELETE FROM rtc_cosmetic_purchases WHERE user_id = p_user_id;

  -- 36. RTC student privileges
  DELETE FROM rtc_student_privileges WHERE student_id = p_user_id;

  -- 37. RTC bank accounts
  DELETE FROM rtc_bank_accounts WHERE user_id = p_user_id;

  -- 38. IRL purchases
  DELETE FROM irl_purchases WHERE student_id = p_user_id;
  UPDATE irl_purchases SET processed_by = NULL WHERE processed_by = p_user_id;

  -- 39. Activity enrollments
  DELETE FROM activity_enrollments WHERE student_id = p_user_id;

  -- 40. Activities (coach)
  UPDATE activities SET coach_id = NULL WHERE coach_id = p_user_id;

  -- 41. Facility bookings
  UPDATE facility_bookings SET booked_by = NULL WHERE booked_by = p_user_id;

  -- 42. Teacher Drive config
  DELETE FROM teacher_drive_config WHERE teacher_id = p_user_id;

  -- 43. Finally delete the user profile itself
  DELETE FROM user_profiles WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION hard_delete_user_account TO authenticated;
