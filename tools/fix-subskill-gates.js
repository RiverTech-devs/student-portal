// Batch-migrate all generators that use the
// `state.completedSubSkills[KEY]` pattern to use the new
// getUnlockedSubSkillTypes helper with the correct sub-skill ordering
// extracted from lessons[tier][skill].subSkills.
//
// Approach:
//   1. Parse the lessons object to build a map:
//        key ('<tier>_<skill>') -> ordered [subSkillId1, subSkillId2, ...]
//   2. Walk games/math-dojo.html line by line.
//   3. When we find a line matching
//        state.completedSubSkills['<KEY>'] || []
//      — enter a small state machine and detect the pattern variant.
//   4. Replace the variant block with a call to getUnlockedSubSkillTypes
//      preceded by a `const subSkillOrder = [...]` derived from the
//      lesson.
//
// The script only edits blocks that match one of the known variants.
// Anything unusual is skipped and reported so a human can review.
const fs = require('fs');

const PATH = 'games/math-dojo.html';
const src = fs.readFileSync(PATH, 'utf8');

// -----------------------------------------------------------------
// Helper: JS-aware matching brace finder (same as audit-lessons.js)
// -----------------------------------------------------------------
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

// -----------------------------------------------------------------
// Step 1. Extract ordered sub-skill ids per lesson.
// -----------------------------------------------------------------
// We evaluate `const lessons = {...}` with stubbed helpers and walk
// the result, pulling subSkills[].id in order.
const lessonsDeclIdx = src.indexOf('const lessons = {');
const lessonsOpen = src.indexOf('{', lessonsDeclIdx);
const lessonsClose = findMatchingBrace(src, lessonsOpen);
const lessonsLiteral = src.slice(lessonsOpen, lessonsClose + 1);

const rand = (a, b) => { if (b === undefined) { b = a; a = 0; } return Math.floor(Math.random() * (b - a + 1)) + a; };
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => arr.slice();
const gcd = (a, b) => { while (b) { [a, b] = [b, a % b]; } return a; };
const simplifyFrac = (n, d) => { const g = gcd(Math.abs(n), Math.abs(d)); return [n / g, d / g]; };
const state = { completedSubSkills: {} };

let lessons;
try {
  lessons = new Function('rand', 'pick', 'shuffle', 'gcd', 'simplifyFrac', 'state', 'return ' + lessonsLiteral)(rand, pick, shuffle, gcd, simplifyFrac, state);
} catch (e) {
  console.error('failed to eval lessons literal:', e.message);
  process.exit(1);
}

// key -> ordered array of sub-skill ids
const subSkillOrderByKey = {};
for (const tier of Object.keys(lessons)) {
  for (const skill of Object.keys(lessons[tier])) {
    const fn = lessons[tier][skill];
    let obj;
    try { obj = typeof fn === 'function' ? fn() : fn; } catch (e) { continue; }
    if (!obj || !obj.hasSubSkills || !Array.isArray(obj.subSkills)) continue;
    const ids = obj.subSkills.map(s => s && s.id).filter(Boolean);
    if (ids.length > 0) {
      subSkillOrderByKey[`${tier}_${skill}`] = ids;
    }
  }
}
console.log('lessons with sub-skills:', Object.keys(subSkillOrderByKey).length);

// -----------------------------------------------------------------
// Step 2. Find every `state.completedSubSkills[KEY]` line and
// determine the enclosing block to replace.
// -----------------------------------------------------------------
// Variant patterns we recognise:
//
// VARIANT A — single-type map, default list:
//   const completedSubSkills = state.completedSubSkills['KEY'] || [];
//   let availableTypes = completedSubSkills.length > 0
//       ? completedSubSkills.map(id => MAP[id]).filter(Boolean)
//       : [...];
//   // optionally: if (availableTypes.length === 0) availableTypes = [...];
//
// VARIANT A' — `completed` instead of `completedSubSkills`, `available`
//   instead of `availableTypes`. Same shape otherwise.
//
// VARIANT B — array-of-types map (Equations-style):
//   const completedSubSkills = state.completedSubSkills['KEY'] || [];
//   let availableTypes = [];
//   if (completedSubSkills.length > 0) {
//       completedSubSkills.forEach(id => {
//           if (MAP[id]) availableTypes.push(...MAP[id]);
//       });
//   }
//   if (availableTypes.length === 0) availableTypes = [...];
//
// We match each by reading the lines starting at the completedSubSkills
// declaration and looking for the end of the gate block (the line that
// declares `const type = pick(...)` or similar).
//
// For each match, we produce a replacement of equivalent semantics.

const lines = src.split('\n');
const edits = [];
const skipped = [];
const matched = [];

const pattern1 = /^(\s*)const\s+(completedSubSkills|completed)\s*=\s*state\.completedSubSkills\[['"]([^'"]+)['"]\]\s*\|\|\s*\[\];\s*$/;

for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(pattern1);
  if (!m) continue;
  const indent = m[1];
  const varName = m[2];
  const key = m[3];

  // Ideally we get the sub-skill order from the corresponding lesson
  // definition. A few Tier 8 generators are orphans — they have their
  // own subSkillToType map but no lesson with sub-skills defines the
  // canonical order. For those we fall back to using the generator's
  // own `subSkillToType` object keys, read from the source a few
  // lines above the const line.
  let orderedIds = subSkillOrderByKey[key];
  if (!orderedIds) {
    // Scan backward from `i` up to ~30 lines looking for a
    // `const subSkillToType = { ... };` or `subSkillToQuestionType`,
    // then extract its keys in source order.
    for (let k = i - 1; k >= Math.max(0, i - 30); k--) {
      const kLine = lines[k];
      if (/const\s+(subSkillToType|subSkillToQuestionType|subSkillTo\w+)\s*=\s*\{/.test(kLine)) {
        // Accumulate text until we hit the closing };
        let text = kLine;
        for (let m = k + 1; m <= i && !text.includes('};'); m++) text += '\n' + lines[m];
        // Extract keys: /['"](\w+)['"]\s*:/g — preserve order
        const keyRe = /['"]([^'"]+)['"]\s*:/g;
        const ids = [];
        let mm;
        while ((mm = keyRe.exec(text))) ids.push(mm[1]);
        if (ids.length) orderedIds = ids;
        break;
      }
    }
  }
  if (!orderedIds) {
    skipped.push({ line: i + 1, reason: 'no lesson sub-skill order for key ' + key });
    continue;
  }

  // Simpler approach: scan forward from the `const completedSubSkills`
  // line, accumulating lines that look like they're part of the gate
  // block, until we see a terminator. The terminator is typically a
  // line calling pick(availableX), or a return statement, or the start
  // of the generator's real body.
  //
  // While scanning, extract the `availVarName` from any line that
  // references `availableTypes`, `availableOps`, `available` etc., and
  // the `mapVarName` from any `.map(id => X[id])` or `X[id]` reference.

  // Pass 1: resolve the variable names used in the gate.
  let availVarName = null;
  let mapVarName = null;
  for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
    const line = lines[j];
    if (!availVarName) {
      const declMatch = line.match(/^\s*let\s+(\w+)\s*[;=]/);
      if (declMatch && /available|types|ops/i.test(declMatch[1])) {
        availVarName = declMatch[1];
      }
    }
    if (!mapVarName) {
      const mapMatch = line.match(/\.map\(id\s*=>\s*(\w+)\[id\]\)/) ||
                       line.match(/if\s*\(\s*(\w+)\[id\]\s*\)/) ||
                       line.match(/\b(\w+)\[id\]\b/);
      if (mapMatch && mapMatch[1] !== 'state' && !/^(available|types|ops)/i.test(mapMatch[1])) {
        mapVarName = mapMatch[1];
      }
    }
    if (availVarName && mapVarName) break;
    if (line.match(/^\s*return\s+\{/)) break;
  }

  // Pass 2: starting at i+1, consume lines that clearly belong to the
  // gate block. Stop at the first line that doesn't. The gate's
  // "belongs" predicate:
  //
  //   - blank line or // comment
  //   - line mentions completedSubSkills or completed
  //   - line declares or assigns `availVarName` (e.g. `let X;`,
  //     `let X = ...`, `X = [...];`)
  //   - line is a structural brace (`{`, `}`, `} else {`) of an
  //     if/else block that was opened earlier inside the gate
  //   - line is the fallback `if (availVarName.length === 0) ...`
  //   - line is a ternary continuation `? ... .filter(Boolean)` or
  //     `: [...];`
  //   - line is a `.forEach(id => { if (MAP[id]) X.push(...) })` style
  //
  // We use a simple depth counter so we don't stop on a `}` that
  // closes an inner if/else inside the gate.
  let endIdx = i;
  if (availVarName) {
    let depth = 0;
    let sawAnyGate = false;
    for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
      const line = lines[j];
      const trimmed = line.trim();
      const opens = (line.match(/\{/g) || []).length;
      const closes = (line.match(/\}/g) || []).length;

      // If we're inside an inner gate-structure brace (depth > 0),
      // every line is part of the gate until we balance.
      if (depth > 0) {
        endIdx = j;
        depth += opens - closes;
        if (depth < 0) depth = 0;
        sawAnyGate = true;
        continue;
      }

      // The `const type = pick(availVarName)` line is the consumer of
      // the gate's output, not part of the gate. Stop here without
      // including it.
      const consumerRe = new RegExp(`(?:const|let|var)\\s+\\w+\\s*=\\s*pick\\s*\\(\\s*${availVarName}\\s*\\)`);
      if (consumerRe.test(trimmed)) {
        break;
      }

      // Blank / pure comment
      if (trimmed === '' || trimmed.startsWith('//')) {
        // Only count as gate if we've already seen gate content
        if (sawAnyGate) endIdx = j; // tentatively extend
        continue;
      }

      const mentionsGate =
        trimmed.includes('completedSubSkills') ||
        trimmed.includes('completed.length') ||
        trimmed.includes(`${availVarName}`) ||
        (mapVarName && trimmed.includes(`${mapVarName}[id]`)) ||
        // Ternary continuation lines: `? ....filter(Boolean)` or `: [...]`
        trimmed.startsWith('?') ||
        trimmed.startsWith(':');

      if (mentionsGate) {
        endIdx = j;
        sawAnyGate = true;
        depth += opens - closes;
        if (depth < 0) depth = 0;
        continue;
      }

      // Not a gate line and we're at depth 0 → stop.
      break;
    }
  }

  if (!availVarName || !mapVarName) {
    skipped.push({ line: i + 1, reason: 'cannot resolve varnames at ' + key });
    continue;
  }
  if (endIdx <= i) {
    skipped.push({ line: i + 1, reason: 'cannot find end of gate block at ' + key });
    continue;
  }

  matched.push({ key, startLine: i + 1, endLine: endIdx + 1, varName, availVarName, mapVarName, indent });

  // Build replacement. Use `let` for the available-types variable
  // because several generators reassign it afterward (e.g. Integers,
  // Decimals add a .filter() call to restrict to the narrower op set).
  const orderLiteral = '[' + orderedIds.map(id => JSON.stringify(id)).join(', ') + ']';
  const replacement = [
    `${indent}const subSkillOrder = ${orderLiteral};`,
    `${indent}let ${availVarName} = getUnlockedSubSkillTypes('${key}', ${mapVarName}, subSkillOrder);`,
  ].join('\n');

  edits.push({ startLineIdx: i, endLineIdx: endIdx, replacement, key });
}

console.log('\nMatched generators:', matched.length);
console.log('Skipped:', skipped.length);
for (const s of skipped.slice(0, 20)) console.log('  line', s.line, ':', s.reason);
if (skipped.length > 20) console.log('  ... and', skipped.length - 20, 'more');

// Apply edits in reverse order so line indices don't shift
edits.sort((a, b) => b.startLineIdx - a.startLineIdx);

let newLines = lines.slice();
for (const edit of edits) {
  // Replace lines [startLineIdx..endLineIdx] with the replacement
  const removed = newLines.splice(edit.startLineIdx, edit.endLineIdx - edit.startLineIdx + 1, edit.replacement);
  // removed is the array of replaced lines — we don't need it
}

const newSrc = newLines.join('\n');

// Syntax check: does the whole file still parse at least the generators block?
const newDeclIdx = newSrc.indexOf('const generators = {');
const newOpen = newSrc.indexOf('{', newDeclIdx);
const newClose = findMatchingBrace(newSrc, newOpen);
if (newClose < 0) {
  console.error('post-edit: generators block unbalanced — aborting');
  process.exit(1);
}
const newBlock = newSrc.slice(newOpen, newClose + 1);
try {
  new Function('rand', 'pick', 'shuffle', 'gcd', 'simplifyFrac', 'state', 'getUnlockedSubSkillTypes', 'return ' + newBlock)(
    rand, pick, shuffle, gcd, simplifyFrac, state,
    () => []   // stub helper
  );
  console.log('post-edit generators block parses cleanly');
} catch (e) {
  console.error('post-edit SYNTAX ERROR:', e.message);
  fs.writeFileSync('tools/.bad-gens.js', newBlock);
  console.error('broken block written to tools/.bad-gens.js');
  // Find the approximate error location
  const errLine = e.message.match(/line\s*(\d+)/);
  if (errLine) console.error('error line:', errLine[1]);
  process.exit(1);
}

fs.writeFileSync(PATH, newSrc);
console.log(`wrote ${PATH}: ${src.length} -> ${newSrc.length} chars (delta ${newSrc.length - src.length})`);
console.log(`lines: ${lines.length} -> ${newLines.length}`);
