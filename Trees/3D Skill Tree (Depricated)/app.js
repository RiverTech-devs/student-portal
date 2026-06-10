import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DOMAINS } from './data.js';

// ============================================================
// CONSTANTS
// ============================================================
const NODE_SIZE = 0.45;
const NODE_SEGMENTS = 16;
const CROSS_DOMAIN_OPACITY_DIM = 0.06;   // barely visible (always on)
const CROSS_DOMAIN_OPACITY_BRIGHT = 0.3;  // highlighted
const LINE_OPACITY = 0.65;
const LABEL_SCALE = 0.009;
const Y_SPACING = 8.0;          // vertical space per depth level
const X_SPACING = 5.5;          // horizontal spacing between siblings
const DOMAIN_RADIUS_BASE = 40;  // base distance from center for each domain
const DOMAIN_RADIUS_PER = 6.0;  // extra per active domain
const CROSS_DOMAIN_PULL = 0.08; // how much cross-domain connections pull nodes
const STAR_COUNT = 2500;

// ============================================================
// STATE
// ============================================================
const state = {
  activeDomains: new Set(DOMAINS.map(d => d.id)),
  crossDomainHighlight: false,  // false = dim (always visible), true = bright
  viewMode: '3d',
  selected2dDomain: DOMAINS[0].id,
  selectedNode: null,
  hoveredNode: null,
  nodeMap: new Map(),
  domainGroups: new Map(),
  crossDomainLines: [],
  intraDomainLines: [],
  labelSprites: [],
  connectionMeshes: [],
};

// ============================================================
// SCENE SETUP
// ============================================================
const canvas = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x020208, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020208, 0.0025);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1200);
camera.position.set(0, 120, 260);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 5;
controls.maxDistance = 600;
controls.target.set(0, 50, 0);
controls.maxPolarAngle = Math.PI * 0.85;
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN
};

// Cancel camera animation when user manually orbits/pans/zooms
controls.addEventListener('start', () => {
  cameraTargetPos = null;
  cameraTargetLookAt = null;
});

// Lights
scene.add(new THREE.AmbientLight(0x334466, 0.4));
const dirLight = new THREE.DirectionalLight(0x8899cc, 0.4);
dirLight.position.set(30, 100, 40);
scene.add(dirLight);
scene.add(new THREE.HemisphereLight(0x223355, 0x000011, 0.3));

// Starfield background - use circular sprite texture to avoid box artifacts
function createStarTexture() {
  const size = 64;
  const cnv = document.createElement('canvas');
  cnv.width = size;
  cnv.height = size;
  const ctx = cnv.getContext('2d');
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.15, 'rgba(255,255,255,0.8)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cnv);
  return tex;
}

function createStarfield() {
  const starsGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);

  for (let i = 0; i < STAR_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 500 + Math.random() * 500;  // far away so they never clip
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    const colorType = Math.random();
    if (colorType < 0.6) {
      colors[i * 3] = 0.7 + Math.random() * 0.3;
      colors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
    } else if (colorType < 0.85) {
      colors[i * 3] = 0.5 + Math.random() * 0.3;
      colors[i * 3 + 1] = 0.6 + Math.random() * 0.3;
      colors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
    } else {
      colors[i * 3] = 0.9 + Math.random() * 0.1;
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.15;
      colors[i * 3 + 2] = 0.5 + Math.random() * 0.2;
    }
  }

  starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const starsMat = new THREE.PointsMaterial({
    size: 2.5,
    map: createStarTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,     // never render in front of scene objects
  });

  const stars = new THREE.Points(starsGeo, starsMat);
  stars.renderOrder = -1000;  // always draw first (behind everything)
  stars.frustumCulled = false;
  return stars;
}
scene.add(createStarfield());

// Subtle ground mist
const mistGeo = new THREE.PlaneGeometry(600, 600);
const mistMat = new THREE.MeshBasicMaterial({
  color: 0x0a1020,
  transparent: true,
  opacity: 0.3,
  side: THREE.DoubleSide,
});
const mist = new THREE.Mesh(mistGeo, mistMat);
mist.rotation.x = -Math.PI / 2;
mist.position.y = -3;
scene.add(mist);

// ============================================================
// ORGANIC TREE LAYOUT ENGINE
// ============================================================

function computeDepths(domain) {
  const depthMap = {};
  const skillMap = {};
  domain.skills.forEach(s => { skillMap[s.id] = s; });

  function getDepth(skillId) {
    if (depthMap[skillId] !== undefined) return depthMap[skillId];
    const skill = skillMap[skillId];
    if (!skill || skill.prereqs.length === 0) {
      depthMap[skillId] = 0;
      return 0;
    }
    let maxParentDepth = 0;
    skill.prereqs.forEach(pId => {
      if (skillMap[pId]) {
        maxParentDepth = Math.max(maxParentDepth, getDepth(pId) + 1);
      }
    });
    depthMap[skillId] = maxParentDepth;
    return maxParentDepth;
  }

  domain.skills.forEach(s => getDepth(s.id));
  return depthMap;
}

function buildChildMap(domain) {
  const childMap = {};
  domain.skills.forEach(s => { childMap[s.id] = []; });
  domain.skills.forEach(s => {
    s.prereqs.forEach(pId => {
      if (childMap[pId]) childMap[pId].push(s.id);
    });
  });
  return childMap;
}

function computeSubtreeWidths(domain, childMap, depthMap) {
  const widths = {};
  const memo = new Map();

  function getWidth(skillId) {
    if (memo.has(skillId)) return memo.get(skillId);
    const children = childMap[skillId] || [];
    if (children.length === 0) {
      memo.set(skillId, 1);
      return 1;
    }
    let w = 0;
    children.forEach(cId => {
      w += Math.min(getWidth(cId), 5);
    });
    w = Math.max(1, Math.min(w, 10));
    memo.set(skillId, w);
    return w;
  }

  domain.skills.forEach(s => { widths[s.id] = getWidth(s.id); });
  return widths;
}

/**
 * Position nodes using Sugiyama-style layered layout with barycenter crossing reduction.
 * 
 * The tree grows UPWARD with roots at the bottom.
 * Uses barycenter heuristic to minimize edge crossings:
 *   1. Initial placement by subtree width allocation
 *   2. Multiple top-down / bottom-up sweeps reordering by neighbor average
 *   3. Leaf nodes pulled close to their sole parent
 *   4. Collision resolution to enforce minimum spacing
 *   5. Subtle jitter for organic Skyrim-constellation feel
 */
function layoutDomain(domain, domainIndex, totalActive, is2D) {
  const depthMap = computeDepths(domain);
  const childMap = buildChildMap(domain);
  const widths = computeSubtreeWidths(domain, childMap, depthMap);
  const skillMap = {};
  domain.skills.forEach(s => { skillMap[s.id] = s; });

  const maxDepth = Math.max(...Object.values(depthMap));
  const positions = {};

  // Seed random per domain for consistent layout
  let seedVal = domain.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  function seededRandom() {
    seedVal = (seedVal * 16807 + 0) % 2147483647;
    return (seedVal & 0x7fffffff) / 0x7fffffff;
  }

  // Domain direction in 3D
  let angle = 0, cx = 0, cz = 0, dirX = 0, dirZ = 0, perpX = 0, perpZ = 0;
  if (!is2D) {
    const angleStep = (Math.PI * 2) / totalActive;
    angle = domainIndex * angleStep;
    const radius = DOMAIN_RADIUS_BASE + totalActive * DOMAIN_RADIUS_PER;
    cx = Math.cos(angle) * radius;
    cz = Math.sin(angle) * radius;
    dirX = Math.cos(angle);
    dirZ = Math.sin(angle);
    perpX = -dirZ;
    perpZ = dirX;
  }

  // Group skills by depth
  const depthGroups = {};
  domain.skills.forEach(s => {
    const d = depthMap[s.id];
    if (!depthGroups[d]) depthGroups[d] = [];
    depthGroups[d].push(s);
  });
  const maxD = Math.max(...Object.keys(depthGroups).map(Number));

  // Build adjacency: parents (prereqs within domain) and children
  const parentMap = {}; // skillId -> [prereq ids in this domain]
  const domSkillIds = new Set(domain.skills.map(s => s.id));
  domain.skills.forEach(s => {
    parentMap[s.id] = s.prereqs.filter(p => domSkillIds.has(p));
  });

  // --- PHASE 1: Initial ordering within each depth level ---
  // Use subtree-width-based allocation from roots upward
  const xPos = {}; // skillId -> x coordinate (flat, before 3D transform)
  const roots = domain.skills.filter(s => s.prereqs.length === 0);

  // Place roots evenly
  const rootTotalW = roots.length * X_SPACING * 3;
  roots.sort((a, b) => (widths[b.id] || 1) - (widths[a.id] || 1)); // widest root in center
  // Reorder: interleave large and small to balance
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

  // Place remaining levels: initial x = average of parents' x
  for (let d = 1; d <= maxD; d++) {
    const level = depthGroups[d] || [];
    level.forEach(s => {
      const pxs = parentMap[s.id].filter(p => xPos[p] !== undefined).map(p => xPos[p]);
      if (pxs.length > 0) {
        xPos[s.id] = pxs.reduce((a, b) => a + b, 0) / pxs.length;
      } else {
        xPos[s.id] = 0; // fallback
      }
    });
  }

  // --- PHASE 2: Barycenter crossing reduction (multiple sweeps) ---
  // For each level, reorder nodes by the average x of their neighbors in adjacent levels
  function barycenterFromParents(skillId) {
    const pxs = parentMap[skillId].filter(p => xPos[p] !== undefined).map(p => xPos[p]);
    return pxs.length > 0 ? pxs.reduce((a, b) => a + b, 0) / pxs.length : xPos[skillId];
  }
  function barycenterFromChildren(skillId) {
    const cxs = (childMap[skillId] || []).filter(c => xPos[c] !== undefined).map(c => xPos[c]);
    return cxs.length > 0 ? cxs.reduce((a, b) => a + b, 0) / cxs.length : xPos[skillId];
  }

  for (let sweep = 0; sweep < 12; sweep++) {
    // Top-down: for each level (skip roots), set x to parent barycenter, then space out
    for (let d = 1; d <= maxD; d++) {
      const level = depthGroups[d] || [];
      // Compute ideal x from parents
      level.forEach(s => {
        xPos[s.id] = barycenterFromParents(s.id);
      });
      // Sort level by x and enforce minimum spacing
      level.sort((a, b) => xPos[a.id] - xPos[b.id]);
      for (let i = 1; i < level.length; i++) {
        const prev = xPos[level[i - 1].id];
        if (xPos[level[i].id] < prev + X_SPACING) {
          xPos[level[i].id] = prev + X_SPACING;
        }
      }
      // Re-center the level around the mean of parents
      const meanX = level.reduce((sum, s) => sum + xPos[s.id], 0) / level.length;
      const parentMeanX = level.reduce((sum, s) => sum + barycenterFromParents(s.id), 0) / level.length;
      const shift = parentMeanX - meanX;
      level.forEach(s => { xPos[s.id] += shift * 0.5; });
    }

    // Bottom-up: for each level (skip leaves), nudge toward children barycenter
    for (let d = maxD - 1; d >= 0; d--) {
      const level = depthGroups[d] || [];
      level.forEach(s => {
        const childBary = barycenterFromChildren(s.id);
        // Blend: 60% current, 40% child pull
        xPos[s.id] = xPos[s.id] * 0.6 + childBary * 0.4;
      });
      // Sort and enforce spacing
      level.sort((a, b) => xPos[a.id] - xPos[b.id]);
      for (let i = 1; i < level.length; i++) {
        const prev = xPos[level[i - 1].id];
        if (xPos[level[i].id] < prev + X_SPACING) {
          xPos[level[i].id] = prev + X_SPACING;
        }
      }
    }
  }

  // --- PHASE 3: Pull leaf nodes closer to their parent ---
  domain.skills.forEach(s => {
    const children = childMap[s.id] || [];
    if (children.length === 0 && parentMap[s.id].length > 0) {
      // This is a leaf node - place very close to parent average
      const parentAvgX = parentMap[s.id]
        .filter(p => xPos[p] !== undefined)
        .reduce((sum, p, _, arr) => sum + xPos[p] / arr.length, 0);
      // Strong pull toward parent, only tiny offset to avoid exact overlap
      xPos[s.id] = parentAvgX + (seededRandom() - 0.5) * 1.5;
    }
  });

  // --- PHASE 4: Final spacing enforcement within each depth ---
  for (let d = 0; d <= maxD; d++) {
    const level = depthGroups[d] || [];
    level.sort((a, b) => xPos[a.id] - xPos[b.id]);
    for (let i = 1; i < level.length; i++) {
      const prev = xPos[level[i - 1].id];
      if (xPos[level[i].id] < prev + X_SPACING) {
        xPos[level[i].id] = prev + X_SPACING;
      }
    }
    // Center the level
    if (level.length > 0) {
      const minX = xPos[level[0].id];
      const maxX = xPos[level[level.length - 1].id];
      const center = (minX + maxX) / 2;
      // Pull toward center of root level to keep tree compact
      const rootCenter = roots.length > 0
        ? roots.reduce((s, r) => s + xPos[r.id], 0) / roots.length : 0;
      const drift = (rootCenter - center) * 0.3;
      level.forEach(s => { xPos[s.id] += drift; });
    }
  }

  // --- PHASE 5: Convert to 3D positions with organic jitter ---
  domain.skills.forEach(s => {
    const depth = depthMap[s.id];
    const y = depth * Y_SPACING;
    const x = xPos[s.id] || 0;
    // Subtle organic jitter
    const jitterX = (seededRandom() - 0.5) * 0.8;
    const jitterY = (seededRandom() - 0.5) * 0.6;
    const finalX = x + jitterX;
    const finalY = y + jitterY;

    if (is2D) {
      positions[s.id] = new THREE.Vector3(finalX, finalY, 0);
    } else {
      const fwdPush = depth * 0.5 + (seededRandom() - 0.5) * 1.0;
      const px = cx + perpX * finalX + dirX * fwdPush;
      const pz = cz + perpZ * finalX + dirZ * fwdPush;
      positions[s.id] = new THREE.Vector3(px, finalY, pz);
    }
  });

  // --- PHASE 6: Collision resolution ---
  const MIN_DIST = is2D ? 4.0 : 3.5;
  const ids = Object.keys(positions);
  for (let iter = 0; iter < 12; iter++) {
    let moved = false;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = positions[ids[i]];
        const b = positions[ids[j]];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = is2D ? 0 : (b.z - a.z);
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < MIN_DIST && dist > 0.001) {
          const push = (MIN_DIST - dist) / 2 * 0.5;
          const nx = dx / dist, ny = dy / dist, nz = dz / dist;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
          if (!is2D) {
            a.z -= nz * push;
            b.z += nz * push;
          }
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  return positions;
}

/**
 * Apply cross-domain gravitational pull.
 */
function applyCrossDomainGravity(allPositions, domainCenters) {
  DOMAINS.forEach(domain => {
    if (!state.activeDomains.has(domain.id)) return;
    const positions = allPositions[domain.id];
    if (!positions) return;

    domain.skills.forEach(skill => {
      if (!positions[skill.id]) return;
      const pos = positions[skill.id];

      skill.crossDomain.forEach(cd => {
        const targetDomainId = cd.target.split('.')[0];
        if (!state.activeDomains.has(targetDomainId)) return;
        const targetCenter = domainCenters[targetDomainId];
        if (!targetCenter) return;

        pos.x += (targetCenter.x - pos.x) * CROSS_DOMAIN_PULL;
        pos.z += (targetCenter.z - pos.z) * CROSS_DOMAIN_PULL;
      });

      // Incoming cross-domain connections
      DOMAINS.forEach(otherDomain => {
        if (otherDomain.id === domain.id) return;
        if (!state.activeDomains.has(otherDomain.id)) return;
        otherDomain.skills.forEach(otherSkill => {
          otherSkill.crossDomain.forEach(cd => {
            if (cd.target === `${domain.id}.${skill.id}`) {
              const sourceCenter = domainCenters[otherDomain.id];
              if (sourceCenter) {
                pos.x += (sourceCenter.x - pos.x) * CROSS_DOMAIN_PULL * 0.5;
                pos.z += (sourceCenter.z - pos.z) * CROSS_DOMAIN_PULL * 0.5;
              }
            }
          });
        });
      });
    });
  });
}


// ============================================================
// VISUAL HELPERS - SKYRIM CONSTELLATION STYLE
// ============================================================

/** Node color based on depth - from cool blue (roots) to warm gold (apex) */
function depthToColor(depth, maxDepth) {
  const t = Math.min(depth / Math.max(maxDepth, 1), 1);
  // Blue → Cyan → White → Gold
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

/** Create a constellation-style node with bright core and ethereal glow */
function createConstellationNode(pos, nodeColor, domainColor, isRoot, isLeaf) {
  const group = new THREE.Group();

  // Bright core sphere
  const coreSize = isRoot ? NODE_SIZE * 1.6 : (isLeaf ? NODE_SIZE * 1.2 : NODE_SIZE);
  const coreGeo = new THREE.SphereGeometry(coreSize, NODE_SEGMENTS, NODE_SEGMENTS);
  const coreMat = new THREE.MeshPhysicalMaterial({
    color: nodeColor,
    emissive: nodeColor,
    emissiveIntensity: 1.0,
    metalness: 0.1,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.copy(pos);
  group.add(core);

  // Inner glow
  const innerGlowGeo = new THREE.SphereGeometry(coreSize * 2.0, 12, 12);
  const innerGlowMat = new THREE.MeshBasicMaterial({
    color: nodeColor,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
  innerGlow.position.copy(pos);
  group.add(innerGlow);

  // Outer glow (domain colored)
  const outerGlowGeo = new THREE.SphereGeometry(coreSize * 2.5, 10, 10);
  const outerGlowMat = new THREE.MeshBasicMaterial({
    color: domainColor,
    transparent: true,
    opacity: 0.05,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
  outerGlow.position.copy(pos);
  group.add(outerGlow);

  // Point light for nearby illumination (root nodes only)
  if (isRoot) {
    const light = new THREE.PointLight(domainColor, 0.3, 12);
    light.position.copy(pos);
    group.add(light);
  }

  // Hit area
  const hitGeo = new THREE.SphereGeometry(NODE_SIZE * 3.0, 8, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.position.copy(pos);
  group.add(hitMesh);

  return { group, core, innerGlow, outerGlow, hitMesh };
}

/** Create a glowing ethereal connection line */
function createGlowLine(fromPos, toPos, color, opacity, isCross = false) {
  const group = new THREE.Group();

  // Bezier curve with slight arch
  const mid = new THREE.Vector3().lerpVectors(fromPos, toPos, 0.5);
  const dist = fromPos.distanceTo(toPos);
  mid.y += dist * (isCross ? 0.15 : 0.06);

  const curve = new THREE.QuadraticBezierCurve3(fromPos.clone(), mid, toPos.clone());
  const points = curve.getPoints(24);

  // Core line
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  let mat;
  if (isCross) {
    mat = new THREE.LineDashedMaterial({
      color,
      transparent: true,
      opacity: opacity * 0.8,
      dashSize: 0.8,
      gapSize: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  } else {
    mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  const line = new THREE.Line(geo, mat);
  if (isCross) line.computeLineDistances();
  group.add(line);

  // Glow line (slightly wider effect)
  const glowMat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: opacity * 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    linewidth: 2,
  });
  const glowLine = new THREE.Line(geo.clone(), glowMat);
  group.add(glowLine);

  return group;
}

function createTextSprite(text, color, size = 1) {
  const cnv = document.createElement('canvas');
  const ctx = cnv.getContext('2d');
  const fontSize = 48;
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const w = metrics.width + 24;
  const h = fontSize + 16;
  cnv.width = w;
  cnv.height = h;

  // Background glow behind text for readability
  ctx.fillStyle = 'rgba(2, 2, 8, 0.5)';
  const rx = 8;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, rx);
  ctx.fill();

  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = color || '#c8c7c0';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2);

  const tex = new THREE.CanvasTexture(cnv);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true,
    depthTest: false, depthWrite: false,
    blending: THREE.NormalBlending,
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
  const fontSize = 72;
  ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
  const metrics = ctx.measureText(text);
  const w = metrics.width + 40;
  const h = fontSize + 20;
  cnv.width = w;
  cnv.height = h;

  ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2);

  const tex = new THREE.CanvasTexture(cnv);
  tex.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true,
    depthTest: false, depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(w * 0.012, h * 0.012, 1);
  sprite.userData.baseScaleX = w * 0.012;
  sprite.userData.baseScaleY = h * 0.012;
  return sprite;
}

// ============================================================
// BUILD / REBUILD SCENE
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
  state.nodeMap.clear();
}

function buildScene() {
  clearScene();

  const activeDomains = DOMAINS.filter(d => state.activeDomains.has(d.id));
  const is2D = state.viewMode === '2d';
  const domainsToRender = is2D
    ? activeDomains.filter(d => d.id === state.selected2dDomain)
    : activeDomains;

  // Step 1: Compute positions for all domains
  const allPositions = {};
  const domainCenters = {};

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

  // Step 2: Apply cross-domain gravitational pull (3D only)
  if (!is2D && state.activeDomains.size > 1) {
    applyCrossDomainGravity(allPositions, domainCenters);
  }

  // Step 3: Render each domain
  domainsToRender.forEach((domain) => {
    const positions = allPositions[domain.id];
    if (!positions) return;

    const group = new THREE.Group();
    const domCol = new THREE.Color(domain.color);
    const depthMap = computeDepths(domain);
    const childMap = buildChildMap(domain);
    const maxDepth = Math.max(...Object.values(depthMap));
    const leafSet = new Set();
    domain.skills.forEach(s => {
      const children = (childMap[s.id] || []);
      if (children.length === 0) leafSet.add(s.id);
    });

    // Create nodes
    domain.skills.forEach(skill => {
      const pos = positions[skill.id];
      if (!pos) return;

      const depth = depthMap[skill.id];
      const nodeCol = depthToColor(depth, maxDepth);
      const isRoot = skill.prereqs.length === 0;
      const isLeaf = leafSet.has(skill.id);

      const { group: nodeGroup, core, innerGlow, outerGlow, hitMesh } =
        createConstellationNode(pos, nodeCol, domCol, isRoot, isLeaf);

      group.add(nodeGroup);

      hitMesh.userData = { key: `${domain.id}.${skill.id}`, domainId: domain.id, skillId: skill.id };

      // Label
      const labelSize = is2D ? 1.1 : 0.9;
      const label = createTextSprite(skill.name, domain.color, labelSize);
      label.position.copy(pos);
      label.position.y += NODE_SIZE + 0.8;
      group.add(label);
      state.labelSprites.push(label);

      const key = `${domain.id}.${skill.id}`;
      state.nodeMap.set(key, {
        mesh: core,
        data: skill,
        domain,
        worldPos: pos.clone(),
        innerGlow,
        outerGlow,
        hitMesh,
        depth,
        isRoot,
        isLeaf
      });
      core.userData = { key, domainId: domain.id, skillId: skill.id };
    });

    // Build ancestor lookup for transitive reduction
    const skillMap = new Map();
    domain.skills.forEach(s => skillMap.set(s.id, s));
    const ancestorCache = new Map();
    function getAncestors(skillId) {
      if (ancestorCache.has(skillId)) return ancestorCache.get(skillId);
      const ancestors = new Set();
      const s = skillMap.get(skillId);
      if (s) {
        s.prereqs.forEach(pid => {
          ancestors.add(pid);
          getAncestors(pid).forEach(a => ancestors.add(a));
        });
      }
      ancestorCache.set(skillId, ancestors);
      return ancestors;
    }

    // Prerequisite lines (intra-domain) - with transitive reduction
    domain.skills.forEach(skill => {
      const pos = positions[skill.id];
      if (!pos) return;

      // Transitive reduction: remove prereqs reachable through other prereqs
      const directPrereqs = [...skill.prereqs];
      const reduced = directPrereqs.filter(pid => {
        // Check if pid is an ancestor of any OTHER prereq
        return !directPrereqs.some(otherPid => {
          if (otherPid === pid) return false;
          const ancestors = getAncestors(otherPid);
          return ancestors.has(pid);
        });
      });

      reduced.forEach(prereqId => {
        const prereqPos = positions[prereqId];
        if (!prereqPos) return;

        const lineGroup = createGlowLine(prereqPos, pos, domCol, LINE_OPACITY);
        lineGroup.userData.fromKey = `${domain.id}.${prereqId}`;
        lineGroup.userData.toKey = `${domain.id}.${skill.id}`;
        group.add(lineGroup);
        state.intraDomainLines.push(lineGroup);
      });
    });

    // Domain title at the base and trunk glow
    const rootSkills = domain.skills.filter(s => s.prereqs.length === 0);
    const rootPositions = rootSkills.map(s => positions[s.id]).filter(Boolean);
    if (rootPositions.length > 0) {
      const avgPos = new THREE.Vector3();
      rootPositions.forEach(p => avgPos.add(p));
      avgPos.divideScalar(rootPositions.length);

      const domLabel = createDomainTitle(domain.name, domain.color);
      domLabel.position.set(avgPos.x, -5, avgPos.z);
      group.add(domLabel);
      state.labelSprites.push(domLabel);

      // Subtle trunk glow - a vertical beam behind the tree
      const allY = Object.values(positions).map(p => p.y);
      const treeHeight = Math.max(...allY) - Math.min(...allY) + 10;
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.8, treeHeight, 8, 1, true);
      const trunkMat = new THREE.MeshBasicMaterial({
        color: domCol,
        transparent: true,
        opacity: 0.012,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(avgPos.x, treeHeight / 2 - 3, avgPos.z);
      group.add(trunk);
    }

    scene.add(group);
    state.domainGroups.set(domain.id, group);
  });

  // Cross-domain lines (always built, opacity controlled by highlight state)
  buildCrossDomainLines();

  // Update camera for 2D to properly frame the selected tree
  if (is2D && domainsToRender.length > 0) {
    const dom = domainsToRender[0];
    const positions = allPositions[dom.id];
    if (positions) {
      const posArr = Object.values(positions);
      let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
      posArr.forEach(p => {
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
      });
      const centerY = (minY + maxY) / 2;
      const centerX = (minX + maxX) / 2;
      const height = maxY - minY;
      const width = maxX - minX;
      const dist = Math.max(height, width) * 0.85 + 20;
      animateCameraTo(
        new THREE.Vector3(centerX, centerY, dist),
        new THREE.Vector3(centerX, centerY, 0)
      );
    }
  }
}

function buildCrossDomainLines() {
  state.crossDomainLines.forEach(l => scene.remove(l));
  state.crossDomainLines = [];

  state.nodeMap.forEach((node, key) => {
    if (!state.activeDomains.has(node.domain.id)) return;

    node.data.crossDomain.forEach(cd => {
      const targetNode = state.nodeMap.get(cd.target);
      if (!targetNode) return;
      if (!state.activeDomains.has(targetNode.domain.id)) return;

      const sourcePos = node.mesh.getWorldPosition(new THREE.Vector3());
      const targetPos = targetNode.mesh.getWorldPosition(new THREE.Vector3());

      const opacity = state.crossDomainHighlight ? CROSS_DOMAIN_OPACITY_BRIGHT : CROSS_DOMAIN_OPACITY_DIM;
      const lineGroup = createGlowLine(sourcePos, targetPos, 0xffffff, opacity, true);
      lineGroup.userData.fromKey = key;
      lineGroup.userData.toKey = cd.target;
      scene.add(lineGroup);
      state.crossDomainLines.push(lineGroup);
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

// Mouse events (desktop)
canvas.addEventListener('mousedown', (e) => {
  if (e.target !== canvas) return;
  mouseDownPos.x = e.clientX;
  mouseDownPos.y = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  updateHover(e);
});

canvas.addEventListener('mouseup', (e) => {
  const dx = e.clientX - mouseDownPos.x;
  const dy = e.clientY - mouseDownPos.y;
  if (Math.sqrt(dx * dx + dy * dy) < CLICK_THRESHOLD) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    handleClick();
  }
});

// Touch events (mobile)
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
  if (dt > 300) return; // not a tap
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartPos.x;
  const dy = touch.clientY - touchStartPos.y;
  if (Math.sqrt(dx * dx + dy * dy) < 20) {
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

// Close mobile panel when tapping canvas
canvas.addEventListener('touchstart', () => {
  if (mobilePanelVisible) closeMobilePanel();
}, { passive: true });
canvas.addEventListener('mousedown', () => {
  if (mobilePanelVisible && window.innerWidth <= 768) closeMobilePanel();
});

function getMeshesUnderMouse() {
  raycaster.setFromCamera(mouse, camera);
  const meshes = [];
  state.nodeMap.forEach(n => {
    meshes.push(n.mesh);
    if (n.hitMesh) meshes.push(n.hitMesh);
  });
  return raycaster.intersectObjects(meshes);
}

function findNearestNodeScreenSpace() {
  let bestDist = Infinity;
  let bestKey = null;
  const screenPos = new THREE.Vector3();
  state.nodeMap.forEach((node, key) => {
    if (!state.activeDomains.has(node.domain.id)) return;
    if (state.viewMode === '2d' && node.domain.id !== state.selected2dDomain) return;
    node.mesh.getWorldPosition(screenPos);
    screenPos.project(camera);
    const sx = (screenPos.x + 1) / 2 * window.innerWidth;
    const sy = (-screenPos.y + 1) / 2 * window.innerHeight;
    const mouseX = (mouse.x + 1) / 2 * window.innerWidth;
    const mouseY = (-mouse.y + 1) / 2 * window.innerHeight;
    const dist = Math.sqrt((sx - mouseX) ** 2 + (sy - mouseY) ** 2);
    if (dist < bestDist) { bestDist = dist; bestKey = key; }
  });
  const threshold = isMobile ? 40 : 25;
  return bestDist < threshold ? bestKey : null;
}

function updateHover(e) {
  const hits = getMeshesUnderMouse();
  const tooltip = document.getElementById('tooltip');

  let hitKey = null;
  if (hits.length > 0) {
    const key = hits[0].object.userData.key;
    const node = state.nodeMap.get(key);
    if (node && state.activeDomains.has(node.domain.id) &&
      (state.viewMode !== '2d' || node.domain.id === state.selected2dDomain)) {
      hitKey = key;
    }
  }
  if (!hitKey) hitKey = findNearestNodeScreenSpace();

  if (hitKey) {
    const node = state.nodeMap.get(hitKey);
    if (node && state.hoveredNode !== hitKey) {
      if (state.hoveredNode) {
        const prev = state.nodeMap.get(state.hoveredNode);
        if (prev) {
          prev.mesh.material.emissiveIntensity = 0.8;
          prev.mesh.scale.setScalar(1);
          prev.innerGlow.material.opacity = 0.12;
        }
      }
      state.hoveredNode = hitKey;
      node.mesh.material.emissiveIntensity = 1.5;
      node.mesh.scale.setScalar(1.4);
      node.innerGlow.material.opacity = 0.3;
      canvas.style.cursor = 'pointer';
      const depthLabel = node.isRoot ? 'Root' : (node.isLeaf ? 'Apex' : `Depth ${node.depth}`);
      tooltip.innerHTML = `<span style="color:${node.domain.color}">${node.data.name}</span><br><span class="tooltip-tier">${depthLabel} · ${node.domain.name}</span>`;
      tooltip.classList.remove('hidden');
    }
    tooltip.style.left = (e.clientX + 16) + 'px';
    tooltip.style.top = (e.clientY - 8) + 'px';
  } else {
    if (state.hoveredNode) {
      const prev = state.nodeMap.get(state.hoveredNode);
      if (prev) {
        prev.mesh.material.emissiveIntensity = 0.8;
        prev.mesh.scale.setScalar(1);
        prev.innerGlow.material.opacity = 0.12;
      }
      state.hoveredNode = null;
    }
    tooltip.classList.add('hidden');
    canvas.style.cursor = 'default';
  }
}

function handleClick() {
  const hits = getMeshesUnderMouse();
  if (hits.length > 0) {
    const key = hits[0].object.userData.key;
    const node = state.nodeMap.get(key);
    if (node && state.activeDomains.has(node.domain.id) &&
      (state.viewMode !== '2d' || node.domain.id === state.selected2dDomain)) {
      selectNode(key);
      return;
    }
  }

  // Screen-space fallback
  let bestDist = Infinity, bestKey = null;
  const screenPos = new THREE.Vector3();
  state.nodeMap.forEach((node, key) => {
    if (!state.activeDomains.has(node.domain.id)) return;
    if (state.viewMode === '2d' && node.domain.id !== state.selected2dDomain) return;
    node.mesh.getWorldPosition(screenPos);
    screenPos.project(camera);
    const sx = (screenPos.x + 1) / 2 * window.innerWidth;
    const sy = (-screenPos.y + 1) / 2 * window.innerHeight;
    const mouseX = (mouse.x + 1) / 2 * window.innerWidth;
    const mouseY = (-mouse.y + 1) / 2 * window.innerHeight;
    const dist = Math.sqrt((sx - mouseX) ** 2 + (sy - mouseY) ** 2);
    if (dist < bestDist) { bestDist = dist; bestKey = key; }
  });

  const clickThreshold = isMobile ? 50 : 30;
  if (bestKey && bestDist < clickThreshold) selectNode(bestKey);
  else deselectNode();
}

/**
 * Trace the FULL ancestry path from a node back to all roots.
 * Returns a Set of keys for every ancestor on any path to a root.
 */
function traceAncestryPath(key) {
  const pathKeys = new Set();
  const node = state.nodeMap.get(key);
  if (!node) return pathKeys;

  function walk(skillId) {
    const k = `${node.domain.id}.${skillId}`;
    if (pathKeys.has(k)) return;
    pathKeys.add(k);
    const n = state.nodeMap.get(k);
    if (n && n.data.prereqs.length > 0) {
      n.data.prereqs.forEach(pId => walk(pId));
    }
  }
  walk(node.data.id);
  return pathKeys;
}

/**
 * Build an ordered path (array of arrays of keys, one per depth level)
 * from roots down to the target for the light pulse animation.
 */
function buildOrderedPath(key, ancestryKeys) {
  const node = state.nodeMap.get(key);
  if (!node) return [];
  const depthMap = computeDepths(node.domain);
  const levels = new Map(); // depth -> [keys]
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

// State for animated light pulse
let pulseAnimation = null;  // { levels, startTime, duration, pathKeys }

function selectNode(key) {
  if (state.selectedNode) {
    const prev = state.nodeMap.get(state.selectedNode);
    if (prev) prev.outerGlow.material.opacity = 0.05;
  }

  state.selectedNode = key;
  const node = state.nodeMap.get(key);
  if (!node) return;

  node.outerGlow.material.opacity = 0.2;

  // === Full ancestry path (all prereqs back to roots) ===
  const ancestryKeys = traceAncestryPath(key);

  // Direct children (unlocks)
  const childKeys = new Set();
  node.domain.skills.filter(s => s.prereqs.includes(node.data.id))
    .forEach(s => childKeys.add(`${node.domain.id}.${s.id}`));

  // Cross-domain connections
  const crossKeys = new Set();
  node.data.crossDomain.forEach(cd => crossKeys.add(cd.target));
  state.nodeMap.forEach((n, nKey) => {
    n.data.crossDomain.forEach(cd => { if (cd.target === key) crossKeys.add(nKey); });
  });

  // Everything that should stay visible
  const allVisibleKeys = new Set([...ancestryKeys, ...childKeys, ...crossKeys]);

  // === Dim everything not in the path ===
  state.nodeMap.forEach((n, nKey) => {
    if (allVisibleKeys.has(nKey)) {
      n.mesh.material.transparent = false;
      n.mesh.material.opacity = 1;
      if (ancestryKeys.has(nKey)) {
        // Ancestry path: bright
        n.mesh.material.emissiveIntensity = 1.0;
        n.innerGlow.material.opacity = 0.2;
      } else {
        // Children/cross: slightly less bright
        n.mesh.material.emissiveIntensity = 0.7;
        n.innerGlow.material.opacity = 0.12;
      }
    } else {
      // Dim everything else
      n.mesh.material.opacity = 0.06;
      n.mesh.material.transparent = true;
      n.mesh.material.emissiveIntensity = 0.08;
      n.innerGlow.material.opacity = 0.0;
      n.outerGlow.material.opacity = 0.0;
    }
  });

  // Dim non-path intra-domain lines, but keep path lines bright
  state.intraDomainLines.forEach(lineGroup => {
    const fk = lineGroup.userData.fromKey;
    const tk = lineGroup.userData.toKey;
    const onPath = fk && tk && ancestryKeys.has(fk) && ancestryKeys.has(tk);
    lineGroup.traverse(child => {
      if (!child.material) return;
      if (onPath) {
        // Brighten path lines significantly
        child.material.opacity = Math.min(child.material.opacity * 2.5, 1.0);
        if (child.material.opacity < 0.3) child.material.opacity = 0.5;
      } else {
        child.material.opacity *= 0.08;
      }
    });
  });

  // Dim cross-domain lines not connected to this node, brighten those that are
  state.crossDomainLines.forEach(lineGroup => {
    const fk = lineGroup.userData.fromKey;
    const tk = lineGroup.userData.toKey;
    const connected = (fk === key || tk === key || crossKeys.has(fk) || crossKeys.has(tk));
    lineGroup.traverse(child => {
      if (!child.material) return;
      if (connected) {
        child.material.opacity = CROSS_DOMAIN_OPACITY_BRIGHT;
      } else {
        child.material.opacity = 0.015;
      }
    });
  });

  // === Start light pulse animation from roots to selected node ===
  const orderedLevels = buildOrderedPath(key, ancestryKeys);
  pulseAnimation = {
    levels: orderedLevels,
    startTime: clock.getElapsedTime(),
    duration: Math.min(orderedLevels.length * 0.18, 2.5),  // pulse speed
    pathKeys: ancestryKeys,
    selectedKey: key,
    domainColor: new THREE.Color(node.domain.color),
  };

  // === Camera: fly to focus on selected node ===
  const worldPos = new THREE.Vector3();
  node.mesh.getWorldPosition(worldPos);
  const offset = state.viewMode === '2d'
    ? new THREE.Vector3(0, 3, 30)
    : new THREE.Vector3(10, 8, 25);
  animateCameraTo(worldPos.clone().add(offset), worldPos.clone());

  // === Info panel ===
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

  // Full path back to roots (visual breadcrumb)
  if (!node.isRoot) {
    const pathLevels = orderedLevels;
    html += `<div class="info-section"><h4>Path from Root</h4><div class="info-path">`;
    pathLevels.forEach((levelKeys, i) => {
      levelKeys.forEach(lk => {
        const ln = state.nodeMap.get(lk);
        if (!ln) return;
        const isSelected = lk === key;
        const cls = isSelected ? 'info-path-node info-path-current' : 'info-path-node';
        html += `<div class="${cls}" data-key="${lk}"><span class="info-dot" style="background:${node.domain.color}"></span>${ln.data.name}</div>`;
      });
      if (i < pathLevels.length - 1) {
        html += `<div class="info-path-arrow">↓</div>`;
      }
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

  // Cross-domain
  if (node.data.crossDomain.length > 0) {
    html += `<div class="info-section"><h4>Cross-Domain</h4>`;
    node.data.crossDomain.forEach(cd => {
      const tDomain = DOMAINS.find(d => d.id === cd.target.split('.')[0]);
      const tSkill = tDomain?.skills.find(s => s.id === cd.target.split('.')[1]);
      html += `<div class="info-cross" data-key="${cd.target}"><span class="info-dot" style="background:${tDomain?.color || '#888'}"></span>${tSkill?.name || cd.target}<span class="info-cross-label">${cd.label}</span></div>`;
    });
    html += `</div>`;
  }

  const incoming = [];
  state.nodeMap.forEach((n, nKey) => {
    n.data.crossDomain.forEach(cd => {
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
  if (state.selectedNode) {
    const prev = state.nodeMap.get(state.selectedNode);
    if (prev) prev.outerGlow.material.opacity = 0.05;
    state.selectedNode = null;
  }
  state.nodeMap.forEach(n => {
    n.mesh.material.opacity = 1;
    n.mesh.material.transparent = false;
    n.mesh.material.emissiveIntensity = 1.0;
    n.innerGlow.material.opacity = 0.15;
    n.outerGlow.material.opacity = 0.05;
  });
  // Restore line opacity
  state.intraDomainLines.forEach(lineGroup => {
    lineGroup.traverse(child => {
      if (child.material) {
        child.material.opacity = child.material === child.parent?.children?.[1]?.material
          ? LINE_OPACITY * 0.2 : LINE_OPACITY;
      }
    });
  });
  // Rebuild to reset all opacities cleanly
  buildScene();
  document.getElementById('info-panel').classList.add('hidden');

  // Fly camera back to centered overview
  if (state.viewMode === '2d') {
    // Re-center on the selected 2D domain tree
    const dom = DOMAINS.find(d => d.id === state.selected2dDomain);
    if (dom) {
      const positions = {};
      const depthMap = computeDepths(dom);
      dom.skills.forEach(s => {
        const p = state.nodeMap.get(`${dom.id}.${s.id}`);
        if (p) positions[s.id] = p.worldPos;
      });
      const posArr = Object.values(positions);
      if (posArr.length > 0) {
        let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
        posArr.forEach(p => {
          minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
          minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
        });
        const centerY = (minY + maxY) / 2;
        const centerX = (minX + maxX) / 2;
        const height = maxY - minY;
        const width = maxX - minX;
        const dist = Math.max(height, width) * 0.85 + 20;
        animateCameraTo(
          new THREE.Vector3(centerX, centerY, dist),
          new THREE.Vector3(centerX, centerY, 0),
          0.08
        );
      }
    }
  } else {
    // 3D overview - faster lerp for fly-back
    animateCameraTo(
      new THREE.Vector3(0, 120, 260),
      new THREE.Vector3(0, 50, 0),
      0.08
    );
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
        b.classList.remove('active');
        b.style.borderColor = '';
        b.style.background = '';
      });
      btn.classList.add('active');
      btn.style.borderColor = domain.color;
      btn.style.background = domain.color + '22';
      if (state.viewMode === '2d') {
        resetView();
        buildScene();
      }
    });
    select2dEl.appendChild(btn);
  });

  document.getElementById('toggle-all').addEventListener('click', () => {
    if (state.activeDomains.size === DOMAINS.length) {
      state.activeDomains.clear();
      state.activeDomains.add(DOMAINS[0].id);
    } else {
      DOMAINS.forEach(d => state.activeDomains.add(d.id));
    }
    document.querySelectorAll('.domain-toggle').forEach((el, i) => {
      el.classList.toggle('inactive', !state.activeDomains.has(DOMAINS[i].id));
    });
    resetView();
    buildScene();
  });

  document.getElementById('btn-3d').addEventListener('click', () => {
    state.viewMode = '3d';
    document.getElementById('btn-3d').classList.add('active');
    document.getElementById('btn-2d').classList.remove('active');
    resetView();
    animateCameraTo(new THREE.Vector3(0, 120, 260), new THREE.Vector3(0, 50, 0));
    document.getElementById('domain-2d-select').parentElement.style.opacity = '0.4';
    buildScene();
  });

  document.getElementById('btn-2d').addEventListener('click', () => {
    state.viewMode = '2d';
    document.getElementById('btn-2d').classList.add('active');
    document.getElementById('btn-3d').classList.remove('active');
    resetView();
    document.getElementById('domain-2d-select').parentElement.style.opacity = '1';
    buildScene();
  });

  const crossBtn = document.getElementById('btn-cross');
  crossBtn.textContent = 'Highlight';
  crossBtn.addEventListener('click', () => {
    state.crossDomainHighlight = !state.crossDomainHighlight;
    crossBtn.classList.toggle('active');
    crossBtn.textContent = state.crossDomainHighlight ? 'Dim' : 'Highlight';
    // Rebuild cross-domain lines with new opacity
    state.crossDomainLines.forEach(l => scene.remove(l));
    state.crossDomainLines = [];
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
      const node = state.nodeMap.get(key);
      if (node) {
        const worldPos = new THREE.Vector3();
        node.mesh.getWorldPosition(worldPos);
        const offset = state.viewMode === '2d'
          ? new THREE.Vector3(0, 2, 28)
          : new THREE.Vector3(8, 5, 18);
        animateCameraTo(worldPos.clone().add(offset), worldPos.clone());
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
// ANIMATION LOOP
// ============================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
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

  // Gentle twinkle on nodes
  state.nodeMap.forEach((node, key) => {
    const baseY = node.worldPos.y;
    const hash = key.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const floatY = baseY + Math.sin(elapsed * 0.5 + hash * 0.1) * 0.04;
    node.mesh.position.y = floatY;
    if (node.innerGlow) node.innerGlow.position.y = floatY;
    if (node.outerGlow) node.outerGlow.position.y = floatY;
    if (node.hitMesh) node.hitMesh.position.y = floatY;

    // Twinkle effect
    if (!state.selectedNode || state.selectedNode === key) {
      const twinkle = 0.7 + Math.sin(elapsed * 1.2 + hash * 0.3) * 0.15;
      if (node.mesh.material.emissiveIntensity > 0.5) {
        node.mesh.material.emissiveIntensity = twinkle;
      }
    }
  });

  // Distance-based label visibility
  state.labelSprites.forEach(sprite => {
    const dist = camera.position.distanceTo(sprite.position);
    const sf = Math.max(0.6, Math.min(1.5, dist / 50));
    sprite.scale.set(sprite.userData.baseScaleX * sf, sprite.userData.baseScaleY * sf, 1);
    // Fade labels that are far away
    const fadeDist = 180;
    const alpha = dist < fadeDist ? 1 : Math.max(0, 1 - (dist - fadeDist) / 120);
    sprite.material.opacity = alpha;
  });

  // Pulse selected node
  if (state.selectedNode) {
    const node = state.nodeMap.get(state.selectedNode);
    if (node) {
      node.outerGlow.material.opacity = 0.12 + Math.sin(elapsed * 2.5) * 0.08;
      node.innerGlow.material.opacity = 0.25 + Math.sin(elapsed * 3) * 0.1;
      node.mesh.material.emissiveIntensity = 1.2 + Math.sin(elapsed * 2) * 0.3;
    }
  }

  // Animated light pulse from roots to selected node
  if (pulseAnimation) {
    const pa = pulseAnimation;
    const t = (elapsed - pa.startTime) / pa.duration;

    // Build a depth lookup for path keys to animate lines
    const keyToLevel = new Map();
    pa.levels.forEach((levelKeys, i) => {
      levelKeys.forEach(k => keyToLevel.set(k, i));
    });

    // Helper: animate path lines based on current pulse position
    const animatePathLines = (currentLevel) => {
      state.intraDomainLines.forEach(lineGroup => {
        const fk = lineGroup.userData.fromKey;
        const tk = lineGroup.userData.toKey;
        if (!fk || !tk || !pa.pathKeys.has(fk) || !pa.pathKeys.has(tk)) return;
        const fromLevel = keyToLevel.get(fk);
        const toLevel = keyToLevel.get(tk);
        if (fromLevel === undefined || toLevel === undefined) return;
        const lineMidLevel = (fromLevel + toLevel) / 2;
        const dist = Math.abs(lineMidLevel - currentLevel);
        const intensity = Math.max(0, 1 - dist * 0.5);
        lineGroup.traverse(child => {
          if (!child.material) return;
          child.material.opacity = LINE_OPACITY * (0.8 + intensity * 1.2);
        });
      });
    };

    if (t > 1.5) {
      // Pulse complete - but keep repeating subtly
      const loopT = ((elapsed - pa.startTime - pa.duration) * 0.3) % 1;
      const currentLevel = Math.floor(loopT * pa.levels.length);
      pa.levels.forEach((levelKeys, i) => {
        levelKeys.forEach(k => {
          const n = state.nodeMap.get(k);
          if (!n) return;
          if (i === currentLevel) {
            n.innerGlow.material.opacity = 0.35;
            n.mesh.material.emissiveIntensity = 1.4;
          } else {
            n.innerGlow.material.opacity = 0.15;
            n.mesh.material.emissiveIntensity = 0.9;
          }
        });
      });
      animatePathLines(currentLevel);
    } else if (t >= 0 && t <= 1) {
      // Main pulse sweep
      const currentLevel = t * pa.levels.length;
      pa.levels.forEach((levelKeys, i) => {
        const dist = Math.abs(i - currentLevel);
        const intensity = Math.max(0, 1 - dist * 0.5);
        levelKeys.forEach(k => {
          const n = state.nodeMap.get(k);
          if (!n) return;
          n.innerGlow.material.opacity = 0.1 + intensity * 0.4;
          n.mesh.material.emissiveIntensity = 0.6 + intensity * 1.0;
          if (intensity > 0.5) {
            n.outerGlow.material.opacity = 0.08 + intensity * 0.1;
          }
        });
      });
      animatePathLines(currentLevel);
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

window.THREE = THREE;
window._debug = { state, camera, raycaster, scene, DOMAINS, selectNode, deselectNode, animateCameraTo, computeDepths };
