-- ============================================================
-- SECURITY FIX: Enable RLS on the notification-dedupe tracking
-- tables that shipped without any row-level protection.
--
-- Vulnerability:
--   due_date_reminder_notifications and missed_assignment_notifications
--   were created without `ENABLE ROW LEVEL SECURITY`. Supabase applies
--   default grants that give the `authenticated` role full SELECT/
--   INSERT/UPDATE/DELETE on new public-schema tables, so any logged-in
--   user could open a browser console and run:
--
--     supabase.from('due_date_reminder_notifications').select('*')
--
--   ...and enumerate which students have missing assignments, which
--   parents are linked to which students, and the timing of every
--   reminder the system has sent. That's a cross-student privacy leak
--   with FERPA implications for a school product.
--
-- These tables are pure dedupe-tracking used by two edge functions
-- (supabase/functions/due-date-reminders and supabase/functions/
-- missed-emails). Both edge functions use the service_role key, which
-- bypasses RLS — so enabling RLS with zero user-facing policies is
-- exactly what we want: locked down for all regular users, still
-- writable by the cron jobs.
-- ============================================================

ALTER TABLE IF EXISTS public.due_date_reminder_notifications
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.missed_assignment_notifications
  ENABLE ROW LEVEL SECURITY;

-- Defense in depth: drop the default authenticated/anon grants as well,
-- so even if someone adds a permissive policy later, the role can't
-- trivially read the table. service_role keeps full access.
REVOKE ALL ON public.due_date_reminder_notifications FROM authenticated, anon;
REVOKE ALL ON public.missed_assignment_notifications FROM authenticated, anon;

-- ============================================================
-- Done. Both tables are now readable/writable only by the
-- service_role (edge functions) and the table owner.
-- ============================================================
