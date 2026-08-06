-- ============================================================
-- riven_usage — school-wide coverage rollup for the Riven terminal
--
-- WHY
-- ---
-- Riven's coverage telemetry lives in localStorage, keyed per profile. That
-- makes it per-teacher AND per-browser: clearing site data loses it, and an
-- admin can never see the school-wide picture. The one decision the telemetry
-- exists to inform — whether the LLM tiers still earn their ~600 lines and two
-- CDN dependencies — needs the TEACHERS' miss rate, not the admin's. The admin
-- is the one person who never hits the gaps, because they know how it parses.
--
-- WHAT IS STORED, AND WHAT DELIBERATELY IS NOT
-- --------------------------------------------
-- Counts, and the SHAPE of a phrasing that missed — never the raw sentence.
--
-- A miss like "is jordan vibing today" is a teacher's utterance about a named
-- child. In localStorage that is a scratch buffer on their own machine. In a
-- Postgres table it becomes a searchable, retained log of what staff said about
-- which students — a materially different artifact, and exactly the sort of
-- thing that surfaces in a records request.
--
-- The client strips entity names before anything is sent (_rivenPhraseShape,
-- the same function the learned phrasebook uses), so the row reads:
--
--     "is jordan vibing today"   ->   shape: "today vibing"
--
-- That keeps everything needed to improve the parser and drops the part that
-- identifies a child. `shape` is CHECK-constrained to a short, lowercase,
-- token-sorted string so a raw sentence cannot be smuggled in by a future
-- caller that forgets to strip.
--
-- SHAPE, NOT EVENTS
-- -----------------
-- One row per (user, day, intent, outcome, shape), incremented on upsert. No
-- row per keystroke, no write on the hot path — the client batches and flushes.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.riven_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day         DATE NOT NULL,
  -- The intent that ran. NULL for a miss (nothing routed).
  intent      TEXT,
  outcome     TEXT NOT NULL CHECK (outcome IN ('routed', 'learned', 'weak', 'miss')),
  -- Entity-stripped phrase shape. Only ever set for weak/miss rows — there is
  -- nothing to learn from the wording of a request that already worked.
  shape       TEXT,
  count       INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Defence in depth against a future caller sending raw input: a shape is
  -- short, lowercase, and contains only content tokens and single spaces.
  -- A real sentence trips the length, the capitals, or the punctuation.
  CONSTRAINT riven_usage_shape_is_stripped CHECK (
    shape IS NULL OR (
      length(shape) <= 120
      AND shape = lower(shape)
      AND shape ~ '^[a-z0-9_]+( [a-z0-9_]+)*$'
    )
  ),
  -- A shape only belongs on a row we are trying to learn from.
  CONSTRAINT riven_usage_shape_only_on_gaps CHECK (
    shape IS NULL OR outcome IN ('weak', 'miss')
  )
);

-- One row per bucket; the client upserts and increments into it.
CREATE UNIQUE INDEX IF NOT EXISTS riven_usage_bucket
  ON public.riven_usage (user_id, day, COALESCE(intent, ''), outcome, COALESCE(shape, ''));

CREATE INDEX IF NOT EXISTS riven_usage_day ON public.riven_usage (day DESC);
CREATE INDEX IF NOT EXISTS riven_usage_intent ON public.riven_usage (intent) WHERE intent IS NOT NULL;

ALTER TABLE public.riven_usage ENABLE ROW LEVEL SECURITY;

-- RLS mirrors email_log: write your own, read your own, admins read all.
DROP POLICY IF EXISTS "Users insert own riven usage" ON public.riven_usage;
CREATE POLICY "Users insert own riven usage" ON public.riven_usage
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own riven usage" ON public.riven_usage;
CREATE POLICY "Users update own riven usage" ON public.riven_usage
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own riven usage" ON public.riven_usage;
CREATE POLICY "Users read own riven usage" ON public.riven_usage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all riven usage" ON public.riven_usage;
CREATE POLICY "Admins read all riven usage" ON public.riven_usage
  FOR SELECT TO authenticated
  USING (public.get_my_user_type() = 'admin');

-- ============================================================
-- Upsert-and-increment. SECURITY DEFINER so the increment is atomic under
-- concurrent flushes from several teachers, but it can ONLY ever write a row
-- for the caller: p_user_id is not a parameter, it is auth.uid().
-- ============================================================
CREATE OR REPLACE FUNCTION public.riven_usage_bump(
  p_day     DATE,
  p_intent  TEXT,
  p_outcome TEXT,
  p_shape   TEXT,
  p_count   INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET row_security = off
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;                      -- not signed in: silently do nothing
  END IF;
  IF p_outcome NOT IN ('routed', 'learned', 'weak', 'miss') THEN
    RETURN;
  END IF;
  IF p_count IS NULL OR p_count <= 0 OR p_count > 10000 THEN
    RETURN;                      -- a flush is a small rollup, never a flood
  END IF;
  -- Shapes are only meaningful on gap rows, and must already be stripped.
  IF p_shape IS NOT NULL AND (
       p_outcome NOT IN ('weak', 'miss')
       OR length(p_shape) > 120
       OR p_shape <> lower(p_shape)
       OR p_shape !~ '^[a-z0-9_]+( [a-z0-9_]+)*$') THEN
    p_shape := NULL;             -- drop it rather than reject the whole flush
  END IF;

  INSERT INTO public.riven_usage (user_id, day, intent, outcome, shape, count)
  VALUES (v_uid, p_day, p_intent, p_outcome, p_shape, p_count)
  ON CONFLICT (user_id, day, COALESCE(intent, ''), outcome, COALESCE(shape, ''))
  DO UPDATE SET count = public.riven_usage.count + EXCLUDED.count,
                updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.riven_usage_bump(DATE, TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.riven_usage_bump(DATE, TEXT, TEXT, TEXT, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.riven_usage_bump(DATE, TEXT, TEXT, TEXT, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.riven_usage_bump(DATE, TEXT, TEXT, TEXT, INTEGER) IS
'Increments one riven_usage bucket for the CALLER (auth.uid(), never a parameter). Drops a shape that is not entity-stripped rather than rejecting the flush.';

-- ============================================================
-- Retention: 90 days, same as email_log.
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_riven_usage()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.riven_usage WHERE day < (CURRENT_DATE - INTERVAL '90 days');
END;
$$;

COMMENT ON TABLE public.riven_usage IS
'Riven terminal coverage rollup. Counts + entity-stripped phrase shapes only — never raw teacher input, which would name students. 90-day retention.';

-- ============================================================
-- Verify after applying:
--
--   -- the shape guard actually bites (both should ERROR):
--   INSERT INTO public.riven_usage (user_id, day, outcome, shape, count)
--   VALUES (auth.uid(), CURRENT_DATE, 'miss', 'is Jordan vibing today?', 1);
--   INSERT INTO public.riven_usage (user_id, day, outcome, shape, count)
--   VALUES (auth.uid(), CURRENT_DATE, 'routed', 'today vibing', 1);
--
--   -- anon cannot bump:
--   SELECT has_function_privilege('anon',
--     'public.riven_usage_bump(date,text,text,text,integer)', 'EXECUTE');   -- false
--
--   -- school-wide picture (admin):
--   SELECT intent, SUM(count) AS n FROM public.riven_usage
--    WHERE outcome IN ('routed','learned') GROUP BY intent ORDER BY n DESC;
--
--   -- what to teach the parser next:
--   SELECT shape, SUM(count) AS n FROM public.riven_usage
--    WHERE outcome = 'miss' AND shape IS NOT NULL
--    GROUP BY shape ORDER BY n DESC LIMIT 30;
-- ============================================================
