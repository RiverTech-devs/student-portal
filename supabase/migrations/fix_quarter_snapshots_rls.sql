-- Fix RLS policy on quarter_grade_snapshots to allow writes for non-archived quarters
-- The existing policy blocks all writes with "Quarter grade snapshots are read-only"

-- First, drop any existing restrictive policies or triggers
DROP TRIGGER IF EXISTS prevent_snapshot_modification ON quarter_grade_snapshots;
DROP TRIGGER IF EXISTS protect_snapshots ON quarter_grade_snapshots;
DROP FUNCTION IF EXISTS prevent_snapshot_modification() CASCADE;

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Quarter grade snapshots are read-only" ON quarter_grade_snapshots;
DROP POLICY IF EXISTS "snapshots_read_only" ON quarter_grade_snapshots;
DROP POLICY IF EXISTS "quarter_grade_snapshots_insert" ON quarter_grade_snapshots;
DROP POLICY IF EXISTS "quarter_grade_snapshots_update" ON quarter_grade_snapshots;
DROP POLICY IF EXISTS "quarter_grade_snapshots_select" ON quarter_grade_snapshots;

-- Enable RLS if not already
ALTER TABLE quarter_grade_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow SELECT for authenticated users (teachers can view grades)
CREATE POLICY "quarter_snapshots_select"
ON quarter_grade_snapshots
FOR SELECT
TO authenticated
USING (true);

-- Allow INSERT for authenticated users on non-archived quarters
CREATE POLICY "quarter_snapshots_insert"
ON quarter_grade_snapshots
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quarters q
    WHERE q.id = quarter_id
    AND q.is_archived = false
  )
);

-- Allow UPDATE for authenticated users on non-archived quarters
CREATE POLICY "quarter_snapshots_update"
ON quarter_grade_snapshots
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quarters q
    WHERE q.id = quarter_id
    AND q.is_archived = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quarters q
    WHERE q.id = quarter_id
    AND q.is_archived = false
  )
);

-- No DELETE allowed (grades should be preserved)
CREATE POLICY "quarter_snapshots_no_delete"
ON quarter_grade_snapshots
FOR DELETE
TO authenticated
USING (false);
