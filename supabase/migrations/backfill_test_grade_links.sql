-- Backfill linked_assignment_id and linked_submission_id for existing test data
-- This links test grades to the assignments/gradebook system

-- ============================================================================
-- STEP 1: Create assignments for test_assignments that don't have links
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    new_assignment_id UUID;
    test_max_points INTEGER;
BEGIN
    FOR rec IN
        SELECT
            tassign.id as test_assignment_id,
            tassign.test_id,
            tassign.class_id,
            tassign.assigned_by,
            tassign.due_date,
            t.title,
            t.owner_id
        FROM test_assignments tassign
        JOIN tests t ON t.id = tassign.test_id
        WHERE tassign.linked_assignment_id IS NULL
        AND tassign.is_active = true
        AND tassign.class_id IS NOT NULL
    LOOP
        -- Calculate max points from questions
        SELECT COALESCE(SUM(COALESCE(max_points, 10)), 100) INTO test_max_points
        FROM test_questions WHERE test_id = rec.test_id;

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
            rec.class_id,
            '[Test] ' || rec.title,
            'Testing Center exam - grades synced automatically',
            rec.due_date,
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
        WHERE id = rec.test_assignment_id;

        RAISE NOTICE 'Created assignment % for test_assignment %', new_assignment_id, rec.test_assignment_id;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Create assignment_submissions for test_submissions that don't have links
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    new_submission_id UUID;
    linked_assignment UUID;
BEGIN
    FOR rec IN
        SELECT
            tsub.id as test_submission_id,
            tsub.test_id,
            tsub.student_id,
            tsub.final_score,
            tsub.max_possible_score,
            tsub.status,
            tsub.submitted_at,
            tsub.graded_at,
            tassign.linked_assignment_id
        FROM test_submissions tsub
        JOIN test_assignments tassign ON tassign.test_id = tsub.test_id AND tassign.is_active = true
        JOIN class_enrollments ce ON ce.class_id = tassign.class_id AND ce.student_id = tsub.student_id
        WHERE tsub.linked_submission_id IS NULL
        AND tassign.linked_assignment_id IS NOT NULL
    LOOP
        linked_assignment := rec.linked_assignment_id;

        -- Check if assignment_submission already exists
        SELECT id INTO new_submission_id
        FROM assignment_submissions
        WHERE assignment_id = linked_assignment
        AND student_id = rec.student_id;

        IF new_submission_id IS NULL THEN
            -- Create the assignment_submission
            -- final_score is a percentage, convert to actual points
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
                ROUND((rec.final_score / 100.0) * rec.max_possible_score),
                rec.graded_at
            )
            RETURNING id INTO new_submission_id;
        ELSE
            -- Update existing submission with latest grade
            UPDATE assignment_submissions
            SET
                status = CASE WHEN rec.status = 'graded' THEN 'graded' ELSE status END,
                points_earned = COALESCE(ROUND((rec.final_score / 100.0) * rec.max_possible_score), points_earned),
                graded_at = COALESCE(rec.graded_at, graded_at)
            WHERE id = new_submission_id;
        END IF;

        -- Link the test_submission to the assignment_submission
        UPDATE test_submissions
        SET linked_submission_id = new_submission_id
        WHERE id = rec.test_submission_id;

        RAISE NOTICE 'Linked test_submission % to assignment_submission %', rec.test_submission_id, new_submission_id;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Verify the links were created
-- ============================================================================

SELECT
    t.title as test_title,
    c.name as class_name,
    tassign.linked_assignment_id,
    a.title as assignment_title,
    COUNT(DISTINCT tsub.id) as submission_count,
    COUNT(DISTINCT tsub.linked_submission_id) as linked_submissions
FROM test_assignments tassign
JOIN tests t ON t.id = tassign.test_id
LEFT JOIN classes c ON c.id = tassign.class_id
LEFT JOIN assignments a ON a.id = tassign.linked_assignment_id
LEFT JOIN test_submissions tsub ON tsub.test_id = tassign.test_id
WHERE tassign.is_active = true
GROUP BY t.title, c.name, tassign.linked_assignment_id, a.title
ORDER BY t.title, c.name;
