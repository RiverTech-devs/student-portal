-- ============================================================
-- SECURITY FIX: Add authorization checks to all SECURITY DEFINER
-- RPC functions that currently accept any authenticated caller.
--
-- Vulnerabilities fixed:
-- 1. process_rtc_transaction() — students could credit RTC to any account
-- 2. upsert_quarter_grade() — students could modify any grades
-- 3. calculate_quarter_grades() — students could recalculate anyone's grades
-- 4. set_class_grade_override() — students could override class grades
-- 5. calculate_suggested_grade() — students could read anyone's grade data
--
-- Approach: Each function now validates that the caller (auth.uid())
-- is authorized before proceeding. Grade functions require the caller
-- to be the teacher of the class or an admin. RTC transaction function
-- validates based on transaction type.
-- ============================================================


-- ============================================================
-- 1. HELPER: Check if caller is teacher/admin for an enrollment
-- ============================================================
CREATE OR REPLACE FUNCTION public.caller_can_manage_enrollment(p_enrollment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_type TEXT;
  v_authorized BOOLEAN := FALSE;
BEGIN
  SELECT user_type INTO v_caller_type
  FROM public.user_profiles WHERE id = auth.uid();

  -- Admins can manage any enrollment
  IF v_caller_type = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Teachers can manage enrollments in their classes
  IF v_caller_type = 'teacher' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON ce.class_id = c.id
      WHERE ce.id = p_enrollment_id
        AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    ) INTO v_authorized;
    RETURN v_authorized;
  END IF;

  -- Students, parents, etc. cannot manage enrollments
  RETURN FALSE;
END;
$$;


-- ============================================================
-- 2. FIX: process_rtc_transaction()
--    - admin_adjustment, earn_manual → teacher/admin only
--    - earn_skill, earn_assignment → trigger context OR teacher/admin
--    - earn_arcade, spend_* → p_user_id must be caller's own ID
--    - Force p_created_by to auth.uid() (prevent fake attribution)
-- ============================================================
CREATE OR REPLACE FUNCTION public.process_rtc_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
  v_caller_type TEXT;
  v_actual_created_by UUID;
BEGIN
  -- Validate transaction type
  IF p_transaction_type NOT IN (
    'earn_manual', 'earn_skill', 'earn_assignment', 'earn_arcade',
    'spend_cosmetic', 'spend_reward', 'admin_adjustment'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid transaction type');
  END IF;

  -- === AUTHORIZATION CHECK ===
  -- Force created_by to the actual caller (prevent fake attribution)
  v_actual_created_by := COALESCE(auth.uid(), p_created_by);

  -- Get caller's role (may be NULL inside trigger context)
  SELECT user_type INTO v_caller_type
  FROM public.user_profiles WHERE id = auth.uid();

  -- admin_adjustment: admin only
  IF p_transaction_type = 'admin_adjustment' THEN
    IF v_caller_type IS DISTINCT FROM 'admin' THEN
      RETURN json_build_object('success', false, 'error', 'Only admins can make admin adjustments');
    END IF;
  -- earn_manual: teacher or admin only
  ELSIF p_transaction_type = 'earn_manual' THEN
    IF v_caller_type NOT IN ('teacher', 'admin') THEN
      RETURN json_build_object('success', false, 'error', 'Only teachers/admins can award manual RTC');
    END IF;
  -- earn_skill, earn_assignment: allow from trigger context (pg_trigger_depth > 0) or teacher/admin
  ELSIF p_transaction_type IN ('earn_skill', 'earn_assignment') THEN
    IF pg_trigger_depth() = 0 AND (v_caller_type IS NULL OR v_caller_type NOT IN ('teacher', 'admin')) THEN
      RETURN json_build_object('success', false, 'error', 'Skill/assignment rewards are system-granted only');
    END IF;
  -- earn_arcade, spend_cosmetic, spend_reward: only for your own account
  ELSIF p_transaction_type IN ('earn_arcade', 'spend_cosmetic', 'spend_reward') THEN
    IF p_user_id IS DISTINCT FROM auth.uid() THEN
      RETURN json_build_object('success', false, 'error', 'Can only process arcade/spend transactions for your own account');
    END IF;
  END IF;

  -- Prevent duplicate rewards via reference_id + reference_type + user_id
  IF p_reference_id IS NOT NULL AND p_reference_type IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.rtc_transactions
      WHERE user_id = p_user_id
        AND reference_id = p_reference_id
        AND reference_type = p_reference_type
    ) THEN
      RETURN json_build_object('success', false, 'error', 'Duplicate transaction: reward already granted');
    END IF;
  END IF;

  -- Lock the user row to prevent race conditions
  SELECT rtc_balance INTO v_current_balance
  FROM public.user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  v_new_balance := v_current_balance + p_amount;

  -- Prevent negative balances on spends (not admin adjustments)
  IF v_new_balance < 0 AND p_transaction_type != 'admin_adjustment' THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Clamp to 0 for admin adjustments that go negative
  IF v_new_balance < 0 THEN
    v_new_balance := 0;
  END IF;

  -- Update balance
  UPDATE public.user_profiles
  SET rtc_balance = v_new_balance
  WHERE id = p_user_id;

  -- Insert transaction record (with REAL caller, not spoofed)
  INSERT INTO public.rtc_transactions (
    user_id, amount, transaction_type, description,
    reference_id, reference_type, balance_after, created_by
  ) VALUES (
    p_user_id, p_amount, p_transaction_type, p_description,
    p_reference_id, p_reference_type, v_new_balance, v_actual_created_by
  ) RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- ============================================================
-- 3. FIX: upsert_quarter_grade()
--    Require caller to be teacher of the class or admin
-- ============================================================
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
  -- === AUTHORIZATION CHECK ===
  -- Allow from trigger context (calculate_quarter_grades calls this)
  -- or from authorized teacher/admin
  IF pg_trigger_depth() = 0 AND NOT public.caller_can_manage_enrollment(p_enrollment_id) THEN
    RAISE EXCEPTION 'Unauthorized: only the class teacher or an admin can modify grades';
  END IF;

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


-- ============================================================
-- 4. FIX: calculate_quarter_grades()
--    Require caller to be teacher of the class or admin
-- ============================================================
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
BEGIN
  -- === AUTHORIZATION CHECK ===
  IF NOT public.caller_can_manage_enrollment(p_enrollment_id) THEN
    RAISE EXCEPTION 'Unauthorized: only the class teacher or an admin can calculate grades';
  END IF;

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

  -- Get existing grades and override status
  SELECT
    COALESCE(qgs.participation_grade, ce.participation_grade),
    COALESCE(qgs.class_grade, ce.class_grade),
    COALESCE(qgs.class_grade_override, FALSE)
  INTO v_participation, v_current_class_grade, v_override
  FROM public.class_enrollments ce
  LEFT JOIN public.quarter_grade_snapshots qgs ON qgs.enrollment_id = ce.id AND qgs.quarter_id = p_quarter_id
  WHERE ce.id = p_enrollment_id;

  -- Calculate academic grade (simple average)
  SELECT AVG((asub.points_earned::numeric / NULLIF(a.max_points::numeric, 0)) * 100)
  INTO v_academic
  FROM public.assignments a
  JOIN public.assignment_submissions asub ON asub.assignment_id = a.id
  WHERE a.class_id = v_class_id
    AND asub.student_id = v_student_id
    AND a.due_date >= v_quarter_start
    AND a.due_date <= v_quarter_end
    AND asub.points_earned IS NOT NULL
    AND asub.status = 'graded';

  v_academic := COALESCE(v_academic, 0);

  -- Calculate suggested grade using holistic method
  SELECT sg.suggested_grade INTO v_suggested
  FROM public.calculate_suggested_grade(p_enrollment_id, p_quarter_id) sg;

  v_suggested := COALESCE(v_suggested, v_academic);

  -- If teacher has NOT overridden, use the suggested grade
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


-- ============================================================
-- 5. FIX: calculate_suggested_grade()
--    Require caller to be teacher of the class or admin
-- ============================================================
DROP FUNCTION IF EXISTS calculate_suggested_grade(UUID, UUID);
CREATE OR REPLACE FUNCTION public.calculate_suggested_grade(
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
SET search_path = ''
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
  -- === AUTHORIZATION CHECK ===
  IF NOT public.caller_can_manage_enrollment(p_enrollment_id) THEN
    RAISE EXCEPTION 'Unauthorized: only the class teacher or an admin can view suggested grades';
  END IF;

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

  -- Count graded assignments in this quarter
  SELECT COUNT(*)
  INTO v_assignment_count
  FROM public.assignments a
  JOIN public.assignment_submissions asub ON asub.assignment_id = a.id
  WHERE a.class_id = v_class_id
    AND asub.student_id = v_student_id
    AND a.due_date >= v_quarter_start
    AND a.due_date <= v_quarter_end
    AND asub.points_earned IS NOT NULL
    AND asub.status = 'graded';

  -- If no assignments, return zeros
  IF v_assignment_count = 0 THEN
    RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::INTEGER, '{}'::JSONB;
    RETURN;
  END IF;

  -- Calculate grade distribution by letter grade bucket
  SELECT jsonb_object_agg(bucket, cnt)
  INTO v_distribution
  FROM (
    SELECT
      CASE
        WHEN pct >= 90 THEN 'A'
        WHEN pct >= 80 THEN 'B'
        WHEN pct >= 70 THEN 'C'
        WHEN pct >= 60 THEN 'D'
        ELSE 'F'
      END AS bucket,
      COUNT(*) AS cnt
    FROM (
      SELECT (asub.points_earned::numeric / NULLIF(a.max_points::numeric, 0)) * 100 AS pct
      FROM public.assignments a
      JOIN public.assignment_submissions asub ON asub.assignment_id = a.id
      WHERE a.class_id = v_class_id
        AND asub.student_id = v_student_id
        AND a.due_date >= v_quarter_start
        AND a.due_date <= v_quarter_end
        AND asub.points_earned IS NOT NULL
        AND asub.status = 'graded'
    ) grades
    GROUP BY bucket
  ) dist;

  -- Calculate MODE grade (most common letter grade bucket midpoint)
  SELECT
    CASE mode_bucket
      WHEN 'A' THEN 95
      WHEN 'B' THEN 85
      WHEN 'C' THEN 75
      WHEN 'D' THEN 65
      ELSE 50
    END INTO v_mode_grade
  FROM (
    SELECT bucket AS mode_bucket
    FROM (
      SELECT
        CASE
          WHEN pct >= 90 THEN 'A'
          WHEN pct >= 80 THEN 'B'
          WHEN pct >= 70 THEN 'C'
          WHEN pct >= 60 THEN 'D'
          ELSE 'F'
        END AS bucket
      FROM (
        SELECT (asub.points_earned::numeric / NULLIF(a.max_points::numeric, 0)) * 100 AS pct
        FROM public.assignments a
        JOIN public.assignment_submissions asub ON asub.assignment_id = a.id
        WHERE a.class_id = v_class_id
          AND asub.student_id = v_student_id
          AND a.due_date >= v_quarter_start
          AND a.due_date <= v_quarter_end
          AND asub.points_earned IS NOT NULL
          AND asub.status = 'graded'
      ) grades
    ) buckets
    GROUP BY bucket
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) mode_result;

  -- Calculate recent average (last 5 assignments, weighted more heavily)
  SELECT AVG(pct) INTO v_recent_avg
  FROM (
    SELECT (asub.points_earned::numeric / NULLIF(a.max_points::numeric, 0)) * 100 AS pct
    FROM public.assignments a
    JOIN public.assignment_submissions asub ON asub.assignment_id = a.id
    WHERE a.class_id = v_class_id
      AND asub.student_id = v_student_id
      AND a.due_date >= v_quarter_start
      AND a.due_date <= v_quarter_end
      AND asub.points_earned IS NOT NULL
      AND asub.status = 'graded'
    ORDER BY a.due_date DESC
    LIMIT 5
  ) recent;

  -- Suggested grade: weighted blend of mode (60%) and recent average (40%)
  v_mode_grade := COALESCE(v_mode_grade, 0);
  v_recent_avg := COALESCE(v_recent_avg, 0);
  v_suggested := (v_mode_grade * 0.6) + (v_recent_avg * 0.4);

  RETURN QUERY SELECT
    ROUND(v_suggested, 2),
    ROUND(v_mode_grade, 2),
    ROUND(v_recent_avg, 2),
    v_assignment_count,
    COALESCE(v_distribution, '{}'::jsonb);
END;
$$;


-- ============================================================
-- 6. FIX: set_class_grade_override()
--    Require caller to be teacher of the class or admin
-- ============================================================
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
  -- === AUTHORIZATION CHECK ===
  IF NOT public.caller_can_manage_enrollment(p_enrollment_id) THEN
    RAISE EXCEPTION 'Unauthorized: only the class teacher or an admin can override grades';
  END IF;

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


-- ============================================================
-- 7. Re-grant execute (unchanged — functions still callable,
--    but now they enforce authorization internally)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.caller_can_manage_enrollment TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_rtc_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_quarter_grade TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_quarter_grades TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_suggested_grade TO authenticated;
GRANT EXECUTE ON FUNCTION set_class_grade_override TO authenticated;


-- ============================================================
-- Done. All critical RPC functions now validate the caller.
-- ============================================================
