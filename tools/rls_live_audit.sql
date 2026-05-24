-- ============================================================
-- LIVE RLS AUDIT — paste into Supabase SQL Editor and run
--
-- Returns three result sets concatenated via UNION ALL so you can
-- copy the entire output back to Claude in one paste:
--   1) Per-table RLS status (RLS enabled / disabled / force)
--   2) Every policy on every table in the public schema
--   3) Flags for obviously-permissive policies
--
-- READ-ONLY: this query does not modify anything.
-- ============================================================

WITH

-- 1. Tables in public schema with RLS state
table_rls AS (
  SELECT
    n.nspname  AS schema,
    c.relname  AS table_name,
    c.relrowsecurity   AS rls_enabled,
    c.relforcerowsecurity AS rls_forced,
    (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policy_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'                -- ordinary tables
    AND n.nspname = 'public'
),

-- 2. Every policy
all_policies AS (
  SELECT
    schemaname AS schema,
    tablename  AS table_name,
    policyname,
    cmd,
    roles::text AS roles,
    permissive,
    COALESCE(qual,'')       AS using_expr,
    COALESCE(with_check,'') AS check_expr
  FROM pg_policies
  WHERE schemaname = 'public'
),

-- 3. Suspicious patterns
flagged AS (
  SELECT
    table_name,
    policyname,
    cmd,
    using_expr,
    check_expr,
    CASE
      WHEN using_expr ILIKE '%true%' AND using_expr NOT ILIKE '%auth.uid()%' AND using_expr NOT ILIKE '%user_type%'
        THEN 'USING (true) -- public read'
      WHEN using_expr ~* 'auth\.uid\(\)\s+IS NOT NULL'
        THEN 'USING only auth.uid() IS NOT NULL -- any authenticated user'
      WHEN using_expr ILIKE '%is_admin()%' OR using_expr ILIKE '%get_user_role()%' OR using_expr ILIKE '%is_teacher()%'
        THEN 'Calls legacy helper (is_admin/get_user_role/is_teacher) — may be unverified'
      WHEN using_expr ILIKE '%user_type%' AND using_expr ILIKE '%ANY%'
        THEN 'Broad user_type ANY(...) filter — check scope'
      ELSE NULL
    END AS issue
  FROM all_policies
)

-- ---- Output section 1: table RLS state ----
SELECT
  '1_TABLE_RLS' AS section,
  table_name,
  CASE WHEN rls_enabled THEN 'ON' ELSE '!!! OFF !!!' END AS rls,
  CASE WHEN rls_forced  THEN 'FORCED' ELSE '' END AS forced,
  policy_count::text AS policies,
  NULL::text AS detail_1,
  NULL::text AS detail_2
FROM table_rls

UNION ALL

-- ---- Output section 2: every policy ----
SELECT
  '2_POLICIES' AS section,
  table_name,
  policyname,
  cmd,
  roles,
  LEFT(using_expr, 500) AS detail_1,
  LEFT(check_expr, 500) AS detail_2
FROM all_policies

UNION ALL

-- ---- Output section 3: flagged policies only ----
SELECT
  '3_FLAGGED' AS section,
  table_name,
  policyname,
  cmd,
  issue,
  LEFT(using_expr, 500),
  LEFT(check_expr, 500)
FROM flagged
WHERE issue IS NOT NULL

ORDER BY 1, 2, 3;
