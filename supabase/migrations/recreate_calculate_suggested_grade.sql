-- Recreate calculate_suggested_grade function
-- This migration ensures the function exists with proper security settings

-- Drop existing function first
DROP FUNCTION IF EXISTS calculate_suggested_grade(UUID, UUID);

-- Create the function
CREATE OR REPLACE FUNCTION calculate_suggested_grade(
  p_enrollment_id UUID,
  p_quarter_id UUID
)
RETURNS TABLE(
  suggested_grade NUMERIC,
  trend_grade NUMERIC,
  recent_avg NUMERIC,
  assignment_count INTEGER,
  grade_distribution JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_class_id UUID;
  v_student_id UUID;
  v_quarter_start DATE;
  v_quarter_end DATE;
  v_trend_grade NUMERIC;
  v_recent_avg NUMERIC;
  v_academic_grade NUMERIC;
  v_assignment_count INTEGER;
  v_distribution JSONB;
BEGIN
  -- Get class info and student id
  SELECT ce.class_id, ce.student_id
  INTO v_class_id, v_student_id
  FROM public.class_enrollments ce
  WHERE ce.id = p_enrollment_id;

  -- Get quarter date range
  SELECT q.start_date, q.end_date
  INTO v_quarter_start, v_quarter_end
  FROM public.quarters q
  WHERE q.id = p_quarter_id;

  -- Calculate FREQUENCY-WEIGHTED AVERAGE of letter grades (replaces pure mode)
  -- Each letter grade bucket contributes proportionally to how often it appears
  WITH graded_assignments AS (
    SELECT
      asub.id,
      a.due_date,
      CASE
        WHEN asub.points_earned IS NOT NULL AND a.max_points > 0
        THEN (asub.points_earned::numeric / a.max_points::numeric) * 100
        ELSE NULL
      END as percentage
    FROM public.assignments a
    JOIN public.assignment_submissions asub ON asub.assignment_id = a.id
    WHERE a.class_id = v_class_id
      AND asub.student_id = v_student_id
      AND a.due_date::date >= v_quarter_start
      AND a.due_date::date <= v_quarter_end
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
  -- Calculate frequency-weighted average: sum(bucket * count) / total_count
  frequency_weighted AS (
    SELECT
      SUM(letter_bucket * frequency)::numeric / NULLIF(SUM(frequency), 0) as weighted_avg
    FROM (
      SELECT letter_bucket, COUNT(*) as frequency
      FROM letter_grades
      GROUP BY letter_bucket
    ) bucket_counts
  )
  SELECT weighted_avg INTO v_trend_grade FROM frequency_weighted;

  -- Calculate average of last 5 assignments (recency weighting)
  WITH recent_assignments AS (
    SELECT
      (asub.points_earned::numeric / NULLIF(a.max_points::numeric, 0)) * 100 as percentage
    FROM public.assignments a
    JOIN public.assignment_submissions asub ON asub.assignment_id = a.id
    WHERE a.class_id = v_class_id
      AND asub.student_id = v_student_id
      AND a.due_date::date >= v_quarter_start
      AND a.due_date::date <= v_quarter_end
      AND asub.points_earned IS NOT NULL
      AND asub.status = 'graded'
    ORDER BY a.due_date DESC
    LIMIT 5
  )
  SELECT AVG(percentage) INTO v_recent_avg FROM recent_assignments;

  -- Count total graded assignments
  SELECT COUNT(*) INTO v_assignment_count
  FROM public.assignments a
  JOIN public.assignment_submissions asub ON asub.assignment_id = a.id
  WHERE a.class_id = v_class_id
    AND asub.student_id = v_student_id
    AND a.due_date::date >= v_quarter_start
    AND a.due_date::date <= v_quarter_end
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
    FROM public.assignments a
    JOIN public.assignment_submissions asub ON asub.assignment_id = a.id
    WHERE a.class_id = v_class_id
      AND asub.student_id = v_student_id
      AND a.due_date::date >= v_quarter_start
      AND a.due_date::date <= v_quarter_end
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

  -- Calculate academic grade:
  -- Frequency-weighted trend (60%) + Recent average (40%)
  IF v_trend_grade IS NOT NULL AND v_recent_avg IS NOT NULL THEN
    v_academic_grade := (v_trend_grade * 0.6) + (v_recent_avg * 0.4);
  ELSIF v_trend_grade IS NOT NULL THEN
    v_academic_grade := v_trend_grade;
  ELSIF v_recent_avg IS NOT NULL THEN
    v_academic_grade := v_recent_avg;
  ELSE
    v_academic_grade := NULL;
  END IF;

  -- Round to nearest letter grade boundary for cleaner display
  IF v_academic_grade IS NOT NULL THEN
    v_academic_grade := CASE
      WHEN v_academic_grade >= 97 THEN 98.5
      WHEN v_academic_grade >= 93 THEN 95
      WHEN v_academic_grade >= 90 THEN 91.5
      WHEN v_academic_grade >= 87 THEN 88.5
      WHEN v_academic_grade >= 83 THEN 85
      WHEN v_academic_grade >= 80 THEN 81.5
      WHEN v_academic_grade >= 77 THEN 78.5
      WHEN v_academic_grade >= 73 THEN 75
      WHEN v_academic_grade >= 70 THEN 71.5
      WHEN v_academic_grade >= 67 THEN 68.5
      WHEN v_academic_grade >= 63 THEN 65
      WHEN v_academic_grade >= 60 THEN 61.5
      ELSE 55
    END;
  END IF;

  RETURN QUERY SELECT
    v_academic_grade,
    v_trend_grade,
    v_recent_avg,
    v_assignment_count,
    COALESCE(v_distribution, '{}'::jsonb);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_suggested_grade(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_suggested_grade(UUID, UUID) TO service_role;
