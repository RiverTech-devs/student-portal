import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DOMAINS } from './data.js';

// ============================================================
// CONSTANTS
// ============================================================
const NODE_SIZE = 0.45;
const CROSS_DOMAIN_OPACITY_DIM = 0.06;
const CROSS_DOMAIN_OPACITY_BRIGHT = 0.35;
const LINE_OPACITY = 0.65;
const LABEL_SCALE = 0.009;
const Y_SPACING = 8.0;
const X_SPACING = 5.5;
const DOMAIN_RADIUS_BASE = 32;
const DOMAIN_RADIUS_PER = 4.5;
const CROSS_DOMAIN_PULL = 0.35;
const STAR_COUNT = 2000;
// Neural-cloud layout: fully graph-driven, no per-domain ring positioning.
// Nodes start randomly in a volume; prereq + cross-domain edges pull related skills together.
// Y is set by depth (roots at bottom, leaves at top); X/Z are emergent from the force sim.
const NN_CLOUD_SIZE = 640;         // diameter of the random-init volume on X/Z
const NN_Y_SPACING = 14.0;         // vertical spacing per depth unit
const NN_REPULSION = 900.0;        // long-range repulsion: pushes unrelated clusters apart
const NN_REPULSION_RANGE = 90.0;   // reaches across clusters to separate them
const NN_ATTRACTION = 0.22;        // very strong prereq pull — connected skills nearly touch
const NN_CROSS_ATTRACTION = 0.10;  // very strong cross-domain pull — bridged skills pull close
const NN_EDGE_REST_DIST = 12.0;    // ideal distance along a connection (just above NN_MIN_DIST)
const NN_CENTERING = 0.0002;       // barely any pull toward origin (prevents drift only)
const NN_MIN_DIST = 11.0;          // minimum distance between any two nodes
const NN_ITERATIONS = 340;         // more iterations for equilibrium

// ============================================================
// STATE
// ============================================================
const state = {
  activeDomains: new Set(DOMAINS.map(d => d.id)),
  crossDomainHighlight: false,
  viewMode: '3d',
  selected2dDomain: DOMAINS[0].id,
  selectedNode: null,
  hoveredNode: null,
  nodeMap: new Map(),        // key -> { data, domain, worldPos, depth, isRoot, isLeaf, instanceIndex, domainId }
  domainGroups: new Map(),
  crossDomainLines: [],
  intraDomainLines: [],
  labelSprites: [],
  connectionMeshes: [],
  _highlightLines: [],
};

// ============================================================
// SCENE SETUP
// ============================================================
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));  // cap at 1.5 instead of 2
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x020208, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020208, 0.0015);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 3200);
camera.position.set(0, 360, 1120);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 5;
controls.maxDistance = 2000;
controls.target.set(0, 120, 0);
controls.maxPolarAngle = Math.PI * 0.85;
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

controls.addEventListener('start', () => {
  cameraTargetPos = null;
  cameraTargetLookAt = null;
});

// Simpler lighting
scene.add(new THREE.AmbientLight(0x334466, 0.5));
const dirLight = new THREE.DirectionalLight(0x8899cc, 0.5);
dirLight.position.set(30, 100, 40);
scene.add(dirLight);

// ============================================================
// STARFIELD (Points - already efficient)
// ============================================================
function createStarfield() {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 500 + Math.random() * 500;
    positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);
    const ct = Math.random();
    if (ct < 0.6) { colors[i*3]=0.8; colors[i*3+1]=0.8; colors[i*3+2]=0.9; }
    else if (ct < 0.85) { colors[i*3]=0.6; colors[i*3+1]=0.7; colors[i*3+2]=0.95; }
    else { colors[i*3]=0.95; colors[i*3+1]=0.85; colors[i*3+2]=0.6; }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const cnv = document.createElement('canvas');
  cnv.width = 32; cnv.height = 32;
  const ctx = cnv.getContext('2d');
  const grad = ctx.createRadialGradient(16,16,0,16,16,16);
  grad.addColorStop(0,'rgba(255,255,255,1)');
  grad.addColorStop(0.2,'rgba(255,255,255,0.7)');
  grad.addColorStop(0.5,'rgba(255,255,255,0.1)');
  grad.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=grad; ctx.fillRect(0,0,32,32);

  const mat = new THREE.PointsMaterial({
    size: 2.5, map: new THREE.CanvasTexture(cnv), vertexColors: true,
    transparent: true, opacity: 0.7, sizeAttenuation: true,
    blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
  });
  const stars = new THREE.Points(geo, mat);
  stars.renderOrder = -1000;
  stars.frustumCulled = false;
  return stars;
}
scene.add(createStarfield());

// ============================================================
// INSTANCED NODE RENDERING
// ============================================================
// Shared geometries
const nodeGeoCore = new THREE.SphereGeometry(NODE_SIZE, 10, 10);
const nodeGeoGlow = new THREE.SphereGeometry(NODE_SIZE * 2.2, 6, 6);
const nodeGeoHit = new THREE.SphereGeometry(NODE_SIZE * 3.0, 4, 4);
const nodeGeoRootCore = new THREE.SphereGeometry(NODE_SIZE * 1.6, 10, 10);
const nodeGeoRootGlow = new THREE.SphereGeometry(NODE_SIZE * 1.6 * 2.2, 6, 6);
const nodeGeoRootHit = new THREE.SphereGeometry(NODE_SIZE * 1.6 * 3.0, 4, 4);

// Materials (shared across all instances)
const coreMat = new THREE.MeshStandardMaterial({
  color: 0x88aacc, emissive: 0x88aacc, emissiveIntensity: 1.0,
  metalness: 0.1, roughness: 0.3,
});
const glowMat = new THREE.MeshBasicMaterial({
  color: 0x88aacc, transparent: true, opacity: 0.12,
  side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
});
const hitMat = new THREE.MeshBasicMaterial({ visible: false });

// Per-domain instanced rendering state
let instancedData = {
  cores: [],    // InstancedMesh array
  glows: [],    // InstancedMesh array
  hits: [],     // regular meshes for raycasting (InstancedMesh doesn't raycast well)
};

// Frustum for culling
const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();

// ============================================================
// LAYOUT ENGINE (same as before, just cleaner)
// ============================================================
function computeDepths(domain) {
  const depthMap = {};
  const skillMap = {};
  domain.skills.forEach(s => { skillMap[s.id] = s; });
  function getDepth(id) {
    const cached = depthMap[id];
    if (cached !== undefined) return cached === null ? 0 : cached;
    const s = skillMap[id];
    if (!s || s.prereqs.length === 0) { depthMap[id] = 0; return 0; }
    depthMap[id] = null;                               // mark in-progress (cycle guard)
    let max = 0;
    s.prereqs.forEach(pId => { if (skillMap[pId]) max = Math.max(max, getDepth(pId) + 1); });
    depthMap[id] = max;
    return max;
  }
  domain.skills.forEach(s => getDepth(s.id));
  return depthMap;
}

function buildChildMap(domain) {
  const childMap = {};
  domain.skills.forEach(s => { childMap[s.id] = []; });
  domain.skills.forEach(s => {
    s.prereqs.forEach(pId => { if (childMap[pId]) childMap[pId].push(s.id); });
  });
  return childMap;
}

function computeSubtreeWidths(domain, childMap) {
  const memo = new Map();
  function getWidth(id) {
    if (memo.has(id)) return memo.get(id);
    memo.set(id, 1);                                   // in-progress fallback (cycle guard)
    const children = childMap[id] || [];
    if (children.length === 0) { return 1; }
    let w = 0;
    children.forEach(cId => { w += Math.min(getWidth(cId), 5); });
    w = Math.max(1, Math.min(w, 10));
    memo.set(id, w);
    return w;
  }
  const widths = {};
  domain.skills.forEach(s => { widths[s.id] = getWidth(s.id); });
  return widths;
}

function layoutDomain(domain, domainIndex, totalActive, is2D) {
  const depthMap = computeDepths(domain);
  const childMap = buildChildMap(domain);
  const widths = computeSubtreeWidths(domain, childMap);
  const skillMap = {};
  domain.skills.forEach(s => { skillMap[s.id] = s; });
  const positions = {};

  let seedVal = domain.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  function seededRandom() {
    seedVal = (seedVal * 16807 + 0) % 2147483647;
    return (seedVal & 0x7fffffff) / 0x7fffffff;
  }

  let angle = 0, cx = 0, cz = 0, dirX = 0, dirZ = 0, perpX = 0, perpZ = 0;
  if (!is2D) {
    const angleStep = (Math.PI * 2) / totalActive;
    angle = domainIndex * angleStep;
    const radius = DOMAIN_RADIUS_BASE + totalActive * DOMAIN_RADIUS_PER;
    cx = Math.cos(angle) * radius; cz = Math.sin(angle) * radius;
    dirX = Math.cos(angle); dirZ = Math.sin(angle);
    perpX = -dirZ; perpZ = dirX;
  }

  const depthGroups = {};
  domain.skills.forEach(s => {
    const d = depthMap[s.id];
    if (!depthGroups[d]) depthGroups[d] = [];
    depthGroups[d].push(s);
  });
  const maxD = Math.max(...Object.keys(depthGroups).map(Number));

  const parentMap = {};
  const domSkillIds = new Set(domain.skills.map(s => s.id));
  domain.skills.forEach(s => {
    parentMap[s.id] = s.prereqs.filter(p => domSkillIds.has(p));
  });

  const xPos = {};
  const roots = domain.skills.filter(s => s.prereqs.length === 0);
  const rootTotalW = roots.length * X_SPACING * 3;
  roots.sort((a, b) => (widths[b.id] || 1) - (widths[a.id] || 1));
  const sortedRoots = [];
  const rCopy = [...roots];
  let left = true;
  while (rCopy.length > 0) {
    if (left) sortedRoots.push(rCopy.shift());
    else sortedRoots.push(rCopy.pop());
    left = !left;
  }
  let rx = -rootTotalW / 2;
  sortedRoots.forEach(root => {
    const rw = rootTotalW / sortedRoots.length;
    xPos[root.id] = rx + rw / 2;
    rx += rw;
  });

  for (let d = 1; d <= maxD; d++) {
    const level = depthGroups[d] || [];
    level.forEach(s => {
      const pxs = parentMap[s.id].filter(p => xPos[p] !== undefined).map(p => xPos[p]);
      xPos[s.id] = pxs.length > 0 ? pxs.reduce((a, b) => a + b, 0) / pxs.length : 0;
    });
  }

  function barycenterFromParents(id) {
    const pxs = parentMap[id].filter(p => xPos[p] !== undefined).map(p => xPos[p]);
    return pxs.length > 0 ? pxs.reduce((a, b) => a + b, 0) / pxs.length : xPos[id];
  }
  function barycenterFromChildren(id) {
    const cxs = (childMap[id] || []).filter(c => xPos[c] !== undefined).map(c => xPos[c]);
    return cxs.length > 0 ? cxs.reduce((a, b) => a + b, 0) / cxs.length : xPos[id];
  }

  for (let sweep = 0; sweep < 12; sweep++) {
    for (let d = 1; d <= maxD; d++) {
      const level = depthGroups[d] || [];
      level.forEach(s => { xPos[s.id] = barycenterFromParents(s.id); });
      level.sort((a, b) => xPos[a.id] - xPos[b.id]);
      for (let i = 1; i < level.length; i++) {
        if (xPos[level[i].id] < xPos[level[i-1].id] + X_SPACING) xPos[level[i].id] = xPos[level[i-1].id] + X_SPACING;
      }
      const meanX = level.reduce((s, sk) => s + xPos[sk.id], 0) / level.length;
      const parentMeanX = level.reduce((s, sk) => s + barycenterFromParents(sk.id), 0) / level.length;
      const shift = parentMeanX - meanX;
      level.forEach(s => { xPos[s.id] += shift * 0.5; });
    }
    for (let d = maxD - 1; d >= 0; d--) {
      const level = depthGroups[d] || [];
      level.forEach(s => {
        xPos[s.id] = xPos[s.id] * 0.6 + barycenterFromChildren(s.id) * 0.4;
      });
      level.sort((a, b) => xPos[a.id] - xPos[b.id]);
      for (let i = 1; i < level.length; i++) {
        if (xPos[level[i].id] < xPos[level[i-1].id] + X_SPACING) xPos[level[i].id] = xPos[level[i-1].id] + X_SPACING;
      }
    }
  }

  domain.skills.forEach(s => {
    const children = childMap[s.id] || [];
    if (children.length === 0 && parentMap[s.id].length > 0) {
      const parentAvgX = parentMap[s.id].filter(p => xPos[p] !== undefined)
        .reduce((sum, p, _, arr) => sum + xPos[p] / arr.length, 0);
      xPos[s.id] = parentAvgX + (seededRandom() - 0.5) * 1.5;
    }
  });

  for (let d = 0; d <= maxD; d++) {
    const level = depthGroups[d] || [];
    level.sort((a, b) => xPos[a.id] - xPos[b.id]);
    for (let i = 1; i < level.length; i++) {
      if (xPos[level[i].id] < xPos[level[i-1].id] + X_SPACING) xPos[level[i].id] = xPos[level[i-1].id] + X_SPACING;
    }
    if (level.length > 0) {
      const minX = xPos[level[0].id];
      const maxX = xPos[level[level.length - 1].id];
      const center = (minX + maxX) / 2;
      const rootCenter = roots.length > 0 ? roots.reduce((s, r) => s + xPos[r.id], 0) / roots.length : 0;
      const drift = (rootCenter - center) * 0.3;
      level.forEach(s => { xPos[s.id] += drift; });
    }
  }

  domain.skills.forEach(s => {
    const depth = depthMap[s.id];
    const y = depth * Y_SPACING;
    const x = xPos[s.id] || 0;
    const jitterX = (seededRandom() - 0.5) * 0.8;
    const jitterY = (seededRandom() - 0.5) * 0.6;
    const finalX = x + jitterX;
    const finalY = y + jitterY;

    if (is2D) {
      positions[s.id] = new THREE.Vector3(finalX, finalY, 0);
    } else {
      // More Z-depth variation for neural network look
      const fwdPush = depth * 1.5 + (seededRandom() - 0.5) * 6.0;
      const lateralJitter = (seededRandom() - 0.5) * 3.0;
      positions[s.id] = new THREE.Vector3(
        cx + perpX * finalX + dirX * fwdPush + lateralJitter,
        finalY,
        cz + perpZ * finalX + dirZ * fwdPush + (seededRandom() - 0.5) * 4.0
      );
    }
  });

  // Collision resolution
  const MIN_DIST = is2D ? 4.0 : 3.5;
  const ids = Object.keys(positions);
  for (let iter = 0; iter < 12; iter++) {
    let moved = false;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = positions[ids[i]], b = positions[ids[j]];
        const dx = b.x-a.x, dy = b.y-a.y, dz = is2D?0:(b.z-a.z);
        const dist = Math.sqrt(dx*dx+dy*dy+dz*dz);
        if (dist < MIN_DIST && dist > 0.001) {
          const push = (MIN_DIST - dist) / 2 * 0.5;
          const nx=dx/dist, ny=dy/dist, nz=dz/dist;
          a.x-=nx*push; a.y-=ny*push; b.x+=nx*push; b.y+=ny*push;
          if (!is2D) { a.z-=nz*push; b.z+=nz*push; }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return positions;
}

function applyCrossDomainGravity(allPositions, domainCenters) {
  // Multi-pass: pull connected nodes toward each other's actual positions
  for (let pass = 0; pass < 3; pass++) {
    DOMAINS.forEach(domain => {
      if (!state.activeDomains.has(domain.id)) return;
      const positions = allPositions[domain.id];
      if (!positions) return;
      domain.skills.forEach(skill => {
        if (!positions[skill.id]) return;
        const pos = positions[skill.id];
        const effCross = getEffectiveCrossDomain(skill, domain.id);
        effCross.forEach(cd => {
          const [targetDomainId, targetSkillId] = cd.target.split('.');
          if (!state.activeDomains.has(targetDomainId)) return;
          const targetPositions = allPositions[targetDomainId];
          if (!targetPositions) return;
          // Pull toward actual target node if possible, otherwise domain center
          const targetPos = targetPositions[targetSkillId] || domainCenters[targetDomainId];
          if (!targetPos) return;
          const pull = CROSS_DOMAIN_PULL / (pass + 1); // diminishing pull per pass
          pos.x += (targetPos.x - pos.x) * pull;
          pos.z += (targetPos.z - pos.z) * pull;
          // Add Z-depth variation to create neural network depth
          pos.z += (Math.random() - 0.5) * 2.0 * (pass === 0 ? 1 : 0);
        });
      });
    });
  }
}

// ============================================================
// NEURAL NETWORK CLOUD LAYOUT (3D only)
// ============================================================
function getEffectiveCrossDomain(skill, domainId) {
  // Use ONLY the authoritative expanded data (chain-pruned).
  // Original crossDomain arrays in data.js are ignored here to avoid re-introducing
  // redundant links that the pruning pass removed.
  return window.CROSS_DOMAIN_EXPANDED
    ? (window.CROSS_DOMAIN_EXPANDED[domainId + '.' + skill.id] || [])
    : [];
}

function layoutNeuralCloud(activeDomains) {
  // Returns { allPositions, domainCenters }
  // Graph-driven neural cloud:
  //  - All nodes initialized at random X/Z in a shared volume (no per-domain ring).
  //  - Y is fixed by depth (roots at bottom, leaves at top).
  //  - Only prereq + cross-domain edges pull nodes together.
  //  - Node-node repulsion spreads the whole cloud uniformly.
  //  - Gentle centering toward world origin prevents drift.
  // Domains emerge as naturally-adjacent regions rather than columns.
  const allPositions = {};
  const domainCenters = {};

  const allNodes = []; // { key, domainId, skillId, skill, depth, x, y, z }
  const nodeIndex = new Map(); // key -> index in allNodes

  // Seeded random (deterministic across reloads for stable layout)
  let seedVal = 1337;
  function sRand() {
    seedVal = (seedVal * 16807) % 2147483647;
    return (seedVal & 0x7fffffff) / 0x7fffffff;
  }

  // Step 1: Compute depths per domain and initialize all nodes at random X/Z.
  activeDomains.forEach((domain) => {
    const depthMap = computeDepths(domain);
    const positions = {};

    domain.skills.forEach(s => {
      const depth = depthMap[s.id] || 0;
      const y = depth * NN_Y_SPACING + (sRand() - 0.5) * 1.2;

      // Random X/Z inside the shared cloud volume — no domain bias.
      const x = (sRand() - 0.5) * NN_CLOUD_SIZE;
      const z = (sRand() - 0.5) * NN_CLOUD_SIZE;

      positions[s.id] = new THREE.Vector3(x, y, z);

      const key = domain.id + '.' + s.id;
      nodeIndex.set(key, allNodes.length);
      allNodes.push({
        key, domainId: domain.id, skillId: s.id, skill: s,
        depth, x, y, z,
      });
    });
    allPositions[domain.id] = positions;
  });

  // Step 2: Build connection graph: intra-domain prereqs + curated cross-domain.
  const connections = []; // { from: idx, to: idx, strength }
  allNodes.forEach((node, i) => {
    node.skill.prereqs.forEach(pid => {
      const pKey = node.domainId + '.' + pid;
      const j = nodeIndex.get(pKey);
      if (j !== undefined) connections.push({ from: j, to: i, strength: NN_ATTRACTION });
    });
    if (NN_CROSS_ATTRACTION > 0) {
      const crossLinks = getEffectiveCrossDomain(node.skill, node.domainId);
      crossLinks.forEach(cd => {
        const j = nodeIndex.get(cd.target);
        if (j !== undefined) connections.push({ from: i, to: j, strength: NN_CROSS_ATTRACTION });
      });
    }
  });

  // Step 3: Force-directed simulation in X/Z only (Y is locked by depth).
  for (let iter = 0; iter < NN_ITERATIONS; iter++) {
    const cooling = 1.0 - (iter / NN_ITERATIONS) * 0.7;
    const fx = new Float32Array(allNodes.length);
    const fz = new Float32Array(allNodes.length);

    // Spring attraction along connections: pulls when far, pushes when too close
    // so connected nodes settle at NN_EDGE_REST_DIST. This makes prereq + cross-domain
    // links read as clear, short segments rather than crossed long lines.
    connections.forEach(({ from, to, strength }) => {
      const a = allNodes[from], b = allNodes[to];
      const dx = b.x - a.x, dz = b.z - a.z;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;
      // Displacement from rest distance — positive means too far (attract), negative means too close (repel).
      const displacement = dist - NN_EDGE_REST_DIST;
      const force = strength * displacement * cooling / dist;
      fx[from] += dx * force;
      fz[from] += dz * force;
      fx[to] -= dx * force;
      fz[to] -= dz * force;
    });

    // Gentle centering toward world origin (prevents the whole cloud drifting off).
    allNodes.forEach((n, i) => {
      fx[i] += -n.x * NN_CENTERING * cooling;
      fz[i] += -n.z * NN_CENTERING * cooling;
    });

    // Repulsion via spatial grid (3D neighborhood so vertical spread also pushes laterally).
    const gridSize = NN_REPULSION_RANGE;
    const grid = new Map();
    allNodes.forEach((n, i) => {
      const gx = Math.floor(n.x / gridSize), gy = Math.floor(n.y / gridSize), gz = Math.floor(n.z / gridSize);
      const key = gx + ',' + gy + ',' + gz;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(i);
    });

    allNodes.forEach((n, i) => {
      const gx = Math.floor(n.x / gridSize), gy = Math.floor(n.y / gridSize), gz = Math.floor(n.z / gridSize);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          for (let oz = -1; oz <= 1; oz++) {
            const cell = grid.get((gx + ox) + ',' + (gy + oy) + ',' + (gz + oz));
            if (!cell) continue;
            cell.forEach(j => {
              if (j <= i) return;
              const a = allNodes[i], b = allNodes[j];
              const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.01;
              if (dist < NN_REPULSION_RANGE) {
                // Linear falloff from full strength at dist=0 to 0 at NN_REPULSION_RANGE.
                const falloff = 1 - (dist / NN_REPULSION_RANGE);
                const repForce = NN_REPULSION * falloff * cooling / Math.max(dist, 1.0);
                const nx = dx / dist, nz = dz / dist;
                fx[i] -= nx * repForce;
                fz[i] -= nz * repForce;
                fx[j] += nx * repForce;
                fz[j] += nz * repForce;
              }
            });
          }
        }
      }
    });

    // Apply forces (clamp max movement per iteration)
    const maxMove = 4.0 * cooling;
    allNodes.forEach((n, i) => {
      let dx = fx[i], dz = fz[i];
      const mag = Math.sqrt(dx * dx + dz * dz);
      if (mag > maxMove) { dx = dx / mag * maxMove; dz = dz / mag * maxMove; }
      n.x += dx;
      n.z += dz;
    });
  }

  // Step 4: Final collision resolution
  for (let iter = 0; iter < 15; iter++) {
    let moved = false;
    for (let i = 0; i < allNodes.length; i++) {
      for (let j = i + 1; j < Math.min(i + 50, allNodes.length); j++) { // limit check range
        const a = allNodes[i], b = allNodes[j];
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < NN_MIN_DIST && dist > 0.001) {
          const push = (NN_MIN_DIST - dist) / 2 * 0.4;
          const nx = dx / dist, ny = dy / dist, nz = dz / dist;
          a.x -= nx * push; a.y -= ny * push * 0.3; a.z -= nz * push;
          b.x += nx * push; b.y += ny * push * 0.3; b.z += nz * push;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  // Step 5: Write back positions
  allNodes.forEach(n => {
    const pos = allPositions[n.domainId][n.skillId];
    pos.set(n.x, n.y, n.z);
  });

  // Update domain centers from actual positions
  activeDomains.forEach(domain => {
    const posArr = Object.values(allPositions[domain.id]);
    if (posArr.length > 0) {
      const center = new THREE.Vector3();
      posArr.forEach(p => center.add(p));
      center.divideScalar(posArr.length);
      domainCenters[domain.id] = center;
    }
  });

  return { allPositions, domainCenters };
}

// ============================================================
// VISUAL HELPERS
// ============================================================
function depthToColor(depth, maxDepth) {
  const t = Math.min(depth / Math.max(maxDepth, 1), 1);
  if (t < 0.33) {
    const lt = t / 0.33;
    return new THREE.Color().setHSL(0.58 - lt * 0.08, 0.7 + lt * 0.1, 0.5 + lt * 0.15);
  } else if (t < 0.66) {
    const lt = (t - 0.33) / 0.33;
    return new THREE.Color().setHSL(0.5 - lt * 0.15, 0.6 + lt * 0.2, 0.6 + lt * 0.15);
  } else {
    const lt = (t - 0.66) / 0.34;
    return new THREE.Color().setHSL(0.12 + (1 - lt) * 0.23, 0.7 + lt * 0.15, 0.65 + lt * 0.1);
  }
}

// Merged line geometry for a whole domain (single draw call per domain)
function createMergedLines(lineSegments, color, opacity) {
  if (lineSegments.length === 0) return null;
  const allPoints = [];
  lineSegments.forEach(seg => {
    const mid = new THREE.Vector3().lerpVectors(seg.from, seg.to, 0.5);
    const dist = seg.from.distanceTo(seg.to);
    mid.y += dist * 0.06;
    const curve = new THREE.QuadraticBezierCurve3(seg.from.clone(), mid, seg.to.clone());
    const pts = curve.getPoints(12); // reduced from 24
    for (let i = 0; i < pts.length - 1; i++) {
      allPoints.push(pts[i].x, pts[i].y, pts[i].z);
      allPoints.push(pts[i+1].x, pts[i+1].y, pts[i+1].z);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(allPoints, 3));
  const mat = new THREE.LineBasicMaterial({
    color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  return new THREE.LineSegments(geo, mat);
}

function createTextSprite(text, color, size = 1) {
  const cnv = document.createElement('canvas');
  const ctx = cnv.getContext('2d');
  const fontSize = 36; // reduced from 48
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const w = metrics.width + 16;
  const h = fontSize + 12;
  cnv.width = w; cnv.height = h;

  ctx.fillStyle = 'rgba(2, 2, 8, 0.5)';
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, 6); ctx.fill();
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = color || '#c8c7c0';
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2);

  const tex = new THREE.CanvasTexture(cnv);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest: false, depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(w * LABEL_SCALE * size, h * LABEL_SCALE * size, 1);
  sprite.userData.baseScaleX = w * LABEL_SCALE * size;
  sprite.userData.baseScaleY = h * LABEL_SCALE * size;
  return sprite;
}

function createDomainTitle(text, color) {
  const cnv = document.createElement('canvas');
  const ctx = cnv.getContext('2d');
  const fontSize = 56; // reduced from 72
  ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const w = metrics.width + 30;
  const h = fontSize + 16;
  cnv.width = w; cnv.height = h;
  ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = color; ctx.globalAlpha = 0.8;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2);

  const tex = new THREE.CanvasTexture(cnv);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(w * 0.012, h * 0.012, 1);
  sprite.userData.baseScaleX = w * 0.012;
  sprite.userData.baseScaleY = h * 0.012;
  return sprite;
}

// ============================================================
// BUILD / REBUILD SCENE - OPTIMIZED
// ============================================================
function clearScene() {
  state.domainGroups.forEach(g => scene.remove(g));
  state.domainGroups.clear();
  state.crossDomainLines.forEach(l => scene.remove(l));
  state.crossDomainLines = [];
  state.intraDomainLines.forEach(l => scene.remove(l));
  state.intraDomainLines = [];
  state.labelSprites.forEach(s => scene.remove(s));
  state.labelSprites = [];
  state.connectionMeshes = [];
  if (state._highlightLines) {
    state._highlightLines.forEach(l => { scene.remove(l); l.geometry?.dispose(); l.material?.dispose(); });
    state._highlightLines = [];
  }
  state.nodeMap.clear();
  // Clear instanced data
  instancedData.cores.forEach(m => { scene.remove(m); m.dispose(); });
  instancedData.glows.forEach(m => { scene.remove(m); m.dispose(); });
  instancedData.hits.forEach(m => scene.remove(m));
  instancedData = { cores: [], glows: [], hits: [] };
}

function buildScene() {
  clearScene();

  const activeDomains = DOMAINS.filter(d => state.activeDomains.has(d.id));
  const is2D = state.viewMode === '2d';
  const domainsToRender = is2D
    ? activeDomains.filter(d => d.id === state.selected2dDomain)
    : activeDomains;

  // Compute all positions
  let allPositions = {};
  let domainCenters = {};

  if (!is2D && domainsToRender.length >= 1) {
    // Neural network cloud layout for 3D mode
    const result = layoutNeuralCloud(domainsToRender);
    Object.assign(allPositions, result.allPositions);
    Object.assign(domainCenters, result.domainCenters);
  } else {
    // 2D mode: use original per-domain layout
    domainsToRender.forEach((domain, idx) => {
      const positions = layoutDomain(domain, idx, domainsToRender.length, is2D);
      allPositions[domain.id] = positions;
      const posArr = Object.values(positions);
      if (posArr.length > 0) {
        const center = new THREE.Vector3();
        posArr.forEach(p => center.add(p));
        center.divideScalar(posArr.length);
        domainCenters[domain.id] = center;
      }
    });
  }

  // Build each domain using InstancedMesh for nodes
  domainsToRender.forEach(domain => {
    const positions = allPositions[domain.id];
    if (!positions) return;

    const group = new THREE.Group();
    const domCol = new THREE.Color(domain.color);
    const depthMap = computeDepths(domain);
    const childMap = buildChildMap(domain);
    const maxDepth = Math.max(...Object.values(depthMap));
    const leafSet = new Set();
    domain.skills.forEach(s => {
      if ((childMap[s.id] || []).length === 0) leafSet.add(s.id);
    });

    const roots = domain.skills.filter(s => s.prereqs.length === 0);
    const rootSet = new Set(roots.map(s => s.id));
    const regularSkills = domain.skills.filter(s => !rootSet.has(s.id));

    // === INSTANCED NODES ===
    // Regular nodes
    const regCount = regularSkills.length;
    if (regCount > 0) {
      const coreInst = new THREE.InstancedMesh(nodeGeoCore, coreMat.clone(), regCount);
      const glowInst = new THREE.InstancedMesh(nodeGeoGlow, glowMat.clone(), regCount);
      glowInst.renderOrder = -1;
      const dummy = new THREE.Matrix4();
      const tempColor = new THREE.Color();

      regularSkills.forEach((skill, i) => {
        const pos = positions[skill.id];
        if (!pos) return;
        dummy.makeTranslation(pos.x, pos.y, pos.z);
        coreInst.setMatrixAt(i, dummy);
        glowInst.setMatrixAt(i, dummy);
        const nodeCol = depthToColor(depthMap[skill.id], maxDepth);
        coreInst.setColorAt(i, nodeCol);
        glowInst.setColorAt(i, nodeCol);

        // Hit mesh for raycasting (individual but cheap invisible mesh)
        const hitMesh = new THREE.Mesh(nodeGeoHit, hitMat);
        hitMesh.position.copy(pos);
        hitMesh.userData = { key: `${domain.id}.${skill.id}`, domainId: domain.id, skillId: skill.id };
        group.add(hitMesh);
        instancedData.hits.push(hitMesh);

        const key = `${domain.id}.${skill.id}`;
        state.nodeMap.set(key, {
          data: skill, domain, worldPos: pos.clone(),
          depth: depthMap[skill.id], isRoot: false,
          isLeaf: leafSet.has(skill.id),
          instanceIndex: i, instanceType: 'regular',
          coreInst, glowInst, hitMesh,
        });
      });

      coreInst.instanceMatrix.needsUpdate = true;
      if (coreInst.instanceColor) coreInst.instanceColor.needsUpdate = true;
      glowInst.instanceMatrix.needsUpdate = true;
      if (glowInst.instanceColor) glowInst.instanceColor.needsUpdate = true;
      group.add(coreInst);
      group.add(glowInst);
      instancedData.cores.push(coreInst);
      instancedData.glows.push(glowInst);
    }

    // Root nodes (larger, separate instanced mesh)
    if (roots.length > 0) {
      const rootCoreInst = new THREE.InstancedMesh(nodeGeoRootCore, coreMat.clone(), roots.length);
      const rootGlowInst = new THREE.InstancedMesh(nodeGeoRootGlow, glowMat.clone(), roots.length);
      rootGlowInst.renderOrder = -1;
      const dummy = new THREE.Matrix4();

      roots.forEach((skill, i) => {
        const pos = positions[skill.id];
        if (!pos) return;
        dummy.makeTranslation(pos.x, pos.y, pos.z);
        rootCoreInst.setMatrixAt(i, dummy);
        rootGlowInst.setMatrixAt(i, dummy);
        const nodeCol = depthToColor(0, maxDepth);
        rootCoreInst.setColorAt(i, nodeCol);
        rootGlowInst.setColorAt(i, nodeCol);

        const hitMesh = new THREE.Mesh(nodeGeoRootHit, hitMat);
        hitMesh.position.copy(pos);
        hitMesh.userData = { key: `${domain.id}.${skill.id}`, domainId: domain.id, skillId: skill.id };
        group.add(hitMesh);
        instancedData.hits.push(hitMesh);

        const key = `${domain.id}.${skill.id}`;
        state.nodeMap.set(key, {
          data: skill, domain, worldPos: pos.clone(),
          depth: 0, isRoot: true, isLeaf: false,
          instanceIndex: i, instanceType: 'root',
          coreInst: rootCoreInst, glowInst: rootGlowInst, hitMesh,
        });
      });

      rootCoreInst.instanceMatrix.needsUpdate = true;
      if (rootCoreInst.instanceColor) rootCoreInst.instanceColor.needsUpdate = true;
      rootGlowInst.instanceMatrix.needsUpdate = true;
      if (rootGlowInst.instanceColor) rootGlowInst.instanceColor.needsUpdate = true;
      group.add(rootCoreInst);
      group.add(rootGlowInst);
      instancedData.cores.push(rootCoreInst);
      instancedData.glows.push(rootGlowInst);
    }

    // === LABELS (only create for nodes - sprites are lightweight with distance fade) ===
    const labelSize = is2D ? 1.1 : 0.9;
    domain.skills.forEach(skill => {
      const pos = positions[skill.id];
      if (!pos) return;
      const label = createTextSprite(skill.name, domain.color, labelSize);
      label.position.copy(pos);
      label.position.y += NODE_SIZE + 0.8;
      group.add(label);
      state.labelSprites.push(label);
    });

    // === MERGED LINES (single draw call per domain) ===
    // Build ancestor lookup for transitive reduction
    const skillMap = new Map(domain.skills.map(s => [s.id, s]));
    const ancestorCache = new Map();
    function getAncestors(id) {
      if (ancestorCache.has(id)) return ancestorCache.get(id);
      const ancestors = new Set();
      const s = skillMap.get(id);
      if (s) {
        s.prereqs.forEach(pid => {
          ancestors.add(pid);
          getAncestors(pid).forEach(a => ancestors.add(a));
        });
      }
      ancestorCache.set(id, ancestors);
      return ancestors;
    }

    const lineSegments = [];
    const lineMetadata = []; // parallel array tracking from/to keys per segment
    domain.skills.forEach(skill => {
      const pos = positions[skill.id];
      if (!pos) return;

      // Transitive reduction
      const directPrereqs = [...skill.prereqs];
      const reduced = directPrereqs.filter(pid => {
        return !directPrereqs.some(otherPid => {
          if (otherPid === pid) return false;
          return getAncestors(otherPid).has(pid);
        });
      });

      reduced.forEach(prereqId => {
        const prereqPos = positions[prereqId];
        if (!prereqPos) return;
        lineSegments.push({ from: prereqPos, to: pos });
        lineMetadata.push({
          fromKey: `${domain.id}.${prereqId}`,
          toKey: `${domain.id}.${skill.id}`,
        });
      });
    });

    const mergedLines = createMergedLines(lineSegments, domCol, LINE_OPACITY);
    if (mergedLines) {
      mergedLines.userData.lineMetadata = lineMetadata;
      mergedLines.userData.domainId = domain.id;
      group.add(mergedLines);
      state.intraDomainLines.push(mergedLines);
    }

    // Domain title
    const rootPositions = roots.map(s => positions[s.id]).filter(Boolean);
    if (rootPositions.length > 0) {
      const avgPos = new THREE.Vector3();
      rootPositions.forEach(p => avgPos.add(p));
      avgPos.divideScalar(rootPositions.length);
      const domLabel = createDomainTitle(domain.name, domain.color);
      domLabel.position.set(avgPos.x, -5, avgPos.z);
      group.add(domLabel);
      state.labelSprites.push(domLabel);
    }

    scene.add(group);
    state.domainGroups.set(domain.id, group);
  });

  buildCrossDomainLines();

  // Camera for 2D
  if (is2D && domainsToRender.length > 0) {
    const dom = domainsToRender[0];
    const positions = allPositions[dom.id];
    if (positions) {
      const posArr = Object.values(positions);
      let minY=Infinity,maxY=-Infinity,minX=Infinity,maxX=-Infinity;
      posArr.forEach(p => { minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x); });
      const centerY=(minY+maxY)/2, centerX=(minX+maxX)/2;
      const dist=Math.max(maxY-minY,maxX-minX)*0.85+20;
      animateCameraTo(new THREE.Vector3(centerX,centerY,dist), new THREE.Vector3(centerX,centerY,0));
    }
  }
}

function buildCrossDomainLines() {
  state.crossDomainLines.forEach(l => scene.remove(l));
  state.crossDomainLines = [];

  const opacity = state.crossDomainHighlight ? CROSS_DOMAIN_OPACITY_BRIGHT : CROSS_DOMAIN_OPACITY_DIM;

  // Build individual line meshes per cross-domain connection (for highlighting)
  // Use getEffectiveCrossDomain to merge original + expanded connections
  // Track already-drawn pairs to avoid duplicates
  const drawnPairs = new Set();
  state.nodeMap.forEach((node, key) => {
    if (!state.activeDomains.has(node.domain.id)) return;
    const crossLinks = getEffectiveCrossDomain(node.data, node.domain.id);
    crossLinks.forEach(cd => {
      const targetNode = state.nodeMap.get(cd.target);
      if (!targetNode) return;
      if (!state.activeDomains.has(targetNode.domain.id)) return;

      // Skip self-domain connections and duplicates
      const pairKey = key < cd.target ? key + '|' + cd.target : cd.target + '|' + key;
      if (drawnPairs.has(pairKey)) return;
      drawnPairs.add(pairKey);

      const from = node.worldPos;
      const to = targetNode.worldPos;
      const mid = new THREE.Vector3().lerpVectors(from, to, 0.5);
      const dist = from.distanceTo(to);
      // Arc upward proportional to distance for neural-network feel
      mid.y += dist * 0.15 + 5;
      // Add lateral bow for visual interest
      const lateral = new THREE.Vector3(to.x - from.x, 0, to.z - from.z).normalize();
      mid.x += lateral.z * dist * 0.1;
      mid.z -= lateral.x * dist * 0.1;

      const curve = new THREE.QuadraticBezierCurve3(from.clone(), mid, to.clone());
      const pts = curve.getPoints(14);
      const linePoints = [];
      for (let i = 0; i < pts.length - 1; i++) {
        linePoints.push(pts[i].x, pts[i].y, pts[i].z);
        linePoints.push(pts[i+1].x, pts[i+1].y, pts[i+1].z);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));

      // Gradient color: blend source domain color to target domain color
      const srcCol = new THREE.Color(node.domain.color);
      const tgtCol = new THREE.Color(targetNode.domain.color);
      const midCol = srcCol.clone().lerp(tgtCol, 0.5);
      midCol.multiplyScalar(1.3); // brighten

      const mat = new THREE.LineBasicMaterial({
        color: midCol, transparent: true, opacity,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const lineMesh = new THREE.LineSegments(geo, mat);
      lineMesh.userData = {
        sourceKey: key,
        targetKey: cd.target,
        sourceDomain: node.domain.id,
        targetDomain: targetNode.domain.id,
        defaultOpacity: opacity,
      };
      scene.add(lineMesh);
      state.crossDomainLines.push(lineMesh);
    });
  });
}

// ============================================================
// INTERACTION
// ============================================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let mouseDownPos = { x: 0, y: 0 };
const CLICK_THRESHOLD = 10;
const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

canvas.addEventListener('mousedown', (e) => {
  if (e.target !== canvas) return;
  mouseDownPos.x = e.clientX; mouseDownPos.y = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  updateHover(e);
});

canvas.addEventListener('mouseup', (e) => {
  const dx = e.clientX - mouseDownPos.x, dy = e.clientY - mouseDownPos.y;
  if (Math.sqrt(dx*dx+dy*dy) < CLICK_THRESHOLD) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    handleClick();
  }
});

let touchStartPos = { x: 0, y: 0 };
let touchStartTime = 0;
canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    touchStartPos.x = e.touches[0].clientX;
    touchStartPos.y = e.touches[0].clientY;
    touchStartTime = Date.now();
  }
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  const dt = Date.now() - touchStartTime;
  if (dt > 300) return;
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartPos.x, dy = touch.clientY - touchStartPos.y;
  if (Math.sqrt(dx*dx+dy*dy) < 20) {
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    handleClick();
  }
}, { passive: true });

// Mobile panel toggle
const mobileToggleBtn = document.getElementById('mobile-toggle');
const domainPanel = document.getElementById('domain-panel');
let mobilePanelVisible = false;

function closeMobilePanel() {
  mobilePanelVisible = false;
  domainPanel.classList.remove('mobile-visible');
  mobileToggleBtn.textContent = '\u2630';
}
function openMobilePanel() {
  mobilePanelVisible = true;
  domainPanel.classList.add('mobile-visible');
  mobileToggleBtn.textContent = '\u2715';
}

mobileToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (mobilePanelVisible) closeMobilePanel();
  else openMobilePanel();
});
canvas.addEventListener('touchstart', () => { if (mobilePanelVisible) closeMobilePanel(); }, { passive: true });
canvas.addEventListener('mousedown', () => { if (mobilePanelVisible && window.innerWidth <= 768) closeMobilePanel(); });

function findNearestNodeScreenSpace() {
  let bestDist = Infinity, bestKey = null;
  const screenPos = new THREE.Vector3();
  const mouseX = (mouse.x + 1) / 2 * window.innerWidth;
  const mouseY = (-mouse.y + 1) / 2 * window.innerHeight;
  state.nodeMap.forEach((node, key) => {
    if (!state.activeDomains.has(node.domain.id)) return;
    if (state.viewMode === '2d' && node.domain.id !== state.selected2dDomain) return;
    screenPos.copy(node.worldPos).project(camera);
    if (screenPos.z > 1) return; // behind camera
    const sx = (screenPos.x + 1) / 2 * window.innerWidth;
    const sy = (-screenPos.y + 1) / 2 * window.innerHeight;
    const dist = Math.sqrt((sx - mouseX) ** 2 + (sy - mouseY) ** 2);
    if (dist < bestDist) { bestDist = dist; bestKey = key; }
  });
  const threshold = isMobile ? 40 : 25;
  return bestDist < threshold ? bestKey : null;
}

// Throttle hover to max 30fps
let lastHoverTime = 0;
function updateHover(e) {
  const now = performance.now();
  if (now - lastHoverTime < 33) return; // ~30fps hover
  lastHoverTime = now;

  const tooltip = document.getElementById('tooltip');
  const hitKey = findNearestNodeScreenSpace();

  if (hitKey) {
    const node = state.nodeMap.get(hitKey);
    if (node && state.hoveredNode !== hitKey) {
      state.hoveredNode = hitKey;
      canvas.style.cursor = 'pointer';
      const depthLabel = node.isRoot ? 'Root' : (node.isLeaf ? 'Apex' : `Depth ${node.depth}`);
      tooltip.innerHTML = `<span style="color:${node.domain.color}">${node.data.name}</span><br><span class="tooltip-tier">${depthLabel} · ${node.domain.name}</span>`;
      tooltip.classList.remove('hidden');
    }
    tooltip.style.left = (e.clientX + 16) + 'px';
    tooltip.style.top = (e.clientY - 8) + 'px';
  } else {
    if (state.hoveredNode) {
      state.hoveredNode = null;
    }
    tooltip.classList.add('hidden');
    canvas.style.cursor = 'default';
  }
}

function handleClick() {
  const hitKey = findNearestNodeScreenSpace();
  const clickThreshold = isMobile ? 50 : 30;
  if (hitKey) selectNode(hitKey);
  else deselectNode();
}

function traceAncestryPath(key) {
  const pathKeys = new Set();
  const node = state.nodeMap.get(key);
  if (!node) return pathKeys;
  function walk(skillId) {
    const k = `${node.domain.id}.${skillId}`;
    if (pathKeys.has(k)) return;
    pathKeys.add(k);
    const n = state.nodeMap.get(k);
    if (n && n.data.prereqs.length > 0) n.data.prereqs.forEach(pId => walk(pId));
  }
  walk(node.data.id);
  return pathKeys;
}

function buildOrderedPath(key, ancestryKeys) {
  const node = state.nodeMap.get(key);
  if (!node) return [];
  const depthMap = computeDepths(node.domain);
  const levels = new Map();
  ancestryKeys.forEach(k => {
    const n = state.nodeMap.get(k);
    if (n) {
      const d = depthMap[n.data.id] || 0;
      if (!levels.has(d)) levels.set(d, []);
      levels.get(d).push(k);
    }
  });
  return Array.from(levels.entries()).sort((a, b) => a[0] - b[0]).map(e => e[1]);
}

let pulseAnimation = null;

function createHighlightLine(from, to, color, opacity, isCrossDomain = false) {
  const mid = new THREE.Vector3().lerpVectors(from, to, 0.5);
  const dist = from.distanceTo(to);
  if (isCrossDomain) {
    mid.y += dist * 0.2 + 8;
    const lateral = new THREE.Vector3(to.x - from.x, 0, to.z - from.z).normalize();
    mid.x += lateral.z * dist * 0.08;
    mid.z -= lateral.x * dist * 0.08;
  } else {
    mid.y += dist * 0.06;
  }
  const curve = new THREE.QuadraticBezierCurve3(from.clone(), mid, to.clone());
  const pts = curve.getPoints(isCrossDomain ? 20 : 14);
  const linePoints = [];
  for (let i = 0; i < pts.length - 1; i++) {
    linePoints.push(pts[i].x, pts[i].y, pts[i].z);
    linePoints.push(pts[i+1].x, pts[i+1].y, pts[i+1].z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
  const mat = new THREE.LineBasicMaterial({
    color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const line = new THREE.LineSegments(geo, mat);
  line.renderOrder = 100;
  return line;
}

function clearHighlightLines() {
  state._highlightLines.forEach(l => { scene.remove(l); l.geometry.dispose(); l.material.dispose(); });
  state._highlightLines = [];
}

function selectNode(key) {
  state.selectedNode = key;
  const node = state.nodeMap.get(key);
  if (!node) return;

  const ancestryKeys = traceAncestryPath(key);
  const childKeys = new Set();
  node.domain.skills.filter(s => s.prereqs.includes(node.data.id))
    .forEach(s => childKeys.add(`${node.domain.id}.${s.id}`));

  // Cross-domain: nodes this skill connects TO and nodes that connect TO this skill
  // Use expanded cross-domain data
  const crossKeys = new Set();
  const effectiveCross = getEffectiveCrossDomain(node.data, node.domain.id);
  effectiveCross.forEach(cd => crossKeys.add(cd.target));
  state.nodeMap.forEach((n, nKey) => {
    const nCross = getEffectiveCrossDomain(n.data, n.domain.id);
    nCross.forEach(cd => { if (cd.target === key) crossKeys.add(nKey); });
  });

  const allVisibleKeys = new Set([...ancestryKeys, ...childKeys, ...crossKeys]);

  // Dim non-path nodes
  state.nodeMap.forEach((n, nKey) => {
    const isOnPath = ancestryKeys.has(nKey);
    const isChild = childKeys.has(nKey);
    const isCross = crossKeys.has(nKey);
    const isSelected = nKey === key;
    const visible = allVisibleKeys.has(nKey);

    let color;
    if (isSelected) {
      color = new THREE.Color(1.0, 1.0, 1.0);
    } else if (isOnPath) {
      color = new THREE.Color(n.domain.color).multiplyScalar(1.6);
    } else if (isCross) {
      color = new THREE.Color(n.domain.color).multiplyScalar(1.4);
    } else if (isChild) {
      color = depthToColor(n.depth, 10);
    } else {
      color = new THREE.Color(0.04, 0.04, 0.06);
    }

    if (n.coreInst) {
      n.coreInst.setColorAt(n.instanceIndex, color);
      n.coreInst.instanceColor.needsUpdate = true;
    }
    if (n.glowInst) {
      const glowColor = visible ? color.clone().multiplyScalar(0.6) : new THREE.Color(0, 0, 0);
      n.glowInst.setColorAt(n.instanceIndex, glowColor);
      n.glowInst.instanceColor.needsUpdate = true;
    }
  });

  // Dim intra-domain lines: dim all, but keep selected domain's slightly visible
  state.intraDomainLines.forEach(lineMesh => {
    if (lineMesh.userData.domainId === node.domain.id) {
      lineMesh.material.opacity = LINE_OPACITY * 0.25; // selected domain stays somewhat visible
    } else {
      lineMesh.material.opacity = LINE_OPACITY * 0.04;
    }
  });

  // Cross-domain lines: highlight those connected to selected node, dim the rest
  state.crossDomainLines.forEach(crossLine => {
    const ud = crossLine.userData;
    const isConnected = ud.sourceKey === key || ud.targetKey === key;
    if (isConnected) {
      crossLine.material.opacity = 0.7; // bright highlight
      crossLine.material.color.set(0xffffff);
    } else {
      crossLine.material.opacity = 0.02; // nearly invisible
    }
  });

  // Build overlay lines for the ancestry path within the domain
  clearHighlightLines();
  const pathLineColor = new THREE.Color(node.domain.color).multiplyScalar(1.3);
  ancestryKeys.forEach(aKey => {
    const aNode = state.nodeMap.get(aKey);
    if (!aNode) return;
    aNode.data.prereqs.forEach(prereqId => {
      const pKey = `${aNode.domain.id}.${prereqId}`;
      if (!ancestryKeys.has(pKey)) return;
      const pNode = state.nodeMap.get(pKey);
      if (!pNode) return;
      const hlLine = createHighlightLine(pNode.worldPos, aNode.worldPos, pathLineColor, 0.9);
      scene.add(hlLine);
      state._highlightLines.push(hlLine);
    });
  });

  // Also create highlight lines for cross-domain connections
  state.crossDomainLines.forEach(crossLine => {
    const ud = crossLine.userData;
    if (ud.sourceKey === key || ud.targetKey === key) {
      const srcNode = state.nodeMap.get(ud.sourceKey);
      const tgtNode = state.nodeMap.get(ud.targetKey);
      if (srcNode && tgtNode) {
        const hlColor = new THREE.Color(srcNode.domain.color).lerp(new THREE.Color(tgtNode.domain.color), 0.5);
        hlColor.multiplyScalar(1.6);
        const hlLine = createHighlightLine(srcNode.worldPos, tgtNode.worldPos, hlColor, 0.85, true);
        scene.add(hlLine);
        state._highlightLines.push(hlLine);
      }
    }
  });

  // Start pulse animation
  const orderedLevels = buildOrderedPath(key, ancestryKeys);
  pulseAnimation = {
    levels: orderedLevels,
    startTime: clock.getElapsedTime(),
    duration: Math.min(orderedLevels.length * 0.18, 2.5),
    pathKeys: ancestryKeys,
    selectedKey: key,
    domainColor: new THREE.Color(node.domain.color),
  };

  // Camera fly
  const worldPos = node.worldPos.clone();
  const offset = state.viewMode === '2d' ? new THREE.Vector3(0, 3, 30) : new THREE.Vector3(10, 8, 25);
  animateCameraTo(worldPos.clone().add(offset), worldPos.clone());

  // Info panel
  showInfoPanel(key, node, ancestryKeys, orderedLevels);
}

function showInfoPanel(key, node, ancestryKeys, orderedLevels) {
  const panel = document.getElementById('info-panel');
  const content = document.getElementById('info-content');
  panel.classList.remove('hidden');

  const depthMap = computeDepths(node.domain);
  const maxD = Math.max(...node.domain.skills.map(s => depthMap[s.id]));
  const depthLabel = node.isRoot ? 'Root Skill' : (node.isLeaf ? 'Apex Skill' : `Depth ${node.depth} of ${maxD}`);

  let html = `
    <div class="info-domain" style="color:${node.domain.color}">${node.domain.name}</div>
    <div class="info-name">${node.data.name}</div>
    <div class="info-tier">${depthLabel}</div>
  `;

  // Path from root
  if (!node.isRoot) {
    html += `<div class="info-section"><h4>Path from Root</h4><div class="info-path">`;
    orderedLevels.forEach((levelKeys, i) => {
      levelKeys.forEach(lk => {
        const ln = state.nodeMap.get(lk);
        if (!ln) return;
        const cls = lk === key ? 'info-path-node info-path-current' : 'info-path-node';
        html += `<div class="${cls}" data-key="${lk}"><span class="info-dot" style="background:${node.domain.color}"></span>${ln.data.name}</div>`;
      });
      if (i < orderedLevels.length - 1) html += `<div class="info-path-arrow">↓</div>`;
    });
    html += `</div></div>`;
  }

  // Direct prerequisites
  if (node.data.prereqs.length > 0) {
    html += `<div class="info-section"><h4>Direct Prerequisites</h4>`;
    node.data.prereqs.forEach(pId => {
      const pKey = `${node.domain.id}.${pId}`;
      const pSkill = node.domain.skills.find(s => s.id === pId);
      html += `<div class="info-prereq" data-key="${pKey}"><span class="info-dot" style="background:${node.domain.color}"></span>${pSkill ? pSkill.name : pId}</div>`;
    });
    html += `</div>`;
  }

  // Unlocks
  const unlocks = node.domain.skills.filter(s => s.prereqs.includes(node.data.id));
  if (unlocks.length > 0) {
    html += `<div class="info-section"><h4>Unlocks</h4>`;
    unlocks.forEach(u => {
      html += `<div class="info-prereq" data-key="${node.domain.id}.${u.id}"><span class="info-dot" style="background:${node.domain.color}"></span>${u.name}</div>`;
    });
    html += `</div>`;
  }

  // Cross-domain (merged original + expanded)
  const effectiveCrossPanel = getEffectiveCrossDomain(node.data, node.domain.id);
  if (effectiveCrossPanel.length > 0) {
    html += `<div class="info-section"><h4>Cross-Domain Connections</h4>`;
    effectiveCrossPanel.forEach(cd => {
      const tDomain = DOMAINS.find(d => d.id === cd.target.split('.')[0]);
      const tSkill = tDomain?.skills.find(s => s.id === cd.target.split('.')[1]);
      html += `<div class="info-cross" data-key="${cd.target}"><span class="info-dot" style="background:${tDomain?.color || '#888'}"></span>${tSkill?.name || cd.target}<span class="info-cross-label">${cd.label}</span></div>`;
    });
    html += `</div>`;
  }

  // Incoming cross-domain (use expanded data)
  const incoming = [];
  state.nodeMap.forEach((n, nKey) => {
    const nCross = getEffectiveCrossDomain(n.data, n.domain.id);
    nCross.forEach(cd => {
      if (cd.target === key) incoming.push({ sourceKey: nKey, node: n, label: cd.label });
    });
  });
  if (incoming.length > 0) {
    html += `<div class="info-section"><h4>Feeds Into This From</h4>`;
    incoming.forEach(inc => {
      html += `<div class="info-cross" data-key="${inc.sourceKey}"><span class="info-dot" style="background:${inc.node.domain.color}"></span>${inc.node.data.name}<span class="info-cross-label">${inc.label}</span></div>`;
    });
    html += `</div>`;
  }

  // === IXL CURRICULUM SECTION ===
  if (node.domain.id === 'math' && window.IXL_CURRICULUM) {
    const ixlKey = node.data.prototype_id || node.data.id;
    const ixlData = window.IXL_CURRICULUM[ixlKey];
    if (ixlData && ixlData.length > 0) {
      html += `<div class="info-section"><h4>📖 IXL Curriculum</h4>`;
      // Group by grade
      const byGrade = {};
      ixlData.forEach(item => {
        if (!byGrade[item.grade]) byGrade[item.grade] = [];
        byGrade[item.grade].push(item);
      });
      Object.entries(byGrade).forEach(([grade, items]) => {
        html += `<div class="info-ixl-grade">${grade}</div>`;
        items.forEach(item => {
          const link = item.url ? `<a href="${item.url}" target="_blank" class="info-ixl-link">${item.skillCode}</a>` : `<span class="info-ixl-code">${item.skillCode}</span>`;
          html += `<div class="info-ixl-skill">${link} ${item.skillName}</div>`;
        });
      });
      html += `</div>`;
    }
  }

  // === PHYSICAL MATERIALS SECTION ===
  if (window.PHYSICAL_MATERIALS) {
    const matKey = node.domain.id + '.' + (node.data.prototype_id || node.data.id);
    const mats = window.PHYSICAL_MATERIALS[matKey];
    if (mats && mats.length > 0) {
      const typeIcons = { workbook: '📓', textbook: '📘', flashcards: '🃏', reference: '📖', supplement: '📎' };
      html += `<div class="info-section"><h4>📦 Physical Materials</h4>`;
      mats.forEach(m => {
        const icon = typeIcons[m.type] || '📄';
        const notes = m.notes ? ` <span style="color:var(--text-faint);font-size:10px">${m.notes}</span>` : '';
        html += `<div class="info-ixl-skill">${icon} <strong>${m.title}</strong> <span style="color:var(--text-faint);font-size:10px">${m.gradeRange} · ${m.type}</span>${notes}</div>`;
      });
      html += `</div>`;
    }
  }

  content.innerHTML = html;
  content.querySelectorAll('[data-key]').forEach(el => {
    el.addEventListener('click', () => {
      const k = el.getAttribute('data-key');
      if (state.nodeMap.has(k)) selectNode(k);
    });
  });
}

function deselectNode() {
  pulseAnimation = null;
  state.selectedNode = null;
  clearHighlightLines();

  // Restore all node colors
  state.nodeMap.forEach((n) => {
    if (n.coreInst) {
      const col = depthToColor(n.depth, 10);
      n.coreInst.setColorAt(n.instanceIndex, col);
      n.coreInst.instanceColor.needsUpdate = true;
    }
    if (n.glowInst) {
      const col = depthToColor(n.depth, 10);
      n.glowInst.setColorAt(n.instanceIndex, col);
      n.glowInst.instanceColor.needsUpdate = true;
    }
  });

  // Restore line opacity
  state.intraDomainLines.forEach(lineMesh => {
    lineMesh.material.opacity = LINE_OPACITY;
  });

  // Rebuild cross-domain with proper opacity
  buildCrossDomainLines();

  document.getElementById('info-panel').classList.add('hidden');

  if (state.viewMode === '2d') {
    const dom = DOMAINS.find(d => d.id === state.selected2dDomain);
    if (dom) {
      const posArr = [];
      dom.skills.forEach(s => {
        const n = state.nodeMap.get(`${dom.id}.${s.id}`);
        if (n) posArr.push(n.worldPos);
      });
      if (posArr.length > 0) {
        let minY=Infinity,maxY=-Infinity,minX=Infinity,maxX=-Infinity;
        posArr.forEach(p => { minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x); });
        const dist=Math.max(maxY-minY,maxX-minX)*0.85+20;
        animateCameraTo(new THREE.Vector3((minX+maxX)/2,(minY+maxY)/2,dist), new THREE.Vector3((minX+maxX)/2,(minY+maxY)/2,0), 0.08);
      }
    }
  } else {
    animateCameraTo(new THREE.Vector3(0, 220, 520), new THREE.Vector3(0, 100, 0), 0.08);
  }
}

document.getElementById('close-info').addEventListener('click', deselectNode);

// ============================================================
// UI
// ============================================================
let cameraTargetPos = null, cameraTargetLookAt = null, cameraLerpSpeed = 0.05;

function animateCameraTo(pos, lookAt, speed = 0.05) {
  cameraTargetPos = pos.clone();
  cameraTargetLookAt = lookAt.clone();
  cameraLerpSpeed = speed;
}

function resetView() {
  deselectNode();
  document.getElementById('tooltip').classList.add('hidden');
  state.hoveredNode = null;
}

function buildUI() {
  const togglesEl = document.getElementById('domain-toggles');
  const select2dEl = document.getElementById('domain-2d-select');
  togglesEl.innerHTML = '';
  select2dEl.innerHTML = '';

  DOMAINS.forEach(domain => {
    const toggle = document.createElement('div');
    toggle.className = `domain-toggle ${state.activeDomains.has(domain.id) ? '' : 'inactive'}`;
    toggle.innerHTML = `
      <span class="domain-dot" style="background:${domain.color}"></span>
      <span class="domain-name">${domain.name}</span>
      <span class="domain-count">${domain.skills.length}</span>
    `;
    toggle.addEventListener('click', () => {
      if (state.activeDomains.has(domain.id)) {
        if (state.activeDomains.size > 1) state.activeDomains.delete(domain.id);
      } else {
        state.activeDomains.add(domain.id);
      }
      toggle.classList.toggle('inactive');
      resetView();
      buildScene();
    });
    togglesEl.appendChild(toggle);

    const btn = document.createElement('button');
    btn.className = `domain-2d-btn ${domain.id === state.selected2dDomain ? 'active' : ''}`;
    btn.style.borderColor = domain.id === state.selected2dDomain ? domain.color : '';
    btn.style.background = domain.id === state.selected2dDomain ? domain.color + '22' : '';
    btn.textContent = domain.name.substring(0, 4);
    btn.title = domain.name;
    btn.addEventListener('click', () => {
      state.selected2dDomain = domain.id;
      select2dEl.querySelectorAll('.domain-2d-btn').forEach(b => {
        b.classList.remove('active'); b.style.borderColor = ''; b.style.background = '';
      });
      btn.classList.add('active');
      btn.style.borderColor = domain.color;
      btn.style.background = domain.color + '22';
      if (state.viewMode === '2d') { resetView(); buildScene(); }
    });
    select2dEl.appendChild(btn);
  });

  document.getElementById('toggle-all').addEventListener('click', () => {
    if (state.activeDomains.size === DOMAINS.length) {
      state.activeDomains.clear(); state.activeDomains.add(DOMAINS[0].id);
    } else {
      DOMAINS.forEach(d => state.activeDomains.add(d.id));
    }
    document.querySelectorAll('.domain-toggle').forEach((el, i) => {
      el.classList.toggle('inactive', !state.activeDomains.has(DOMAINS[i].id));
    });
    resetView(); buildScene();
  });

  document.getElementById('btn-3d').addEventListener('click', () => {
    if (!document.getElementById('parent-view').classList.contains('hidden')) closeParentView();
    state.viewMode = '3d';
    document.getElementById('btn-3d').classList.add('active');
    document.getElementById('btn-2d').classList.remove('active');
    document.getElementById('btn-parent').classList.remove('active');
    resetView();
    animateCameraTo(new THREE.Vector3(0, 360, 1120), new THREE.Vector3(0, 120, 0));
    document.getElementById('domain-2d-select').parentElement.style.opacity = '0.4';
    document.getElementById('view-badge').classList.remove('hidden');
    buildScene();
  });

  document.getElementById('btn-2d').addEventListener('click', () => {
    if (!document.getElementById('parent-view').classList.contains('hidden')) {
      document.getElementById('parent-view').classList.add('hidden');
      document.getElementById('canvas3d').style.display = 'block';
      document.getElementById('domain-panel').style.display = '';
      document.getElementById('instructions').style.display = '';
    }
    state.viewMode = '2d';
    document.getElementById('btn-2d').classList.add('active');
    document.getElementById('btn-3d').classList.remove('active');
    document.getElementById('btn-parent').classList.remove('active');
    resetView();
    document.getElementById('domain-2d-select').parentElement.style.opacity = '1';
    document.getElementById('view-badge').classList.add('hidden');
    buildScene();
  });

  document.getElementById('view-badge-back').addEventListener('click', () => {
    openParentView();
  });

  const crossBtn = document.getElementById('btn-cross');
  crossBtn.textContent = 'Highlight';
  crossBtn.addEventListener('click', () => {
    state.crossDomainHighlight = !state.crossDomainHighlight;
    crossBtn.classList.toggle('active');
    crossBtn.textContent = state.crossDomainHighlight ? 'Dim' : 'Highlight';
    buildCrossDomainLines();
  });
}

// ============================================================
// SEARCH
// ============================================================
const searchInput = document.getElementById('skill-search');
const searchResultsEl = document.getElementById('search-results');
const allSkillsList = [];
DOMAINS.forEach(domain => {
  domain.skills.forEach(skill => {
    allSkillsList.push({ key: `${domain.id}.${skill.id}`, name: skill.name, domain, skill });
  });
});

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  if (q.length < 2) { searchResultsEl.classList.add('hidden'); return; }
  const matches = allSkillsList.filter(s => s.name.toLowerCase().includes(q)).slice(0, 12);
  if (matches.length === 0) { searchResultsEl.classList.add('hidden'); return; }

  searchResultsEl.innerHTML = matches.map(m => `
    <div class="search-item" data-key="${m.key}">
      <span class="info-dot" style="background:${m.domain.color}"></span>
      ${m.name}
      <span class="search-item-domain">${m.domain.name.substring(0, 6)}</span>
    </div>
  `).join('');

  searchResultsEl.querySelectorAll('.search-item').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.getAttribute('data-key');
      const domainId = key.split('.')[0];
      if (!state.activeDomains.has(domainId)) {
        state.activeDomains.add(domainId);
        document.querySelectorAll('.domain-toggle').forEach((t, i) => {
          t.classList.toggle('inactive', !state.activeDomains.has(DOMAINS[i].id));
        });
        buildScene();
      }
      if (state.viewMode === '2d' && state.selected2dDomain !== domainId) {
        state.selected2dDomain = domainId;
        document.querySelectorAll('.domain-2d-btn').forEach((b, i) => {
          const d = DOMAINS[i];
          b.classList.toggle('active', d.id === domainId);
          b.style.borderColor = d.id === domainId ? d.color : '';
          b.style.background = d.id === domainId ? d.color + '22' : '';
        });
        buildScene();
      }
      selectNode(key);
      const n = state.nodeMap.get(key);
      if (n) {
        const offset = state.viewMode === '2d' ? new THREE.Vector3(0, 2, 28) : new THREE.Vector3(8, 5, 18);
        animateCameraTo(n.worldPos.clone().add(offset), n.worldPos.clone());
      }
      searchInput.value = '';
      searchResultsEl.classList.add('hidden');
    });
  });
  searchResultsEl.classList.remove('hidden');
});

searchInput.addEventListener('blur', () => {
  setTimeout(() => searchResultsEl.classList.add('hidden'), 200);
});

// ============================================================
// PARENT / ROADMAP VIEW
// ============================================================
const STAGES = [
  { key:'elementary', label:'Elementary', sub:'Grades K–5 · Ages 5–11', icon:'🌟', tiers:[1,2,3], bg:'rgba(16,185,129,0.10)', border:'rgba(16,185,129,0.25)' },
  { key:'middle', label:'Middle School', sub:'Grades 6–8 · Ages 11–14', icon:'📚', tiers:[4,5], bg:'rgba(59,130,246,0.10)', border:'rgba(59,130,246,0.25)' },
  { key:'high', label:'High School', sub:'Grades 9–12 · Ages 14–18', icon:'🎓', tiers:[6,7], bg:'rgba(168,85,247,0.10)', border:'rgba(168,85,247,0.25)' },
  { key:'extra', label:'Advanced', sub:'College & Beyond', icon:'🚀', tiers:[8], bg:'rgba(249,115,22,0.10)', border:'rgba(249,115,22,0.25)' },
];

let pvActiveDomain = null;

function openParentView() {
  document.getElementById('parent-view').classList.remove('hidden');
  document.getElementById('canvas3d').style.display = 'none';
  document.getElementById('domain-panel').style.display = 'none';
  document.getElementById('instructions').style.display = 'none';
  document.getElementById('info-panel').classList.add('hidden');
  document.getElementById('view-badge').classList.add('hidden');
  document.getElementById('btn-parent').classList.add('active');
  document.getElementById('btn-3d').classList.remove('active');
  document.getElementById('btn-2d').classList.remove('active');
  pvActiveDomain = null;
  renderParentView();
}

function closeParentView() {
  document.getElementById('parent-view').classList.add('hidden');
  document.getElementById('canvas3d').style.display = 'block';
  document.getElementById('domain-panel').style.display = '';
  document.getElementById('instructions').style.display = '';
  document.getElementById('view-badge').classList.remove('hidden');
  document.getElementById('btn-parent').classList.remove('active');
  document.getElementById('btn-3d').classList.add('active');
  state.viewMode = '3d';
  animateCameraTo(new THREE.Vector3(0, 360, 1120), new THREE.Vector3(0, 120, 0));
}

function renderParentView() {
  const pillsEl = document.getElementById('pv-domain-pills');
  pillsEl.innerHTML = '';
  const allPill = document.createElement('button');
  allPill.className = 'pv-pill' + (pvActiveDomain === null ? ' active' : '');
  allPill.textContent = 'All Domains';
  allPill.style.color = pvActiveDomain === null ? '#fff' : '';
  allPill.style.borderColor = pvActiveDomain === null ? 'rgba(255,255,255,0.4)' : '';
  allPill.addEventListener('click', () => { pvActiveDomain = null; renderParentView(); });
  pillsEl.appendChild(allPill);

  DOMAINS.forEach(d => {
    const pill = document.createElement('button');
    pill.className = 'pv-pill' + (pvActiveDomain === d.id ? ' active' : '');
    pill.textContent = d.name;
    pill.style.color = pvActiveDomain === d.id ? d.color : '';
    pill.style.borderColor = pvActiveDomain === d.id ? d.color : '';
    pill.addEventListener('click', () => { pvActiveDomain = pvActiveDomain === d.id ? null : d.id; renderParentView(); });
    pillsEl.appendChild(pill);
  });

  const body = document.getElementById('pv-body');
  body.scrollTop = 0;
  if (pvActiveDomain === null) renderOverview(body);
  else renderDomainDetail(body, pvActiveDomain);
}

function renderOverview(body) {
  let html = '<div class="pv-summary">';
  DOMAINS.forEach(d => {
    const stageCounts = STAGES.map(st => d.skills.filter(s => st.tiers.includes(s.tier)).length);
    const maxCount = Math.max(...stageCounts, 1);
    html += `<div class="pv-summary-card" data-domain="${d.id}">`;
    html += `<div class="pv-summary-name"><span class="pv-summary-dot" style="background:${d.color}"></span>${d.name}<span style="margin-left:auto;font-size:12px;color:#7a7974;font-family:var(--font-mono)">${d.skills.length}</span></div>`;
    html += '<div class="pv-summary-bars">';
    STAGES.forEach((st, si) => {
      const pct = (stageCounts[si] / maxCount) * 100;
      html += `<div class="pv-summary-bar"><span class="pv-summary-bar-label">${st.label}</span><div class="pv-summary-bar-track"><div class="pv-summary-bar-fill" style="width:${pct}%;background:${d.color}"></div></div><span class="pv-summary-bar-count">${stageCounts[si]}</span></div>`;
    });
    html += '</div></div>';
  });
  html += '</div>';

  STAGES.forEach(st => {
    const skills = [];
    DOMAINS.forEach(d => {
      d.skills.filter(s => st.tiers.includes(s.tier)).forEach(s => skills.push({ ...s, domain: d }));
    });
    if (skills.length === 0) return;
    html += `<div class="pv-stage"><div class="pv-stage-header"><div class="pv-stage-icon" style="background:${st.bg};border:1px solid ${st.border}">${st.icon}</div><div><div class="pv-stage-label">${st.label}</div><div class="pv-stage-sub">${st.sub}</div></div><span class="pv-stage-count">${skills.length} skills</span></div><div class="pv-grid">`;
    skills.sort((a, b) => a.tier - b.tier || a.domain.name.localeCompare(b.domain.name));
    skills.forEach(s => {
      html += `<div class="pv-card" data-skill="${s.domain.id}.${s.id}"><span class="pv-card-dot" style="background:${s.domain.color}"></span><span class="pv-card-name">${s.name}</span><span class="pv-card-domain">${s.domain.name.substring(0, 4)}</span></div>`;
    });
    html += `</div></div>`;
  });

  body.innerHTML = html;
  body.querySelectorAll('.pv-summary-card').forEach(card => {
    card.addEventListener('click', () => { pvActiveDomain = card.getAttribute('data-domain'); renderParentView(); });
  });
}

function renderDomainDetail(body, domainId) {
  const d = DOMAINS.find(dm => dm.id === domainId);
  if (!d) return;
  const skillMap = new Map(d.skills.map(s => [s.id, s]));

  let html = '';
  STAGES.forEach(st => {
    const skills = d.skills.filter(s => st.tiers.includes(s.tier));
    if (skills.length === 0) return;
    skills.sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));

    html += `<div class="pv-stage"><div class="pv-stage-header"><div class="pv-stage-icon" style="background:${st.bg};border:1px solid ${st.border}">${st.icon}</div><div><div class="pv-stage-label">${st.label}</div><div class="pv-stage-sub">${st.sub}</div></div><span class="pv-stage-count">${skills.length} skills</span></div><div class="pv-grid">`;

    skills.forEach(s => {
      const prereqNames = s.prereqs.map(pid => skillMap.get(pid)?.name || pid).filter(Boolean);
      html += `<div class="pv-card" data-skill="${d.id}.${s.id}" data-expandable><span class="pv-card-dot" style="background:${d.color}"></span><span class="pv-card-name">${s.name}</span>`;
      if (prereqNames.length > 0) html += `<span style="margin-left:auto;font-size:9px;color:var(--text-faint);font-family:var(--font-mono)">${prereqNames.length} prereq${prereqNames.length > 1 ? 's' : ''}</span>`;
      html += `</div>`;
    });
    html += `</div></div>`;
  });

  body.innerHTML = html;

  body.querySelectorAll('.pv-card[data-expandable]').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-skill');
      const skillId = key.split('.')[1];
      const skill = skillMap.get(skillId);
      if (!skill) return;

      if (card.classList.contains('expanded')) {
        card.classList.remove('expanded');
        const det = card.querySelector('.pv-card-details');
        if (det) det.remove();
        return;
      }

      body.querySelectorAll('.pv-card.expanded').forEach(other => {
        other.classList.remove('expanded');
        const dd = other.querySelector('.pv-card-details');
        if (dd) dd.remove();
      });

      card.classList.add('expanded');

      const prereqNames = skill.prereqs.map(pid => skillMap.get(pid)?.name || pid);
      const crossConns = getEffectiveCrossDomain(skill, d.id).map(cd => {
        const [tDomId, tSkillId] = cd.target.split('.');
        const tDom = DOMAINS.find(dd => dd.id === tDomId);
        const tSkill = tDom?.skills.find(ss => ss.id === tSkillId);
        return { label: cd.label, domainName: tDom?.name || tDomId, skillName: tSkill?.name || tSkillId, color: tDom?.color || '#888' };
      });

      let detailHtml = '<div class="pv-card-details">';
      if (prereqNames.length > 0) {
        detailHtml += '<div class="pv-card-details-row"><span class="pv-card-details-label">Prerequisites</span></div>';
        detailHtml += '<div class="pv-card-prereqs">';
        prereqNames.forEach(name => { detailHtml += `<span class="pv-prereq-chip">${name}</span>`; });
        detailHtml += '</div>';
      }
      if (crossConns.length > 0) {
        detailHtml += '<div class="pv-card-details-row" style="margin-top:8px"><span class="pv-card-details-label">Cross-Domain Links</span></div>';
        detailHtml += '<div class="pv-card-prereqs">';
        crossConns.forEach(cc => {
          detailHtml += `<span class="pv-prereq-chip" style="border-left:2px solid ${cc.color};padding-left:6px">${cc.skillName} <span style="color:var(--text-faint);font-size:9px">${cc.label}</span></span>`;
        });
        detailHtml += '</div>';
      }
      if (prereqNames.length === 0 && crossConns.length === 0) {
        detailHtml += '<div class="pv-card-details-row" style="color:var(--text-faint)">Starting skill — no prerequisites needed</div>';
      }

      // IXL Curriculum in parent view detail cards
      if (d.id === 'math' && window.IXL_CURRICULUM) {
        const ixlData = window.IXL_CURRICULUM[skill.prototype_id || skill.id];
        if (ixlData && ixlData.length > 0) {
          detailHtml += '<div class="pv-card-details-row" style="margin-top:8px"><span class="pv-card-details-label">📖 IXL Curriculum</span></div>';
          detailHtml += '<div class="pv-card-prereqs">';
          ixlData.forEach(item => {
            const linkText = item.url ? `<a href="${item.url}" target="_blank" style="color:var(--text);text-decoration:underline">${item.skillCode}: ${item.skillName}</a>` : `${item.skillCode}: ${item.skillName}`;
            detailHtml += `<span class="pv-prereq-chip">${linkText}<br><span style="color:var(--text-faint);font-size:9px">${item.grade}</span></span>`;
          });
          detailHtml += '</div>';
        }
      }

      // Physical Materials in parent view detail cards
      if (window.PHYSICAL_MATERIALS) {
        const matKey = d.id + '.' + (skill.prototype_id || skill.id);
        const mats = window.PHYSICAL_MATERIALS[matKey];
        if (mats && mats.length > 0) {
          const typeIcons = { workbook: '📓', textbook: '📘', flashcards: '🃏', reference: '📖', supplement: '📎' };
          detailHtml += '<div class="pv-card-details-row" style="margin-top:8px"><span class="pv-card-details-label">📦 Physical Materials</span></div>';
          detailHtml += '<div class="pv-card-prereqs">';
          mats.forEach(m => {
            const icon = typeIcons[m.type] || '📄';
            const noteTxt = m.notes ? `<br><span style="color:var(--text-faint);font-size:8px">${m.notes}</span>` : '';
            detailHtml += `<span class="pv-prereq-chip">${icon} ${m.title}<br><span style="color:var(--text-faint);font-size:9px">${m.gradeRange} · ${m.type}</span>${noteTxt}</span>`;
          });
          detailHtml += '</div>';
        }
      }

      detailHtml += '</div>';
      card.insertAdjacentHTML('beforeend', detailHtml);
    });
  });
}

document.getElementById('btn-parent').addEventListener('click', openParentView);
document.getElementById('pv-close').addEventListener('click', closeParentView);

// ============================================================
// PARENT VIEW ZOOM CONTROLS
// ============================================================
(function initPvZoom() {
  const PV_ZOOM_MIN = 0.75;
  const PV_ZOOM_MAX = 2.0;
  const PV_ZOOM_STEP = 0.125;
  const PV_ZOOM_KEY = 'pvZoomScale';

  const pvEl = document.getElementById('parent-view');
  const zoomInBtn = document.getElementById('pv-zoom-in');
  const zoomOutBtn = document.getElementById('pv-zoom-out');
  const zoomLabel = document.getElementById('pv-zoom-level');

  // Default zoom scale (in-memory)
  let scale = 1;
  applyScale(scale);

  function applyScale(s) {
    scale = Math.round(s * 1000) / 1000; // avoid float drift
    pvEl.style.setProperty('--pv-scale', scale);
    zoomLabel.textContent = Math.round(scale * 100) + '%';
    // Scale stored in memory only
    zoomOutBtn.disabled = scale <= PV_ZOOM_MIN;
    zoomInBtn.disabled = scale >= PV_ZOOM_MAX;
    zoomOutBtn.style.opacity = scale <= PV_ZOOM_MIN ? '0.35' : '1';
    zoomInBtn.style.opacity = scale >= PV_ZOOM_MAX ? '0.35' : '1';
  }

  zoomInBtn.addEventListener('click', () => {
    if (scale < PV_ZOOM_MAX) applyScale(Math.min(scale + PV_ZOOM_STEP, PV_ZOOM_MAX));
  });
  zoomOutBtn.addEventListener('click', () => {
    if (scale > PV_ZOOM_MIN) applyScale(Math.max(scale - PV_ZOOM_STEP, PV_ZOOM_MIN));
  });
})();

// ============================================================
// ANIMATION LOOP - OPTIMIZED
// ============================================================
const clock = new THREE.Clock();
let frameCount = 0;

function animate() {
  requestAnimationFrame(animate);
  frameCount++;

  const elapsed = clock.getElapsedTime();

  // Smooth camera
  if (cameraTargetPos) {
    camera.position.lerp(cameraTargetPos, cameraLerpSpeed);
    controls.target.lerp(cameraTargetLookAt, cameraLerpSpeed);
    if (camera.position.distanceTo(cameraTargetPos) < 0.5) {
      camera.position.copy(cameraTargetPos);
      controls.target.copy(cameraTargetLookAt);
      cameraTargetPos = null;
      cameraTargetLookAt = null;
    }
  }

  controls.update();

  // Distance-based label visibility (every other frame)
  if (frameCount % 2 === 0) {
    // Update frustum
    projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(projScreenMatrix);

    state.labelSprites.forEach(sprite => {
      // Frustum culling for labels
      if (!frustum.containsPoint(sprite.position)) {
        sprite.visible = false;
        return;
      }
      sprite.visible = true;
      const dist = camera.position.distanceTo(sprite.position);
      // Don't render labels that are too far away
      if (dist > 320) { sprite.visible = false; return; }
      const sf = Math.max(0.6, Math.min(1.5, dist / 50));
      sprite.scale.set(sprite.userData.baseScaleX * sf, sprite.userData.baseScaleY * sf, 1);
      const fadeDist = 180;
      sprite.material.opacity = dist < fadeDist ? 1 : Math.max(0, 1 - (dist - fadeDist) / 100);
    });
  }

  // Pulse animation (simplified - no per-node material update for InstancedMesh)
  if (pulseAnimation) {
    const pa = pulseAnimation;
    const t = (elapsed - pa.startTime) / pa.duration;
    // Simple pulse: cycle line opacity
    if (t > 0 && t <= 1) {
      state.intraDomainLines.forEach(lineMesh => {
        if (lineMesh.userData.domainId === state.nodeMap.get(pa.selectedKey)?.domain.id) {
          lineMesh.material.opacity = LINE_OPACITY * (0.3 + Math.abs(Math.sin(t * Math.PI)) * 0.7);
        }
      });
    }
  }

  renderer.render(scene, camera);
}

// ============================================================
// RESIZE
// ============================================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================
// INIT
// ============================================================
buildUI();
buildScene();
animate();

// Roadmap is the default entry point — Neural Map is the in-depth view users opt into.
openParentView();

window.THREE = THREE;
window._debug = { state, camera, raycaster, scene, DOMAINS, selectNode, deselectNode, animateCameraTo, computeDepths };

// ============================================================
// PARENT INTEGRATION
// ------------------------------------------------------------
// When iframed inside index.html or portal/index.html, request
// per-student skill_progress on load and color the 3D nodes by
// state. Mirrors the existing SkillTreeViewer.html ↔ index.html
// protocol so the new viewer can drop into the same iframe slot
// without changes to the host.
// ============================================================
const STATE_COLORS = {
  locked:       new THREE.Color(0x2a2a35),
  available:    new THREE.Color(0x3b82f6),
  in_progress:  new THREE.Color(0xf59e0b),
  activated:    new THREE.Color(0xfbbf24),
  mastered:     new THREE.Color(0xfbbf24),
  needs_review: new THREE.Color(0xef4444),
};

let currentProgress = null;
let lastAppliedNodeCount = 0;

function applyProgressToNodes(progressByName) {
  if (!progressByName) return;
  for (const [, entry] of state.nodeMap) {
    const legacyName = entry.data.legacy_name || entry.data.name;
    const p = progressByName[legacyName];
    if (!p) continue;
    const color = STATE_COLORS[p.state] || STATE_COLORS.locked;
    if (entry.coreInst && entry.instanceIndex !== undefined) {
      entry.coreInst.setColorAt(entry.instanceIndex, color);
      if (entry.coreInst.instanceColor) entry.coreInst.instanceColor.needsUpdate = true;
    }
    if (entry.glowInst && entry.instanceIndex !== undefined) {
      entry.glowInst.setColorAt(entry.instanceIndex, color);
      if (entry.glowInst.instanceColor) entry.glowInst.instanceColor.needsUpdate = true;
    }
    entry.data.progress = p;
  }
  lastAppliedNodeCount = state.nodeMap.size;
}

window.addEventListener('message', (event) => {
  if (!event.data) return;
  // SKILL_DATA_RESPONSE is the index.html flow; LOAD_SKILL_TREE is the
  // portal/index.html flow (teacher viewing a student). Same payload shape.
  if (event.data.type !== 'SKILL_DATA_RESPONSE' && event.data.type !== 'LOAD_SKILL_TREE') return;
  if (event.data.subject && event.data.subject !== 'Math') return;
  currentProgress = event.data.progress || {};
  applyProgressToNodes(currentProgress);
});

if (window.parent && window.parent !== window) {
  window.parent.postMessage({ type: 'REQUEST_SKILL_DATA', subject: 'Math' }, '*');
}

// View-mode switches rebuild nodeMap (Neural Map populates lazily
// when the user opens it). Re-apply progress whenever the visible
// node count changes so colors don't desync.
setInterval(() => {
  if (currentProgress && state.nodeMap.size > 0 && state.nodeMap.size !== lastAppliedNodeCount) {
    applyProgressToNodes(currentProgress);
  }
}, 250);

window._debug.applyProgressToNodes = applyProgressToNodes;
