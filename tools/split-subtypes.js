#!/usr/bin/env node
// Phase 1.6 — programmatic sub-type split for all generators.
//
// For every question generator in games/math-dojo.html that uses
//   `const type = pick([...])`
// for sub-type branching, this script:
//   1. Injects ` subType: type,` into every return-object inside the body
//      so the runtime tags q.subType with the picked label.
//   2. If the pick uses a literal string array, extracts the labels and
//      adds granular Q_MATRIX entries (using parent's primary_skill,
//      difficulty, discrimination — refine later by hand).
//
// Idempotent: skips returns that already carry `subType:` and skips
// Q_MATRIX keys that already exist.
//
// Run: node tools/split-subtypes.js
// Then validate: node tools/validate-q-matrix.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILE = path.resolve(__dirname, '../games/math-dojo.html');
const original = fs.readFileSync(FILE, 'utf8');

// ============================================================
// Generic JS-aware walker. Skips strings, template literals,
// line comments, block comments. Tracks brace depth.
// ============================================================
function makeWalker(src, start) {
    let i = start;
    let lineStart = src.lastIndexOf('\n', i) + 1;
    return {
        get i() { return i; },
        get lineStart() { return lineStart; },
        get ch() { return src[i]; },
        get done() { return i >= src.length; },
        line() {
            const eol = src.indexOf('\n', i);
            return src.slice(lineStart, eol === -1 ? src.length : eol);
        },
        prefix() { return src.slice(lineStart, i); },
        step() {
            const c = src[i];
            if (c === '\n') { lineStart = i + 1; i++; return 'nl'; }
            if (c === '/' && src[i + 1] === '/') {
                while (i < src.length && src[i] !== '\n') i++;
                return 'lcom';
            }
            if (c === '/' && src[i + 1] === '*') {
                i += 2;
                while (i < src.length - 1 && !(src[i] === '*' && src[i + 1] === '/')) {
                    if (src[i] === '\n') lineStart = i + 1;
                    i++;
                }
                i += 2;
                return 'bcom';
            }
            if (c === '"' || c === "'" || c === '`') {
                const q = c; i++;
                while (i < src.length) {
                    if (src[i] === '\\') { i += 2; continue; }
                    if (src[i] === '\n') lineStart = i + 1;
                    if (src[i] === q) { i++; break; }
                    i++;
                }
                return 'str';
            }
            i++;
            return c;
        },
        jumpTo(pos) { i = pos; lineStart = src.lastIndexOf('\n', i) + 1; }
    };
}

// ============================================================
// Parse generators object → array of { tier, domain, bodyStart, bodyEnd }
// bodyStart is the byte AFTER the generator's `{`, bodyEnd is the byte
// AT the matching `}`.
// ============================================================
function parseGenerators(src) {
    const blockStart = src.indexOf('const generators = {');
    if (blockStart === -1) throw new Error('generators object not found');
    const blockOpen = src.indexOf('{', blockStart);

    const w = makeWalker(src, blockOpen);
    let depth = 0;
    let currentTier = null;
    let pendingGen = null;
    const gens = [];
    const tierRe = /^\s+(\d+):\s*\{/;
    const bareRe = /^\s+([A-Z][A-Za-z0-9]*?):\s*\(\s*\)\s*=>/;
    const quotedRe = /^\s+"([^"]+)":\s*\(\s*\)\s*=>/;

    while (!w.done) {
        const ch = w.ch;

        // Try to recognize a tier header or generator key BEFORE generic
        // string-skip (otherwise quoted keys get eaten as strings).
        if (ch === '{') {
            // Check pre-conditions: at depth 1 it might be a tier header,
            // at depth 2 with pendingGen it's a generator body open.
            if (depth === 1) {
                const m = w.line().match(tierRe);
                if (m) currentTier = parseInt(m[1], 10);
            } else if (depth === 2 && pendingGen) {
                const bodyStart = w.i + 1;
                const gen = pendingGen;
                pendingGen = null;
                depth++;
                w.step(); // consume `{`
                const bodyDepth = depth;
                // Walk to matching close brace
                while (!w.done) {
                    const c2 = w.ch;
                    if (c2 === '{') { depth++; w.step(); continue; }
                    if (c2 === '}') {
                        depth--;
                        if (depth < bodyDepth) {
                            gens.push({ tier: gen.tier, domain: gen.domain, bodyStart, bodyEnd: w.i });
                            w.step();
                            break;
                        }
                        w.step(); continue;
                    }
                    w.step();
                }
                continue;
            }
            depth++; w.step(); continue;
        }
        if (ch === '}') {
            depth--;
            if (depth === 0) { w.step(); break; }
            if (depth === 1) currentTier = null;
            w.step(); continue;
        }
        // At depth 2, try to match a generator-key line (bare or quoted)
        if (depth === 2 && (ch === '"' || (ch >= 'A' && ch <= 'Z'))) {
            const prefix = w.prefix();
            if (/^\s*$/.test(prefix)) {
                const line = w.line();
                const m = ch === '"' ? line.match(quotedRe) : line.match(bareRe);
                if (m && currentTier !== null) {
                    pendingGen = { tier: currentTier, domain: m[1].trim() };
                    w.jumpTo(w.lineStart + m[0].length);
                    continue;
                }
            }
        }
        w.step();
    }
    return gens;
}

// ============================================================
// Inside a generator body, find each `return {` (start of an object
// literal return) and return its position relative to the body start.
// Skips returns that already have `subType:` (idempotent).
// Returns: [{ openBracePos, alreadyHasSubType }]
// ============================================================
function findReturnObjectOpens(body) {
    const out = [];
    const w = makeWalker(body, 0);
    let depth = 0;

    while (!w.done) {
        const ch = w.ch;
        if (ch === '{') { depth++; w.step(); continue; }
        if (ch === '}') { depth--; w.step(); continue; }
        // Look for the literal token `return` followed by `{`
        if (ch === 'r' && body.slice(w.i, w.i + 6) === 'return') {
            // Make sure this is a word boundary
            const before = w.i === 0 ? '' : body[w.i - 1];
            const after = body[w.i + 6];
            if (/\w/.test(before) || /\w/.test(after)) { w.step(); continue; }
            // Skip whitespace/newlines after `return`
            let j = w.i + 6;
            while (j < body.length && /\s/.test(body[j])) {
                if (body[j] === '\n') {} // lineStart tracking not critical here
                j++;
            }
            if (body[j] === '{') {
                // Check idempotence: scan the object content for subType:
                let k = j + 1;
                let objDepth = 1;
                const objStart = j;
                while (k < body.length && objDepth > 0) {
                    const c = body[k];
                    if (c === '"' || c === "'" || c === '`') {
                        const q = c; k++;
                        while (k < body.length) {
                            if (body[k] === '\\') { k += 2; continue; }
                            if (body[k] === q) { k++; break; }
                            k++;
                        }
                        continue;
                    }
                    if (c === '{') objDepth++;
                    else if (c === '}') objDepth--;
                    k++;
                }
                const objContent = body.slice(objStart, k);
                const alreadyHasSubType = /\bsubType\s*:/.test(objContent);
                out.push({ openBracePos: j, alreadyHasSubType });
                w.jumpTo(j); // continue from `{`; the next step will descend into it
            }
        }
        w.step();
    }
    return out;
}

// ============================================================
// Extract sub-type labels from `const type = pick([...])` if literal.
// Returns null if the pick argument isn't a literal string array.
// ============================================================
function extractTypeLabels(body) {
    // Find the first `const type = pick(`
    const m = body.match(/const\s+type\s*=\s*pick\s*\(\s*(\[[\s\S]*?\]|\w+)\s*\)/);
    if (!m) return null;
    const arg = m[1];
    if (!arg.startsWith('[')) return { labels: null, dynamic: true };
    // Parse string elements out of the array literal
    const inner = arg.slice(1, -1);
    const labels = [...inner.matchAll(/"([^"]+)"/g)].map(x => x[1]);
    if (labels.length === 0) return { labels: null, dynamic: true };
    return { labels, dynamic: false };
}

// ============================================================
// Read existing Q_MATRIX literal as a JS object (sandboxed eval)
// ============================================================
function extractQMatrix(src) {
    const start = src.indexOf('const Q_MATRIX = {');
    if (start === -1) throw new Error('Q_MATRIX not found');
    const open = src.indexOf('{', start);
    let depth = 0, i = open;
    for (; i < src.length; i++) {
        const c = src[i];
        if (c === '"' || c === "'" || c === '`') {
            const q = c; i++;
            while (i < src.length) {
                if (src[i] === '\\') { i += 2; continue; }
                if (src[i] === q) break;
                i++;
            }
            continue;
        }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) break; }
    }
    const literal = src.slice(open, i + 1);
    const ctx = {};
    vm.runInNewContext(`Q = ${literal}`, ctx);
    return { object: ctx.Q, start, end: i + 1, openBrace: open };
}

// ============================================================
// Apply transformations
// ============================================================
const gens = parseGenerators(original);
console.error(`Parsed ${gens.length} generators.`);

const { object: qMatrix, start: qmStart, end: qmEnd, openBrace: qmOpen } = extractQMatrix(original);

const inserts = []; // { absPos, text }
const newGranularKeys = []; // { tier, domain, label }
let generatorsTransformed = 0;
let returnsTouched = 0;
let dynamicSkipped = 0;

for (const gen of gens) {
    const body = original.slice(gen.bodyStart, gen.bodyEnd);
    const info = extractTypeLabels(body);
    if (!info) continue;

    const returns = findReturnObjectOpens(body);
    let touched = 0;
    for (const r of returns) {
        if (r.alreadyHasSubType) continue;
        const absPos = gen.bodyStart + r.openBracePos + 1;
        inserts.push({ absPos, text: ' subType: type,' });
        touched++;
    }
    if (touched > 0) {
        generatorsTransformed++;
        returnsTouched += touched;
    }
    if (info.dynamic) {
        dynamicSkipped++;
        continue;
    }
    // Add granular Q_MATRIX entries for this generator's labels
    const coarseKey = `T${gen.tier}::${gen.domain}`;
    const parent = qMatrix[coarseKey];
    if (!parent) continue;
    for (const label of info.labels) {
        const granularKey = `${coarseKey}::${label}`;
        if (qMatrix[granularKey]) continue; // already exists, skip
        newGranularKeys.push({
            tier: gen.tier,
            domain: gen.domain,
            label,
            primary_skill: parent.primary_skill,
            difficulty: parent.difficulty,
        });
    }
}

// Apply source-file inserts in reverse order
inserts.sort((a, b) => b.absPos - a.absPos);
let mutated = original;
for (const ins of inserts) {
    mutated = mutated.slice(0, ins.absPos) + ins.text + mutated.slice(ins.absPos);
}

// Build new granular Q_MATRIX block lines and insert before the closing `};`
if (newGranularKeys.length > 0) {
    const newLines = ['    // ===== Sub-type splits (Phase 1.6 — full) ====='];
    let lastDomain = null;
    for (const e of newGranularKeys) {
        const key = `T${e.tier}::${e.domain}::${e.label}`;
        const domainTag = `T${e.tier}::${e.domain}`;
        if (domainTag !== lastDomain) {
            newLines.push(`    // -- ${domainTag} --`);
            lastDomain = domainTag;
        }
        newLines.push(`    ${JSON.stringify(key)}: { primary_skill: ${JSON.stringify(e.primary_skill)}, secondary_skills: [], difficulty: ${e.difficulty}, discrimination: 1, confidence: "auto" },`);
    }
    const insertion = '\n' + newLines.join('\n');

    // qmEnd is at the closing `}`. Find the position right BEFORE the `}`.
    // After source mutations, qmEnd may have shifted. Recompute by searching
    // for the Q_MATRIX block in the mutated source.
    const newQmStart = mutated.indexOf('const Q_MATRIX = {');
    let i = mutated.indexOf('{', newQmStart);
    let depth = 0;
    for (; i < mutated.length; i++) {
        const c = mutated[i];
        if (c === '"' || c === "'" || c === '`') {
            const q = c; i++;
            while (i < mutated.length) {
                if (mutated[i] === '\\') { i += 2; continue; }
                if (mutated[i] === q) break;
                i++;
            }
            continue;
        }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) break; }
    }
    const newQmEnd = i; // position of closing `}`
    mutated = mutated.slice(0, newQmEnd) + insertion + '\n' + mutated.slice(newQmEnd);
}

fs.writeFileSync(FILE, mutated);

// Reports
console.error(``);
console.error(`Sub-type split report`);
console.error(`=====================`);
console.error(`Generators total:           ${gens.length}`);
console.error(`Generators with type pick:  ${generatorsTransformed + dynamicSkipped}`);
console.error(`  Static labels:            ${generatorsTransformed}`);
console.error(`  Dynamic (skipped):        ${dynamicSkipped}`);
console.error(`Return statements injected: ${returnsTouched}`);
console.error(`New granular Q_MATRIX keys: ${newGranularKeys.length}`);
console.error(``);
console.error(`Wrote ${FILE}`);
