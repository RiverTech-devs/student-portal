-- Add per-assignment max submission file size (in MB)
-- Defaults to 10MB if not set
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_submit_size_mb INTEGER DEFAULT 10;

-- Add a comment for documentation
COMMENT ON COLUMN assignments.max_submit_size_mb IS 'Maximum file upload size in MB for this assignment. Defaults to 10MB.';
