# 3D Factory Digital Twin — Realism Enhancement Full Development Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Type:** Development update + forward implementation plan  
> **Date:** 2026-07-29  
> **Supersedes for remaining work:** Continues after Sprints 1–5 in `2026-07-23-visual-realism-materials-lighting.md`. Does **not** redo completed material architecture.  
> **Related docs:** `visual-realism-baseline.md`, `2026-07-23-scene-performance-optimization.md`, `docs/flour-mill-digital-twin-roadmap.md`, `src/materials/styleGuide.md`

**Goal:** Evolve the flour-mill digital twin from a consistent PBR plant layout into a photorealistic, interactive, production-credible industrial simulation — without regressing overview FPS (≥45 hard floor, ≥55 preferred).

**Architecture:** Keep the shared `src/materials/` PBR system and operator shell as foundations. Layer realism in three waves: (A) environment + safety + wear, (B) motion + particles + equipment detail, (C) post-FX + audio + live twin UX. Prefer shared kits (`machineParts/`, `factory/`, instancing) over one-off per-machine art.

**Tech Stack:** React 18, Vite, `@react-three/fiber`, `@react-three/drei`, Three.js `MeshStandardMaterial`, existing twin/shell (`src/twin/*`, `src/shell/*`), optional later: `@react-three/postprocessing`, PositionalAudio / Howler

---

## 1. Current state (as of 2026-07-29)

### Already shipped

| Area | Status | Evidence |
|------|--------|----------|
| Shared PBR materials + provider | Done | `src/materials/*`, textures under `public/textures/materials/` |
| HDRI environment + contact shadows | Done | `App.tsx` (`Environment`, `ContactShadows frames={1}`, `shadows={false}`) |
| Concrete floor + joints + basic aisle paint | Partial | `IndustrialFloor.tsx` — needs hazard zones / arrows / wear |
| Style guide on machines | Done (Sprint 5) | Roller mill gold standard; plant-wide remap |
| Operator console shell + KPIs / tags | Done | `OperatorShell`, `RightInspector`, twin simulate |
| Navigation (minimap, fly-to, zones, LOD) | Done | `src/navigation/*`, `MachineLOD` |
| Material flow particles | Partial | `MaterialFlow.tsx` InstancedMesh; per-machine `Sparkles` scattered |
| Process piping / structure / electrical | Partial | Present; flanges/bolts/cable trays still thin |
| Perf constraints | Locked | No dynamic shadows; DPR ≤ 1.5 until polish; pin shared mats |

### Explicitly not done yet

- Plant-wide industrial details (flanges, cable trays, safety props)
- Environmental wear / oil stains / floor marking system
- Unified flour-dust / vapor FX (budgeted, LOD-gated)
- Post-processing (Bloom / ACES / fog)
- Spatial audio
- Live PLC / MQTT (still simulated)
- Interactive inspection doors / hover outlines
- Measurement tools / X-ray mode

### Non-negotiable constraints (carry forward)

| Constraint | Rule |
|------------|------|
| Shadows | `Canvas shadows={false}`; `ContactShadows` only (`frames={1}`) |
| DPR | `[1, 1.5]` until Phase C polish; never > 2 |
| Textures | Max 2K (rubber 1K, HDRI 1K–2K); no 4K |
| Materials | Always `pin()` / `dispose={null}` for shared mats |
| Bevels / RoundedBox | Deferred — tiny win vs cost |
| Overview FPS | ≥ 45 after every milestone; record in `visual-realism-baseline.md` |
| Style guide | No inventing one-off colors; use `styleGuide.md` |

---

## 2. File map (who owns what)

| Path | Responsibility |
|------|----------------|
| `src/App.tsx` | Canvas, HDRI, ContactShadows, optional EffectComposer / fog |
| `src/materials/*` | Shared PBR; style guide; texture hydration |
| `src/components/factory/IndustrialFloor.tsx` | Concrete, joints, aisle / hazard / arrow markings |
| `src/components/factory/EnvironmentalWear.tsx` | **Create** — oil stains, tire marks, dust tints |
| `src/components/factory/SafetyProps.tsx` | **Create** — extinguishers, E-stops, eye wash, signs |
| `src/components/factory/ProcessPiping.tsx` | Ducts, flanges, hangers |
| `src/components/factory/Electrical.tsx` | Cabinets, cable trays, junction boxes |
| `src/components/factory/PlantStructure.tsx` | Platforms, rails, I-beams, drainage |
| `src/components/factory/BuildingEnvelope.tsx` | Shell, cutaway, ceiling fixtures |
| `src/components/factory/Atmosphere.tsx` | **Create** — fog / dust motes plant-level budget |
| `src/components/machineParts/*` | Motor, Nameplate, ControlBox, bolts, door hinges |
| `src/components/effects/FlourDust.tsx` | **Create** — shared LOD-gated dust |
| `src/components/effects/SightGlassFlow.tsx` | **Create** — chute / sight-glass material stream |
| `src/components/*` (machines) | Equipment-specific detail + animation hooks |
| `src/shell/*` | HUD panels, inspector, notifications |
| `src/twin/*` | Tags, simulate → later MQTT bridge |
| `src/navigation/*` | Minimap, fly-to, LOD, focus |
| `src/perf/*` | Shared mats re-export, camera-near helpers |
| `docs/superpowers/plans/visual-realism-baseline.md` | FPS / draw-call log per milestone |

---

## 3. Phased roadmap overview

```text
PHASE A — Environment & industrial credibility     (Quick wins → high visual impact)
  A1  Floor markings & hazard zones
  A2  Safety props & signage
  A3  Piping flanges / hangers / cable trays
  A4  Environmental wear (oil, tire, dust tint)
  A5  Equipment IDs / nameplates plant-wide

PHASE B — Motion, particles & equipment depth      (Medium effort)
  B1  Conveyor / fan / pneumatic animation kit
  B2  Unified flour dust + dampener vapor (budgeted)
  B3  Sight-glass / chute material flow
  B4  Equipment detail pass (silos, elevators, mill, plansifter, HMI)
  B5  Interactive doors + hover highlight
  B6  Instancing for bolts / fence / repeating parts

PHASE C — Digital twin immersion                   (Higher effort)
  C1  Post-processing (SMAA, subtle Bloom, ACES)
  C2  Atmospheric fog (very light)
  C3  Floating 3D data callouts (optional; shell already covers most)
  C4  Spatial audio
  C5  MQTT / WebSocket live tags
  C6  Nav extras (measure tool, X-ray / exploded)
  C7  Final perf validation & baseline
```

Map to the enhancement guide sections:

| Guide section | Phase |
|---------------|-------|
| 1 Materials & Textures | Mostly done; A4/B4 refine |
| 2 Lighting & Shadows | Done core; C1–C2 polish |
| 3 Environmental Details | **A1–A5** |
| 4 Animation & Interactivity | **B1–B5** |
| 5 Visual Effects & Post-Processing | **C1–C2** |
| 6 Equipment-Specific Enhancements | **B4** |
| 7 UI/UX & Digital Twin Features | Shell/nav done; **C3, C5, C6** |
| 8 Performance Optimization | Ongoing + **B6, C7** |
| 9 Audio Design | **C4** |
| 10 Real-World References | Standards checklist (below) |
| 11 Quick Wins roadmap | Phase A = quick wins |

---

# PHASE A — Environment & industrial credibility

**Exit criteria:** Overview screenshot reads as a labeled, safety-compliant mill floor with lived-in wear — not a clean CAD layout. FPS still ≥ 45.

---

### Task A1: Floor markings & hazard zones

**Files:**
- Modify: `src/components/factory/IndustrialFloor.tsx`
- Optionally: `src/components/layoutConstants.ts` (marking polyline constants)

**Scope:**
- Safety yellow pedestrian / aisle lines (extend beyond the two current strips)
- Red hazard rectangle around palletizer robot cell
- Optional forklift lane arrows (simple chevron meshes or thin extruded triangles)
- Keep materials local or shared; opacity solid; height `y ≈ -0.01` above slab

- [ ] **Step 1:** Define marking segments from packing aisle → forklift bay → warehouse in layout constants or inline arrays
- [ ] **Step 2:** Add yellow line meshes + red hazard pad under palletizer fence footprint
- [ ] **Step 3:** Add 2–4 directional arrows on main logistics path
- [ ] **Step 4:** Visual check overview + packing close-up
- [ ] **Step 5:** Record FPS in `visual-realism-baseline.md` (row: After A1)
- [ ] **Step 6: Commit**

```bash
git add src/components/factory/IndustrialFloor.tsx src/components/layoutConstants.ts docs/superpowers/plans/visual-realism-baseline.md
git commit -m "feat(floor): aisle lines, hazard zone, and traffic arrows"
```

**Acceptance:** Walkways and restricted zones readable at overview; no grid look remaining.

---

### Task A2: Safety props & compliance equipment

**Files:**
- Create: `src/components/factory/SafetyProps.tsx`
- Modify: `src/components/MaterialHandlingLine.tsx` (or `BuildingEnvelope` / packing zone) to mount once
- Reuse: `matRailYellow`, `matPaintedSteel`, local red for extinguishers

**Place:**
- Fire extinguishers on 4–6 columns / wall posts near milling + packing
- E-stop stations (yellow backplate + red mushroom) at mill deck + palletizer fence gate
- One first-aid / eye-wash marker near packing cell
- 3–5 safety signs via `Nameplate` / thin planes: High Voltage, Hearing Protection, Max Capacity

Standards (ISO/OSHA color cues):
- Red = fire / emergency stop
- Yellow/black = physical hazard
- Blue = mandatory PPE
- Green = first aid / safe condition

- [ ] **Step 1:** Build small reusable `FireExtinguisher`, `EStopStation`, `SafetySign` components in `SafetyProps.tsx`
- [ ] **Step 2:** Instance / map positions from layout constants (do not hardcode random world coords in many files)
- [ ] **Step 3:** Mount under plant group; gate with visibility layer if useful
- [ ] **Step 4:** Perf check — if draw calls jump >80, merge sign materials / reduce props
- [ ] **Step 5: Commit** `feat(factory): safety props and compliance signage`

**Acceptance:** Safety gear visible without cluttering process machines.

---

### Task A3: Piping flanges, hangers, cable trays

**Files:**
- Modify: `src/components/factory/ProcessPiping.tsx`
- Modify: `src/components/factory/Electrical.tsx`
- Modify: `src/components/factory/PlantStructure.tsx` (supports only if needed)

**Rules:**
- Flange bolts only when duct `radius >= 0.08`
- Max ~4 bolts per flange; skip decorative tiny lines
- Cable trays: perforated look via simple box + hole pattern OR striped darker top — keep low poly
- Hangers densify on long horizontal spans only

- [ ] **Step 1:** Upgrade `SquareFlange` with gasket disk + 4 hex bolts (reuse roller-mill bolt pattern)
- [ ] **Step 2:** Add `CableTray` runs along milling mezzanine and packing wall (1–2 runs, not everywhere)
- [ ] **Step 3:** Add hangers on longest process duct spans
- [ ] **Step 4:** Draw-call gate — if +150 calls, cut bolts on medium ducts
- [ ] **Step 5: Commit** `feat(infra): flange bolts, hangers, and cable trays`

**Acceptance:** Main ducts look engineered; overview still clean.

---

### Task A4: Environmental wear

**Files:**
- Create: `src/components/factory/EnvironmentalWear.tsx`
- Mount from `MaterialHandlingLine.tsx` or `App.tsx` inside plant group

**Include (subtle only):**
- Oil stains under motors / gearboxes (roller mill, packing, palletizer drive) — dark transparent planes, opacity ≤ 0.35
- Concrete wear patches near forklift path
- Thin tire mark strips in warehouse aisle
- Optional light dust tint planes on high ledges (or darker painted variant — no procedural dirt shader)

- [ ] **Step 1:** Implement wear kit with shared local materials
- [ ] **Step 2:** Place 3–6 oil stains, 1–2 tire strips, 2–3 wear patches
- [ ] **Step 3:** Confirm not muddy / over-stained in overview
- [ ] **Step 4: Commit** `feat(env): subtle oil stains and floor wear`

**Acceptance:** Plant feels maintained/used, not dirty for dirty’s sake.

---

### Task A5: Equipment IDs & nameplates plant-wide

**Files:**
- Reuse: `src/components/machineParts/Nameplate.tsx`
- Modify: zone hero machines (Silo, Roller Mill, Plansifter, Packing, Palletizer, Warehouse)

**IDs (examples):**
- `SILO-01`, `RM-01`, `PS-01`, `PACK-01`, `PAL-01`, `WH-01`

- [ ] **Step 1:** Ensure Nameplate API supports title + subtitle + size
- [ ] **Step 2:** Add plates to zone heroes only (not every small valve)
- [ ] **Step 3:** Add warning label on palletizer fence + mill deck
- [ ] **Step 4: Commit** `feat(decals): equipment IDs on zone hero machines`

**Phase A exit:** Fill baseline row “After Phase A”; FPS ≥ 45.

---

# PHASE B — Motion, particles & equipment depth

**Exit criteria:** Running plant feels alive (belts, fans, dust, material in sight glasses) and key machines pass a close-up detail review. Particle budget stays LOD-gated.

---

### Task B1: Mechanical animation kit

**Files:**
- Create: `src/components/machineParts/BeltScroll.tsx` (or hook `useBeltScroll`)
- Create: `src/components/machineParts/FanSpin.tsx`
- Create: `src/components/machineParts/PneumaticActuator.tsx`
- Modify: `bagconveyr.tsx`, `ScrewConveyor.tsx`, motors on purifier/scourer, `CheckWeigher.tsx`, `Palletizer.tsx`

**Behaviors:**
- Belt: UV `map.offset.x` scroll when `lineActive` / twin running
- End rollers: rotate in sync with belt speed
- Motor cooling fans: continuous slow spin when running
- Pneumatics: reject arm / gripper jaw with ease-out (air damping), not linear

- [ ] **Step 1:** Extract shared hooks; gate all `useFrame` work with `active` boolean
- [ ] **Step 2:** Wire bag conveyor + one screw + one fan as proofs
- [ ] **Step 3:** Wire check-weigher reject + palletizer jaw
- [ ] **Step 4:** Confirm inactive machines freeze (no wasted frames)
- [ ] **Step 5: Commit** `feat(anim): belt, fan, and pneumatic motion kit`

---

### Task B2: Unified flour dust & vapor

**Files:**
- Create: `src/components/effects/FlourDust.tsx`
- Create: `src/components/factory/Atmosphere.tsx` (optional parent)
- Modify: machines currently using ad-hoc `Sparkles` — prefer shared component
- Respect: `MachineLOD` / camera distance; disable when far

**Budget (hard caps):**
| Zone | Max particles | When |
|------|---------------|------|
| Roller mill | 40 | Near only |
| Plansifter / purifier | 30 each | Near only |
| Packing | 40 | Near only |
| Dampener vapor | 25 | Near only |
| Overview | 0–20 plant haze max | Optional |

- [ ] **Step 1:** Implement `FlourDust` with count/scale/color props + `enabled` from LOD
- [ ] **Step 2:** Replace loudest per-machine Sparkles clusters with shared component
- [ ] **Step 3:** Add subtle vapor tint near dampener (cool white/blue, slow)
- [ ] **Step 4:** Measure FPS overview vs milling close; cut counts if <45 overview
- [ ] **Step 5: Commit** `feat(fx): LOD-gated flour dust and dampener vapor`

---

### Task B3: Sight-glass / chute material flow

**Files:**
- Create: `src/components/effects/SightGlassFlow.tsx`
- Modify: dampener, roller mill feed, packing inlet (transparent windows only)

- [ ] **Step 1:** Animated instanced dots or scrolling alpha strip inside transparent box
- [ ] **Step 2:** Color by product (wheat gold / flour white)
- [ ] **Step 3:** Disable when machine stopped
- [ ] **Step 4: Commit** `feat(fx): sight-glass material flow`

---

### Task B4: Equipment-specific detail pass

Work **one family at a time**. Do not redesign whole machines — add missing industrial cues.

#### B4.1 Silos & bins (`Silo.tsx`, `flourBin.tsx`, `conditoningbin.tsx`)

- [ ] Vertical stiffener ribs + horizontal rings (box/torus low poly)
- [ ] Access ladder + safety cage on primary silo only
- [ ] Top vent filter + level sensor stubs
- [ ] Commit: `feat(silo): ribs, ladder cage, vent and level sensors`

#### B4.2 Conveyors & elevators (`bagconveyr.tsx`, `bucketElivter.tsx`, `ScrewConveyor.tsx`)

- [ ] Belt cleaner/scraper at discharge end
- [ ] Bucket wear lips + belt thickness read
- [ ] Commit: `feat(convey): scrapers and bucket belt detail`

#### B4.3 Milling & cleaning (`rollermill.tsx`, `plansifter.tsx`, `purifier.tsx`, `scourer.tsx`)

- [ ] Roller mill: corrugated roller normal-map or fine cylinder grooves if doors open; grease nipples on bearings
- [ ] Plansifter: rubber bushings on suspension rod mounts
- [ ] Control panels: recessed HMI plane + physical buttons (reuse/extend `ControlBox`)
- [ ] Commit per machine family

#### B4.4 Packing cell (`packingMachine.tsx`, `BagSewingMachine.tsx`, `CheckWeigher.tsx`, `MetalDetector.tsx`, `Palletizer.tsx`)

- [ ] HMI depth, status beacon colors (green/yellow/red from twin status)
- [ ] Palletizer cell: clearer hazard strip + gate E-stop (if not from A2)
- [ ] Commit: `feat(packing): HMI depth and status beacons`

**Acceptance:** Close-ups of silo, mill, packing pass “would a mill engineer recognize this?” sniff test.

---

### Task B5: Interactive inspection doors & hover

**Files:**
- Create: `src/components/machineParts/InspectionDoor.tsx`
- Modify: `rollermill.tsx`, `scourer.tsx` (1–2 doors first)
- Modify: `SelectableMachine.tsx` or local pointer handlers

- [ ] **Step 1:** Click toggles door rotation (hinge) with short tween
- [ ] **Step 2:** Hover emissive outline on interactive meshes only (not whole plant)
- [ ] **Step 3:** Reveal simple internal cue (roller stub / rotor) — low poly
- [ ] **Step 4:** Ensure click does not fight camera orbit (stopPropagation)
- [ ] **Step 5: Commit** `feat(interact): inspection doors and hover highlight`

---

### Task B6: Instancing for repeating parts

**Files:**
- Modify: `PlantStructure.tsx`, `Palletizer.tsx` fence, bolt helpers
- Prefer: `<Instances>` / `<InstancedMesh>` from drei

Targets:
- Fence panels
- Bolt heads on flanges (if still many)
- Pallet rack uprights in warehouse

- [ ] **Step 1:** Instance fence panels in palletizer cell
- [ ] **Step 2:** Instance warehouse uprights if draw calls high
- [ ] **Step 3:** Record draw-call delta in baseline
- [ ] **Step 4: Commit** `perf(instance): fence and repeating structural parts`

**Phase B exit:** Baseline row “After Phase B”; overview FPS ≥ 45; milling close still usable.

---

# PHASE C — Digital twin immersion

**Exit criteria:** Scene looks camera-graded, sounds spatial (if audio enabled), tags can be live, and advanced nav tools work without breaking shell UX.

---

### Task C1: Post-processing stack

**Files:**
- Modify: `package.json` (add `@react-three/postprocessing` only when starting this task)
- Modify: `src/App.tsx`
- Theme tokens: bloom intensity / exposure if needed

```tsx
// Target stack — keep subtle
<EffectComposer multisampling={0}>
  <SMAA />
  <Bloom intensity={0.12} luminanceThreshold={0.88} mipmapBlur />
  <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
</EffectComposer>
```

**Rules:**
- Bloom barely visible (LEDs / HMI only)
- If FPS drops >8, remove Bloom first, then entire composer
- No heavy DOF in overview; optional DOF only in a future “detail focus” mode

- [ ] **Step 1:** Install deps
- [ ] **Step 2:** Add composer behind a `enablePostFx` flag (theme or URL query)
- [ ] **Step 3:** Tune until overview still ≥ 45
- [ ] **Step 4: Commit** `feat(render): optional SMAA bloom and ACES tone mapping`

---

### Task C2: Atmospheric fog

**Files:**
- Modify: `App.tsx` or `Atmosphere.tsx`
- Use Three.js fog or drei `<Fog />` — **very** light density

- [ ] **Step 1:** Add fog color matching clearColor / concrete
- [ ] **Step 2:** Density low enough that far warehouse softens, not vanishes
- [ ] **Step 3:** Verify day/night theme tokens still work
- [ ] **Step 4: Commit** `feat(render): light industrial atmospheric fog`

---

### Task C3: Floating 3D data callouts (optional)

**Note:** Shell `RightInspector` already shows tags/KPIs. Only add 3D panels if product requires in-scene SCADA look.

**Files:**
- Create: `src/twin/FloatingMachinePanel.tsx`
- Anchor to Roller Mill + Palletizer first
- Sync with `useTwinState` tags; status colors from `theme/tokens/status.ts`

- [ ] **Step 1:** Billboard HTML/`<Html>` panel with RPM / temp / load
- [ ] **Step 2:** Show only when machine selected or “callouts” layer on
- [ ] **Step 3:** Do not duplicate entire inspector
- [ ] **Step 4: Commit** `feat(twin): optional floating machine data callouts`

---

### Task C4: Spatial audio

**Files:**
- Create: `src/audio/PlantAudio.tsx`
- Create: `public/audio/` (ambient hum, mill whine, palletizer clack — CC0)
- Use drei `PositionalAudio` or Howler positional

**Layers:**
1. Ambient ventilation loop (listener-level, low volume)
2. Positional machine loops (mill, elevator, packing) — distance attenuated
3. Alert one-shots on fault / E-stop from twin events

- [ ] **Step 1:** User-gesture unlock (browser autoplay policy) via shell button
- [ ] **Step 2:** Ambient + 2 positional proofs
- [ ] **Step 3:** Mute toggle in shell; default muted
- [ ] **Step 4: Commit** `feat(audio): spatial plant ambience and machine loops`

---

### Task C5: Live PLC / MQTT bridge

**Files:**
- Create: `src/twin/live/MqttBridge.ts` (or WebSocket)
- Modify: `useTwinState.ts` to accept live overrides
- Keep `simulate.ts` as fallback / demo mode

- [ ] **Step 1:** Define tag schema parity with `twin/tags.ts`
- [ ] **Step 2:** Bridge maps payload → store; reconnect + backoff
- [ ] **Step 3:** Shell toggle Demo vs Live
- [ ] **Step 4:** Drive status beacons + animations from live running bits
- [ ] **Step 5: Commit** `feat(twin): MQTT/WebSocket live tag bridge`

---

### Task C6: Advanced navigation tools

**Files:**
- Create: `src/navigation/MeasureTool.tsx`
- Create: `src/navigation/XRayMode.tsx` (opacity / material swap on casings)
- Modify: `LeftTools.tsx` / shell services

- [ ] **Step 1:** Measure — click two points, show distance label (meters)
- [ ] **Step 2:** X-ray — selected machine casing opacity 0.25; internals visible
- [ ] **Step 3:** Exploded — optional later; do not block on it
- [ ] **Step 4: Commit** `feat(nav): measure tool and x-ray casing mode`

---

### Task C7: Final performance validation

**Files:**
- Update: `docs/superpowers/plans/visual-realism-baseline.md`

Capture overview / milling close / packing close / orbit drag:

| Metric | Target | If miss |
|--------|--------|---------|
| FPS | ≥ 55 preferred, ≥ 45 hard | Drop Bloom, dust counts, DPR |
| Draw calls | < 600 ideal | Instance more; fewer bolts |
| Triangles | < 1.5M | Soften far LOD; no bevels |
| Textures | ≤ 2K | Compress / drop unused maps |

- [ ] **Step 1:** Fill final baseline table
- [ ] **Step 2:** List only opts justified by failing metrics
- [ ] **Step 3: Commit** `docs: record realism enhancement final performance baseline`

---

## 4. Materials & lighting reference (canonical — do not reinvent)

### PBR targets (already in `createPlantMaterials.ts`)

| Surface | Metalness | Roughness | Notes |
|---------|-----------|-----------|-------|
| Stainless / steel | ~0.7–0.85 | ~0.3–0.4 | Reflective, not mirror |
| Painted steel | ~0.08–0.2 | ~0.5–0.7 | Most frames |
| Rubber | ~0.02 | ~0.9 | Belts, wheels |
| Concrete | ~0.02 | ~0.95 | Floor |

### Lighting (current + polish)

| Element | Status | Next action |
|---------|--------|-------------|
| HDRI `public/hdri/factory.hdr` | Done | Keep intensity theme-driven |
| Contact shadows | Done | Keep `frames={1}` |
| SoftShadows / dynamic lights | Out | Do not enable `Canvas shadows` |
| Area / spot accents | Optional | Only if perf allows; prefer emissive fixtures in envelope |
| Bloom / ACES / fog | Phase C | Subtle only |

---

## 5. Standards checklist (real-world grounding)

- [ ] Yellow/black hazard contrast on guards and palletizer cell
- [ ] Red for fire + E-stop only (do not overuse)
- [ ] Blue mandatory PPE signs at milling entry
- [ ] Green first-aid marker once per major hall
- [ ] Maintenance clearance ~1 m in front of control panels (do not flush cabinets to walls)
- [ ] Reference photos: Bühler / Ocrim / Satake mills for cable routing, guard bolts, industrial gray/yellow

---

## 6. Suggested execution order (calendar)

| Week | Focus | Tasks |
|------|-------|-------|
| 1 | Quick wins | A1, A2, A5 |
| 2 | Infra + wear | A3, A4 + baseline |
| 3 | Motion + dust | B1, B2 |
| 4 | Flow + equipment | B3, B4.1–B4.2 |
| 5 | Detail + interact | B4.3–B4.4, B5, B6 |
| 6 | Render polish | C1, C2, C7 partial |
| 7+ | Twin immersion | C3–C6 as product priority |

Skip or reorder C3–C6 based on whether the demo is **visual** vs **live-data** first.

---

## 7. Definition of done (whole initiative)

1. Phase A–B complete with checkboxes marked and baseline FPS rows filled  
2. Style guide still canonical — no rogue materials  
3. Overview FPS ≥ 45; preferred ≥ 55 on target hardware  
4. Packing cell hazard zone + safety props visible  
5. Dust/particles LOD-gated (near-zero cost in overview)  
6. Optional Phase C features behind flags (post-FX, audio, live bridge)  
7. README or roadmap links to this plan as the active realism track  

---

## 8. Out of scope (until explicitly requested)

| Item | Why |
|------|-----|
| 4K textures / triplanar dirt shaders | VRAM / complexity |
| Full GI / lightmaps bake pipeline | Tooling heavy for web demo |
| Dynamic shadow maps | Known FPS killer in this scene |
| Photogrammetry asset import | Different pipeline |
| Full SCADA historian / trends backend | Shell charts can stay simulated |
| Rewriting all machine geometry from scratch | Style-copy, don’t redesign |

---

## 9. Progress log

| Date | Milestone | Notes |
|------|-----------|-------|
| 2026-07-23 | Visual realism Sprints 1–5 | Materials, HDRI, floor, style guide plant-wide |
| 2026-07-24 | Operator shell + Sentinel theme | HUD / twin UX baseline |
| 2026-07-29 | This plan authored | Phase A is next executable work |
| 2026-07-29 | Phase A complete (A1–A5) | Floor markings, safety props, flange/duct detail, wear kit, equipment IDs |
| 2026-07-29 | Phase B complete (B1–B6) | Animation kit, LOD dust/vapor, sight-glass flow, detail pass, shared inspection doors, fence instancing |
| 2026-07-29 | Phase C complete (C1–C7) | Flagged post-FX, fog, callouts, audio scaffold, live WS bridge, measure/X-ray, build verified |

Update this table as milestones complete.

---

## 10. Self-review

| Check | Result |
|-------|--------|
| Continues from existing Sprint 1–5 (no redo) | Yes |
| Maps all 11 guide sections to concrete tasks | Yes |
| File paths match this repo | Yes |
| Perf constraints explicit | Yes |
| Checkboxes for agent execution | Yes |
| Placeholder / TBD free | Yes — deferred items listed with rationale |
| Product priority fork for Phase C | Documented |

---

*End of plan. Start execution at **Task A1** unless product priority shifts to live data (then C5) or post-FX demo (then C1 after A1–A2).*
