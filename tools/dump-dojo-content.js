// Dump a full content inventory of games/math-dojo.html for curriculum review.
// Reuses the load-order emulation from tools/audit-dojo-coverage.js (literals
// first, then the V2 _addSkill block, which OVERWRITES literal entries) so the
// dump reflects what a student actually plays.
//
// Usage: node tools/dump-dojo-content.js <minTier> [outDir]
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'games/math-dojo.html'), 'utf8');
const MIN_TIER = Number(process.argv[2] || 5);
const OUT = process.argv[3] || path.join(ROOT, '_dojo_dump');

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

const V2_START = src.indexOf('// ===== V2 NEW-SKILL CONTENT');
const V2_END = src.lastIndexOf('// ===== end V2 NEW-SKILL CONTENT =====');
const v2 = src.slice(V2_START, V2_END + '// ===== end V2 NEW-SKILL CONTENT ====='.length);

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
  Math: Object.create(Math),
  JSON, String, Number, Array, Object, isNaN, parseInt, parseFloat, console,
  rand: (a, b) => { if (b === undefined) { b = a; a = 0; } return Math.floor(seeded() * (b - a + 1)) + a; },
  shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(seeded() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  gcd: (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; },
  state: { completedSubSkills: {}, history: [], mode: 'arcade', currentTier: MIN_TIER },
};
sandbox.Math.random = seeded;
sandbox.pick = (a) => a[sandbox.rand(0, a.length - 1)];
sandbox.cap = (s) => String(s).length === 0 ? s : String(s).charAt(0).toUpperCase() + String(s).slice(1);
sandbox.answerValue = answerValue;
sandbox.backfillOptions = backfillOptions;
sandbox.uniqOpts = uniqOpts;
sandbox.simplifyFrac = (n, d) => { const g = sandbox.gcd(Math.abs(n), Math.abs(d)); return [n / g, d / g]; };
// Return ALL sub-skill types so the dump sees the full generator surface, not
// just the first gate. The real game unlocks these progressively.
sandbox.getUnlockedSubSkillTypes = (lessonKey, map, ordered) => {
  const out = [];
  for (const id of ordered) { const v = map[id]; if (Array.isArray(v)) out.push(...v); else if (v) out.push(v); }
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
vm.runInContext(v2, ctx, { filename: 'v2.js' });

const strip = h => String(h == null ? '' : h)
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/[ \t]+/g, ' ').trim();

fs.mkdirSync(OUT, { recursive: true });

const stats = [];

// Render one lesson body (either a flat lesson or one sub-skill of a lesson).
function renderBody(L, out, pad = '  ') {
  const p = pad;
  if (L.goalProblem) out.push(`${p}goalProblem: ${strip(L.goalProblem)}`);
  const steps = L.teachingSteps || L.steps || [];
  out.push(`${p}teachingSteps: ${steps.length}`);
  steps.forEach((st, j) => {
    out.push(`${p}  [${j + 1}] ${strip(st.title)}`);
    strip(st.explanation).split('\n').forEach(x => x && out.push(`${p}      ${x}`));
    if (st.visual) out.push(`${p}      (visual) ${strip(st.visual)}`);
  });
  if (L.finalAnswer) out.push(`${p}finalAnswer: ${strip(L.finalAnswer)}`);
  if (L.answerExplanation) out.push(`${p}answerExplanation: ${strip(L.answerExplanation)}`);
  if (L.keyPoints) {
    out.push(`${p}keyPoints: ${L.keyPoints.length}`);
    L.keyPoints.forEach(k => out.push(`${p}    - ${strip(k)}`));
  }
  if (L.mistakes) {
    out.push(`${p}mistakes: ${L.mistakes.length}`);
    L.mistakes.forEach(m => out.push(`${p}    x ${strip(m.wrong)}  ||  ${strip(m.why)}`));
  }
  if (L.example) {
    out.push(`${p}worked example: ${strip(L.example.problem)}  (${(L.example.steps || []).length} steps)`);
    (L.example.steps || []).forEach(s => out.push(`${p}    · ${strip(s.text)} ${s.math ? '→ ' + strip(s.math) : ''}`));
  }
  if (L.guided) {
    const gi = L.guided.interactiveSteps || [];
    out.push(`${p}guided practice: ${strip(L.guided.problem)}  (scaffold steps=${(L.guided.steps || []).length}, interactive=${gi.length})`);
    gi.forEach(s => out.push(`${p}    ? ${strip(s.prompt)}  [ans: ${strip(s.answer)}]`));
  }
  const extras = Object.keys(L).filter(k => !['id', 'name', 'title', 'goalProblem', 'teachingSteps', 'steps', 'finalAnswer', 'answerExplanation', 'keyPoints', 'mistakes', 'example', 'guided', 'hasSubSkills', 'subSkills'].includes(k));
  if (extras.length) out.push(`${p}(other fields: ${extras.join(', ')})`);
  return { steps: steps.length, keyPoints: (L.keyPoints || []).length, mistakes: (L.mistakes || []).length, example: L.example ? 1 : 0, guided: L.guided ? ((L.guided.interactiveSteps || []).length || 1) : 0 };
}

const index = [];
for (const [tierStr, t] of Object.entries(ctx.TIERS)) {
  const tier = Number(tierStr);
  if (tier < MIN_TIER) continue;
  const lines = [];
  lines.push(`# TIER ${tier} — ${t.name} (grades ${t.grades})`);
  lines.push(`Skills listed in TIERS: ${t.domains.length}`);
  for (const name of t.domains) {
    const lf = ctx.lessons[tier] && ctx.lessons[tier][name];
    const gf = ctx.generators[tier] && ctx.generators[tier][name];
    lines.push(`\n${'='.repeat(78)}`);
    lines.push(`## SKILL: ${name}   (Tier ${tier})`);
    lines.push(`${'='.repeat(78)}`);
    const rec = { tier, name, subSkills: 0, totalSteps: 0, mistakes: 0, guided: 0, qTypes: [] };
    if (!lf) { lines.push('!! NO LESSON'); }
    else {
      let L;
      try { L = lf(); } catch (e) { lines.push(`!! LESSON THREW: ${e.message}`); L = null; }
      if (L) {
        if (L.hasSubSkills && Array.isArray(L.subSkills)) {
          rec.subSkills = L.subSkills.length;
          lines.push(`SUB-SKILLS: ${L.subSkills.length} → ${L.subSkills.map(s => s.id).join(', ')}`);
          L.subSkills.forEach((s, i) => {
            lines.push(`\n--- SUB-SKILL ${i + 1}/${L.subSkills.length}: id=${s.id} name="${s.name || ''}" ---`);
            const r = renderBody(s, lines, '  ');
            rec.totalSteps += r.steps; rec.mistakes += r.mistakes; rec.guided += r.guided;
          });
        } else {
          lines.push(`SUB-SKILLS: none (flat lesson)`);
          const r = renderBody(L, lines, '  ');
          rec.totalSteps += r.steps; rec.mistakes += r.mistakes; rec.guided += r.guided;
        }
      }
    }
    if (!gf) lines.push('\n!! NO GENERATOR');
    else {
      const byType = new Map();
      const qseen = new Set();
      for (let i = 0; i < 500; i++) {
        let q;
        try { q = gf(); } catch (e) { byType.set('THREW:' + e.message, ['-']); continue; }
        if (!q) continue;
        const ty = q.type || q.subType || q.kind || '(untyped)';
        if (!byType.has(ty)) byType.set(ty, []);
        const txt = strip(q.question);
        const k = txt.replace(/-?\d+(\.\d+)?/g, '#');
        if (!qseen.has(k) && byType.get(ty).length < 10) {
          qseen.add(k);
          byType.get(ty).push(`${txt}   →  ANS: ${strip(q.answer)}`);
        }
      }
      rec.qTypes = [...byType.keys()];
      lines.push(`\n--- QUESTION SURFACE (500 samples) ---`);
      lines.push(`distinct question shapes seen: ${qseen.size}; types: [${rec.qTypes.join(', ')}]`);
      for (const [ty, arr] of byType) {
        lines.push(`  * type "${ty}":`);
        arr.forEach(a => lines.push(`      ${a}`));
      }
    }
    index.push(rec); stats.push(rec);
  }
  fs.writeFileSync(path.join(OUT, `tier${tier}.txt`), lines.join('\n'), 'utf8');
  console.log(`wrote tier${tier}.txt (${t.domains.length} skills)`);
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2));
console.log(`total skills dumped: ${index.length}`);
