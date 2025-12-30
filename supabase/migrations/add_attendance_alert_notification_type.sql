-- Add 'attendance_alert' to notification type check constraint
-- This is for late/left_early notifications to teachers and admins

-- First drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint with attendance_alert type
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'new_message',
  'assignment_posted',
  'assignment_graded',
  'assignment_due_soon',
  'submission_received',
  'note_added',
  'child_grade',
  'child_assignment',
  'class_announcement',
  'system',
  'strike',
  'attendance_alert'
));
