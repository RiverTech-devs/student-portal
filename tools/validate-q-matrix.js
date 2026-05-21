#!/usr/bin/env node
// Phase 1 Q-matrix validator.
//
// Checks:
//   1. Every generator (T{tier}::{domain}) in games/math-dojo.html has a
//      Q_MATRIX entry.
//   2. Every Q_MATRIX entry's primary_skill resolves to a real
//      curriculum_nodes.title in data/compiled/master_graph.json.
//   3. Every secondary_skill resolves likewise.
//   4. No orphan Q_MATRIX entries (entries with no matching generator).
//   5. Each entry has the required fields with reasonable types.
//
// Exit codes: 0 = clean. 1 = at least one error. Warnings don't fail.
//
// Usage:
//   node tools/validate-q-matrix.js
//   node tools/validate-q-matrix.js --quiet    # only print on failures

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const MATH_DOJO = path.join(ROOT, 'games/math-dojo.html');
const MASTER_GRAPH = path.join(ROOT, 'data/compiled/master_graph.json');

const quiet = process.argv.includes('--quiet');
const errors = [];
const warnings = [];

function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

const html = fs.readFileSync(MATH_DOJO, 'utf8');

// ---------- Extract Q_MATRIX by eval'ing its object literal in a sandbox ----------
function extractQMatrix(src) {
    const decl = 'const Q_MATRIX = {';
    const start = src.indexOf(decl);
    if (start === -1) throw new Error('Q_MATRIX not found in math-dojo.html');
    // Find matching closing brace
    let i = src.indexOf('{', start);
    let depth = 0;
    for (; i < src.length; i++) {
        const ch = src[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) break;
        }
    }
    const literal = src.slice(src.indexOf('{', start), i + 1);
    const sandbox = {};
    vm.runInNewContext(`Q_MATRIX = ${literal}`, sandbox);
    return sandbox.Q_MATRIX;
}

// ---------- Extract generator keys via the same depth-tracking parser ----------
function extractGenerators(src) {
    const start = src.indexOf('const generators = {');
    if (start === -1) throw new Error('generators object not found');
    const openAt = src.indexOf('{', start);
    const result = {};
    let depth = 0;
    let i = openAt;
    let lineStart = src.lastIndexOf('\n', i) + 1;
    let currentTier = null;
    const tierHeaderRe = /^\s+(\d+):\s*\{/;
    const genKeyRe = /^\s+([A-Z][A-Za-z0-9 ()&-]*?):\s*\(\s*\)\s*=>/;

    function skipString(quote) {
        i++;
        while (i < src.length) {
            const ch = src[i];
            if (ch === '\\') { i += 2; continue; }
            if (ch === quote) { i++; return; }
            if (ch === '\n') lineStart = i + 1;
            i++;
        }
    }
    function skipLine() {
        while (i < src.length && src[i] !== '\n') i++;
        if (i < src.length) lineStart = i + 1;
    }
    function skipBlock() {
        i += 2;
        while (i < src.length - 1) {
            if (src[i] === '*' && src[i + 1] === '/') { i += 2; return; }
            if (src[i] === '\n') lineStart = i + 1;
            i++;
        }
    }
    function getLine() {
        const eol = src.indexOf('\n', i);
        return src.slice(lineStart, eol === -1 ? src.length : eol);
    }

    for (; i < src.length; i++) {
        const ch = src[i];
        if (ch === '\n') { lineStart = i + 1; continue; }
        if (ch === '/' && src[i + 1] === '/') { skipLine(); continue; }
        if (ch === '/' && src[i + 1] === '*') { skipBlock(); continue; }
        if (ch === '"' || ch === "'" || ch === '`') { skipString(ch); i--; continue; }
        if (ch === '{') {
            if (depth === 1) {
                const m = getLine().match(tierHeaderRe);
                if (m) {
                    currentTier = parseInt(m[1], 10);
                    result[currentTier] = result[currentTier] || [];
                }
            }
            depth++;
            continue;
        }
        if (ch === '}') {
            depth--;
            if (depth === 0) break;
            if (depth === 1) currentTier = null;
            continue;
        }
        if (depth === 2 && /[A-Z]/.test(ch)) {
            const prefix = src.slice(lineStart, i);
            if (/^\s*$/.test(prefix)) {
                const line = getLine();
                const m = line.match(genKeyRe);
                if (m && currentTier !== null) {
                    const domain = m[1].trim();
                    if (!result[currentTier].includes(domain)) {
                        result[currentTier].push(domain);
                    }
                    i = lineStart + m[0].length - 1;
                }
            }
        }
    }
    return result;
}

function loadCurriculumTitles() {
    const graph = JSON.parse(fs.readFileSync(MASTER_GRAPH, 'utf8'));
    const titles = new Set();
    for (const n of graph.nodes) {
        if (n.domain === 'Math') {
            titles.add(n.title);
            if (n.legacy_name) titles.add(n.legacy_name);
        }
    }
    return titles;
}

// ---------- Run checks ----------
const qMatrix = extractQMatrix(html);
const generators = extractGenerators(html);
const titles = loadCurriculumTitles();

const generatorKeys = new Set();
for (const tier of Object.keys(generators)) {
    for (const domain of generators[tier]) {
        generatorKeys.add(`T${tier}::${domain}`);
    }
}
const qMatrixKeys = new Set(Object.keys(qMatrix));

// 1. Generators without Q-matrix entries
for (const k of generatorKeys) {
    if (!qMatrixKeys.has(k)) {
        err(`Missing Q_MATRIX entry for generator: ${k}`);
    }
}

// 2/3. Skill tags resolve to curriculum nodes
for (const [k, entry] of Object.entries(qMatrix)) {
    if (!entry || typeof entry !== 'object') {
        err(`Q_MATRIX[${k}] is not an object`);
        continue;
    }
    if (!entry.primary_skill) {
        err(`Q_MATRIX[${k}] missing primary_skill`);
    } else if (!titles.has(entry.primary_skill)) {
        err(`Q_MATRIX[${k}].primary_skill "${entry.primary_skill}" not found in curriculum_nodes`);
    }
    if (entry.secondary_skills) {
        if (!Array.isArray(entry.secondary_skills)) {
            err(`Q_MATRIX[${k}].secondary_skills must be an array`);
        } else {
            for (const s of entry.secondary_skills) {
                if (!titles.has(s)) {
                    err(`Q_MATRIX[${k}].secondary_skills includes "${s}" — not in curriculum_nodes`);
                }
            }
        }
    }
    if (typeof entry.difficulty !== 'number' || entry.difficulty < 1 || entry.difficulty > 5) {
        warn(`Q_MATRIX[${k}].difficulty (${entry.difficulty}) outside [1, 5]`);
    }
    if (typeof entry.discrimination !== 'number' || entry.discrimination < 0) {
        warn(`Q_MATRIX[${k}].discrimination (${entry.discrimination}) is not a non-negative number`);
    }
    if (!['auto', 'manual', 'placeholder'].includes(entry.confidence)) {
        warn(`Q_MATRIX[${k}].confidence "${entry.confidence}" should be one of: auto, manual, placeholder`);
    }
}

// 4. Orphan Q-matrix entries
for (const k of qMatrixKeys) {
    if (!generatorKeys.has(k)) {
        warn(`Orphan Q_MATRIX entry (no matching generator): ${k}`);
    }
}

// ---------- Coverage summary ----------
const byConfidence = { auto: 0, manual: 0, placeholder: 0, other: 0 };
for (const entry of Object.values(qMatrix)) {
    const c = entry?.confidence;
    if (c === 'auto' || c === 'manual' || c === 'placeholder') byConfidence[c]++;
    else byConfidence.other++;
}

if (!quiet || errors.length > 0) {
    console.log('Q-matrix validation');
    console.log('===================');
    console.log(`Generators:        ${generatorKeys.size}`);
    console.log(`Q_MATRIX entries:  ${qMatrixKeys.size}`);
    console.log(`Curriculum titles: ${titles.size}`);
    console.log(`Coverage:          ${generatorKeys.size === 0 ? 0 : Math.round(100 * [...generatorKeys].filter(k => qMatrixKeys.has(k)).length / generatorKeys.size)}%`);
    console.log(`By confidence:     auto=${byConfidence.auto}, manual=${byConfidence.manual}, placeholder=${byConfidence.placeholder}${byConfidence.other ? `, other=${byConfidence.other}` : ''}`);
    if (errors.length) {
        console.log(`\nERRORS (${errors.length}):`);
        for (const e of errors) console.log(`  ✗ ${e}`);
    }
    if (warnings.length) {
        console.log(`\nWarnings (${warnings.length}):`);
        for (const w of warnings) console.log(`  · ${w}`);
    }
    if (!errors.length && !warnings.length) {
        console.log('\n✓ All checks passed.');
    }
}

process.exit(errors.length > 0 ? 1 : 0);
