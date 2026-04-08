#!/usr/bin/env node
/**
 * Phase 0.4-0.5: Assign coordinates to nodes that don't have them (CSV-only nodes)
 * and generate cluster metadata for new domains.
 *
 * Layout strategy:
 *   - Y-axis: Stage progression (Foundations at bottom → Mastery at top)
 *   - X-axis: Within-domain cluster spacing, Spine centered, Branch offset
 *   - Each domain gets its own coordinate space (like existing trees)
 *
 * Usage: node tools/assign-layout.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMPILED_DIR = path.join(ROOT, 'data', 'compiled');

const masterGraph = JSON.parse(fs.readFileSync(path.join(COMPILED_DIR, 'master_graph.json'), 'utf-8'));
const edgesData = JSON.parse(fs.readFileSync(path.join(COMPILED_DIR, 'edges.json'), 'utf-8'));
const clustersData = JSON.parse(fs.readFileSync(path.join(COMPILED_DIR, 'clusters.json'), 'utf-8'));

// Stage Y positions (in a 2400x2000 coordinate space)
const STAGE_Y = {
    'Foundations': 1800,
    'Fluency': 1400,
    'Application': 1000,
    'Integration': 600,
    'Mastery': 250
};

// Domain color palettes
const DOMAIN_COLORS = {
    'Bible': { primary: '#c9a96e', secondary: '#8b6914' },
    'Creative': { primary: '#dda0dd', secondary: '#9370db' },
    'Language': { primary: '#87ceeb', secondary: '#4682b4' },
    'LifeSkills': { primary: '#98fb98', secondary: '#2e8b57' },
    'Math': { primary: '#ffd700', secondary: '#ff8c00' },
    'Physical': { primary: '#ff6347', secondary: '#dc143c' },
    'Science': { primary: '#20b2aa', secondary: '#008080' },
    'Social': { primary: '#ffa07a', secondary: '#cd853f' },
    'Technology': { primary: '#7b68ee', secondary: '#4169e1' }
};

console.log('=== Phase 0.4: Assigning coordinates ===\n');

// Group nodes by domain
const nodesByDomain = {};
for (const node of masterGraph.nodes) {
    if (!nodesByDomain[node.domain]) nodesByDomain[node.domain] = [];
    nodesByDomain[node.domain].push(node);
}

let layoutCount = 0;

for (const [domain, nodes] of Object.entries(nodesByDomain)) {
    // Find nodes that need coordinates
    const needsLayout = nodes.filter(n => n.visual.x === 0 && n.visual.y === 0);
    const hasLayout = nodes.filter(n => n.visual.x !== 0 || n.visual.y !== 0);

    if (needsLayout.length === 0) {
        console.log(`  ${domain}: all ${nodes.length} nodes already have coordinates`);
        continue;
    }

    console.log(`  ${domain}: laying out ${needsLayout.length} of ${nodes.length} nodes`);

    // Group needs-layout nodes by stage
    const byStage = {};
    for (const node of needsLayout) {
        const stage = node.stage || 'Application';
        if (!byStage[stage]) byStage[stage] = [];
        byStage[stage].push(node);
    }

    // Determine X center for new nodes
    // If domain has existing nodes, place new ones near them
    let xCenter = 1200; // default center
    if (hasLayout.length > 0) {
        const avgX = hasLayout.reduce((sum, n) => sum + n.visual.x, 0) / hasLayout.length;
        const maxX = Math.max(...hasLayout.map(n => n.visual.x));
        // Place new nodes to the right of existing ones
        xCenter = maxX + 300;
    }

    // For purely CSV domains, space them across the canvas
    if (hasLayout.length === 0) {
        xCenter = 1200;
    }

    for (const [stage, stageNodes] of Object.entries(byStage)) {
        const baseY = STAGE_Y[stage] || 1000;

        // Sort: Spine first, then Branch, then Leaf
        stageNodes.sort((a, b) => {
            const order = { 'Spine': 0, 'Branch': 1, 'Leaf': 2 };
            return (order[a.path_type] || 1) - (order[b.path_type] || 1);
        });

        // Layout horizontally
        const spineNodes = stageNodes.filter(n => n.path_type === 'Spine');
        const branchNodes = stageNodes.filter(n => n.path_type === 'Branch');
        const leafNodes = stageNodes.filter(n => n.path_type === 'Leaf');

        // Spine: centered line
        for (let i = 0; i < spineNodes.length; i++) {
            const xOffset = (i - (spineNodes.length - 1) / 2) * 120;
            spineNodes[i].visual.x = Math.round(xCenter + xOffset);
            spineNodes[i].visual.y = Math.round(baseY + (i % 2 === 0 ? 0 : 40)); // slight zigzag
            layoutCount++;
        }

        // Branch: offset to the right
        for (let i = 0; i < branchNodes.length; i++) {
            const xOffset = 250 + i * 120;
            branchNodes[i].visual.x = Math.round(xCenter + xOffset);
            branchNodes[i].visual.y = Math.round(baseY - 50 + (i % 3) * 60);
            layoutCount++;
        }

        // Leaf: centered at top
        for (let i = 0; i < leafNodes.length; i++) {
            leafNodes[i].visual.x = Math.round(xCenter + i * 150);
            leafNodes[i].visual.y = Math.round(baseY - 30);
            layoutCount++;
        }
    }
}

console.log(`\n  Total nodes laid out: ${layoutCount}`);

// ============================================================
// Phase 0.5: Generate cluster metadata for new domains
// ============================================================

console.log('\n=== Phase 0.5: Generating cluster metadata ===\n');

const newClusters = [...clustersData.clusters];

for (const [domain, nodes] of Object.entries(nodesByDomain)) {
    // Check if domain already has clusters
    const existingClusters = newClusters.filter(c => c.domain === domain);
    if (existingClusters.length > 0) {
        console.log(`  ${domain}: ${existingClusters.length} clusters already exist`);
        continue;
    }

    // Generate clusters from stage groupings
    const stages = [...new Set(nodes.map(n => n.stage))];
    const colors = DOMAIN_COLORS[domain] || { primary: '#888888', secondary: '#666666' };

    for (const stage of stages) {
        const stageNodes = nodes.filter(n => n.stage === stage);
        if (stageNodes.length === 0) continue;

        const avgX = stageNodes.reduce((s, n) => s + n.visual.x, 0) / stageNodes.length;
        const avgY = stageNodes.reduce((s, n) => s + n.visual.y, 0) / stageNodes.length;

        const clusterId = `${domain.toLowerCase()}_${stage.toLowerCase()}`;
        newClusters.push({
            id: clusterId,
            domain,
            name: stage,
            color: colors.primary,
            label_position: { x: Math.round(avgX), y: Math.round(avgY - 60) }
        });
    }

    const newCount = stages.length;
    console.log(`  ${domain}: generated ${newCount} clusters`);
}

// Also update cluster color assignments on nodes
for (const node of masterGraph.nodes) {
    if (node.source === 'csv') {
        const colors = DOMAIN_COLORS[node.domain];
        if (colors) {
            node.visual.color_cluster = node.cluster;
        }
    }
}

// ============================================================
// Write updated outputs
// ============================================================

fs.writeFileSync(
    path.join(COMPILED_DIR, 'master_graph.json'),
    JSON.stringify({
        nodes: masterGraph.nodes,
        nodeCount: masterGraph.nodes.length,
        domains: masterGraph.domains
    }, null, 2)
);

fs.writeFileSync(
    path.join(COMPILED_DIR, 'clusters.json'),
    JSON.stringify({
        clusters: newClusters,
        clusterCount: newClusters.length,
        domainColors: DOMAIN_COLORS
    }, null, 2)
);

// Final summary
console.log('\n=== Final compiled output ===');
console.log(`  Nodes: ${masterGraph.nodes.length}`);
console.log(`  Edges: ${edgesData.edges.length}`);
console.log(`  Clusters: ${newClusters.length}`);

// Quick validation: all nodes should have non-zero coordinates now
const zeroCoords = masterGraph.nodes.filter(n => n.visual.x === 0 && n.visual.y === 0);
if (zeroCoords.length > 0) {
    console.warn(`  WARNING: ${zeroCoords.length} nodes still have (0,0) coordinates`);
} else {
    console.log(`  All nodes have coordinates assigned ✓`);
}

console.log('\n=== Phase 0.4-0.5 complete ===');
