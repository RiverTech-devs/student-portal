-- ============================================================
-- SECURITY FIX: Enable RLS on user_profiles and lock down
-- sensitive columns (rtc_balance, user_type, account_status)
--
-- Vulnerability: Students could modify their own rtc_balance
-- directly via the Supabase client in the browser console:
--   supabase.from('user_profiles').update({ rtc_balance: 999999 }).eq('id', uid)
--
-- Fix: Enable RLS + add policies + add a trigger that prevents
-- students from changing protected columns on direct UPDATE.
-- All legitimate balance changes go through SECURITY DEFINER
-- RPCs (process_rtc_transaction, admin_set_rtc_balance, etc.)
-- which bypass RLS.
-- ============================================================

-- 1. Enable RLS (idempotent — safe if already enabled)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. SELECT policies
-- ============================================================

-- Students can read their own profile
DROP POLICY IF EXISTS "Students can view own profile" ON public.user_profiles;
CREATE POLICY "Students can view own profile" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Teachers can view their own profile + their students' profiles
DROP POLICY IF EXISTS "Teachers can view relevant profiles" ON public.user_profiles;
CREATE POLICY "Teachers can view relevant profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR (
      EXISTS (
        SELECT 1 FROM public.user_profiles me
        WHERE me.id = auth.uid() AND me.user_type = 'teacher'
      )
      AND (
        -- Students in their classes
        EXISTS (
          SELECT 1 FROM public.class_enrollments ce
          JOIN public.classes c ON ce.class_id = c.id
          WHERE ce.student_id = user_profiles.id
            AND ce.status = 'active'
            AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
        )
        -- Or other teachers (for directory / collaboration)
        OR user_type IN ('teacher', 'admin')
      )
    )
  );

-- Parents can view their own profile + their children's profiles
DROP POLICY IF EXISTS "Parents can view own and children profiles" ON public.user_profiles;
CREATE POLICY "Parents can view own and children profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR (
      EXISTS (
        SELECT 1 FROM public.user_profiles me
        WHERE me.id = auth.uid() AND me.user_type = 'parent'
      )
      AND EXISTS (
        SELECT 1 FROM public.parent_child_links pcl
        WHERE pcl.parent_id = auth.uid() AND pcl.child_id = user_profiles.id
      )
    )
  );

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles me
      WHERE me.id = auth.uid() AND me.user_type = 'admin'
    )
  );

-- ============================================================
-- 3. INSERT policy (keep existing signup policy)
-- ============================================================
-- Already exists: "Users can create own profile during signup"
-- (fix_security_warnings.sql, line 112)

-- ============================================================
-- 4. UPDATE policies
-- ============================================================

-- Students can update their own row (but trigger blocks protected columns)
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admins can update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
CREATE POLICY "Admins can update any profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles me
      WHERE me.id = auth.uid() AND me.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles me
      WHERE me.id = auth.uid() AND me.user_type = 'admin'
    )
  );

-- Teachers can update their students' profiles (for status changes, etc.)
DROP POLICY IF EXISTS "Teachers can update student profiles" ON public.user_profiles;
CREATE POLICY "Teachers can update student profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles me
      WHERE me.id = auth.uid() AND me.user_type = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM public.class_enrollments ce
      JOIN public.classes c ON ce.class_id = c.id
      WHERE ce.student_id = user_profiles.id
        AND ce.status = 'active'
        AND (c.teacher_id = auth.uid() OR c.secondary_teacher_id = auth.uid())
    )
  );

-- ============================================================
-- 5. DELETE policy (admin only)
-- ============================================================
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles me
      WHERE me.id = auth.uid() AND me.user_type = 'admin'
    )
  );

-- ============================================================
-- 6. TRIGGER: Block students from changing protected columns
--    This fires on direct UPDATE via Supabase client. It does
--    NOT affect SECURITY DEFINER functions (process_rtc_transaction,
--    admin_set_rtc_balance, etc.) because those run as the
--    function owner, not the calling user.
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_user_profile_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_type TEXT;
BEGIN
  -- Look up the caller's user_type
  SELECT user_type INTO v_caller_type
  FROM public.user_profiles
  WHERE id = auth.uid();

  -- Admins and teachers can change anything (via direct UPDATE)
  IF v_caller_type IN ('admin', 'teacher') THEN
    RETURN NEW;
  END IF;

  -- For students (and parents): revert protected columns to their old values.
  -- Legitimate changes to these go through SECURITY DEFINER RPCs.
  NEW.rtc_balance       := OLD.rtc_balance;
  NEW.user_type         := OLD.user_type;
  NEW.account_status    := OLD.account_status;
  NEW.can_login         := OLD.can_login;
  NEW.enrollment_type   := OLD.enrollment_type;

  -- Students can still change: site_theme, button_color_scheme,
  -- equipped_avatar, equipped_title, equipped_badge1/2/3,
  -- site_theme_custom, and other non-sensitive preferences.

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_profile_columns ON public.user_profiles;
CREATE TRIGGER trigger_protect_profile_columns
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_profile_columns();

-- ============================================================
-- 7. Anon SELECT: allow reading minimal profile info for signup
--    validation (username/email uniqueness checks)
-- ============================================================
DROP POLICY IF EXISTS "Anon can check username availability" ON public.user_profiles;
CREATE POLICY "Anon can check username availability" ON public.user_profiles
  FOR SELECT TO anon
  USING (false);
-- Anon checks go through create_signup_profile() SECURITY DEFINER function.
-- No direct anon SELECT needed.

-- ============================================================
-- Done. user_profiles is now protected.
-- ============================================================
