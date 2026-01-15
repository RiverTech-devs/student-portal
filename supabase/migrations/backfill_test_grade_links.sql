-- Backfill linked_assignment_id and linked_submission_id for existing test data
-- This links test grades to the assignments/gradebook system

-- ============================================================================
-- STEP 1: Create assignments for test_assignments that don't have links
-- ============================================================================

DO $$
DECLARE
    ta RECORD;
    new_assignment_id UUID;
    test_title TEXT;
    test_max_points INTEGER;
BEGIN
    FOR ta IN
        SELECT
            ta.id as test_assignment_id,
            ta.test_id,
            ta.class_id,
            ta.assigned_by,
            ta.due_date,
            t.title,
            t.owner_id
        FROM test_assignments ta
        JOIN tests t ON t.id = ta.test_id
        WHERE ta.linked_assignment_id IS NULL
        AND ta.is_active = true
        AND ta.class_id IS NOT NULL
    LOOP
        -- Calculate max points from questions
        SELECT COALESCE(SUM(COALESCE(max_points, 10)), 100) INTO test_max_points
        FROM test_questions WHERE test_id = ta.test_id;

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
            assigned_to_all,
            created_by
        ) VALUES (
            ta.class_id,
            '[Test] ' || ta.title,
            'Testing Center exam - grades synced automatically',
            ta.due_date,
            test_max_points,
            true,
            'test',
            true,
            true,
            ta.owner_id
        )
        RETURNING id INTO new_assignment_id;

        -- Link the test_assignment to the assignment
        UPDATE test_assignments
        SET linked_assignment_id = new_assignment_id
        WHERE id = ta.test_assignment_id;

        RAISE NOTICE 'Created assignment % for test_assignment %', new_assignment_id, ta.test_assignment_id;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Create assignment_submissions for test_submissions that don't have links
-- ============================================================================

DO $$
DECLARE
    ts RECORD;
    new_submission_id UUID;
    linked_assignment UUID;
BEGIN
    FOR ts IN
        SELECT
            ts.id as test_submission_id,
            ts.test_id,
            ts.student_id,
            ts.final_score,
            ts.max_possible_score,
            ts.status,
            ts.submitted_at,
            ts.graded_at,
            ta.linked_assignment_id
        FROM test_submissions ts
        JOIN test_assignments ta ON ta.test_id = ts.test_id AND ta.is_active = true
        JOIN class_enrollments ce ON ce.class_id = ta.class_id AND ce.student_id = ts.student_id
        WHERE ts.linked_submission_id IS NULL
        AND ta.linked_assignment_id IS NOT NULL
    LOOP
        linked_assignment := ts.linked_assignment_id;

        -- Check if assignment_submission already exists
        SELECT id INTO new_submission_id
        FROM assignment_submissions
        WHERE assignment_id = linked_assignment
        AND student_id = ts.student_id;

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
                ts.student_id,
                ts.submitted_at,
                CASE WHEN ts.status = 'graded' THEN 'graded' ELSE 'submitted' END,
                ts.final_score,
                ts.graded_at
            )
            RETURNING id INTO new_submission_id;
        ELSE
            -- Update existing submission with latest grade
            UPDATE assignment_submissions
            SET
                status = CASE WHEN ts.status = 'graded' THEN 'graded' ELSE status END,
                points_earned = COALESCE(ts.final_score, points_earned),
                graded_at = COALESCE(ts.graded_at, graded_at)
            WHERE id = new_submission_id;
        END IF;

        -- Link the test_submission to the assignment_submission
        UPDATE test_submissions
        SET linked_submission_id = new_submission_id
        WHERE id = ts.test_submission_id;

        RAISE NOTICE 'Linked test_submission % to assignment_submission %', ts.test_submission_id, new_submission_id;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Verify the links were created
-- ============================================================================

SELECT
    t.title as test_title,
    c.name as class_name,
    ta.linked_assignment_id,
    a.title as assignment_title,
    COUNT(DISTINCT ts.id) as submission_count,
    COUNT(DISTINCT ts.linked_submission_id) as linked_submissions
FROM test_assignments ta
JOIN tests t ON t.id = ta.test_id
LEFT JOIN classes c ON c.id = ta.class_id
LEFT JOIN assignments a ON a.id = ta.linked_assignment_id
LEFT JOIN test_submissions ts ON ts.test_id = ta.test_id
WHERE ta.is_active = true
GROUP BY t.title, c.name, ta.linked_assignment_id, a.title
ORDER BY t.title, c.name;
