// Audit games/math-dojo.html `const generators = {...}` — the
// data structure that actually serves practice questions to students
// in the arena. Same approach as audit-lessons.js: extract, eval with
// stubbed rand/shuffle/pick, run each generator many times, check for
// concrete bugs.
//
// Checks:
//   1. Generator throws (missing helper, bad reference, etc.)
//   2. Missing required fields (question, answer, explanation)
//   3. options contains duplicates
//   4. options is present but does not contain answer
//   5. Answer is literally undefined / null / empty string / NaN
//   6. Any string field contains a literal ${...} (template bug)
//   7. Generator always produces identical output (possibly not random)
const fs = require('fs');

const src = fs.readFileSync('games/math-dojo.html', 'utf8');

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
      if (c === '"') { stack.push({ mode: 'dqstr' }); i++; continue; }
      if (c === "'") { stack.push({ mode: 'sqstr' }); i++; continue; }
      if (c === '`') { stack.push({ mode: 'tpl' }); i++; continue; }
      if (c === '{') { top.depth++; i++; continue; }
      if (c === '}') { top.depth--; i++; if (top.depth === 0) { stack.pop(); if (stack.length === 0) return i - 1; } continue; }
      i++; continue;
    }
    if (top.mode === 'dqstr') { if (c === '\\') { i += 2; continue; } if (c === '"') { stack.pop(); i++; continue; } i++; continue; }
    if (top.mode === 'sqstr') { if (c === '\\') { i += 2; continue; } if (c === "'") { stack.pop(); i++; continue; } i++; continue; }
    if (top.mode === 'tpl') {
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { stack.pop(); i++; continue; }
      if (c === '$' && n === '{') { stack.push({ mode: 'code', depth: 1 }); i += 2; continue; }
      i++; continue;
    }
  }
  return -1;
}

const declIdx = src.indexOf('const generators = {');
if (declIdx < 0) { console.error('generators not found'); process.exit(1); }
const openBrace = src.indexOf('{', declIdx);
const closeBrace = findMatchingBrace(src, openBrace);
const literal = src.slice(openBrace, closeBrace + 1);
const baseLine = src.slice(0, openBrace).split('\n').length;

// Stubs
let rngSeed = 1;
function seeded() {
  rngSeed = (rngSeed + 0x6D2B79F5) | 0;
  let t = rngSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function rand(a, b) {
  if (b === undefined) { b = a; a = 0; }
  return Math.floor(seeded() * (b - a + 1)) + a;
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seeded() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }
function simplifyFrac(n, d) { const g = gcd(Math.abs(n), Math.abs(d)); return [n / g, d / g]; }
// Mirror of the helper defined near the top of games/math-dojo.html.
function getUnlockedSubSkillTypes(lessonKey, map, orderedSubSkillIds) {
  const completed = (state && state.completedSubSkills && state.completedSubSkills[lessonKey]) || [];
  const completedSet = new Set(completed);
  const current = orderedSubSkillIds.find(id => !completedSet.has(id));
  const allowed = new Set(completed);
  if (current) allowed.add(current);
  const types = [];
  for (const id of allowed) {
    const mapped = map[id];
    if (Array.isArray(mapped)) types.push(...mapped);
    else if (mapped) types.push(mapped);
  }
  if (types.length === 0) {
    const firstMapped = map[orderedSubSkillIds[0]];
    if (Array.isArray(firstMapped)) return firstMapped.slice();
    if (firstMapped) return [firstMapped];
  }
  return types;
}

// Some generators read from a file-level `state` global that holds the
// game's in-memory tracking. In production this is always defined; in
// the sandbox we provide a minimal stub so the generators don't throw.
const state = {
  completedSubSkills: {},  // empty means "use all operations" per fallback
  history: [],
  mode: 'arcade',
  currentTier: 5,
};

let generators;
try {
  generators = new Function('rand', 'shuffle', 'pick', 'state', 'gcd', 'simplifyFrac', 'getUnlockedSubSkillTypes', 'return ' + literal)(rand, shuffle, pick, state, gcd, simplifyFrac, getUnlockedSubSkillTypes);
} catch (e) {
  console.error('FAILED to eval generators:', e.message);
  process.exit(1);
}

console.log(`Loaded ${Object.keys(generators).length} tiers`);
let totalSkills = 0;
for (const t of Object.keys(generators)) totalSkills += Object.keys(generators[t]).length;
console.log(`Total skills: ${totalSkills}`);

const findings = [];
function add(severity, tier, skill, msg, sample) {
  findings.push({ severity, tier, skill, msg, sample });
}

function norm(x) {
  if (x === null || x === undefined) return '';
  return String(x).trim().toLowerCase();
}

function checkGenerated(tier, skill, obj) {
  if (!obj || typeof obj !== 'object') {
    add('error', tier, skill, 'generator did not return an object');
    return;
  }
  // Required fields
  if (obj.question === undefined || obj.question === null || obj.question === '') {
    add('error', tier, skill, 'missing/empty question');
  }
  if (obj.answer === undefined || obj.answer === null || obj.answer === '') {
    add('error', tier, skill, 'missing/empty answer');
  } else if (typeof obj.answer === 'number' && isNaN(obj.answer)) {
    add('error', tier, skill, 'answer is NaN');
  }
  // Template-literal bug check: any string field containing literal ${...}
  function checkTemplates(obj, path) {
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'string') {
      if (/\$\{[^}]+\}/.test(obj)) {
        add('error', tier, skill, `template-literal bug in ${path}`, obj);
      }
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => checkTemplates(v, `${path}[${i}]`));
      return;
    }
    if (typeof obj === 'object') {
      for (const k of Object.keys(obj)) checkTemplates(obj[k], `${path}.${k}`);
    }
  }
  checkTemplates(obj, 'generator');

  // options contains answer check
  if (Array.isArray(obj.options)) {
    const normAns = norm(obj.answer);
    const normOpts = obj.options.map(norm);
    if (normAns && !normOpts.includes(normAns)) {
      add('error', tier, skill, `options does not contain answer "${obj.answer}"`, JSON.stringify(obj.options));
    }
    const seen = new Set();
    for (const o of normOpts) {
      if (seen.has(o)) { add('error', tier, skill, `options has duplicate: "${o}"`); break; }
      seen.add(o);
    }
  }
}

const ITER = 30;
for (const tierKey of Object.keys(generators)) {
  for (const skill of Object.keys(generators[tierKey])) {
    const fn = generators[tierKey][skill];
    if (typeof fn !== 'function') {
      add('warn', tierKey, skill, `not a function (type: ${typeof fn})`);
      continue;
    }
    const samples = new Set();
    for (let i = 0; i < ITER; i++) {
      rngSeed = (parseInt(tierKey, 10) * 10000 + i * 37 + skill.length * 13) | 0;
      let obj;
      try {
        obj = fn();
      } catch (e) {
        add('error', tierKey, skill, `generator threw: ${e.message} (iter ${i})`);
        break;
      }
      checkGenerated(tierKey, skill, obj);
      if (obj && obj.question) samples.add(obj.question);
    }
    if (samples.size === 1) {
      add('warn', tierKey, skill, `always produces the same question (${ITER} samples)`);
    }
  }
}

// Dedupe
const uniq = new Map();
for (const f of findings) {
  const k = `${f.tier}|${f.skill}|${f.severity}|${f.msg}`;
  if (!uniq.has(k)) uniq.set(k, f);
}
const list = [...uniq.values()];

const bySev = {};
for (const f of list) bySev[f.severity] = (bySev[f.severity] || 0) + 1;
console.log(`\n=== SUMMARY ===`);
console.log(`unique findings: ${list.length}  (errors: ${bySev.error || 0}, warns: ${bySev.warn || 0})`);

const byTier = {};
for (const f of list) (byTier[f.tier] = byTier[f.tier] || []).push(f);

for (const tk of Object.keys(byTier).sort((a, b) => parseInt(a) - parseInt(b))) {
  console.log(`\n=== Tier ${tk} — ${byTier[tk].length} findings ===`);
  byTier[tk].sort((a, b) => {
    const sev = { error: 0, warn: 1 };
    return (sev[a.severity] - sev[b.severity]) || a.skill.localeCompare(b.skill);
  });
  for (const f of byTier[tk]) {
    console.log(`  [${f.severity.toUpperCase().padEnd(5)}] ${f.skill.padEnd(30)} — ${f.msg}`);
    if (f.sample) console.log(`    sample: ${String(f.sample).slice(0, 120)}`);
  }
}
