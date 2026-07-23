# Scene Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore smooth OrbitControls and ≥55 FPS on the flour-mill digital twin by measuring real bottlenecks (FPS / draw calls / triangles), then applying targeted Three.js / R3F optimizations without regressing plant visuals or twin HUD behavior.

**Architecture:** Measure first with `<Stats />`, then isolate cost with A/B toggles (shadows → Environment → grid → particles). Fix the highest-impact layer next: draw-call reduction via shared materials, mesh merging/instancing for structure/piping, fewer per-machine `useFrame` hooks, and camera-distance culling for warehouse/building detail. Keep animation logic local to machines that are actually running (`lineActive` / twin tags).

**Tech Stack:** React 18, Vite, `@react-three/fiber`, `@react-three/drei` (already installed), Three.js, existing twin layer (`src/twin/*`)

**Success criteria (target hardware: mid/high desktop GPU):**

| Metric | Target | Red flag |
|--------|--------|----------|
| FPS | ≥ 55 while orbiting | < 40 |
| Draw calls | < 400 | ≥ 1500 |
| Triangles | < 1,500,000 | ≥ 3,000,000 |
| Camera feel | damping responsive, no hitching | laggy pan/rotate even at 60 FPS |

**Likely bottlenecks in this repo (pre-measure guess):**

1. High mesh count across 20+ machines + `ProcessPiping` + `PlantStructure` + warehouse
2. Many independent `useFrame` hooks (~25 machine files; Palletizer alone has 6)
3. Global shadows (`Canvas shadows` + 2048 shadow map + widespread `castShadow`/`receiveShadow`)
4. `Environment preset="city"` + dense `gridHelper` in `App.tsx`
5. Multiple `MaterialFlow` / `DustMotes` particle systems updating every frame

**Out of scope:** Rewriting machine visual design, MQTT/OPC live data, or SCADA feature work from `docs/flour-mill-digital-twin-roadmap.md`.

---

## File map

| File | Role in this plan |
|------|-------------------|
| `src/App.tsx` | Stats overlay, Canvas flags, lights/shadows, OrbitControls, Environment, grid |
| `src/components/MaterialHandlingLine.tsx` | Zone visibility / LOD mounts; particle budget; which subsystems mount |
| `src/components/MaterialFlow.tsx` | Particle count / update cost |
| `src/components/factory/ProcessPiping.tsx` | Shared pipe materials; merge/instance candidates |
| `src/components/factory/PlantStructure.tsx` | Rails/legs/frames → Instances |
| `src/components/factory/BuildingEnvelope.tsx` | Distance / cutaway cost; shadow whitelist |
| `src/components/WarehouseStaging.tsx` | Far-zone culling |
| `src/components/*.tsx` (machines) | Gate `useFrame`; drop unnecessary shadows; memoize geos/mats |
| `src/twin/SelectableMachine.tsx` | Keep selection cheap; avoid extra per-frame work |
| `src/perf/sharedMaterials.ts` | **Create** — reused steel/paint/rubber materials |
| `src/perf/PerfToggles.tsx` | **Create** — optional HUD toggles for A/B tests |
| `docs/superpowers/plans/perf-baseline.md` | **Create** — recorded Stats numbers |

---

### Task 1: Baseline measurement with Stats

**Files:**
- Modify: `src/App.tsx`
- Create: `docs/superpowers/plans/perf-baseline.md`

**Notes:** `@react-three/drei` is already in `package.json` (`^9.122.0`). Do **not** reinstall unless import fails.

- [ ] **Step 1: Add Stats to the Canvas**

In `src/App.tsx`, update the drei import and mount `<Stats />` inside `<Canvas>`:

```tsx
import { OrbitControls, Sky, Environment, Stats } from "@react-three/drei";

// inside <Canvas ...>
<Stats />
```

Place `<Stats />` as the first child of `<Canvas>` so it is always visible during profiling.

- [ ] **Step 2: Run the app and capture three camera poses**

```bash
npm run dev
```

For each pose below, wait 3 seconds after the camera settles, then record **FPS**, **calls** (draw calls), and **triangles** from the Stats panel:

1. Overview (default camera)
2. Close on roller mill / plansifter cluster
3. Close on packing cell + palletizer
4. While actively dragging OrbitControls for 5 seconds (note min FPS)

- [ ] **Step 3: Write baseline file**

Create `docs/superpowers/plans/perf-baseline.md`:

```markdown
# Perf baseline — YYYY-MM-DD

Hardware: <GPU / browser>
Branch: <branch>

| Pose | FPS | Draw calls | Triangles | Notes |
|------|-----|------------|-----------|-------|
| Overview | | | | |
| Milling close | | | | |
| Packing close | | | | |
| Orbit drag (min) | | | | |

Hypothesis after Task 1: <draw calls | shadows | frames | particles>
```

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx docs/superpowers/plans/perf-baseline.md docs/superpowers/plans/2026-07-23-scene-performance-optimization.md
git commit -m "perf: add Stats overlay and record scene baseline"
```

**Decision gate:** If draw calls ≥ 1500 → prioritize Tasks 6–8 (materials / merge / instances). If FPS low but draw calls OK → prioritize Tasks 2, 5, 10 (shadows / useFrame / particles). If FPS fine but camera feels laggy → Task 3 only.

---

### Task 2: Shadows A/B test (biggest cheap win)

**Files:**
- Modify: `src/App.tsx`
- Modify: `docs/superpowers/plans/perf-baseline.md`

- [ ] **Step 1: Disable Canvas shadows for A/B**

Change:

```tsx
<Canvas
  shadows
  dpr={[1, 2]}
  ...
>
```

to:

```tsx
<Canvas
  shadows={false}
  dpr={[1, 1.5]}
  ...
>
```

Also temporarily disable the directional light shadow:

```tsx
<directionalLight
  position={[40, 55, 30]}
  intensity={1.45}
  // castShadow
  // shadow-mapSize={[2048, 2048]}
/>
```

- [ ] **Step 2: Re-measure the same four poses**

Append a “Shadows OFF” section to `perf-baseline.md` with FPS / calls / triangles.

- [ ] **Step 3: Interpret**

- If FPS jumps ≥ +15 → shadows are a primary bottleneck; keep them off for remaining tasks, then re-enable selectively in Task 9.
- If FPS barely changes → leave shadows for later; restore `shadows` so visuals stay correct while optimizing draw calls.

- [ ] **Step 4: Commit with the chosen temporary state documented in the commit message**

```bash
git add src/App.tsx docs/superpowers/plans/perf-baseline.md
git commit -m "perf: A/B shadow cost; document FPS delta"
```

---

### Task 3: OrbitControls feel (independent of FPS)

**Files:**
- Modify: `src/App.tsx`

Current damping is already moderate (`dampingFactor={0.08}`). Tune for snappier feel and avoid accidental sluggishness.

- [ ] **Step 1: Replace OrbitControls props**

```tsx
<OrbitControls
  makeDefault
  enableDamping
  dampingFactor={0.05}
  rotateSpeed={0.8}
  zoomSpeed={1}
  panSpeed={1}
  maxPolarAngle={Math.PI / 2.05}
  target={[0, 2, 0]}
  minDistance={12}
  maxDistance={groundR * 2.5}
/>
```

- [ ] **Step 2: Manual feel check**

Orbit, pan, zoom for 20 seconds. Confirm controls feel responsive even if FPS is still mid-40s. Note in `perf-baseline.md` under “Controls feel”.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx docs/superpowers/plans/perf-baseline.md
git commit -m "perf: tighten OrbitControls damping and speeds"
```

---

### Task 4: Cheap scene-level wins (Environment, grid, DPR)

**Files:**
- Modify: `src/App.tsx`
- Modify: `docs/superpowers/plans/perf-baseline.md`

- [ ] **Step 1: Soften Environment cost**

`Environment preset="city"` loads an HDR cubemap and can be expensive. Prefer one of:

**Option A (recommended during optimization):** remove Environment temporarily:

```tsx
{/* <Environment preset="city" /> */}
```

**Option B (keep some IBL):** lower intensity via a lighter setup later; for now prefer A.

Keep `<Sky />` if the outdoor look is needed; it is cheaper than full Environment for this demo.

- [ ] **Step 2: Reduce grid density**

Current:

```tsx
<gridHelper
  args={[gridSize, Math.max(40, Math.round(gridSize / 2)), "#5c5c54", "#79796e"]}
  position={[0, 0, 0]}
/>
```

Replace with fewer divisions (cap at 40):

```tsx
<gridHelper
  args={[gridSize, Math.min(40, Math.max(20, Math.round(gridSize / 4))), "#5c5c54", "#79796e"]}
  position={[0, 0, 0]}
/>
```

- [ ] **Step 3: Cap device pixel ratio**

Keep:

```tsx
dpr={[1, 1.5]}
```

unless measuring on a 4K display where `[1, 2]` is required for sharpness — prefer FPS.

- [ ] **Step 4: Re-measure overview pose; commit**

```bash
git add src/App.tsx docs/superpowers/plans/perf-baseline.md
git commit -m "perf: reduce Environment/grid/DPR scene overhead"
```

---

### Task 5: Gate and consolidate `useFrame` work

**Files:**
- Modify: machine components that animate (see list below)
- Modify: `src/components/MaterialFlow.tsx`
- Modify: `src/twin/SelectableMachine.tsx` (only if it does per-frame work when idle)

**Machines with `useFrame` today (priority order by count):**

| Priority | File | Approx useFrame sites |
|----------|------|------------------------|
| P0 | `src/components/Palletizer.tsx` | 6 |
| P0 | `src/components/Silo.tsx`, `rollermill.tsx`, `MetalDetector.tsx`, `CheckWeigher.tsx` | 5 each |
| P1 | `scourer`, `purifier`, `damping`, `bucketElivter`, `branFinsiher`, `bagconveyr` | 4 each |
| P2 | remaining cleaning/packing machines | 2–3 each |
| P2 | `MaterialFlow.tsx`, `DustCollection.tsx`, `WarehouseStaging.tsx` | 2–3 |

- [ ] **Step 1: Early-return when inactive**

In every machine `useFrame`, skip work when the machine is not running. Pattern:

```tsx
useFrame((_, delta) => {
  if (!active) return;
  // existing animation
});
```

Wire `active` from the existing twin / line flag already passed into machines (e.g. `lineActive` from `MaterialHandlingLine` / `useTwinState`). Do **not** invent a second animation bus yet.

- [ ] **Step 2: Merge multiple hooks inside one component**

Where a single file has 3–6 separate `useFrame` callbacks (e.g. `Palletizer.tsx`), collapse into **one** `useFrame` that updates all local refs:

```tsx
useFrame((_, delta) => {
  if (!active) return;
  if (armRef.current) armRef.current.rotation.y += delta * armSpeed;
  if (conveyorRef.current) conveyorRef.current.position.x = ...;
  // all local animated parts
});
```

- [ ] **Step 3: Skip particle updates when inactive**

In `MaterialFlow.tsx`, ensure:

```tsx
useFrame(({ clock }) => {
  if (!active || !meshRef.current) return;
  // existing instance matrix updates
});
```

- [ ] **Step 4: Verify FPS with line stopped vs running**

Toggle twin/simulation so the line is idle. FPS should rise. Record both in `perf-baseline.md`.

- [ ] **Step 5: Commit**

```bash
git add src/components/Palletizer.tsx src/components/MaterialFlow.tsx src/components/*.tsx
git commit -m "perf: gate useFrame work when machines and flows are idle"
```

---

### Task 6: Shared materials module

**Files:**
- Create: `src/perf/sharedMaterials.ts`
- Modify: start with `src/components/factory/ProcessPiping.tsx` and `src/components/factory/PlantStructure.tsx` (highest reuse)

- [ ] **Step 1: Create shared materials**

```ts
// src/perf/sharedMaterials.ts
import * as THREE from "three";

export const matSteel = new THREE.MeshStandardMaterial({
  color: "#8a9096",
  metalness: 0.65,
  roughness: 0.35,
});

export const matSteelDark = new THREE.MeshStandardMaterial({
  color: "#4a5056",
  metalness: 0.7,
  roughness: 0.4,
});

export const matPaintBlue = new THREE.MeshStandardMaterial({
  color: "#3a5f8a",
  metalness: 0.25,
  roughness: 0.55,
});

export const matPaintYellow = new THREE.MeshStandardMaterial({
  color: "#c9a227",
  metalness: 0.2,
  roughness: 0.5,
});

export const matRubber = new THREE.MeshStandardMaterial({
  color: "#2a2a2a",
  metalness: 0.05,
  roughness: 0.9,
});

export const matConcrete = new THREE.MeshStandardMaterial({
  color: "#9a9a92",
  metalness: 0.05,
  roughness: 0.95,
});
```

Module-level materials are intentional (shared GPU programs). Do not recreate inside render.

- [ ] **Step 2: Swap ProcessPiping duct/steel meshes to shared mats**

In `ProcessPiping.tsx`, replace repeated `<meshStandardMaterial color="..." />` on ducts/flanges/supports with `material={matSteel}` / `matSteelDark`.

- [ ] **Step 3: Swap PlantStructure rails/frames**

Same pattern in `PlantStructure.tsx` for railing posts, deck plates, ladder rails.

- [ ] **Step 4: Re-measure draw calls**

Expect a moderate drop (materials share programs; draw calls may still be high until merge/instance). Record in baseline doc.

- [ ] **Step 5: Commit**

```bash
git add src/perf/sharedMaterials.ts src/components/factory/ProcessPiping.tsx src/components/factory/PlantStructure.tsx
git commit -m "perf: share steel/paint materials across piping and structure"
```

---

### Task 7: Memoize geometries in hot components

**Files:**
- Modify: heaviest machine files first — `Palletizer.tsx`, `rollermill.tsx`, `plansifter.tsx`, `purifier.tsx`, `BuildingEnvelope.tsx`

- [ ] **Step 1: Audit for per-render `new THREE.*Geometry`**

Search:

```bash
rg "new THREE\.(Box|Cylinder|Cone|Extrude|Shape|Tube)Geometry" src/components
```

Any geometry constructed in the component body (not in `useMemo` / module scope) must be memoized.

- [ ] **Step 2: Apply useMemo pattern**

```tsx
const bodyGeo = useMemo(() => new THREE.BoxGeometry(1.2, 0.8, 0.6), []);
// ...
<mesh geometry={bodyGeo} material={matSteel} />
```

Prefer JSX args for static primitives when they are not rebuilt:

```tsx
<boxGeometry args={[1.2, 0.8, 0.6]} />
```

R3F already caches identical `<boxGeometry args={...} />` in many cases; focus on **imperative** `new THREE.*` and Extrude/Shape/Tube paths.

- [ ] **Step 3: Avoid MeshPhysicalMaterial unless necessary**

Search and replace decorative physical materials with `MeshStandardMaterial` / shared mats:

```bash
rg "MeshPhysicalMaterial|meshPhysicalMaterial" src
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Palletizer.tsx src/components/rollermill.tsx src/components/plansifter.tsx src/components/purifier.tsx src/components/factory/BuildingEnvelope.tsx
git commit -m "perf: memoize heavy geometries and drop physical materials where unused"
```

---

### Task 8: Instancing for repeated structure parts

**Files:**
- Modify: `src/components/factory/PlantStructure.tsx`
- Optionally modify: `src/components/WarehouseStaging.tsx`, `src/components/factory/Electrical.tsx`

**Prime instance candidates in this plant:**

- Safety railing posts / toes
- Mezzanine legs / columns
- Ladder rungs (if many separate meshes)
- Warehouse pallet stacks / rack uprights
- Cable tray hangers / light fixtures in `Electrical.tsx`

- [ ] **Step 1: Convert one repeated part (railing posts) to `<Instances>`**

Example pattern with drei:

```tsx
import { Instances, Instance } from "@react-three/drei";
import { matSteelDark } from "../../perf/sharedMaterials";

export function RailingPosts({ positions }: { positions: [number, number, number][] }) {
  return (
    <Instances limit={positions.length} range={positions.length}>
      <cylinderGeometry args={[0.03, 0.03, 1.1, 6]} />
      <primitive object={matSteelDark} attach="material" />
      {positions.map((p, i) => (
        <Instance key={i} position={p} />
      ))}
    </Instances>
  );
}
```

Use low segment counts (`6`–`8`) on cylinders for distant structure.

- [ ] **Step 2: Measure draw-call delta**

Record before/after for overview pose. Goal: −50 to −200 calls from structure alone.

- [ ] **Step 3: Repeat for warehouse pallets if still over budget**

In `WarehouseStaging.tsx`, replace N separate pallet meshes with one `Instances` block.

- [ ] **Step 4: Commit**

```bash
git add src/components/factory/PlantStructure.tsx src/components/WarehouseStaging.tsx
git commit -m "perf: instance repeated railing and warehouse parts"
```

---

### Task 9: Selective shadows whitelist

**Files:**
- Modify: `src/App.tsx`
- Modify: machine / structure components that currently set `castShadow` / `receiveShadow`

Only run this task if Task 2 proved shadows matter **or** you want final visual quality with controlled cost.

- [ ] **Step 1: Re-enable shadows at scene level with smaller map**

```tsx
<Canvas shadows dpr={[1, 1.5]} ...>
  <directionalLight
    position={[40, 55, 30]}
    intensity={1.45}
    castShadow
    shadow-mapSize={[1024, 1024]}
    shadow-camera-far={180}
    shadow-camera-left={-80}
    shadow-camera-right={80}
    shadow-camera-top={80}
    shadow-camera-bottom={-80}
  />
```

- [ ] **Step 2: Whitelist casters**

Keep `castShadow` only on:

- Floor / ground mesh (`receiveShadow` only)
- Silo
- Roller mill
- Building envelope (main shell)
- Palletizer robot / main body

Strip `castShadow` / `receiveShadow` from:

- Small pipes, flanges, bolts, railings
- Dust particles / MaterialFlow instances
- Most packing-cell detail meshes
- Electrical fixtures

Search aid:

```bash
rg "castShadow|receiveShadow" src -g "*.tsx"
```

- [ ] **Step 3: Measure and document shadow ON (selective) vs OFF**

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components
git commit -m "perf: re-enable selective shadows with 1024 map"
```

---

### Task 10: Particle / flow budget

**Files:**
- Modify: `src/components/MaterialFlow.tsx`
- Modify: `src/components/MaterialHandlingLine.tsx` (how many flows mount)

`MaterialFlow` already uses `InstancedMesh` (good). Cost is mainly **how many systems** and **particles per system**.

- [ ] **Step 1: Lower default counts**

In `KIND_STYLE` inside `MaterialFlow.tsx`:

```ts
wheat: { ..., count: 36, size: 0.045 },
flour: { ..., count: 48, size: 0.038 },
dust:  { ..., count: 20, size: 0.018 },
```

- [ ] **Step 2: Mount fewer simultaneous flows**

In `MaterialHandlingLine.tsx`, keep at most:

- 1 wheat path (raw → cleaning)
- 1 flour path (milling → packing)
- 1 `DustMotes` near milling

Comment out or gate decorative extra flows behind a prop:

```tsx
const SHOW_EXTRA_FLOWS = false;
```

- [ ] **Step 3: Measure idle vs active particle FPS; commit**

```bash
git add src/components/MaterialFlow.tsx src/components/MaterialHandlingLine.tsx
git commit -m "perf: cut material particle counts and extra flow mounts"
```

---

### Task 11: Distance culling / zone LOD

**Files:**
- Create: `src/perf/useCameraNear.ts` (optional helper)
- Modify: `src/components/MaterialHandlingLine.tsx`
- Modify: `src/components/WarehouseStaging.tsx`
- Modify: `src/components/factory/BuildingEnvelope.tsx` (detail lights only)

- [ ] **Step 1: Simple distance visibility helper**

```ts
// src/perf/useCameraNear.ts
import { useThree, useFrame } from "@react-three/fiber";
import { useState } from "react";
import * as THREE from "three";

export function useCameraNear(
  worldPoint: [number, number, number],
  radius: number
): boolean {
  const camera = useThree((s) => s.camera);
  const [near, setNear] = useState(true);
  const tmp = new THREE.Vector3();

  useFrame(() => {
    tmp.set(...worldPoint);
    const d = camera.position.distanceTo(tmp);
    const next = d < radius;
    setNear((prev) => (prev === next ? prev : next));
  });

  return near;
}
```

Prefer updating state only when the boolean flips (as above) to avoid React thrash.

- [ ] **Step 2: Hide warehouse detail when far**

In `MaterialHandlingLine` / warehouse mount:

```tsx
const warehouseNear = useCameraNear(warehouseCenter, 55);
{warehouseNear ? <WarehouseStaging ... /> : <WarehouseStaging simplified />}
```

If no simplified variant exists yet, use:

```tsx
{warehouseNear && <WarehouseStaging ... />}
```

only after confirming empty space is acceptable when viewing the silo.

Alternatively use drei `<Detailed distances={[0, 40, 80]}>` with high/mid/low children once LODs exist.

- [ ] **Step 3: Ensure frustum culling stays on**

Do not set `frustumCulled={false}` on static meshes. Default `true` is correct. Only animated roots that move outside their original bounds need bound updates (`geometry.computeBoundingSphere()` after morph — rare here).

- [ ] **Step 4: Commit**

```bash
git add src/perf/useCameraNear.ts src/components/MaterialHandlingLine.tsx src/components/WarehouseStaging.tsx
git commit -m "perf: cull warehouse detail when camera is far"
```

---

### Task 12: Optional frameloop policy (UI-only views)

**Files:**
- Modify: `src/App.tsx` only if you add a static “paused” presentation mode

The main factory has continuous animation, so **do not** set `frameloop="demand"` on the primary Canvas by default.

- [ ] **Step 1: Only if adding a Pause button**

```tsx
const [paused, setPaused] = useState(false);

<Canvas frameloop={paused ? "demand" : "always"} ...>
```

When paused, invalidate on control changes:

```tsx
import { useThree } from "@react-three/fiber";

// inside a child:
const invalidate = useThree((s) => s.invalidate);
// OrbitControls onChange={() => invalidate()}
```

- [ ] **Step 2: Skip this task if no pause UX is required**

Mark cancelled in the checklist rather than forcing demand mode.

---

### Task 13: Final verification and baseline update

**Files:**
- Modify: `docs/superpowers/plans/perf-baseline.md`
- Modify: `src/App.tsx` (keep or remove Stats)

- [ ] **Step 1: Full re-measure table**

Fill “After optimization” section with the same four poses.

- [ ] **Step 2: Confirm targets**

- FPS ≥ 55 overview + packing close
- Draw calls < 400 (stretch: < 600 acceptable if FPS met)
- Triangles < 1.5M
- OrbitControls feel OK

- [ ] **Step 3: Decide Stats visibility**

Keep `<Stats />` in dev only:

```tsx
{import.meta.env.DEV && <Stats />}
```

- [ ] **Step 4: Final commit**

```bash
git add src/App.tsx docs/superpowers/plans/perf-baseline.md
git commit -m "perf: finalize scene budget and gate Stats to DEV"
```

---

## Execution order (summary)

```text
Task 1  Measure (Stats)          ── always first
Task 2  Shadows A/B              ── always second
Task 3  OrbitControls feel       ── quick, independent
Task 4  Environment / grid / DPR ── quick scene wins
Task 5  useFrame gating          ── if many animations
Task 6  Shared materials         ── if draw calls high
Task 7  Geometry memoization     ── if rebuilds found
Task 8  Instancing               ── if draw calls still high
Task 9  Selective shadows        ── restore quality safely
Task 10 Particle budget          ── if particles show in profile
Task 11 Zone LOD / culling       ── if warehouse/building costly
Task 12 frameloop demand         ── optional / skip by default
Task 13 Final verify             ── always last
```

Stop early when targets are met — do not force Tasks 8–11 if Task 2+5 already hit ≥55 FPS and <400 draw calls.

---

## Self-review

| Spec item from user brief | Covered by |
|---------------------------|------------|
| Measure with Stats | Task 1 |
| Disable shadows A/B | Task 2 |
| useFrame consolidation | Task 5 |
| Memoize geometries | Task 7 |
| Reuse materials | Task 6 |
| Merge / reduce meshes | Tasks 6–8 (instance = merge for repeats) |
| Instancing | Task 8 |
| Off-screen / far objects | Task 11 |
| Frustum culling | Task 11 Step 3 |
| Cheaper materials | Task 7 Step 3 |
| OrbitControls damping | Task 3 |
| Selective shadow casters | Task 9 |
| Floor / grid cost | Task 4 |
| frameloop demand | Task 12 (optional) |
| Share App / MaterialHandlingLine / package / Stats | File map + Task 1; `package.json` already has drei |

No TBD placeholders remain; optional Task 12 is explicitly skippable.
)
