-- Fix duplicate records in assignment_students table
-- This migration:
-- 1. Removes duplicate assignment_students records (keeps one of each)
-- 2. Adds a unique constraint to prevent future duplicates

-- Step 1: Remove duplicates (keeps the record with the lowest ctid)
DELETE FROM assignment_students a
USING assignment_students b
WHERE a.ctid > b.ctid
  AND a.assignment_id = b.assignment_id
  AND a.student_id = b.student_id;

-- Step 2: Add unique constraint to prevent future duplicates
-- (This will fail if there are still duplicates, which shouldn't happen after step 1)
ALTER TABLE assignment_students
DROP CONSTRAINT IF EXISTS assignment_students_unique_assignment_student;

ALTER TABLE assignment_students
ADD CONSTRAINT assignment_students_unique_assignment_student
UNIQUE (assignment_id, student_id);

-- Also add unique constraint for assignment_submissions to prevent duplicate submissions
-- First remove any duplicates there too
DELETE FROM assignment_submissions a
USING assignment_submissions b
WHERE a.ctid > b.ctid
  AND a.assignment_id = b.assignment_id
  AND a.student_id = b.student_id;

ALTER TABLE assignment_submissions
DROP CONSTRAINT IF EXISTS assignment_submissions_unique_assignment_student;

ALTER TABLE assignment_submissions
ADD CONSTRAINT assignment_submissions_unique_assignment_student
UNIQUE (assignment_id, student_id);
