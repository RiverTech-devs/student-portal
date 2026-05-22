-- Refund students who were over-deducted by the earlier 50→5 mastery revert
-- (rtc_skill_mastery_lower_to_5.sql) due to phantom earn_skill rows.
--
-- Background:
--   Before zz_fix_protect_profile_trigger_bypass_for_security_definer.sql
--   landed, the protect_user_profile_columns BEFORE-UPDATE trigger on
--   user_profiles silently reverted any rtc_balance change made from a
--   session whose auth.uid() mapped to a student — even when the write
--   was coming from a SECURITY DEFINER RPC like process_rtc_transaction.
--
--   Result: when the skill tree bulk-upserted mastered skills, the
--   rtc_skill_mastery_reward trigger fired per row, each call INSERTed
--   an rtc_transactions row, but the wallet UPDATE got reverted. We
--   ended up with "phantom" earn_skill rows: logged but never landed
--   in the wallet. Cailyn Baze's history is a textbook example —
--   51 rows on 2026-05-07 15:48:48, all with balance_after = 1913 and
--   amount = 50, yet her wallet sat at 1863 right after.
--
--   When the follow-up migration `rtc_skill_mastery_lower_to_5.sql`
--   tried to revert the 50→5 inflation by deducting 45 × (count of
--   amount=50 earn_skill rows), it overcounted because most of those
--   rows were phantoms that never inflated the wallet in the first
--   place. Students who had high phantom rates got over-deducted.
--
-- This migration:
--   1. Recomputes the correct revert per user using the wallet as the
--      source of truth: real_earn_skill_landed = pre_revert_balance
--      minus all non-skill, non-our-revert transaction amounts. The
--      wallet had already filtered out phantoms, so this gives an
--      accurate "real masteries landed" count.
--   2. Issues a one-time admin_adjustment to each affected user equal
--      to the over-deducted amount, restoring the over-taken RTC.
--   3. Is idempotent — re-runs are no-ops via the
--      'skill_progress_revert_refund' marker reference_type.
--
-- NOTE: the underlying trigger bug is already fixed by
-- zz_fix_protect_profile_trigger_bypass_for_security_definer.sql.
-- No new code change needed there; this migration only addresses
-- the historical damage.

DO $$
DECLARE
  v_user_row RECORD;
  v_current INTEGER;
  v_refund INTEGER;
  v_new INTEGER;
  v_applied INTEGER := 0;
  v_total INTEGER := 0;
BEGIN
  FOR v_user_row IN
    WITH user_summary AS (
      SELECT
        user_id,
        SUM(CASE WHEN reference_type LIKE 'skill_progress_revert%' THEN amount ELSE 0 END) AS our_revert_sum,
        SUM(CASE
          WHEN transaction_type <> 'earn_skill'
            AND (reference_type IS NULL OR reference_type NOT LIKE 'skill_progress_revert%')
          THEN amount ELSE 0
        END) AS other_landed_sum
      FROM public.rtc_transactions
      GROUP BY user_id
    ),
    calc AS (
      SELECT
        u.user_id,
        ABS(u.our_revert_sum)
          - FLOOR(GREATEST(0, up.rtc_balance + ABS(u.our_revert_sum) - u.other_landed_sum) / 50.0)::INTEGER * 45
          AS refund
      FROM user_summary u
      JOIN public.user_profiles up ON up.id = u.user_id
      WHERE u.our_revert_sum < 0
    )
    SELECT user_id, refund::INTEGER AS refund
    FROM calc
    WHERE refund > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.rtc_transactions t
        WHERE t.user_id = calc.user_id
          AND t.reference_type = 'skill_progress_revert_refund'
      )
  LOOP
    SELECT rtc_balance INTO v_current
    FROM public.user_profiles
    WHERE id = v_user_row.user_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE NOTICE 'No profile for %', v_user_row.user_id;
      CONTINUE;
    END IF;

    v_refund := v_user_row.refund;
    v_new := v_current + v_refund;

    UPDATE public.user_profiles
    SET rtc_balance = v_new
    WHERE id = v_user_row.user_id;

    INSERT INTO public.rtc_transactions (
      user_id, amount, transaction_type, description,
      reference_id, reference_type, balance_after
    ) VALUES (
      v_user_row.user_id,
      v_refund,
      'admin_adjustment',
      'Refund: over-deducted from 50→5 mastery revert due to pre-fix phantom earn_skill rows',
      'mastery_revert_refund_2026_05_22:' || v_user_row.user_id::TEXT,
      'skill_progress_revert_refund',
      v_new
    );

    v_applied := v_applied + 1;
    v_total := v_total + v_refund;
  END LOOP;

  RAISE NOTICE 'Refunded % users, % RTC total.', v_applied, v_total;
END $$;
