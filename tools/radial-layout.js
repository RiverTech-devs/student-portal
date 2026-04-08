#!/usr/bin/env node
/**
 * Upward-growing graph layout for the 9-domain network view.
 *
 * Layout concept:
 *   - 9 domains arranged in a horizontal arc at the bottom
 *   - Y-axis = progression (bottom = Foundations, top = Mastery)
 *   - Each node's X = average of its prerequisite parents' X positions
 *     (so cross-domain nodes naturally drift between their supporting domains)
 *   - Spine nodes on the domain's center column
 *   - Branch nodes offset to sides
 *   - More horizontal spread to prevent stacking
 *
 * Output: data/compiled/radial_layout.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMPILED_DIR = path.join(ROOT, 'data', 'compiled');

const masterGraph = JSON.parse(fs.readFileSync(path.join(COMPILED_DIR, 'master_graph.json'), 'utf-8'));
const edgesData = JSON.parse(fs.readFileSync(path.join(COMPILED_DIR, 'edges.json'), 'utf-8'));

// ============================================================
// Configuration
// ============================================================

const CANVAS_W = 12000;
const CANVAS_H = 8000;

// Y positions by stage (bottom to top)
const STAGE_Y = {
    'Foundations': 7200,
    'Fluency': 5600,
    'Application': 4000,
    'Integration': 2400,
    'Mastery': 900
};

// 9 domains spread across the bottom arc
const DOMAINS = [
    'Bible', 'LifeSkills', 'Social', 'Language', 'Math',
    'Science', 'Technology', 'Creative', 'Physical'
];

const DOMAIN_COLORS = {
    'Math': '#ffd700', 'Science': '#20b2aa', 'Technology': '#7b68ee',
    'Language': '#87ceeb', 'Social': '#ffa07a', 'Bible': '#c9a96e',
    'LifeSkills': '#98fb98', 'Physical': '#ff6347', 'Creative': '#dda0dd'
};

// Each domain gets a horizontal zone
const DOMAIN_SPACING = CANVAS_W / (DOMAINS.length + 1);
const DOMAIN_X = {};
DOMAINS.forEach((d, i) => {
    DOMAIN_X[d] = DOMAIN_SPACING * (i + 1);
});

// How wide each domain's column is (nodes spread within this)
const DOMAIN_WIDTH = DOMAIN_SPACING * 0.85;

// ============================================================
// Build adjacency structures
// ============================================================

console.log('=== Generating upward-growing graph layout ===\n');

const allNodes = masterGraph.nodes;
const allEdges = edgesData.edges;

const nodeMap = {};
allNodes.forEach(n => { nodeMap[n.id] = n; });

// Hard prerequisite edges only for depth + parent averaging
const parents = {};   // nodeId → [parent nodeIds]
const children = {};  // nodeId → [child nodeIds]

for (const edge of allEdges) {
    if (edge.type !== 'prerequisite_hard') continue;
    if (!nodeMap[edge.from] || !nodeMap[edge.to]) continue;

    if (!children[edge.from]) children[edge.from] = [];
    children[edge.from].push(edge.to);

    if (!parents[edge.to]) parents[edge.to] = [];
    parents[edge.to].push(edge.from);
}

// ============================================================
// Compute depths via BFS
// ============================================================

const depth = {};
const roots = allNodes.filter(n => !parents[n.id] || parents[n.id].length === 0);
const queue = [];

for (const root of roots) {
    depth[root.id] = 0;
    queue.push(root.id);
}

const visited = new Set();
while (queue.length > 0) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const child of (children[cur] || [])) {
        const nd = (depth[cur] || 0) + 1;
        if (depth[child] === undefined || nd > depth[child]) {
            depth[child] = nd;
            if (!visited.has(child)) queue.push(child);
        }
    }
}
allNodes.forEach(n => { if (depth[n.id] === undefined) depth[n.id] = 0; });

// ============================================================
// Position nodes: two passes
// Pass 1: initial placement (domain column + stage Y)
// Pass 2: average X from parents (pull toward prerequisites)
// ============================================================

const positions = {};

// Group by domain
const byDomain = {};
allNodes.forEach(n => { (byDomain[n.domain] = byDomain[n.domain] || []).push(n); });

// PASS 1: Initial placement in domain columns
for (const [domain, nodes] of Object.entries(byDomain)) {
    const centerX = DOMAIN_X[domain] || CANVAS_W / 2;
    const maxDepth = Math.max(...nodes.map(n => depth[n.id] || 0), 1);

    // Group by stage for better vertical distribution
    const byStage = {};
    nodes.forEach(n => {
        const s = n.stage || 'Application';
        (byStage[s] = byStage[s] || []).push(n);
    });

    for (const [stage, stageNodes] of Object.entries(byStage)) {
        const baseY = STAGE_Y[stage] || 4000;

        // Sort: spine first, then branch, then leaf
        const spine = stageNodes.filter(n => n.path_type === 'Spine');
        const branch = stageNodes.filter(n => n.path_type === 'Branch');
        const leaf = stageNodes.filter(n => n.path_type === 'Leaf');

        // Spine: spread along center column
        spine.forEach((n, i) => {
            const xOffset = spine.length > 1
                ? (i / (spine.length - 1) - 0.5) * DOMAIN_WIDTH * 0.5
                : 0;
            // Y jitter based on depth within stage
            const yJitter = (depth[n.id] || 0) * 30;
            positions[n.id] = {
                x: centerX + xOffset,
                y: baseY - yJitter + (i % 3 - 1) * 40
            };
        });

        // Branch: offset to the right side
        branch.forEach((n, i) => {
            const side = i % 2 === 0 ? 1 : -1;
            const xOffset = (DOMAIN_WIDTH * 0.3 + (Math.floor(i / 2)) * 60) * side;
            const yJitter = (depth[n.id] || 0) * 25;
            positions[n.id] = {
                x: centerX + xOffset,
                y: baseY - yJitter + (i % 2) * 50
            };
        });

        // Leaf: top of the domain
        leaf.forEach((n, i) => {
            const xOffset = leaf.length > 1
                ? (i / (leaf.length - 1) - 0.5) * DOMAIN_WIDTH * 0.4
                : 0;
            positions[n.id] = {
                x: centerX + xOffset,
                y: STAGE_Y['Mastery'] - 100 - i * 40
            };
        });
    }
}

// PASS 2: Average X position from parents
// Run multiple iterations to let positions settle
for (let iteration = 0; iteration < 5; iteration++) {
    let moved = 0;

    for (const node of allNodes) {
        const nodeParents = parents[node.id] || [];
        if (nodeParents.length === 0) continue;

        // Compute average X of parents
        let sumX = 0;
        let count = 0;
        for (const pid of nodeParents) {
            if (positions[pid]) {
                sumX += positions[pid].x;
                count++;
            }
        }

        if (count === 0) continue;

        const avgParentX = sumX / count;
        const currentX = positions[node.id]?.x || 0;

        // Blend: pull 40% toward parent average, keep 60% domain position
        // This keeps domain clustering while honoring multi-parent averaging
        const domainCenterX = DOMAIN_X[node.domain] || CANVAS_W / 2;
        const blendStrength = nodeParents.length > 1 ? 0.6 : 0.3; // Stronger pull for multi-parent
        const newX = currentX * (1 - blendStrength) + avgParentX * blendStrength;

        if (positions[node.id]) {
            const dx = Math.abs(positions[node.id].x - newX);
            if (dx > 5) moved++;
            positions[node.id].x = newX;
        }
    }

    if (moved === 0) break;
}

// PASS 3: De-overlap — push apart nodes that are too close
for (let iteration = 0; iteration < 3; iteration++) {
    const allPositioned = Object.entries(positions);
    for (let i = 0; i < allPositioned.length; i++) {
        for (let j = i + 1; j < allPositioned.length; j++) {
            const [idA, posA] = allPositioned[i];
            const [idB, posB] = allPositioned[j];

            const dx = posB.x - posA.x;
            const dy = posB.y - posA.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = 50; // Minimum distance between nodes

            if (dist < minDist && dist > 0) {
                const push = (minDist - dist) / 2;
                const nx = dx / dist;
                const ny = dy / dist;
                posA.x -= nx * push;
                posA.y -= ny * push;
                posB.x += nx * push;
                posB.y += ny * push;
            }
        }
    }
}

// Round all positions
for (const id of Object.keys(positions)) {
    positions[id].x = Math.round(positions[id].x);
    positions[id].y = Math.round(positions[id].y);
}

// ============================================================
// Stats
// ============================================================

for (const domain of DOMAINS) {
    const dns = byDomain[domain] || [];
    const spine = dns.filter(n => n.path_type === 'Spine').length;
    const branch = dns.filter(n => n.path_type === 'Branch').length;
    const leaf = dns.filter(n => n.path_type === 'Leaf').length;
    const cx = Math.round(DOMAIN_X[domain]);
    console.log(`  ${domain}: ${dns.length} nodes (${spine}S/${branch}B/${leaf}L) — center X: ${cx}`);
}

// ============================================================
// Output
// ============================================================

const radialNodes = allNodes.map(node => ({
    ...node,
    radial: positions[node.id] || { x: CANVAS_W / 2, y: CANVAS_H / 2 }
}));

const output = {
    canvas: { width: CANVAS_W, height: CANVAS_H },
    domains: DOMAINS.map(d => ({
        name: d,
        centerX: Math.round(DOMAIN_X[d]),
        color: DOMAIN_COLORS[d],
        nodeCount: (byDomain[d] || []).length
    })),
    stageLines: Object.entries(STAGE_Y).map(([stage, y]) => ({ stage, y })),
    nodes: radialNodes,
    nodeCount: radialNodes.length,
    edges: allEdges,
    edgeCount: allEdges.length,
    domainColors: DOMAIN_COLORS
};

const outPath = path.join(COMPILED_DIR, 'radial_layout.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log(`\n  Canvas: ${CANVAS_W}x${CANVAS_H}`);
console.log(`  Total positioned: ${Object.keys(positions).length}`);
console.log(`  Output: radial_layout.json`);
console.log('\n=== Layout complete ===');
