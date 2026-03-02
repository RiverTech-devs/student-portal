-- Add visibility column to school_documents
-- Values: 'all' (everyone), 'staff' (teachers + admins), 'admin' (admins only)

ALTER TABLE school_documents
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'all' CHECK (visibility IN ('all', 'staff', 'admin'));

-- Set existing published docs to 'all', unpublished to 'admin' (reasonable default)
UPDATE school_documents SET visibility = 'all' WHERE is_published = true;
UPDATE school_documents SET visibility = 'admin' WHERE is_published = false;

-- Add index for visibility filtering
CREATE INDEX IF NOT EXISTS idx_school_documents_visibility ON school_documents(visibility);

-- Drop old SELECT policies that only checked is_published
DROP POLICY IF EXISTS "Anyone can view published documents" ON school_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON school_documents;

-- New SELECT policy: visibility-aware access control
-- Admins see everything, teachers see 'all' + 'staff', students/parents see only 'all'
-- All still gated by is_published (drafts only visible to admins)
CREATE POLICY "Users can view documents matching their visibility level"
  ON school_documents FOR SELECT
  USING (
    CASE
      WHEN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'admin'
      ) THEN true
      WHEN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.user_type = 'teacher'
      ) THEN is_published = true AND visibility IN ('all', 'staff')
      ELSE is_published = true AND visibility = 'all'
    END
  );

COMMENT ON COLUMN school_documents.visibility IS 'Who can see this document: all (everyone), staff (teachers + admins), admin (admins only)';
