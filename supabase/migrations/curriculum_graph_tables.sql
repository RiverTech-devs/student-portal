-- Curriculum Graph Tables
-- These are NEW tables that power the unified graph engine.
-- They do NOT modify the existing skill_progress table or any other existing tables.
-- The skill_progress table continues to work exactly as before.

-- ============================================================
-- Table: curriculum_nodes
-- Stores all curriculum stepping stones (skills) across all domains
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_nodes (
  id TEXT PRIMARY KEY,                          -- e.g. "M-001", "B1", "T-SD005"
  title TEXT NOT NULL,                          -- Human-readable skill name
  domain TEXT NOT NULL,                         -- Bible, Creative, Language, LifeSkills, Math, Physical, Science, Social, Technology
  path_type TEXT NOT NULL DEFAULT 'Spine'       -- Spine (core), Branch (optional), Leaf (capstone)
    CHECK (path_type IN ('Spine', 'Branch', 'Leaf')),
  stage TEXT NOT NULL DEFAULT 'Foundations'      -- Foundations, Fluency, Application, Integration, Mastery
    CHECK (stage IN ('Foundations', 'Fluency', 'Application', 'Integration', 'Mastery')),
  grade_band TEXT DEFAULT ''                    -- K-2, 3-5, 6-8, 9-10, 11-12 (dual tagging, filled later)
    CHECK (grade_band IN ('', 'K-2', '3-5', '6-8', '9-10', '11-12')),
  primary_path BOOLEAN DEFAULT true,            -- Whether this is on the main progression track
  cluster TEXT NOT NULL DEFAULT 'General',       -- Visual grouping name
  description TEXT DEFAULT '',                  -- Detailed description
  demonstration TEXT DEFAULT '',                -- Observable mastery statement
  mastery_criteria JSONB DEFAULT '[]',          -- Array of mastery criteria strings
  evidence_types TEXT[] DEFAULT '{}',           -- quiz, project, observation, oral, etc.
  visual JSONB NOT NULL DEFAULT '{}',           -- {x, y, z_group, color_cluster}
  legacy_name TEXT,                             -- Original skill name from SkillTreeViewer (bridge field)
  legacy_subject TEXT,                          -- Original subject name: Art, Math, Reading, etc.
  csv_id TEXT,                                  -- Original CSV ID if mapped from master_tree.csv
  source TEXT DEFAULT 'csv'                     -- 'existing' or 'csv' — where the node came from
    CHECK (source IN ('existing', 'csv')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_curriculum_nodes_domain ON curriculum_nodes(domain);
CREATE INDEX IF NOT EXISTS idx_curriculum_nodes_stage ON curriculum_nodes(stage);
CREATE INDEX IF NOT EXISTS idx_curriculum_nodes_cluster ON curriculum_nodes(cluster);
CREATE INDEX IF NOT EXISTS idx_curriculum_nodes_legacy ON curriculum_nodes(legacy_subject, legacy_name);
CREATE INDEX IF NOT EXISTS idx_curriculum_nodes_path_type ON curriculum_nodes(path_type);

-- ============================================================
-- Table: curriculum_edges
-- Stores all dependency relationships between nodes
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_edges (
  id TEXT PRIMARY KEY,                          -- e.g. "E0001"
  from_node TEXT NOT NULL REFERENCES curriculum_nodes(id) ON DELETE CASCADE,
  to_node TEXT NOT NULL REFERENCES curriculum_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL DEFAULT 'prerequisite_hard'
    CHECK (edge_type IN (
      'prerequisite_hard',   -- Must be met to unlock
      'prerequisite_soft',   -- Improves readiness, doesn't block
      'leads_to',            -- This node feeds into the target
      'cross_domain',        -- Cross-subject connection
      'co_requisite',        -- Should be taken together
      'reinforces',          -- Strengthens understanding
      'transfers_to',        -- Skills transfer across domains
      'remediation_for',     -- Helps if struggling with target
      'capstone_dependency'  -- Required for capstone/leaf node
    )),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_node, to_node, edge_type)
);

-- Indexes for traversal queries
CREATE INDEX IF NOT EXISTS idx_curriculum_edges_from ON curriculum_edges(from_node);
CREATE INDEX IF NOT EXISTS idx_curriculum_edges_to ON curriculum_edges(to_node);
CREATE INDEX IF NOT EXISTS idx_curriculum_edges_type ON curriculum_edges(edge_type);

-- ============================================================
-- Table: curriculum_clusters
-- Visual grouping metadata for constellation rendering
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_clusters (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#888888',
  label_position JSONB,                         -- {x, y} for cluster label
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_clusters_domain ON curriculum_clusters(domain);

-- ============================================================
-- RLS Policies
-- Curriculum data is READ-ONLY for everyone, WRITE for admins only.
-- This means students/teachers can browse the curriculum graph,
-- but only admins can modify it (via the authoring pipeline).
-- ============================================================

ALTER TABLE curriculum_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_clusters ENABLE ROW LEVEL SECURITY;

-- Public read for all authenticated users
CREATE POLICY "Anyone can view curriculum nodes"
  ON curriculum_nodes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view curriculum edges"
  ON curriculum_edges FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view curriculum clusters"
  ON curriculum_clusters FOR SELECT
  USING (true);

-- Admin write
CREATE POLICY "Admins can manage curriculum nodes"
  ON curriculum_nodes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage curriculum edges"
  ON curriculum_edges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage curriculum clusters"
  ON curriculum_clusters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- Helper view: Map legacy skill names to new node IDs
-- This lets us bridge existing skill_progress records to the new graph
-- without modifying the skill_progress table at all.
-- ============================================================
CREATE OR REPLACE VIEW skill_progress_with_graph AS
SELECT
  sp.*,
  cn.id as node_id,
  cn.domain as graph_domain,
  cn.path_type,
  cn.stage,
  cn.demonstration,
  cn.cluster
FROM skill_progress sp
LEFT JOIN curriculum_nodes cn
  ON cn.legacy_subject = sp.subject
  AND cn.legacy_name = sp.skill_name;

COMMENT ON VIEW skill_progress_with_graph IS
  'Bridges existing skill_progress records to curriculum_nodes via legacy_subject + legacy_name. '
  'Does NOT modify skill_progress — it is a read-only view.';
