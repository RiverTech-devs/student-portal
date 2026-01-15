-- Link Freshman Chemistry test assignment to gradebook

-- Step 1: Reactivate the test_assignment
UPDATE test_assignments
SET is_active = true
WHERE id = 'd9b25624-01b8-4c97-a93a-25802b912883';

-- Step 2: Create the assignment entry
DO $$
DECLARE
    new_assignment_id UUID;
    test_max_points INTEGER;
BEGIN
    -- Calculate max points from questions
    SELECT COALESCE(SUM(COALESCE(max_points, 1)), 100) INTO test_max_points
    FROM test_questions WHERE test_id = 'd87ca0fe-646b-467f-b0dc-84eee1aded65';

    -- Create the assignment
    INSERT INTO assignments (
        class_id,
        title,
        description,
        due_date,
        max_points,
        is_published,
        assignment_type,
        graded_offline,
        assigned_to_all
    ) VALUES (
        '36ebe8f6-8cc0-44a6-a411-c7213e50145b',  -- Freshman Chemistry class_id
        '[Test] Q2 Chemistry Final',
        'Testing Center exam - grades synced automatically',
        (SELECT due_date FROM test_assignments WHERE id = 'd9b25624-01b8-4c97-a93a-25802b912883'),
        test_max_points,
        true,
        'test',
        true,
        true
    )
    RETURNING id INTO new_assignment_id;

    -- Link the test_assignment to the assignment
    UPDATE test_assignments
    SET linked_assignment_id = new_assignment_id
    WHERE id = 'd9b25624-01b8-4c97-a93a-25802b912883';

    RAISE NOTICE 'Created assignment % for Freshman Chemistry', new_assignment_id;
END $$;

-- Step 3: Link submissions for Freshman Chemistry students
DO $$
DECLARE
    rec RECORD;
    new_submission_id UUID;
    linked_assignment UUID;
BEGIN
    -- Get the linked_assignment_id
    SELECT linked_assignment_id INTO linked_assignment
    FROM test_assignments
    WHERE id = 'd9b25624-01b8-4c97-a93a-25802b912883';

    FOR rec IN
        SELECT
            tsub.id as test_submission_id,
            tsub.student_id,
            tsub.final_score,
            tsub.status,
            tsub.submitted_at,
            tsub.graded_at
        FROM test_submissions tsub
        JOIN class_enrollments ce ON ce.student_id = tsub.student_id
        WHERE tsub.test_id = 'd87ca0fe-646b-467f-b0dc-84eee1aded65'
        AND ce.class_id = '36ebe8f6-8cc0-44a6-a411-c7213e50145b'  -- Freshman Chemistry
        AND tsub.linked_submission_id IS NULL
    LOOP
        -- Check if assignment_submission already exists
        SELECT id INTO new_submission_id
        FROM assignment_submissions
        WHERE assignment_id = linked_assignment
        AND student_id = rec.student_id;

        IF new_submission_id IS NULL THEN
            -- Create the assignment_submission
            INSERT INTO assignment_submissions (
                assignment_id,
                student_id,
                submitted_at,
                status,
                points_earned,
                graded_at
            ) VALUES (
                linked_assignment,
                rec.student_id,
                rec.submitted_at,
                CASE WHEN rec.status = 'graded' THEN 'graded' ELSE 'submitted' END,
                rec.final_score,
                rec.graded_at
            )
            RETURNING id INTO new_submission_id;
        END IF;

        -- Link the test_submission
        UPDATE test_submissions
        SET linked_submission_id = new_submission_id
        WHERE id = rec.test_submission_id;

        RAISE NOTICE 'Linked submission for student %', rec.student_id;
    END LOOP;
END $$;

-- Verify
SELECT
    t.title as test_title,
    c.name as class_name,
    ta.linked_assignment_id,
    ta.is_active,
    COUNT(DISTINCT tsub.id) as submission_count,
    COUNT(DISTINCT tsub.linked_submission_id) as linked_submissions
FROM test_assignments ta
JOIN tests t ON t.id = ta.test_id
JOIN classes c ON c.id = ta.class_id
LEFT JOIN test_submissions tsub ON tsub.test_id = ta.test_id
    AND EXISTS (
        SELECT 1 FROM class_enrollments ce
        WHERE ce.student_id = tsub.student_id AND ce.class_id = ta.class_id
    )
WHERE t.title = 'Q2 Chemistry Final'
GROUP BY t.title, c.name, ta.linked_assignment_id, ta.is_active
ORDER BY c.name;
