-- Fix test grades: convert percentage to actual points
-- final_score is a percentage (0-100), points_earned should be actual points

UPDATE assignment_submissions asub
SET points_earned = ROUND((tsub.final_score / 100.0) * tsub.max_possible_score)
FROM test_submissions tsub
WHERE tsub.linked_submission_id = asub.id
AND tsub.final_score IS NOT NULL;

-- Verify the fix
SELECT
    p.first_name || ' ' || p.last_name as student_name,
    c.name as class_name,
    tsub.final_score as test_percentage,
    tsub.max_possible_score as test_max_points,
    asub.points_earned as gradebook_points,
    a.max_points as gradebook_max_points
FROM test_submissions tsub
JOIN assignment_submissions asub ON asub.id = tsub.linked_submission_id
JOIN assignments a ON a.id = asub.assignment_id
JOIN classes c ON c.id = a.class_id
JOIN profiles p ON p.id = tsub.student_id
WHERE tsub.test_id = 'd87ca0fe-646b-467f-b0dc-84eee1aded65'
ORDER BY c.name, p.last_name;
