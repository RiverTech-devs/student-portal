-- Re-key Math skill_progress rows onto the curriculum title.
--
-- Why: the Dojo posted progress under its own facing name, resolved through a
-- 56-entry map that got 0 of these 29 skills right. The view
-- skill_progress_with_graph joins curriculum_nodes.legacy_name =
-- skill_progress.skill_name, and legacy_name is the node title, so those rows
-- never linked to a curriculum node at all.
--
-- Why it is not a plain UPDATE: a student can already hold rows under BOTH
-- names, because the portal and skill tree always wrote the title. And the map
-- contains a chain ('Trig Functions' -> 'Trigonometry' -> 'Trigonometric
-- Ratios'), so order matters. Pairs are applied one at a time, in an order that
-- renames a target before anything renames into it.
--
-- Safe to re-run. Transactional. Reports what it did via NOTICE.
--
-- DRY RUN — see what would happen without changing anything:
--   SELECT r.old_name, r.new_name,
--          count(o.id) AS rows_found,
--          count(n.id) AS would_collide
--   FROM (VALUES
--     ('Addition', 'Basic Addition'),
--     ('Algebraic Expressions', 'Basic Algebraic Expressions'),
--     ('Applications', 'Applications of Derivatives'),
--     ('Counting', 'Counting and Number Recognition'),
--     ('Discrete Math', 'Discrete Mathematics'),
--     ('Equations', 'Solving Simple Equations'),
--     ('Factoring', 'Factoring Trinomials'),
--     ('Fractions (Concepts)', 'Basic Fractions'),
--     ('Functions (Intro)', 'Basic Functions'),
--     ('Investments & Growth', 'Investments and Growth'),
--     ('Logarithms', 'Exponential and Logarithmic Functions'),
--     ('Measurement', 'Basic Measurement'),
--     ('Money', 'Money and Coins'),
--     ('Number Comparison', 'Comparing Numbers'),
--     ('Patterns', 'Patterns and Sequences'),
--     ('Percents', 'Percentages'),
--     ('Place Value', 'Place Value Understanding'),
--     ('Probability', 'Probability and Statistics'),
--     ('Pythagorean', 'Triangles and Pythagorean Theorem'),
--     ('Quadratics', 'Quadratic Equations'),
--     ('Ratios', 'Ratio and Proportion'),
--     ('Rounding', 'Rounding and Estimation'),
--     ('Sequences', 'Sequence and Series'),
--     ('Shapes', 'Basic Geometry Concepts'),
--     ('Subtraction', 'Basic Subtraction'),
--     ('Time', 'Time Telling'),
--     ('Triangles', 'Classifying Triangles'),
--     ('Trigonometry', 'Trigonometric Ratios'),
--     ('Trig Functions', 'Trigonometry')
--   ) AS r(old_name, new_name)
--   LEFT JOIN skill_progress o
--     ON o.subject = 'Math' AND o.skill_name = r.old_name
--   LEFT JOIN skill_progress n
--     ON n.subject = 'Math' AND n.skill_name = r.new_name AND n.user_id = o.user_id
--   GROUP BY 1, 2 HAVING count(o.id) > 0 ORDER BY 1;

BEGIN;

CREATE TEMP TABLE _rekey(seq int PRIMARY KEY, old_name text NOT NULL, new_name text NOT NULL)
  ON COMMIT DROP;
INSERT INTO _rekey (seq, old_name, new_name) VALUES
 (1, 'Addition', 'Basic Addition'),
 (2, 'Algebraic Expressions', 'Basic Algebraic Expressions'),
 (3, 'Applications', 'Applications of Derivatives'),
 (4, 'Counting', 'Counting and Number Recognition'),
 (5, 'Discrete Math', 'Discrete Mathematics'),
 (6, 'Equations', 'Solving Simple Equations'),
 (7, 'Factoring', 'Factoring Trinomials'),
 (8, 'Fractions (Concepts)', 'Basic Fractions'),
 (9, 'Functions (Intro)', 'Basic Functions'),
 (10, 'Investments & Growth', 'Investments and Growth'),
 (11, 'Logarithms', 'Exponential and Logarithmic Functions'),
 (12, 'Measurement', 'Basic Measurement'),
 (13, 'Money', 'Money and Coins'),
 (14, 'Number Comparison', 'Comparing Numbers'),
 (15, 'Patterns', 'Patterns and Sequences'),
 (16, 'Percents', 'Percentages'),
 (17, 'Place Value', 'Place Value Understanding'),
 (18, 'Probability', 'Probability and Statistics'),
 (19, 'Pythagorean', 'Triangles and Pythagorean Theorem'),
 (20, 'Quadratics', 'Quadratic Equations'),
 (21, 'Ratios', 'Ratio and Proportion'),
 (22, 'Rounding', 'Rounding and Estimation'),
 (23, 'Sequences', 'Sequence and Series'),
 (24, 'Shapes', 'Basic Geometry Concepts'),
 (25, 'Subtraction', 'Basic Subtraction'),
 (26, 'Time', 'Time Telling'),
 (27, 'Triangles', 'Classifying Triangles'),
 (28, 'Trigonometry', 'Trigonometric Ratios'),
 (29, 'Trig Functions', 'Trigonometry');

DO $rekey$
DECLARE
  r          RECORD;
  n_merged   int;
  n_renamed  int;
  tot_merged int := 0;
  tot_renamed int := 0;
BEGIN
  FOR r IN SELECT old_name, new_name FROM _rekey ORDER BY seq LOOP

    -- Fold any row under the old name into that student's existing row under the
    -- new name, then drop the old one. Nothing is lost and the rename below
    -- can no longer collide.
    WITH d AS (
      SELECT o.id AS old_id, n.id AS keep_id
      FROM skill_progress o
      JOIN skill_progress n
        ON n.user_id = o.user_id AND n.subject = 'Math' AND n.skill_name = r.new_name
      WHERE o.subject = 'Math' AND o.skill_name = r.old_name
    ), folded AS (
      UPDATE skill_progress k SET
        state = CASE WHEN array_position(ARRAY['locked','available','in_progress','activated','mastered'], o.state)
                        > array_position(ARRAY['locked','available','in_progress','activated','mastered'], k.state)
                     THEN o.state ELSE k.state END,
        mastery_score       = GREATEST(COALESCE(k.mastery_score, 0), COALESCE(o.mastery_score, 0)),
        p_mastered          = GREATEST(COALESCE(k.p_mastered, 0), COALESCE(o.p_mastered, 0)),
        practice_count      = COALESCE(k.practice_count, 0) + COALESCE(o.practice_count, 0),
        last_practiced      = GREATEST(k.last_practiced, o.last_practiced),
        last_evidence_at    = GREATEST(k.last_evidence_at, o.last_evidence_at),
        decay_steps_applied = LEAST(COALESCE(k.decay_steps_applied, 0), COALESCE(o.decay_steps_applied, 0)),
        updated_at          = now()
      FROM d JOIN skill_progress o ON o.id = d.old_id
      WHERE k.id = d.keep_id
      RETURNING 1
    )
    DELETE FROM skill_progress WHERE id IN (SELECT old_id FROM d);
    GET DIAGNOSTICS n_merged = ROW_COUNT;

    UPDATE skill_progress
    SET skill_name = r.new_name, updated_at = now()
    WHERE subject = 'Math' AND skill_name = r.old_name;
    GET DIAGNOSTICS n_renamed = ROW_COUNT;

    tot_merged  := tot_merged + n_merged;
    tot_renamed := tot_renamed + n_renamed;
    IF n_merged > 0 OR n_renamed > 0 THEN
      RAISE NOTICE '% -> %  (% merged, % renamed)', r.old_name, r.new_name, n_merged, n_renamed;
    END IF;
  END LOOP;

  RAISE NOTICE 'done: % rows merged into an existing row, % rows renamed', tot_merged, tot_renamed;
END
$rekey$;

COMMIT;

-- VERIFY — should return no rows once this has run:
--   SELECT skill_name, count(*) FROM skill_progress
--   WHERE subject = 'Math' AND skill_name IN ('Addition', 'Algebraic Expressions', 'Applications', 'Counting', 'Discrete Math', 'Equations', 'Factoring', 'Fractions (Concepts)', 'Functions (Intro)', 'Investments & Growth', 'Logarithms', 'Measurement', 'Money', 'Number Comparison', 'Patterns', 'Percents', 'Place Value', 'Probability', 'Pythagorean', 'Quadratics', 'Ratios', 'Rounding', 'Sequences', 'Shapes', 'Subtraction', 'Time', 'Triangles', 'Trigonometry', 'Trig Functions')
--   GROUP BY 1 ORDER BY 1;
