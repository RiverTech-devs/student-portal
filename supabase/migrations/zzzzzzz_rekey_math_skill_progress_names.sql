-- Re-key existing Math skill_progress rows written before the Dojo resolved
-- skill names to the curriculum title. skill_progress_with_graph joins
-- curriculum_nodes.legacy_name = skill_progress.skill_name, and legacy_name is
-- the node title, so rows stored under the old Dojo-facing name never joined.
-- Safe to re-run: the WHERE clause no longer matches once applied.
BEGIN;
UPDATE skill_progress SET skill_name = 'Counting and Number Recognition' WHERE subject = 'Math' AND skill_name = 'Counting';
UPDATE skill_progress SET skill_name = 'Place Value Understanding' WHERE subject = 'Math' AND skill_name = 'Place Value';
UPDATE skill_progress SET skill_name = 'Comparing Numbers' WHERE subject = 'Math' AND skill_name = 'Number Comparison';
UPDATE skill_progress SET skill_name = 'Time Telling' WHERE subject = 'Math' AND skill_name = 'Time';
UPDATE skill_progress SET skill_name = 'Money and Coins' WHERE subject = 'Math' AND skill_name = 'Money';
UPDATE skill_progress SET skill_name = 'Patterns and Sequences' WHERE subject = 'Math' AND skill_name = 'Patterns';
UPDATE skill_progress SET skill_name = 'Basic Addition' WHERE subject = 'Math' AND skill_name = 'Addition';
UPDATE skill_progress SET skill_name = 'Basic Subtraction' WHERE subject = 'Math' AND skill_name = 'Subtraction';
UPDATE skill_progress SET skill_name = 'Basic Fractions' WHERE subject = 'Math' AND skill_name = 'Fractions (Concepts)';
UPDATE skill_progress SET skill_name = 'Rounding and Estimation' WHERE subject = 'Math' AND skill_name = 'Rounding';
UPDATE skill_progress SET skill_name = 'Basic Measurement' WHERE subject = 'Math' AND skill_name = 'Measurement';
UPDATE skill_progress SET skill_name = 'Percentages' WHERE subject = 'Math' AND skill_name = 'Percents';
UPDATE skill_progress SET skill_name = 'Basic Algebraic Expressions' WHERE subject = 'Math' AND skill_name = 'Algebraic Expressions';
UPDATE skill_progress SET skill_name = 'Solving Simple Equations' WHERE subject = 'Math' AND skill_name = 'Equations';
UPDATE skill_progress SET skill_name = 'Ratio and Proportion' WHERE subject = 'Math' AND skill_name = 'Ratios';
UPDATE skill_progress SET skill_name = 'Basic Geometry Concepts' WHERE subject = 'Math' AND skill_name = 'Shapes';
UPDATE skill_progress SET skill_name = 'Triangles and Pythagorean Theorem' WHERE subject = 'Math' AND skill_name = 'Pythagorean';
UPDATE skill_progress SET skill_name = 'Basic Functions' WHERE subject = 'Math' AND skill_name = 'Functions (Intro)';
UPDATE skill_progress SET skill_name = 'Classifying Triangles' WHERE subject = 'Math' AND skill_name = 'Triangles';
UPDATE skill_progress SET skill_name = 'Trigonometric Ratios' WHERE subject = 'Math' AND skill_name = 'Trigonometry';
UPDATE skill_progress SET skill_name = 'Factoring Trinomials' WHERE subject = 'Math' AND skill_name = 'Factoring';
UPDATE skill_progress SET skill_name = 'Quadratic Equations' WHERE subject = 'Math' AND skill_name = 'Quadratics';
UPDATE skill_progress SET skill_name = 'Exponential and Logarithmic Functions' WHERE subject = 'Math' AND skill_name = 'Logarithms';
UPDATE skill_progress SET skill_name = 'Sequence and Series' WHERE subject = 'Math' AND skill_name = 'Sequences';
UPDATE skill_progress SET skill_name = 'Probability and Statistics' WHERE subject = 'Math' AND skill_name = 'Probability';
UPDATE skill_progress SET skill_name = 'Trigonometry' WHERE subject = 'Math' AND skill_name = 'Trig Functions';
UPDATE skill_progress SET skill_name = 'Applications of Derivatives' WHERE subject = 'Math' AND skill_name = 'Applications';
UPDATE skill_progress SET skill_name = 'Discrete Mathematics' WHERE subject = 'Math' AND skill_name = 'Discrete Math';
UPDATE skill_progress SET skill_name = 'Investments and Growth' WHERE subject = 'Math' AND skill_name = 'Investments & Growth';
COMMIT;
