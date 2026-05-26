-- ============================================================
-- RTC Privilege Grants
--
-- Lets teachers and admins grant privileges directly to a student
-- (bypassing the purchase flow). Grants may be:
--   - permanent (no expiry), or
--   - time-bound (custom duration in days)
-- Ad-hoc privileges can be defined inline on the grant without
-- adding them to the catalog (custom_name / custom_icon /
-- custom_description). Revocation deactivates the grant and
-- records who revoked + why.
-- ============================================================

-- 1. Extend rtc_student_privileges -----------------------------------------

ALTER TABLE rtc_student_privileges
  ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'purchased',
  ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_name TEXT,
  ADD COLUMN IF NOT EXISTS custom_icon TEXT,
  ADD COLUMN IF NOT EXISTS custom_description TEXT,
  ADD COLUMN IF NOT EXISTS grant_reason TEXT,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoke_reason TEXT;

ALTER TABLE rtc_student_privileges ALTER COLUMN privilege_id DROP NOT NULL;
ALTER TABLE rtc_student_privileges ALTER COLUMN expires_at  DROP NOT NULL;
ALTER TABLE rtc_student_privileges ALTER COLUMN price_paid  DROP NOT NULL;

ALTER TABLE rtc_student_privileges
  DROP CONSTRAINT IF EXISTS rtc_student_privileges_source_check;
ALTER TABLE rtc_student_privileges
  ADD  CONSTRAINT rtc_student_privileges_source_check
       CHECK (source IN ('purchased', 'granted'));

ALTER TABLE rtc_student_privileges
  DROP CONSTRAINT IF EXISTS rtc_student_privileges_identity_check;
ALTER TABLE rtc_student_privileges
  ADD  CONSTRAINT rtc_student_privileges_identity_check
       CHECK (privilege_id IS NOT NULL OR custom_name IS NOT NULL);

ALTER TABLE rtc_student_privileges
  DROP CONSTRAINT IF EXISTS rtc_student_privileges_duration_check;
ALTER TABLE rtc_student_privileges
  ADD  CONSTRAINT rtc_student_privileges_duration_check
       CHECK (
         (is_permanent = true  AND expires_at IS NULL) OR
         (is_permanent = false AND expires_at IS NOT NULL)
       );

CREATE INDEX IF NOT EXISTS idx_rtc_student_privileges_granted_by
  ON rtc_student_privileges(granted_by) WHERE source = 'granted';

-- 2. rtc_grant_privilege ---------------------------------------------------

CREATE OR REPLACE FUNCTION public.rtc_grant_privilege(
  p_student_id        UUID,
  p_privilege_id      UUID    DEFAULT NULL,
  p_duration_days     INTEGER DEFAULT NULL,
  p_is_permanent      BOOLEAN DEFAULT false,
  p_custom_name       TEXT    DEFAULT NULL,
  p_custom_icon       TEXT    DEFAULT NULL,
  p_custom_description TEXT   DEFAULT NULL,
  p_reason            TEXT    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id    UUID;
  v_caller_type  TEXT;
  v_privilege    RECORD;
  v_expires_at   TIMESTAMPTZ;
  v_grant_id     UUID;
  v_resolved_name TEXT;
  v_name_in      TEXT := nullif(trim(coalesce(p_custom_name, '')), '');
BEGIN
  SELECT id, user_type INTO v_caller_id, v_caller_type
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  IF v_caller_type NOT IN ('teacher', 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Only teachers and admins can grant privileges');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = p_student_id AND user_type = 'student'
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Target student not found');
  END IF;

  IF p_privilege_id IS NULL AND v_name_in IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Must provide a privilege or a custom name');
  END IF;

  IF NOT p_is_permanent AND (p_duration_days IS NULL OR p_duration_days <= 0) THEN
    RETURN json_build_object('success', false, 'error', 'Duration must be positive for non-permanent grants');
  END IF;

  IF p_privilege_id IS NOT NULL THEN
    SELECT id, name, duration_days, is_active INTO v_privilege
    FROM public.rtc_privileges
    WHERE id = p_privilege_id;
    IF v_privilege.id IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Privilege not found');
    END IF;
    v_resolved_name := v_privilege.name;
  ELSE
    v_resolved_name := v_name_in;
  END IF;

  IF p_is_permanent THEN
    v_expires_at := NULL;
  ELSIF p_duration_days IS NOT NULL THEN
    v_expires_at := now() + (p_duration_days || ' days')::INTERVAL;
  ELSIF v_privilege.duration_days IS NOT NULL THEN
    v_expires_at := now() + (v_privilege.duration_days || ' days')::INTERVAL;
  ELSE
    RETURN json_build_object('success', false, 'error', 'Duration could not be determined');
  END IF;

  -- Lazy expiry of stale, non-permanent rows for this student
  UPDATE public.rtc_student_privileges
  SET is_active = false
  WHERE student_id = p_student_id
    AND is_active = true
    AND is_permanent = false
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  INSERT INTO public.rtc_student_privileges (
    student_id, privilege_id, expires_at, price_paid,
    is_active, source, is_permanent, granted_by,
    custom_name, custom_icon, custom_description, grant_reason
  ) VALUES (
    p_student_id,
    p_privilege_id,
    v_expires_at,
    NULL,
    true,
    'granted',
    p_is_permanent,
    v_caller_id,
    CASE WHEN p_privilege_id IS NULL THEN v_name_in ELSE NULL END,
    CASE WHEN p_privilege_id IS NULL THEN nullif(trim(coalesce(p_custom_icon, '')), '') ELSE NULL END,
    CASE WHEN p_privilege_id IS NULL THEN nullif(trim(coalesce(p_custom_description, '')), '') ELSE NULL END,
    nullif(trim(coalesce(p_reason, '')), '')
  ) RETURNING id INTO v_grant_id;

  RETURN json_build_object(
    'success', true,
    'grant_id', v_grant_id,
    'name', v_resolved_name,
    'expires_at', v_expires_at,
    'is_permanent', p_is_permanent
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_grant_privilege(UUID, UUID, INTEGER, BOOLEAN, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 3. rtc_revoke_privilege --------------------------------------------------

CREATE OR REPLACE FUNCTION public.rtc_revoke_privilege(
  p_grant_id UUID,
  p_reason   TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id   UUID;
  v_caller_type TEXT;
  v_grant       RECORD;
BEGIN
  SELECT id, user_type INTO v_caller_id, v_caller_type
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  IF v_caller_type NOT IN ('teacher', 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Only teachers and admins can revoke privileges');
  END IF;

  SELECT * INTO v_grant FROM public.rtc_student_privileges WHERE id = p_grant_id;

  IF v_grant.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Grant not found');
  END IF;

  IF NOT v_grant.is_active THEN
    RETURN json_build_object('success', false, 'error', 'This privilege is already inactive');
  END IF;

  UPDATE public.rtc_student_privileges
  SET is_active     = false,
      revoked_at    = now(),
      revoked_by    = v_caller_id,
      revoke_reason = nullif(trim(coalesce(p_reason, '')), '')
  WHERE id = p_grant_id;

  RETURN json_build_object('success', true, 'grant_id', p_grant_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_revoke_privilege(UUID, TEXT) TO authenticated;

-- 4. rtc_admin_list_student_privileges -------------------------------------
-- For the teacher/admin grant management UI: list a student's active grants
-- with the catalog (or custom) display info, plus who granted it.

CREATE OR REPLACE FUNCTION public.rtc_admin_list_student_privileges(p_student_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_type TEXT;
  v_grants      JSON;
BEGIN
  SELECT user_type INTO v_caller_type
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_caller_type NOT IN ('teacher', 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized');
  END IF;

  UPDATE public.rtc_student_privileges
  SET is_active = false
  WHERE student_id = p_student_id
    AND is_active = true
    AND is_permanent = false
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  SELECT COALESCE(
           json_agg(g ORDER BY g.is_permanent DESC, g.expires_at NULLS LAST),
           '[]'::json
         ) INTO v_grants
  FROM (
    SELECT
      sp.id,
      sp.privilege_id,
      sp.purchased_at,
      sp.expires_at,
      sp.price_paid,
      sp.source,
      sp.is_permanent,
      sp.granted_by,
      sp.grant_reason,
      COALESCE(rp.name,        sp.custom_name)                  AS name,
      COALESCE(rp.icon,        sp.custom_icon,        '🎖️')    AS icon,
      COALESCE(rp.description, sp.custom_description)           AS description,
      COALESCE(gb.first_name || ' ' || gb.last_name, NULL)      AS granted_by_name
    FROM public.rtc_student_privileges sp
    LEFT JOIN public.rtc_privileges rp ON rp.id = sp.privilege_id
    LEFT JOIN public.user_profiles  gb ON gb.id = sp.granted_by
    WHERE sp.student_id = p_student_id
      AND sp.is_active = true
    ORDER BY sp.is_permanent DESC, sp.expires_at NULLS LAST
  ) g;

  RETURN json_build_object('success', true, 'grants', v_grants);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_admin_list_student_privileges(UUID) TO authenticated;

-- 5. Update rtc_get_store_data ---------------------------------------------
-- Skip permanent grants in lazy expiry and expose custom fields + is_permanent.

CREATE OR REPLACE FUNCTION public.rtc_get_store_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id        UUID;
  v_wallet_balance INTEGER;
  v_catalog        JSON;
  v_grants         JSON;
BEGIN
  SELECT id INTO v_user_id
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  SELECT rtc_balance INTO v_wallet_balance
  FROM public.user_profiles WHERE id = v_user_id;

  UPDATE public.rtc_student_privileges
  SET is_active = false
  WHERE student_id = v_user_id
    AND is_active = true
    AND is_permanent = false
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  SELECT COALESCE(json_agg(p ORDER BY p.sort_order, p.name), '[]'::json) INTO v_catalog
  FROM (
    SELECT id, name, description, price, duration_days, icon, sort_order
    FROM public.rtc_privileges
    WHERE is_active = true
    ORDER BY sort_order, name
  ) p;

  SELECT COALESCE(
           json_agg(g ORDER BY g.is_permanent DESC, g.expires_at NULLS LAST),
           '[]'::json
         ) INTO v_grants
  FROM (
    SELECT
      sp.id,
      sp.privilege_id,
      sp.purchased_at,
      sp.expires_at,
      sp.price_paid,
      sp.is_active,
      sp.source,
      sp.is_permanent,
      COALESCE(rp.name,        sp.custom_name)                  AS name,
      COALESCE(rp.icon,        sp.custom_icon,        '🎖️')    AS icon,
      COALESCE(rp.description, sp.custom_description)           AS description
    FROM public.rtc_student_privileges sp
    LEFT JOIN public.rtc_privileges rp ON rp.id = sp.privilege_id
    WHERE sp.student_id = v_user_id
      AND sp.is_active = true
    ORDER BY sp.is_permanent DESC, sp.expires_at NULLS LAST
  ) g;

  RETURN json_build_object(
    'success', true,
    'wallet_balance', v_wallet_balance,
    'catalog', v_catalog,
    'grants', v_grants
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_get_store_data() TO authenticated;

-- 6. Update rtc_purchase_privilege -----------------------------------------
-- Same logic, but lazy expiry skips permanent rows and the inserted grant
-- explicitly carries source='purchased', is_permanent=false.

CREATE OR REPLACE FUNCTION public.rtc_purchase_privilege(p_privilege_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id        UUID;
  v_privilege      RECORD;
  v_wallet_balance INTEGER;
  v_new_balance    INTEGER;
  v_grant_id       UUID;
  v_expires_at     TIMESTAMPTZ;
BEGIN
  SELECT id INTO v_user_id
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  SELECT id, name, price, duration_days, is_active INTO v_privilege
  FROM public.rtc_privileges
  WHERE id = p_privilege_id;

  IF v_privilege.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Privilege not found');
  END IF;

  IF NOT v_privilege.is_active THEN
    RETURN json_build_object('success', false, 'error', 'This privilege is no longer available');
  END IF;

  UPDATE public.rtc_student_privileges
  SET is_active = false
  WHERE student_id = v_user_id
    AND is_active = true
    AND is_permanent = false
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  IF EXISTS (
    SELECT 1 FROM public.rtc_student_privileges
    WHERE student_id = v_user_id
      AND privilege_id = p_privilege_id
      AND is_active = true
  ) THEN
    RETURN json_build_object('success', false, 'error', 'You already have this privilege active');
  END IF;

  SELECT rtc_balance INTO v_wallet_balance
  FROM public.user_profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_wallet_balance < v_privilege.price THEN
    RETURN json_build_object('success', false, 'error',
      'Insufficient RTC balance (need ' || v_privilege.price || ', have ' || v_wallet_balance || ')');
  END IF;

  v_new_balance := v_wallet_balance - v_privilege.price;
  UPDATE public.user_profiles SET rtc_balance = v_new_balance WHERE id = v_user_id;

  INSERT INTO public.rtc_transactions (
    user_id, amount, transaction_type, description, balance_after, created_by
  ) VALUES (
    v_user_id, -v_privilege.price, 'spend_privilege',
    'Purchased privilege: ' || v_privilege.name,
    v_new_balance, v_user_id
  );

  v_expires_at := now() + (v_privilege.duration_days || ' days')::INTERVAL;

  INSERT INTO public.rtc_student_privileges (
    student_id, privilege_id, price_paid, expires_at, source, is_permanent
  ) VALUES (
    v_user_id, p_privilege_id, v_privilege.price, v_expires_at, 'purchased', false
  ) RETURNING id INTO v_grant_id;

  RETURN json_build_object(
    'success', true,
    'grant_id', v_grant_id,
    'new_balance', v_new_balance,
    'expires_at', v_expires_at
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rtc_purchase_privilege(UUID) TO authenticated;
