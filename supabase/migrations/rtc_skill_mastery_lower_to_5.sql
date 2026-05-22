-- Lower skill mastery RTC reward from 50 to 5 and tighten trigger condition.
--
-- The original trigger in rtc_currency_system.sql awarded 50 RTC on any
-- transition into 'mastered' OR 'activated'. With BKT auto-promoting
-- skills more aggressively, this turned out to be a huge RTC influx
-- relative to other earn paths (assignments ~30, gauntlet 1-3, arcade ~1-5).
--
-- This migration:
--   1. Redefines the trigger function to award 5 RTC.
--   2. Tightens the condition to fire only on transition INTO 'mastered'
--      from a different state. Activated transitions no longer pay
--      (a demoted-then-re-mastered skill is also blocked by the existing
--      UNIQUE(user_id, reference_id, reference_type) constraint, so the
--      tightening is belt-and-suspenders).
--   3. Writes a one-time compensating admin_adjustment for every user who
--      previously received 50-RTC mastery awards, reducing their balance
--      by 45 × (number of past awards). Uses admin_adjustment so balances
--      that would go negative clamp to 0. Idempotent via a marker
--      reference_type — re-running this migration is a no-op.

CREATE OR REPLACE FUNCTION public.rtc_skill_mastery_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Only fire on first transition INTO 'mastered' (from any other state).
  -- 'activated' transitions no longer pay. The UNIQUE refId constraint
  -- already prevents same-row double-payment if a skill is demoted and
  -- re-mastered later.
  IF NEW.state = 'mastered' AND (OLD.state IS DISTINCT FROM 'mastered') THEN
    SELECT public.process_rtc_transaction(
      p_user_id := NEW.user_id,
      p_amount := 5,
      p_transaction_type := 'earn_skill',
      p_description := 'Skill mastery: ' || COALESCE(NEW.skill_name, 'Unknown skill'),
      p_reference_id := NEW.id::TEXT,
      p_reference_type := 'skill_progress'
    ) INTO v_result;
  END IF;

  RETURN NEW;
END;
$$;

-- One-time retro fix: compensate past 50-RTC mastery awards down to 5.
-- Done as a single bulk adjustment per affected user (cleaner ledger
-- than one row per skill). Marker reference_type prevents re-applying.
DO $$
DECLARE
  v_user_row RECORD;
BEGIN
  FOR v_user_row IN
    SELECT user_id, COUNT(*) AS award_count
    FROM public.rtc_transactions
    WHERE transaction_type = 'earn_skill'
      AND reference_type = 'skill_progress'
      AND amount = 50
    GROUP BY user_id
  LOOP
    -- Skip if this user already received the compensating adjustment.
    IF NOT EXISTS (
      SELECT 1
      FROM public.rtc_transactions
      WHERE user_id = v_user_row.user_id
        AND reference_type = 'skill_progress_revert_50_to_5'
    ) THEN
      PERFORM public.process_rtc_transaction(
        p_user_id := v_user_row.user_id,
        p_amount := (-(v_user_row.award_count * 45))::INTEGER,
        p_transaction_type := 'admin_adjustment',
        p_description := 'Skill mastery reward corrected from 50 to 5 (' || v_user_row.award_count || ' past awards)',
        p_reference_id := 'mastery_revert_2026_05_22:' || v_user_row.user_id::TEXT,
        p_reference_type := 'skill_progress_revert_50_to_5'
      );
    END IF;
  END LOOP;
END $$;
