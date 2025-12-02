-- Assignments Table Performance Indexes
-- Run this in Supabase SQL Editor to fix query timeouts

-- Index for filtering by class_id (used in all assignment queries)
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);

-- Index for filtering by due_date (used for missing/upcoming assignments)
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);

-- Index for is_published filter (commonly used)
CREATE INDEX IF NOT EXISTS idx_assignments_is_published ON assignments(is_published);

-- Composite index for the common query pattern: class_id + is_published + due_date
CREATE INDEX IF NOT EXISTS idx_assignments_class_published_due
ON assignments(class_id, is_published, due_date);

-- Also add index for assignment_submissions if not exists
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id
ON assignment_submissions(assignment_id);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id
ON assignment_submissions(student_id);

-- Composite index for the common lookup pattern
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_assignment
ON assignment_submissions(student_id, assignment_id);

-- User profiles indexes (for student lookups)
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);

-- Rubrics indexes
CREATE INDEX IF NOT EXISTS idx_rubrics_created_by ON rubrics(created_by);
CREATE INDEX IF NOT EXISTS idx_rubrics_is_default ON rubrics(is_default);

-- Class enrollments indexes (for student lists)
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_status ON class_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_status
ON class_enrollments(class_id, status);
-- For student login query pattern (student_id + status)
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_status
ON class_enrollments(student_id, status);

-- Classes table indexes
CREATE INDEX IF NOT EXISTS idx_classes_id ON classes(id);
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON classes(is_active);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);

-- Analyze tables to update query planner statistics
ANALYZE assignments;
ANALYZE assignment_submissions;
ANALYZE user_profiles;
ANALYZE rubrics;
ANALYZE class_enrollments;
ANALYZE classes;
