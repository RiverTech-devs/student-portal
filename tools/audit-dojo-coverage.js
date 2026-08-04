// End-to-end coverage audit for games/math-dojo.html.
//
// Why this exists alongside audit-generators.js: that script evaluates ONLY the
// `const generators = {...}` literal. The game also registers skills at load
// time through `_addSkill(tier, name, primaryTitle, difficulty, lesson, gen)`
// inside the "V2 NEW-SKILL CONTENT" block. Auditing just the literal reports a
// healthy 199/199 while the V2 block is broken — which is precisely how ~3,985
// lines of it sat outside the document, unexecuted, without any test noticing.
//
// This harness evaluates the four literals AND the V2 block in the same order
// the browser does, then reports what is actually playable.
//
// Checks, per skill that ends up registered:
//   1. has both a generator and a lesson
//   2. generator runs without throwing, over many seeds
//   3. returns question / answer / explanation, answer not NaN or empty
//   4. options (when present) contain the answer and have no duplicates
//   5. no literal ${...} left in any string field
//   6. output actually varies
// Plus, across the whole game:
//   7. every TIERS domain resolves to a generator and a lesson
//   8. no skill is registered under two different names for one graph node
//   9. no skill lists a hard prerequisite taught at a higher tier
//
// Usage: node tools/audit-dojo-coverage.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'games/math-dojo.html'), 'utf8');
const graph = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/math_curriculum_v2.json'), 'utf8'));

// ---- brace matcher that understands strings, template literals and comments ----
function findMatchingBrace(text, openIdx) {
  if (text[openIdx] !== '{') return -1;
  const stack = [{ mode: 'code', depth: 1 }];
  let i = openIdx + 1;
  while (i < text.length && stack.length > 0) {
    const top = stack[stack.length - 1];
    const c = text[i], n = text[i + 1];
    if (top.mode === 'code') {
      if (c === '/' && n === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
      if (c === '/' && n === '*') { i += 2; while (i < text.length - 1 && !(text[i] === '*' && text[i + 1] === '/')) i++; i += 2; continue; }
      if (c === '"') { stack.push({ mode: 'dq' }); i++; continue; }
      if (c === "'") { stack.push({ mode: 'sq' }); i++; continue; }
      if (c === '`') { stack.push({ mode: 'tpl' }); i++; continue; }
      if (c === '{') { top.depth++; i++; continue; }
      if (c === '}') { top.depth--; i++; if (top.depth === 0) { stack.pop(); if (!stack.length) return i - 1; } continue; }
      i++; continue;
    }
    if (top.mode === 'dq') { if (c === '\\') { i += 2; continue; } if (c === '"') { stack.pop(); } i++; continue; }
    if (top.mode === 'sq') { if (c === '\\') { i += 2; continue; } if (c === "'") { stack.pop(); } i++; continue; }
    if (top.mode === 'tpl') {
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { stack.pop(); i++; continue; }
      if (c === '$' && n === '{') { stack.push({ mode: 'code', depth: 1 }); i += 2; continue; }
      i++; continue;
    }
  }
  return -1;
}

function literal(decl) {
  const d = src.indexOf(decl);
  if (d < 0) throw new Error(`${decl} not found`);
  const o = src.indexOf('{', d);
  return src.slice(o, findMatchingBrace(src, o) + 1);
}

// ---- the V2 block, and whether it is actually inside the document ----
const V2_START = src.indexOf('// ===== V2 NEW-SKILL CONTENT');
const V2_END = src.lastIndexOf('// ===== end V2 NEW-SKILL CONTENT =====');
const problems = [];
let v2 = '';
if (V2_START < 0) {
  problems.push('FATAL: V2 NEW-SKILL CONTENT block not found at all');
} else {
  v2 = src.slice(V2_START, V2_END + '// ===== end V2 NEW-SKILL CONTENT ====='.length);
  // It must sit before </body>, inside a <script>. This is the regression that bit.
  const closeBody = src.lastIndexOf('</body>');
  if (V2_START > closeBody) {
    problems.push('FATAL: V2 block is after </body> — it will never execute');
  }
  const before = src.slice(0, V2_START);
  const opens = (before.match(/<script[\s>]/g) || []).length;
  const closes = (before.match(/<\/script>/g) || []).length;
  if (opens <= closes) {
    problems.push('FATAL: V2 block is not inside a <script> tag — it will never execute');
  }
}

// ---- stubs mirroring the page's helpers ----
let seed = 1;
function seeded() {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const sandbox = {
  Math: Object.create(Math),
  JSON, String, Number, Array, Object, isNaN, parseInt, parseFloat, console,
  rand: (a, b) => { if (b === undefined) { b = a; a = 0; } return Math.floor(seeded() * (b - a + 1)) + a; },
  shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(seeded() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  gcd: (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; },
  state: { completedSubSkills: {}, history: [], mode: 'arcade', currentTier: 5 },
};
sandbox.Math.random = seeded;
sandbox.pick = (a) => a[sandbox.rand(0, a.length - 1)];
// Page-level helpers the literal generators close over (games/math-dojo.html).
// Leaving one out shows up as a bogus "generator threw" for every skill using it.
sandbox.cap = (s) => String(s).length === 0 ? s : String(s).charAt(0).toUpperCase() + String(s).slice(1);
sandbox.simplifyFrac = (n, d) => { const g = sandbox.gcd(Math.abs(n), Math.abs(d)); return [n / g, d / g]; };
sandbox.getUnlockedSubSkillTypes = (lessonKey, map, ordered) => {
  const first = map[ordered[0]];
  return Array.isArray(first) ? first.slice() : (first ? [first] : []);
};
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);
try {
  vm.runInContext(
    `const TIERS = ${literal('const TIERS = {')};\n` +
    `const Q_MATRIX = ${literal('const Q_MATRIX = {')};\n` +
    `const generators = ${literal('const generators = {')};\n` +
    `const lessons = ${literal('const lessons = {')};\n` +
    `globalThis.TIERS = TIERS; globalThis.Q_MATRIX = Q_MATRIX;\n` +
    `globalThis.generators = generators; globalThis.lessons = lessons;\n`,
    ctx, { filename: 'math-dojo-literals.js' });
} catch (e) {
  console.error('FAILED to evaluate literals:', e.message);
  process.exit(1);
}

const beforeCount = Object.values(ctx.TIERS).reduce((n, t) => n + t.domains.length, 0);
if (v2 && !problems.some(p => p.startsWith('FATAL'))) {
  try {
    vm.runInContext(v2, ctx, { filename: 'math-dojo-v2.js' });
  } catch (e) {
    problems.push(`FATAL: V2 block threw at load: ${e.message}`);
  }
}
const afterCount = Object.values(ctx.TIERS).reduce((n, t) => n + t.domains.length, 0);

console.log(`TIERS placements: ${beforeCount} from the literal, `
  + `+${afterCount - beforeCount} from the V2 block = ${afterCount}`);

// ---- coverage ----
const placements = [];
for (const [tier, t] of Object.entries(ctx.TIERS)) {
  for (const name of t.domains) placements.push({ tier: Number(tier), name });
}
const distinct = new Set(placements.map(p => p.name));
console.log(`distinct playable skills: ${distinct.size}`);

for (const { tier, name } of placements) {
  const hasGen = ctx.generators[tier] && typeof ctx.generators[tier][name] === 'function';
  const hasLes = ctx.lessons[tier] && ctx.lessons[tier][name];
  if (!hasGen) problems.push(`T${tier} ${name}: listed in TIERS but has NO generator`);
  if (!hasLes) problems.push(`T${tier} ${name}: listed in TIERS but has NO lesson`);
}

// ---- graph reconciliation ----
const byName = new Map();
const byId = new Map();
for (const n of graph.nodes) {
  byId.set(n.id, n);
  byName.set(n.dojo_skill || n.title, n);
}
const titleOnly = new Map();
for (const n of graph.nodes) {
  if (n.dojo_skill && n.title !== n.dojo_skill) titleOnly.set(n.title, n);
}
for (const name of distinct) {
  if (!byName.has(name)) {
    const t = titleOnly.get(name);
    problems.push(t
      ? `"${name}" is registered under the graph TITLE; canonical dojo_skill is "${t.dojo_skill}" (${t.id}) — duplicate concept`
      : `"${name}" is playable but matches no graph node`);
  }
}
const notPlayable = [...byName.keys()].filter(n => !distinct.has(n));
if (notPlayable.length) {
  problems.push(`${notPlayable.length} graph skills have no playable content: `
    + notPlayable.sort().join(', '));
}

// tier of each skill in the game = lowest tier it is introduced at
const gameTier = new Map();
for (const { tier, name } of placements) {
  if (!gameTier.has(name) || tier < gameTier.get(name)) gameTier.set(name, tier);
}
for (const n of graph.nodes) {
  const nm = n.dojo_skill || n.title;
  const gt = gameTier.get(nm);
  if (gt === undefined) continue;
  if (gt !== n.dojo_tier) {
    problems.push(`tier mismatch: ${nm} introduced at T${gt} in the game, dojo_tier=${n.dojo_tier} in the graph`);
  }
  for (const p of n.hard_prereqs || []) {
    const pn = byId.get(p);
    if (!pn) continue;
    const pt = gameTier.get(pn.dojo_skill || pn.title);
    if (pt !== undefined && pt > gt) {
      problems.push(`unsatisfiable prerequisite: ${nm} (T${gt}) requires ${pn.dojo_skill || pn.title} (T${pt})`);
    }
  }
}

// ---- run every generator ----
const ITER = 40;
let ran = 0;
for (const { tier, name } of placements) {
  const fn = ctx.generators[tier] && ctx.generators[tier][name];
  if (typeof fn !== 'function') continue;
  ran++;
  const seen = new Set();
  for (let i = 0; i < ITER; i++) {
    seed = (tier * 10007 + i * 37 + name.length * 13) | 0;
    let q;
    try {
      q = fn();
    } catch (e) {
      problems.push(`T${tier} ${name}: generator threw — ${e.message}`);
      break;
    }
    if (!q || typeof q !== 'object') { problems.push(`T${tier} ${name}: did not return an object`); break; }
    for (const f of ['question', 'answer', 'explanation']) {
      if (q[f] === undefined || q[f] === null || q[f] === '') {
        problems.push(`T${tier} ${name}: missing/empty ${f}`);
      }
    }
    if (typeof q.answer === 'number' && isNaN(q.answer)) problems.push(`T${tier} ${name}: answer is NaN`);
    const walk = (o, p) => {
      if (typeof o === 'string') { if (/\$\{[^}]+\}/.test(o)) problems.push(`T${tier} ${name}: unresolved template in ${p} — ${o.slice(0, 60)}`); return; }
      if (Array.isArray(o)) return o.forEach((v, k) => walk(v, `${p}[${k}]`));
      if (o && typeof o === 'object') for (const k of Object.keys(o)) walk(o[k], `${p}.${k}`);
    };
    walk(q, 'gen');
    if (Array.isArray(q.options)) {
      const norm = x => String(x).trim().toLowerCase();
      const opts = q.options.map(norm);
      if (!opts.includes(norm(q.answer))) problems.push(`T${tier} ${name}: options omit the answer "${q.answer}"`);
      if (new Set(opts).size !== opts.length) problems.push(`T${tier} ${name}: options contain duplicates`);
    }
    if (q.question) seen.add(q.question);
  }
  if (seen.size === 1) problems.push(`T${tier} ${name}: always produces the same question`);
}
console.log(`generators executed: ${ran} × ${ITER} samples`);

// ---- report ----
const uniq = [...new Set(problems)];
const fatal = uniq.filter(p => p.startsWith('FATAL'));
console.log(`\n=== ${uniq.length} problem(s) ===`);
for (const p of uniq) console.log('  ' + p);
if (!uniq.length) console.log('  none — every playable skill has a lesson, a working generator, '
  + 'a matching graph node and a satisfiable prerequisite chain.');
process.exit(fatal.length || uniq.length ? 1 : 0);
