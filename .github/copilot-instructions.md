Project: Haki Skill Tree Prototype — quick agent guide

This is a small single-page web app that renders three interactive Haki skill trees (Armament, Observation, Conqueror) from JSON data. The goal of this file is to give an AI coding agent the minimal, actionable knowledge to be productive without guessing project-specific conventions.

Key files
- `index.html` — page structure and three tree containers (`#armament-tree`, `#observation-tree`, `#conqueror-tree`).
- `style.css` — visual styles, sizing, and the `.skill` / `.connector` classes the script manipulates.
- `script.js` — application logic: data loading, layout, rendering, interactions (selection, availability rules), pan/zoom and save/load.
- `Data/*.json` — tree definitions. See examples: `Data/armament.json`, `Data/observation.json`, `Data/conqueror.json`.

Big picture architecture
- Single-page client-side app. `script.js` loads each `Data/*.json` via fetch and stores parsed arrays in `window.__treeDataStore`.
- A single "viewport" div is created inside `#tree-wrapper` for unified pan/zoom. Individual tree elements (`.tree`) are moved into that viewport and absolutely positioned.
- Data-driven rendering: each skill object is laid out by `layoutAndRender()` and rendered as a `.skill` element with computed `_pos` and a reference `_el` on the skill object.
- Interactivity is stateful and local: selected skills are tracked in the global `selected` Set (keys are `${treeId}::${skillId}`). Connectors are DOM elements added between computed node positions and toggled `active` based on selection state.

Data shape and conventions (discoverable from `Data/*.json`)
- Each skill: { id, name, cost, requires, type, description, positionTag?, Tier? }
- `requires` may be an array or absent. `type` is `offense|defense|shared` (fallbacks to shared in code). Example: `Data/armament.json` contains `"positionTag": "UpLeft"` and tier fields used by layout.
- IDs are normalized in `loadTrees()` if missing: `name.toLowerCase().replace(/\s+/g, "_")`.

Project-specific rules and patterns
- Selection keys: use `${treeId}::${skillId}` (e.g. `armament-tree::basic_offense_1`). Any code that mutates selection must use the same key format.
- Shared vs. typed requirements: for `type === 'shared'`, only one prerequisite needs to be selected; for offense/defense, all listed prerequisites must be selected. See `handleSkillClick()` and `updateAvailabilityAll()`.
- Positioning hints: optional `positionTag` values include `UpLeft`, `UpRight`, `Left`, `Right`, `Between`. `Tier` (capitalized in some JSON) influences vertical offsets. Layout code expects `_pos` on parent nodes once computed.
- Save format: localStorage key `hakiTreeSave_v2` stores `{ selected: string[], totalPoints, charName }`.

Developer workflows (how to run & debug)
- Open `index.html` in a browser (file:// works for static fetch in most browsers if files are local; if fetch fails, serve via a lightweight static server). If fetch fails in Chrome due to CORS/file restrictions, run a local server, e.g. Python: `py -m http.server 8000` from project root and open `http://localhost:8000`.
- Quick debug spots: layout & position logic in `layoutAndRender()` (computeDepths, positionTag handling); interaction logic in `handleSkillClick()` and availability in `updateAvailabilityAll()`.
- To add a new skill tree, add a new entry in the `trees` array inside `script.js` and create a matching `.tree` container in `index.html` and `Data/<name>.json`.

Small but important gotchas
- JSON keys are inconsistent in capitalization (e.g., `Tier` vs `tier`). The script sometimes reads `node.tier` — prefer adding lowercase `tier` when editing JSON or let the script infer tiers.
- Some sample JSON contains duplicate/typo IDs (e.g., `"basic_defense_1 again"`). Duplicates can break relationship lookups; keep `id` unique.
- `script.js` expects tree JSON paths under `data/` (lowercase) but the workspace holds `Data/` (capital D). The script calls `fetch(tree.file)` where tree.file is `data/armament.json`. If running on a case-sensitive server, ensure directory name matches or update `trees` to `Data/`.

Examples to reference
- Selection key example: `armament-tree::basic_offense_1` (constructed in `handleSkillClick()` and used in `updateAvailabilityAll()`).
- Data example: `Data/armament.json` skill with `positionTag: "UpLeft"` and `requires: ["armament_awakening"]`.

When editing files
- Preserve the global conventions: `window.__treeDataStore` structure, the `selected` Set, and keys formatted as `${treeId}::${skillId}`.
- Make minimal changes to layout numbers (W/H/levelGap) and test in the browser — geometry is tuned with absolute positioning and many constants.

If unsure, open these spots first
- `layoutAndRender()` — for positioning, tiers, and connectors.
- `handleSkillClick()` — for selection rules and cost enforcement.
- `attachGlobalPanZoom()` — for panning/zooming behavior on the `#viewport`.

If you want me to expand this into runnable contributor docs or add infer helpers (e.g., normalize Tier, fix path case), tell me which area to prioritize.
