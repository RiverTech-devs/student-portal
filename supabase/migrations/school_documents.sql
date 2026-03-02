-- School Documents system
-- Global documents (handbook, policies, guides) visible to all users, editable by admins only

CREATE TABLE IF NOT EXISTS school_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_school_documents_published ON school_documents(is_published);
CREATE INDEX IF NOT EXISTS idx_school_documents_category ON school_documents(category);
CREATE INDEX IF NOT EXISTS idx_school_documents_slug ON school_documents(slug);

-- Row Level Security
ALTER TABLE school_documents ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read published documents
CREATE POLICY "Anyone can view published documents"
  ON school_documents FOR SELECT
  USING (is_published = true);

-- Admins can see all documents (including drafts)
CREATE POLICY "Admins can view all documents"
  ON school_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Only admins can insert
CREATE POLICY "Admins can insert documents"
  ON school_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Only admins can update
CREATE POLICY "Admins can update documents"
  ON school_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- Only admins can delete
CREATE POLICY "Admins can delete documents"
  ON school_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

COMMENT ON TABLE school_documents IS 'School-wide documents (handbooks, policies, guides) visible to all users';
COMMENT ON COLUMN school_documents.slug IS 'URL-friendly identifier (e.g. student-handbook)';
COMMENT ON COLUMN school_documents.content IS 'Rich HTML content from Quill editor';
COMMENT ON COLUMN school_documents.category IS 'Document category: general, handbook, policy, guide';
COMMENT ON COLUMN school_documents.is_published IS 'Only published documents are visible to non-admin users';
