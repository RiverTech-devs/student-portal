-- ============================================================================
-- STEP 1: Find which class the orphaned students belong to
-- ============================================================================

-- Get the class for each orphaned student
SELECT DISTINCT
    ce.class_id,
    c.name as class_name,
    COUNT(DISTINCT ts.student_id) as orphaned_submission_count
FROM test_submissions ts
JOIN class_enrollments ce ON ce.student_id = ts.student_id
JOIN classes c ON c.id = ce.class_id
WHERE ts.test_id = 'd87ca0fe-646b-467f-b0dc-84eee1aded65'  -- Q2 Chemistry Final
AND NOT EXISTS (
    SELECT 1 FROM test_assignments ta
    WHERE ta.test_id = ts.test_id
    AND ta.is_active = true
    AND (
        ta.student_id = ts.student_id
        OR (ta.student_id IS NULL AND ta.class_id = ce.class_id)
    )
)
GROUP BY ce.class_id, c.name;

-- ============================================================================
-- STEP 2: Show all test_assignments for this test (fixed query)
-- ============================================================================
SELECT
    ta.id,
    ta.test_id,
    t.title as test_title,
    ta.class_id,
    c.name as class_name,
    ta.student_id,
    ta.is_active,
    ta.due_date,
    ta.linked_assignment_id
FROM test_assignments ta
JOIN tests t ON t.id = ta.test_id
LEFT JOIN classes c ON c.id = ta.class_id
WHERE ta.test_id = 'd87ca0fe-646b-467f-b0dc-84eee1aded65'
ORDER BY ta.is_active DESC;

-- ============================================================================
-- STEP 3: After running Step 1 and getting the class_id, run this to create
-- the missing test_assignment. Replace 'CLASS_ID_HERE' with the actual ID.
-- ============================================================================

-- UNCOMMENT AND RUN THIS AFTER GETTING THE CLASS ID FROM STEP 1:
/*
INSERT INTO test_assignments (test_id, class_id, student_id, assigned_by, due_date, is_active)
SELECT
    'd87ca0fe-646b-467f-b0dc-84eee1aded65',  -- test_id
    'CLASS_ID_HERE',                          -- class_id from Step 1
    NULL,                                     -- whole class assignment
    (SELECT owner_id FROM tests WHERE id = 'd87ca0fe-646b-467f-b0dc-84eee1aded65'),
    (SELECT due_date FROM test_assignments WHERE test_id = 'd87ca0fe-646b-467f-b0dc-84eee1aded65' AND is_active = true LIMIT 1),
    true
WHERE NOT EXISTS (
    SELECT 1 FROM test_assignments
    WHERE test_id = 'd87ca0fe-646b-467f-b0dc-84eee1aded65'
    AND class_id = 'CLASS_ID_HERE'
    AND is_active = true
);
*/
