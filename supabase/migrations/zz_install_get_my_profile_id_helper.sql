-- Install public.get_my_profile_id() helper.
--
-- Several RLS policies (math_dojo_sessions INSERT, skill_progress writes, etc.)
-- call this function to support split-id users (user_profiles.id != auth.uid()).
-- It was added by zz_fix_split_id_rls_skill_notifications.sql and
-- zz_fix_assignments_rls_timeout.sql, but in production the function is missing,
-- which makes every dojo-session INSERT throw 42883 "function does not exist"
-- and silently fail. This migration re-creates the helper idempotently so those
-- policies evaluate correctly again. No policy changes here.

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT id FROM public.user_profiles
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile_id() TO anon;
