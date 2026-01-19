-- Debug Leah's grades in Problem Solving class
SELECT
  a.title,
  a.max_points,
  asub.points_earned,
  asub.status,
  CASE
    WHEN asub.id IS NULL THEN 'NO SUBMISSION'
    WHEN asub.points_earned IS NULL THEN 'POINTS IS NULL'
    WHEN asub.status != 'graded' THEN 'NOT GRADED'
    ELSE 'OK'
  END as issue
FROM assignments a
LEFT JOIN assignment_submissions asub
  ON asub.assignment_id = a.id
  AND asub.student_id = '16eefae7-a380-4148-ba35-17f72912acaf'
WHERE a.class_id = 'f878f67b-9fa4-4848-91ae-5c79e841397e'
  AND a.is_published = true
ORDER BY a.title;
