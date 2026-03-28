-- Fix quarter_grade_snapshots SELECT policy to scope access
-- Previously USING (true) allowed any authenticated user to see all grades

DROP POLICY IF EXISTS "quarter_snapshots_select" ON quarter_grade_snapshots;

-- Helper function to check enrollment access without RLS recursion
CREATE OR REPLACE FUNCTION public.can_view_enrollment(p_enrollment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_student_id UUID;
  v_class_id UUID;
  v_caller_id UUID;
  v_caller_type TEXT;
BEGIN
  v_caller_id := auth.uid();

  -- Get enrollment details
  SELECT ce.student_id, ce.class_id INTO v_student_id, v_class_id
  FROM public.class_enrollments ce
  WHERE ce.id = p_enrollment_id;

  IF v_student_id IS NULL THEN RETURN FALSE; END IF;

  -- Get caller type
  SELECT user_type INTO v_caller_type
  FROM public.user_profiles
  WHERE auth_user_id = v_caller_id OR id = v_caller_id
  LIMIT 1;

  -- Admins can view all
  IF v_caller_type = 'admin' THEN RETURN TRUE; END IF;

  -- Students can view their own
  IF v_student_id = v_caller_id THEN RETURN TRUE; END IF;

  -- Teachers can view their class students
  IF v_caller_type = 'teacher' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = v_class_id
      AND (c.teacher_id = v_caller_id OR c.secondary_teacher_id = v_caller_id)
    );
  END IF;

  -- Parents can view their children
  IF v_caller_type = 'parent' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.parent_child_links pcl
      WHERE pcl.parent_id = v_caller_id
      AND pcl.child_id = v_student_id
    );
  END IF;

  RETURN FALSE;
END;
$$;

CREATE POLICY "quarter_snapshots_select"
ON quarter_grade_snapshots
FOR SELECT
TO authenticated
USING (public.can_view_enrollment(enrollment_id));
