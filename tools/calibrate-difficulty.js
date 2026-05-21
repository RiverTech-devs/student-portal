#!/usr/bin/env node
// Phase 1.7 — heuristic difficulty calibration for granular Q_MATRIX entries.
//
// Until Phase 2 BKT runs and we have response data to fit slip/guess
// parameters, every granular entry was just copying the parent
// generator's difficulty. That misses the obvious cognitive differences
// between sub-types — `::identify` is recognition (easier), `::word_problem`
// adds a translation step (harder), `::compare_diff` requires cross-base
// reasoning (harder), and so on.
//
// This script applies label-semantic deltas to every granular entry. The
// rule table below is opinionated but principled: each delta has a
// pedagogical rationale, not vibes. Anything not in the table leaves
// difficulty at parent's baseline (delta 0).
//
// Confidence transitions:
//   "auto" (bootstrapped, no calibration) → "calibrated" (heuristic applied)
//   "manual" entries are left untouched.
//
// Run: node tools/calibrate-difficulty.js
// Then validate: node tools/validate-q-matrix.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FILE = path.resolve(__dirname, '../games/math-dojo.html');
const original = fs.readFileSync(FILE, 'utf8');

// ============================================================
// Label → difficulty delta. Applied to parent's baseline.
// Rationale per group is in the comments below.
// ============================================================
// Group A: Recognition / recall (easier than production)
const EASIER = new Set([
    'identify', 'recognize', 'classify', 'read', 'count',
    'name_from_property', 'name_from_sides', 'is_factor', 'is_multiple',
    'is_factor_pair', 'natural', 'which_natural', 'definition',
    'already_simplified', 'perfect', 'simplify_to_whole', 'numerical',
    'basic', 'simple', 'simplify_basic',
    'estimate', 'approximate',
    'zero', 'identity',
    'add_same', 'subtract_same', // same denom/base is the simplest add/sub
]);

// Group B: Standard baseline (no delta)
//   left out of EASIER/HARDER intentionally — these are the "expected"
//   variant for the generator family. Anything not in any set falls here.
const BASELINE = new Set([
    'compare', 'compare_same',
    'compose', 'build', 'combine', 'break_apart', 'decompose',
    'order', 'sort',
    'add', 'subtract', 'multiply', 'divide',
    'pattern', 'sequence', 'next', 'after', 'before',
    'formula', 'property', 'calculate', 'compute', 'solve', 'evaluate',
    'draw', 'plot', 'measure',
    'with_parentheses',
    'simplify_gcf', 'simplify', 'factor',
    'tens', 'ones', 'hundreds',
    'locate', 'between', 'middle', 'jump',
    'find_factors', 'find_multiples', 'common_factors',
    'commutative', 'associative', 'distributive',
    'roll', 'faces', 'edges', 'vertices',
    'length', 'weight', 'volume',
    'range', 'mean', 'median', 'mode',
    'quadrant', 'distance', 'midpoint', 'slope',
    'parallel', 'perpendicular', 'intersecting', 'real_world_lines',
    'triangle', 'rectangle', 'square',
    'add_visual', 'subtract_visual', // visual aid offsets word difficulty
    'diameter', 'radius', 'chord',
    'smallest', 'largest',
    'halves', 'fourths', 'equal_parts',
    'tally', 'organize',
    'plot',
    'rectangular_prism', 'cube',
    'array', 'area_model',
    'commutative', 'associative', 'distributive',
    'mean_visual',
]);

// Group C: Harder than baseline (cross-context, translation, multi-step)
const HARDER = new Set([
    'compare_diff', 'compare_different', 'compare_diff_denom',
    'missing', 'missing_part', 'find_side', 'find_dimension', 'find_term',
    'fill_in', 'find_range',
    'word', 'word_problem', 'real_world', 'sharing', 'application',
    'remaining', 'comparing', 'combining', 'part_of_whole',
    'convert', 'convert_to', 'convert_from', 'units',
    'add_diff_denom', 'subtract_diff_denom', 'add_diff', 'subtract_diff',
    'mixed_add', 'add_mixed', 'toImproper', 'toMixed',
    'of_number', 'number_line',
    'with_exponents', 'complex', 'advanced',
    'reasoning', 'setup',
    'round_add', 'round_mult',
    'forward_minutes', 'forward_hours', 'backward', 'duration', 'elapsed',
    'continuity', 'spread', 'center', 'shape', // stats interpretation
    'proof_strategy', 'methodology', 'conjecture',
    'change', // money change
    'estimate_count', // requires multi-step estimation
    'compare_mass', 'compare_capacity',
    'compare_diff_denom',
    'fraction', 'complement', // probability compound forms
    'word_problem', 'gcf_word', 'lcm_word',
    'pattern_decimal', 'scientific',
    'asymptote_vertical', 'asymptote_horizontal',
    'fold', 'surface_area', 'count_faces',
    'distance', // when in geometry context — already in BASELINE; this is fine, BASELINE wins
]);

// Per-(generator, label) overrides for cases where label semantics differ
// across families. Format: "T{tier}::{domain}::{label}" -> delta (replaces
// general rule).
const OVERRIDES = {
    // Counting sub-types: after/before are the easiest because just +/- 1
    'T1::Counting::after': -1,
    'T1::Counting::before': -1,
    'T1::Counting::count': 0,
    // Place Value: ones is easiest (digit lookup), identify is composition (+1)
    'T1::Place Value::ones': -1,
    'T1::Place Value::tens': 0,
    'T1::Place Value::identify': 0,
    // Number Lines: locate easier, jump requires addition concept (+1)
    'T1::Number Lines::locate': -1,
    'T1::Number Lines::jump': 1,
    'T1::Number Lines::between': 0,
    // Equivalent Fractions: multiply easier than divide (which is simplify-in-disguise)
    'T2::Equivalent Fractions::multiply': 0,
    'T2::Equivalent Fractions::divide': 1,
    'T2::Equivalent Fractions::identify': 1, // recognition but cross-product
    // Mixed Numbers: toMixed easier (division with remainder) than toImproper (multiply+add)
    'T2::Mixed Numbers::toMixed': 0,
    'T2::Mixed Numbers::toImproper': 0,
    // Negatives sub-types: sign rules
    'T3::Integers::add': 0,
    'T3::Integers::subtract': 1,
    'T3::Integers::multiply': 0,
    'T3::Integers::divide': 0,
    // Order of Operations difficulty escalates with nesting
    'T3::Order of Operations::basic': -1,
    'T3::Order of Operations::with_exponents': 1,
    'T3::Order of Operations::with_parentheses': 0,
    'T3::Order of Operations::complex': 2,
    // Coordinate Plane: identify/plot easier, distance/midpoint require formulas
    'T3::Coordinate Plane::identify': -1,
    'T3::Coordinate Plane::plot': -1,
    'T3::Coordinate Plane::quadrant': -1,
    'T3::Coordinate Plane::distance': 1,
    'T3::Coordinate Plane::midpoint': 1,
    // Triangles: classify easier than solve-for-side
    'T6::Triangles::classify': -1,
    'T6::Triangles::find_side': 1,
};

// ============================================================
// Read existing Q_MATRIX
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
    return { object: ctx.Q, openBrace: open, closeBrace: i };
}

const { object: Q, openBrace, closeBrace } = extractQMatrix(original);

// ============================================================
// Compute delta for an entry
// ============================================================
function deltaFor(key) {
    if (key in OVERRIDES) return OVERRIDES[key];
    const parts = key.split('::');
    if (parts.length < 3) return 0; // coarse keys: no calibration
    const label = parts.slice(2).join('::');
    if (EASIER.has(label)) return -1;
    if (HARDER.has(label)) return 1;
    return 0; // BASELINE or unknown: leave at parent
}

// ============================================================
// Find parent's difficulty (the coarse key)
// ============================================================
function parentDifficulty(key) {
    const parts = key.split('::');
    if (parts.length < 3) return null;
    const coarse = `${parts[0]}::${parts.slice(1, -1).join('::')}`;
    return Q[coarse] ? Q[coarse].difficulty : null;
}

// ============================================================
// Apply calibration
// ============================================================
const updates = []; // { key, oldDiff, newDiff }
let countByDelta = { '-1': 0, '0': 0, '1': 0, '2': 0 };

for (const [key, entry] of Object.entries(Q)) {
    const parts = key.split('::');
    if (parts.length < 3) continue; // skip coarse
    if (entry.confidence === 'manual') continue; // don't touch human-reviewed entries
    const parent = parentDifficulty(key);
    if (parent == null) continue;
    const delta = deltaFor(key);
    countByDelta[String(delta)] = (countByDelta[String(delta)] || 0) + 1;
    const newDiff = Math.max(1, Math.min(5, parent + delta));
    if (newDiff !== entry.difficulty || entry.confidence !== 'calibrated') {
        updates.push({ key, oldDiff: entry.difficulty, newDiff, delta });
    }
}

console.error(`Total granular entries: ${Object.keys(Q).filter(k => k.split('::').length >= 3).length}`);
console.error(`Updates to apply:       ${updates.length}`);
console.error(`Delta distribution:`);
for (const [d, n] of Object.entries(countByDelta)) {
    console.error(`  delta ${d.padStart(3, ' ')}: ${n}`);
}

// ============================================================
// Rewrite the Q_MATRIX block with updated difficulty + confidence
// ============================================================
const updateMap = new Map(updates.map(u => [u.key, u.newDiff]));

// Walk the Q_MATRIX literal and rewrite each granular entry's
// difficulty + confidence in place. We do this with a targeted regex
// that only matches Q_MATRIX-shaped entries (key + object literal).
const literalStart = openBrace;
const literalEnd = closeBrace + 1;
const before = original.slice(0, literalStart);
const after = original.slice(literalEnd);

// Match: "key": { primary_skill: ..., secondary_skills: ..., difficulty: N, discrimination: ..., confidence: "..." }
// We need to rewrite difficulty and confidence per entry. Build a new literal.
let body = original.slice(literalStart, literalEnd);

// Strategy: for each entry to update, find its line (a single-line literal
// with key + properties on one line) and rewrite the difficulty + confidence.
let touched = 0;
for (const u of updates) {
    const keyLiteral = JSON.stringify(u.key);
    // Find the entry's line. Use a regex that matches the exact key.
    const lineRe = new RegExp(
        `(${escapeRegExp(keyLiteral)}\\s*:\\s*\\{[^\\n]*?difficulty:\\s*)\\d+([^\\n]*?confidence:\\s*")([^"]+)(")`,
        'g'
    );
    const replaced = body.replace(lineRe, (m, p1, p2, p3, p4) => {
        touched++;
        const newConf = p3 === 'manual' ? 'manual' : 'calibrated';
        return `${p1}${u.newDiff}${p2}${newConf}${p4}`;
    });
    body = replaced;
}

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const mutated = before + body + after;
fs.writeFileSync(FILE, mutated);

console.error(``);
console.error(`Calibration applied to ${touched} entries.`);
console.error(`Wrote ${FILE}`);
