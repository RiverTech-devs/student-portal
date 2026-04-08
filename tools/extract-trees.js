#!/usr/bin/env node
/**
 * Phase 0.1 & 0.2: Extract existing tree data from SkillTreeViewer.html
 * and parse master_tree.csv into structured JSON.
 *
 * Usage: node tools/extract-trees.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT, 'SkillTreeViewer.html');
const CSV_PATH = path.join(ROOT, 'Trees', 'master_tree.csv');
const EXISTING_DIR = path.join(ROOT, 'data', 'existing');
const CSV_DIR = path.join(ROOT, 'data', 'csv');

// ============================================================
// Phase 0.1: Extract existing tree data from SkillTreeViewer.html
// ============================================================

function extractExistingTrees() {
    console.log('=== Phase 0.1: Extracting existing tree data ===\n');
    const html = fs.readFileSync(HTML_PATH, 'utf-8');

    const subjects = ['Art', 'Math', 'Science', 'Reading', 'Programming', 'Robotics'];

    for (const subject of subjects) {
        const methodName = `load${subject}Data`;
        // Find the actual method definition (with opening brace), not a reference
        const methodPattern = new RegExp(methodName + '\\(\\)\\s*\\{');
        const methodMatch = methodPattern.exec(html);
        if (!methodMatch) {
            console.error(`Could not find ${methodName}() { definition in HTML`);
            continue;
        }
        const methodStart = methodMatch.index;

        // Find the next loadXxxData() { definition to determine boundary
        const nextMethodIdx = findNextMethodDef(html, methodStart + methodMatch[0].length, subjects, subject);
        const methodBody = html.substring(methodStart, nextMethodIdx);

        // Extract SKILL_TREE
        const skillTree = extractObject(methodBody, 'this.SKILL_TREE');

        // Extract CONNECTIONS
        const connections = extractArray(methodBody, 'this.CONNECTIONS');

        // Extract CONSTELLATION_COLORS
        const constellationColors = extractObject(methodBody, 'this.CONSTELLATION_COLORS');

        // Extract CONSTELLATION_POSITIONS
        const constellationPositions = extractObject(methodBody, 'this.CONSTELLATION_POSITIONS');

        const nodeCount = Object.keys(skillTree).length;
        const connectionCount = connections.length;
        const constellations = [...new Set(Object.values(skillTree).map(n => n.constellation))];

        const output = {
            subject,
            nodeCount,
            connectionCount,
            constellations,
            skills: skillTree,
            connections,
            constellationColors,
            constellationPositions
        };

        const outPath = path.join(EXISTING_DIR, `${subject.toLowerCase()}.json`);
        fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
        console.log(`  ${subject}: ${nodeCount} nodes, ${connectionCount} connections, ${constellations.length} constellations → ${path.basename(outPath)}`);
    }
}

function findNextMethodDef(html, afterIdx, subjects, currentSubject) {
    let earliest = html.length;
    for (const s of subjects) {
        if (s === currentSubject) continue;
        const pattern = new RegExp(`load${s}Data\\(\\)\\s*\\{`);
        const match = pattern.exec(html.substring(afterIdx));
        if (match) {
            const absIdx = afterIdx + match.index;
            // Walk back to newline
            const lineStart = html.lastIndexOf('\n', absIdx);
            if (lineStart < earliest) earliest = lineStart;
        }
    }
    return earliest;
}

function extractObject(code, varName) {
    // Find "varName = {" and extract the balanced braces
    const pattern = varName.replace('.', '\\.') + '\\s*=\\s*\\{';
    const regex = new RegExp(pattern);
    const match = code.match(regex);
    if (!match) {
        console.warn(`    Could not find ${varName} assignment`);
        return {};
    }

    const assignIdx = match.index;
    const startBrace = code.indexOf('{', assignIdx + varName.length);
    const objStr = extractBalanced(code, startBrace, '{', '}');

    // Use Function() eval — safe since we control the source file
    return evalSafeObject(objStr);
}

function extractArray(code, varName) {
    const pattern = varName.replace('.', '\\.') + '\\s*=\\s*\\[';
    const regex = new RegExp(pattern);
    const match = code.match(regex);
    if (!match) {
        console.warn(`    Could not find ${varName} array`);
        return [];
    }

    const assignIdx = match.index;
    const startBracket = code.indexOf('[', assignIdx + varName.length);
    const arrStr = extractBalanced(code, startBracket, '[', ']');

    return evalSafeArray(arrStr);
}

function extractBalanced(code, startIdx, open, close) {
    let depth = 0;
    let i = startIdx;
    while (i < code.length) {
        if (code[i] === open) depth++;
        else if (code[i] === close) {
            depth--;
            if (depth === 0) return code.substring(startIdx, i + 1);
        }
        i++;
    }
    return code.substring(startIdx);
}

function parseJSObject(objStr) {
    // Convert JS object literal to something JSON.parse can handle
    // Replace unquoted keys with quoted keys
    let json = objStr
        // Handle keys that aren't quoted (word characters, spaces, &, /, etc.)
        .replace(/(\{|,)\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[\w\s&/\-().]+)\s*:/g, (match, prefix, key) => {
            key = key.trim();
            if (key.startsWith('"') || key.startsWith("'")) {
                // Already quoted — normalize to double quotes
                key = key.replace(/^'|'$/g, '"');
                return `${prefix} ${key}:`;
            }
            return `${prefix} "${key}":`;
        })
        // Replace single-quoted values with double-quoted
        .replace(/:\s*'([^']*)'/g, ': "$1"')
        // Remove trailing commas before } or ]
        .replace(/,\s*([\]}])/g, '$1');

    try {
        return JSON.parse(json);
    } catch (e) {
        // Fallback: evaluate as JS (safe since we control the source)
        return evalSafeObject(objStr);
    }
}

function parseJSArray(arrStr) {
    // The CONNECTIONS arrays contain nested arrays of strings
    let json = arrStr
        .replace(/'/g, '"')
        .replace(/,\s*([\]}])/g, '$1');

    try {
        return JSON.parse(json);
    } catch (e) {
        return evalSafeArray(arrStr);
    }
}

function evalSafeObject(str) {
    // Use Function constructor to safely eval JS object literals
    try {
        const fn = new Function(`return (${str})`);
        return fn();
    } catch (e) {
        console.error('Failed to parse object:', e.message);
        return {};
    }
}

function evalSafeArray(str) {
    try {
        const fn = new Function(`return (${str})`);
        return fn();
    } catch (e) {
        console.error('Failed to parse array:', e.message);
        return [];
    }
}

// ============================================================
// Phase 0.2: Parse master_tree.csv
// ============================================================

function parseCSV() {
    console.log('\n=== Phase 0.2: Parsing master_tree.csv ===\n');
    const raw = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = raw.trim().split('\n');

    // Header: ID,Name,Domain,PathType,Stage,PrimaryPath,Prerequisites,LeadsTo,CrossLinks,Demonstration
    const header = lines[0].split(',').map(h => h.trim());
    console.log(`  Header: ${header.join(', ')}`);

    const nodes = [];
    const edges = [];
    const seenIds = new Set();
    const duplicateIds = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV carefully — Demonstration field may contain commas
        const fields = parseCSVLine(line, header.length);
        if (fields.length < header.length) {
            console.warn(`  Line ${i + 1}: expected ${header.length} fields, got ${fields.length}: "${line.substring(0, 60)}..."`);
            continue;
        }

        const row = {};
        header.forEach((h, idx) => { row[h] = fields[idx]; });

        // Track duplicates — we only want lines 1-241 (the detailed set)
        if (seenIds.has(row.ID)) {
            // This is the start of the condensed set — stop here
            console.log(`  Stopping at line ${i + 1}: duplicate ID "${row.ID}" (condensed set begins)`);
            break;
        }
        seenIds.add(row.ID);

        const node = {
            id: row.ID.trim(),
            title: row.Name.trim(),
            domain: row.Domain.trim(),
            path_type: row.PathType.trim(),
            stage: row.Stage.trim(),
            primary_path: row.PrimaryPath.trim() === 'TRUE',
            prerequisites: row.Prerequisites ? row.Prerequisites.trim().split('|').filter(Boolean) : [],
            leads_to: row.LeadsTo ? row.LeadsTo.trim().split('|').filter(Boolean) : [],
            cross_links: row.CrossLinks ? row.CrossLinks.trim().split('|').filter(Boolean) : [],
            demonstration: row.Demonstration ? row.Demonstration.trim() : ''
        };

        nodes.push(node);

        // Derive edges from Prerequisites (hard prerequisite)
        for (const prereq of node.prerequisites) {
            edges.push({
                from: prereq,
                to: node.id,
                type: 'prerequisite_hard'
            });
        }

        // Derive edges from LeadsTo
        for (const target of node.leads_to) {
            edges.push({
                from: node.id,
                to: target,
                type: 'leads_to'
            });
        }

        // Derive edges from CrossLinks (cross-domain)
        for (const link of node.cross_links) {
            edges.push({
                from: node.id,
                to: link,
                type: 'cross_domain'
            });
        }
    }

    // Group by domain
    const domains = {};
    for (const node of nodes) {
        if (!domains[node.domain]) domains[node.domain] = [];
        domains[node.domain].push(node);
    }

    console.log(`\n  Parsed ${nodes.length} nodes, ${edges.length} edges across ${Object.keys(domains).length} domains:`);
    for (const [domain, domainNodes] of Object.entries(domains)) {
        const spineCount = domainNodes.filter(n => n.path_type === 'Spine').length;
        const branchCount = domainNodes.filter(n => n.path_type === 'Branch').length;
        const leafCount = domainNodes.filter(n => n.path_type === 'Leaf').length;
        console.log(`    ${domain}: ${domainNodes.length} nodes (${spineCount} spine, ${branchCount} branch, ${leafCount} leaf)`);
    }

    // Validate cross-links
    const allIds = new Set(nodes.map(n => n.id));
    let brokenLinks = 0;
    for (const edge of edges) {
        if (!allIds.has(edge.from) && edge.type !== 'prerequisite_hard') {
            brokenLinks++;
        }
        if (!allIds.has(edge.to)) {
            brokenLinks++;
        }
    }
    console.log(`\n  Cross-link validation: ${brokenLinks} broken references`);

    const output = {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        domains: Object.keys(domains),
        nodes,
        edges
    };

    const outPath = path.join(CSV_DIR, 'master_graph.json');
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`  Output: ${path.basename(outPath)}`);

    return output;
}

function parseCSVLine(line, expectedFields) {
    // Simple CSV parser that handles the fact that Demonstration field
    // may contain commas. We know the first 9 fields are simple.
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            fields.push(current.trim());
            current = '';
            // If we've collected all fields except the last, take the rest as-is
            if (fields.length === expectedFields - 1) {
                fields.push(line.substring(i + 1).trim());
                return fields;
            }
        } else {
            current += ch;
        }
    }
    fields.push(current.trim());
    return fields;
}

// ============================================================
// Run both extractions
// ============================================================

try {
    extractExistingTrees();
    parseCSV();
    console.log('\n=== Phase 0.1 & 0.2 complete ===');
} catch (e) {
    console.error('Error:', e);
    process.exit(1);
}
