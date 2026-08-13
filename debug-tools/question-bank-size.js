// Question-bank size gate for games/math-dojo.html.
//
// A skill is mastered with 5 correct in a row. If the generator can only ever
// produce a handful of distinct questions, "mastered" certifies that the
// student memorised those questions — and it still awards RTC and flips the
// skill graph. Area Between Curves shipped with a bank of THREE: the same two
// curves every time, with the upper limit drawn from {4, 6}.
//
// renderPracticePhase already knows: "Many generators have fixed pools of 3-10
// items; forcing 'never seen' eventually exhausts the pool and every retry
// lands on a repeat anyway." That comment treats a curriculum problem as a UI
// one. This harness makes the curriculum problem visible and keeps it fixed.
//
// Counts DISTINCT question+answer pairs over many draws, per skill.
//
// Usage:  node debug-tools/question-bank-size.js [--floor N] [--tier N] [--all]
// Exits non-zero if any tier-5+ skill is under the floor.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'games/math-dojo.html'), 'utf8');
const argv = process.argv.slice(2);
const argOf = (flag, dflt) => { const i = argv.indexOf(flag); return i >= 0 ? Number(argv[i + 1]) : dflt; };
const FLOOR = argOf('--floor', 30);
const ONLY_TIER = argOf('--tier', 0);
const SHOW_ALL = argv.includes('--all');
const DRAWS = argOf('--draws', 4000);

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
    if (top.mode === 'dq') { if (c === '\\') { i += 2; continue; } if (c === '"') stack.pop(); i++; continue; }
    if (top.mode === 'sq') { if (c === '\\') { i += 2; continue; } if (c === "'") stack.pop(); i++; continue; }
    if (top.mode === 'tpl') {
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { stack.pop(); i++; continue; }
      if (c === '$' && n === '{') { stack.push({ mode: 'code', depth: 1 }); i += 2; continue; }
      i++; continue;
    }
  }
  return -1;
}
function literal(decl) { const d = src.indexOf(decl); if (d < 0) throw new Error(`${decl} not found`); const o = src.indexOf('{', d); return src.slice(o, findMatchingBrace(src, o) + 1); }
const V2 = src.slice(src.indexOf('// ===== V2 NEW-SKILL CONTENT'),
  src.lastIndexOf('// ===== end V2 NEW-SKILL CONTENT =====') + '// ===== end V2 NEW-SKILL CONTENT ====='.length);

let seed = 1;
function seeded() {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const optKey = v => String(v).trim().toLowerCase();
function answerValue(str) {
  const t = String(str).trim();
  const f = t.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (f) return parseFloat(f[1]) / parseFloat(f[2]);
  if (/^-?\d+(?:\.\d+)?$/.test(t)) return parseFloat(t);
  return NaN;
}
function backfillOptions(answer, opts, seen, want = 4) {
  const target = answerValue(answer);
  const tryPush = cand => {
    if (opts.length >= want) return;
    const k = optKey(cand);
    if (k === '' || seen.has(k)) return;
    const cv = answerValue(cand);
    if (!isNaN(target) && !isNaN(cv) && Math.abs(cv - target) < 1e-9) return;
    seen.add(k); opts.push(cand);
  };
  if (typeof answer === 'number' && isFinite(answer)) {
    const step = Math.max(1, Math.round(Math.abs(answer) * 0.1));
    for (let m = 1; opts.length < want && m <= 12; m++) {
      tryPush(parseFloat((answer + m * step).toFixed(4)));
      tryPush(parseFloat((answer - m * step).toFixed(4)));
    }
    return opts;
  }
  const s = String(answer);
  const nums = [...s.matchAll(/-?\d+(?:\.\d+)?/g)];
  if (!nums.length) return opts;
  for (const d of [1, -1, 2, -2, 3, -3, 5, -5, 10, -10]) {
    for (let i = 0; i < nums.length && opts.length < want; i++) {
      const m = nums[i];
      const v = parseFloat(m[0]);
      const nv = parseFloat((v + d).toFixed(4));
      if (nv === v) continue;
      tryPush(s.slice(0, m.index) + nv + s.slice(m.index + m[0].length));
    }
    if (opts.length >= want) break;
  }
  return opts;
}
function uniqOpts(cands) {
  const arr = Array.isArray(cands) ? cands.slice() : [cands];
  const seen = new Set(); const out = [];
  for (const c of arr) { const k = optKey(c); if (k === '' || seen.has(k)) continue; seen.add(k); out.push(c); }
  return out;
}

const sandbox = {
  Math: Object.create(Math), JSON, String, Number, Array, Object, RegExp,
  isNaN, parseInt, parseFloat, console,
  rand: (a, b) => { if (b === undefined) { b = a; a = 0; } return Math.floor(seeded() * (b - a + 1)) + a; },
  shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(seeded() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  gcd: (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; },
  state: { completedSubSkills: {}, history: [], mode: 'arcade', currentTier: 5 },
};
sandbox.Math.random = seeded;
sandbox.pick = a => a[sandbox.rand(0, a.length - 1)];
sandbox.cap = s => String(s).length === 0 ? s : String(s).charAt(0).toUpperCase() + String(s).slice(1);
sandbox.answerValue = answerValue;
sandbox.backfillOptions = backfillOptions;
sandbox.uniqOpts = uniqOpts;
sandbox.simplifyFrac = (n, d) => { const g = sandbox.gcd(Math.abs(n), Math.abs(d)); return [n / g, d / g]; };
// Expose the whole generator surface: bank size is a property of the skill,
// not of how far one student has progressed through its sub-skills.
sandbox.getUnlockedSubSkillTypes = (k, map, ord) => {
  const out = [];
  for (const id of ord) { const v = map[id]; if (Array.isArray(v)) out.push(...v); else if (v) out.push(v); }
  return out;
};
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);
vm.runInContext(
  `const TIERS = ${literal('const TIERS = {')};\n` +
  `const Q_MATRIX = ${literal('const Q_MATRIX = {')};\n` +
  `const generators = ${literal('const generators = {')};\n` +
  `const lessons = ${literal('const lessons = {')};\n` +
  `globalThis.TIERS = TIERS; globalThis.Q_MATRIX = Q_MATRIX;\n` +
  `globalThis.generators = generators; globalThis.lessons = lessons;\n`,
  ctx, { filename: 'literals.js' });
vm.runInContext(V2, ctx, { filename: 'v2.js' });

const strip = h => String(h == null ? '' : h).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const rows = [];
for (const [ts, t] of Object.entries(ctx.TIERS)) {
  const tier = Number(ts);
  if (tier < 5) continue;
  if (ONLY_TIER && tier !== ONLY_TIER) continue;
  for (const name of t.domains) {
    const gf = ctx.generators[tier] && ctx.generators[tier][name];
    if (typeof gf !== 'function') continue;
    const items = new Set(); const types = new Set(); let threw = 0;
    for (let i = 0; i < DRAWS; i++) {
      let q; try { q = gf(); } catch (e) { threw++; continue; }
      if (!q) continue;
      items.add(strip(q.question) + ' ⇒ ' + strip(q.answer));
      types.add(q.subType || q.type || '(untyped)');
    }
    rows.push({ tier, name, items: items.size, types: types.size, threw });
  }
}

rows.sort((a, b) => a.items - b.items || a.tier - b.tier);
const under = rows.filter(r => r.items < FLOOR);

const pad = (s, n) => String(s).padEnd(n);
console.log(`floor: ${FLOOR} distinct items · ${DRAWS} draws per skill · ${rows.length} skills (tier 5+)\n`);
if (SHOW_ALL) {
  console.log(`  ${pad('TIER', 6)}${pad('SKILL', 46)}${pad('ITEMS', 8)}TYPES`);
  for (const r of rows) console.log(`  ${pad('T' + r.tier, 6)}${pad(r.name.slice(0, 44), 46)}${pad(r.items, 8)}${r.types}`);
  console.log();
}

if (!under.length) {
  console.log(`=== PASS — every tier-5+ skill has at least ${FLOOR} distinct questions ===`);
  process.exit(0);
}
console.log(`=== ${under.length} skill(s) UNDER the floor of ${FLOOR} ===`);
console.log(`  With 5-correct-in-a-row required, these are memorisation tasks.\n`);
console.log(`  ${pad('TIER', 6)}${pad('SKILL', 46)}${pad('ITEMS', 8)}TYPES`);
for (const r of under) console.log(`  ${pad('T' + r.tier, 6)}${pad(r.name.slice(0, 44), 46)}${pad(r.items, 8)}${r.types}`);
const byTier = {};
for (const r of under) byTier[r.tier] = (byTier[r.tier] || 0) + 1;
console.log(`\n  by tier: ${Object.entries(byTier).map(([t, n]) => `T${t}=${n}`).join('  ')}`);
process.exit(1);
