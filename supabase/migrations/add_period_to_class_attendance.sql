-- Add period column to class_attendance for tracking attendance by time slot
-- This allows classes that meet multiple times per day to have separate attendance records

-- Add the period column (nullable to support existing records)
ALTER TABLE class_attendance
ADD COLUMN IF NOT EXISTS period INTEGER CHECK (period IS NULL OR (period >= 1 AND period <= 10));

-- Drop the old unique constraint
ALTER TABLE class_attendance
DROP CONSTRAINT IF EXISTS class_attendance_class_id_student_id_date_key;

-- Create new unique constraint that includes period
-- Using COALESCE to handle NULL periods (treats NULL as 0 for uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS class_attendance_class_student_date_period_idx
ON class_attendance (class_id, student_id, date, COALESCE(period, 0));

-- Add index for period lookups
CREATE INDEX IF NOT EXISTS idx_class_attendance_period ON class_attendance(period);

-- Comment on the column
COMMENT ON COLUMN class_attendance.period IS 'The period/time slot for this attendance record. Matches class_schedule.period. NULL for legacy records or single-period classes.';
