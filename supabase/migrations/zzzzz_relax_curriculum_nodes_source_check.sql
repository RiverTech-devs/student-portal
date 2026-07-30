-- Relax curriculum_nodes.source check for the v2 graph seeds.
--
-- The original curriculum_graph_tables.sql constrained source to
-- ('existing','csv'). The v2 compilers (tools/compile-*-graph.js) emit
-- richer provenance: 'new', 'seeded_prototype', and 'split_from:<node_id>'
-- for nodes split out of a legacy node. Must run BEFORE any
-- zzzzzz_*_graph_v2_seed.sql (sorts earlier: 5 z's < 6 z's).

ALTER TABLE curriculum_nodes DROP CONSTRAINT IF EXISTS curriculum_nodes_source_check;
ALTER TABLE curriculum_nodes ADD CONSTRAINT curriculum_nodes_source_check
  CHECK (
    source IN ('existing', 'csv', 'new', 'seeded_prototype')
    OR source LIKE 'split_from:%'
  );
