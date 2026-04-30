// Loader: fetches the merged Math curriculum graph and shapes it into the
// `DOMAINS` structure the prototype renderer expects.
//
// Source-of-truth is `data/compiled/math_merged.json` (see
// tools/build-math-merged.js). When other domains land we'll merge their
// JSONs into a manifest and load all of them here.
//
// Output shape (matches Trees/3D Skill Tree/data.js):
//   DOMAINS = [{
//     id, name, color, colorDark, icon,
//     skills: [{
//       id,            // canonical M-XXX (used everywhere internally)
//       name,
//       tier,          // 1..8 (master-only nodes derive from stage)
//       prereqs,       // array of M-XXX ids
//       crossDomain,   // [] for Math-only build (no other-domain data loaded)
//       prototype_id,  // prototype slug if available — for IXL/materials lookup
//       legacy_name,   // skill_progress.skill_name bridge
//       stage, path_type, cluster
//     }]
//   }]

const STAGE_TO_DEFAULT_TIER = {
  Foundations: 1,
  Fluency: 2,
  Application: 3,
  Integration: 4,
  Mastery: 5
};

const DOMAIN_META = {
  Math: { id: 'math', name: 'Mathematics', color: '#3B82F6', colorDark: '#1E40AF', icon: '∑' }
};

// Resolve the merged JSON relative to this module so the viewer works
// regardless of how it's iframed.
const url = new URL('../../data/compiled/math_merged.json', import.meta.url);
const res = await fetch(url);
if (!res.ok) throw new Error(`Failed to load merged graph: ${res.status} ${res.statusText}`);
const merged = await res.json();

// Index edges by `to` so we can build per-skill prereqs in one pass.
const prereqsByTo = new Map();
for (const e of merged.edges) {
  if (e.type !== 'prerequisite_hard') continue;
  if (!prereqsByTo.has(e.to)) prereqsByTo.set(e.to, []);
  prereqsByTo.get(e.to).push(e.from);
}

const meta = DOMAIN_META[merged.domain] || {
  id: merged.domain.toLowerCase(),
  name: merged.domain,
  color: '#888',
  colorDark: '#555',
  icon: '?'
};

const skills = merged.nodes.map(n => ({
  id: n.id,
  name: n.title,
  tier: n.tier ?? STAGE_TO_DEFAULT_TIER[n.stage] ?? 1,
  prereqs: prereqsByTo.get(n.id) || [],
  crossDomain: [],                      // populated when sibling-domain merges land
  prototype_id: n.prototype_id || null,
  legacy_name: n.legacy_name || n.title,
  stage: n.stage,
  path_type: n.path_type,
  cluster: n.cluster
}));

export const DOMAINS = [{
  ...meta,
  skills
}];

// Expose merged stats for the info panel / debug overlay.
export const MERGED_META = {
  generated_at: merged.generated_at,
  stats: merged.stats
};
