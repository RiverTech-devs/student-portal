-- ============================================================
-- Admin-only teacher provisioning RPC
--
-- Why this exists
-- ---------------
-- The portal's "Invite Teacher" flow (added 2025-12-01) called
-- supabase.auth.signUp() and then INSERTed the user_profiles row
-- directly from the admin's browser. Two later hardening migrations
-- closed that path, and the flow has been dead ever since:
--
--   zz_validate_user_profile_insert.sql  (2026-04-14)
--     BEFORE INSERT trigger: when current_user is 'authenticated' or
--     'anon', only 'student' / 'parent' rows may be created. A
--     PostgREST insert from the browser is exactly that caller, so
--     user_type = 'teacher' raises.
--
--   zz_fix_user_profiles_drop_recursive_legacy_policies.sql (2026-05-01)
--     dropped "Admins can create user profiles" (INSERT, WITH CHECK
--     is_admin()). The only INSERT policy left is "Users can create
--     own profile during signup" (id = auth.uid()) — and signUp()
--     with email confirmation enabled does NOT swap the caller's
--     session, so auth.uid() is still the admin, not the new teacher.
--
--   Net effect: the auth.users row was created and the confirmation
--   email went out, then the profile insert failed. Every attempt
--   left an orphaned auth user with no profile behind it.
--
-- What this migration deliberately does NOT do
-- --------------------------------------------
--   * No new INSERT policy on user_profiles. The table keeps exactly
--     one INSERT policy (id = auth.uid()) and the validate trigger
--     keeps rejecting every client-side staff insert. This function
--     is the only way in; being SECURITY DEFINER, the trigger's
--     owner check waves it through.
--   * No user_type parameter. The role is hardcoded to 'teacher' —
--     a caller cannot ask for 'admin'.
--   * No rtc_balance / account_status / can_login / grade_level
--     parameters. Privilege columns are set here, not passed in.
--   * EXECUTE is revoked from PUBLIC and anon. Only 'authenticated'
--     may call it, and only an admin gets past the gate inside.
--   * It can only fill in a MISSING profile. An auth user that
--     already has a profile is refused outright, so the function can
--     never re-key, rewrite, or promote an existing account.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_create_teacher_profile(
  p_email      TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name  TEXT DEFAULT NULL,
  p_username   TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET row_security = off
AS $$
DECLARE
  v_uid         UUID := auth.uid();
  v_caller_type TEXT;
  v_email       TEXT := lower(trim(coalesce(p_email, '')));
  v_first       TEXT := nullif(trim(coalesce(p_first_name, '')), '');
  v_last        TEXT := nullif(trim(coalesce(p_last_name, '')), '');
  v_auth_id     UUID;
  v_username    TEXT;
  v_base        TEXT;
BEGIN
  -- 1. Caller must be a signed-in admin.
  --    The role lookup is inlined (id OR auth_user_id, split-id aware)
  --    instead of calling get_my_user_type(), so this gate does not
  --    depend on which revision of that helper is live — see the two
  --    competing zz_fix_user_profiles_helper_*.sql migrations.
  IF v_uid IS NULL THEN
    RETURN json_build_object('error', 'Not signed in');
  END IF;

  SELECT user_type INTO v_caller_type
  FROM public.user_profiles
  WHERE id = v_uid OR auth_user_id = v_uid
  ORDER BY (auth_user_id = v_uid) DESC NULLS LAST
  LIMIT 1;

  IF v_caller_type IS DISTINCT FROM 'admin' THEN
    RETURN json_build_object('error', 'Only admins can create teacher accounts');
  END IF;

  -- 2. Validate input.
  IF v_email = '' OR position('@' IN v_email) = 0 THEN
    RETURN json_build_object('error', 'A valid email address is required');
  END IF;

  v_first := coalesce(v_first, 'New');
  v_last  := coalesce(v_last,  'Teacher');

  -- 3. Resolve the auth user the client's signUp() call just created.
  --    (Also resolves the orphans left behind by the broken flow, so a
  --    re-invite of a half-created teacher now completes instead of
  --    dead-ending on "User already registered".)
  SELECT id INTO v_auth_id
  FROM auth.users
  WHERE lower(email) = v_email
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_auth_id IS NULL THEN
    RETURN json_build_object(
      'error', 'No auth account exists for ' || v_email || ' — the sign-up step did not complete'
    );
  END IF;

  -- 4. Never touch an account that already has a profile. This is what
  --    keeps the function from being a promotion vector: it can only
  --    ever create a missing profile, never modify an existing one.
  IF EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = v_auth_id OR auth_user_id = v_auth_id
  ) THEN
    RETURN json_build_object('error', 'That account already has a profile');
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE lower(email) = v_email) THEN
    RETURN json_build_object('error', 'A user with this email already exists');
  END IF;

  -- 5. Username: take the caller's suggestion, otherwise derive one.
  --    Collisions are disambiguated from the auth uid rather than
  --    failing the whole invite.
  v_base := regexp_replace(lower(v_first || '.' || v_last), '[^a-z.]', '', 'g');
  IF v_base IN ('', '.') THEN
    v_base := 'teacher';
  END IF;

  v_username := nullif(trim(coalesce(p_username, '')), '');
  IF v_username IS NULL
     OR EXISTS (SELECT 1 FROM public.user_profiles WHERE username = v_username) THEN
    v_username := v_base || '.' || substr(replace(v_auth_id::text, '-', ''), 1, 8);
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE username = v_username) THEN
    RETURN json_build_object('error', 'Could not allocate a unique username');
  END IF;

  -- 6. Create the profile. Role and privilege columns are fixed here.
  INSERT INTO public.user_profiles (
    id,
    auth_user_id,
    email,
    username,
    first_name,
    last_name,
    user_type,
    account_status,
    can_login,
    rtc_balance
  ) VALUES (
    v_auth_id,
    v_auth_id,
    v_email,
    v_username,
    v_first,
    v_last,
    'teacher',
    'active',
    true,
    0
  );

  RETURN json_build_object(
    'success',  true,
    'user_id',  v_auth_id,
    'username', v_username
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('error', 'A profile with this email or username already exists');
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Postgres grants EXECUTE to PUBLIC on every new function by default,
-- which would hand anon a callable entry point. Revoke first, then
-- grant only what's needed.
REVOKE ALL ON FUNCTION public.admin_create_teacher_profile(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_teacher_profile(TEXT, TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_create_teacher_profile(TEXT, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.admin_create_teacher_profile(TEXT, TEXT, TEXT, TEXT) IS
'Admin-only. Creates the user_profiles row for a teacher whose auth.users record already exists (created by the portal''s signUp call). user_type is hardcoded to teacher — the caller cannot choose a role. Refuses if the auth user already has a profile, so it can never promote or rewrite an existing account.';

-- ============================================================
-- Verify after applying:
--
--   -- one INSERT policy on user_profiles, unchanged:
--   SELECT policyname, cmd, roles, with_check
--     FROM pg_policies
--    WHERE schemaname = 'public' AND tablename = 'user_profiles' AND cmd = 'INSERT';
--   -- expect only: "Users can create own profile during signup" (id = auth.uid())
--
--   -- anon cannot call the RPC:
--   SELECT has_function_privilege('anon',
--     'public.admin_create_teacher_profile(text,text,text,text)', 'EXECUTE');
--   -- expect: false
--
--   SELECT has_function_privilege('authenticated',
--     'public.admin_create_teacher_profile(text,text,text,text)', 'EXECUTE');
--   -- expect: true
-- ============================================================
