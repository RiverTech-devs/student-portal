-- ============================================================================
-- DIAGNOSTIC QUERIES - Run these to check for orphaned test data
-- ============================================================================

-- 1. Find all test_submissions and their assignment status
-- This shows if submissions exist for assignments that were deleted or deactivated
SELECT
    ts.id as submission_id,
    ts.test_id,
    t.title as test_title,
    ts.student_id,
    up.first_name || ' ' || up.last_name as student_name,
    ts.status as submission_status,
    ts.auto_score,
    ts.final_score,
    ts.submitted_at,
    ta.id as test_assignment_id,
    ta.class_id,
    ta.is_active as assignment_active,
    c.name as class_name
FROM test_submissions ts
JOIN tests t ON t.id = ts.test_id
LEFT JOIN user_profiles up ON up.id = ts.student_id
LEFT JOIN test_assignments ta ON ta.test_id = ts.test_id
    AND (ta.student_id = ts.student_id OR ta.student_id IS NULL)
LEFT JOIN classes c ON c.id = ta.class_id
ORDER BY ts.test_id, ts.submitted_at;

-- 2. Find submissions that have NO matching test_assignment at all (truly orphaned)
SELECT
    ts.id as submission_id,
    ts.test_id,
    t.title as test_title,
    ts.student_id,
    up.first_name || ' ' || up.last_name as student_name,
    ts.status,
    ts.auto_score,
    ts.final_score,
    ts.answers,
    ts.submitted_at
FROM test_submissions ts
JOIN tests t ON t.id = ts.test_id
LEFT JOIN user_profiles up ON up.id = ts.student_id
WHERE NOT EXISTS (
    SELECT 1 FROM test_assignments ta
    WHERE ta.test_id = ts.test_id
    AND ta.is_active = true
    AND (
        ta.student_id = ts.student_id
        OR (ta.student_id IS NULL AND EXISTS (
            SELECT 1 FROM class_enrollments ce
            WHERE ce.class_id = ta.class_id
            AND ce.student_id = ts.student_id
        ))
    )
)
ORDER BY ts.test_id, ts.submitted_at;

-- 3. Show all test_assignments (active and inactive) to see history
SELECT
    ta.id,
    ta.test_id,
    t.title as test_title,
    ta.class_id,
    c.name as class_name,
    ta.student_id,
    ta.is_active,
    ta.due_date,
    ta.created_at,
    ta.linked_assignment_id
FROM test_assignments ta
JOIN tests t ON t.id = ta.test_id
LEFT JOIN classes c ON c.id = ta.class_id
ORDER BY ta.test_id, ta.created_at;

-- 4. Count submissions per test per class (to see distribution)
SELECT
    t.id as test_id,
    t.title as test_title,
    c.name as class_name,
    ta.is_active,
    COUNT(ts.id) as submission_count
FROM tests t
LEFT JOIN test_assignments ta ON ta.test_id = t.id
LEFT JOIN classes c ON c.id = ta.class_id
LEFT JOIN test_submissions ts ON ts.test_id = t.id
GROUP BY t.id, t.title, c.name, ta.is_active
ORDER BY t.title, c.name;

-- 5. Find the specific test that was assigned to multiple classes
-- Shows all assignments and their submission counts
SELECT
    t.title as test_title,
    c.name as class_name,
    ta.is_active,
    ta.created_at as assigned_at,
    (SELECT COUNT(*) FROM test_submissions ts
     JOIN class_enrollments ce ON ce.student_id = ts.student_id AND ce.class_id = ta.class_id
     WHERE ts.test_id = t.id) as submissions_from_this_class
FROM tests t
JOIN test_assignments ta ON ta.test_id = t.id
LEFT JOIN classes c ON c.id = ta.class_id
ORDER BY t.title, ta.created_at;
