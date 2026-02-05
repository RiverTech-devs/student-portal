-- Fix: classes with no assignments were getting class_grade = 0 instead of NULL
-- This caused them to count as an F (0.0 GPA) in report card calculations
--
-- Root cause: COALESCE(v_academic, 0) forced NULL academic grades to 0
-- Fix: Keep NULL when there are no assignments, only use 0 as academic fallback
-- when participation grade exists (so the class still gets a grade from participation)

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

  -- DO NOT coalesce NULL academic to 0. NULL means no assignments exist.
  -- Only produce a grade when there is actual data (academic or participation).

  -- Calculate suggested class grade
  IF v_academic IS NOT NULL AND v_participation IS NOT NULL THEN
    -- Both academic and participation exist: weighted combination
    v_suggested := (v_academic * v_academic_weight) + (v_participation * v_participation_weight);
  ELSIF v_academic IS NOT NULL THEN
    -- Only academic exists
    v_suggested := v_academic;
  ELSIF v_participation IS NOT NULL THEN
    -- Only participation exists (no assignments in this quarter)
    v_suggested := v_participation;
  ELSE
    -- No data at all: leave as NULL (will not count in GPA)
    v_suggested := NULL;
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

  -- If teacher has overridden, keep their grade; otherwise use suggested
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

GRANT EXECUTE ON FUNCTION calculate_quarter_grades(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_quarter_grades(UUID, UUID) TO service_role;

-- Also fix any existing snapshots that have class_grade = 0 due to no actual data.
-- A class_grade of exactly 0 with NULL academic_grade means no assignments existed.
-- The grade rounding logic makes 55 the minimum real grade, so 0 is always the bug case.
UPDATE quarter_grade_snapshots
SET class_grade = NULL,
    suggested_class_grade = NULL
WHERE class_grade = 0
  AND academic_grade IS NULL;
