-- ============================================================
-- RTC Rewards for Regular Assignments
-- Adds rtc_reward column to assignments table and a trigger
-- on assignment_submissions to award RTC when graded
-- ============================================================

-- Add rtc_reward column to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS rtc_reward INTEGER DEFAULT 0;

-- Create trigger function for regular assignment RTC rewards
CREATE OR REPLACE FUNCTION public.rtc_regular_assignment_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSON;
  v_reward INTEGER;
  v_max_reward INTEGER;
  v_max_points INTEGER;
  v_score_pct NUMERIC;
BEGIN
  -- Only fire when status changes to 'graded' and points_earned is set
  IF NEW.status != 'graded' OR NEW.points_earned IS NULL THEN
    RETURN NEW;
  END IF;

  -- Skip if this was already graded before (UPDATE case where old status was already graded)
  IF TG_OP = 'UPDATE' AND OLD.status = 'graded' THEN
    RETURN NEW;
  END IF;

  -- Get the assignment's rtc_reward and max_points
  SELECT COALESCE(a.rtc_reward, 0), COALESCE(a.max_points, 100)
  INTO v_max_reward, v_max_points
  FROM public.assignments a
  WHERE a.id = NEW.assignment_id;

  -- If rtc_reward is 0 or not set, skip
  IF v_max_reward IS NULL OR v_max_reward = 0 THEN
    RETURN NEW;
  END IF;

  -- Calculate score percentage
  IF v_max_points > 0 THEN
    v_score_pct := (NEW.points_earned::NUMERIC / v_max_points) * 100;
  ELSE
    RETURN NEW;
  END IF;

  -- Determine reward tier based on percentage
  IF v_score_pct >= 90 THEN
    v_reward := v_max_reward;
  ELSIF v_score_pct >= 80 THEN
    v_reward := FLOOR(v_max_reward * 2.0 / 3 / 5) * 5;
  ELSIF v_score_pct >= 70 THEN
    v_reward := FLOOR(v_max_reward * 1.0 / 3 / 5) * 5;
  ELSE
    RETURN NEW; -- No reward below 70%
  END IF;

  -- Skip if calculated reward is 0
  IF v_reward <= 0 THEN
    RETURN NEW;
  END IF;

  -- Award RTC (duplicate check via reference_id prevents double awards)
  SELECT public.process_rtc_transaction(
    p_user_id := NEW.student_id,
    p_amount := v_reward,
    p_transaction_type := 'earn_assignment',
    p_description := 'Assignment grade: ' || ROUND(v_score_pct) || '%',
    p_reference_id := NEW.id::TEXT,
    p_reference_type := 'assignment_submissions'
  ) INTO v_result;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_rtc_regular_assignment_reward ON assignment_submissions;
CREATE TRIGGER trigger_rtc_regular_assignment_reward
  AFTER INSERT OR UPDATE OF status, points_earned ON assignment_submissions
  FOR EACH ROW
  WHEN (NEW.status = 'graded' AND NEW.points_earned IS NOT NULL)
  EXECUTE FUNCTION public.rtc_regular_assignment_reward();
