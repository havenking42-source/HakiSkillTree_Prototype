/* ===========================================================
   One Piece Haki Skill Trees - Unified Viewport Version
   =========================================================== */

const trees = [
  { id: "armament-tree", file: "data/armament.json", title: "Armament Haki" },
  { id: "observation-tree", file: "data/observation.json", title: "Observation Haki" },
  { id: "conqueror-tree", file: "data/conqueror.json", title: "Conqueror's Haki" }
];

const descBox = document.getElementById("desc-box");
const totalInput = document.getElementById("totalPoints");
const remainingDisplay = document.getElementById("remaining");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const wrapper = document.getElementById("tree-wrapper");

// Elements for character stats UI (populated after DOM changes)
let statsToggle = null;
let charStatsBox = null;

let totalPoints = Number(totalInput?.value || 10);
let selected = new Set();
window.__treeDataStore = [];

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

/* -----------------------------------------------------------
   INITIAL LOAD
----------------------------------------------------------- */
async function loadTrees() {
  window.__treeDataStore = [];

  // Create viewport layer inside wrapper
  let viewport = document.createElement("div");
  viewport.id = "viewport";
  viewport.style.position = "absolute";
  viewport.style.left = "0";
  viewport.style.top = "0";
  viewport.style.width = "100%";
  viewport.style.height = "100%";
  viewport.style.transformOrigin = "0 0";
  viewport.style.overflow = "visible";
  wrapper.appendChild(viewport);

  // Fetch and place each tree
  for (let i = 0; i < trees.length; i++) {
    const tree = trees[i];
    let data = [];
    try {
      const res = await fetch(tree.file);
      data = await res.json();
    } catch {
      console.warn(`Missing ${tree.file}`);
    }

    data.forEach(s => {
      s.id = s.id || s.name.toLowerCase().replace(/\s+/g, "_");
      s.type = (s.type || "shared").toLowerCase();
      s.requires = Array.isArray(s.requires) ? s.requires : (s.requires ? [s.requires] : []);
    });

    const treeEl = document.getElementById(tree.id);
    const canvas = treeEl.querySelector(".tree-canvas");

    // Move this tree into viewport
    viewport.appendChild(treeEl);
    treeEl.style.position = "absolute";
  treeEl.style.left = `${i * window.innerWidth * 0.95}px`; // wider spacing between trees
    treeEl.style.top = "0";
    treeEl.style.width = "900px";
    treeEl.style.height = "700px";

    const container = canvas;
    window.__treeDataStore.push({ treeId: tree.id, data, container, treeEl });
    layoutAndRender(tree.id, data, container, treeEl);
  }

  updateRemainingUI();
  setupGlobalInteractions();
  attachGlobalPanZoom(viewport);

  // wire character stats toggle (elements exist after DOM updates)
  statsToggle = document.getElementById('statsToggle');
  charStatsBox = document.getElementById('char-stats-box');
  if (statsToggle && charStatsBox) {
    statsToggle.addEventListener('click', () => {
      if (charStatsBox.style.display === 'block') {
        charStatsBox.style.display = 'none';
      } else {
        renderCharStats();
        charStatsBox.style.display = 'block';
      }
    });
  }
}

function renderCharStats() {
  // compute from base inputs + selected skills
  if (!charStatsBox) return;
  const name = document.getElementById('charName')?.value || '';
  const basePool = Number(document.getElementById('initialPool')?.value || 0);
  const baseCap = Number(document.getElementById('initialCap')?.value || 0);

  const stats = computeCharStats(basePool, baseCap);

  charStatsBox.innerHTML = `
    <h3>Character Stats</h3>
    <div class="stat-row"><span class="stat-label">Name:</span> <span class="stat-value">${name}</span></div>
    <div class="stat-row"><span class="stat-label">Haki Pool:</span> <span class="stat-value" id="currentPool">${stats.pool}</span></div>
    <div class="stat-row"><span class="stat-label">Haki Cap:</span> <span class="stat-value" id="currentCap">${stats.cap}</span></div>
    <div class="stat-row"><span class="stat-label">Haki Dice:</span>
      <div class="dice-sub">
        <div>While attacking: <span id="diceAttack">${stats.diceAttack}</span></div>
        <div>While defending: <span id="diceDefend">${stats.diceDefend}</span></div>
        </div> <br>
    <div class="stat-row"><span class="stat-label">Observation Focus Modifier:</span> <span class="stat-value" id="currentFocus">${stats.FocusMod}</span></div>
    <div class="stat-row"><span class="stat-label">Observation Range:</span> <span class="stat-value" id="currentRange">${stats.ObsRange}</span></div>
     </div>
    </div>
  `;
}

// Compute derived character stats from base inputs plus selected skills' effects
function computeCharStats(basePool = 0, baseCap = 0) {
  // helper to flatten all nodes
  const allNodes = (window.__treeDataStore || []).flatMap(s => s.data || []);

  let pool = Number(basePool || 0);
  let cap = Number(baseCap || 0);
  

  // dice defaults
  const dieRank = { d1: 1, d2: 2, d4: 4, d6: 6, d8: 8, d10: 10 };
  const rankToDie = v => {
    for (const k of Object.keys(dieRank)) if (dieRank[k] === v) return k;
    return 'd1';
  };

  let bestAttack = dieRank.d1;
  let bestDefend = dieRank.d1;

  Array.from(selected).forEach(key => {
    const parts = key.split('::');
    const sid = parts[1];
    const node = allNodes.find(n => n.id === sid);
    if (!node) return;
    const effects = node.effects || [];
    effects.forEach(e => {
      if (!e || !e.type) return;
      const t = (e.type || '').toString().toLowerCase();
      // pool_choice: a selectable numeric increase stored on the node as _poolChoiceValue
      if (t === 'pool_choice') {
        const chosen = (node._poolChoiceValue != null) ? Number(node._poolChoiceValue) : Number(e.default || 5);
        pool += Number(chosen || 0);
        return;
      }
      if (t === 'pool') {
        pool += Number(e.delta || 0);
      } else if (t === 'cap') {
        cap += Number(e.delta || 0);
      } else if (t === 'dice') {
        // expected shape: { type: 'dice', slot: 'attack'|'defend'|'both', value: 'd4' }
        const slot = (e.slot || 'both').toString().toLowerCase();
        const val = (e.value || e.value === 0) ? e.value.toString() : '';
        const rank = dieRank[val] || (parseInt(val.replace(/[^0-9]/g, '')) || 1);
        if (slot === 'attack' || slot === 'both') bestAttack = Math.max(bestAttack, rank);
        if (slot === 'defend' || slot === 'both') bestDefend = Math.max(bestDefend, rank);
      } else if (t === 'dice_attack') {
        const val = (e.value || e.value === 0) ? e.value.toString() : '';
        const rank = dieRank[val] || (parseInt(val.replace(/[^0-9]/g, '')) || 1);
        bestAttack = Math.max(bestAttack, rank);
      } else if (t === 'dice_defend') {
        const val = (e.value || e.value === 0) ? e.value.toString() : '';
        const rank = dieRank[val] || (parseInt(val.replace(/[^0-9]/g, '')) || 1);
        bestDefend = Math.max(bestDefend, rank);
      }
    });
  });

  return {
    pool,
    cap,
    diceAttack: rankToDie(bestAttack),
    diceDefend: rankToDie(bestDefend)
  };
}

/* -----------------------------------------------------------
   LAYOUT & RENDER
----------------------------------------------------------- */
function computeDepths(data) {
  const byId = {};
  data.forEach(s => byId[s.id] = s);
  const memo = {};
  function depth(id, stack = new Set()) {
    if (memo[id] !== undefined) return memo[id];
    const s = byId[id];
    if (!s || !s.requires || s.requires.length === 0) return (memo[id] = 0);
    if (stack.has(id)) return 0;
    stack.add(id);
    const vals = s.requires.map(r => depth(r, new Set(stack)));
    return (memo[id] = 1 + Math.max(...vals));
  }
  data.forEach(s => depth(s.id));
  return memo;
}

function layoutAndRender(treeId, data, container, treeEl) {
  const depths = computeDepths(data);
  const groups = {};
  let maxDepth = 0;
  data.forEach(s => {
    const d = depths[s.id] || 0;
    if (!groups[d]) groups[d] = [];
    groups[d].push(s);
    if (d > maxDepth) maxDepth = d;
  });

  const W = 1000;
  const H = 700;
  const levelGap = 350
  const baseY = H - 300;
  const typeCols = { offense: 0.18, shared: 0.5, defense: 0.82 };

  // spacing constants used for grouping offsets (shared scope)
  const horizontalSpacing = 70; // enough to avoid overlap (node width 90)
  const verticalSpacing = 110;
  const baseOffset = 150;
  const tier2Extra = 500; // extra vertical lift for Tier 2 nodes to create larger separation
 
  // --- Grouping map: keys by sorted requires + normalized positionTag
  const siblingGroups = {};
  data.forEach(n => {
    const reqsKey = (n.requires || []).slice().sort().join('|');
    const tag = (n.positionTag || '').toLowerCase();
    const key = `${reqsKey}::${tag}`;
    if (!siblingGroups[key]) siblingGroups[key] = [];
    siblingGroups[key].push(n);
  });

  for (let depth = 0; depth <= maxDepth; depth++) {
    const nodes = groups[depth] || [];
    const byType = { offense: [], shared: [], defense: [] };
    nodes.forEach(n => {
      const t = (n.type === "offense" || n.type === "defense") ? n.type : "shared";
      byType[t].push(n);
    });

    for (const [typeKey, arr] of Object.entries(byType)) {
      if (arr.length === 0) continue;
      const cx = W * typeCols[typeKey];
      const groupW = Math.min(W * 0.5, 300 * arr.length);
      const spacing = groupW / (arr.length + 1);
      const startX = cx - groupW / 2;
      arr.forEach((node, i) => {
        let stackY = 0;
          // The original shared-column stacking applied a Y offset per index. That
          // causes diagonal placement for 'between' nodes when combined with our
          // grouping logic. Skip the automatic shared stack for 'between' nodes
          // so they are positioned strictly by the grouping rules.
          const maybeTag = (node.positionTag || '').toLowerCase();
          if (typeKey === "shared" && arr.length > 1 && maybeTag !== 'between') stackY = (i * 90);

      // Determine parents (support multiple parents). If any parents exist and have
      // positions, prefer parent-relative placement (so we place between parents
      // or above a single parent). Only fall back to column/tier layout when no
      // parent positions are available.
      const parents = (node.requires || [])
        .map(id => data.find(s => s.id === id))
        .filter(Boolean)
        .filter(p => p._pos);

      let x, y;
      if (parents.length > 0) {
        const tag = (node.positionTag || '').toLowerCase();
        const reqsKey = (node.requires || []).slice().sort().join('|');
        const groupKey = `${reqsKey}::${tag}`;
        const groupArr = siblingGroups[groupKey] || [];
        const groupIdx = groupArr.indexOf(node);

  if (tag === 'between' && parents.length > 1) {
          // Center between parent Xs and vertically center between their Ys so
          // the first 'between' node sits horizontally between the two parents.
          // Additional 'between' nodes will be stacked above by grouping pass.
          const avgX = parents.reduce((sum, p) => sum + (p._pos.x || 0), 0) / parents.length;
          const avgY = parents.reduce((sum, p) => sum + (p._pos.y || 0), 0) / parents.length;
          x = avgX;
          // If this node is Tier 2, lift it further from the parents' avg Y
          const selfIsTier2 = node.tier === 2 || node.Tier === 2;
          y = Math.round(avgY - (selfIsTier2 ? tier2Extra : 0));

          // vertical stacking will be applied later in grouping pass
        } else {
          // Single parent case (or fallback): position relative to the first parent
          const p = parents[0];
          // default: above parent
          x = p._pos.x;
          const selfIsTier2 = node.tier === 2 || node.Tier === 2;
          const yAbove = p._pos.y - levelGap - (selfIsTier2 ? tier2Extra : 0);
          y = yAbove;

          // Apply offsets for various position tags. Left/right place horizontally
          // from the parent (same Y), upleft/upright keep above parent, and
          // downleft/downright place below the parent.
          const tagLower = (node.positionTag || '').toLowerCase();
          const sideOffset = (groupIdx > 0 ? groupIdx * horizontalSpacing : 0);
          switch (tagLower) {
            case 'upleft':
              x = p._pos.x - baseOffset - sideOffset;
              y = yAbove;
              break;
            case 'up':
              // already above parent
              break;
            case 'left':
              x = p._pos.x - baseOffset - sideOffset;
              y = selfIsTier2 ? yAbove : p._pos.y; // same vertical level unless Tier2
              break;
            case 'downleft':
              x = p._pos.x - baseOffset - sideOffset;
              y = selfIsTier2 ? yAbove : p._pos.y + levelGap; // below parent unless Tier2
              break;
            case 'upright':
              x = p._pos.x + baseOffset + sideOffset;
              y = yAbove;
              break;
            case 'right':
              x = p._pos.x + baseOffset + sideOffset;
              y = selfIsTier2 ? yAbove : p._pos.y; // same vertical level unless Tier2
              break;
            case 'downright':
              x = p._pos.x + baseOffset + sideOffset;
              y = selfIsTier2 ? yAbove : p._pos.y + levelGap; // below parent unless Tier2
              break;
            default:
              // keep centered above parent
              break;
          }
        }
      } else {
        // If no parents with positions, fall back to column layout
        x = Math.round(startX + spacing * (i + 1));
        y = baseY;

        // If grouped by same requires + positionTag even without a parent, spread them
        const tag = (node.positionTag || '').toLowerCase();
        const reqsKey = (node.requires || []).slice().sort().join('|');
        const groupKey = `${reqsKey}::${tag}`;
        const groupArr = siblingGroups[groupKey] || [];
        const groupIdx = groupArr.indexOf(node);
        if (groupArr.length > 1 && groupIdx > 0) {
          if (tag === 'up' || tag === 'between') {
            // If this node itself is Tier 2, it should be lifted further from its
            // base position (and its grouping still stacks additional siblings).
            const selfIsTier2 = node.tier === 2 || node.Tier === 2;
            const extra = selfIsTier2 ? tier2Extra : 0;
            y -= groupIdx * verticalSpacing + extra;
          } else if (tag === 'upright' || tag === 'right') {
            x += groupIdx * horizontalSpacing;
          } else if (tag === 'upleft' || tag === 'left') {
            x -= groupIdx * horizontalSpacing;
          } else {
            // default spread horizontally
            x += (groupIdx * horizontalSpacing);
          }
        }
      }

      node._pos = { x, y };

      // --- Tier Anchoring adjustment (only apply when node has NO parents) ---
      if (!((node.requires || []).length > 0 && parents.length > 0)) {
        let tierBase = 0;
        if (node.tier) {
          // Base tier anchoring uses larger gap for Tier 2
          tierBase = (node.tier - 1) * 200;
          if (node.tier === 2 || node.Tier === 2) tierBase += tier2Extra;
        } else if (node.requires?.length) {
          // infer tier from requirements
          const parentTiers = node.requires
            .map(rid => {
              const parent = data.find(s => s.id === rid);
              return parent?.tier || 0;
            });
          tierBase = Math.max(...parenttiers) * 200;
        }

        y = Math.round(baseY - tierBase - depth * (levelGap / 2) + stackY);
        node._pos = { x, y };
      }

      // --- Apply grouping post-tier adjustments: vertical stacking for 'up' and 'between',
      // and horizontal offsets for left/right variants ---
      try {
        const tagPost = (node.positionTag || '').toLowerCase();
        const reqsKeyPost = (node.requires || []).slice().sort().join('|');
        const groupKeyPost = `${reqsKeyPost}::${tagPost}`;
        const groupArrPost = siblingGroups[groupKeyPost] || [];
        const idxPost = groupArrPost.indexOf(node);
        if (groupArrPost.length > 1 && idxPost > 0) {
          const hSpacing = horizontalSpacing;
          const vSpacing = verticalSpacing;
          if (tagPost === 'up' || tagPost === 'between') {
            node._pos.y -= idxPost * vSpacing;
          } else if (tagPost === 'upleft' || tagPost === 'left') {
            node._pos.x -= idxPost * hSpacing;
          } else if (tagPost === 'upright' || tagPost === 'right') {
            node._pos.x += idxPost * hSpacing;
          }
        }
      } catch (err) {
        // be defensive; grouping is optional
      }

      });
    }
  }

  container.querySelectorAll(".skill, .connector").forEach(n => n.remove());
  data.forEach(skill => createSkillNode(skill, container, treeId));

  // connectors
  data.forEach(skill => {
    if (!skill.requires?.length) return;
    skill.requires.forEach(reqId => {
      const from = data.find(s => s.id === reqId);
      const to = skill;
      if (!from?._pos || !to?._pos) return;
      const dx = to._pos.x - from._pos.x;
      const dy = to._pos.y - from._pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const line = document.createElement("div");
      line.classList.add("connector");
      line.style.width = `${dist}px`;
      line.style.left = `${from._pos.x}px`;
      line.style.top = `${from._pos.y}px`;
      line.style.transform = `rotate(${angle}deg) translateY(-50%)`;
      container.appendChild(line);
      from._outs = from._outs || [];
      from._outs.push({ toId: to.id, el: line, treeId });
    });
  });

  updateAvailabilityAll(data, treeId);
  updateConnectorsActiveAll(data, treeId);
  positionTreeTitle(treeEl, data, container);
}

function createSkillNode(skill, container, treeId) {
  const node = document.createElement("div");
  node.classList.add("skill", skill.type || "shared");
  node.textContent = skill.name;
  node.dataset.skillId = skill.id;
  node.dataset.treeId = treeId;
  node.style.left = `${skill._pos.x}px`;
  node.style.top = `${skill._pos.y}px`;

  node.addEventListener("click", e => handleSkillClick(e, skill, treeId));
  node.addEventListener("mouseenter", e => {
    hoverOverSkill = true;
    if (hideDescTimer) { clearTimeout(hideDescTimer); hideDescTimer = null; }
    showDesc(skill, e, treeId);
  });
  node.addEventListener("mouseleave", () => {
    hoverOverSkill = false;
    scheduleHideDesc();
  });

  skill._el = node;
  container.appendChild(node);
  return node;
}

/* -----------------------------------------------------------
   HOVER BOX
----------------------------------------------------------- */
// persistent box element (created on click) - only one at a time
let persistentBoxEl = null;
let persistentBoxKey = null;
// hover tracking so the desc box stays while pointer is over the skill or the box
let hoverOverSkill = false;
let hoverOverDesc = false;
let hideDescTimer = null;

function scheduleHideDesc() {
  if (hideDescTimer) clearTimeout(hideDescTimer);
  hideDescTimer = setTimeout(() => {
    if (!hoverOverSkill && !hoverOverDesc && !persistentBoxEl) {
      descBox.style.display = 'none';
    }
  }, 180);
}

function showDesc(skill, ev, treeId) {
  // ephemeral hover box: position to the right of the skill element
  const pinId = `desc-pin-${Date.now()}`;
  // Build a human-friendly "Requires" line using skill names and type tags
  let requiresDisplay = 'None';
  try {
    const reqs = Array.isArray(skill.requires) ? skill.requires : (skill.requires ? [skill.requires] : []);
    if (reqs.length > 0) {
      const store = (window.__treeDataStore || []).find(s => s.treeId === treeId) || {};
      const nodes = store.data || [];
      const reqNames = reqs.map(rid => {
        const node = nodes.find(n => n.id === rid) || {};
        const name = node.name || rid;
        return `${name}`;
      });
      const opRaw = (skill.requires_operator || skill.requiresOperator || '').toString().toLowerCase();
      let joiner = ', ';
      if (opRaw === 'or') joiner = ' or ';
      else if (opRaw === 'and') joiner = ' and ';
      requiresDisplay = reqNames.join(joiner);
    }
  } catch (e) { requiresDisplay = (skill.requires || []).join(', ') || 'None'; }

  descBox.innerHTML = `
    <button class="desc-pin" id="${pinId}" title="Pin">📌</button>
    <div class="desc-inner">
      <strong>${skill.name}</strong><br>
      Cost: ${skill.cost ?? 0}<br>
      Requires: ${requiresDisplay}<br><br>
      ${(skill.description || "").replace(/\n/g, "<br>")}
    </div>
  `;
  // Position the ephemeral hover box at the middle-left of the screen by default,
  // but if the skill is below center, align the bottom of the hover box with the
  // bottom edge of the skill so it feels attached to lower nodes.
  descBox.style.display = "block";
  // hint to the browser that we'll change transform/position for smoother updates
  try { descBox.style.willChange = 'transform, top, left'; } catch (e) {}
  try {
    const descRect = descBox.getBoundingClientRect();
    const descW = Math.min(descRect.width || 300, 520);
    const descH = descRect.height || 160;
    const gap = 8;
    if (skill && skill._el && skill._el.getBoundingClientRect) {
      const rect = skill._el.getBoundingClientRect();
      // prefer to place to the right of the skill if there's room
      let left = rect.right + gap;
      let top = rect.top; // align top edges by default
      // if right side would overflow, place to the left
      if (left + descW > window.innerWidth - 8) {
        left = rect.left - gap - descW;
      }
      // if still offscreen on left, clamp
      left = Math.max(8, Math.min(left, window.innerWidth - descW - 8));

      // vertical adjustments: if box would go below viewport, move it up so box bottom aligns with skill bottom
      if (top + descH > window.innerHeight - 8) {
        top = rect.bottom - descH;
      }
      // if box would go above viewport, clamp
      top = Math.max(8, Math.min(top, window.innerHeight - descH - 8));

      descBox.style.left = `${Math.round(left)}px`;
      descBox.style.top = `${Math.round(top)}px`;
    } else {
      // fallback: center-left
      const left = 12;
      const top = Math.max(8, Math.round(window.innerHeight / 2 - descH / 2));
      descBox.style.left = `${left}px`;
      descBox.style.top = `${top}px`;
    }
  } catch (e) {}
  // wire pin button to create a persistent box; stop event propagation
  try {
    const pin = document.getElementById(pinId);
    if (pin) {
      pin.addEventListener('click', ev => {
        ev.stopPropagation();
        // create persistent box for this skill
        createPersistentBox(skill, treeId);
      });
    }
  } catch (e) {}
  // keep the hover box visible if pointer moves from skill to the box
  // add these listeners only once to avoid duplication
  try {
    if (!descBox.dataset.hoverHandlers) {
      descBox.addEventListener('pointerenter', () => {
        hoverOverDesc = true;
        if (hideDescTimer) { clearTimeout(hideDescTimer); hideDescTimer = null; }
      });
      descBox.addEventListener('pointerleave', () => {
        hoverOverDesc = false;
        scheduleHideDesc();
      });
      descBox.dataset.hoverHandlers = '1';
    }
  } catch (e) {}
}

function createPersistentBox(skill, treeId) {
  // remove existing persistent box if any
  removePersistentBox();
  const box = document.createElement('div');
  box.className = 'persist-desc-box';
  // set border color based on skill type
  let requiresDisplay = 'None';
  try {
    const reqs = Array.isArray(skill.requires) ? skill.requires : (skill.requires ? [skill.requires] : []);
    if (reqs.length > 0) {
      const store = (window.__treeDataStore || []).find(s => s.treeId === treeId) || {};
      const nodes = store.data || [];
      const reqNames = reqs.map(rid => {
        const node = nodes.find(n => n.id === rid) || {};
        const name = node.name || rid;
        return `${name}`;
      });
      const opRaw = (skill.requires_operator || skill.requiresOperator || '').toString().toLowerCase();
      let joiner = ', ';
      if (opRaw === 'or') joiner = ' or ';
      else if (opRaw === 'and') joiner = ' and ';
      requiresDisplay = reqNames.join(joiner);
    }
  } catch (e) { requiresDisplay = (skill.requires || []).join(', ') || 'None'; }

  try {
    const t = (skill.type || 'shared').toLowerCase();
    let color = '#a00';
    if (t === 'offense') color = 'red';
    else if (t === 'defense') color = 'royalblue';
    else if (t === 'shared') color = 'purple';
    box.style.borderColor = color;
    box.style.background = 'rgba(0,0,0,0.98)'; // less transparent
  } catch (e) {}
  const closeId = `persist-close-${Date.now()}`;
  box.innerHTML = `
    <button class="persist-close" id="${closeId}" aria-label="Close">×</button>
    <div class="persist-content">
      <strong>${skill.name}</strong><br>
      Cost: ${skill.cost ?? 0}<br>
  Requires: ${requiresDisplay}<br><br>
     ${(skill.description || "").replace(/\n/g, "<br>")}
    </div>
  `;
  document.body.appendChild(box);
  // wire close
  const btn = document.getElementById(closeId);
  if (btn) btn.addEventListener('click', () => removePersistentBox());
  // make the persistent box draggable
  try {
    let dragging = false;
    let startX = 0, startY = 0, origLeft = 0, origTop = 0;
    const onMove = (ev) => {
      if (!dragging) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let nx = origLeft + dx;
      let ny = origTop + dy;
      // clamp to viewport
      const bw = box.offsetWidth;
      const bh = box.offsetHeight;
      nx = Math.max(8, Math.min(nx, window.innerWidth - bw - 8));
      ny = Math.max(8, Math.min(ny, window.innerHeight - bh - 8));
      box.style.left = nx + 'px';
      box.style.top = ny + 'px';
    };
    const onUp = (ev) => {
      if (!dragging) return;
      dragging = false;
      try { box.releasePointerCapture(ev.pointerId); } catch (e) {}
      try { document.body.style.userSelect = ''; } catch (e) {}
      box.classList.remove('dragging');
    };
    box.addEventListener('pointerdown', ev => {
      // ignore clicks on the close button
      if (ev.target.closest('.persist-close')) return;
      ev.preventDefault();
      dragging = true;
      startX = ev.clientX;
      startY = ev.clientY;
      const rect = box.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      try { box.setPointerCapture(ev.pointerId); } catch (e) {}
      try { document.body.style.userSelect = 'none'; } catch (e) {}
      box.classList.add('dragging');
    });
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    // store cleanup so removePersistentBox can remove listeners
    box._dragCleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  } catch (e) {}
  persistentBoxEl = box;
  persistentBoxKey = `${treeId}::${skill.id}`;
}

function removePersistentBox() {
  if (persistentBoxEl) {
    try { persistentBoxEl.remove(); } catch (e) {}
    try { if (persistentBoxEl._dragCleanup) persistentBoxEl._dragCleanup(); } catch(e) {}
    persistentBoxEl = null;
    persistentBoxKey = null;
  }
}

/* -----------------------------------------------------------
   SKILL CLICK
----------------------------------------------------------- */
async function handleSkillClick(e, skill, treeId) {
  e.stopPropagation();
  const key = `${treeId}::${skill.id}`;
  const el = skill._el;
  const cost = Number(skill.cost || 0);
  const remaining = totalPoints - getSpent();

  if (selected.has(key)) {
    // can't deselect if children depend on it — but allow deselection when
    // the dependent uses an OR operator and another required parent is still selected
    const store = window.__treeDataStore.find(s => s.treeId === treeId);
    const dependents = store.data.filter(s => s.requires?.includes(skill.id));
    for (const d of dependents) {
      const depKey = `${treeId}::${d.id}`;
      if (!selected.has(depKey)) continue; // only care about selected dependents
      const opRaw = (d.requires_operator || d.requiresOperator || '').toString().toLowerCase();
      const reqs = Array.isArray(d.requires) ? d.requires : (d.requires ? [d.requires] : []);
      if (opRaw === 'or') {
        // if any other required parent is still selected, it's safe to deselect this parent
        const otherSelected = reqs
          .filter(rid => rid !== skill.id)
          .some(rid => selected.has(`${treeId}::${rid}`));
        if (otherSelected) continue; // safe for this dependent
        // otherwise, this is the last selected required parent -> block
        showAlert("You must deselect dependent skills first.");
        return;
      } else {
        // AND or unspecified behavior: block deselecting while dependent is selected
        showAlert("You must deselect dependent skills first.");
        return;
      }
    }

    selected.delete(key);
    el.classList.remove("selected");
    descBox.style.display = "none";
    // if a persistent box exists for this skill, remove it
    if (persistentBoxKey === key) removePersistentBox();
  } else {
    const reqs = skill.requires || [];
    if (reqs.length) {
      const opRaw = (skill.requires_operator || skill.requiresOperator || '').toString().toLowerCase();
      if (opRaw === 'or') {
        if (!reqs.some(rid => selected.has(`${treeId}::${rid}`))) {
          showAlert("This skill requires one of its prerequisites to be selected.");
          return;
        }
      } else if (opRaw === 'and') {
        if (!reqs.every(rid => selected.has(`${treeId}::${rid}`))) {
          showAlert("Missing required skills.");
          return;
        }
      } else {
        // fallback: preserve previous behavior (shared-type acts like OR, others like AND)
        if ((skill.type || 'shared') === 'shared') {
          if (!reqs.some(rid => selected.has(`${treeId}::${rid}`))) {
            showAlert("This skill requires one of its prerequisites to be selected.");
            return;
          }
        } else {
          if (!reqs.every(rid => selected.has(`${treeId}::${rid}`))) {
            showAlert("Missing required skills.");
            return;
          }
        }
      }
    }
    if (remaining < cost) {
      showAlert("Not enough Haki points.");
      return;
    }
    selected.add(key);
    el.classList.add("selected");
    // still show ephemeral hover box to the right
    showDesc(skill, null, treeId);
    // If this skill has a pool_choice effect, prompt the user for the chosen value
    try {
      const effects = skill.effects || [];
      const hasChoice = effects.some(x => (x.type || '').toString().toLowerCase() === 'pool_choice');
      if (hasChoice) {
        const chosen = await promptPoolChoice(skill);
        // If user cancelled (null), deselect the skill
        if (chosen == null) {
          selected.delete(key);
          el.classList.remove('selected');
          // refresh availability/connectors
          const store = window.__treeDataStore.find(s => s.treeId === treeId);
          if (store) {
            updateAvailabilityAll(store.data, treeId);
            updateConnectorsActiveAll(store.data, treeId);
          }
          updateRemainingUI();
          if (charStatsBox && charStatsBox.style.display === 'block') renderCharStats();
          return;
        }
        // store chosen value on the skill for computeCharStats
        skill._poolChoiceValue = Number(chosen || 0);
      }
    } catch (err) {
      console.warn('pool choice handling failed', err);
    }
  }

  const store = window.__treeDataStore.find(s => s.treeId === treeId);
  if (store) {
    updateAvailabilityAll(store.data, treeId);
    updateConnectorsActiveAll(store.data, treeId);
  }
  updateRemainingUI();
  // Update character stats display whenever selection changes
  if (charStatsBox && charStatsBox.style.display === 'block') renderCharStats();
}

/* -----------------------------------------------------------
   AVAILABILITY & CONNECTORS
----------------------------------------------------------- */
function updateAvailabilityAll(data, treeId) {
  const selSet = new Set(
    Array.from(selected)
      .filter(k => k.startsWith(`${treeId}::`))
      .map(k => k.split("::")[1])
  );
  for (const s of data) {
    if (!s._el) continue;
    s._el.classList.remove("available");
    if (s._el.classList.contains("selected")) continue;
    const reqs = s.requires || [];
    if (reqs.length === 0) {
      s._el.classList.add("available");
    } else {
      const opRaw = (s.requires_operator || s.requiresOperator || '').toString().toLowerCase();
      if (opRaw === 'or') {
        if (reqs.some(rid => selSet.has(rid))) s._el.classList.add('available');
      } else if (opRaw === 'and') {
        if (reqs.every(rid => selSet.has(rid))) s._el.classList.add('available');
      } else {
        // fallback: shared acts like OR, others act like AND
        if ((s.type || 'shared') === 'shared') {
          if (reqs.some(rid => selSet.has(rid))) s._el.classList.add('available');
        } else {
          if (reqs.every(rid => selSet.has(rid))) s._el.classList.add('available');
        }
      }
    }
  }
}

function updateConnectorsActiveAll(data, treeId) {
  data.forEach(s => {
    if (!s._outs) return;
    s._outs.forEach(o => {
      const fromSel = selected.has(`${treeId}::${s.id}`);
      const toSel = selected.has(`${treeId}::${o.toId}`);
      o.el.classList.toggle("active", fromSel && toSel);
    });
  });
}

/* -----------------------------------------------------------
   TITLES, REMAINING, SAVE/LOAD
----------------------------------------------------------- */
function positionTreeTitle(treeEl, data) {
  const heading = treeEl.querySelector("h2");
  if (!heading) return;
  let bottomNode = null;
  data.forEach(s => {
    if (!bottomNode || s._pos.y > bottomNode._pos.y) bottomNode = s;
  });
  if (bottomNode) heading.style.left = `${bottomNode._pos.x}px`;
}

function getSpent() {
  let sum = 0;
  window.__treeDataStore.forEach(store =>
    store.data.forEach(s => {
      if (selected.has(`${store.treeId}::${s.id}`)) sum += Number(s.cost || 0);
    })
  );
  return sum;
}
function updateRemainingUI() {
  totalPoints = Number(totalInput?.value || 10);
  const remaining = totalPoints - getSpent();
  remainingDisplay.textContent = remaining < 0 ? 0 : remaining;
}

function saveProgress() {
  const save = {
    selected: Array.from(selected),
    totalPoints,
    charName: document.getElementById("charName")?.value || ""
  };
  // include any pool choice selections per node
  const poolChoices = {};
  window.__treeDataStore.forEach(store => store.data.forEach(s => {
    if (s._poolChoiceValue != null) poolChoices[s.id] = s._poolChoiceValue;
  }));
  save.poolChoices = poolChoices;
  localStorage.setItem("hakiTreeSave_v2", JSON.stringify(save));
  showAlert("Save complete.");
}

function loadProgress() {
  const raw = localStorage.getItem("hakiTreeSave_v2");
  if (!raw) return showAlert("No save found.");
  const data = JSON.parse(raw);
  selected = new Set(data.selected || []);
  if (data.totalPoints && totalInput) totalInput.value = data.totalPoints;
  if (data.charName) document.getElementById("charName").value = data.charName;
  const poolChoices = data.poolChoices || {};

  window.__treeDataStore.forEach(store => {
    store.data.forEach(s => {
      const key = `${store.treeId}::${s.id}`;
      // restore pool choice values if present
      if (poolChoices[s.id] != null) s._poolChoiceValue = poolChoices[s.id];
      s._el.classList.toggle("selected", selected.has(key));
    });
    updateAvailabilityAll(store.data, store.treeId);
    updateConnectorsActiveAll(store.data, store.treeId);
  });
  updateRemainingUI();
  if (charStatsBox && charStatsBox.style.display === 'block') renderCharStats();
  showAlert("Loaded save.");
}

// Show pool chooser modal and return chosen number or null if cancelled
function promptPoolChoice(skill) {
  return new Promise((resolve) => {
    try {
      const modal = document.getElementById('pool-chooser');
      const input = document.getElementById('pool-chooser-value');
      const title = document.getElementById('pool-chooser-title');
      const ok = document.getElementById('pool-chooser-ok');
      const cancel = document.getElementById('pool-chooser-cancel');
      const close = document.getElementById('pool-chooser-close');
      if (!modal || !input || !ok) return resolve(null);
      // set defaults
      const eff = (skill.effects || []).find(e => (e.type || '').toString().toLowerCase() === 'pool_choice');
      const def = eff && (eff.default != null) ? Number(eff.default) : 5;
      input.value = (skill._poolChoiceValue != null) ? skill._poolChoiceValue : def;
  // keep a simple static title set in the DOM
  title.textContent = `Haki Pool Increase`;
      modal.style.display = 'flex';

      const cleanup = () => {
        modal.style.display = 'none';
        ok.onclick = null; cancel.onclick = null; close.onclick = null;
      };

      ok.onclick = () => {
        const val = Number(input.value || 0);
        cleanup();
        resolve(val);
      };
      const doCancel = () => { cleanup(); resolve(null); };
      cancel.onclick = doCancel;
      close.onclick = doCancel;
    } catch (e) { resolve(null); }
  });
}

// Custom alert modal
function showAlert(msg) {
  const modal = document.getElementById('app-alert');
  const content = document.getElementById('app-alert-content');
  const ok = document.getElementById('app-alert-ok');
  if (!modal || !content || !ok) {
    try { alert(msg); } catch(e) {}
    return;
  }
  content.textContent = msg;
  modal.style.display = 'flex';
  ok.focus();
  ok.onclick = () => closeAlert();
  // wire the extra 'Fuck you' and top-close buttons
  const fu = document.getElementById('app-alert-fuck');
  if (fu) fu.onclick = () => closeAlert();
  const topc = document.getElementById('app-alert-close');
  if (topc) topc.onclick = () => closeAlert();
  // keyboard closing: Esc or Enter
  const keyHandler = (ev) => {
    if (ev.key === 'Escape' || ev.key === 'Enter') {
      closeAlert();
    }
  };
  modal._keyHandler = keyHandler;
  window.addEventListener('keydown', keyHandler);
}

function closeAlert() {
  const modal = document.getElementById('app-alert');
  if (modal) modal.style.display = 'none';
  // remove keyboard handler if set
  try {
    if (modal && modal._keyHandler) window.removeEventListener('keydown', modal._keyHandler);
  } catch (e) {}
}

/* -----------------------------------------------------------
   GLOBAL INTERACTIONS & PAN/ZOOM
----------------------------------------------------------- */
function setupGlobalInteractions() {
  saveBtn.addEventListener("click", saveProgress);
  loadBtn.addEventListener("click", loadProgress);
  totalInput.addEventListener("input", updateRemainingUI);
  document.addEventListener("click", ev => {
    if (ev.target.closest(".skill")) return;
    descBox.style.display = "none";
    // clicking outside should close ephemeral hover, but not persistent boxes
  });

  // pool chooser keyboard support (Escape to cancel)
  window.addEventListener('keydown', ev => {
    const modal = document.getElementById('pool-chooser');
    if (!modal || modal.style.display !== 'flex') return;
    if (ev.key === 'Escape') {
      const close = document.getElementById('pool-chooser-close');
      if (close && close.onclick) close.onclick();
    }
  });
}

function attachGlobalPanZoom(viewport) {
  const state = { tx: 0, ty: 0, scale: 1, dragging: false, lastX: 0, lastY: 0 };

  function apply() {
    viewport.style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
  }
  // --- Zoom Button Support ---
  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const zoomSlider = document.getElementById('zoom-slider');
  const zoomThumb = document.getElementById('zoom-thumb');
  const sliderHeight = zoomSlider ? zoomSlider.clientHeight : 100;
  if (zoomInBtn && zoomOutBtn) {
    zoomInBtn.addEventListener("click", () => {
      state.scale = clamp(state.scale * 1.15, 0.3, 3.5);
      apply();
        syncThumb();
    });
    zoomOutBtn.addEventListener("click", () => {
      state.scale = clamp(state.scale * 0.85, 0.3, 3.5);
      apply();
        syncThumb();
    });
  }

  wrapper.addEventListener("wheel", ev => {
    ev.preventDefault();
    const delta = -ev.deltaY;
    const zoomFactor = delta > 0 ? 1.08 : 0.92;
    const newScale = clamp(state.scale * zoomFactor, 0.3, 3.5);
    const rect = wrapper.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    const oldScale = state.scale;
    state.tx = cx - ((cx - state.tx) * newScale / oldScale);
    state.ty = cy - ((cy - state.ty) * newScale / oldScale);
    state.scale = newScale;
    apply();
    syncThumb();
  }, { passive: false });

  // Slider sync helpers
  function scaleToThumb(scale) {
    // map scale range [0.3,3.5] to slider Y (0..height)
    const minS = 0.3, maxS = 3.5;
    const pct = (scale - minS) / (maxS - minS);
    return Math.round((1 - pct) * (zoomSlider.clientHeight || sliderHeight));
  }
  function thumbToScale(y) {
    const minS = 0.3, maxS = 3.5;
    const h = zoomSlider.clientHeight || sliderHeight;
    const pct = 1 - clamp(y / h, 0, 1);
    return minS + pct * (maxS - minS);
  }
  function syncThumb() {
    if (!zoomSlider || !zoomThumb) return;
    const y = scaleToThumb(state.scale);
    zoomThumb.style.top = `${y}px`;
  }

  // Thumb dragging
  let draggingThumb = false;
  let thumbOffsetY = 0;
  if (zoomThumb) {
    zoomThumb.addEventListener('pointerdown', ev => {
      ev.stopPropagation();
      draggingThumb = true;
      zoomThumb.setPointerCapture(ev.pointerId);
      thumbOffsetY = ev.clientY - zoomThumb.getBoundingClientRect().top;
      try { document.body.style.userSelect = 'none'; } catch (e) {}
    });
    window.addEventListener('pointermove', ev => {
      if (!draggingThumb || !zoomSlider) return;
      const rect = zoomSlider.getBoundingClientRect();
      const y = ev.clientY - rect.top - thumbOffsetY + (zoomThumb.clientHeight/2 || 9);
      const clamped = clamp(y, 0, rect.height);
      zoomThumb.style.top = `${clamped}px`;
      state.scale = thumbToScale(clamped);
      apply();
    });
    window.addEventListener('pointerup', ev => {
      if (!draggingThumb) return;
      draggingThumb = false;
      try { zoomThumb.releasePointerCapture(ev.pointerId); } catch (e) {}
      try { document.body.style.userSelect = ''; } catch (e) {}
      syncThumb();
    });
  }

  // initialize thumb position
  setTimeout(syncThumb, 0);

  wrapper.addEventListener("pointerdown", ev => {
    if (ev.button !== 0 || ev.target.closest(".skill")) return;
    state.dragging = true;
    state.lastX = ev.clientX;
    state.lastY = ev.clientY;
    wrapper.setPointerCapture(ev.pointerId);
    // Prevent the browser from selecting text while dragging
    try { document.body.style.userSelect = 'none'; } catch (e) {}
    // show grabbing cursor while dragging
    try { document.body.style.cursor = 'grabbing'; } catch (e) {}
  });
  wrapper.addEventListener("pointermove", ev => {
    if (!state.dragging) return;
    const dx = ev.clientX - state.lastX;
    const dy = ev.clientY - state.lastY;
    state.lastX = ev.clientX;
    state.lastY = ev.clientY;
    state.tx += dx;
    state.ty += dy;
    apply();
  });
  wrapper.addEventListener("pointerup", ev => {
    state.dragging = false;
    wrapper.releasePointerCapture(ev.pointerId);
    // restore text selection and cursor
    try { document.body.style.userSelect = ''; } catch (e) {}
    try { document.body.style.cursor = ''; } catch (e) {}
  });
  wrapper.addEventListener("pointercancel", () => state.dragging = false);
}

/* -----------------------------------------------------------
   INIT
----------------------------------------------------------- */
loadTrees();
