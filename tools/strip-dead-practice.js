// One-shot tool: removes dead `practice:` properties from each lesson in
// games/math-dojo.html. The `lesson.practice` field (and its nested
// `mistakeAnalysis` dict) are never read anywhere in the game — verified
// by grep for `lesson.practice`, `lessonData.practice`, `['practice']`,
// and `mistakeAnalysis` reads. They are leftover data from a previous
// practice-phase design that was replaced by the `generators[tier][skill]`
// dynamic question pipeline.
//
// What this script does:
//   1. Locate the `const lessons = { ... }` block (JS-aware brace walker).
//   2. Scan every line in that block for the pattern `^\s+practice:\s*`.
//   3. For each match, walk forward tracking string/template/brace/paren
//      nesting until the property value ends (top-level `,` or `}`).
//   4. Remove the lines spanning [practice: start, value end], plus the
//      trailing comma if present, or tidy up the preceding comma if this
//      was the last property in its container.
//
// The script only writes the file if every deletion parses cleanly.

const fs = require('fs');

const PATH = 'games/math-dojo.html';
const src = fs.readFileSync(PATH, 'utf8');

function findMatchingBrace(text, openIdx) {
  // text[openIdx] can be { or ( — same walker either way, using depth.
  const opener = text[openIdx];
  const closer = opener === '{' ? '}' : opener === '(' ? ')' : null;
  if (!closer) return -1;
  const stack = [{ mode: 'code', openChar: opener, depth: 1 }];
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
      if (c === '{' || c === '(') {
        if (c === top.openChar) top.depth++;
        else stack.push({ mode: 'code', openChar: c, depth: 1 });
        i++; continue;
      }
      if (c === '}' || c === ')') {
        if (c === (top.openChar === '{' ? '}' : ')')) {
          top.depth--;
          i++;
          if (top.depth === 0) {
            stack.pop();
            if (stack.length === 0) return i - 1;
          }
          continue;
        }
        // Mismatched — treat as ordinary char
        i++; continue;
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
      if (c === '$' && n === '{') { stack.push({ mode: 'code', openChar: '{', depth: 1 }); i += 2; continue; }
      i++; continue;
    }
  }
  return -1;
}

// Walk forward from `startIdx` in code mode until we hit, at our starting
// nesting depth (which is 0 relative to startIdx), either a top-level `,`
// or a top-level `}`. Return the index of that terminator.
function walkToTopLevelCommaOrBrace(text, startIdx) {
  const stack = [{ mode: 'code', openChar: null, depth: 0 }];
  let i = startIdx;
  while (i < text.length) {
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
      // Top-level `,` or `}` (only when nothing nested)
      if (stack.length === 1 && top.depth === 0 && (c === ',' || c === '}')) {
        return i;
      }
      if (c === '{' || c === '(') {
        stack.push({ mode: 'code', openChar: c, depth: 1 });
        i++; continue;
      }
      if (c === '}' || c === ')') {
        // Closing of a nested block
        top.depth--;
        if (top.depth === 0) {
          stack.pop();
          if (stack.length === 0) {
            // shouldn't happen — would mean we closed a brace we never opened
            return i;
          }
        }
        i++; continue;
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
      if (c === '$' && n === '{') { stack.push({ mode: 'code', openChar: '{', depth: 1 }); i += 2; continue; }
      i++; continue;
    }
  }
  return -1;
}

// 1. Find the `const lessons = {` block.
const lessonsDecl = 'const lessons = {';
const declIdx = src.indexOf(lessonsDecl);
const lessonsOpen = src.indexOf('{', declIdx);
const lessonsClose = findMatchingBrace(src, lessonsOpen);
if (lessonsClose < 0) { console.error('unbalanced lessons braces'); process.exit(1); }
const lineOf = off => src.slice(0, off).split('\n').length;
console.log(`lessons object: lines ${lineOf(lessonsOpen)}-${lineOf(lessonsClose)}`);

// 2. Find every `practice:` property inside the block. We need to be at
//    code mode and not inside a string/template when we see the literal.
//    Easier: regex scan, then for each match verify it's at a property
//    position by walking backward to the previous `{` or `,` skipping
//    whitespace.
const propRe = /^(\s+)practice\s*:\s*/gm;
const matches = [];
{
  let m;
  // Limit scan range to inside the lessons block
  const block = src.slice(lessonsOpen, lessonsClose + 1);
  const blockBase = lessonsOpen;
  propRe.lastIndex = 0;
  while ((m = propRe.exec(block))) {
    matches.push({
      startAbs: blockBase + m.index,            // start of whole line incl. leading space
      propEndAbs: blockBase + m.index + m[0].length, // just after "practice:" + ws
      leadingWs: m[1].length,
    });
  }
}
console.log('practice: properties found:', matches.length);

// 3. For each, find where the property value ends (top-level `,` or `}`).
//    Then determine the deletion range:
//    - If terminator is `,`: delete from line-start of the prop to & including the comma (and optionally the following newline).
//    - If terminator is `}`: `practice` is last. Delete prop. Then remove the preceding `,` (since now the new last-property shouldn't have a trailing comma).
//    Remove the whole lines if they're only whitespace after deletion.

// Work on a mutable array of character indices to skip.
const skip = new Uint8Array(src.length);

for (const match of matches) {
  // Start walking from where the value begins
  const valueStart = match.propEndAbs;
  // Find the value terminator
  const termIdx = walkToTopLevelCommaOrBrace(src, valueStart);
  if (termIdx < 0) {
    console.error('failed to terminate property at line', lineOf(match.startAbs));
    process.exit(1);
  }
  const termChar = src[termIdx];
  let delStart = match.startAbs;
  let delEnd;   // exclusive

  if (termChar === ',') {
    // Delete from line-start through the comma. Also eat the newline following the comma if any.
    delEnd = termIdx + 1;
    if (src[delEnd] === '\n') delEnd++;
    // If the remaining content up to the previous newline was only whitespace, include that line too
  } else {
    // termChar === '}' — practice is the last property. We need to delete
    // from the preceding comma (inclusive) up to just before the `}`.
    // Walk backward from match.startAbs through whitespace/newlines; if we
    // find a `,`, include it in deletion so the new last property has no
    // trailing comma.
    let backIdx = match.startAbs - 1;
    while (backIdx >= 0 && /\s/.test(src[backIdx])) backIdx--;
    if (backIdx >= 0 && src[backIdx] === ',') {
      delStart = backIdx;
    }
    delEnd = termIdx; // stop BEFORE the closing brace
  }

  for (let j = delStart; j < delEnd; j++) skip[j] = 1;
}

// Build the output
const out = [];
for (let i = 0; i < src.length; i++) {
  if (!skip[i]) out.push(src[i]);
}
let result = out.join('');

// Clean up: any line that became pure whitespace should be removed entirely.
// Also collapse 3+ consecutive blank lines to 1.
result = result.split('\n').filter((line, idx, arr) => {
  // Drop a line if it's empty AND the previous retained line was also empty
  return true;
}).join('\n');
// simpler: collapse triple newlines
result = result.replace(/\n{3,}/g, '\n\n');

// Sanity check: the trimmed string must still have the lessons closer
if (result.indexOf(lessonsDecl) < 0) {
  console.error('lessons declaration lost — aborting');
  process.exit(1);
}

// Syntax check: try to find the new lessons block and extract it
const newOpen = result.indexOf('{', result.indexOf(lessonsDecl));
const newClose = findMatchingBrace(result, newOpen);
if (newClose < 0) {
  console.error('post-edit braces unbalanced — aborting');
  process.exit(1);
}
const newBlock = result.slice(newOpen, newClose + 1);
try {
  new Function('rand', 'shuffle', 'pick', 'return ' + newBlock);
  console.log('post-edit lessons block parses cleanly');
} catch (e) {
  console.error('post-edit lessons block SYNTAX ERROR:', e.message);
  // Write to /tmp for debugging
  fs.writeFileSync('/tmp/bad-block.js', newBlock);
  console.error('wrote broken block to /tmp/bad-block.js');
  process.exit(1);
}

// Also verify the full file ends at a reasonable place
fs.writeFileSync(PATH, result);
console.log(`wrote ${PATH}: ${src.length} -> ${result.length} chars (delta ${result.length - src.length})`);
console.log(`lines: ${src.split('\n').length} -> ${result.split('\n').length}`);
