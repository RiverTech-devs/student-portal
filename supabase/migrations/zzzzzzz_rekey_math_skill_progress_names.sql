-- Re-key Math skill_progress rows onto the curriculum title.
--
-- WHY. The Dojo posted progress under its own facing name, resolved through a
-- 56-entry map that got 0 of these 29 skills right. The view
-- skill_progress_with_graph joins curriculum_nodes.legacy_name =
-- skill_progress.skill_name, and legacy_name is the node title, so those rows
-- never linked to a curriculum node at all.
--
-- WHY IT IS ONE BIG DO BLOCK, not a list of UPDATEs:
--   * a student can hold rows under BOTH names, so a plain rename hits the
--     unique key on (user_id, subject, skill_name) — the pair must be merged;
--   * the map contains a chain ('Trig Functions' -> 'Trigonometry' ->
--     'Trigonometric Ratios'), so the order pairs are applied in matters;
--   * a TEMP TABLE would not survive, because the Supabase SQL editor commits
--     statement by statement and ON COMMIT DROP removes it before the loop runs.
-- Everything therefore lives inside a single self-contained statement.
--
-- Run the whole file. Safe to re-run: the run is recorded in
-- rivertech_migration_log and a second attempt reports "already applied" and
-- stops. That guard is REQUIRED, not decorative — see the chain note above.
--
-- DRY RUN — paste this on its own first to see the blast radius, changes nothing:
--
--   SELECT r.old_name, r.new_name,
--          count(o.id)                       AS rows_to_move,
--          count(n.id)                       AS would_collide
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
--   GROUP BY 1, 2
--   HAVING count(o.id) > 0
--   ORDER BY 1;

CREATE TABLE IF NOT EXISTS rivertech_migration_log (
  name       text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

DO $rekey$
DECLARE
  -- Ordered so a target is renamed before anything renames into it.
  pairs text[][] := ARRAY[
    ['Addition', 'Basic Addition'],
    ['Algebraic Expressions', 'Basic Algebraic Expressions'],
    ['Applications', 'Applications of Derivatives'],
    ['Counting', 'Counting and Number Recognition'],
    ['Discrete Math', 'Discrete Mathematics'],
    ['Equations', 'Solving Simple Equations'],
    ['Factoring', 'Factoring Trinomials'],
    ['Fractions (Concepts)', 'Basic Fractions'],
    ['Functions (Intro)', 'Basic Functions'],
    ['Investments & Growth', 'Investments and Growth'],
    ['Logarithms', 'Exponential and Logarithmic Functions'],
    ['Measurement', 'Basic Measurement'],
    ['Money', 'Money and Coins'],
    ['Number Comparison', 'Comparing Numbers'],
    ['Patterns', 'Patterns and Sequences'],
    ['Percents', 'Percentages'],
    ['Place Value', 'Place Value Understanding'],
    ['Probability', 'Probability and Statistics'],
    ['Pythagorean', 'Triangles and Pythagorean Theorem'],
    ['Quadratics', 'Quadratic Equations'],
    ['Ratios', 'Ratio and Proportion'],
    ['Rounding', 'Rounding and Estimation'],
    ['Sequences', 'Sequence and Series'],
    ['Shapes', 'Basic Geometry Concepts'],
    ['Subtraction', 'Basic Subtraction'],
    ['Time', 'Time Telling'],
    ['Triangles', 'Classifying Triangles'],
    ['Trigonometry', 'Trigonometric Ratios'],
    ['Trig Functions', 'Trigonometry']
  ];
  old_name    text;
  new_name    text;
  n_merged    int;
  n_renamed   int;
  tot_merged  int := 0;
  tot_renamed int := 0;
BEGIN
  -- One-shot. The map contains a chain ('Trig Functions' -> 'Trigonometry' ->
  -- 'Trigonometric Ratios'), so after a successful run the name 'Trigonometry'
  -- is both a CORRECT final name and still an old_name. Re-running would move it
  -- again and merge two different skills. Content alone cannot tell the two
  -- apart, so the run is recorded instead.
  IF EXISTS (SELECT 1 FROM rivertech_migration_log
             WHERE name = 'rekey_math_skill_progress_names') THEN
    RAISE NOTICE 'already applied on % — nothing to do',
      (SELECT applied_at FROM rivertech_migration_log
       WHERE name = 'rekey_math_skill_progress_names');
    RETURN;
  END IF;

  FOR i IN 1 .. array_length(pairs, 1) LOOP
    old_name := pairs[i][1];
    new_name := pairs[i][2];

    -- Fold any row under the old name into that student's existing row under
    -- the new name, then drop the old one. Nothing is lost, and the rename
    -- below can no longer collide.
    WITH d AS (
      SELECT o.id AS old_id, n.id AS keep_id
      FROM skill_progress o
      JOIN skill_progress n
        ON n.user_id = o.user_id AND n.subject = 'Math' AND n.skill_name = new_name
      WHERE o.subject = 'Math' AND o.skill_name = old_name
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
    SET skill_name = new_name, updated_at = now()
    WHERE subject = 'Math' AND skill_name = old_name;
    GET DIAGNOSTICS n_renamed = ROW_COUNT;

    tot_merged  := tot_merged  + n_merged;
    tot_renamed := tot_renamed + n_renamed;
    IF n_merged > 0 OR n_renamed > 0 THEN
      RAISE NOTICE '% -> %  (% merged, % renamed)', old_name, new_name, n_merged, n_renamed;
    END IF;
  END LOOP;

  INSERT INTO rivertech_migration_log (name) VALUES ('rekey_math_skill_progress_names');
  RAISE NOTICE 'done: % rows merged into an existing row, % rows renamed',
               tot_merged, tot_renamed;
END
$rekey$;

-- VERIFY — should return no rows once this has run:
--   SELECT skill_name, count(*) FROM skill_progress
--   WHERE subject = 'Math' AND skill_name IN ('Addition', 'Algebraic Expressions', 'Applications', 'Counting', 'Discrete Math', 'Equations', 'Factoring', 'Fractions (Concepts)', 'Functions (Intro)', 'Investments & Growth', 'Logarithms', 'Measurement', 'Money', 'Number Comparison', 'Patterns', 'Percents', 'Place Value', 'Probability', 'Pythagorean', 'Quadratics', 'Ratios', 'Rounding', 'Sequences', 'Shapes', 'Subtraction', 'Time', 'Triangles', 'Trigonometry', 'Trig Functions')
--   GROUP BY 1 ORDER BY 1;
