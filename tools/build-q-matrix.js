#!/usr/bin/env node
// Phase 1 Q-matrix bootstrap.
//
// Extracts the (tier, domain) keys from the `generators` object in
// games/math-dojo.html and the DOJO_TO_TREE_SKILL map, then prints an
// initial Q_MATRIX const suitable for inline embedding next to those
// existing constants.
//
// This is a one-shot bootstrapper. Once the Q_MATRIX is embedded in
// math-dojo.html, edit it there — re-running this script will not
// merge your manual edits. Re-run only when adding brand-new
// generators that aren't in DOJO_TO_TREE_SKILL yet.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MATH_DOJO = path.join(ROOT, 'games/math-dojo.html');
const MASTER_GRAPH = path.join(ROOT, 'data/compiled/master_graph.json');

const html = fs.readFileSync(MATH_DOJO, 'utf8');

function extractDojoToTreeSkill(src) {
    const start = src.indexOf('const DOJO_TO_TREE_SKILL = {');
    if (start === -1) throw new Error('DOJO_TO_TREE_SKILL not found');
    const end = src.indexOf('\n};', start);
    if (end === -1) throw new Error('DOJO_TO_TREE_SKILL terminator not found');
    const body = src.slice(start, end);
    const map = {};
    const re = /"([^"]+)"\s*:\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(body)) !== null) {
        map[m[1]] = m[2];
    }
    return map;
}

function extractGenerators(src) {
    const start = src.indexOf('const generators = {');
    if (start === -1) throw new Error('generators object not found');
    const openAt = src.indexOf('{', start);

    // Walk char-by-char, tracking brace depth relative to `generators = {`
    // so we don't confuse nested object literals with tier headers.
    //   depth 1 = inside `generators`        → tier headers live here
    //   depth 2 = inside a tier block        → generator entries live here
    //   depth 3+ = inside a generator body   → ignore
    // We also need to skip strings, template literals, and comments so
    // braces inside them don't confuse the depth counter.
    const result = {};
    let depth = 0;
    let i = openAt;
    let lineStart = src.lastIndexOf('\n', i) + 1;
    let currentTier = null;
    const tierHeaderRe = /^\s+(\d+):\s*\{/;
    // Match bare identifier keys (Counting) OR quoted string keys ("Place Value").
    const genKeyBareRe = /^\s+([A-Z][A-Za-z0-9]*?):\s*\(\s*\)\s*=>/;
    const genKeyQuotedRe = /^\s+"([^"]+)":\s*\(\s*\)\s*=>/;

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
    function skipLineComment() {
        while (i < src.length && src[i] !== '\n') i++;
        // Stop AT the \n; main loop's i++ will move past it. Update lineStart now.
        if (i < src.length) lineStart = i + 1;
    }
    function skipBlockComment() {
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
        if (ch === '/' && src[i + 1] === '/') { skipLineComment(); continue; }
        if (ch === '/' && src[i + 1] === '*') { skipBlockComment(); continue; }

        // Generator-key detection MUST run before generic string-skipping,
        // because quoted keys (`"Place Value": () => {`) start with a `"`
        // that would otherwise be consumed as a string literal.
        if (depth === 2 && (ch === '"' || /[A-Z]/.test(ch))) {
            const prefix = src.slice(lineStart, i);
            if (/^\s*$/.test(prefix)) {
                const line = getLine();
                const m = ch === '"' ? line.match(genKeyQuotedRe) : line.match(genKeyBareRe);
                if (m && currentTier !== null) {
                    const domain = m[1].trim();
                    if (!result[currentTier].includes(domain)) {
                        result[currentTier].push(domain);
                    }
                    i = lineStart + m[0].length - 1;
                    continue;
                }
            }
        }

        if (ch === '"' || ch === "'" || ch === '`') { skipString(ch); i--; continue; }

        if (ch === '{') {
            if (depth === 1) {
                const line = getLine();
                const m = line.match(tierHeaderRe);
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

const dojoMap = extractDojoToTreeSkill(html);
const gens = extractGenerators(html);
const curriculumTitles = loadCurriculumTitles();

const qMatrix = {};
const unmapped = [];
const orphanTags = [];

const tiers = Object.keys(gens).map(Number).sort((a, b) => a - b);
for (const tier of tiers) {
    for (const domain of gens[tier]) {
        const key = `T${tier}::${domain}`;
        const primary = dojoMap[domain] || domain;
        const inGraph = curriculumTitles.has(primary);
        qMatrix[key] = {
            primary_skill: primary,
            secondary_skills: [],
            difficulty: tier <= 2 ? 2 : tier <= 5 ? 3 : tier <= 7 ? 4 : 5,
            discrimination: 1.0,
            confidence: dojoMap[domain] ? 'auto' : 'placeholder'
        };
        if (!dojoMap[domain]) unmapped.push(key);
        if (!inGraph) orphanTags.push({ key, primary });
    }
}

// Emit JS literal
const lines = ['const Q_MATRIX = {'];
for (const tier of tiers) {
    lines.push(`    // ===== Tier ${tier} =====`);
    for (const domain of gens[tier]) {
        const key = `T${tier}::${domain}`;
        const entry = qMatrix[key];
        const sec = entry.secondary_skills.length
            ? `[${entry.secondary_skills.map(s => JSON.stringify(s)).join(', ')}]`
            : '[]';
        lines.push(`    ${JSON.stringify(key)}: { primary_skill: ${JSON.stringify(entry.primary_skill)}, secondary_skills: ${sec}, difficulty: ${entry.difficulty}, discrimination: ${entry.discrimination}, confidence: ${JSON.stringify(entry.confidence)} },`);
    }
}
lines.push('};');

const out = lines.join('\n');
process.stdout.write(out + '\n');

// Report to stderr so stdout stays clean for embedding
process.stderr.write(`\n--- Q-matrix bootstrap report ---\n`);
process.stderr.write(`Total generators: ${Object.values(gens).reduce((s, a) => s + a.length, 0)}\n`);
process.stderr.write(`Tiers: ${tiers.join(', ')}\n`);
process.stderr.write(`Entries flagged 'placeholder' (no DOJO_TO_TREE_SKILL mapping): ${unmapped.length}\n`);
if (unmapped.length) {
    process.stderr.write(`  ${unmapped.slice(0, 20).join('\n  ')}${unmapped.length > 20 ? `\n  ...and ${unmapped.length - 20} more` : ''}\n`);
}
process.stderr.write(`Entries whose primary_skill does NOT match any curriculum_nodes.title: ${orphanTags.length}\n`);
if (orphanTags.length) {
    for (const { key, primary } of orphanTags.slice(0, 20)) {
        process.stderr.write(`  ${key} -> "${primary}"\n`);
    }
    if (orphanTags.length > 20) process.stderr.write(`  ...and ${orphanTags.length - 20} more\n`);
}
