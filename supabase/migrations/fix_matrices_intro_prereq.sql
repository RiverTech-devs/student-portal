-- Fix: Route "Systems by Elimination" -> "Matrices Intro" instead of directly to "Matrices"
-- Matrices Intro (M-143) had no incoming edges, making it impossible to unlock
-- The path should be: Systems by Elimination (M-122) -> Matrices Intro (M-143) -> Matrices (M-148)
UPDATE curriculum_edges
SET to_node = 'M-143'
WHERE id = 'E0182' AND from_node = 'M-122' AND to_node = 'M-148';
