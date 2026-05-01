-- ============================================================
-- Drop legacy user_profiles policies that overlap with the
-- helper-based set installed by zz_fix_user_profiles_rls_recursion.sql.
--
-- Live pg_policies showed two competing rule sets on user_profiles:
--   (a) helper-based, using public.get_my_user_type() — SECURITY DEFINER
--       and safe.
--   (b) legacy, using public.get_user_role() / public.is_admin() /
--       public.is_teacher() — definitions absent from this repo.
--
-- Postgres OR-combines permissive policies, so EVERY user_profiles
-- SELECT and UPDATE evaluates BOTH sets. If any helper in (b) queries
-- user_profiles without bypassing RLS, the policy retriggers itself
-- and the statement either errors with 42P17 or has its connection
-- killed (the "ERR_CONNECTION_RESET" the admin saw on the student-
-- management screen, plus the 500 on the enrollment-type save).
--
-- The helper-based set in (a) covers admin, teacher, parent and
-- self-read/-write fully, so we just drop (b) and the overly-broad
-- public-role variants. No new policies are created.
-- ============================================================

-- 1. Recursion suspects: drop policies that call the unverified legacy helpers.
DROP POLICY IF EXISTS "User profile access"                         ON public.user_profiles;  -- SELECT, calls get_user_role()
DROP POLICY IF EXISTS "Admins can update users"                     ON public.user_profiles;  -- UPDATE, calls is_admin()
DROP POLICY IF EXISTS "Admins can create user profiles"             ON public.user_profiles;  -- INSERT, calls is_admin()
DROP POLICY IF EXISTS "Teachers can create inactive student profiles" ON public.user_profiles; -- INSERT, calls is_teacher()

-- 2. Duplicates of the helper-based set (cleaner, narrower variants already exist).
DROP POLICY IF EXISTS "Parents can view linked children profiles"   ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create own profile"                ON public.user_profiles;  -- duplicate of "Users can create own profile during signup"

-- 3. Overly-permissive public-role SELECTs: any authenticated user could
--    enumerate every student / teacher / admin row. The helper-based
--    SELECT policies already grant the appropriate scoped access.
DROP POLICY IF EXISTS "Allow lookup of student profiles for linking" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can view teacher and admin profiles"   ON public.user_profiles;

-- ============================================================
-- After this migration, public.user_profiles should have ONLY
-- these policies (verify with `SELECT policyname, cmd FROM
-- pg_policies WHERE schemaname='public' AND tablename='user_profiles'`):
--
--   ALL    Service role full access
--   SELECT Users can view own profile               (auth_user_id = auth.uid())
--   SELECT Admins can view all profiles             (get_my_user_type() = 'admin')
--   SELECT Teachers can view profiles               (get_my_user_type() = 'teacher')
--   SELECT Parents can view children profiles       (helper + parent_child_links)
--   INSERT Users can create own profile during signup (id = auth.uid())
--   UPDATE Users can update own profile             (auth_user_id = auth.uid())
--   UPDATE Admins can update any profile            (get_my_user_type() = 'admin')
--   UPDATE Teachers can update student profiles     (helper + class_enrollments)
--   DELETE Admins can delete profiles               (get_my_user_type() = 'admin')
-- ============================================================
