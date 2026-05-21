#!/usr/bin/env node
// Phase 1.8 — add Q_MATRIX granular entries for dynamic-pick generators.
//
// 63 generators in math-dojo.html use this pattern:
//   const subSkillOrder = ['labelA', 'labelB', ...];
//   const availableTypes = getUnlockedSubSkillTypes(..., subSkillOrder);
//   const type = pick(availableTypes);
//
// `split-subtypes.js` already injects `subType: type` into their returns,
// so the runtime tags q.subType correctly. But the static Q_MATRIX still
// only has the coarse parent entry. This script harvests the labels from
// the literal `subSkillOrder` array and adds granular entries, inheriting
// parent's primary_skill and difficulty. The calibrator can then refine
// difficulty per label.
//
// Idempotent: skips entries that already exist.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILE = path.resolve(__dirname, '../games/math-dojo.html');
const original = fs.readFileSync(FILE, 'utf8');

// ---------- JS-aware walker (same shape as other tools) ----------
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

// ---------- Parse generator body spans ----------
function parseGenerators(src) {
    const blockStart = src.indexOf('const generators = {');
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
        if (ch === '{') {
            if (depth === 1) {
                const m = w.line().match(tierRe);
                if (m) currentTier = parseInt(m[1], 10);
            } else if (depth === 2 && pendingGen) {
                const bodyStart = w.i + 1;
                const gen = pendingGen;
                pendingGen = null;
                depth++;
                w.step();
                const bodyDepth = depth;
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

// ---------- Extract subSkillOrder labels from a body ----------
function extractSubSkillOrder(body) {
    // Match: const subSkillOrder = [ "a", "b", ... ];
    const m = body.match(/const\s+subSkillOrder\s*=\s*\[([\s\S]*?)\]\s*;/);
    if (!m) return null;
    const arr = m[1];
    const labels = [...arr.matchAll(/['"]([^'"]+)['"]/g)].map(x => x[1]);
    return labels.length > 0 ? labels : null;
}

// ---------- Q_MATRIX read/locate ----------
function extractQMatrix(src) {
    const start = src.indexOf('const Q_MATRIX = {');
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
    return { object: ctx.Q, openBrace: open, closeBrace: i };
}

// ---------- Main ----------
const gens = parseGenerators(original);
console.error(`Parsed ${gens.length} generators.`);

const { object: Q, closeBrace } = extractQMatrix(original);

const newEntries = []; // [{ tier, domain, label, primary_skill, difficulty }]
let dynamicGenerators = 0;
let alreadyCovered = 0;

for (const gen of gens) {
    const body = original.slice(gen.bodyStart, gen.bodyEnd);
    const labels = extractSubSkillOrder(body);
    if (!labels) continue;
    dynamicGenerators++;

    const coarseKey = `T${gen.tier}::${gen.domain}`;
    const parent = Q[coarseKey];
    if (!parent) continue;

    for (const label of labels) {
        const granularKey = `${coarseKey}::${label}`;
        if (Q[granularKey]) { alreadyCovered++; continue; }
        newEntries.push({
            tier: gen.tier,
            domain: gen.domain,
            label,
            primary_skill: parent.primary_skill,
            difficulty: parent.difficulty,
        });
    }
}

console.error(`Generators with subSkillOrder: ${dynamicGenerators}`);
console.error(`Existing granular keys to skip: ${alreadyCovered}`);
console.error(`New granular keys to add:       ${newEntries.length}`);

if (newEntries.length === 0) {
    console.error('Nothing to add.');
    process.exit(0);
}

// Build the insertion block, grouped by parent generator
const lines = ['    // ===== Dynamic sub-type splits (Phase 1.8) ====='];
let lastDomain = null;
for (const e of newEntries) {
    const key = `T${e.tier}::${e.domain}::${e.label}`;
    const domainTag = `T${e.tier}::${e.domain}`;
    if (domainTag !== lastDomain) {
        lines.push(`    // -- ${domainTag} --`);
        lastDomain = domainTag;
    }
    lines.push(`    ${JSON.stringify(key)}: { primary_skill: ${JSON.stringify(e.primary_skill)}, secondary_skills: [], difficulty: ${e.difficulty}, discrimination: 1, confidence: "auto" },`);
}
const insertion = '\n' + lines.join('\n');

// Insert immediately before the Q_MATRIX closing `}`
const mutated = original.slice(0, closeBrace) + insertion + '\n' + original.slice(closeBrace);
fs.writeFileSync(FILE, mutated);
console.error(`Wrote ${FILE}`);
