-- ============================================================
-- FIX: calculate_quarter_grades was overwriting per-quarter
-- participation_grade with the live class_enrollments value.
--
-- Bug: the function read participation as
--
--   COALESCE(qgs.participation_grade, ce.participation_grade)
--
-- class_enrollments.participation_grade is a single live column
-- representing the CURRENT quarter's participation, not a
-- per-quarter value. When calculate_quarter_grades ran for a
-- past quarter whose snapshot had participation_grade IS NULL,
-- it fell back to that live value and stamped it into the
-- past-quarter snapshot via upsert_quarter_grade. Effect: all
-- past quarters got the current quarter's participation number
-- written into their snapshots — what looked like every quarter
-- having the same participation grade.
--
-- Fix: only fall back to ce.participation_grade when the target
-- quarter is the current quarter. For past quarters, pass NULL
-- to upsert_quarter_grade so that the upsert's COALESCE
-- preserves whatever's already in the snapshot (including NULL).
--
-- This file inherits the rest of the function body verbatim
-- from zz_fix_quarter_grades_null_academic_regression.sql so
-- the previous fix (NULL academic grade no longer coerces to 0)
-- is kept.
--
-- Data: this migration does NOT attempt to repair already-
-- corrupted snapshots. There is no safe automated way to
-- recover the original per-quarter participation values once
-- they were overwritten with the live current-quarter value.
-- Manual cleanup per affected enrollment is required.
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
  v_is_current BOOLEAN;
  v_academic_weight NUMERIC;
  v_participation_weight NUMERIC;
BEGIN
  -- === AUTHORIZATION CHECK ===
  IF NOT public.caller_can_manage_enrollment(p_enrollment_id) THEN
    RAISE EXCEPTION 'Unauthorized: only the class teacher or an admin can calculate grades';
  END IF;

  SELECT ce.class_id, ce.student_id, c.grading_weight
  INTO v_class_id, v_student_id, v_grading_weight
  FROM public.class_enrollments ce
  JOIN public.classes c ON c.id = ce.class_id
  WHERE ce.id = p_enrollment_id;

  SELECT q.start_date, q.end_date, COALESCE(q.is_current, FALSE)
  INTO v_quarter_start, v_quarter_end, v_is_current
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

  -- Per-quarter participation read.
  -- 1. Snapshot value if present (per-quarter, authoritative).
  -- 2. Else, ONLY for the current quarter, fall back to ce.participation_grade.
  -- 3. Else NULL — past quarters with no snapshot value stay NULL,
  --    and upsert_quarter_grade's COALESCE will leave the field alone.
  SELECT
    CASE
      WHEN qgs.participation_grade IS NOT NULL THEN qgs.participation_grade
      WHEN v_is_current THEN ce.participation_grade
      ELSE NULL
    END,
    COALESCE(qgs.class_grade, ce.class_grade),
    COALESCE(qgs.class_grade_override, FALSE)
  INTO v_participation, v_current_class_grade, v_override
  FROM public.class_enrollments ce
  LEFT JOIN public.quarter_grade_snapshots qgs
    ON qgs.enrollment_id = ce.id
    AND qgs.quarter_id = p_quarter_id
  WHERE ce.id = p_enrollment_id;

  -- Academic grade from the holistic suggested-grade calculator.
  -- NULL means "no graded assignments exist for this quarter" and must
  -- not be coerced to 0 (that would render as F).
  SELECT sg.suggested_grade INTO v_academic
  FROM public.calculate_suggested_grade(p_enrollment_id, p_quarter_id) sg;

  IF v_academic IS NOT NULL AND v_participation IS NOT NULL THEN
    v_suggested := (v_academic * v_academic_weight) + (v_participation * v_participation_weight);
  ELSIF v_academic IS NOT NULL THEN
    v_suggested := v_academic;
  ELSIF v_participation IS NOT NULL THEN
    v_suggested := v_participation;
  ELSE
    v_suggested := NULL;
  END IF;

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
