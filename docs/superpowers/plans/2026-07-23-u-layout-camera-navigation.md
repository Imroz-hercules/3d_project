# Factory Navigation + (Deferred) U-Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the flour-mill digital twin navigable without constant panning—zone presets, machine focus, search, history, minimap, and focus feedback—**on the current layout first**. Only after an evaluation gate, optionally compact the plant into a U/serpentine footprint.

**Architecture:** Introduce a single **MachineRegistry** (id, name, position, zone, size, cameraTarget, status) consumed by HUD, camera, minimap, LOD, selection, and search. Frame cameras **dynamically** from zone/machine bounding spheres (never hardcode eye positions). Drive fly-tos with `CameraControls` while keeping `OrbitControls` as a debug fallback. Keep the plant **axis-aligned**; get the ~40° isometric look from camera offsets only.

**Tech Stack:** React 18, Vite, Three.js, `@react-three/fiber`, `@react-three/drei` (`CameraControls`, `OrbitControls`, `Detailed`, `Outlines` or emissive highlight), existing twin store (`src/twin/*`)

---

## Why this order (revision note)

Previous draft moved every machine (U-layout) before navigation. That is high risk: duct/yaw breakage without proof that presets solve UX.

**Ship order:**

```text
Camera → Presets → Machine Focus → Minimap (+ search/history/focus)
        → Evaluate
        → Only then move machines (U-layout)
        → LOD / polish
```

Hypothesis to validate at the gate: **70–80% of the navigation pain may be solved by presets + focus alone** on the current long layout.

---

## Success criteria

| Criterion | Target |
|-----------|--------|
| Overview framing | Dynamic sphere fit of full `plantBounds`; ~40° isometric feel |
| Zone presets | Entire Factory + 7 zones; each flies ≤1.2s from live bounds |
| Machine focus | Click / search → framed fly + outline + dim others + HUD + breadcrumb |
| Focus dimming | Non-selected machines ~35% opacity; selected 100% (no HTML veil) |
| Search | Type part of a name → pick → fly + open twin |
| History | Back / Forward through overview → zone → machine stack |
| Minimap | Zones, flow arrows, camera position **and direction**, selected machine, active zone |
| Controls fallback | `debugOrbit` toggle re-enables OrbitControls without rewrite |
| U-layout | **Optional** after Phase 3 evaluation; aspect X:Z ~0.8–2.0 if pursued |
| Build | `npx tsc -b --pretty false` passes |

**Out of scope (until gate says otherwise):** MQTT/OPC, redesigning machine meshes, rotating the whole plant group.

**Keep forever:** Axis-aligned world coordinates; isometric appearance via camera only.

---

## Current state (baseline)

- Plant is mostly a **+X chain** (`layoutConstants.ts`); mild Z aisles already exist.
- `OrbitControls` in `App.tsx`; plant centered with `[-cx,0,-cz]`.
- Twin: `SelectableMachine` → `selectMachine` + ring; `TwinHud` live panel.
- Missing: registry, dynamic framing, presets UI, search, history, breadcrumb, per-object focus, rich minimap, LOD.

---

## Target UX (after Phases 1–3)

1. Open → isometric **Entire Factory** (sphere-framed).
2. Click **Packing** → fly to zone.
3. Search “Roller” or click roller mill → fly, outline, dim others, HUD, breadcrumb `Factory > Milling > Roller Mill`.
4. Navigate to Metal Detector → Check Weigher; **Back** returns through history.
5. Minimap shows where you are and which way you look.

### Deferred U-layout (Phase 4 only)

```text
Top (+Z): Raw → Cleaning (+X)
Right: Conditioning (−Z)
Bottom (−Z): Milling → Storage (−X fold)
South: Packing → Warehouse
```

Do **not** implement Phase 4 until the evaluation gate passes.

---

## File map

| File | Role |
|------|------|
| `src/navigation/types.ts` | **Create** — `NavZoneId`, nav history entries, focus mode |
| `src/navigation/MachineRegistry.ts` | **Create** — single registry built from layout helpers |
| `src/navigation/zoneRegistry.ts` | **Create** — zone bounds from registry machines |
| `src/navigation/framing.ts` | **Create** — bounding sphere → camera position/target |
| `src/navigation/navStore.ts` | **Create** — history stack, active zone, debugOrbit |
| `src/navigation/CameraRig.tsx` | **Create** — CameraControls + OrbitControls fallback |
| `src/navigation/ZonePresetBar.tsx` | **Create** — zone / overview buttons |
| `src/navigation/MachineSearch.tsx` | **Create** — search box → focus machine |
| `src/navigation/NavHistoryButtons.tsx` | **Create** — Back / Forward |
| `src/navigation/NavBreadcrumb.tsx` | **Create** — Factory > Zone > Machine |
| `src/navigation/FocusOpacity.tsx` | **Create** — per-machine opacity from selection |
| `src/navigation/Minimap.tsx` | **Create** — interactive map |
| `src/navigation/MachineLOD.tsx` | **Create** — Phase 5 distance LOD |
| `src/App.tsx` | Mount rig + nav chrome |
| `src/twin/SelectableMachine.tsx` | Select + push history + fly via registry |
| `src/twin/TwinHud.tsx` | Consume registry labels; keep live tags |
| `src/components/layoutConstants.ts` | Positions stay here; Phase 4 U-bend only |
| `src/components/MaterialHandlingLine.tsx` | Registry mount points; Phase 4 ducts; Phase 5 LOD |
| `docs/flour-mill-digital-twin-roadmap.md` | Nav conventions (+ U note if Phase 4 ships) |

---

# Phase 1 — Navigation Foundation

**Exit:** CameraRig works; registry lists machines; overview + zone cameras frame dynamically; OrbitControls debug toggle works. **No machine moves.**

---

### Task 1.1: Nav types + nav store

**Files:**
- Create: `src/navigation/types.ts`
- Create: `src/navigation/navStore.ts`

- [ ] **Step 1: Add types**

```ts
// src/navigation/types.ts
import type { MachineId } from '../twin/types';

export type NavZoneId =
  | 'overview'
  | 'raw'
  | 'cleaning'
  | 'conditioning'
  | 'milling'
  | 'storage'
  | 'packing'
  | 'warehouse';

export type ProcessZoneId = Exclude<NavZoneId, 'overview'>;

export interface MachineRecord {
  id: MachineId;
  name: string;
  /** Plant-local metres (same space as layoutConstants). */
  position: [number, number, number];
  zone: ProcessZoneId;
  /** Axis-aligned size used for picking + sphere framing. */
  size: [number, number, number];
  /** Optional look-at override; default = position + [0, sizeY*0.35, 0]. */
  cameraTarget?: [number, number, number];
  /** Twin running/alarm mirrored for minimap tint (optional). */
  status?: 'running' | 'stopped' | 'warn' | 'alarm';
}

export type NavFocus =
  | { kind: 'overview' }
  | { kind: 'zone'; zone: ProcessZoneId }
  | { kind: 'machine'; machineId: MachineId };

export interface NavState {
  focus: NavFocus;
  history: NavFocus[];
  historyIndex: number;
  debugOrbit: boolean;
}
```

- [ ] **Step 2: Add a tiny nav store** (mirrors twin pattern: module state + subscribers)

```ts
// src/navigation/navStore.ts
import type { NavFocus, NavState } from './types';

type Listener = () => void;

const state: NavState = {
  focus: { kind: 'overview' },
  history: [{ kind: 'overview' }],
  historyIndex: 0,
  debugOrbit: false,
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function getNavState(): NavState {
  return state;
}

export function subscribeNav(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDebugOrbit(on: boolean) {
  state.debugOrbit = on;
  emit();
}

/** Push a new focus (truncates forward stack). */
export function navigateTo(focus: NavFocus) {
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(focus);
  state.historyIndex = state.history.length - 1;
  state.focus = focus;
  emit();
}

export function navBack() {
  if (state.historyIndex <= 0) return;
  state.historyIndex -= 1;
  state.focus = state.history[state.historyIndex]!;
  emit();
}

export function navForward() {
  if (state.historyIndex >= state.history.length - 1) return;
  state.historyIndex += 1;
  state.focus = state.history[state.historyIndex]!;
  emit();
}

export function useNavState(): NavState {
  // Implement with useSyncExternalStore in a small hook file if preferred;
  // for plan purposes, TwinHud/App can subscribe the same way as useTwinState.
  return state;
}
```

Prefer mirroring `src/twin/useTwinState.ts` with `useSyncExternalStore` in `src/navigation/useNavState.ts` during implementation.

- [ ] **Step 3: Commit**

```bash
git add src/navigation/types.ts src/navigation/navStore.ts src/navigation/useNavState.ts
git commit -m "feat(nav): add navigation types and history store"
```

---

### Task 1.2: MachineRegistry (single source of truth)

**Files:**
- Create: `src/navigation/MachineRegistry.ts`
- Modify: `src/twin/types.ts` / `tags.ts` only if new IDs are needed for registry completeness (can start with existing `MachineId`s)

- [ ] **Step 1: Build registry from layout helpers**

```ts
// src/navigation/MachineRegistry.ts
import type { MachineRecord, ProcessZoneId } from './types';
import type { MachineId } from '../twin/types';
import { MACHINE_LABELS } from '../twin/types';
import {
  elevatorPosition,
  separatorPosition,
  rollerMillPosition,
  flourBinPosition,
  packingMachinePosition,
  checkWeigherPosition,
  metalDetectorPosition,
  palletizerPosition,
} from '../components/layoutConstants';

/** Central list — HUD, camera, minimap, LOD, selection, search all read this. */
export function buildMachineRegistry(): MachineRecord[] {
  return [
    {
      id: 'silo',
      name: MACHINE_LABELS.silo,
      position: [0, 2, 0],
      zone: 'raw',
      size: [3.2, 6, 3.2],
    },
    {
      id: 'elevator',
      name: MACHINE_LABELS.elevator,
      position: elevatorPosition(),
      zone: 'raw',
      size: [2.2, 7, 2.2],
    },
    {
      id: 'vibro',
      name: MACHINE_LABELS.vibro,
      position: separatorPosition(),
      zone: 'cleaning',
      size: [3.5, 3, 2.2],
    },
    {
      id: 'roller_mill',
      name: MACHINE_LABELS.roller_mill,
      position: rollerMillPosition(),
      zone: 'milling',
      size: [3.2, 4, 2.8],
    },
    {
      id: 'flour_bin_a',
      name: MACHINE_LABELS.flour_bin_a,
      position: flourBinPosition('A'),
      zone: 'storage',
      size: [3, 8, 3],
    },
    {
      id: 'packing',
      name: MACHINE_LABELS.packing,
      position: packingMachinePosition(),
      zone: 'packing',
      size: [3, 4, 2.5],
    },
    {
      id: 'check_weigher',
      name: MACHINE_LABELS.check_weigher,
      position: checkWeigherPosition(),
      zone: 'packing',
      size: [2.8, 2.5, 1.6],
    },
    {
      id: 'metal_detector',
      name: MACHINE_LABELS.metal_detector,
      position: metalDetectorPosition(),
      zone: 'packing',
      size: [3, 2.8, 1.8],
    },
    {
      id: 'palletizer',
      name: MACHINE_LABELS.palletizer,
      position: palletizerPosition(),
      zone: 'packing',
      size: [6, 4, 6],
    },
  ];
}

export function getMachine(id: MachineId, list = buildMachineRegistry()) {
  return list.find((m) => m.id === id);
}

export function machinesInZone(zone: ProcessZoneId, list = buildMachineRegistry()) {
  return list.filter((m) => m.zone === zone);
}

export function searchMachines(query: string, list = buildMachineRegistry()) {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
  );
}
```

Use the real layout helper names already exported (adjust if `checkWeigherPosition` / `metalDetectorPosition` differ slightly).

- [ ] **Step 2: Point SelectableMachine sizes/positions at registry (read-only for now)**

In `MaterialHandlingLine.tsx`, replace hardcoded hotspot literals with registry lookups so moving a layout helper later updates picking automatically:

```tsx
{buildMachineRegistry().map((m) => (
  <SelectableMachine key={m.id} id={m.id} position={m.position} size={m.size} />
))}
```

Remove duplicate hardcoded `<SelectableMachine ... />` lines.

- [ ] **Step 3: Commit**

```bash
git add src/navigation/MachineRegistry.ts src/components/MaterialHandlingLine.tsx
git commit -m "feat(nav): add MachineRegistry as single machine lookup"
```

---

### Task 1.3: Zone registry + dynamic framing (no hardcoded eye positions)

**Files:**
- Create: `src/navigation/zoneRegistry.ts`
- Create: `src/navigation/framing.ts`

- [ ] **Step 1: Zone bounds from registry (+ plant fallback)**

```ts
// src/navigation/zoneRegistry.ts
import type { ProcessZoneId } from './types';
import { buildMachineRegistry } from './MachineRegistry';
import { plantBounds } from '../components/layoutConstants';

export const ZONE_LABELS: Record<ProcessZoneId, string> = {
  raw: 'Raw Material',
  cleaning: 'Cleaning',
  conditioning: 'Conditioning',
  milling: 'Milling',
  storage: 'Flour Storage',
  packing: 'Packing',
  warehouse: 'Warehouse',
};

export interface ZoneBounds {
  id: ProcessZoneId;
  label: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export function zoneBoundsFromRegistry(): ZoneBounds[] {
  const machines = buildMachineRegistry();
  const zones = Object.keys(ZONE_LABELS) as ProcessZoneId[];
  const pad = 2.5;
  return zones
    .map((id) => {
      const ms = machines.filter((m) => m.zone === id);
      if (ms.length === 0) return null;
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      for (const m of ms) {
        const [x, y, z] = m.position;
        const [sx, sy, sz] = m.size;
        minX = Math.min(minX, x - sx / 2);
        maxX = Math.max(maxX, x + sx / 2);
        minY = Math.min(minY, y - sy / 2);
        maxY = Math.max(maxY, y + sy / 2);
        minZ = Math.min(minZ, z - sz / 2);
        maxZ = Math.max(maxZ, z + sz / 2);
      }
      return {
        id,
        label: ZONE_LABELS[id],
        minX: minX - pad,
        maxX: maxX + pad,
        minY: minY - pad,
        maxY: maxY + pad,
        minZ: minZ - pad,
        maxZ: maxZ + pad,
      };
    })
    .filter(Boolean) as ZoneBounds[];
}

export function overviewBoundsFromPlant(): ZoneBounds {
  const b = plantBounds();
  return {
    id: 'raw', // unused for overview framing path
    label: 'Entire Factory',
    minX: b.minX,
    maxX: b.maxX,
    minY: 0,
    maxY: 12,
    minZ: b.minZ,
    maxZ: b.maxZ,
  };
}
```

Zones with zero registry machines (e.g. conditioning/warehouse early) simply omit preset buttons until machines are registered—**do not hardcode empty camera coords**.

- [ ] **Step 2: Bounding-sphere framing**

```ts
// src/navigation/framing.ts
import * as THREE from 'three';
import type { MachineRecord } from './types';
import type { ZoneBounds } from './zoneRegistry';
import { plantCenter } from '../components/layoutConstants';

export interface FramedView {
  position: [number, number, number];
  target: [number, number, number];
}

/** Isometric-ish offset on the view sphere (~40° yaw feel). */
const ISO = { x: 0.55, y: 0.72, z: 0.62 };

function boxToSphere(min: THREE.Vector3, max: THREE.Vector3) {
  const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
  const radius = center.distanceTo(max);
  return { center, radius };
}

/**
 * Convert plant-local framed view into App camera space
 * (plant group is shifted by -plantCenter).
 */
function toCameraSpace(pos: THREE.Vector3, target: THREE.Vector3): FramedView {
  const [cx, , cz] = plantCenter();
  return {
    position: [pos.x - cx, pos.y, pos.z - cz],
    target: [target.x - cx, target.y, target.z - cz],
  };
}

export function frameZone(bounds: ZoneBounds, fovDeg = 48): FramedView {
  const min = new THREE.Vector3(bounds.minX, bounds.minY, bounds.minZ);
  const max = new THREE.Vector3(bounds.maxX, bounds.maxY, bounds.maxZ);
  const { center, radius } = boxToSphere(min, max);
  const fov = THREE.MathUtils.degToRad(fovDeg);
  const dist = (radius * 1.35) / Math.sin(fov / 2);
  const pos = new THREE.Vector3(
    center.x + dist * ISO.x,
    center.y + dist * ISO.y,
    center.z + dist * ISO.z
  );
  return toCameraSpace(pos, center);
}

export function frameMachine(m: MachineRecord, fovDeg = 48): FramedView {
  const [x, y, z] = m.position;
  const [sx, sy, sz] = m.size;
  const min = new THREE.Vector3(x - sx / 2, y - sy / 2, z - sz / 2);
  const max = new THREE.Vector3(x + sx / 2, y + sy / 2, z + sz / 2);
  const { center, radius } = boxToSphere(min, max);
  const target = m.cameraTarget
    ? new THREE.Vector3(...m.cameraTarget)
    : new THREE.Vector3(x, y + sy * 0.35, z);
  const fov = THREE.MathUtils.degToRad(fovDeg);
  const dist = (Math.max(radius, 1.2) * 1.5) / Math.sin(fov / 2);
  const pos = new THREE.Vector3(
    target.x + dist * ISO.x,
    target.y + dist * ISO.y,
    target.z + dist * ISO.z
  );
  return toCameraSpace(pos, target);
}
```

- [ ] **Step 3: Smoke-check framing in Node/tsx or temporary console**

```bash
npx tsc -b --pretty false
```

Optional: log `frameZone(overviewBoundsFromPlant())` once in App mount — eye should sit above/outside the plant.

- [ ] **Step 4: Commit**

```bash
git add src/navigation/zoneRegistry.ts src/navigation/framing.ts
git commit -m "feat(nav): derive zone bounds and camera frames from bounding spheres"
```

---

### Task 1.4: CameraRig (CameraControls + OrbitControls debug fallback)

**Files:**
- Create: `src/navigation/CameraRig.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement CameraRig**

```tsx
// src/navigation/CameraRig.tsx
import { useEffect, useRef } from 'react';
import { CameraControls, OrbitControls } from '@react-three/drei';
import type { FramedView } from './framing';
import { useNavState } from './useNavState';

export type FlyToFn = (view: FramedView, smooth?: boolean) => Promise<void>;

let flyToImpl: FlyToFn | null = null;

export function flyToView(view: FramedView, smooth = true) {
  return flyToImpl?.(view, smooth);
}

export function CameraRig({ maxDistance }: { maxDistance: number }) {
  const controlsRef = useRef<any>(null);
  const { debugOrbit } = useNavState();

  useEffect(() => {
    flyToImpl = async (view, smooth = true) => {
      const ctrl = controlsRef.current;
      if (!ctrl || debugOrbit) return;
      await ctrl.setLookAt(
        view.position[0],
        view.position[1],
        view.position[2],
        view.target[0],
        view.target[1],
        view.target[2],
        smooth
      );
    };
    return () => {
      flyToImpl = null;
    };
  }, [debugOrbit]);

  if (debugOrbit) {
    return (
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 2, 0]}
        minDistance={8}
        maxDistance={maxDistance}
      />
    );
  }

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={8}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI / 2.05}
    />
  );
}
```

- [ ] **Step 2: Wire App — do not delete Orbit path**

Replace current `<OrbitControls />` with `<CameraRig maxDistance={groundR * 2.5} />`.

Add a small debug toggle next to building buttons:

```tsx
<button type="button" style={btnStyle} onClick={() => setDebugOrbit(!getNavState().debugOrbit)}>
  {getNavState().debugOrbit ? 'Controls: Orbit' : 'Controls: Camera'}
</button>
```

(Use `useNavState` properly so the label re-renders.)

- [ ] **Step 3: On mount, fly to overview frame**

```tsx
useEffect(() => {
  const view = frameZone(overviewBoundsFromPlant());
  void flyToView(view, false); // snap once
}, []);
```

- [ ] **Step 4: Browser check**

```bash
npm run dev
```

Expected: isometric overview; orbit/dolly via CameraControls; toggle “Controls: Orbit” restores familiar OrbitControls.

- [ ] **Step 5: Commit**

```bash
git add src/navigation/CameraRig.tsx src/App.tsx
git commit -m "feat(nav): CameraRig with CameraControls and OrbitControls fallback"
```

---

# Phase 2 — User Navigation

**Exit:** Zone buttons, click-to-focus, search, and Back/Forward history all drive the same `navigateTo` + `flyToView` path.

---

### Task 2.1: Zone preset bar

**Files:**
- Create: `src/navigation/ZonePresetBar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Buttons from live zone bounds**

```tsx
import { zoneBoundsFromRegistry, overviewBoundsFromPlant, ZONE_LABELS } from './zoneRegistry';
import { frameZone } from './framing';
import { flyToView } from './CameraRig';
import { navigateTo } from './navStore';
import type { ProcessZoneId } from './types';

const ICONS: Record<string, string> = {
  overview: '🏭',
  raw: '🌾',
  cleaning: '🧹',
  conditioning: '💧',
  milling: '⚙️',
  storage: '🛢',
  packing: '📦',
  warehouse: '🚚',
};

export function ZonePresetBar() {
  const zones = zoneBoundsFromRegistry();
  return (
    <div style={bar}>
      <button
        type="button"
        style={btn}
        onClick={() => {
          navigateTo({ kind: 'overview' });
          void flyToView(frameZone(overviewBoundsFromPlant()));
        }}
      >
        {ICONS.overview} Entire Factory
      </button>
      {zones.map((z) => (
        <button
          key={z.id}
          type="button"
          style={btn}
          onClick={() => {
            navigateTo({ kind: 'zone', zone: z.id });
            void flyToView(frameZone(z));
          }}
        >
          {ICONS[z.id]} {ZONE_LABELS[z.id as ProcessZoneId]}
        </button>
      ))}
    </div>
  );
}
```

Style consistently with existing App `btnStyle` (dark industrial chrome).

- [ ] **Step 2: Mount under canvas; verify each zone with machines frames without cropping.**

- [ ] **Step 3: Commit**

```bash
git add src/navigation/ZonePresetBar.tsx src/App.tsx
git commit -m "feat(nav): zone preset bar with dynamic framing"
```

---

### Task 2.2: Click-to-focus (auto sphere framing)

**Files:**
- Modify: `src/twin/SelectableMachine.tsx`
- Modify: `src/twin/tags.ts` (`selectMachine` may call nav, or SelectableMachine does both)

- [ ] **Step 1: On click — select + navigate + fly**

```ts
import { selectMachine } from './tags';
import { getMachine } from '../navigation/MachineRegistry';
import { frameMachine } from '../navigation/framing';
import { flyToView } from '../navigation/CameraRig';
import { navigateTo } from '../navigation/navStore';

// onClick:
e.stopPropagation();
selectMachine(id);
navigateTo({ kind: 'machine', machineId: id });
const rec = getMachine(id);
if (rec) void flyToView(frameMachine(rec));
```

- [ ] **Step 2: Verify large (palletizer) and small (check weigher) both fit—neither cropped nor oversized.**

- [ ] **Step 3: Commit**

```bash
git add src/twin/SelectableMachine.tsx
git commit -m "feat(nav): fly to machine with automatic bounding-sphere framing"
```

---

### Task 2.3: Machine search

**Files:**
- Create: `src/navigation/MachineSearch.tsx`
- Modify: `src/App.tsx` or `TwinHud.tsx`

- [ ] **Step 1: Search UI**

```tsx
import { useMemo, useState, type CSSProperties } from 'react';
import { searchMachines, getMachine } from './MachineRegistry';
import { frameMachine } from './framing';
import { flyToView } from './CameraRig';
import { navigateTo } from './navStore';
import { selectMachine } from '../twin/tags';
import type { MachineId } from '../twin/types';

export function MachineSearch() {
  const [q, setQ] = useState('');
  const hits = useMemo(() => searchMachines(q).slice(0, 8), [q]);

  function focus(id: MachineId) {
    selectMachine(id);
    navigateTo({ kind: 'machine', machineId: id });
    const rec = getMachine(id);
    if (rec) void flyToView(frameMachine(rec));
    setQ('');
  }

  return (
    <div style={wrap}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search machines…"
        style={input}
      />
      {q && hits.length > 0 && (
        <ul style={list}>
          {hits.map((m) => (
            <li key={m.id}>
              <button type="button" style={itemBtn} onClick={() => focus(m.id)}>
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const wrap: CSSProperties = { position: 'relative', minWidth: 200 };
const input: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #6a7278',
  background: 'rgba(30,36,42,0.92)',
  color: '#e8e4d4',
};
const list: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  margin: 0,
  padding: 4,
  listStyle: 'none',
  background: 'rgba(20,24,28,0.96)',
  border: '1px solid #6a7278',
  borderRadius: 6,
  zIndex: 20,
};
const itemBtn: CSSProperties = {
  width: '100%',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  color: '#e8e4d4',
  padding: '6px 8px',
  cursor: 'pointer',
};
```

- [ ] **Step 2: Type “Roller” → Roller Mill → camera + HUD.**

- [ ] **Step 3: Commit**

```bash
git add src/navigation/MachineSearch.tsx src/App.tsx src/twin/TwinHud.tsx
git commit -m "feat(nav): machine search flies camera and opens twin panel"
```

---

### Task 2.4: Navigation history (Back / Forward)

**Files:**
- Create: `src/navigation/NavHistoryButtons.tsx`
- Modify: `src/navigation/navStore.ts` (already has back/forward)
- Modify: `src/App.tsx`
- Create or modify: focus→fly sync effect

- [ ] **Step 1: When `focus` changes from Back/Forward, re-fly without pushing history**

```ts
// In a NavFocusController component inside/near App:
import { useEffect, useRef } from 'react';
import { useNavState } from './useNavState';
import { frameZone, frameMachine } from './framing';
import { overviewBoundsFromPlant, zoneBoundsFromRegistry } from './zoneRegistry';
import { getMachine } from './MachineRegistry';
import { flyToView } from './CameraRig';

export function NavFocusController() {
  const { focus, historyIndex } = useNavState();
  const skip = useRef(false);
  // fly whenever focus or historyIndex changes
  useEffect(() => {
    if (focus.kind === 'overview') {
      void flyToView(frameZone(overviewBoundsFromPlant()));
    } else if (focus.kind === 'zone') {
      const z = zoneBoundsFromRegistry().find((b) => b.id === focus.zone);
      if (z) void flyToView(frameZone(z));
    } else {
      const m = getMachine(focus.machineId);
      if (m) void flyToView(frameMachine(m));
    }
  }, [focus, historyIndex]);
  return null;
}
```

Ensure `navigateTo` from buttons still pushes; `navBack`/`navForward` only change index (already designed that way). Avoid double-push: zone/machine UI calls `navigateTo` once; controller only flies.

- [ ] **Step 2: History buttons**

```tsx
export function NavHistoryButtons() {
  const { historyIndex, history } = useNavState();
  return (
    <>
      <button type="button" disabled={historyIndex <= 0} onClick={() => navBack()}>
        ← Back
      </button>
      <button
        type="button"
        disabled={historyIndex >= history.length - 1}
        onClick={() => navForward()}
      >
        Forward →
      </button>
    </>
  );
}
```

- [ ] **Step 3: Manual path** — Overview → Packing → Metal Detector → Check Weigher → Back → Back → Overview.

- [ ] **Step 4: Commit**

```bash
git add src/navigation/NavHistoryButtons.tsx src/navigation/NavFocusController.tsx src/App.tsx
git commit -m "feat(nav): back/forward navigation history with re-framing"
```

---

# Phase 3 — Visual Feedback

**Exit:** Outline + per-object dimming, breadcrumb, rich interactive minimap. **Evaluation gate before Phase 4.**

---

### Task 3.1: Selection outline + per-object focus opacity (no HTML veil)

**Files:**
- Create: `src/navigation/FocusOpacity.tsx`
- Modify: `src/twin/SelectableMachine.tsx`
- Modify: `src/components/MaterialHandlingLine.tsx` (or per-machine wrappers)

- [ ] **Step 1: Do not add a full-screen radial HTML veil.**

- [ ] **Step 2: Dim non-selected registry machines**

Approach: wrap each major machine group (or the existing `SelectableMachine` parent) with a component that sets group-level opacity via `useFrame` / material traversal when `selectedId` is set:

```tsx
import { useEffect } from 'react';
import { useTwinState } from '../twin/useTwinState';
import * as THREE from 'three';
import { useRef } from 'react';

export function FocusableGroup({
  machineId,
  children,
}: {
  machineId: string;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null!);
  const { selectedId } = useTwinState();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const dimming = selectedId != null && selectedId !== machineId;
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (!mat) continue;
        mat.transparent = true;
        mat.opacity = dimming ? 0.35 : 1;
        mat.needsUpdate = true;
      }
    });
  }, [selectedId, machineId]);

  return <group ref={ref}>{children}</group>;
}
```

Apply around machines that are expensive/visible first (packing cell + milling). If full plant wrap is too heavy for one PR, apply to all `SelectableMachine` peers listed in the registry.

- [ ] **Step 3: Stronger selected outline**

Keep/enhance the torus ring **or** add drei `Outlines` on a proxy box when selected. Selected stays opacity 1 + emissive accent.

- [ ] **Step 4: Browser check** — selected machine readable; others clearly recessed; HUD still fully visible (not darkened by a veil).

- [ ] **Step 5: Commit**

```bash
git add src/navigation/FocusOpacity.tsx src/components/MaterialHandlingLine.tsx src/twin/SelectableMachine.tsx
git commit -m "feat(nav): per-object focus opacity and selection outline"
```

---

### Task 3.2: Breadcrumb

**Files:**
- Create: `src/navigation/NavBreadcrumb.tsx`
- Modify: `src/App.tsx` / `TwinHud.tsx`

- [ ] **Step 1: Render `Factory > {Zone} > {Machine}` from nav focus + registry**

```tsx
import { useNavState } from './useNavState';
import { ZONE_LABELS } from './zoneRegistry';
import { getMachine } from './MachineRegistry';
import { navigateTo } from './navStore';
import { frameZone } from './framing';
import { overviewBoundsFromPlant, zoneBoundsFromRegistry } from './zoneRegistry';
import { flyToView } from './CameraRig';
import { selectMachine } from '../twin/tags';

export function NavBreadcrumb() {
  const { focus } = useNavState();
  const crumbs: { label: string; onClick?: () => void }[] = [
    {
      label: 'Factory',
      onClick: () => {
        selectMachine(null);
        navigateTo({ kind: 'overview' });
        void flyToView(frameZone(overviewBoundsFromPlant()));
      },
    },
  ];

  if (focus.kind === 'zone' || focus.kind === 'machine') {
    const zone = focus.kind === 'zone' ? focus.zone : getMachine(focus.machineId)?.zone;
    if (zone) {
      crumbs.push({
        label: ZONE_LABELS[zone],
        onClick: () => {
          selectMachine(null);
          navigateTo({ kind: 'zone', zone });
          const z = zoneBoundsFromRegistry().find((b) => b.id === zone);
          if (z) void flyToView(frameZone(z));
        },
      });
    }
  }
  if (focus.kind === 'machine') {
    crumbs.push({ label: getMachine(focus.machineId)?.name ?? focus.machineId });
  }

  return (
    <div style={{ /* top-center chrome */ }}>
      {crumbs.map((c, i) => (
        <span key={i}>
          {i > 0 && ' > '}
          {c.onClick ? (
            <button type="button" onClick={c.onClick}>{c.label}</button>
          ) : (
            <strong>{c.label}</strong>
          )}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/navigation/NavBreadcrumb.tsx src/App.tsx
git commit -m "feat(nav): breadcrumb Factory > Zone > Machine"
```

---

### Task 3.3: Interactive minimap

**Files:**
- Create: `src/navigation/Minimap.tsx`
- Modify: `src/navigation/CameraRig.tsx` (expose camera XZ + facing for minimap)
- Modify: `src/App.tsx`

- [ ] **Step 1: Show zones, process-flow arrows, camera position, camera direction, selected machine, active zone**

Data:

- Zones: `zoneBoundsFromRegistry()`
- Flow arrows: ordered zone centers `raw → cleaning → conditioning → milling → storage → packing → warehouse` (skip missing)
- Camera: poll `CameraControls` getPosition/getTarget each frame (or 10 Hz) into navStore `cameraPose: { x,z, dirX, dirZ }`
- Selected: `twin.selectedId` marker
- Active zone: from `focus`

```tsx
// Pseudocode structure — implement as SVG
// - rect per zone (highlight if active)
// - line/arrow between consecutive zone centers
// - triangle or chevron for camera facing
// - filled circle for camera position
// - star/dot for selected machine
// - click zone rect → navigateTo zone + fly
// - click machine dot → focus machine
```

- [ ] **Step 2: Browser check** — after flying to packing, minimap marker + arrow match view; click milling zone on map jumps there.

- [ ] **Step 3: Commit**

```bash
git add src/navigation/Minimap.tsx src/navigation/CameraRig.tsx src/navigation/navStore.ts src/App.tsx
git commit -m "feat(nav): interactive minimap with camera pose and flow arrows"
```

---

### Task 3.4: Evaluation gate (stop here and decide)

**Files:**
- Create: `docs/superpowers/plans/nav-evaluation.md`

- [ ] **Step 1: Walk the ideal workflow on the current long layout** with presets, search, history, minimap, focus.

- [ ] **Step 2: Record answers in `nav-evaluation.md`:**

```markdown
# Nav evaluation — YYYY-MM-DD

| Question | Answer |
|----------|--------|
| Can you inspect any zone without free-pan? | Y/N |
| Is left-right hunting still painful from overview? | Y/N |
| Do presets + focus solve ~70–80% of UX? | Y/N |
| Is U-layout still required? | Y/N — why |
| Any framing bugs (crop/overzoom)? | … |
```

- [ ] **Step 3: Decision**

- If navigation is **good enough** → skip Phase 4; proceed to Phase 5 (LOD/polish) only.
- If overview still feels like a ribbon → proceed to Phase 4 U-layout.

- [ ] **Step 4: Commit evaluation notes**

```bash
git add docs/superpowers/plans/nav-evaluation.md
git commit -m "docs: record navigation UX evaluation before layout move"
```

---

# Phase 4 — Layout Optimization (conditional)

**Only if Task 3.4 says U-layout is required.** Keep axis-aligned coords; isometric still from camera.

---

### Task 4.1: Redefine `REF.zones` for U / serpentine

**Files:**
- Modify: `src/components/layoutConstants.ts`

- [ ] **Step 1: Update zone Z anchors and gaps** (top +Z cleaning, right conditioning, bottom −Z milling/storage −X fold, south packing/warehouse). Concrete starting values:

```ts
zones: {
  raw: { z: 6.0, floorY: 0 },
  cleaning: { z: 6.0, floorY: 0 },
  conditioning: { z: 0.0, floorY: 0 },
  milling: { z: -6.0, millDeckY: 2.8, upperDeckY: 5.5 },
  storage: { z: -6.0, floorY: 0 },
  packing: { z: -16.0, floorY: 0 },
  warehouse: { z: -16.0, floorY: 0 },
  gaps: {
    cleaningToConditioning: 2.0,
    conditioningToMillingX: 2.5,
    storageToPackingZ: 4.0,
    packingToWarehouseX: 2.5,
  },
},
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layoutConstants.ts
git commit -m "feat(layout): zone anchors for U-shaped plant"
```

---

### Task 4.2: Rewire position helpers + registry stays correct

**Files:**
- Modify: `src/components/layoutConstants.ts`
- Verify: `src/navigation/MachineRegistry.ts` (no position literals beyond silo)

- [ ] **Step 1: Bend chains** — raw/cleaning +X; conditioning −Z; milling/storage −X; packing on packing.z.

- [ ] **Step 2: Temporary translucent zone planes from `zoneBoundsFromRegistry()` for visual QA; remove in Task 4.4.**

- [ ] **Step 3: Confirm search/presets/minimap still work with zero camera code changes** (registry + sphere framing should adapt).

- [ ] **Step 4: Commit**

```bash
git add src/components/layoutConstants.ts src/components/MaterialHandlingLine.tsx
git commit -m "feat(layout): bend process line into U-shaped flow"
```

---

### Task 4.3: Duct, yaw, dust, electrical repair

**Files:**
- Modify: `src/components/MaterialHandlingLine.tsx`
- Modify: `src/components/factory/ProcessPiping.tsx` / `DustCollection.tsx` as needed

- [ ] **Step 1: Audit every flowPath segment at bends; fix RoundDuct/BeltBridge.**

- [ ] **Step 2: Add group yaw where product direction changed (document yaw in comment).**

- [ ] **Step 3: Browser — particles silo→palletizer; no multi-metre air gaps.**

- [ ] **Step 4: Commit**

```bash
git add src/components/MaterialHandlingLine.tsx src/components/factory/
git commit -m "fix(layout): reconnect ducts and machine yaw after U-bend"
```

---

### Task 4.4: Building resize + remove debug slabs

**Files:**
- Modify: `src/components/layoutConstants.ts` (`plantBounds` / aspect)
- Modify: `src/components/factory/BuildingEnvelope.tsx` if needed
- Modify: roadmap conventions

- [ ] **Step 1: `plantAspectXZ()` gate — target ~0.8–2.0.**

- [ ] **Step 2: Building cutaway still clears all zones.**

- [ ] **Step 3: Update roadmap: U footprint + nav via `src/navigation/*`.**

- [ ] **Step 4: Commit**

```bash
git add src/components/layoutConstants.ts docs/flour-mill-digital-twin-roadmap.md
git commit -m "feat(layout): compact bounds and document U-layout conventions"
```

---

# Phase 5 — Performance + Final Polish

---

### Task 5.1: Distance LOD

**Files:**
- Create: `src/navigation/MachineLOD.tsx`
- Modify: `MaterialHandlingLine.tsx` (palletizer / warehouse first)

- [ ] **Step 1: `Detailed` wrapper — full vs box proxy by distance.**

- [ ] **Step 2: Overview uses proxy; packing fly shows full robot.**

- [ ] **Step 3: Commit**

```bash
git add src/navigation/MachineLOD.tsx src/components/MaterialHandlingLine.tsx
git commit -m "feat(nav): distance LOD for heavy packing/warehouse cells"
```

---

### Task 5.2: Final verification checklist

- [ ] **Step 1: Run**

```bash
npm run dev
npx tsc -b --pretty false
```

- [ ] **Step 2: Manual**

1. Overview sphere-framed, ~40° isometric, axis-aligned plant.
2. Zone presets + search + history + breadcrumb.
3. Focus: outline + 35% others; no HTML veil.
4. Minimap: pose, direction, selection, flow, clicks.
5. Debug Orbit toggle works.
6. If Phase 4 shipped: U footprint + ducts OK.
7. LOD behaves at overview vs close-up.

- [ ] **Step 3: Commit polish**

```bash
git add src/App.tsx src/navigation/ docs/superpowers/plans/2026-07-23-u-layout-camera-navigation.md
git commit -m "chore(nav): final navigation polish and checklist"
```

---

## Self-review (plan author)

| Feedback item | Where addressed |
|---------------|-----------------|
| Nav before U-layout | Phases 1–3 → gate → Phase 4 |
| Keep OrbitControls fallback | Task 1.4 |
| MachineRegistry | Task 1.2 |
| Dynamic camera from bounds/sphere | Task 1.3, 2.2 |
| Breadcrumb + outline + live values | Tasks 2.2, 3.1, 3.2 |
| No HTML veil; per-object opacity | Task 3.1 |
| Richer minimap | Task 3.3 |
| Search | Task 2.3 |
| Auto framing large/small machines | `frameMachine` sphere fit |
| Navigation history | Task 2.4 |
| 5 phases | Document structure |
| Axis-aligned plant + camera iso | Architecture (unchanged) |

---

## Execution notes

- **Phase 4 is conditional** — do not start U-moves until `nav-evaluation.md` says so.
- When a machine moves in `layoutConstants`, only registry builders that call helpers need to stay pure—**no camera preset tables to update**.
- If `CameraControls` misbehaves, flip `debugOrbit` and keep shipping UI against `flyToView` no-ops until fixed.
- Prefer small commits per task as listed.
