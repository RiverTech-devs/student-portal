// Find strings anywhere in the lessons data that contain a literal "${...}"
// sequence — this indicates a bug where the author intended a template
// literal (backticks) but used a normal string, so interpolation never
// happened and students see literal dollar-brace text.
const fs = require('fs');

const src = fs.readFileSync('games/math-dojo.html', 'utf8');

// Reuse brace walker from audit-lessons.js
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

const lessonsLiteral = src.slice(openBrace, closeBrace + 1);
const lessons = new Function('rand', 'shuffle', 'pick', 'return ' + lessonsLiteral)(rand, shuffle, pick);

const findings = [];
function walk(obj, path) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') {
    if (/\$\{[^}]+\}/.test(obj)) {
      findings.push({ path, value: obj });
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => walk(v, `${path}[${i}]`));
    return;
  }
  if (typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      walk(obj[k], path ? `${path}.${k}` : k);
    }
  }
}

// Run each lesson function a few times with different seeds to exercise
// randomized branches
for (const tierKey of Object.keys(lessons)) {
  for (const skill of Object.keys(lessons[tierKey])) {
    const fn = lessons[tierKey][skill];
    for (let seed = 0; seed < 5; seed++) {
      let obj;
      try {
        obj = typeof fn === 'function' ? fn() : fn;
      } catch (e) { continue; }
      walk(obj, `T${tierKey}/${skill}`);
    }
  }
}

// Dedupe by path+value
const uniq = new Map();
for (const f of findings) {
  const k = f.path + '|' + f.value;
  if (!uniq.has(k)) uniq.set(k, f);
}
const list = [...uniq.values()];

console.log(`Found ${list.length} string(s) with literal \${...} that should probably be template literals:\n`);
for (const f of list) {
  console.log(`  ${f.path}`);
  console.log(`    value: ${JSON.stringify(f.value).slice(0, 180)}`);
}
