#!/usr/bin/env node
/**
 * Phase 0.3: Merge existing trees + CSV into 9 unified domains.
 *
 * Strategy:
 *   - Math: Keep existing 193 nodes, map CSV M1-M40 as ID anchors
 *   - Technology: Merge Programming (56) + Robotics (100) + CSV Tech (33)
 *   - Creative: Merge Art (73) + CSV Creative (22)
 *   - Language: Merge Reading (19) + CSV Language (27)
 *   - Science: Merge existing (20) + CSV (29)
 *   - Bible, LifeSkills, Physical, Social: CSV only
 *
 * Usage: node tools/merge-trees.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXISTING_DIR = path.join(ROOT, 'data', 'existing');
const CSV_PATH = path.join(ROOT, 'data', 'csv', 'master_graph.json');
const OUT_DIR = path.join(ROOT, 'data', 'compiled');

// Load sources
const csvData = JSON.parse(fs.readFileSync(CSV_PATH, 'utf-8'));
const existingArt = JSON.parse(fs.readFileSync(path.join(EXISTING_DIR, 'art.json'), 'utf-8'));
const existingMath = JSON.parse(fs.readFileSync(path.join(EXISTING_DIR, 'math.json'), 'utf-8'));
const existingScience = JSON.parse(fs.readFileSync(path.join(EXISTING_DIR, 'science.json'), 'utf-8'));
const existingReading = JSON.parse(fs.readFileSync(path.join(EXISTING_DIR, 'reading.json'), 'utf-8'));
const existingProgramming = JSON.parse(fs.readFileSync(path.join(EXISTING_DIR, 'programming.json'), 'utf-8'));
const existingRobotics = JSON.parse(fs.readFileSync(path.join(EXISTING_DIR, 'robotics.json'), 'utf-8'));

// CSV nodes grouped by domain
const csvByDomain = {};
for (const node of csvData.nodes) {
    if (!csvByDomain[node.domain]) csvByDomain[node.domain] = [];
    csvByDomain[node.domain].push(node);
}

// Master output
const allNodes = [];
const allEdges = [];
const allClusters = [];

// ============================================================
// Utility: Convert existing tree skills to unified node format
// ============================================================

function convertExistingNodes(existing, domain, idPrefix, clusterMap) {
    const nodes = [];
    const skills = existing.skills;
    const skillNames = Object.keys(skills);
    let counter = 1;

    for (const name of skillNames) {
        const skill = skills[name];
        const id = `${idPrefix}${String(counter).padStart(3, '0')}`;
        counter++;

        // Determine stage from constellation position (rough heuristic based on y-coordinate)
        // Lower y = higher on screen = more advanced (in most existing trees)
        const stage = inferStage(skill, existing);

        // Determine path_type
        const isRoot = skill.type === 'root';
        const hasOutgoing = existing.connections.some(c => c[0] === name);
        const hasIncoming = existing.connections.some(c => c[1] === name);
        const isLeaf = hasIncoming && !hasOutgoing;

        let path_type = 'Spine'; // default
        if (isLeaf) path_type = 'Leaf';
        // Branches are harder to detect — use constellation as hint
        if (clusterMap && clusterMap[skill.constellation] === 'Branch') {
            path_type = 'Branch';
        }

        nodes.push({
            id,
            title: name,
            domain,
            path_type,
            stage,
            grade_band: '', // to be filled later
            primary_path: path_type === 'Spine' || isRoot,
            cluster: skill.constellation || 'General',
            description: '',
            demonstration: '',
            mastery_criteria: [],
            evidence_types: [],
            visual: {
                x: skill.x,
                y: skill.y,
                z_group: 1,
                color_cluster: skill.constellation || 'General'
            },
            legacy_name: name,
            legacy_subject: existing.subject,
            source: 'existing'
        });
    }

    return nodes;
}

function inferStage(skill, existing) {
    // Use y-coordinate ranges to guess stage
    // Most existing trees: higher y = lower on screen = more foundational
    const y = skill.y;
    const allYs = Object.values(existing.skills).map(s => s.y);
    const minY = Math.min(...allYs);
    const maxY = Math.max(...allYs);
    const range = maxY - minY || 1;
    const normalized = (y - minY) / range; // 0 = top/advanced, 1 = bottom/foundational

    // Map to stages (higher y = Foundations, lower y = Mastery)
    if (normalized >= 0.8) return 'Foundations';
    if (normalized >= 0.6) return 'Fluency';
    if (normalized >= 0.4) return 'Application';
    if (normalized >= 0.2) return 'Integration';
    return 'Mastery';
}

function convertExistingEdges(existing, nodesByLegacyName) {
    const edges = [];
    for (const [from, to] of existing.connections) {
        const fromNode = nodesByLegacyName[from];
        const toNode = nodesByLegacyName[to];
        if (fromNode && toNode) {
            edges.push({
                from: fromNode.id,
                to: toNode.id,
                type: 'prerequisite_hard'
            });
        }
    }
    return edges;
}

function convertExistingClusters(existing, domain) {
    const clusters = [];
    for (const [name, color] of Object.entries(existing.constellationColors || {})) {
        const pos = (existing.constellationPositions || {})[name];
        clusters.push({
            id: `${domain.toLowerCase()}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            domain,
            name,
            color,
            label_position: pos || null
        });
    }
    return clusters;
}

// ============================================================
// CSV-only domains: Bible, LifeSkills, Physical, Social
// ============================================================

function addCSVOnlyDomain(domainName) {
    console.log(`\n  ${domainName}: CSV only`);
    const csvNodes = csvByDomain[domainName] || [];

    for (const csvNode of csvNodes) {
        allNodes.push({
            id: csvNode.id,
            title: csvNode.title,
            domain: domainName,
            path_type: csvNode.path_type,
            stage: csvNode.stage,
            grade_band: '',
            primary_path: csvNode.primary_path,
            cluster: inferClusterFromCSV(csvNode),
            description: '',
            demonstration: csvNode.demonstration,
            mastery_criteria: csvNode.demonstration ? [csvNode.demonstration] : [],
            evidence_types: [],
            visual: { x: 0, y: 0, z_group: 1, color_cluster: inferClusterFromCSV(csvNode) },
            legacy_name: null,
            legacy_subject: null,
            source: 'csv'
        });
    }

    // Add edges from CSV
    const csvEdges = csvData.edges.filter(e => {
        const fromNode = csvData.nodes.find(n => n.id === e.from);
        const toNode = csvData.nodes.find(n => n.id === e.to);
        return (fromNode && fromNode.domain === domainName) || (toNode && toNode.domain === domainName);
    });

    for (const edge of csvEdges) {
        // Only add edges where both nodes exist or it's a cross-domain link
        allEdges.push({ from: edge.from, to: edge.to, type: edge.type });
    }

    console.log(`    Added ${csvNodes.length} nodes from CSV`);
}

function inferClusterFromCSV(csvNode) {
    // Use stage as a rough cluster grouping for CSV-only nodes
    return csvNode.stage;
}

// ============================================================
// Math: Keep existing 193, map CSV as anchors
// ============================================================

function mergeMath() {
    console.log('\n  Math: Existing (193) + CSV overlay');

    // Convert existing
    const mathNodes = convertExistingNodes(existingMath, 'Math', 'M-', null);
    const nodesByName = {};
    for (const n of mathNodes) { nodesByName[n.legacy_name] = n; }

    // Map CSV M1-M40 to existing nodes where names align
    const csvMath = csvByDomain['Math'] || [];
    const mapped = [];
    const unmapped = [];

    for (const csvNode of csvMath) {
        const match = findBestMatch(csvNode.title, Object.keys(existingMath.skills));
        if (match) {
            // Map CSV ID and metadata onto existing node
            const existing = nodesByName[match];
            if (existing) {
                existing.csv_id = csvNode.id;
                existing.demonstration = csvNode.demonstration;
                existing.stage = csvNode.stage; // CSV stage is more authoritative
                existing.path_type = csvNode.path_type;
                existing.primary_path = csvNode.primary_path;
                if (csvNode.demonstration) {
                    existing.mastery_criteria = [csvNode.demonstration];
                }
                mapped.push(`${csvNode.id} "${csvNode.title}" → "${match}"`);
            }
        } else {
            // CSV node doesn't match any existing — add as new
            unmapped.push(csvNode);
        }
    }

    // Add existing nodes
    allNodes.push(...mathNodes);

    // Add unmapped CSV nodes as new
    for (const csvNode of unmapped) {
        allNodes.push({
            id: csvNode.id,
            title: csvNode.title,
            domain: 'Math',
            path_type: csvNode.path_type,
            stage: csvNode.stage,
            grade_band: '',
            primary_path: csvNode.primary_path,
            cluster: inferClusterFromCSV(csvNode),
            description: '',
            demonstration: csvNode.demonstration,
            mastery_criteria: csvNode.demonstration ? [csvNode.demonstration] : [],
            evidence_types: [],
            visual: { x: 0, y: 0, z_group: 1, color_cluster: 'Math' },
            legacy_name: null,
            legacy_subject: null,
            source: 'csv'
        });
    }

    // Convert existing edges
    allEdges.push(...convertExistingEdges(existingMath, nodesByName));

    // Add CSV edges (using csv_id or direct id)
    addCSVEdgesForDomain('Math', mathNodes);

    // Clusters
    allClusters.push(...convertExistingClusters(existingMath, 'Math'));

    console.log(`    Existing: ${mathNodes.length} nodes`);
    console.log(`    CSV mapped: ${mapped.length}`);
    console.log(`    CSV new: ${unmapped.length}`);
    console.log(`    Mapped examples: ${mapped.slice(0, 3).join('; ')}`);
}

// ============================================================
// Technology: Programming + Robotics + CSV Tech
// ============================================================

function mergeTechnology() {
    console.log('\n  Technology: Programming (56) + Robotics (100) + CSV Tech (33)');

    // Convert Programming nodes with "Software Development" sub-prefix
    const progNodes = convertExistingNodes(existingProgramming, 'Technology', 'T-SD', null);
    for (const n of progNodes) { n.cluster = `Software: ${n.cluster}`; }

    // Convert Robotics nodes with "Robotics" sub-prefix
    const roboNodes = convertExistingNodes(existingRobotics, 'Technology', 'T-RB', null);
    for (const n of roboNodes) { n.cluster = `Robotics: ${n.cluster}`; }

    const nodesByName = {};
    for (const n of [...progNodes, ...roboNodes]) { nodesByName[n.legacy_name] = n; }

    // Add CSV Tech nodes that don't overlap
    const csvTech = csvByDomain['Technology'] || [];
    const newCSVNodes = [];

    for (const csvNode of csvTech) {
        const match = findBestMatch(csvNode.title, Object.keys(nodesByName));
        if (match) {
            const existing = nodesByName[match];
            existing.csv_id = csvNode.id;
            existing.demonstration = csvNode.demonstration;
            existing.stage = csvNode.stage;
            existing.path_type = csvNode.path_type;
            if (csvNode.demonstration) {
                existing.mastery_criteria = [csvNode.demonstration];
            }
        } else {
            newCSVNodes.push(csvNode);
        }
    }

    allNodes.push(...progNodes, ...roboNodes);

    for (const csvNode of newCSVNodes) {
        allNodes.push({
            id: csvNode.id,
            title: csvNode.title,
            domain: 'Technology',
            path_type: csvNode.path_type,
            stage: csvNode.stage,
            grade_band: '',
            primary_path: csvNode.primary_path,
            cluster: `Tech: ${csvNode.stage}`,
            description: '',
            demonstration: csvNode.demonstration,
            mastery_criteria: csvNode.demonstration ? [csvNode.demonstration] : [],
            evidence_types: [],
            visual: { x: 0, y: 0, z_group: 1, color_cluster: 'Technology' },
            legacy_name: null,
            legacy_subject: null,
            source: 'csv'
        });
    }

    // Edges
    allEdges.push(...convertExistingEdges(existingProgramming, nodesByName));
    allEdges.push(...convertExistingEdges(existingRobotics, nodesByName));
    addCSVEdgesForDomain('Technology', [...progNodes, ...roboNodes]);

    // Clusters
    allClusters.push(...convertExistingClusters(existingProgramming, 'Technology'));
    allClusters.push(...convertExistingClusters(existingRobotics, 'Technology'));

    console.log(`    Programming: ${progNodes.length} nodes`);
    console.log(`    Robotics: ${roboNodes.length} nodes`);
    console.log(`    CSV new: ${newCSVNodes.length} nodes`);
}

// ============================================================
// Creative: Art + CSV Creative
// ============================================================

function mergeCreative() {
    console.log('\n  Creative: Art (73) + CSV Creative (22)');

    const artNodes = convertExistingNodes(existingArt, 'Creative', 'CR-', null);
    const nodesByName = {};
    for (const n of artNodes) { nodesByName[n.legacy_name] = n; }

    const csvCreative = csvByDomain['Creative'] || [];
    const newCSVNodes = [];

    for (const csvNode of csvCreative) {
        const match = findBestMatch(csvNode.title, Object.keys(nodesByName));
        if (match) {
            const existing = nodesByName[match];
            existing.csv_id = csvNode.id;
            existing.demonstration = csvNode.demonstration;
            existing.stage = csvNode.stage;
            existing.path_type = csvNode.path_type;
            if (csvNode.demonstration) existing.mastery_criteria = [csvNode.demonstration];
        } else {
            newCSVNodes.push(csvNode);
        }
    }

    allNodes.push(...artNodes);

    for (const csvNode of newCSVNodes) {
        allNodes.push({
            id: csvNode.id,
            title: csvNode.title,
            domain: 'Creative',
            path_type: csvNode.path_type,
            stage: csvNode.stage,
            grade_band: '',
            primary_path: csvNode.primary_path,
            cluster: `Creative: ${csvNode.stage}`,
            description: '',
            demonstration: csvNode.demonstration,
            mastery_criteria: csvNode.demonstration ? [csvNode.demonstration] : [],
            evidence_types: [],
            visual: { x: 0, y: 0, z_group: 1, color_cluster: 'Creative' },
            legacy_name: null,
            legacy_subject: null,
            source: 'csv'
        });
    }

    allEdges.push(...convertExistingEdges(existingArt, nodesByName));
    addCSVEdgesForDomain('Creative', artNodes);
    allClusters.push(...convertExistingClusters(existingArt, 'Creative'));

    console.log(`    Art existing: ${artNodes.length} nodes`);
    console.log(`    CSV new: ${newCSVNodes.length} nodes`);
}

// ============================================================
// Language: Reading + CSV Language
// ============================================================

function mergeLanguage() {
    console.log('\n  Language: Reading (19) + CSV Language (27)');

    const readNodes = convertExistingNodes(existingReading, 'Language', 'L-', null);
    const nodesByName = {};
    for (const n of readNodes) { nodesByName[n.legacy_name] = n; }

    const csvLang = csvByDomain['Language'] || [];
    const newCSVNodes = [];

    for (const csvNode of csvLang) {
        const match = findBestMatch(csvNode.title, Object.keys(nodesByName));
        if (match) {
            const existing = nodesByName[match];
            existing.csv_id = csvNode.id;
            existing.demonstration = csvNode.demonstration;
            existing.stage = csvNode.stage;
            existing.path_type = csvNode.path_type;
            if (csvNode.demonstration) existing.mastery_criteria = [csvNode.demonstration];
        } else {
            newCSVNodes.push(csvNode);
        }
    }

    allNodes.push(...readNodes);

    for (const csvNode of newCSVNodes) {
        allNodes.push({
            id: csvNode.id,
            title: csvNode.title,
            domain: 'Language',
            path_type: csvNode.path_type,
            stage: csvNode.stage,
            grade_band: '',
            primary_path: csvNode.primary_path,
            cluster: `Language: ${csvNode.stage}`,
            description: '',
            demonstration: csvNode.demonstration,
            mastery_criteria: csvNode.demonstration ? [csvNode.demonstration] : [],
            evidence_types: [],
            visual: { x: 0, y: 0, z_group: 1, color_cluster: 'Language' },
            legacy_name: null,
            legacy_subject: null,
            source: 'csv'
        });
    }

    allEdges.push(...convertExistingEdges(existingReading, nodesByName));
    addCSVEdgesForDomain('Language', readNodes);
    allClusters.push(...convertExistingClusters(existingReading, 'Language'));

    console.log(`    Reading existing: ${readNodes.length} nodes`);
    console.log(`    CSV new: ${newCSVNodes.length} nodes`);
}

// ============================================================
// Science: Existing + CSV (CSV has better branching)
// ============================================================

function mergeScience() {
    console.log('\n  Science: Existing (20) + CSV (29)');

    const sciNodes = convertExistingNodes(existingScience, 'Science', 'SC-EX', null);
    const nodesByName = {};
    for (const n of sciNodes) { nodesByName[n.legacy_name] = n; }

    const csvSci = csvByDomain['Science'] || [];
    const newCSVNodes = [];

    for (const csvNode of csvSci) {
        const match = findBestMatch(csvNode.title, Object.keys(nodesByName));
        if (match) {
            const existing = nodesByName[match];
            existing.csv_id = csvNode.id;
            existing.demonstration = csvNode.demonstration;
            existing.stage = csvNode.stage;
            existing.path_type = csvNode.path_type;
            if (csvNode.demonstration) existing.mastery_criteria = [csvNode.demonstration];
        } else {
            newCSVNodes.push(csvNode);
        }
    }

    allNodes.push(...sciNodes);

    for (const csvNode of newCSVNodes) {
        allNodes.push({
            id: csvNode.id,
            title: csvNode.title,
            domain: 'Science',
            path_type: csvNode.path_type,
            stage: csvNode.stage,
            grade_band: '',
            primary_path: csvNode.primary_path,
            cluster: `Science: ${csvNode.stage}`,
            description: '',
            demonstration: csvNode.demonstration,
            mastery_criteria: csvNode.demonstration ? [csvNode.demonstration] : [],
            evidence_types: [],
            visual: { x: 0, y: 0, z_group: 1, color_cluster: 'Science' },
            legacy_name: null,
            legacy_subject: null,
            source: 'csv'
        });
    }

    allEdges.push(...convertExistingEdges(existingScience, nodesByName));
    addCSVEdgesForDomain('Science', sciNodes);
    allClusters.push(...convertExistingClusters(existingScience, 'Science'));

    console.log(`    Science existing: ${sciNodes.length} nodes`);
    console.log(`    CSV new: ${newCSVNodes.length} nodes`);
}

// ============================================================
// Helpers
// ============================================================

function findBestMatch(csvTitle, existingNames) {
    const csvLower = csvTitle.toLowerCase().trim();

    // Exact match
    for (const name of existingNames) {
        if (name.toLowerCase() === csvLower) return name;
    }

    // Contained match (CSV title is in existing name or vice versa)
    for (const name of existingNames) {
        const nameLower = name.toLowerCase();
        if (nameLower.includes(csvLower) || csvLower.includes(nameLower)) return name;
    }

    // Word overlap match (at least 2 significant words in common)
    const csvWords = csvLower.split(/[\s\-&/()]+/).filter(w => w.length > 2);
    for (const name of existingNames) {
        const nameWords = name.toLowerCase().split(/[\s\-&/()]+/).filter(w => w.length > 2);
        const overlap = csvWords.filter(w => nameWords.includes(w));
        if (overlap.length >= 2) return name;
    }

    return null;
}

function addCSVEdgesForDomain(domainName, existingNodes) {
    // Map csv_id to merged node id
    const csvIdToMergedId = {};
    for (const node of existingNodes) {
        if (node.csv_id) {
            csvIdToMergedId[node.csv_id] = node.id;
        }
    }
    // Also map direct CSV node IDs (for newly added CSV nodes)
    for (const node of allNodes) {
        if (node.domain === domainName && node.source === 'csv') {
            csvIdToMergedId[node.id] = node.id;
        }
    }

    // Add CSV edges that involve this domain
    const domainCSVNodes = (csvByDomain[domainName] || []).map(n => n.id);
    const relevantEdges = csvData.edges.filter(e =>
        domainCSVNodes.includes(e.from) || domainCSVNodes.includes(e.to)
    );

    for (const edge of relevantEdges) {
        const fromId = csvIdToMergedId[edge.from] || edge.from;
        const toId = csvIdToMergedId[edge.to] || edge.to;
        allEdges.push({ from: fromId, to: toId, type: edge.type });
    }
}

// ============================================================
// Run merge
// ============================================================

console.log('=== Phase 0.3: Merging into unified master graph ===');

mergeMath();
mergeTechnology();
mergeCreative();
mergeLanguage();
mergeScience();
addCSVOnlyDomain('Bible');
addCSVOnlyDomain('LifeSkills');
addCSVOnlyDomain('Physical');
addCSVOnlyDomain('Social');

// Deduplicate edges
const edgeSet = new Set();
const uniqueEdges = [];
for (const edge of allEdges) {
    const key = `${edge.from}→${edge.to}:${edge.type}`;
    if (!edgeSet.has(key)) {
        edgeSet.add(key);
        uniqueEdges.push(edge);
    }
}

// Resolve dangling edge references
// Build a map from CSV IDs to merged node IDs
const csvIdToMergedId = {};
for (const node of allNodes) {
    // Direct CSV node ID
    if (node.source === 'csv') {
        csvIdToMergedId[node.id] = node.id;
    }
    // Existing node with mapped csv_id
    if (node.csv_id) {
        csvIdToMergedId[node.csv_id] = node.id;
    }
}

// Resolve edges
const allNodeIds = new Set(allNodes.map(n => n.id));
let resolved = 0;
let dropped = 0;
const resolvedEdges = [];

for (const edge of uniqueEdges) {
    let from = edge.from;
    let to = edge.to;

    // Try resolving via csv_id map
    if (!allNodeIds.has(from) && csvIdToMergedId[from]) {
        from = csvIdToMergedId[from];
        resolved++;
    }
    if (!allNodeIds.has(to) && csvIdToMergedId[to]) {
        to = csvIdToMergedId[to];
        resolved++;
    }

    // Only keep edges where both endpoints exist
    if (allNodeIds.has(from) && allNodeIds.has(to)) {
        resolvedEdges.push({ from, to, type: edge.type });
    } else {
        dropped++;
    }
}

console.log(`\n  Edge resolution: ${resolved} refs resolved, ${dropped} edges dropped (missing endpoint)`);

// Deduplicate again after resolution
const finalEdgeSet = new Set();
const finalEdges = [];
for (const edge of resolvedEdges) {
    const key = `${edge.from}→${edge.to}:${edge.type}`;
    if (!finalEdgeSet.has(key)) {
        finalEdgeSet.add(key);
        finalEdges.push(edge);
    }
}

// Assign edge IDs
finalEdges.forEach((e, i) => { e.id = `E${String(i + 1).padStart(4, '0')}`; });

// Summary
console.log('\n=== Merge Summary ===');
const domainCounts = {};
for (const node of allNodes) {
    domainCounts[node.domain] = (domainCounts[node.domain] || 0) + 1;
}
for (const [domain, count] of Object.entries(domainCounts).sort((a, b) => b[1] - a[1])) {
    const fromExisting = allNodes.filter(n => n.domain === domain && n.source === 'existing').length;
    const fromCSV = allNodes.filter(n => n.domain === domain && n.source === 'csv').length;
    console.log(`  ${domain}: ${count} nodes (${fromExisting} existing + ${fromCSV} CSV)`);
}
console.log(`  TOTAL: ${allNodes.length} nodes, ${finalEdges.length} edges, ${allClusters.length} clusters`);

// Validate: check for duplicate IDs
const idSet = new Set();
const dupes = [];
for (const node of allNodes) {
    if (idSet.has(node.id)) dupes.push(node.id);
    idSet.add(node.id);
}
if (dupes.length > 0) {
    console.warn(`\n  WARNING: ${dupes.length} duplicate IDs found: ${dupes.slice(0, 10).join(', ')}`);
}

// Write outputs
fs.writeFileSync(
    path.join(OUT_DIR, 'master_graph.json'),
    JSON.stringify({ nodes: allNodes, nodeCount: allNodes.length, domains: Object.keys(domainCounts) }, null, 2)
);
fs.writeFileSync(
    path.join(OUT_DIR, 'edges.json'),
    JSON.stringify({ edges: finalEdges, edgeCount: finalEdges.length }, null, 2)
);
fs.writeFileSync(
    path.join(OUT_DIR, 'clusters.json'),
    JSON.stringify({ clusters: allClusters, clusterCount: allClusters.length }, null, 2)
);

console.log(`\n  Output files written to data/compiled/`);
console.log('=== Phase 0.3 complete ===');
