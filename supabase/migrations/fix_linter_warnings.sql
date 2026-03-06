-- Fix Supabase Linter Warnings
-- 1. Set search_path on all functions with mutable search_path
-- 2. Restrict enrollment_applications INSERT policy to anon role only

-- ============================================
-- FIX: Function search_path mutable (14 functions)
-- ============================================

ALTER FUNCTION public.cleanup_old_missed_notifications()
  SET search_path = '';

ALTER FUNCTION public.cleanup_old_attendance_alerts()
  SET search_path = '';

ALTER FUNCTION public.update_material_requests_updated_at()
  SET search_path = '';

ALTER FUNCTION public.generate_application_number(TEXT)
  SET search_path = '';

ALTER FUNCTION public.update_enrollment_updated_at()
  SET search_path = '';

ALTER FUNCTION public.is_teacher_of_class(UUID)
  SET search_path = '';

ALTER FUNCTION public.hard_delete_user_account(UUID)
  SET search_path = '';

ALTER FUNCTION public.process_irl_purchase(UUID, UUID, TEXT, INTEGER, INTEGER, TEXT)
  SET search_path = '';

ALTER FUNCTION public.update_activities_updated_at()
  SET search_path = '';

ALTER FUNCTION public.update_activity_enrollments_updated_at()
  SET search_path = '';

ALTER FUNCTION public.update_facilities_updated_at()
  SET search_path = '';

ALTER FUNCTION public.update_facility_bookings_updated_at()
  SET search_path = '';

ALTER FUNCTION public.check_booking_conflict(UUID, DATE, TIME, TIME, UUID)
  SET search_path = '';

ALTER FUNCTION public.cleanup_old_email_logs()
  SET search_path = '';

-- ============================================
-- FIX: RLS policy always true on enrollment_applications
-- Restrict INSERT to anon role only (public enrollment form)
-- ============================================

DROP POLICY IF EXISTS "Anon can insert enrollment applications" ON enrollment_applications;

CREATE POLICY "Anon can insert enrollment applications"
  ON enrollment_applications FOR INSERT
  TO anon
  WITH CHECK (true);
