-- ============================================================
-- PIN-only sign-in.
--
-- The PIN sign-in flow no longer asks for the student's name —
-- the 4-character PIN is the only credential. That means a PIN
-- must uniquely identify exactly one student, so we:
--   1. Resolve any pre-existing duplicate PINs by regenerating.
--   2. Add a partial UNIQUE index on user_profiles(games_pin) so
--      future inserts/updates can never collide.
--   3. Update staff_set_student_pin to reject a PIN already taken.
--   4. Add pin_lookup_by_pin(p_pin) for the edge function — the
--      old pin_lookup_student(first, last, pin) variant is dropped.
--
-- Security trade-off: with name+PIN we needed an attacker to guess
-- both, which made brute force practically impossible. PIN-only is
-- a single 4-char secret from a ~31-char alphabet (≈923K combos).
-- That's fine against random guessing for a small school as long as
-- the edge function (or a wrapping rate limiter) caps attempts —
-- a follow-up will add a pin_login_attempts lockout table.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Resolve any existing duplicate PINs by regenerating them.
--    This should be a no-op in most installs since
--    _generate_games_pin already avoids collisions, but staff
--    could have manually set the same custom PIN on two students
--    via staff_set_student_pin (which didn't enforce uniqueness
--    before this migration).
-- ------------------------------------------------------------
DO $$
DECLARE
  v_row RECORD;
BEGIN
  FOR v_row IN
    SELECT id
    FROM (
      SELECT id,
             games_pin,
             ROW_NUMBER() OVER (PARTITION BY games_pin ORDER BY games_pin_set_at NULLS FIRST, created_at NULLS FIRST, id) AS rn
      FROM public.user_profiles
      WHERE games_pin IS NOT NULL
    ) s
    WHERE rn > 1
  LOOP
    UPDATE public.user_profiles
    SET games_pin = public._generate_games_pin(),
        games_pin_set_at = now()
    WHERE id = v_row.id;
  END LOOP;
END
$$;

-- ------------------------------------------------------------
-- 2. Partial UNIQUE index on games_pin
-- ------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_user_profiles_games_pin_unique;
CREATE UNIQUE INDEX idx_user_profiles_games_pin_unique
  ON public.user_profiles (games_pin)
  WHERE games_pin IS NOT NULL;

-- The old composite index for (first_name, last_name, games_pin)
-- isn't needed anymore — the unique index above covers the lookup.
DROP INDEX IF EXISTS public.idx_user_profiles_games_pin_lookup;

-- ------------------------------------------------------------
-- 3. staff_set_student_pin now rejects a PIN already taken by
--    another student. The auto-generator stays collision-safe via
--    its existing loop in _generate_games_pin.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.staff_set_student_pin(
  p_user_id UUID,
  p_pin TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id UUID;
  v_caller_type TEXT;
  v_target_type TEXT;
  v_normalized_pin TEXT;
  v_existing UUID;
BEGIN
  SELECT id, user_type INTO v_caller_id, v_caller_type
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Caller not found');
  END IF;

  IF v_caller_type NOT IN ('admin', 'teacher') THEN
    RETURN json_build_object('success', false, 'error', 'Admin or teacher access required');
  END IF;

  SELECT user_type INTO v_target_type
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_target_type IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Student not found');
  END IF;

  IF v_target_type <> 'student' THEN
    RETURN json_build_object('success', false, 'error', 'Target user is not a student');
  END IF;

  v_normalized_pin := NULLIF(upper(trim(COALESCE(p_pin, ''))), '');

  IF v_normalized_pin IS NOT NULL AND v_normalized_pin !~ '^[A-Z0-9]{4}$' THEN
    RETURN json_build_object('success', false, 'error', 'PIN must be exactly 4 letters or digits');
  END IF;

  -- Reject duplicates. Since PINs are now the only sign-in credential,
  -- two students can't share one.
  IF v_normalized_pin IS NOT NULL THEN
    SELECT id INTO v_existing
    FROM public.user_profiles
    WHERE games_pin = v_normalized_pin
      AND id <> p_user_id
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
      RETURN json_build_object('success', false, 'error', 'That PIN is already in use by another student. Try a different one.');
    END IF;
  END IF;

  UPDATE public.user_profiles
  SET games_pin = v_normalized_pin,
      games_pin_set_by = v_caller_id,
      games_pin_set_at = CASE WHEN v_normalized_pin IS NULL THEN NULL ELSE now() END
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'pin_set', v_normalized_pin IS NOT NULL,
    'pin', v_normalized_pin
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_set_student_pin(UUID, TEXT) TO authenticated;

-- ------------------------------------------------------------
-- 4. pin_lookup_by_pin(p_pin) — service_role-only RPC the edge
--    function calls. Returns the (unique) student matching the PIN,
--    or { success: false } with a generic message otherwise.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pin_lookup_by_pin(p_pin TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row RECORD;
  v_normalized_pin TEXT;
BEGIN
  IF p_pin IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'pin is required');
  END IF;

  v_normalized_pin := upper(trim(p_pin));

  IF v_normalized_pin !~ '^[A-Z0-9]{4}$' THEN
    RETURN json_build_object('success', false, 'error', 'Invalid PIN format');
  END IF;

  SELECT id, auth_user_id, first_name, last_name
  INTO v_row
  FROM public.user_profiles
  WHERE games_pin = v_normalized_pin
    AND user_type = 'student'
  LIMIT 1;

  IF v_row.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No match');
  END IF;

  RETURN json_build_object(
    'success', true,
    'user_id', v_row.id,
    'auth_user_id', v_row.auth_user_id,
    'first_name', v_row.first_name,
    'last_name', v_row.last_name
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.pin_lookup_by_pin(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.pin_lookup_by_pin(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.pin_lookup_by_pin(TEXT) TO service_role;

-- The name+PIN variant is no longer used.
DROP FUNCTION IF EXISTS public.pin_lookup_student(TEXT, TEXT, TEXT);
