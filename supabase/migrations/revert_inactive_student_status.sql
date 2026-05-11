-- ============================================================
-- Revert: the 'inactive' value on user_profiles.student_status was
-- a duplicate concept. account_status = 'inactive' already exists
-- across the codebase to mean "pre-created profile that hasn't been
-- claimed yet" (the bulk-create / Activate-Account flow). Adding
-- 'inactive' as a third student_status overloaded the word and
-- collided with the established semantics.
--
-- This rolls back the CHECK widening and removes mark_student_as_inactive.
-- mark_student_as_past stays as it is (returns JSON, archives
-- enrollments, does not auto-generate a PIN). reactivate_student
-- also stays.
-- ============================================================

-- 1. Demote any rows that snuck into the new state. (Safe even if zero rows.)
UPDATE public.user_profiles
SET student_status = 'active'
WHERE student_status = 'inactive';

-- 2. Tighten the CHECK constraint back to the original two values.
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_student_status_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_student_status_check
  CHECK (student_status IN ('active', 'past'));

-- 3. Drop the RPC that wrote the now-invalid state.
DROP FUNCTION IF EXISTS public.mark_student_as_inactive(UUID, TEXT);
