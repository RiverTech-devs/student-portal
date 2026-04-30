// Merge Math nodes + edges from data/compiled/master_graph.json (existing
// 206 nodes / 344 Math-touching edges) with Trees/3D Skill Tree/data.js
// (194 prototype Math skills with prereqs + crossDomain).
//
// Output:
//   data/compiled/math_merged.json   { domain, nodes[], edges[], stats }
//   tools/build-math-merged.report.md (review aid)
//
// Strategy
// --------
// IDENTITY: master M-XXX ids are the primary key. Matched prototype skills
//   adopt the master id; prototype-only skills mint new M-XXX ids
//   continuing from the highest existing M-NNN. Prototype slug is kept as
//   `prototype_id` for cross-reference.
// STAGE:   tier (1–8) is the new finer-grained axis; stage stays as the
//   coarse one. tier 1→Foundations, 2→Fluency, 3→Application,
//   4→Integration, 5–8→Mastery. On stage-drift the prototype tier wins.
// EDGES:   union of (master edges with from/to remapped) + (prototype
//   prereqs as prerequisite_hard) + (prototype crossDomain as
//   cross_domain). De-duped on (from,to,type).
// LEGACY:  legacy_name is preserved verbatim on matched/master-only nodes
//   so existing skill_progress rows keep working. Prototype-only nodes
//   use the prototype name as legacy_name.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');

globalThis.window = globalThis.window || globalThis;
const dataUrl = new URL('../Trees/3D Skill Tree/data.js', import.meta.url);
const { DOMAINS } = await import(dataUrl.href);

const master = JSON.parse(readFileSync(resolve(REPO, 'data/compiled/master_graph.json'), 'utf8'));
const edgesFile = JSON.parse(readFileSync(resolve(REPO, 'data/compiled/edges.json'), 'utf8'));

const TIER_TO_STAGE = {
  1: 'Foundations',
  2: 'Fluency',
  3: 'Application',
  4: 'Integration',
  5: 'Mastery',
  6: 'Mastery',
  7: 'Mastery',
  8: 'Mastery'
};

// Manual alias overrides: prototype slug -> existing master M-XXX id.
// Use when the prototype renames a concept that Dojo already writes to under
// the master's `legacy_name`. Critical for skill_progress continuity — every
// alias here must point at a node Dojo references.
const MATH_ALIASES = {
  counting: 'M-001',                          // "Counting and Number Recognition"
  place_value: 'M-007',                       // "Place Value Understanding"
  time_math: 'M-014',                         // "Time Telling"
  money_math: 'M-015',                        // "Money and Coins"
  fractions: 'M-029',                         // "Basic Fractions"
  measurement: 'M-038',                       // "Basic Measurement"
  prime_and_composite: 'M-045',               // "Prime and Composite"
  mean_median_mode: 'M-062',                  // "Mean Median Mode"
  variables_expr: 'M-066',                    // "Expressions with Variables"
  graphing: 'M-076',                          // "Basic Graphing"
  volume_cylinders_cones_spheres: 'M-084',    // "Volume of Cylinders Cones Spheres"
  basic_geometry: 'M-087',                    // "Basic Geometry Concepts"
  proofs: 'M-101',                            // "Proofs" (prototype calls them "Geometric Proofs")
  functions: 'M-123',                         // "Basic Functions"
  inverse_trig: 'M-154',                      // "Inverse Trig"
  applications: 'M-165',                      // "Applications"
  eigenvalues: 'M-179',                       // "Eigenvalues"
  investments_growth: 'M40'                   // "Investments & Growth"
};

const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// ---------- Inputs scoped to Math ----------
const protoMath = DOMAINS.find(d => d.id === 'math').skills;
const masterMath = master.nodes.filter(n => n.domain === 'Math');
const masterById = new Map(masterMath.map(n => [n.id, n]));
const masterByNorm = new Map(masterMath.map(n => [norm(n.title), n]));
const masterIds = new Set(masterMath.map(n => n.id));

// All master edges that touch Math (Math-internal OR Math↔other-domain).
const mathEdges = edgesFile.edges.filter(e => masterIds.has(e.from) || masterIds.has(e.to));

// ---------- Build merged node list ----------
let nextNum = Math.max(...masterMath
  .map(n => parseInt((n.id.match(/^M-(\d+)$/) || [])[1] || '0', 10))
  .filter(Number.isFinite)
);

const protoIdToMaster = new Map();          // prototype slug -> master M-XXX
const merged = new Map();                   // M-XXX -> merged node
const stageDrifts = [];

// 1. Seed with all master Math nodes (preserves master-only).
for (const n of masterMath) {
  merged.set(n.id, {
    id: n.id,
    title: n.title,
    domain: 'Math',
    tier: null,                       // filled if matched to prototype
    stage: n.stage,
    path_type: n.path_type,
    cluster: n.cluster,
    grade_band: n.grade_band || '',
    primary_path: n.primary_path,
    description: n.description || '',
    demonstration: n.demonstration || '',
    mastery_criteria: n.mastery_criteria || [],
    evidence_types: n.evidence_types || [],
    visual: n.visual || null,
    legacy_name: n.legacy_name || n.title,
    legacy_subject: n.legacy_subject || 'Math',
    csv_id: n.csv_id || null,
    prototype_id: null,
    sources: ['master']
  });
}

// 2. Merge prototype skills, matching by alias first, then normalized title.
const protoOnly = [];
for (const p of protoMath) {
  const aliasTarget = MATH_ALIASES[p.id];
  const m = (aliasTarget && masterById.get(aliasTarget)) || masterByNorm.get(norm(p.name));
  if (m) {
    protoIdToMaster.set(p.id, m.id);
    const node = merged.get(m.id);
    const expectedStage = TIER_TO_STAGE[p.tier];
    const drifted = expectedStage && expectedStage !== node.stage;
    if (drifted) {
      stageDrifts.push({
        id: m.id,
        title: m.title,
        master_stage: node.stage,
        prototype_tier: p.tier,
        new_stage: expectedStage
      });
    }
    node.tier = p.tier;
    if (drifted) node.stage = expectedStage;     // prototype tier wins
    node.prototype_id = p.id;
    node.sources.push('prototype');
  } else {
    nextNum += 1;
    const id = 'M-' + String(nextNum).padStart(3, '0');
    protoIdToMaster.set(p.id, id);
    merged.set(id, {
      id,
      title: p.name,
      domain: 'Math',
      tier: p.tier,
      stage: TIER_TO_STAGE[p.tier],
      path_type: 'Spine',                 // default; refine post-hoc
      cluster: 'Tier ' + p.tier,
      grade_band: '',
      primary_path: false,
      description: '',
      demonstration: '',
      mastery_criteria: [],
      evidence_types: [],
      visual: null,
      legacy_name: p.name,
      legacy_subject: 'Math',
      csv_id: null,
      prototype_id: p.id,
      sources: ['prototype']
    });
    protoOnly.push({ id, title: p.name, tier: p.tier });
  }
}

// ---------- Build merged edges ----------
const edgeKey = e => `${e.from}␟${e.to}␟${e.type}`;
const mergedEdges = new Map();
let nextEdgeNum = Math.max(...edgesFile.edges
  .map(e => parseInt((e.id.match(/^E(\d+)$/) || [])[1] || '0', 10))
  .filter(Number.isFinite)
);

const addEdge = (from, to, type, source) => {
  if (!from || !to || from === to) return;
  const k = `${from}␟${to}␟${type}`;
  if (mergedEdges.has(k)) {
    mergedEdges.get(k).sources.add(source);
    return;
  }
  nextEdgeNum += 1;
  mergedEdges.set(k, {
    id: 'E' + String(nextEdgeNum).padStart(4, '0'),
    from, to, type,
    sources: new Set([source])
  });
};

// 3. Preserve all master edges that touch Math.
for (const e of mathEdges) addEdge(e.from, e.to, e.type, 'master');

// 4. Convert prototype prereqs → prerequisite_hard edges.
for (const p of protoMath) {
  const toId = protoIdToMaster.get(p.id);
  for (const slug of (p.prereqs || [])) {
    const fromId = protoIdToMaster.get(slug);
    if (!fromId) continue;            // prereq points to unknown skill
    addEdge(fromId, toId, 'prerequisite_hard', 'prototype');
  }
  // crossDomain targets are "domain.skillId" — only resolve Math-side here;
  // cross-domain edges to other domains will be filled in by sibling merges.
  for (const cd of (p.crossDomain || [])) {
    const [otherDom, otherSlug] = (cd.target || '').split('.');
    if (otherDom === 'math') {
      const fromId = protoIdToMaster.get(otherSlug);
      if (fromId) addEdge(toId, fromId, 'cross_domain', 'prototype');
    }
    // Non-math cross-domain edges are deferred (no merged ids yet for other domains).
  }
}

// ---------- Stats ----------
const matchedCount = [...merged.values()].filter(n => n.sources.includes('master') && n.sources.includes('prototype')).length;
const masterOnlyCount = [...merged.values()].filter(n => n.sources.length === 1 && n.sources[0] === 'master').length;
const protoOnlyCount = [...merged.values()].filter(n => n.sources.length === 1 && n.sources[0] === 'prototype').length;

const edgeArr = [...mergedEdges.values()].map(e => ({
  id: e.id, from: e.from, to: e.to, type: e.type, sources: [...e.sources]
}));

const out = {
  domain: 'Math',
  generated_at: new Date().toISOString(),
  stats: {
    nodes_total: merged.size,
    matched: matchedCount,
    master_only: masterOnlyCount,
    prototype_only: protoOnlyCount,
    edges_total: edgeArr.length,
    stage_drifts_resolved: stageDrifts.length
  },
  nodes: [...merged.values()],
  edges: edgeArr
};

writeFileSync(resolve(REPO, 'data/compiled/math_merged.json'), JSON.stringify(out, null, 2));

// ---------- Markdown review ----------
const md = [];
md.push('# Math merge report\n');
md.push(`Generated: ${out.generated_at}\n`);
md.push('## Stats\n');
md.push(`- Total merged Math nodes: **${out.stats.nodes_total}** (${matchedCount} matched, ${masterOnlyCount} master-only, ${protoOnlyCount} prototype-only)`);
md.push(`- Total Math edges: **${edgeArr.length}**`);
md.push(`- Stage drifts auto-resolved (prototype tier wins): **${stageDrifts.length}**\n`);

md.push('## Stage drift resolutions\n');
md.push('Master had these at one stage; prototype tier maps them to a different stage. The merged graph uses the new stage. Spot-check anything counter-intuitive.\n');
md.push('| ID | Title | Was | Now (tier→stage) |');
md.push('|---|---|---|---|');
for (const d of stageDrifts) {
  md.push(`| ${d.id} | ${d.title} | ${d.master_stage} | ${d.new_stage} (tier ${d.prototype_tier}) |`);
}
md.push('');

md.push('## Master-only Math nodes (preserved)\n');
md.push('These exist in the existing graph and have no prototype counterpart by name. They are kept in the merged graph; review whether any should be folded into a prototype skill, renamed, or deprecated.\n');
md.push('| ID | Title | Stage | Cluster |');
md.push('|---|---|---|---|');
for (const n of [...merged.values()].filter(n => n.sources.length === 1 && n.sources[0] === 'master').sort((a,b)=>a.id.localeCompare(b.id))) {
  md.push(`| ${n.id} | ${n.title} | ${n.stage} | ${n.cluster} |`);
}
md.push('');

md.push('## Prototype-only Math nodes (newly added)\n');
md.push('Net-new content from the 3D prototype. Assigned fresh M-XXX ids; default path_type=Spine, cluster="Tier N" (refine later).\n');
md.push('| New ID | Title | Tier | Stage |');
md.push('|---|---|---:|---|');
for (const n of protoOnly.sort((a,b)=>a.tier-b.tier || a.title.localeCompare(b.title))) {
  md.push(`| ${n.id} | ${n.title} | ${n.tier} | ${TIER_TO_STAGE[n.tier]} |`);
}
md.push('');

writeFileSync(resolve(REPO, 'tools/build-math-merged.report.md'), md.join('\n'));

console.log('=== MATH MERGE ===');
console.log(`Nodes: ${out.stats.nodes_total} (matched ${matchedCount}, master-only ${masterOnlyCount}, prototype-only ${protoOnlyCount})`);
console.log(`Edges: ${edgeArr.length}`);
console.log(`Stage drifts resolved (prototype wins): ${stageDrifts.length}`);
console.log('Wrote data/compiled/math_merged.json + tools/build-math-merged.report.md');
