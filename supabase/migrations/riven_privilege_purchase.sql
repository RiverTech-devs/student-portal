-- ============================================================
-- Riven: teacher_purchase_privilege
--
-- Atomic function: deduct RTC (spend_privilege) + record a
-- privilege grant with source='purchased'. Mirrors the student-
-- facing rtc_purchase_privilege but callable by teachers/admins
-- on behalf of any student, with optional price/duration overrides.
-- Used by the Riven terminal shop integration.
-- ============================================================

CREATE OR REPLACE FUNCTION public.teacher_purchase_privilege(
  p_student_id            UUID,
  p_privilege_id          UUID    DEFAULT NULL,
  p_custom_privilege_name TEXT    DEFAULT NULL,
  p_price_override        INTEGER DEFAULT NULL,
  p_duration_days_override INTEGER DEFAULT NULL,
  p_description           TEXT    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id      UUID;
  v_caller_type    TEXT;
  v_privilege      RECORD;
  v_priv_name      TEXT;
  v_priv_price     INTEGER;
  v_duration_days  INTEGER;
  v_expires_at     TIMESTAMPTZ;
  v_grant_id       UUID;
  v_txn_result     JSON;
  v_new_balance    INTEGER;
BEGIN
  -- Identify caller via auth.uid() (user_profiles.id = auth.uid() in this schema)
  v_caller_id := auth.uid();
  SELECT user_type INTO v_caller_type
  FROM public.user_profiles WHERE id = v_caller_id;

  IF v_caller_type NOT IN ('teacher', 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Only teachers and admins can process privilege purchases');
  END IF;

  -- Validate student
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = p_student_id AND user_type = 'student'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Student not found');
  END IF;

  -- Resolve privilege name, price, duration
  IF p_privilege_id IS NOT NULL THEN
    SELECT id, name, price, duration_days, is_active INTO v_privilege
    FROM public.rtc_privileges WHERE id = p_privilege_id;

    IF v_privilege.id IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Privilege not found');
    END IF;
    IF NOT v_privilege.is_active THEN
      RETURN json_build_object('success', false, 'error', 'This privilege is no longer available');
    END IF;

    v_priv_name    := v_privilege.name;
    v_priv_price   := COALESCE(p_price_override, v_privilege.price);
    v_duration_days := COALESCE(p_duration_days_override, v_privilege.duration_days);
  ELSE
    -- Custom / ad-hoc privilege
    IF p_custom_privilege_name IS NULL OR trim(p_custom_privilege_name) = '' THEN
      RETURN json_build_object('success', false, 'error', 'A privilege name is required');
    END IF;
    v_priv_name    := trim(p_custom_privilege_name);
    v_priv_price   := COALESCE(p_price_override, 0);
    v_duration_days := p_duration_days_override;
  END IF;

  -- Calculate expiry (NULL = permanent)
  IF v_duration_days IS NOT NULL AND v_duration_days > 0 THEN
    v_expires_at := now() + (v_duration_days || ' days')::INTERVAL;
  ELSE
    v_expires_at := NULL;
  END IF;

  -- Deduct RTC if there is a price
  IF v_priv_price > 0 THEN
    SELECT public.process_rtc_transaction(
      p_user_id         := p_student_id,
      p_amount          := -v_priv_price,
      p_transaction_type := 'spend_privilege',
      p_description     := 'Privilege: ' || v_priv_name,
      p_created_by      := v_caller_id
    ) INTO v_txn_result;

    IF NOT (v_txn_result->>'success')::boolean THEN
      RETURN json_build_object('success', false, 'error', v_txn_result->>'error');
    END IF;
    v_new_balance := (v_txn_result->>'new_balance')::integer;
  ELSE
    SELECT rtc_balance INTO v_new_balance
    FROM public.user_profiles WHERE id = p_student_id;
  END IF;

  -- Lazy expiry of stale non-permanent grants for this student
  UPDATE public.rtc_student_privileges
  SET is_active = false
  WHERE student_id = p_student_id
    AND is_active = true
    AND is_permanent = false
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  -- Insert the grant record with source='purchased'
  INSERT INTO public.rtc_student_privileges (
    student_id, privilege_id, expires_at, price_paid,
    is_active, source, is_permanent, granted_by,
    custom_name, custom_description, grant_reason
  ) VALUES (
    p_student_id,
    p_privilege_id,
    v_expires_at,
    v_priv_price,
    true,
    'purchased',
    (v_expires_at IS NULL),
    v_caller_id,
    CASE WHEN p_privilege_id IS NULL THEN v_priv_name   ELSE NULL END,
    CASE WHEN p_privilege_id IS NULL THEN p_description ELSE NULL END,
    p_description
  ) RETURNING id INTO v_grant_id;

  RETURN json_build_object(
    'success',        true,
    'grant_id',       v_grant_id,
    'privilege_name', v_priv_name,
    'new_balance',    v_new_balance,
    'price_paid',     v_priv_price,
    'expires_at',     v_expires_at,
    'is_permanent',   (v_expires_at IS NULL)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.teacher_purchase_privilege(UUID, UUID, TEXT, INTEGER, INTEGER, TEXT) TO authenticated;
