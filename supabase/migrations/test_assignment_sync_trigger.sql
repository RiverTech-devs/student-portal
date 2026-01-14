-- Trigger to deactivate test_assignments when linked assignment is deleted
-- This keeps the Testing Center in sync when assignments are deleted from the gradebook

-- Function to deactivate test_assignments when their linked assignment is deleted
CREATE OR REPLACE FUNCTION deactivate_test_assignments_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mark test_assignments as inactive when their linked assignment is deleted
    UPDATE test_assignments
    SET is_active = false
    WHERE linked_assignment_id = OLD.id;

    RETURN OLD;
END;
$$;

-- Trigger that runs before an assignment is deleted
DROP TRIGGER IF EXISTS deactivate_test_assignments_trigger ON assignments;
CREATE TRIGGER deactivate_test_assignments_trigger
    BEFORE DELETE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION deactivate_test_assignments_on_delete();

-- Also update any existing orphaned test_assignments (where linked_assignment_id is NULL but is_active is true)
-- This cleans up any existing orphans
UPDATE test_assignments
SET is_active = false
WHERE linked_assignment_id IS NULL
  AND is_active = true;
