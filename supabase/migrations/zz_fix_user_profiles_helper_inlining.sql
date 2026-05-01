-- ============================================================
-- Stop Postgres from inlining the SECURITY DEFINER user_profiles
-- helpers, which was preserving the recursion 42P17 even after the
-- legacy policies were dropped.
--
-- LANGUAGE sql + STABLE allows Postgres to substitute the function
-- body directly into the calling query at planning time. When that
-- happens, SECURITY DEFINER is dropped on the floor and the inlined
-- subquery runs as the caller — which hits the RLS policy that
-- called the helper in the first place. Hence: infinite recursion
-- detected in policy for relation user_profiles.
--
-- LANGUAGE plpgsql functions are never inlined, so SECURITY DEFINER
-- (postgres, BYPASSRLS) is preserved at every call site. Function
-- semantics, signature, search_path, and grants are unchanged.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_user_type()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_type TEXT;
BEGIN
  SELECT user_type INTO v_type
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  RETURN v_type;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id
  FROM public.user_profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
  RETURN v_id;
END;
$$;

-- Re-grant to be safe (CREATE OR REPLACE preserves grants but be explicit).
GRANT EXECUTE ON FUNCTION public.get_my_user_type() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO authenticated, anon;
