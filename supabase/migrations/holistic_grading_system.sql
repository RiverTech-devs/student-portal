-- Holistic Grading System Migration
-- Changes class grade from auto-calculated average to teacher-controlled with suggestions
-- The system suggests a grade based on mode of assignments and recent performance,
-- but the teacher has final control over the class grade.

-- Drop existing functions first (they have different return types)
DROP FUNCTION IF EXISTS calculate_quarter_grades(uuid, uuid);
DROP FUNCTION IF EXISTS upsert_quarter_grade(uuid, uuid, numeric, numeric, numeric, text);

-- Add columns to quarter_grade_snapshots for holistic grading
ALTER TABLE quarter_grade_snapshots
ADD COLUMN IF NOT EXISTS suggested_class_grade NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS class_grade_override BOOLEAN DEFAULT FALSE;

-- Also add to class_enrollments for backwards compatibility
ALTER TABLE class_enrollments
ADD COLUMN IF NOT EXISTS suggested_class_grade NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS class_grade_override BOOLEAN DEFAULT FALSE;

-- Create function to calculate suggested grade using holistic approach
-- Uses: mode of assignment grades + recency weighting (last 5 assignments weighted more)
CREATE OR REPLACE FUNCTION calculate_suggested_grade(
  p_enrollment_id UUID,
  p_quarter_id UUID
)
RETURNS TABLE(
  suggested_grade NUMERIC,
  mode_grade NUMERIC,
  recent_avg NUMERIC,
  assignment_count INTEGER,
  grade_distribution JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_class_id UUID;
  v_student_id UUID;
  v_quarter_start DATE;
  v_quarter_end DATE;
  v_mode_grade NUMERIC;
  v_recent_avg NUMERIC;
  v_suggested NUMERIC;
  v_assignment_count INTEGER;
  v_distribution JSONB;
BEGIN
  -- Get class info and student id
  SELECT ce.class_id, ce.student_id
  INTO v_class_id, v_student_id
  FROM class_enrollments ce
  WHERE ce.id = p_enrollment_id;

  -- Get quarter date range
  SELECT q.start_date, q.end_date
  INTO v_quarter_start, v_quarter_end
  FROM quarters q
  WHERE q.id = p_quarter_id;

  -- Calculate MODE of letter grades (converted to percentages)
  -- Group grades into letter grade buckets and find most common
  WITH graded_assignments AS (
    SELECT
      asub.id,
      a.due_date,
      CASE
        WHEN asub.points_earned IS NOT NULL AND a.max_points > 0
        THEN (asub.points_earned::numeric / a.max_points::numeric) * 100
        ELSE NULL
      END as percentage
    FROM assignments a
    JOIN assignment_submissions asub ON asub.assignment_id = a.id
    WHERE a.class_id = v_class_id
      AND asub.student_id = v_student_id
      AND a.due_date >= v_quarter_start
      AND a.due_date <= v_quarter_end
      AND asub.points_earned IS NOT NULL
      AND asub.status = 'graded'
  ),
  letter_grades AS (
    SELECT
      percentage,
      -- Convert to letter grade bucket (midpoint of range)
      CASE
        WHEN percentage >= 97 THEN 98.5  -- A+
        WHEN percentage >= 93 THEN 95    -- A
        WHEN percentage >= 90 THEN 91.5  -- A-
        WHEN percentage >= 87 THEN 88.5  -- B+
        WHEN percentage >= 83 THEN 85    -- B
        WHEN percentage >= 80 THEN 81.5  -- B-
        WHEN percentage >= 77 THEN 78.5  -- C+
        WHEN percentage >= 73 THEN 75    -- C
        WHEN percentage >= 70 THEN 71.5  -- C-
        WHEN percentage >= 67 THEN 68.5  -- D+
        WHEN percentage >= 63 THEN 65    -- D
        WHEN percentage >= 60 THEN 61.5  -- D-
        ELSE 55                          -- F
      END as letter_bucket
    FROM graded_assignments
    WHERE percentage IS NOT NULL
  ),
  mode_calc AS (
    SELECT letter_bucket, COUNT(*) as frequency
    FROM letter_grades
    GROUP BY letter_bucket
    ORDER BY frequency DESC, letter_bucket DESC
    LIMIT 1
  )
  SELECT letter_bucket INTO v_mode_grade FROM mode_calc;

  -- Calculate average of last 5 assignments (recency weighting)
  WITH recent_assignments AS (
    SELECT
      (asub.points_earned::numeric / NULLIF(a.max_points::numeric, 0)) * 100 as percentage
    FROM assignments a
    JOIN assignment_submissions asub ON asub.assignment_id = a.id
    WHERE a.class_id = v_class_id
      AND asub.student_id = v_student_id
      AND a.due_date >= v_quarter_start
      AND a.due_date <= v_quarter_end
      AND asub.points_earned IS NOT NULL
      AND asub.status = 'graded'
    ORDER BY a.due_date DESC
    LIMIT 5
  )
  SELECT AVG(percentage) INTO v_recent_avg FROM recent_assignments;

  -- Count total graded assignments
  SELECT COUNT(*) INTO v_assignment_count
  FROM assignments a
  JOIN assignment_submissions asub ON asub.assignment_id = a.id
  WHERE a.class_id = v_class_id
    AND asub.student_id = v_student_id
    AND a.due_date >= v_quarter_start
    AND a.due_date <= v_quarter_end
    AND asub.points_earned IS NOT NULL
    AND asub.status = 'graded';

  -- Build grade distribution for display
  WITH graded_assignments AS (
    SELECT
      CASE
        WHEN (asub.points_earned::numeric / NULLIF(a.max_points::numeric, 0)) * 100 >= 90 THEN 'A'
        WHEN (asub.points_earned::numeric / NULLIF(a.max_points::numeric, 0)) * 100 >= 80 THEN 'B'
        WHEN (asub.points_earned::numeric / NULLIF(a.max_points::numeric, 0)) * 100 >= 70 THEN 'C'
        WHEN (asub.points_earned::numeric / NULLIF(a.max_points::numeric, 0)) * 100 >= 60 THEN 'D'
        ELSE 'F'
      END as letter
    FROM assignments a
    JOIN assignment_submissions asub ON asub.assignment_id = a.id
    WHERE a.class_id = v_class_id
      AND asub.student_id = v_student_id
      AND a.due_date >= v_quarter_start
      AND a.due_date <= v_quarter_end
      AND asub.points_earned IS NOT NULL
      AND asub.status = 'graded'
  )
  SELECT jsonb_object_agg(letter, cnt)
  INTO v_distribution
  FROM (
    SELECT letter, COUNT(*) as cnt
    FROM graded_assignments
    GROUP BY letter
  ) dist;

  -- Calculate suggested grade:
  -- If we have both mode and recent average, weight them 60/40 (mode more important)
  -- Mode represents consistent performance, recent shows current trajectory
  IF v_mode_grade IS NOT NULL AND v_recent_avg IS NOT NULL THEN
    v_suggested := (v_mode_grade * 0.6) + (v_recent_avg * 0.4);
  ELSIF v_mode_grade IS NOT NULL THEN
    v_suggested := v_mode_grade;
  ELSIF v_recent_avg IS NOT NULL THEN
    v_suggested := v_recent_avg;
  ELSE
    v_suggested := NULL;
  END IF;

  -- Round to nearest letter grade boundary for cleaner suggestions
  IF v_suggested IS NOT NULL THEN
    v_suggested := CASE
      WHEN v_suggested >= 97 THEN 98.5
      WHEN v_suggested >= 93 THEN 95
      WHEN v_suggested >= 90 THEN 91.5
      WHEN v_suggested >= 87 THEN 88.5
      WHEN v_suggested >= 83 THEN 85
      WHEN v_suggested >= 80 THEN 81.5
      WHEN v_suggested >= 77 THEN 78.5
      WHEN v_suggested >= 73 THEN 75
      WHEN v_suggested >= 70 THEN 71.5
      WHEN v_suggested >= 67 THEN 68.5
      WHEN v_suggested >= 63 THEN 65
      WHEN v_suggested >= 60 THEN 61.5
      ELSE 55
    END;
  END IF;

  RETURN QUERY SELECT
    v_suggested,
    v_mode_grade,
    v_recent_avg,
    v_assignment_count,
    COALESCE(v_distribution, '{}'::jsonb);
END;
$$;

-- Update the upsert function to handle class grade override
CREATE OR REPLACE FUNCTION upsert_quarter_grade(
  p_enrollment_id UUID,
  p_quarter_id UUID,
  p_academic_grade NUMERIC DEFAULT NULL,
  p_participation_grade NUMERIC DEFAULT NULL,
  p_class_grade NUMERIC DEFAULT NULL,
  p_teacher_notes TEXT DEFAULT NULL,
  p_suggested_class_grade NUMERIC DEFAULT NULL,
  p_class_grade_override BOOLEAN DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO quarter_grade_snapshots (
    enrollment_id,
    quarter_id,
    academic_grade,
    participation_grade,
    class_grade,
    teacher_notes,
    suggested_class_grade,
    class_grade_override,
    updated_at
  )
  VALUES (
    p_enrollment_id,
    p_quarter_id,
    p_academic_grade,
    p_participation_grade,
    p_class_grade,
    p_teacher_notes,
    p_suggested_class_grade,
    COALESCE(p_class_grade_override, FALSE),
    NOW()
  )
  ON CONFLICT (enrollment_id, quarter_id)
  DO UPDATE SET
    academic_grade = COALESCE(p_academic_grade, quarter_grade_snapshots.academic_grade),
    participation_grade = COALESCE(p_participation_grade, quarter_grade_snapshots.participation_grade),
    class_grade = COALESCE(p_class_grade, quarter_grade_snapshots.class_grade),
    teacher_notes = COALESCE(p_teacher_notes, quarter_grade_snapshots.teacher_notes),
    suggested_class_grade = COALESCE(p_suggested_class_grade, quarter_grade_snapshots.suggested_class_grade),
    class_grade_override = COALESCE(p_class_grade_override, quarter_grade_snapshots.class_grade_override),
    updated_at = NOW();
END;
$$;

-- Update calculate_quarter_grades to use holistic approach
-- Now calculates a suggested grade but does NOT auto-set the class grade
-- The class grade is only set if not overridden by teacher
CREATE OR REPLACE FUNCTION calculate_quarter_grades(
  p_enrollment_id UUID,
  p_quarter_id UUID
)
RETURNS TABLE(academic_grade NUMERIC, participation_grade NUMERIC, class_grade NUMERIC, suggested_class_grade NUMERIC, class_grade_override BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_class_id UUID;
  v_student_id UUID;
  v_grading_weight TEXT;
  v_academic NUMERIC := 0;
  v_participation NUMERIC;
  v_class NUMERIC;
  v_suggested NUMERIC;
  v_override BOOLEAN;
  v_current_class_grade NUMERIC;
  v_quarter_start DATE;
  v_quarter_end DATE;
BEGIN
  -- Get class info, student id, and quarter dates
  SELECT ce.class_id, ce.student_id, c.grading_weight
  INTO v_class_id, v_student_id, v_grading_weight
  FROM class_enrollments ce
  JOIN classes c ON c.id = ce.class_id
  WHERE ce.id = p_enrollment_id;

  SELECT q.start_date, q.end_date
  INTO v_quarter_start, v_quarter_end
  FROM quarters q
  WHERE q.id = p_quarter_id;

  -- Get existing grades and override status from snapshots or enrollment
  SELECT
    COALESCE(qgs.participation_grade, ce.participation_grade),
    COALESCE(qgs.class_grade, ce.class_grade),
    COALESCE(qgs.class_grade_override, FALSE)
  INTO v_participation, v_current_class_grade, v_override
  FROM class_enrollments ce
  LEFT JOIN quarter_grade_snapshots qgs ON qgs.enrollment_id = ce.id AND qgs.quarter_id = p_quarter_id
  WHERE ce.id = p_enrollment_id;

  -- Calculate academic grade (simple average for reference)
  SELECT AVG((asub.points_earned::numeric / NULLIF(a.max_points::numeric, 0)) * 100)
  INTO v_academic
  FROM assignments a
  JOIN assignment_submissions asub ON asub.assignment_id = a.id
  WHERE a.class_id = v_class_id
    AND asub.student_id = v_student_id
    AND a.due_date >= v_quarter_start
    AND a.due_date <= v_quarter_end
    AND asub.points_earned IS NOT NULL
    AND asub.status = 'graded';

  v_academic := COALESCE(v_academic, 0);

  -- Calculate suggested grade using holistic method
  SELECT sg.suggested_grade INTO v_suggested
  FROM calculate_suggested_grade(p_enrollment_id, p_quarter_id) sg;

  v_suggested := COALESCE(v_suggested, v_academic);

  -- If teacher has NOT overridden, use the suggested grade as class grade
  -- If teacher HAS overridden, keep their grade
  IF v_override = TRUE AND v_current_class_grade IS NOT NULL THEN
    v_class := v_current_class_grade;
  ELSE
    v_class := v_suggested;
    v_override := FALSE;
  END IF;

  -- Store in quarter_grade_snapshots
  PERFORM upsert_quarter_grade(
    p_enrollment_id,
    p_quarter_id,
    v_academic,
    v_participation,
    v_class,
    NULL,
    v_suggested,
    v_override
  );

  RETURN QUERY SELECT v_academic, v_participation, v_class, v_suggested, v_override;
END;
$$;

-- Function for teacher to set/override class grade
CREATE OR REPLACE FUNCTION set_class_grade_override(
  p_enrollment_id UUID,
  p_quarter_id UUID,
  p_class_grade NUMERIC,
  p_override BOOLEAN DEFAULT TRUE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update only the class_grade and override flag
  INSERT INTO quarter_grade_snapshots (
    enrollment_id,
    quarter_id,
    class_grade,
    class_grade_override,
    updated_at
  )
  VALUES (
    p_enrollment_id,
    p_quarter_id,
    p_class_grade,
    p_override,
    NOW()
  )
  ON CONFLICT (enrollment_id, quarter_id)
  DO UPDATE SET
    class_grade = p_class_grade,
    class_grade_override = p_override,
    updated_at = NOW();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_suggested_grade TO authenticated;
GRANT EXECUTE ON FUNCTION set_class_grade_override TO authenticated;
