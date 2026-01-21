-- Migration: Fix Supabase Security Warnings
-- Fixes: Function search_path mutable, RLS policies always true

-- ============================================
-- PART 1: Fix function search_path issues
-- ============================================

DO $$
BEGIN
  -- Try each function, skip if it doesn't exist
  BEGIN ALTER FUNCTION public.deactivate_test_assignments_on_delete() SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.update_tests_updated_at() SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.cleanup_old_due_reminders() SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.hard_delete_class(UUID) SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.update_student_medical_info_updated_at() SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.update_student_waivers_updated_at() SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.calculate_test_submission_score(UUID) SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.calculate_decayed_mastery(DOUBLE PRECISION, TIMESTAMP WITH TIME ZONE) SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.update_skill_after_practice() SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.hard_delete_enrollment(UUID) SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.update_emergency_contacts_updated_at() SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.calculate_suggested_grade(UUID, UUID) SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.is_admin() SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.is_teacher() SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.get_user_role() SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.is_teacher_or_admin() SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.owns_test(UUID) SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.calculate_quarter_grades(UUID) SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.is_assigned_to_test(UUID) SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.mark_student_as_past(UUID) SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.reactivate_student(UUID) SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
  BEGIN ALTER FUNCTION public.notify_on_new_message() SET search_path = ''; EXCEPTION WHEN undefined_function THEN NULL; END;
END $$;

-- For functions with unknown/variable signatures, find and fix them dynamically
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN
    SELECT n.nspname as schema, p.proname as name, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN ('update_enrollment_grades', 'upsert_quarter_grade', 'set_class_grade_override')
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = %L',
      func_record.schema, func_record.name, func_record.args, '');
  END LOOP;
END $$;

-- ============================================
-- PART 2: Fix overly permissive RLS policies
-- ============================================

-- Fix discussion_posts update policy
DROP POLICY IF EXISTS "posts_update" ON public.discussion_posts;
CREATE POLICY "posts_update" ON public.discussion_posts
FOR UPDATE TO authenticated
USING (
  (author_id = auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.discussion_threads t ON t.class_id = c.id
    WHERE t.id = discussion_posts.thread_id AND c.teacher_id = auth.uid()
  ))
)
WITH CHECK (
  (author_id = auth.uid()) OR
  (EXISTS (
    SELECT 1 FROM public.classes c
    JOIN public.discussion_threads t ON t.class_id = c.id
    WHERE t.id = discussion_posts.thread_id AND c.teacher_id = auth.uid()
  ))
);

-- Fix discussion_threads update policy
DROP POLICY IF EXISTS "threads_update" ON public.discussion_threads;
CREATE POLICY "threads_update" ON public.discussion_threads
FOR UPDATE TO authenticated
USING (
  public.is_member_of_class(class_id) AND
  ((created_by = auth.uid()) OR
   (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = discussion_threads.class_id AND c.teacher_id = auth.uid())))
)
WITH CHECK (
  public.is_member_of_class(class_id) AND
  ((created_by = auth.uid()) OR
   (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = discussion_threads.class_id AND c.teacher_id = auth.uid())))
);

-- Fix drive_uploads insert policy
-- NOTE: Skipping this fix - the table schema doesn't have an uploaded_by column.
-- The permissive INSERT policy may be intentional for this table.
-- To fix manually, identify the correct user column and create a policy like:
-- CREATE POLICY "..." ON public.drive_uploads FOR INSERT TO authenticated
-- WITH CHECK (your_user_column = auth.uid());

-- Fix due_date_reminder_notifications insert policy - only teachers/admins can create
DROP POLICY IF EXISTS "System can insert notifications" ON public.due_date_reminder_notifications;
CREATE POLICY "Teachers and admins can insert notifications" ON public.due_date_reminder_notifications
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND user_type IN ('teacher', 'admin')
  )
);

-- Fix user_profiles insert policy for signup - only allow inserting own profile
DROP POLICY IF EXISTS "Anon can create profiles during signup" ON public.user_profiles;
CREATE POLICY "Users can create own profile during signup" ON public.user_profiles
FOR INSERT TO anon, authenticated
WITH CHECK (id = auth.uid());

-- ============================================
-- NOTES: Manual steps required in Supabase Dashboard
-- ============================================
-- 1. Enable Leaked Password Protection:
--    Authentication -> Settings -> Security -> Enable "Leaked Password Protection"
--
-- 2. Upgrade Postgres Version:
--    Settings -> Infrastructure -> Upgrade database
-- ============================================
