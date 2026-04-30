// Reconcile the 3D Skill Tree prototype's data.js against data/compiled/master_graph.json.
// Match by (domain, normalized name). Report per-domain counts of:
//   - matched     : skills present in BOTH
//   - prototype_only : skills only in the new 3D data
//   - master_only    : skills only in the existing curriculum_nodes graph
// Also surfaces tier vs stage drift for matched nodes.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');

// ---------- 1. Load 3D prototype DOMAINS via dynamic import ----------
// data.js trails with `window.DOMAINS = DOMAINS;` — shim window for Node.
globalThis.window = globalThis.window || globalThis;
const dataUrl = new URL('../Trees/3D Skill Tree/data.js', import.meta.url);
const { DOMAINS } = await import(dataUrl.href);

// ---------- 2. Load master_graph.json ----------
const master = JSON.parse(
  readFileSync(resolve(REPO, 'data/compiled/master_graph.json'), 'utf8')
);

// ---------- 3. Domain ID mapping (prototype id -> master domain name) ----------
// Prototype uses short ids ("math", "lang", "tech", "creative", "science",
// "social", "life", "physical", "bible"). Master uses full names.
const PROTO_TO_MASTER_DOMAIN = {
  math: 'Math',
  lang: 'Language',
  tech: 'Technology',
  creative: 'Creative',
  science: 'Science',
  social: 'Social',
  life: 'LifeSkills',
  fitness: 'Physical',
  religion: 'Bible'
};

// Try to also accept variants the master file actually uses.
const masterDomainsActual = new Set(master.nodes.map(n => n.domain));

// ---------- 4. Normalization ----------
const norm = s => (s || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

// ---------- 5. Build maps ----------
const protoByDomain = new Map();
let protoTotal = 0;
for (const dom of DOMAINS) {
  const masterDom = PROTO_TO_MASTER_DOMAIN[dom.id] || dom.id;
  if (!protoByDomain.has(masterDom)) protoByDomain.set(masterDom, new Map());
  for (const skill of dom.skills) {
    protoTotal++;
    protoByDomain.get(masterDom).set(norm(skill.name), {
      id: skill.id,
      name: skill.name,
      tier: skill.tier,
      prereqs: skill.prereqs || [],
      crossDomain: skill.crossDomain || []
    });
  }
}

const masterByDomain = new Map();
for (const node of master.nodes) {
  if (!masterByDomain.has(node.domain)) masterByDomain.set(node.domain, new Map());
  masterByDomain.get(node.domain).set(norm(node.title), {
    id: node.id,
    title: node.title,
    path_type: node.path_type,
    stage: node.stage,
    cluster: node.cluster,
    csv_id: node.csv_id
  });
}

// ---------- 6. Compare ----------
const allDomains = new Set([
  ...protoByDomain.keys(),
  ...masterByDomain.keys()
]);

const TIER_TO_STAGE = {
  1: 'Foundations',
  2: 'Fluency',
  3: 'Application',
  4: 'Integration'
};

const report = {
  summary: {
    prototype_total: protoTotal,
    master_total: master.nodes.length,
    domains: []
  },
  per_domain: {}
};

let matchedTotal = 0, protoOnlyTotal = 0, masterOnlyTotal = 0, stageDrift = 0;

for (const dom of [...allDomains].sort()) {
  const proto = protoByDomain.get(dom) || new Map();
  const masterMap = masterByDomain.get(dom) || new Map();

  const matched = [];
  const protoOnly = [];
  const masterOnly = [];

  for (const [key, p] of proto) {
    if (masterMap.has(key)) {
      const m = masterMap.get(key);
      const expectedStage = TIER_TO_STAGE[p.tier];
      const drift = expectedStage && expectedStage !== m.stage;
      if (drift) stageDrift++;
      matched.push({
        name: p.name,
        proto_id: p.id,
        master_id: m.id,
        proto_tier: p.tier,
        master_stage: m.stage,
        stage_drift: drift ? `tier ${p.tier} (${expectedStage}) vs ${m.stage}` : null
      });
    } else {
      protoOnly.push({ name: p.name, proto_id: p.id, tier: p.tier });
    }
  }

  for (const [key, m] of masterMap) {
    if (!proto.has(key)) {
      masterOnly.push({ title: m.title, master_id: m.id, stage: m.stage, path_type: m.path_type });
    }
  }

  report.per_domain[dom] = {
    counts: {
      matched: matched.length,
      prototype_only: protoOnly.length,
      master_only: masterOnly.length
    },
    matched,
    prototype_only: protoOnly,
    master_only: masterOnly
  };
  report.summary.domains.push({
    domain: dom,
    matched: matched.length,
    prototype_only: protoOnly.length,
    master_only: masterOnly.length
  });
  matchedTotal += matched.length;
  protoOnlyTotal += protoOnly.length;
  masterOnlyTotal += masterOnly.length;
}

report.summary.matched_total = matchedTotal;
report.summary.prototype_only_total = protoOnlyTotal;
report.summary.master_only_total = masterOnlyTotal;
report.summary.stage_drift_count = stageDrift;
report.summary.master_domains_actual = [...masterDomainsActual];

writeFileSync(
  resolve(REPO, 'tools/reconcile-3d-vs-master.report.json'),
  JSON.stringify(report, null, 2)
);

// ---------- Markdown summary (per-domain, just names) ----------
const md = [];
md.push('# 3D Prototype vs master_graph reconciliation\n');
md.push(`Source: \`Trees/3D Skill Tree/data.js\` (${protoTotal} skills) vs \`data/compiled/master_graph.json\` (${master.nodes.length} nodes).\n`);
md.push('Match key: normalized title within domain (lowercase, alphanumeric only).\n');
md.push('## Headline counts\n');
md.push('| Domain | Matched | Prototype-only (new) | Master-only (would lose) |');
md.push('|---|---:|---:|---:|');
for (const row of report.summary.domains) {
  md.push(`| ${row.domain} | ${row.matched} | ${row.prototype_only} | ${row.master_only} |`);
}
md.push(`| **TOTAL** | **${matchedTotal}** | **${protoOnlyTotal}** | **${masterOnlyTotal}** |\n`);
md.push(`Stage drift (prototype tier → expected stage ≠ master stage): **${stageDrift}** matched nodes.\n`);

md.push('## Stage drift on matched nodes\n');
md.push('Tier→Stage map: 1=Foundations, 2=Fluency, 3=Application, 4=Integration. Prototype goes higher (5–8) — those expand "Mastery".\n');
const drifts = [];
for (const dom of Object.keys(report.per_domain)) {
  for (const m of report.per_domain[dom].matched) {
    if (m.stage_drift) drifts.push({ domain: dom, ...m });
  }
}
md.push('| Domain | Skill | Prototype tier | Master stage |');
md.push('|---|---|---:|---|');
for (const d of drifts.slice(0, 50)) {
  md.push(`| ${d.domain} | ${d.name} | ${d.proto_tier} | ${d.master_stage} |`);
}
if (drifts.length > 50) md.push(`| … | ${drifts.length - 50} more — see report.json | | |`);
md.push('');

md.push('## Master-only skills (orphaned if prototype becomes source of truth)\n');
for (const dom of Object.keys(report.per_domain)) {
  const items = report.per_domain[dom].master_only;
  if (items.length === 0) continue;
  md.push(`### ${dom} (${items.length})\n`);
  for (const m of items) {
    md.push(`- \`${m.master_id}\` ${m.title} — ${m.stage} / ${m.path_type}`);
  }
  md.push('');
}

md.push('## Prototype-only skills (would be added if we adopt the new data)\n');
for (const dom of Object.keys(report.per_domain)) {
  const items = report.per_domain[dom].prototype_only;
  if (items.length === 0) continue;
  md.push(`### ${dom} (${items.length})\n`);
  for (const p of items) {
    md.push(`- \`${p.proto_id}\` ${p.name} — tier ${p.tier}`);
  }
  md.push('');
}

writeFileSync(
  resolve(REPO, 'tools/reconcile-3d-vs-master.report.md'),
  md.join('\n')
);

// ---------- 7. Console summary ----------
console.log('\n=== RECONCILIATION SUMMARY ===');
console.log(`Prototype total skills: ${protoTotal}`);
console.log(`Master total nodes:     ${master.nodes.length}`);
console.log(`Master domains found:   ${[...masterDomainsActual].join(', ')}`);
console.log('');
console.log('Per-domain (matched / proto-only / master-only):');
for (const row of report.summary.domains) {
  console.log(
    `  ${row.domain.padEnd(16)} ${String(row.matched).padStart(4)} / ` +
    `${String(row.prototype_only).padStart(4)} / ` +
    `${String(row.master_only).padStart(4)}`
  );
}
console.log('');
console.log(`Total matched:            ${matchedTotal}`);
console.log(`Prototype-only (new):     ${protoOnlyTotal}`);
console.log(`Master-only (would lose): ${masterOnlyTotal}`);
console.log(`Stage drift (tier vs existing stage): ${stageDrift}`);
console.log('\nFull report written to tools/reconcile-3d-vs-master.report.json');
