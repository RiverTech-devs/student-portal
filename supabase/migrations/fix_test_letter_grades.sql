-- Add letter grades to test assignment submissions
UPDATE assignment_submissions asub
SET grade = CASE
    WHEN tsub.final_score >= 97 THEN 'A+'
    WHEN tsub.final_score >= 93 THEN 'A'
    WHEN tsub.final_score >= 90 THEN 'A-'
    WHEN tsub.final_score >= 87 THEN 'B+'
    WHEN tsub.final_score >= 83 THEN 'B'
    WHEN tsub.final_score >= 80 THEN 'B-'
    WHEN tsub.final_score >= 77 THEN 'C+'
    WHEN tsub.final_score >= 73 THEN 'C'
    WHEN tsub.final_score >= 70 THEN 'C-'
    WHEN tsub.final_score >= 67 THEN 'D+'
    WHEN tsub.final_score >= 63 THEN 'D'
    WHEN tsub.final_score >= 60 THEN 'D-'
    ELSE 'F'
END,
status = 'graded'
FROM test_submissions tsub
WHERE tsub.linked_submission_id = asub.id
AND tsub.final_score IS NOT NULL;
