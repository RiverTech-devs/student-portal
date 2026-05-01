-- ============================================================
-- Fix admin/teacher detection in the user_profiles RLS helpers:
--   1. Helpers were only matching auth_user_id = auth.uid(), but
--      many production profiles are keyed by id = auth.uid() (split-
--      id schema). Result: get_my_user_type() returned NULL for the
--      admin, so every helper-based policy denied them and the
--      eventual UPDATE either failed silently or surfaced as 42P17
--      via the planner's policy-recursion detector.
--   2. SECURITY DEFINER + BYPASSRLS owner is *not* enough when the
--      table has FORCE ROW LEVEL SECURITY enabled — Postgres still
--      applies RLS to the function's inner SELECT and may flag the
--      reference as recursion. SET row_security = off at the
--      function level suppresses RLS unconditionally for that
--      function call.
--
-- Helpers now match either id OR auth_user_id (matches the same
-- pattern used by get_my_profile_id callers in math_dojo_sessions,
-- skill_progress, etc.) and explicitly disable row_security.
-- protect_user_profile_columns gets the same row_security=off
-- treatment so the trigger never falls into RLS during column
-- protection checks.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_user_type()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
SET row_security = off
AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_type TEXT;
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;
  SELECT user_type INTO v_type
  FROM public.user_profiles
  WHERE id = v_uid OR auth_user_id = v_uid
  ORDER BY (auth_user_id = v_uid) DESC NULLS LAST   -- prefer auth_user_id match when both present
  LIMIT 1;
  RETURN v_type;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
SET row_security = off
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_id  UUID;
BEGIN
  IF v_uid IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO v_id
  FROM public.user_profiles
  WHERE id = v_uid OR auth_user_id = v_uid
  ORDER BY (auth_user_id = v_uid) DESC NULLS LAST
  LIMIT 1;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_user_type() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.protect_user_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET row_security = off
AS $$
DECLARE
  v_caller_type TEXT;
BEGIN
  v_caller_type := public.get_my_user_type();

  IF v_caller_type IN ('admin', 'teacher') THEN
    RETURN NEW;
  END IF;

  NEW.rtc_balance       := OLD.rtc_balance;
  NEW.user_type         := OLD.user_type;
  NEW.account_status    := OLD.account_status;
  NEW.can_login         := OLD.can_login;
  NEW.enrollment_type   := OLD.enrollment_type;

  RETURN NEW;
END;
$$;
