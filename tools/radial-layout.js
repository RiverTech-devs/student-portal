#!/usr/bin/env node
/**
 * Radial Graph Layout for the 9-domain network view.
 *
 * Layout concept:
 *   - Center of canvas = origin (0, 0)
 *   - 9 domains arranged in a circle, 40° apart
 *   - Each domain radiates outward like a spoke
 *   - Node distance from center = depth in prerequisite chain
 *     (Foundations near center, Mastery at outer edge)
 *   - Spine nodes on the radial center line
 *   - Branch nodes offset to sides within the sector
 *   - Leaf (capstone) nodes at the outermost ring
 *
 * Output: data/compiled/radial_layout.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMPILED_DIR = path.join(ROOT, 'data', 'compiled');

const masterGraph = JSON.parse(fs.readFileSync(path.join(COMPILED_DIR, 'master_graph.json'), 'utf-8'));
const edgesData = JSON.parse(fs.readFileSync(path.join(COMPILED_DIR, 'edges.json'), 'utf-8'));
const clustersData = JSON.parse(fs.readFileSync(path.join(COMPILED_DIR, 'clusters.json'), 'utf-8'));

// ============================================================
// Configuration
// ============================================================

const CENTER_X = 4000;  // Canvas center
const CENTER_Y = 4000;
const CANVAS_SIZE = 8000;

// Ring distances from center (by stage)
const STAGE_RINGS = {
    'Foundations': 600,
    'Fluency': 1200,
    'Application': 1800,
    'Integration': 2400,
    'Mastery': 3000
};

// Domain arrangement — 9 domains in a circle
const DOMAINS = [
    'Math', 'Science', 'Technology', 'Language', 'Social',
    'Bible', 'LifeSkills', 'Physical', 'Creative'
];

const DOMAIN_COLORS = {
    'Math': '#ffd700',
    'Science': '#20b2aa',
    'Technology': '#7b68ee',
    'Language': '#87ceeb',
    'Social': '#ffa07a',
    'Bible': '#c9a96e',
    'LifeSkills': '#98fb98',
    'Physical': '#ff6347',
    'Creative': '#dda0dd'
};

// Each domain gets a sector of the circle
const SECTOR_ANGLE = (2 * Math.PI) / DOMAINS.length; // ~40°
const SECTOR_SPREAD = SECTOR_ANGLE * 0.7; // How much of the sector nodes can spread across

// ============================================================
// Compute node depths using BFS from roots
// ============================================================

function computeNodeDepths(nodes, edges) {
    const nodeMap = {};
    for (const node of nodes) nodeMap[node.id] = node;

    // Build adjacency: only prerequisite_hard edges (the main flow)
    const incomingHard = {}; // nodeId → [parent nodeIds]
    const outgoingHard = {}; // nodeId → [child nodeIds]

    for (const edge of edges) {
        if (edge.type !== 'prerequisite_hard') continue;
        if (!nodeMap[edge.from] || !nodeMap[edge.to]) continue;

        if (!outgoingHard[edge.from]) outgoingHard[edge.from] = [];
        outgoingHard[edge.from].push(edge.to);

        if (!incomingHard[edge.to]) incomingHard[edge.to] = [];
        incomingHard[edge.to].push(edge.from);
    }

    // Find roots: nodes with no incoming hard prerequisites
    const roots = nodes.filter(n => !incomingHard[n.id] || incomingHard[n.id].length === 0);

    // BFS to compute depth
    const depth = {};
    const queue = [];

    for (const root of roots) {
        depth[root.id] = 0;
        queue.push(root.id);
    }

    const visited = new Set();
    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current)) continue;
        visited.add(current);
        const children = outgoingHard[current] || [];
        for (const child of children) {
            const newDepth = depth[current] + 1;
            if (depth[child] === undefined || newDepth > depth[child]) {
                depth[child] = newDepth;
                if (!visited.has(child)) {
                    queue.push(child);
                }
            }
        }
    }

    // Assign depth 0 to any orphan nodes
    for (const node of nodes) {
        if (depth[node.id] === undefined) {
            depth[node.id] = 0;
        }
    }

    return depth;
}

// ============================================================
// Generate radial positions
// ============================================================

console.log('=== Generating radial graph layout ===\n');

const allNodes = masterGraph.nodes;
const allEdges = edgesData.edges;

// Compute depths
const nodeDepths = computeNodeDepths(allNodes, allEdges);

// Group nodes by domain
const nodesByDomain = {};
for (const node of allNodes) {
    if (!nodesByDomain[node.domain]) nodesByDomain[node.domain] = [];
    nodesByDomain[node.domain].push(node);
}

// Find max depth per domain for normalization
const maxDepthByDomain = {};
for (const [domain, nodes] of Object.entries(nodesByDomain)) {
    maxDepthByDomain[domain] = Math.max(...nodes.map(n => nodeDepths[n.id] || 0), 1);
}

// Generate positions
const radialPositions = {}; // nodeId → {x, y}
const domainAnchors = {};   // domain → {angle, x, y}

for (let i = 0; i < DOMAINS.length; i++) {
    const domain = DOMAINS[i];
    const domainNodes = nodesByDomain[domain] || [];
    if (domainNodes.length === 0) continue;

    const baseAngle = i * SECTOR_ANGLE - Math.PI / 2; // Start from top
    const maxDepth = maxDepthByDomain[domain];

    // Domain anchor (label position) at middle ring
    domainAnchors[domain] = {
        angle: baseAngle,
        x: Math.round(CENTER_X + Math.cos(baseAngle) * (STAGE_RINGS['Application'])),
        y: Math.round(CENTER_Y + Math.sin(baseAngle) * (STAGE_RINGS['Application']))
    };

    // Sort nodes: Spine first, then by depth
    const spineNodes = domainNodes.filter(n => n.path_type === 'Spine').sort((a, b) => (nodeDepths[a.id] || 0) - (nodeDepths[b.id] || 0));
    const branchNodes = domainNodes.filter(n => n.path_type === 'Branch').sort((a, b) => (nodeDepths[a.id] || 0) - (nodeDepths[b.id] || 0));
    const leafNodes = domainNodes.filter(n => n.path_type === 'Leaf');

    // Position spine nodes along the radial center line
    for (let j = 0; j < spineNodes.length; j++) {
        const node = spineNodes[j];
        const depth = nodeDepths[node.id] || 0;

        // Distance from center based on stage/depth
        const stageRing = STAGE_RINGS[node.stage] || STAGE_RINGS['Application'];
        const depthFraction = maxDepth > 0 ? depth / maxDepth : 0;
        const radius = 400 + depthFraction * 2600; // 400 to 3000

        // Small angular offset within spine to prevent overlap
        const spineSpread = SECTOR_SPREAD * 0.3;
        const spineOffset = spineNodes.length > 1
            ? (j / (spineNodes.length - 1) - 0.5) * spineSpread
            : 0;

        const angle = baseAngle + spineOffset;

        radialPositions[node.id] = {
            x: Math.round(CENTER_X + Math.cos(angle) * radius),
            y: Math.round(CENTER_Y + Math.sin(angle) * radius)
        };
    }

    // Position branch nodes offset to the side
    for (let j = 0; j < branchNodes.length; j++) {
        const node = branchNodes[j];
        const depth = nodeDepths[node.id] || 0;
        const depthFraction = maxDepth > 0 ? depth / maxDepth : 0;
        const radius = 400 + depthFraction * 2600;

        // Offset to the right side of the sector
        const branchSpread = SECTOR_SPREAD * 0.5;
        const side = (j % 2 === 0) ? 1 : -1; // Alternate sides
        const branchOffset = branchSpread * 0.3 + (Math.floor(j / 2) * branchSpread * 0.15) * side;

        const angle = baseAngle + branchOffset;

        radialPositions[node.id] = {
            x: Math.round(CENTER_X + Math.cos(angle) * radius),
            y: Math.round(CENTER_Y + Math.sin(angle) * radius)
        };
    }

    // Position leaf nodes at the outermost ring
    for (let j = 0; j < leafNodes.length; j++) {
        const node = leafNodes[j];
        const radius = 3200; // Beyond mastery ring
        const leafOffset = leafNodes.length > 1
            ? (j / (leafNodes.length - 1) - 0.5) * SECTOR_SPREAD * 0.3
            : 0;

        const angle = baseAngle + leafOffset;

        radialPositions[node.id] = {
            x: Math.round(CENTER_X + Math.cos(angle) * radius),
            y: Math.round(CENTER_Y + Math.sin(angle) * radius)
        };
    }

    const totalPlaced = spineNodes.length + branchNodes.length + leafNodes.length;
    console.log(`  ${domain}: ${totalPlaced} nodes (${spineNodes.length} spine, ${branchNodes.length} branch, ${leafNodes.length} leaf) — angle: ${Math.round(baseAngle * 180 / Math.PI)}°`);
}

// ============================================================
// Build output
// ============================================================

// Create the full radial graph data structure
const radialNodes = allNodes.map(node => ({
    ...node,
    radial: radialPositions[node.id] || { x: CENTER_X, y: CENTER_Y }
}));

// Domain ring labels (for rendering concentric stage rings)
const stageRings = Object.entries(STAGE_RINGS).map(([stage, radius]) => ({
    stage,
    radius,
    cx: CENTER_X,
    cy: CENTER_Y
}));

const output = {
    canvas: { width: CANVAS_SIZE, height: CANVAS_SIZE, centerX: CENTER_X, centerY: CENTER_Y },
    domains: DOMAINS.map((d, i) => ({
        name: d,
        angle: i * SECTOR_ANGLE - Math.PI / 2,
        anchor: domainAnchors[d],
        color: DOMAIN_COLORS[d],
        nodeCount: (nodesByDomain[d] || []).length
    })),
    stageRings,
    nodes: radialNodes,
    nodeCount: radialNodes.length,
    edges: allEdges,
    edgeCount: allEdges.length,
    domainColors: DOMAIN_COLORS
};

const outPath = path.join(COMPILED_DIR, 'radial_layout.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log(`\n  Output: radial_layout.json`);
console.log(`  Canvas: ${CANVAS_SIZE}x${CANVAS_SIZE}, center at (${CENTER_X}, ${CENTER_Y})`);
console.log(`  Total nodes positioned: ${Object.keys(radialPositions).length}`);
console.log(`  Stage rings: ${Object.entries(STAGE_RINGS).map(([s,r]) => `${s}=${r}`).join(', ')}`);

console.log('\n=== Radial layout complete ===');
