// Fix template-literal bugs: find every string that contains a literal
// `${...}` sequence (meaning it was authored as a double-quoted string
// but the author intended a template literal) and rewrite it to use
// backticks. The script locates each offending source occurrence by
// searching for the exact "..." string, verifies uniqueness, and swaps
// the delimiters.
const fs = require('fs');

const PATH = 'games/math-dojo.html';
let src = fs.readFileSync(PATH, 'utf8');

// Find lessons block
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

const declIdx = src.indexOf('const lessons = {');
const openBrace = src.indexOf('{', declIdx);
const closeBrace = findMatchingBrace(src, openBrace);

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const shuffle = arr => arr.slice();
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const lessons = new Function('rand', 'shuffle', 'pick', 'return ' + src.slice(openBrace, closeBrace + 1))(rand, shuffle, pick);

// Collect all strings containing literal ${...}
const badStrings = new Set();
function walk(obj) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') {
    if (/\$\{[^}]+\}/.test(obj)) badStrings.add(obj);
    return;
  }
  if (Array.isArray(obj)) { obj.forEach(walk); return; }
  if (typeof obj === 'object') { for (const k of Object.keys(obj)) walk(obj[k]); }
}
for (const tierKey of Object.keys(lessons)) {
  for (const skill of Object.keys(lessons[tierKey])) {
    const fn = lessons[tierKey][skill];
    for (let seed = 0; seed < 5; seed++) {
      let obj;
      try { obj = typeof fn === 'function' ? fn() : fn; } catch (e) { continue; }
      walk(obj);
    }
  }
}

console.log(`Found ${badStrings.size} unique bad string(s)`);

// For each, find its `"..."` occurrence(s) in the lessons block and replace
// with backtick version. Verify: the string must appear exactly once
// surrounded by double quotes. If more than one occurrence, report and
// skip (will handle manually).
const lessonsText = src.slice(openBrace, closeBrace + 1);
let fixed = 0;
let skipped = 0;
const edits = [];

for (const s of badStrings) {
  // Build the exact source needle: `"` + s + `"` — but s must be an
  // identical substring. Since strings can contain characters that are
  // escaped in source (e.g. \", \\), we need to handle that. For now,
  // assume simple strings: if s contains `"` we'd need escaping.
  if (s.includes('"')) {
    console.log(`  SKIP (contains \"): ${s.slice(0, 60)}...`);
    skipped++;
    continue;
  }
  if (s.includes('`')) {
    console.log(`  SKIP (contains \`): ${s.slice(0, 60)}...`);
    skipped++;
    continue;
  }
  const needle = '"' + s + '"';
  // Count occurrences
  let count = 0;
  let idx = -1;
  let searchFrom = 0;
  while ((idx = lessonsText.indexOf(needle, searchFrom)) >= 0) {
    count++;
    searchFrom = idx + 1;
  }
  if (count === 0) {
    console.log(`  SKIP (not found in source): ${s.slice(0, 60)}...`);
    skipped++;
    continue;
  }
  if (count > 1) {
    console.log(`  FOUND ${count}x: ${s.slice(0, 60)}...`);
  }
  // Replace all occurrences of the exact "..." with `...`
  const replacement = '`' + s + '`';
  edits.push({ needle, replacement, count });
  fixed += count;
}

console.log(`\nPlanned edits: ${edits.length} unique patterns, ${fixed} total replacements, ${skipped} skipped`);

// Apply edits to lessonsText
let newLessonsText = lessonsText;
for (const { needle, replacement } of edits) {
  newLessonsText = newLessonsText.split(needle).join(replacement);
}

// Syntax check
try {
  new Function('rand', 'shuffle', 'pick', 'return ' + newLessonsText)(rand, shuffle, pick);
  console.log('post-edit lessons block parses cleanly');
} catch (e) {
  console.error('post-edit SYNTAX ERROR:', e.message);
  fs.writeFileSync('/tmp/bad-block.js', newLessonsText);
  process.exit(1);
}

const newSrc = src.slice(0, openBrace) + newLessonsText + src.slice(closeBrace + 1);
fs.writeFileSync(PATH, newSrc);
console.log(`wrote ${PATH}: ${src.length} -> ${newSrc.length} chars (delta ${newSrc.length - src.length})`);
