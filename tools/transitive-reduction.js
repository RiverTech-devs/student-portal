#!/usr/bin/env node
/**
 * Transitive reduction of the prerequisite graph.
 *
 * If node X has prerequisites A and B, and B already has A as a transitive
 * prerequisite (A → ... → B), then A is redundant for X — X only needs B,
 * which already implies A.
 *
 * Removes these redundant prerequisite_hard edges so the graph shows
 * only direct, necessary prerequisites.
 *
 * Usage: node tools/transitive-reduction.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COMPILED_DIR = path.join(ROOT, 'data', 'compiled');

const masterGraph = JSON.parse(fs.readFileSync(path.join(COMPILED_DIR, 'master_graph.json'), 'utf-8'));
const edgesData = JSON.parse(fs.readFileSync(path.join(COMPILED_DIR, 'edges.json'), 'utf-8'));

console.log('=== Transitive reduction of prerequisite graph ===\n');
console.log(`Starting: ${edgesData.edges.length} total edges`);

// Build adjacency for prerequisite_hard edges only
const nodeIds = new Set(masterGraph.nodes.map(n => n.id));
const childOf = {}; // parent → [children]
const parentOf = {}; // child → [parents]

let hardEdgeCount = 0;
for (const e of edgesData.edges) {
    if (e.type !== 'prerequisite_hard') continue;
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue;
    (childOf[e.from] = childOf[e.from] || []).push(e.to);
    (parentOf[e.to] = parentOf[e.to] || []).push(e.from);
    hardEdgeCount++;
}
console.log(`  Hard prerequisite edges: ${hardEdgeCount}`);

// For each node, check if any of its parents can reach another parent
// If so, the directly-connected ancestor parent is redundant
const redundantEdges = new Set(); // "from→to" keys

// Helper: can `start` reach `target` via prereq_hard edges?
function canReach(start, target, visited = new Set()) {
    if (start === target) return true;
    if (visited.has(start)) return false;
    visited.add(start);
    for (const child of (childOf[start] || [])) {
        if (canReach(child, target, visited)) return true;
    }
    return false;
}

// For each node with multiple parents, check redundancy
// An edge A → node is redundant ONLY IF there's another parent B of node
// such that A can reach B WITHOUT going through node.
// We do this by checking if A can reach B in the subgraph that excludes node.
let checkedNodes = 0;
for (const node of masterGraph.nodes) {
    const parents = parentOf[node.id] || [];
    if (parents.length < 2) continue;
    checkedNodes++;

    // Temporarily remove `node` from the graph by skipping its outgoing edges
    function canReachExcluding(start, target, excludeNode, visited = new Set()) {
        if (start === target) return true;
        if (start === excludeNode) return false; // Don't traverse through excluded
        if (visited.has(start)) return false;
        visited.add(start);
        for (const child of (childOf[start] || [])) {
            if (child === excludeNode) continue; // Don't enter excluded
            if (canReachExcluding(child, target, excludeNode, visited)) return true;
        }
        return false;
    }

    for (const parentA of parents) {
        for (const parentB of parents) {
            if (parentA === parentB) continue;
            // Can A reach B without going through `node`?
            if (canReachExcluding(parentA, parentB, node.id)) {
                redundantEdges.add(`${parentA}→${node.id}`);
                break;
            }
        }
    }
}

console.log(`  Checked ${checkedNodes} nodes with multiple parents`);
console.log(`  Found ${redundantEdges.size} redundant prerequisite edges`);

if (redundantEdges.size > 0) {
    // Show some examples
    console.log('\n  Examples:');
    const nodeMap = {};
    masterGraph.nodes.forEach(n => { nodeMap[n.id] = n; });
    const examples = [...redundantEdges].slice(0, 10);
    for (const key of examples) {
        const [from, to] = key.split('→');
        const f = nodeMap[from];
        const t = nodeMap[to];
        console.log(`    ${from} (${f?.title}) → ${to} (${t?.title})`);
    }
}

// Remove redundant edges
const before = edgesData.edges.length;
edgesData.edges = edgesData.edges.filter(e => {
    if (e.type !== 'prerequisite_hard') return true;
    return !redundantEdges.has(`${e.from}→${e.to}`);
});
const removed = before - edgesData.edges.length;
edgesData.edgeCount = edgesData.edges.length;

console.log(`\n  Removed ${removed} edges`);
console.log(`  Total edges now: ${edgesData.edges.length}`);

// Verify no orphans created
const newParents = {};
for (const e of edgesData.edges) {
    if (e.type !== 'prerequisite_hard') continue;
    (newParents[e.to] = newParents[e.to] || []).push(e.from);
}
function canReachRoot(id, vis = new Set()) {
    if (vis.has(id)) return false; vis.add(id);
    if (!newParents[id] || newParents[id].length === 0) return true;
    for (const p of newParents[id]) {
        if (nodeIds.has(p) && canReachRoot(p, vis)) return true;
    }
    return false;
}
let orphans = 0;
for (const n of masterGraph.nodes) {
    if (!canReachRoot(n.id)) orphans++;
}
console.log(`  Orphans after reduction: ${orphans}`);

if (orphans === 0) {
    fs.writeFileSync(path.join(COMPILED_DIR, 'edges.json'), JSON.stringify(edgesData, null, 2));
    console.log('\n  Saved to data/compiled/edges.json');
} else {
    console.warn('\n  WARNING: Reduction created orphans! Not saving.');
}

console.log('\n=== Transitive reduction complete ===');
