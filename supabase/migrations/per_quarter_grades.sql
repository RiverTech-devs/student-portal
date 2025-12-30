-- Per-Quarter Grade Storage
-- This migration extends the quarter_grade_snapshots table to store grades for ALL quarters
-- (not just archived ones), enabling teachers to manage grades for any non-archived quarter.

-- Add updated_at column to track when grades were last modified
ALTER TABLE quarter_grade_snapshots
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add participation_grade column if it doesn't exist
ALTER TABLE quarter_grade_snapshots
ADD COLUMN IF NOT EXISTS participation_grade NUMERIC(5,2);

-- Add teacher_notes column if it doesn't exist
ALTER TABLE quarter_grade_snapshots
ADD COLUMN IF NOT EXISTS teacher_notes TEXT;

-- Create or replace function to upsert quarter grades
-- This is called whenever a teacher saves grades for any quarter
CREATE OR REPLACE FUNCTION upsert_quarter_grade(
  p_enrollment_id UUID,
  p_quarter_id UUID,
  p_academic_grade NUMERIC DEFAULT NULL,
  p_participation_grade NUMERIC DEFAULT NULL,
  p_class_grade NUMERIC DEFAULT NULL,
  p_teacher_notes TEXT DEFAULT NULL
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
    updated_at
  )
  VALUES (
    p_enrollment_id,
    p_quarter_id,
    p_academic_grade,
    p_participation_grade,
    p_class_grade,
    p_teacher_notes,
    NOW()
  )
  ON CONFLICT (enrollment_id, quarter_id)
  DO UPDATE SET
    academic_grade = COALESCE(p_academic_grade, quarter_grade_snapshots.academic_grade),
    participation_grade = COALESCE(p_participation_grade, quarter_grade_snapshots.participation_grade),
    class_grade = COALESCE(p_class_grade, quarter_grade_snapshots.class_grade),
    teacher_notes = COALESCE(p_teacher_notes, quarter_grade_snapshots.teacher_notes),
    updated_at = NOW();
END;
$$;

-- Create or replace function to calculate and store quarter grades
-- This replaces the enrollment-based calculation with quarter-specific storage
CREATE OR REPLACE FUNCTION calculate_quarter_grades(
  p_enrollment_id UUID,
  p_quarter_id UUID
)
RETURNS TABLE(academic_grade NUMERIC, participation_grade NUMERIC, class_grade NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_class_id UUID;
  v_grading_weight TEXT;
  v_academic NUMERIC := 0;
  v_participation NUMERIC;
  v_class NUMERIC;
  v_quarter_start DATE;
  v_quarter_end DATE;
  v_category RECORD;
  v_category_sum NUMERIC := 0;
  v_category_weight_sum NUMERIC := 0;
BEGIN
  -- Get class info and quarter dates
  SELECT ce.class_id, c.grading_weight
  INTO v_class_id, v_grading_weight
  FROM class_enrollments ce
  JOIN classes c ON c.id = ce.class_id
  WHERE ce.id = p_enrollment_id;

  SELECT q.start_date, q.end_date
  INTO v_quarter_start, v_quarter_end
  FROM quarters q
  WHERE q.id = p_quarter_id;

  -- Get existing participation grade from snapshots or enrollment
  SELECT COALESCE(qgs.participation_grade, ce.participation_grade)
  INTO v_participation
  FROM class_enrollments ce
  LEFT JOIN quarter_grade_snapshots qgs ON qgs.enrollment_id = ce.id AND qgs.quarter_id = p_quarter_id
  WHERE ce.id = p_enrollment_id;

  -- Calculate academic grade from assignments within the quarter date range
  FOR v_category IN
    SELECT gc.id, gc.weight
    FROM grade_categories gc
    WHERE gc.class_id = v_class_id
  LOOP
    DECLARE
      v_cat_avg NUMERIC;
      v_cat_count INT;
    BEGIN
      SELECT
        AVG(CASE WHEN asub.points_earned IS NOT NULL THEN (asub.points_earned / a.max_points) * 100 END),
        COUNT(CASE WHEN asub.points_earned IS NOT NULL THEN 1 END)
      INTO v_cat_avg, v_cat_count
      FROM assignments a
      LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id
        AND asub.student_id = (SELECT student_id FROM class_enrollments WHERE id = p_enrollment_id)
      WHERE a.class_id = v_class_id
        AND a.category_id = v_category.id
        AND a.due_date >= v_quarter_start
        AND a.due_date <= v_quarter_end;

      IF v_cat_count > 0 AND v_cat_avg IS NOT NULL THEN
        v_category_sum := v_category_sum + (v_cat_avg * v_category.weight);
        v_category_weight_sum := v_category_weight_sum + v_category.weight;
      END IF;
    END;
  END LOOP;

  -- Calculate weighted academic grade
  IF v_category_weight_sum > 0 THEN
    v_academic := v_category_sum / v_category_weight_sum;
  ELSE
    -- Fallback: simple average of all graded assignments in quarter
    SELECT AVG((asub.points_earned / a.max_points) * 100)
    INTO v_academic
    FROM assignments a
    JOIN assignment_submissions asub ON asub.assignment_id = a.id
      AND asub.student_id = (SELECT student_id FROM class_enrollments WHERE id = p_enrollment_id)
    WHERE a.class_id = v_class_id
      AND a.due_date >= v_quarter_start
      AND a.due_date <= v_quarter_end
      AND asub.points_earned IS NOT NULL;
  END IF;

  v_academic := COALESCE(v_academic, 0);
  v_participation := COALESCE(v_participation, 0);

  -- Calculate class grade based on grading weight
  IF v_grading_weight = 'skill' THEN
    v_class := (v_academic * 0.6) + (v_participation * 0.4);
  ELSIF v_grading_weight = 'participation' THEN
    v_class := (v_academic * 0.4) + (v_participation * 0.6);
  ELSE
    v_class := (v_academic + v_participation) / 2;
  END IF;

  -- Store in quarter_grade_snapshots
  PERFORM upsert_quarter_grade(
    p_enrollment_id,
    p_quarter_id,
    v_academic,
    v_participation,
    v_class,
    NULL
  );

  RETURN QUERY SELECT v_academic, v_participation, v_class;
END;
$$;

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION upsert_quarter_grade TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_quarter_grades TO authenticated;
