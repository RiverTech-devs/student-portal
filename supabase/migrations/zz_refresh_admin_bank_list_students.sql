-- ============================================================
-- Refresh admin_bank_list_students to return the actual games_pin.
--
-- An earlier draft of inactive_student_pin_auth.sql returned a
-- pin_masked value ("•••X"). Mid-feature I switched the function
-- to return the full pin in plaintext (staff need to read it back
-- to forgetful students) and updated the Bank Helper UI to read
-- s.pin. If you applied the earlier draft of the migration but not
-- the later edit, the DB function still returns pin_masked while
-- the frontend reads s.pin — and PINs render as blank.
--
-- This file just restates the canonical version with CREATE OR
-- REPLACE so re-applying is safe even if you already have the
-- final version. Named with a zz_ prefix so it sorts after the
-- earlier inactive_student_pin_auth.sql in alphabetical order.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_bank_list_students()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_type TEXT;
  v_rows JSON;
BEGIN
  SELECT user_type INTO v_caller_type
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_caller_type NOT IN ('admin', 'teacher') THEN
    RETURN json_build_object('success', false, 'error', 'Admin or teacher access required');
  END IF;

  SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.last_name, t.first_name), '[]'::json) INTO v_rows
  FROM (
    SELECT
      up.id,
      up.first_name,
      up.last_name,
      up.grade_level,
      COALESCE(up.student_status, 'active') AS student_status,
      COALESCE(up.rtc_balance, 0) AS wallet_balance,
      COALESCE(ba.balance, 0) AS bank_balance,
      (up.games_pin IS NOT NULL) AS has_pin,
      up.games_pin AS pin
    FROM public.user_profiles up
    LEFT JOIN public.rtc_bank_accounts ba ON ba.user_id = up.id
    WHERE up.user_type = 'student'
  ) t;

  RETURN json_build_object('success', true, 'students', v_rows);
END;
$$;
