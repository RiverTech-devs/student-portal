-- ============================================================
-- FIX: calculate_quarter_grades regression — NULL academic grade
-- gets coerced to 0, which is treated as an F.
--
-- History: The bug was introduced in create_grade_functions.sql as
--
--     v_academic := COALESCE(v_academic, 0);
--
-- ...at the top of calculate_quarter_grades. This treats "student has
-- no graded assignments in this quarter" the same as "student scored
-- 0% on every assignment", which gives them a suggested_class_grade
-- near or at the F boundary instead of NULL or their participation
-- grade alone.
--
-- It was correctly fixed in fix_null_academic_grade_in_gpa.sql with
-- explicit NULL handling. But three later migrations
-- (holistic_grading_system.sql, secure_rpc_functions.sql,
-- unified_grading_calculation.sql) each redefined the function and
-- reintroduced the same COALESCE line — the fix was silently
-- reverted three times in a row.
--
-- unified_grading_calculation.sql is alphabetically the last file
-- that defines calculate_quarter_grades, so the function currently
-- deployed carries the bug. This migration ships the function one
-- more time, matching the semantics of fix_null_academic_grade_in_gpa
-- and using the unified_grading_calculation weighting model
-- (academic + participation split by class grading_weight setting).
--
-- Impact before this fix:
--   - Student with 0 graded assignments + 100 participation + 50/50
--     weight → (0 * 0.5 + 100 * 0.5) = 50, rounded to the D- bucket.
--   - Student with 0 graded assignments + 0 participation → 0, which
--     gets stored as class_grade = 0 = F in quarter_grade_snapshots.
--
-- Impact after this fix:
--   - Student with 0 academic + 100 participation → 100 (participation
--     alone stands in).
--   - Student with 0 academic + 0 participation → NULL (no data, no
--     grade counted in GPA).
-- ============================================================

CREATE OR REPLACE FUNCTION public.calculate_quarter_grades(
  p_enrollment_id UUID,
  p_quarter_id UUID
)
RETURNS TABLE(
  academic_grade NUMERIC,
  participation_grade NUMERIC,
  class_grade NUMERIC,
  suggested_class_grade NUMERIC,
  class_grade_override BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_class_id UUID;
  v_student_id UUID;
  v_grading_weight TEXT;
  v_academic NUMERIC;
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
  SELECT ce.class_id, ce.student_id, c.grading_weight
  INTO v_class_id, v_student_id, v_grading_weight
  FROM public.class_enrollments ce
  JOIN public.classes c ON c.id = ce.class_id
  WHERE ce.id = p_enrollment_id;

  SELECT q.start_date, q.end_date
  INTO v_quarter_start, v_quarter_end
  FROM public.quarters q
  WHERE q.id = p_quarter_id;

  -- Weights from class setting
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

  -- Existing grades + override state
  SELECT
    COALESCE(qgs.participation_grade, ce.participation_grade),
    COALESCE(qgs.class_grade, ce.class_grade),
    COALESCE(qgs.class_grade_override, FALSE)
  INTO v_participation, v_current_class_grade, v_override
  FROM public.class_enrollments ce
  LEFT JOIN public.quarter_grade_snapshots qgs
    ON qgs.enrollment_id = ce.id
    AND qgs.quarter_id = p_quarter_id
  WHERE ce.id = p_enrollment_id;

  -- Academic grade from the holistic suggested-grade calculator.
  -- NOTE: deliberately NOT coalesced to 0. NULL means "no graded
  -- assignments exist for this quarter" and should not count as an F.
  SELECT sg.suggested_grade INTO v_academic
  FROM public.calculate_suggested_grade(p_enrollment_id, p_quarter_id) sg;

  -- Combine academic + participation based on what data exists.
  IF v_academic IS NOT NULL AND v_participation IS NOT NULL THEN
    v_suggested := (v_academic * v_academic_weight) + (v_participation * v_participation_weight);
  ELSIF v_academic IS NOT NULL THEN
    v_suggested := v_academic;
  ELSIF v_participation IS NOT NULL THEN
    v_suggested := v_participation;
  ELSE
    v_suggested := NULL;
  END IF;

  -- Round to nearest letter-grade bucket midpoint for display
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

  -- Teacher override beats the calculator
  IF v_override = TRUE AND v_current_class_grade IS NOT NULL THEN
    v_class := v_current_class_grade;
  ELSE
    v_class := v_suggested;
    v_override := FALSE;
  END IF;

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

GRANT EXECUTE ON FUNCTION public.calculate_quarter_grades(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_quarter_grades(UUID, UUID) TO service_role;

-- Data repair: clean up snapshots that were stored with class_grade = 0
-- due to the regression. A class_grade of exactly 0 with NULL academic_grade
-- can only arise from the bug — the letter-bucket rounding makes 55 the
-- minimum real grade, so any 0 is a bug artifact.
UPDATE public.quarter_grade_snapshots
SET class_grade = NULL,
    suggested_class_grade = NULL
WHERE class_grade = 0
  AND academic_grade IS NULL;
