-- Create missing grade functions
-- Run this in Supabase SQL Editor to fix 404 errors for grade management

-- ============================================
-- STEP 1: Add columns to quarter_grade_snapshots if missing
-- ============================================
ALTER TABLE quarter_grade_snapshots
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE quarter_grade_snapshots
ADD COLUMN IF NOT EXISTS participation_grade NUMERIC(5,2);

ALTER TABLE quarter_grade_snapshots
ADD COLUMN IF NOT EXISTS teacher_notes TEXT;

ALTER TABLE quarter_grade_snapshots
ADD COLUMN IF NOT EXISTS suggested_class_grade NUMERIC(5,2);

ALTER TABLE quarter_grade_snapshots
ADD COLUMN IF NOT EXISTS class_grade_override BOOLEAN DEFAULT FALSE;

-- Add to class_enrollments for backwards compatibility
ALTER TABLE class_enrollments
ADD COLUMN IF NOT EXISTS suggested_class_grade NUMERIC(5,2);

ALTER TABLE class_enrollments
ADD COLUMN IF NOT EXISTS class_grade_override BOOLEAN DEFAULT FALSE;

-- Create unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quarter_grade_snapshots_enrollment_quarter_unique'
  ) THEN
    ALTER TABLE quarter_grade_snapshots
    ADD CONSTRAINT quarter_grade_snapshots_enrollment_quarter_unique
    UNIQUE (enrollment_id, quarter_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- STEP 2: Create upsert_quarter_grade function
-- ============================================
DROP FUNCTION IF EXISTS upsert_quarter_grade(uuid, uuid, numeric, numeric, numeric, text);
DROP FUNCTION IF EXISTS upsert_quarter_grade(uuid, uuid, numeric, numeric, numeric, text, numeric, boolean);

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
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.quarter_grade_snapshots (
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
    academic_grade = COALESCE(p_academic_grade, public.quarter_grade_snapshots.academic_grade),
    participation_grade = COALESCE(p_participation_grade, public.quarter_grade_snapshots.participation_grade),
    class_grade = COALESCE(p_class_grade, public.quarter_grade_snapshots.class_grade),
    teacher_notes = COALESCE(p_teacher_notes, public.quarter_grade_snapshots.teacher_notes),
    suggested_class_grade = COALESCE(p_suggested_class_grade, public.quarter_grade_snapshots.suggested_class_grade),
    class_grade_override = COALESCE(p_class_grade_override, public.quarter_grade_snapshots.class_grade_override),
    updated_at = NOW();
END;
$$;

-- ============================================
-- STEP 3: Create calculate_suggested_grade function
-- ============================================
DROP FUNCTION IF EXISTS calculate_suggested_grade(UUID, UUID);

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

  -- Calculate FREQUENCY-WEIGHTED AVERAGE of letter grades
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
      CASE
        WHEN percentage >= 97 THEN 98.5
        WHEN percentage >= 93 THEN 95
        WHEN percentage >= 90 THEN 91.5
        WHEN percentage >= 87 THEN 88.5
        WHEN percentage >= 83 THEN 85
        WHEN percentage >= 80 THEN 81.5
        WHEN percentage >= 77 THEN 78.5
        WHEN percentage >= 73 THEN 75
        WHEN percentage >= 70 THEN 71.5
        WHEN percentage >= 67 THEN 68.5
        WHEN percentage >= 63 THEN 65
        WHEN percentage >= 60 THEN 61.5
        ELSE 55
      END as letter_bucket
    FROM graded_assignments
    WHERE percentage IS NOT NULL
  ),
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

  -- Calculate average of last 5 assignments
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

  -- Build grade distribution
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

  -- Calculate academic grade (60% trend + 40% recent)
  IF v_trend_grade IS NOT NULL AND v_recent_avg IS NOT NULL THEN
    v_academic_grade := (v_trend_grade * 0.6) + (v_recent_avg * 0.4);
  ELSIF v_trend_grade IS NOT NULL THEN
    v_academic_grade := v_trend_grade;
  ELSIF v_recent_avg IS NOT NULL THEN
    v_academic_grade := v_recent_avg;
  ELSE
    v_academic_grade := NULL;
  END IF;

  -- Round to nearest letter grade boundary
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

-- ============================================
-- STEP 4: Create calculate_quarter_grades function
-- ============================================
DROP FUNCTION IF EXISTS calculate_quarter_grades(uuid, uuid);
DROP FUNCTION IF EXISTS calculate_quarter_grades(uuid);

CREATE OR REPLACE FUNCTION calculate_quarter_grades(
  p_enrollment_id UUID,
  p_quarter_id UUID
)
RETURNS TABLE(academic_grade NUMERIC, participation_grade NUMERIC, class_grade NUMERIC, suggested_class_grade NUMERIC, class_grade_override BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
  v_academic_weight NUMERIC;
  v_participation_weight NUMERIC;
BEGIN
  -- Get class info, student id, and quarter dates
  SELECT ce.class_id, ce.student_id, c.grading_weight
  INTO v_class_id, v_student_id, v_grading_weight
  FROM public.class_enrollments ce
  JOIN public.classes c ON c.id = ce.class_id
  WHERE ce.id = p_enrollment_id;

  SELECT q.start_date, q.end_date
  INTO v_quarter_start, v_quarter_end
  FROM public.quarters q
  WHERE q.id = p_quarter_id;

  -- Determine weights based on class grading_weight setting
  CASE v_grading_weight
    WHEN 'skill' THEN
      v_academic_weight := 0.6;
      v_participation_weight := 0.4;
    WHEN 'participation' THEN
      v_academic_weight := 0.4;
      v_participation_weight := 0.6;
    ELSE
      v_academic_weight := 0.5;
      v_participation_weight := 0.5;
  END CASE;

  -- Get existing grades and override status from snapshots or enrollment
  SELECT
    COALESCE(qgs.participation_grade, ce.participation_grade),
    COALESCE(qgs.class_grade, ce.class_grade),
    COALESCE(qgs.class_grade_override, FALSE)
  INTO v_participation, v_current_class_grade, v_override
  FROM public.class_enrollments ce
  LEFT JOIN public.quarter_grade_snapshots qgs ON qgs.enrollment_id = ce.id AND qgs.quarter_id = p_quarter_id
  WHERE ce.id = p_enrollment_id;

  -- Get the holistic academic grade from calculate_suggested_grade
  SELECT sg.suggested_grade INTO v_academic
  FROM public.calculate_suggested_grade(p_enrollment_id, p_quarter_id) sg;

  v_academic := COALESCE(v_academic, 0);

  -- Calculate suggested class grade: combine academic and participation using class weight
  IF v_participation IS NOT NULL THEN
    v_suggested := (v_academic * v_academic_weight) + (v_participation * v_participation_weight);
  ELSE
    v_suggested := v_academic;
  END IF;

  -- Round suggested to nearest letter grade boundary
  IF v_suggested IS NOT NULL AND v_suggested > 0 THEN
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

  -- If teacher has NOT overridden, use the suggested grade as class grade
  IF v_override = TRUE AND v_current_class_grade IS NOT NULL THEN
    v_class := v_current_class_grade;
  ELSE
    v_class := v_suggested;
    v_override := FALSE;
  END IF;

  -- Store in quarter_grade_snapshots
  PERFORM public.upsert_quarter_grade(
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

-- ============================================
-- STEP 5: Create set_class_grade_override function
-- ============================================
DROP FUNCTION IF EXISTS set_class_grade_override(uuid, uuid, numeric, boolean);

CREATE OR REPLACE FUNCTION set_class_grade_override(
  p_enrollment_id UUID,
  p_quarter_id UUID,
  p_class_grade NUMERIC,
  p_override BOOLEAN DEFAULT TRUE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.quarter_grade_snapshots (
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

-- ============================================
-- STEP 6: Grant permissions
-- ============================================
GRANT EXECUTE ON FUNCTION upsert_quarter_grade(UUID, UUID, NUMERIC, NUMERIC, NUMERIC, TEXT, NUMERIC, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_quarter_grade(UUID, UUID, NUMERIC, NUMERIC, NUMERIC, TEXT, NUMERIC, BOOLEAN) TO service_role;

GRANT EXECUTE ON FUNCTION calculate_suggested_grade(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_suggested_grade(UUID, UUID) TO service_role;

GRANT EXECUTE ON FUNCTION calculate_quarter_grades(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_quarter_grades(UUID, UUID) TO service_role;

GRANT EXECUTE ON FUNCTION set_class_grade_override(UUID, UUID, NUMERIC, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION set_class_grade_override(UUID, UUID, NUMERIC, BOOLEAN) TO service_role;
