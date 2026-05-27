-- ============================================================
-- Teacher academic-grade override
--
-- Lets a teacher (or admin) manually set the Academic grade for a
-- student/quarter in the Manage Grades modal instead of relying on
-- the system-computed holistic value. When the override flag is set,
-- calculate_quarter_grades keeps the stored academic_grade instead of
-- recomputing it from assignments; the suggested/final grade still
-- derives from that overridden academic value.
--
-- Must run AFTER zzz_fix_participation_cross_quarter_overwrite.sql
-- (the current calculate_quarter_grades) — this file re-creates that
-- function verbatim plus the override branch, preserving the
-- per-quarter participation fix and the "NULL academic stays NULL"
-- behavior.
--
-- Idempotent / safe to re-run.
-- ============================================================

-- 1. Override flag column.
ALTER TABLE public.quarter_grade_snapshots
  ADD COLUMN IF NOT EXISTS academic_grade_override BOOLEAN DEFAULT FALSE;

-- 2. RPC to set or clear an academic-grade override for a quarter.
CREATE OR REPLACE FUNCTION public.set_academic_grade_override(
  p_enrollment_id UUID,
  p_quarter_id UUID,
  p_academic_grade NUMERIC DEFAULT NULL,
  p_override BOOLEAN DEFAULT TRUE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.caller_can_manage_enrollment(p_enrollment_id) THEN
    RAISE EXCEPTION 'Unauthorized: only the class teacher or an admin can override grades';
  END IF;

  INSERT INTO public.quarter_grade_snapshots (
    enrollment_id,
    quarter_id,
    academic_grade,
    academic_grade_override,
    updated_at
  )
  VALUES (
    p_enrollment_id,
    p_quarter_id,
    CASE WHEN p_override THEN p_academic_grade ELSE NULL END,
    COALESCE(p_override, FALSE),
    NOW()
  )
  ON CONFLICT (enrollment_id, quarter_id)
  DO UPDATE SET
    -- Only overwrite academic_grade when turning the override ON.
    -- When clearing it, leave the value alone; the next
    -- calculate_quarter_grades recomputes it from assignments.
    academic_grade = CASE
      WHEN p_override THEN COALESCE(p_academic_grade, public.quarter_grade_snapshots.academic_grade)
      ELSE public.quarter_grade_snapshots.academic_grade
    END,
    academic_grade_override = COALESCE(p_override, FALSE),
    updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_academic_grade_override(UUID, UUID, NUMERIC, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_academic_grade_override(UUID, UUID, NUMERIC, BOOLEAN) TO service_role;

-- 3. calculate_quarter_grades: respect the academic override.
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
  v_academic_override BOOLEAN;
  v_snapshot_academic NUMERIC;
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

  -- Per-quarter participation read (see zzz_fix_participation_cross_quarter_overwrite),
  -- plus class-grade override state and the academic override state + stored value.
  SELECT
    CASE
      WHEN qgs.participation_grade IS NOT NULL THEN qgs.participation_grade
      WHEN v_is_current THEN ce.participation_grade
      ELSE NULL
    END,
    COALESCE(qgs.class_grade, ce.class_grade),
    COALESCE(qgs.class_grade_override, FALSE),
    COALESCE(qgs.academic_grade_override, FALSE),
    qgs.academic_grade
  INTO v_participation, v_current_class_grade, v_override, v_academic_override, v_snapshot_academic
  FROM public.class_enrollments ce
  LEFT JOIN public.quarter_grade_snapshots qgs
    ON qgs.enrollment_id = ce.id
    AND qgs.quarter_id = p_quarter_id
  WHERE ce.id = p_enrollment_id;

  -- Academic grade: keep the teacher's manual override when set,
  -- otherwise recompute from the holistic suggested-grade calculator.
  IF v_academic_override = TRUE THEN
    v_academic := v_snapshot_academic;
  ELSE
    SELECT sg.suggested_grade INTO v_academic
    FROM public.calculate_suggested_grade(p_enrollment_id, p_quarter_id) sg;
  END IF;

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
