// Runtime audit of games/math-dojo.html lesson data.
// Extracts the `const lessons = {...}` literal, eval()s it with stub
// rand()/shuffle(), then runs each lesson function multiple times and
// checks for concrete bugs: answers missing from options, commonMistakes
// keys colliding with correct answers, duplicates, tier mismatches, etc.
const fs = require('fs');

const src = fs.readFileSync('games/math-dojo.html', 'utf8');

// ---- JS-aware matching brace finder ----
function findMatchingBrace(text, openIdx) {
  if (text[openIdx] !== '{') return -1;
  const stack = [{ mode: 'code', depth: 1 }];
  let i = openIdx + 1;
  while (i < text.length && stack.length > 0) {
    const top = stack[stack.length - 1];
    const c = text[i], n = text[i + 1];
    if (top.mode === 'code') {
      if (c === '/' && n === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
      if (c === '/' && n === '*') {
        i += 2;
        while (i < text.length - 1 && !(text[i] === '*' && text[i + 1] === '/')) i++;
        i += 2; continue;
      }
      if (c === '"') { stack.push({ mode: 'dqstr' }); i++; continue; }
      if (c === "'") { stack.push({ mode: 'sqstr' }); i++; continue; }
      if (c === '`') { stack.push({ mode: 'tpl' }); i++; continue; }
      if (c === '{') { top.depth++; i++; continue; }
      if (c === '}') {
        top.depth--; i++;
        if (top.depth === 0) { stack.pop(); if (stack.length === 0) return i - 1; }
        continue;
      }
      i++; continue;
    }
    if (top.mode === 'dqstr') {
      if (c === '\\') { i += 2; continue; }
      if (c === '"') { stack.pop(); i++; continue; }
      i++; continue;
    }
    if (top.mode === 'sqstr') {
      if (c === '\\') { i += 2; continue; }
      if (c === "'") { stack.pop(); i++; continue; }
      i++; continue;
    }
    if (top.mode === 'tpl') {
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { stack.pop(); i++; continue; }
      if (c === '$' && n === '{') { stack.push({ mode: 'code', depth: 1 }); i += 2; continue; }
      i++; continue;
    }
  }
  return -1;
}

// ---- Extract lessons literal ----
const declIdx = src.indexOf('const lessons = {');
const openBrace = src.indexOf('{', declIdx);
const closeBrace = findMatchingBrace(src, openBrace);
const lessonsLiteral = src.slice(openBrace, closeBrace + 1);
const baseLine = src.slice(0, openBrace).split('\n').length;

// Also extract TIERS const to know canonical tier/domain assignments
const tIdx = src.indexOf('const TIERS = {');
const tOpen = src.indexOf('{', tIdx);
const tClose = findMatchingBrace(src, tOpen);
const tiersLiteral = src.slice(tOpen, tClose + 1);

// ---- Stubs ----
let rngSeed = 1;
function seededRand() {
  // Mulberry32
  rngSeed = (rngSeed + 0x6D2B79F5) | 0;
  let t = rngSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function rand(min, max) {
  // common signature: rand(min, max) returns integer in [min, max]
  if (max === undefined) { max = min; min = 0; }
  return Math.floor(seededRand() * (max - min + 1)) + min;
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(seededRand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

// ---- Eval lessons and TIERS ----
let lessons, TIERS;
try {
  lessons = new Function('rand', 'shuffle', 'pick', 'return ' + lessonsLiteral)(rand, shuffle, pick);
} catch (e) {
  console.error('FAILED to eval lessons literal:', e.message);
  console.error('First 500 chars of literal:', lessonsLiteral.slice(0, 500));
  process.exit(1);
}
try {
  TIERS = new Function('return ' + tiersLiteral)();
} catch (e) {
  console.error('FAILED to eval TIERS literal:', e.message);
  process.exit(1);
}

console.log('Loaded lessons:', Object.keys(lessons).length, 'tiers');
console.log('Loaded TIERS:', Object.keys(TIERS).length, 'tiers');

// ---- Checks ----
const findings = []; // { tier, skill, severity, msg }

function add(tier, skill, severity, msg) {
  findings.push({ tier, skill, severity, msg });
}

function norm(x) {
  if (x === null || x === undefined) return '';
  return String(x).trim().toLowerCase();
}

function checkLessonObject(tier, skill, obj) {
  if (!obj || typeof obj !== 'object') {
    add(tier, skill, 'error', 'lesson function did not return an object');
    return;
  }
  // Sub-skill container: descend into subSkills array
  if (obj.hasSubSkills) {
    if (!Array.isArray(obj.subSkills)) {
      add(tier, skill, 'error', 'hasSubSkills=true but subSkills is not an array');
      return;
    }
    if (obj.subSkills.length === 0) {
      add(tier, skill, 'warn', 'subSkills array is empty');
      return;
    }
    const ids = new Set();
    for (let i = 0; i < obj.subSkills.length; i++) {
      const sub = obj.subSkills[i];
      if (!sub || typeof sub !== 'object') {
        add(tier, skill, 'warn', `subSkills[${i}] is not an object`);
        continue;
      }
      if (!sub.id) add(tier, skill, 'warn', `subSkills[${i}] missing id`);
      if (!sub.name) add(tier, skill, 'warn', `subSkills[${i}] missing name`);
      if (sub.id) {
        if (ids.has(sub.id)) add(tier, skill, 'error', `duplicate subSkill id: ${sub.id}`);
        ids.add(sub.id);
      }
      // Recurse with combined skill label
      const subLabel = `${skill}/${sub.id || `[${i}]`}`;
      checkLessonObject(tier, subLabel, sub);
    }
    return;
  }
  // Required top-level fields. Note: `practice` was removed as a dead
  // field — the game never read lesson.practice, so it's no longer part
  // of the lesson schema.
  const required = ['teachingSteps', 'example', 'keyPoints', 'mistakes', 'guided'];
  for (const k of required) {
    if (!(k in obj)) add(tier, skill, 'warn', `missing field: ${k}`);
  }
  // teachingSteps
  if (Array.isArray(obj.teachingSteps)) {
    if (obj.teachingSteps.length < 3) add(tier, skill, 'warn', `teachingSteps has only ${obj.teachingSteps.length} step(s)`);
    obj.teachingSteps.forEach((s, i) => {
      if (!s || typeof s !== 'object') add(tier, skill, 'warn', `teachingSteps[${i}] is not an object`);
      else {
        if (!s.title) add(tier, skill, 'warn', `teachingSteps[${i}].title missing`);
        if (!s.explanation) add(tier, skill, 'warn', `teachingSteps[${i}].explanation missing`);
      }
    });
  }
  // mistakes
  if (Array.isArray(obj.mistakes)) {
    const seen = new Set();
    obj.mistakes.forEach((m, i) => {
      if (!m || typeof m !== 'object') return;
      if (!m.wrong || !m.why) add(tier, skill, 'warn', `mistakes[${i}] missing wrong/why`);
      const key = norm(m.wrong);
      if (seen.has(key)) add(tier, skill, 'warn', `mistakes[${i}] duplicate wrong: ${m.wrong}`);
      seen.add(key);
    });
  }
  // guided.interactiveSteps
  if (obj.guided && Array.isArray(obj.guided.interactiveSteps)) {
    obj.guided.interactiveSteps.forEach((step, i) => {
      if (!step || typeof step !== 'object') return;
      const ans = step.answer;
      if (ans === undefined || ans === null || ans === '') {
        add(tier, skill, 'warn', `guided.interactiveSteps[${i}].answer is empty`);
      }
      if (Array.isArray(step.acceptableAnswers)) {
        const normAns = norm(ans);
        const normAccept = step.acceptableAnswers.map(norm);
        if (normAns && !normAccept.includes(normAns)) {
          add(tier, skill, 'warn', `guided.interactiveSteps[${i}].acceptableAnswers missing "${ans}"`);
        }
      }
      if (step.commonMistakes && typeof step.commonMistakes === 'object') {
        const normAns = norm(ans);
        const acceptSet = new Set((step.acceptableAnswers || []).map(norm));
        for (const key of Object.keys(step.commonMistakes)) {
          const nk = norm(key);
          if (nk === normAns) {
            add(tier, skill, 'error', `guided.interactiveSteps[${i}].commonMistakes key "${key}" equals the correct answer "${ans}"`);
          } else if (acceptSet.has(nk)) {
            add(tier, skill, 'error', `guided.interactiveSteps[${i}].commonMistakes key "${key}" matches an acceptableAnswer`);
          }
        }
      }
    });
  }
  // `practice` was deleted from lessons — no checks needed.
}

function runLesson(tier, skill, fn, iterations) {
  for (let i = 0; i < iterations; i++) {
    rngSeed = (tier * 1000 + i * 31 + skill.length * 7) | 0;
    let obj;
    try {
      obj = fn();
    } catch (e) {
      add(tier, skill, 'error', `lesson function threw: ${e.message} (iter ${i})`);
      return;
    }
    checkLessonObject(tier, skill, obj);
  }
}

// ---- Tier/domain consistency ----
for (const tierKey of Object.keys(lessons)) {
  const tierNum = parseInt(tierKey, 10);
  const tierSkills = Object.keys(lessons[tierKey]);
  const tierDef = TIERS[tierKey];
  const declaredDomains = tierDef ? new Set(tierDef.domains) : new Set();
  for (const skill of tierSkills) {
    if (declaredDomains.size > 0 && !declaredDomains.has(skill)) {
      // Check if this skill is declared in a DIFFERENT tier
      let foundInTier = null;
      for (const tk of Object.keys(TIERS)) {
        if (TIERS[tk].domains.includes(skill)) { foundInTier = tk; break; }
      }
      if (foundInTier) {
        add(tierNum, skill, 'error', `declared as a Tier ${foundInTier} domain in TIERS but lesson is in Tier ${tierNum}`);
      } else {
        add(tierNum, skill, 'warn', `not in TIERS[${tierNum}].domains`);
      }
    }
  }
  // Also: domains declared in TIERS that have no lesson
  if (tierDef) {
    for (const d of tierDef.domains) {
      if (!tierSkills.includes(d)) {
        add(tierNum, d, 'info', `no lesson function (domain declared in TIERS only)`);
      }
    }
  }
}

// ---- Run all lessons ----
const ITER = 15; // run each lesson 15x with different seeds to catch randomized bugs
for (const tierKey of Object.keys(lessons)) {
  for (const skill of Object.keys(lessons[tierKey])) {
    const fn = lessons[tierKey][skill];
    if (typeof fn !== 'function') {
      // Some lessons may be object literals directly, not functions
      checkLessonObject(parseInt(tierKey, 10), skill, fn);
      continue;
    }
    runLesson(parseInt(tierKey, 10), skill, fn, ITER);
  }
}

// ---- Report ----
// Collapse duplicate findings (same tier/skill/msg)
const dedup = new Map();
for (const f of findings) {
  const k = `${f.tier}|${f.skill}|${f.severity}|${f.msg}`;
  if (!dedup.has(k)) dedup.set(k, f);
}
const uniq = [...dedup.values()];

const bySeverity = { error: 0, warn: 0, info: 0 };
for (const f of uniq) bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
console.log(`\n=== SUMMARY ===`);
console.log(`unique findings: ${uniq.length}  (errors: ${bySeverity.error}, warns: ${bySeverity.warn}, info: ${bySeverity.info})`);

// Group by tier
const byTier = {};
for (const f of uniq) {
  (byTier[f.tier] = byTier[f.tier] || []).push(f);
}

const tierNames = {};
for (const k of Object.keys(TIERS)) tierNames[k] = TIERS[k].name;

for (const tk of Object.keys(byTier).sort((a, b) => a - b)) {
  const list = byTier[tk];
  console.log(`\n=== Tier ${tk} (${tierNames[tk] || '?'}) — ${list.length} findings ===`);
  // sort errors first
  list.sort((a, b) => {
    const sev = { error: 0, warn: 1, info: 2 };
    return (sev[a.severity] - sev[b.severity]) || a.skill.localeCompare(b.skill);
  });
  for (const f of list) {
    console.log(`  [${f.severity.toUpperCase().padEnd(5)}] ${f.skill.padEnd(30)} — ${f.msg}`);
  }
}
