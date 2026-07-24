# Visual Realism — Materials, Lighting & Surface Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Revision:** Rewritten after review. Prioritizes material architecture → whole-scene lighting/floor → infrastructure PBR → one gold-standard machine → copy style. Explicitly defers bevels, triplanar, 4K, and procedural dirt shaders.
>
> **Execution progress (2026-07-23):** Sprints 1–5 implemented in code. Next: Sprint 6 (industrial details) when ready.

**Goal:** Make the flour-mill digital twin look like a convincing industrial plant by building a shared material system once, upgrading the whole scene (HDRI + lighting + concrete floor), finishing one reference machine (roller mill) to 100%, then copying that style — without undoing the FPS work in `docs/superpowers/plans/2026-07-23-scene-performance-optimization.md`.

**Architecture:** `src/materials/` owns pinned shared materials, a React provider that loads textures once, and a module bridge so existing `matSteel` imports keep working. Sprint 1 ships the architecture with **flat placeholders** (factory looks identical). Sprint 2 adds CC0 textures + HDRI + floor. Sprint 3 textures shared infrastructure only. Sprint 4 finishes the roller mill as the gold standard. Sprints 5–7 apply the style guide plant-wide. Sprints 8–9 polish and measure.

**Tech Stack:** React 18, Vite, `@react-three/fiber`, `@react-three/drei` (`useTexture`, `Environment`, `ContactShadows`, `Text`), Three.js `MeshStandardMaterial`, CC0 textures from ambientCG / Poly Haven. Optional in Sprint 8: `@react-three/postprocessing` for SMAA / subtle bloom.

---

## Material Style Guide (canonical)

Every machine and infrastructure piece follows this table. Do not invent one-off colors per component.

| Part | Material export | Notes |
|------|-----------------|-------|
| Machine frame | `matPaintedSteel` | Gray painted steel |
| Covers / housings | `matStainless` | Brushed / stainless |
| Motors | `matPaintBlue` | Blue painted steel |
| Gearboxes | `matPaintDark` | Dark painted steel |
| Shafts / rollers | `matStainless` | Same family as covers |
| Process pipes | `matStainless` | Main ducts only in Sprint 3 |
| Dust ducts | `matPaintedSteel` | Darker painted look |
| Platforms / decks | `matGalvanized` | Diamond / galv plate |
| Handrails | `matRailYellow` | Safety yellow |
| Belts / wheels | `matRubber` | |
| Electrical cabinets | `matPaintedSteel` | Or blue tint where HMI banks need it |
| Floors | `matConcrete` | Industrial concrete, 2K max |

**Gate question after Sprint 4:** *"Would every future machine be acceptable if it looked like this?"* — only proceed to Sprint 5 if yes.

---

## What to defer (explicitly out of scope until later)

| Deferred | Why |
|----------|-----|
| ❌ RoundedBox / bevels | Geometry cost; tiny win vs PBR + HDRI |
| ❌ Triplanar mapping | Complexity; tune UV repeat instead |
| ❌ 4K textures | Almost no visual gain in browser; burns VRAM |
| ❌ Complex procedural dirt shaders | Sprint 7 uses simple stain meshes / tint only |

Max texture sizes: **floor/steel/painted/galvanized = 2K**, **rubber = 1K**, **HDRI = 1K–2K**.

---

## Perf constraints (do not regress)

| Constraint | Rule |
|------------|------|
| Shadows | Keep `Canvas shadows={false}`; use `ContactShadows` (`frames={1}`) only |
| DPR | Stay at `[1, 1]` or `[1, 1.5]` until Sprint 8; never > 2 |
| Shared mats | Always `pin()` — R3F must not dispose them |
| Overview FPS | ≥ 45 after each sprint; record in `visual-realism-baseline.md` |

---

## Asset layout

```text
public/
  textures/
    materials/
      concrete/          # color, normal, roughness, ao — 2K
      stainless/         # color, normal, roughness, metalness — 2K
      paintedSteel/      # color, normal, roughness — 2K
      galvanized/        # color, normal, roughness, metalness — 2K
      rubber/            # color, normal, roughness — 1K
    decals/
      warnings/
      logos/
    ATTRIBUTION.md
  hdri/
    factory.hdr          # 1K–2K
```

---

## File map

| File | Role |
|------|------|
| `src/materials/pin.ts` | Pin helper |
| `src/materials/paths.ts` | Texture / HDRI URL constants |
| `src/materials/repeat.ts` | UV repeat helpers |
| `src/materials/types.ts` | `PlantMaterials` type |
| `src/materials/createPlantMaterials.ts` | Build pinned materials (flat first, then textured) |
| `src/materials/bridge.ts` | Module-level exports + `hydrateBridge` |
| `src/materials/PlantMaterialsProvider.tsx` | Load textures once; hydrate bridge |
| `src/materials/index.ts` | Public API |
| `src/materials/styleGuide.md` | Copy of style guide for engineers |
| `src/perf/sharedMaterials.ts` | Re-export bridge (compat) |
| `src/App.tsx` | Provider, lighting, floor, later post FX |
| `src/components/factory/IndustrialFloor.tsx` | Concrete slab + joints + aisle marks |
| `src/components/factory/ProcessPiping.tsx` | Infra mats; flange/support detail later |
| `src/components/factory/PlantStructure.tsx` | Platforms / rails / steel |
| `src/components/factory/Electrical.tsx` | Cabinets |
| `src/components/machineParts/*` | Reusable Motor, Frame, ControlBox, Nameplate (Sprint 4+) |
| `src/components/rollermill.tsx` | Gold-standard reference machine |
| `src/components/DecalPlate.tsx` | Nameplates / warnings |
| `docs/superpowers/plans/visual-realism-baseline.md` | Stats + checklist per sprint |

---

## Sprint roadmap (summary)

```text
Sprint 1  Material architecture (no textures)     → factory looks identical
Sprint 2  Assets + lighting + concrete floor      → whole scene upgrades
Sprint 3  Infrastructure PBR (pipes/platforms/…)  → every screenshot better
Sprint 4  Roller mill 100% (gold standard)        → style locked
Sprint 5  Copy style to remaining machines        → no redesign
Sprint 6  Industrial details plant-wide           → flanges, IDs, labels
Sprint 7  Environmental wear                      → subtle lived-in look
Sprint 8  Rendering polish                        → DPR, exposure, optional FX
Sprint 9  Performance validation                  → measure; optimize only if needed
```

---

# Sprint 1 — Material Architecture (Foundation)

**Goal:** Build the material system once. Do **not** download textures.

**Deliverable:** Factory still looks identical, but material system is ready.

### Task 1.1: Create `pin.ts`, `paths.ts`, `repeat.ts`, `types.ts`

**Files:**
- Create: `src/materials/pin.ts`
- Create: `src/materials/paths.ts`
- Create: `src/materials/repeat.ts`
- Create: `src/materials/types.ts`
- Create: `src/materials/styleGuide.md`

- [ ] **Step 1: `pin.ts`**

```ts
import type * as THREE from "three";

/** Shared materials must survive R3F mesh unmount / StrictMode remount. */
export function pin<T extends THREE.Material>(mat: T): T {
  mat.userData.shared = true;
  mat.dispose = () => {
    /* shared — keep alive */
  };
  return mat;
}
```

- [ ] **Step 2: `paths.ts` (URLs only — files added in Sprint 2)**

```ts
export const TEX = {
  concrete: {
    map: "/textures/materials/concrete/color.jpg",
    normalMap: "/textures/materials/concrete/normal.jpg",
    roughnessMap: "/textures/materials/concrete/roughness.jpg",
    aoMap: "/textures/materials/concrete/ao.jpg",
  },
  stainless: {
    map: "/textures/materials/stainless/color.jpg",
    normalMap: "/textures/materials/stainless/normal.jpg",
    roughnessMap: "/textures/materials/stainless/roughness.jpg",
    metalnessMap: "/textures/materials/stainless/metalness.jpg",
  },
  paintedSteel: {
    map: "/textures/materials/paintedSteel/color.jpg",
    normalMap: "/textures/materials/paintedSteel/normal.jpg",
    roughnessMap: "/textures/materials/paintedSteel/roughness.jpg",
  },
  galvanized: {
    map: "/textures/materials/galvanized/color.jpg",
    normalMap: "/textures/materials/galvanized/normal.jpg",
    roughnessMap: "/textures/materials/galvanized/roughness.jpg",
    metalnessMap: "/textures/materials/galvanized/metalness.jpg",
  },
  rubber: {
    map: "/textures/materials/rubber/color.jpg",
    normalMap: "/textures/materials/rubber/normal.jpg",
    roughnessMap: "/textures/materials/rubber/roughness.jpg",
  },
} as const;

export const HDRI_FACTORY = "/hdri/factory.hdr";
```

- [ ] **Step 3: `repeat.ts`**

```ts
import * as THREE from "three";

export function setRepeat(
  tex: THREE.Texture | null | undefined,
  repeatX: number,
  repeatY: number
): void {
  if (!tex) return;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
}

export function setMapsRepeat(
  maps: Record<string, THREE.Texture | undefined>,
  repeatX: number,
  repeatY: number
): void {
  for (const tex of Object.values(maps)) {
    setRepeat(tex, repeatX, repeatY);
  }
}
```

- [ ] **Step 4: `types.ts`**

```ts
import type * as THREE from "three";

export type PlantMaterials = {
  stainless: THREE.MeshStandardMaterial;
  stainlessDark: THREE.MeshStandardMaterial;
  paintedSteel: THREE.MeshStandardMaterial;
  paintBlue: THREE.MeshStandardMaterial;
  paintDark: THREE.MeshStandardMaterial;
  paintYellow: THREE.MeshStandardMaterial;
  galvanized: THREE.MeshStandardMaterial;
  rubber: THREE.MeshStandardMaterial;
  concrete: THREE.MeshStandardMaterial;
  pneumatic: THREE.MeshStandardMaterial;
  dustDuct: THREE.MeshStandardMaterial;
  deck: THREE.MeshStandardMaterial;
  structureSteel: THREE.MeshStandardMaterial;
  railYellow: THREE.MeshStandardMaterial;
  flange: THREE.MeshStandardMaterial;
};
```

- [ ] **Step 5: Copy style guide into `src/materials/styleGuide.md`** (same table as above)

- [ ] **Step 6: Commit**

```bash
git add src/materials
git commit -m "feat(materials): add pin, paths, repeat, types, and style guide"
```

---

### Task 1.2: Flat `createPlantMaterials` + bridge (no textures yet)

**Files:**
- Create: `src/materials/createPlantMaterials.ts`
- Create: `src/materials/bridge.ts`
- Create: `src/materials/index.ts`
- Modify: `src/perf/sharedMaterials.ts`

- [ ] **Step 1: Flat factory (Sprint 1 mode)**

`createPlantMaterials` must work **without** texture maps. Match current shared colors closely so the plant looks unchanged:

```ts
import * as THREE from "three";
import { pin } from "./pin";
import type { PlantMaterials } from "./types";

export type LoadedTextureGroups = {
  concrete?: Record<string, THREE.Texture>;
  stainless?: Record<string, THREE.Texture>;
  paintedSteel?: Record<string, THREE.Texture>;
  galvanized?: Record<string, THREE.Texture>;
  rubber?: Record<string, THREE.Texture>;
};

function std(opts: {
  color: string;
  metalness: number;
  roughness: number;
  envMapIntensity?: number;
  maps?: Record<string, THREE.Texture | undefined>;
  repeat?: [number, number];
}): THREE.MeshStandardMaterial {
  const mat = pin(
    new THREE.MeshStandardMaterial({
      color: opts.color,
      metalness: opts.metalness,
      roughness: opts.roughness,
      envMapIntensity: opts.envMapIntensity ?? 0.6,
      map: opts.maps?.map,
      normalMap: opts.maps?.normalMap,
      roughnessMap: opts.maps?.roughnessMap,
      metalnessMap: opts.maps?.metalnessMap,
      aoMap: opts.maps?.aoMap,
    })
  );
  return mat;
}

/** Sprint 1: call with `{}` → flat mats matching current plant look. */
export function createPlantMaterials(_tex: LoadedTextureGroups = {}): PlantMaterials {
  // When maps are present (Sprint 2+), pass them via opts.maps and setRepeat.
  return {
    stainless: std({ color: "#a8aeb4", metalness: 0.12, roughness: 0.62 }),
    stainlessDark: std({ color: "#6a7278", metalness: 0.14, roughness: 0.65 }),
    flange: std({ color: "#949aA0", metalness: 0.15, roughness: 0.58 }),
    paintedSteel: std({ color: "#7a8288", metalness: 0.08, roughness: 0.65 }),
    paintBlue: std({ color: "#3a5f8a", metalness: 0.08, roughness: 0.65 }),
    paintDark: std({ color: "#3a454c", metalness: 0.1, roughness: 0.6 }),
    paintYellow: std({ color: "#c9a227", metalness: 0.08, roughness: 0.6 }),
    galvanized: std({ color: "#9aa2a6", metalness: 0.12, roughness: 0.6 }),
    rubber: std({ color: "#2a2a2a", metalness: 0.02, roughness: 0.92 }),
    concrete: std({ color: "#b0b0a8", metalness: 0.02, roughness: 0.95 }),
    pneumatic: std({ color: "#c8d0d8", metalness: 0.12, roughness: 0.55 }),
    dustDuct: std({ color: "#6a7278", metalness: 0.12, roughness: 0.6 }),
    deck: std({ color: "#7a8288", metalness: 0.12, roughness: 0.6 }),
    structureSteel: std({ color: "#6a747c", metalness: 0.12, roughness: 0.6 }),
    railYellow: std({ color: "#e0a92c", metalness: 0.08, roughness: 0.55 }),
  };
}
```

Use **low metalness** in Sprint 1 (same as current `sharedMaterials.ts`) so materials do not go black under the existing weak Environment.

- [ ] **Step 2: `bridge.ts` — module exports + hydrate**

```ts
import * as THREE from "three";
import { createPlantMaterials } from "./createPlantMaterials";
import type { PlantMaterials } from "./types";

const initial = createPlantMaterials({});

export const matSteel = initial.stainless;
export const matSteelDark = initial.stainlessDark;
export const matFlange = initial.flange;
export const matPaintedSteel = initial.paintedSteel;
export const matPaintBlue = initial.paintBlue;
export const matPaintDark = initial.paintDark;
export const matPaintYellow = initial.paintYellow;
export const matGalvanized = initial.galvanized;
export const matRubber = initial.rubber;
export const matConcrete = initial.concrete;
export const matPneumatic = initial.pneumatic;
export const matDustDuct = initial.dustDuct;
export const matDeck = initial.deck;
export const matStructureSteel = initial.structureSteel;
export const matRailYellow = initial.railYellow;

/** Compat aliases used by ProcessPiping / PlantStructure today */
export const matPaintBlue_compat = matPaintBlue;

export function hydrateBridge(m: PlantMaterials): void {
  const pairs: [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial][] = [
    [matSteel, m.stainless],
    [matSteelDark, m.stainlessDark],
    [matFlange, m.flange],
    [matPaintedSteel, m.paintedSteel],
    [matPaintBlue, m.paintBlue],
    [matPaintDark, m.paintDark],
    [matPaintYellow, m.paintYellow],
    [matGalvanized, m.galvanized],
    [matRubber, m.rubber],
    [matConcrete, m.concrete],
    [matPneumatic, m.pneumatic],
    [matDustDuct, m.dustDuct],
    [matDeck, m.deck],
    [matStructureSteel, m.structureSteel],
    [matRailYellow, m.railYellow],
  ];
  for (const [dst, src] of pairs) {
    dst.color.copy(src.color);
    dst.metalness = src.metalness;
    dst.roughness = src.roughness;
    dst.envMapIntensity = src.envMapIntensity;
    dst.map = src.map;
    dst.normalMap = src.normalMap;
    dst.roughnessMap = src.roughnessMap;
    dst.metalnessMap = src.metalnessMap;
    dst.aoMap = src.aoMap;
    dst.needsUpdate = true;
  }
}
```

Also export legacy names expected by current code:

```ts
export { matPaintBlue as matPaintBlueLegacy };
// ProcessPiping imports matPaintBlue, matPaintYellow — keep those exact names:
```

Ensure `src/perf/sharedMaterials.ts` still exports: `matSteel`, `matSteelDark`, `matFlange`, `matPaintBlue`, `matPaintYellow`, `matRubber`, `matConcrete`, `matPneumatic`, `matDustDuct`, `matDeck`, `matStructureSteel`, `matRailYellow`.

- [ ] **Step 3: Replace `src/perf/sharedMaterials.ts` with re-exports**

```ts
export {
  matSteel,
  matSteelDark,
  matFlange,
  matPaintBlue,
  matPaintYellow,
  matRubber,
  matConcrete,
  matPneumatic,
  matDustDuct,
  matDeck,
  matStructureSteel,
  matRailYellow,
  matPaintedSteel,
  matPaintDark,
  matGalvanized,
} from "../materials/bridge";
```

- [ ] **Step 4: `index.ts`**

```ts
export { pin } from "./pin";
export { TEX, HDRI_FACTORY } from "./paths";
export { createPlantMaterials } from "./createPlantMaterials";
export { hydrateBridge } from "./bridge";
export type { PlantMaterials } from "./types";
export * from "./bridge";
```

- [ ] **Step 5: Commit**

```bash
git add src/materials src/perf/sharedMaterials.ts
git commit -m "feat(materials): flat plant materials factory and shared bridge"
```

---

### Task 1.3: Provider shell (textures optional / skipped)

**Files:**
- Create: `src/materials/PlantMaterialsProvider.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Provider that works without texture files**

```tsx
import { createContext, useContext, useLayoutEffect, useMemo, type ReactNode } from "react";
import { createPlantMaterials } from "./createPlantMaterials";
import { hydrateBridge } from "./bridge";
import type { PlantMaterials } from "./types";

const Ctx = createContext<PlantMaterials | null>(null);

export function usePlantMaterials(): PlantMaterials {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlantMaterials requires PlantMaterialsProvider");
  return v;
}

type Props = { children: ReactNode; enableTextures?: boolean };

/** Sprint 1: enableTextures=false. Sprint 2+: true + useTexture inside. */
export function PlantMaterialsProvider({ children, enableTextures = false }: Props) {
  // Sprint 1 path — no useTexture
  const materials = useMemo(() => createPlantMaterials({}), []);

  useLayoutEffect(() => {
    hydrateBridge(materials);
  }, [materials]);

  // Sprint 2 will replace this component body to call useTexture when enableTextures.
  void enableTextures;

  return <Ctx.Provider value={materials}>{children}</Ctx.Provider>;
}
```

- [ ] **Step 2: Wrap scene in `App.tsx`**

Inside `<Canvas>`, wrap the plant group (and floor later) with:

```tsx
<Suspense fallback={null}>
  <PlantMaterialsProvider enableTextures={false}>
    {/* existing lights stay for now */}
    <group position={[-cx, 0, -cz]}>
      <MaterialHandlingLine />
      {showBuilding && <BuildingEnvelope cutaway={cutaway} showLights={false} />}
    </group>
  </PlantMaterialsProvider>
</Suspense>
```

Do **not** change lights, floor, or Environment in Sprint 1.

- [ ] **Step 3: Verify old machines still render**

```bash
npm run dev
```

Orbit overview + milling close + packing close. No black materials, no console errors about missing textures.

- [ ] **Step 4: Commit**

```bash
git add src/materials/PlantMaterialsProvider.tsx src/App.tsx
git commit -m "feat(materials): mount PlantMaterialsProvider (flat mode)"
```

**Sprint 1 exit criteria:** Visual parity with pre-change plant; `matSteel` imports resolve through bridge; provider mounted.

---

# Sprint 2 — Assets + Lighting + Floor

**Goal:** Improve the entire scene at once.

**Deliverable:** Better lighting, real concrete, better reflections — whole factory upgrades together.

### Task 2.1: Download CC0 textures + HDRI

**Files:**
- Create: `public/textures/materials/**`
- Create: `public/hdri/factory.hdr`
- Create: `public/textures/ATTRIBUTION.md`

- [ ] **Step 1: Download (2K max; rubber 1K; no 4K)**

| Folder | Res | Maps |
|--------|-----|------|
| `materials/concrete/` | 2K | color, normal, roughness, ao |
| `materials/stainless/` | 2K | color, normal, roughness, metalness |
| `materials/paintedSteel/` | 2K | color, normal, roughness |
| `materials/galvanized/` | 2K | color, normal, roughness, metalness |
| `materials/rubber/` | 1K | color, normal, roughness |
| `hdri/factory.hdr` | 1K–2K | HDRI |

Filenames: `color.jpg`, `normal.jpg`, `roughness.jpg`, `ao.jpg`, `metalness.jpg`.

- [ ] **Step 2: Write `public/textures/ATTRIBUTION.md`** with source IDs + CC0 license.

- [ ] **Step 3: Verify URLs**

Open `http://localhost:5173/textures/materials/concrete/color.jpg` and confirm HDRI path downloads.

- [ ] **Step 4: Commit**

```bash
git add public/textures public/hdri
git commit -m "assets: add CC0 PBR materials (≤2K) and factory HDRI"
```

---

### Task 2.2: Enable textured materials in provider

**Files:**
- Modify: `src/materials/createPlantMaterials.ts`
- Modify: `src/materials/PlantMaterialsProvider.tsx`
- Modify: `src/App.tsx` (`enableTextures={true}`)

- [ ] **Step 1: Extend `createPlantMaterials` to apply maps + repeat when present**

When `tex.stainless` etc. exist:
- stainless / pneumatic / flange → stainless maps, metalness **0.7–0.85**, roughness **0.3–0.45**, `envMapIntensity` ~1.0
- painted / dust / structure / rail yellow → paintedSteel maps, tint via `color`
- galvanized / deck → galvanized maps
- rubber → rubber maps
- concrete → concrete maps, repeat `[12, 12]`

Use `setMapsRepeat` after cloning textures per material so repeats do not conflict.

- [ ] **Step 2: Provider loads with `useTexture`**

```tsx
import { useTexture } from "@react-three/drei";
import { TEX } from "./paths";

export function PlantMaterialsProvider({ children, enableTextures = true }: Props) {
  if (!enableTextures) {
    // keep Sprint 1 path
  }
  const concrete = useTexture({ ...TEX.concrete });
  const stainless = useTexture({ ...TEX.stainless });
  const paintedSteel = useTexture({ ...TEX.paintedSteel });
  const galvanized = useTexture({ ...TEX.galvanized });
  const rubber = useTexture({ ...TEX.rubber });

  const materials = useMemo(
    () => createPlantMaterials({ concrete, stainless, paintedSteel, galvanized, rubber }),
    [concrete, stainless, paintedSteel, galvanized, rubber]
  );

  useLayoutEffect(() => {
    hydrateBridge(materials);
  }, [materials]);

  return <Ctx.Provider value={materials}>{children}</Ctx.Provider>;
}
```

Split into `FlatPlantMaterialsProvider` vs textured provider if hooks-conditional is awkward — **never** call `useTexture` conditionally. Prefer always-on textured provider once Sprint 2 starts (assets must exist).

- [ ] **Step 3: Commit**

```bash
git add src/materials src/App.tsx
git commit -m "feat(materials): hydrate shared mats from PBR texture packs"
```

---

### Task 2.3: Lighting + HDRI + contact shadows

**Files:**
- Modify: `src/App.tsx`
- Create: `docs/superpowers/plans/visual-realism-baseline.md`

- [ ] **Step 1: Replace washed-out lighting**

```tsx
import { Environment, ContactShadows, Sky, Stats, OrbitControls } from "@react-three/drei";
import { HDRI_FACTORY } from "./materials/paths";

// Canvas:
shadows={false}
dpr={[1, 1.5]}
gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.05 }}

// Lights:
<ambientLight intensity={0.28} />
<hemisphereLight args={["#dfe7f2", "#6a6a5e", 0.35]} />
<directionalLight position={[30, 50, 20]} intensity={1.85} />
<Sky sunPosition={[100, 40, 100]} turbidity={3} rayleigh={0.6} mieCoefficient={0.003} />

<Suspense fallback={null}>
  <Environment files={HDRI_FACTORY} environmentIntensity={0.55} background={false} />
  <PlantMaterialsProvider>
    {/* floor + scene */}
    <ContactShadows
      position={[0, 0.01, 0]}
      opacity={0.35}
      scale={groundR * 2.2}
      blur={2.5}
      far={40}
      resolution={512}
      frames={1}
    />
  </PlantMaterialsProvider>
</Suspense>
```

Remove or keep `Sky` — keep if it helps outdoor feel through cutaway; HDRI is the IBL source for metals.

- [ ] **Step 2: Record baseline row “After Sprint 2 lighting”**

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx docs/superpowers/plans/visual-realism-baseline.md
git commit -m "feat(lighting): HDRI, lower ambient, contact shadows"
```

---

### Task 2.4: IndustrialFloor

**Files:**
- Create: `src/components/factory/IndustrialFloor.tsx`
- Modify: `src/App.tsx` — remove circle floor + `gridHelper`

- [ ] **Step 1: Create floor component using `usePlantMaterials().concrete`**

Include:
- Large plane with concrete material (uv2 = uv if aoMap set)
- Expansion joint strips every ~6 m
- Yellow aisle centerline marks

- [ ] **Step 2: Visual check** — floor dominates viewport; grid gone; concrete normals visible up close.

- [ ] **Step 3: Commit**

```bash
git add src/components/factory/IndustrialFloor.tsx src/App.tsx
git commit -m "feat(floor): industrial concrete slab with joints and aisle marks"
```

**Sprint 2 exit criteria:** Entire plant reads better in any screenshot (light + floor + IBL), even if machines are still flat-colored locally.

---

# Sprint 3 — Infrastructure Materials

**Goal:** Apply PBR only to shared infrastructure. Do **not** remap machines yet. Do **not** texture every small pipe.

**Priority surfaces:**
1. Main process ducts / large elbows (not every tiny run)
2. Large tanks / silo shells (if using shared mats)
3. Platforms, decks, railings
4. Structural steel
5. Electrical cabinets
6. Floor (already done — verify)

### Task 3.1: PlantStructure + Electrical → style guide mats

**Files:**
- Modify: `src/components/factory/PlantStructure.tsx`
- Modify: `src/components/factory/Electrical.tsx`

- [ ] **Step 1:** Decks → `matGalvanized` / `matDeck`; posts → `matStructureSteel`; rails → `matRailYellow`.

- [ ] **Step 2:** Cabinets → `matPaintedSteel` / `matPaintBlue` as appropriate; remove duplicate local materials where possible.

- [ ] **Step 3:** Visual check platforms vs rails vs cabinets — three distinct families.

- [ ] **Step 4: Commit**

```bash
git add src/components/factory/PlantStructure.tsx src/components/factory/Electrical.tsx
git commit -m "feat(materials): PBR on platforms, rails, and electrical cabinets"
```

---

### Task 3.2: Main process piping only

**Files:**
- Modify: `src/components/factory/ProcessPiping.tsx`
- Optionally: `src/components/MaterialHandlingLine.tsx` (only if duct color selection needs updating)

- [ ] **Step 1:** Confirm `ElbowedPipe` / `RoundDuct` already use `matSteel` / `matPneumatic` / `matDustDuct` via bridge — after Sprint 2 hydrate they show stainless/painted maps.

- [ ] **Step 2:** **Do not** add bolts to every flange yet (Sprint 6). Optional: slightly increase cylinder segments on **large** ducts only (`radius >= 0.12`) from 8 → 12.

- [ ] **Step 3:** Skip decorative work on tiny utility lines.

- [ ] **Step 4: Commit** (only if code changed)

```bash
git add src/components/factory/ProcessPiping.tsx
git commit -m "feat(piping): rely on shared PBR for main process ducts"
```

**Sprint 3 exit criteria:** Every overview screenshot looks much better; machines can still be locally flat.

---

# Sprint 4 — Roller Mill (Gold Standard)

**Goal:** Finish the roller mill to **100%** before touching any other machine.

Spend most of the effort here. Extract reusable parts as you go.

### Task 4.1: Machine style remap on roller mill

**Files:**
- Modify: `src/components/rollermill.tsx`

| Part | Material |
|------|----------|
| Frame / legs | `matPaintedSteel` / `matStructureSteel` |
| Covers / housings | `matStainless` (`matSteel`) |
| Motor | `matPaintBlue` |
| Gearbox / dark housings | `matPaintDark` |
| Shafts / rollers | `matSteel` |
| Belts / handwheels | `matRubber` |
| Guards / accents | `matRailYellow` / `matPaintYellow` |

- [ ] **Step 1:** Import bridge mats; replace major `meshStandardMaterial` usages with `dispose={null} material={...}`.

- [ ] **Step 2:** Keep emissive LEDs / status lights local.

- [ ] **Step 3:** Visual check close-up — ≥ 4 distinct material roles.

- [ ] **Step 4: Commit**

```bash
git add src/components/rollermill.tsx
git commit -m "feat(rollermill): apply plant material style guide"
```

---

### Task 4.2: Extract reusable machine parts

**Files:**
- Create: `src/components/machineParts/Motor.tsx`
- Create: `src/components/machineParts/MachineFrame.tsx`
- Create: `src/components/machineParts/ControlBox.tsx`
- Create: `src/components/machineParts/Nameplate.tsx` (or `DecalPlate.tsx`)
- Modify: `src/components/rollermill.tsx` to use them where natural

Keep APIs small:

```tsx
// Motor.tsx — blue body + stainless shaft stub
export function Motor({ position, rotation, scale = 1 }: {...}) { ... }

// Nameplate.tsx
export function Nameplate({ position, rotation, title, subtitle }: {...}) { ... }
```

- [ ] **Step 1:** Extract only what the roller mill actually uses (avoid speculative mega-kit).

- [ ] **Step 2:** Roller mill still looks correct after extraction.

- [ ] **Step 3: Commit**

```bash
git add src/components/machineParts src/components/rollermill.tsx
git commit -m "feat(machineParts): extract motor, frame, control box, nameplate"
```

---

### Task 4.3: Roller mill detail pass (finish 100%)

**Files:**
- Modify: `src/components/rollermill.tsx`
- Modify: `src/components/machineParts/*` as needed

Complete **all** of the following on this machine only:

- [ ] Nameplate (`RM-01` / “ROLLER MILL”)
- [ ] Warning label (yellow/black)
- [ ] Visible bolts on major flanges / cover corners (low poly, 6-sided cylinders)
- [ ] Rubber belt / coupling reads as rubber
- [ ] Slight oil stain under drive end (small dark transparent plane on floor)
- [ ] Surface variation via existing PBR maps (no custom dirt shader)

- [ ] **Gate:** Answer in `visual-realism-baseline.md`:

```markdown
## Sprint 4 gate
Would every future machine be acceptable if it looked like this? YES / NO
Notes:
```

Only proceed to Sprint 5 on **YES**.

- [ ] **Commit**

```bash
git add src/components/rollermill.tsx src/components/machineParts docs/superpowers/plans/visual-realism-baseline.md
git commit -m "feat(rollermill): complete gold-standard detail pass"
```

---

# Sprint 5 — Standardize Every Machine

**Goal:** Copy the proven style. **No redesign.**

Order:

```text
Destoner → Purifier → Plansifter → Scourer → Magnetic →
Bran finisher → Damping → Vibro → Hoppers/bins/silos →
Bucket elevator / screw → Packing cell → Palletizer → Warehouse
```

### Task 5.1–5.n: Per-machine style apply

**Rule:** For each machine file:

1. Import style-guide materials (and `machineParts` where a Motor/Nameplate fits).
2. Remap frame / covers / motor / belt / guards only.
3. Do **not** invent new colors.
4. Do **not** add unique decoration systems.
5. Commit in small batches (3–5 machines).

Example commit:

```bash
git add src/components/Destoner.tsx src/components/purifier.tsx src/components/plansifter.tsx
git commit -m "feat(materials): apply style guide to destoner, purifier, plansifter"
```

**Sprint 5 exit criteria:** All major machines follow the style guide; plant looks consistent.

---

# Sprint 6 — Industrial Details (Plant-Wide)

**Goal:** Engineered look across the whole plant — not per-machine art passes.

Add:

- Flanges + bolts on **main** ducts (reuse Sprint 4 bolt pattern)
- Pipe supports / hangers (already partially present — densify on long spans only)
- Cable trays / junction boxes (prefer extending `Electrical.tsx`)
- Nameplates + equipment IDs on key machines
- Emergency / warning labels (palletizer cell, mill decks)
- Flow arrows on major ducts (simple decal planes or `Text`)

### Task 6.1: Piping flanges/supports enrichment

**Files:** `src/components/factory/ProcessPiping.tsx`

- [ ] Upgrade `SquareFlange` with gasket + 4 bolts (skip when `radius < 0.08`)
- [ ] Perf gate: if draw calls +150, reduce bolts / skip small flanges
- [ ] Commit: `feat(piping): flange bolts and gaskets on main ducts`

### Task 6.2: Decals plant-wide

**Files:** `src/components/DecalPlate.tsx`, key machines, `Palletizer.tsx`

- [ ] Shared `DecalPlate` / `Nameplate`
- [ ] Equipment IDs on zone heroes (silo, packing, palletizer)
- [ ] Commit: `feat(decals): equipment IDs and safety labels`

**Sprint 6 exit criteria:** Plant reads as labeled, engineered equipment — not anonymous gray blocks.

---

# Sprint 7 — Environmental Detail

**Goal:** Lived-in, maintained plant. Keep it subtle.

Add (simple meshes / tints only):

- Oil stains near drives / packing
- Light dust tint on high ledges (optional darker `matPaintedSteel` variant)
- Concrete wear near forklift path (darker patches)
- Forklift tire marks (thin dark planes in warehouse aisle)
- Optional weld-seam strips on large tanks (thin darker boxes) — sparingly

**Do not** build procedural dirt shaders.

### Task 7.1: Wear kit

**Files:**
- Create: `src/components/factory/EnvironmentalWear.tsx`
- Modify: `MaterialHandlingLine.tsx` or `App.tsx` to mount once

- [ ] 3–6 oil stains, 1–2 tire mark strips, optional concrete wear patches
- [ ] Opacity ≤ 0.4; dark desaturated colors
- [ ] Commit: `feat(env): subtle oil stains and floor wear`

---

# Sprint 8 — Rendering Polish

**Goal:** Soften the final image. Do not overdo effects.

### Task 8.1: Canvas / exposure / HDRI intensity

**Files:** `src/App.tsx`

Tune only:

- `dpr` → try `[1, 2]` if FPS ≥ 50 at `[1, 1.5]`; else keep `[1, 1.5]`
- `toneMappingExposure`
- `environmentIntensity`
- `antialias: true`

### Task 8.2 (optional): Post-processing

**Files:** `src/App.tsx`, `package.json`

Only if still looking harsh after 8.1:

```bash
npm install @react-three/postprocessing three-stdlib
```

```tsx
import { EffectComposer, Bloom, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

<EffectComposer multisampling={0}>
  <SMAA />
  <Bloom intensity={0.15} luminanceThreshold={0.85} mipmapBlur />
  <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
</EffectComposer>
```

**Rules:** Bloom must be barely visible. If FPS drops >8, remove Bloom first, then EffectComposer entirely.

- [ ] Commit: `feat(render): final exposure/DPR polish` (+ post FX only if kept)

---

# Sprint 9 — Performance Validation

**Goal:** Measure. Optimize only if necessary.

### Task 9.1: Benchmark

**Files:** `docs/superpowers/plans/visual-realism-baseline.md`

Capture for overview / milling close / packing close / orbit drag:

| Metric | Target | Action if miss |
|--------|--------|----------------|
| FPS | ≥ 55 preferred, ≥ 45 hard floor | Reduce DPR, drop Bloom, lower HDRI res |
| Draw calls | < 600 ideal | Fewer flange bolts; instance more |
| Triangles | < 1.5M | Soften geometry elsewhere; no bevels |
| GPU memory | Note textures ≤ 2K | Drop unused maps; compress to webp if needed |

- [ ] Fill final baseline table
- [ ] List any follow-up opts (do not invent opts without a failing metric)
- [ ] Commit: `docs: record visual realism final performance baseline`

---

## Self-review (this revision)

| Reviewer request | How plan addresses it |
|------------------|----------------------|
| Material system before downloading textures | Sprint 1 flat; Sprint 2 assets |
| Gold-standard machine before plant-wide remap | Sprint 4 complete → Sprint 5 copy |
| Floor before machines | Sprint 2 floor; machines Sprint 4+ |
| No 4K | Hard rule in defer + asset table |
| Style guide | Canonical table + `styleGuide.md` |
| Skip bevels | Explicitly deferred |
| Post-processing | Sprint 8 optional, subtle |
| Better texture folders | `textures/materials/`, `decals/`, `hdri/` |
| Don’t texture every pipe | Sprint 3 main ducts only |
| Reusable machine base | Sprint 4 `machineParts/*` |
| Whole scene early | Sprints 2–3 before machine art |

**Placeholder scan:** No TBD steps; deferred items listed with rationale.

**Type consistency:** Style-guide names (`matPaintedSteel`, `matPaintDark`, `matGalvanized`) added alongside legacy `matSteel` / `matPaintBlue` aliases for existing imports.
