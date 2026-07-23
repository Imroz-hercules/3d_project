# Flour Mill Digital Twin — Full Phase Working Guide

> **Principle:** Build **inside-out**.  
> Process → utilities → structure → building → live data.  
> Do **not** rush the building shell until process flow and machine connections are complete.

---

## How to use this guide

1. Work **one stage at a time** (Stage 1 → Stage 5).
2. Inside each stage, finish phases in order unless a note says otherwise.
3. Check boxes as you complete items: `- [ ]` → `- [x]`.
4. Keep machine positions in `layoutConstants.ts` — never hardcode world coords in random files.
5. After each phase, verify in the browser: **alignment, no floating gaps, camera still frames the plant**.

### Key project files

| Area | File(s) |
|------|---------|
| Plant assembly | `src/components/MaterialHandlingLine.tsx` |
| Layout / positions | `src/components/layoutConstants.ts` |
| Structure primitives | `src/components/factory/PlantStructure.tsx` |
| Material animation | `src/components/MaterialFlow.tsx` |
| Scene / ground / camera | `src/App.tsx` |
| Machines | `src/components/*.tsx` (Silo, packing, palletizer, etc.) |

---

## Current plant status (baseline)

### Process machines — DONE

```text
Grain Silo
  → Hopper → Rotary Valve → Screw → Bucket Elevator
  → Vibro Separator → Destoner → Magnetic Separator → Scourer → Dampener
  → Conditioning Bin
  → Roller Mill → Plansifter → Purifier → Bran Finisher
  → Flour Bins A/B/C
  → Packing Machine → Bag Conveyor → Bag Sewing
  → Check Weigher → Metal Detector → Robotic Palletizer
```

### Already started (partial)

- [x] Many `RoundDuct` process connections in `MaterialHandlingLine.tsx`
- [x] Some mezzanines / walkways / ladders via `PlantStructure.tsx`
- [x] Basic `MaterialFlow` path animation
- [x] Packing cell continuous along +X (sewing → check → metal → palletizer)
- [x] Palletizer cell: robot, fence, magazine, wrapped pallet, forklift bay

### Still open (this roadmap)

- Dust collection system
- Complete steel / platforms / walkways plant-wide
- Electrical (MCC, cable trays)
- Building envelope (walls, roof, docks)
- True digital-twin SCADA (click → PLC tags, alarms, trends)

---

## Recommended development order (master stages)

| Stage | Focus | Phases |
|------:|-------|--------|
| **1** | Finish the process end | Phase notes below + warehouse staging |
| **2** | Connect the plant | 1, 7, 8, 13 (connections + dust + pneumatics + flow) |
| **3** | Infrastructure | 2, 3, 4, 5, 6, 9 |
| **4** | Building | 10, 11, 14, 15, 16 |
| **5** | Digital twin features | 12, 17 |

---

# STAGE 1 — Finish the process

Goal: packing → warehouse handoff feels complete. Machines stay movable.

## Stage 1 checklist

- [x] Robotic palletizer integrated after metal detector
- [x] Empty pallet magazine
- [x] Active stacking pallet
- [x] Stretch-wrapped finished pallet
- [x] Forklift loading bay (static)
- [ ] Pallet conveyor animation (full pallet moves to bay)
- [ ] Warehouse staging racks (2–4 finished pallet positions)
- [ ] Optional: stretch-wrapper machine stub between outfeed and bay

### Working steps

1. Extend `Palletizer.tsx` (or a small `WarehouseStaging.tsx`) with 2–3 rack bays along +X past the forklift zone.
2. Add `warehouseStagingPosition()` in `layoutConstants.ts`.
3. Include staging in `plantBounds()` so the ground apron still covers it.
4. Animate completed pallet sliding along `PalletOutfeedConveyor` when `palletComplete` flips true.
5. Do **not** add warehouse walls yet.

**Exit criteria:** Visitor understands how a bag leaves the metal detector and becomes a forklift-ready pallet.

---

# STAGE 2 — Connect the plant ⭐

Goal: no floating machines. Every product path has a duct, chute, or conveyor.

## Phase 1 — Connect every machine ⭐⭐⭐⭐⭐

### Intent

```text
BEFORE                          AFTER
Silo                            Silo
        Hopper                    │
                Destoner          ▼
                       Mill     Hopper → Valve → Screw → Elevator → …
```

### Audit method

1. Walk the flow path in `MaterialHandlingLine.tsx` (`flowPath` array).
2. For each consecutive pair of machines, ask: **Is there a visible connector?**
3. Mark gaps in the table below and fix them.

### Connection types

| Type | When to use | Implement as |
|------|-------------|--------------|
| Round duct / pipe | Enclosed product transfer | `RoundDuct` / new `PneumaticPipe` |
| Gravity chute | Short drop, open or enclosed | Angled box / tapered mesh |
| Screw / belt conveyor | Horizontal transfer | Existing screw / bag conveyor pattern |
| Bucket elevator | Vertical lift | Existing elevator |

### Process connection checklist

**Raw → Cleaning**

- [x] Silo → Hopper (duct present — verify flanges mate)
- [x] Hopper → Rotary valve
- [x] Valve → Screw inlet
- [x] Screw → Elevator boot
- [x] Elevator head → Vibro separator inlet

**Cleaning → Conditioning**

- [x] Vibro → Destoner
- [x] Destoner → Magnetic separator
- [x] Magnet → Scourer
- [x] Scourer → Dampener
- [x] Dampener → Conditioning bin

**Milling**

- [x] Conditioning bin → Roller mill (cross-aisle duct)
- [x] Roller mill → Plansifter
- [x] Plansifter flour → Flour bin header
- [x] Plansifter semolina → Purifier
- [x] Purifier bran → Bran finisher
- [x] Bran finisher recovered flour → Flour bins

**Packing cell**

- [x] Flour Bin A → Packing (duct)
- [x] Packing takeaway → Bag conveyor (no air gap)
- [x] Bag conveyor → Sewing belt
- [x] Sewing → Check weigher
- [x] Check weigher → Metal detector
- [x] Metal detector → Palletizer pick conveyor

### Working rules

1. Always derive endpoints from `*InletWorldPos()` / `*OutletWorldPos()` in `layoutConstants.ts`.
2. Prefer elbowed paths (H → V → H) over diagonal “laser” ducts.
3. Match duct diameter to product: wheat ~0.18–0.22 m, flour ~0.12–0.14 m, dust ~0.2–0.3 m.
4. Add flanges at both ends (`SquareFlange` pattern already in line file).

**Exit criteria:** Screenshot from overview shows a continuous mechanical path with no unexplained gaps.

---

## Phase 7 — Dust collection ⭐⭐⭐⭐⭐

Build this in Stage 2 (with connections), not after the building.

### Concept

```text
Vibro / Destoner / Scourer / Purifier / Packing
        │         │          │         │
        └──── Dust Header ───┴─────────┘
                    │
                    ▼
              Bag Filter + Fan
```

### Build list

- [ ] Create `src/components/DustCollection.tsx` (or `factory/DustSystem.tsx`)
- [ ] Horizontal dust header along cleaning aisle (+Z)
- [ ] Branch takeoffs to: vibro, destoner, scourer, purifier, packing hood
- [ ] Vertical riser to bag filter
- [ ] Bag filter house (tall rectangular housing)
- [ ] Centrifugal fan `(O)` at filter outlet
- [ ] Clean-air exhaust stack
- [ ] Layout helpers: `dustHeaderPosition()`, `bagFilterPosition()`

### Working steps

1. Place bag filter at end of cleaning aisle or beside packing (keep clear of milling decks).
2. Header runs parallel to machines at ~3–4 m height.
3. Use darker steel color than product ducts so dust lines read as utilities.
4. Optional later: faint dust particles near takeoffs (Phase 13).

**Exit criteria:** Cleaning machines visually “breathe” into one shared dust system.

---

## Phase 8 — Pneumatic pipes (flour)

### Intent

Flour travels in closed pipes with elbows, tees, reducers, supports.

### Build list

- [ ] `PneumaticElbow` (90° / 45°)
- [ ] `PneumaticTee`
- [ ] `PipeSupport` / hangers from beams
- [ ] Replace long straight flour ducts with segmented runs + elbows where needed
- [ ] Flour bin fill header already exists — refine with reducers to each bin

### Working steps

1. Refactor long `RoundDuct` flour runs into a small pipe kit.
2. Keep API: `{ start, end, radius }` or `{ path: V3[] }`.
3. Supports every 2–3 m on long spans.

**Exit criteria:** Flour routes look engineered, not like single stretched cylinders.

---

## Phase 13 — Material animation ⭐⭐⭐⭐⭐

Do a first pass in Stage 2; refine in Stage 5.

### Build list

- [ ] Wheat flow (brown particles) on raw/cleaning path
- [ ] Flour flow (white/cream) on milling → bins → packing
- [ ] Dust motes near dust takeoffs (subtle)
- [ ] Conveyor belt UV scroll / roller spin where missing
- [ ] Gate / valve rotation synced to `lineActive`

### Working steps

1. Extend `MaterialFlow.tsx` to accept `color` / `kind: 'wheat' | 'flour' | 'dust'`.
2. Split `flowPath` into segments (cleaning vs milling vs packing) with different colors.
3. Only animate when `lineActive === true`.
4. Keep particle counts low for performance.

**Exit criteria:** Turning the line on/off clearly starts/stops visible product movement.

---

# STAGE 3 — Build the infrastructure

Goal: operators could “walk” the plant. Machines sit on real structure.

## Phase 2 — Steel structure

### Build

- [ ] Columns under elevated machines (mill deck, upper gallery)
- [ ] Primary beams
- [ ] Cross bracing (X or K bracing on tall frames)
- [ ] Base plates / anchor visuals

### Working steps

1. Extend `PlantStructure.tsx` with `SteelColumn`, `SteelBeam`, `BraceX`.
2. Drive positions from deck Y values in `REF.zones.milling`.
3. Reuse colors already in `PlantStructure` (`steel`, `deck`, `rail`).

**Exit criteria:** Elevated machines never look like they float.

---

## Phase 3 — Platforms

### Build per access point

- [ ] Checker-plate / grated deck
- [ ] Toe plate (kick plate)
- [ ] Handrail (Phase 6 can share component)

### Priority platforms

- [ ] Destoner / cleaning mezzanine (partially exists)
- [ ] Roller mill service platform
- [ ] Plansifter / purifier upper gallery
- [ ] Packing machine operator side
- [ ] Palletizer HMI outside fence (already near cell)

---

## Phase 4 — Ladders

### Priority ladders

- [ ] Flour bins A/B/C
- [ ] Conditioning bin
- [ ] Plansifter gallery
- [ ] Bag filter (when built)
- [ ] Silo (if not present)

Use existing `AccessLadder` from `PlantStructure.tsx`; standardize height/width.

---

## Phase 5 — Walkways

### Build

- [ ] Cleaning aisle walkway linking machines
- [ ] Cross-aisle bridge conditioning → milling
- [ ] Packing cell side walkway (operator route, outside robot fence)

### Working steps

1. Prefer `Walkway` primitive; avoid unique one-off meshes.
2. Keep clearances: robot cell fence stays exclusive — walkways outside.

---

## Phase 6 — Handrails

### Rule

Every platform edge and walkway open side gets:

```text
top rail → mid rail → toe plate
```

- [ ] Audit all `SteelPlatform` / `Walkway` / `MezzanineBay` for missing rails
- [ ] Yellow safety rail where plant already uses `#e0a92c`

---

## Phase 9 — Electrical

### Build

- [ ] MCC lineup (large multi-panel row) near packing or cleaning electrical room zone
- [ ] PLC cabinet (smaller, near MCC or control room stub)
- [ ] Local control panel at major machines (packing, mill, elevator, palletizer)
- [ ] Overhead cable tray spine along both aisles
- [ ] Drops from tray to each machine

### Suggested file

`src/components/factory/Electrical.tsx`

### Working steps

1. Cable tray height above walkways (~3.5–4.5 m).
2. Color trays lighter than process steel.
3. Local panels: small dark box + e-stop + HMI stub (many machines already have HMI — unify style).

**Exit criteria:** Plant “reads” as powered and controlled, not just mechanical.

---

# STAGE 4 — Building envelope & logistics

Goal: machines sit *inside* a factory, not on an infinite grid.

## Phase 10 — Lighting

- [ ] Row of industrial high-bay lights along aisles
- [ ] Soft fill under mezzanines
- [ ] Slight warmer light in packing cell
- [ ] Optional: emissive fixtures that pulse with `lineActive`

Keep real-time lights few; bake atmosphere with emissive meshes where possible.

---

## Phase 11 — Safety

- [ ] Fire extinguishers on columns (simple red cylinder + hose stub)
- [ ] Extra e-stops at aisle ends
- [ ] Floor marking: pedestrian vs forklift lanes
- [ ] Warning signs on robot cell / mill decks (use `Text` or textured planes — avoid emoji in 3D)
- [ ] Keep palletizer fence + interlock (already started)

---

## Phase 14 — Forklift animation

- [ ] Path: warehouse staging → palletizer bay → truck dock
- [ ] States: drive → fork down → lift → reverse → dock
- [ ] Sync with pallet-complete events later (Stage 5)

Start with a looped demo path; wire to events later.

---

## Phase 15 — Warehouse

- [ ] Pallet racking (2 aisles × N bays)
- [ ] Floor lane markings
- [ ] Staging positions for wrapped pallets
- [ ] Optional stretch-film / label station stub

Place warehouse on +X beyond palletizer forklift zone (same packing centreline).

---

## Phase 16 — Building ⭐

**Do this last in Stage 4.**

### Build

- [ ] Structural columns / roof trusses
- [ ] Exterior walls (with cutouts for docks)
- [ ] Roof panels + skylights
- [ ] Windows / translucent wall strips
- [ ] Rolling shutter doors
- [ ] Loading docks + dock levelers
- [ ] Interior partition for “MCC room” / “office stub” (optional)

### Working steps

1. Create `src/components/factory/BuildingEnvelope.tsx`.
2. Size envelope from `plantBounds()` + margin (do not hardcode once).
3. Keep walls slightly translucent or use cutaway mode for debugging.
4. Add a `showBuilding` toggle in App so process work stays easy.

**Exit criteria:** Overview shot looks like a flour mill hall, not models on a grid.

---

# STAGE 5 — Make it a digital twin ⭐⭐⭐⭐⭐

Goal: click a machine → live status. Data drives animation.

## Phase 12 — Sensors

Attach logical sensors (even if simulated) to each asset.

### Examples

| Machine | Tags |
|---------|------|
| Silo | `HL`, `ML`, `LL`, `weight_t` |
| Elevator | `running`, `rpm`, `amp` |
| Roller mill | `rpm`, `load_%`, `temp_C`, `amp` |
| Packing | `bag_count`, `target_kg`, `cycle_s` |
| Check weigher | `actual_kg`, `accept`, `reject` |
| Metal detector | `metal_detect`, `reject_count` |
| Palletizer | `layer`, `bag_on_pallet`, `pallet_no`, `mode` |

### Working steps

1. Create `src/twin/tags.ts` — tag name → simulated value.
2. Create `src/twin/simulate.ts` — updates tags when line is active.
3. Machine panels read from tags, not only local `useState`.

---

## Phase 17 — SCADA / digital twin features

### Interaction

- [ ] Click machine → highlight outline / emissive pulse
- [ ] Side panel or world `DataPanel` shows live tags
- [ ] Alarm banner when any `Alarm !== OFF`
- [ ] Maintenance badge (hours run / next service)
- [ ] Optional simple trend sparkline (canvas or SVG overlay)

### Architecture sketch

```text
simulate.ts  →  tag store  →  React UI overlay
                    ↓
              MaterialHandlingLine / machines (read running, speed, open/close)
```

### Working steps

1. Add HTML overlay in `App.tsx` (or a `TwinHud.tsx`) for selected machine.
2. Raycast / invisible click meshes already exist on many machines — standardize `onSelect(machineId)`.
3. Drive `lineActive`, motor speeds, reject arms, robot phase from tags when ready.
4. Keep a **Demo mode** that simulates everything without a real PLC.
5. Later: swap simulate layer for MQTT / OPC-UA / REST.

**Exit criteria:** A visitor can click roller mill, packing, and palletizer and see different live values update while the line runs.

---

# Phase summary map (1–17)

| # | Phase | Stage | Priority | Status guide |
|--:|-------|------:|----------|--------------|
| 1 | Connect every machine | 2 | Critical | Sprint 1 done (elbows/flanges/supports/bridges) |
| 2 | Steel structure | 3 | High | Partial |
| 3 | Platforms | 3 | High | Partial |
| 4 | Ladders | 3 | Medium | Partial |
| 5 | Walkways | 3 | High | Partial |
| 6 | Handrails | 3 | Medium | Partial |
| 7 | Dust collection | 2 | Critical | Not started |
| 8 | Pneumatic pipes | 2 | High | Partial (ducts) |
| 9 | Electrical | 3 | Medium | Not started |
| 10 | Lighting | 4 | Medium | Not started |
| 11 | Safety props | 4 | Medium | Partial (robot cell) |
| 12 | Sensors / tags | 5 | High | Not started |
| 13 | Material animation | 2→5 | Critical | Basic flow only |
| 14 | Forklift animation | 4 | Medium | Static forklift |
| 15 | Warehouse | 4 | Medium | Not started |
| 16 | Building envelope | 4 | High (later) | Not started |
| 17 | SCADA / twin UX | 5 | Critical | Not started |

---

# Working conventions (keep the project sane)

### Layout

- All world positions live in `layoutConstants.ts`.
- Packing cell runs along **+X** away from flour bins.
- Ground / camera use `plantCenter()` + `plantGroundRadius()` in `App.tsx`.

### Components

- Shared structure → `factory/PlantStructure.tsx`
- Line assembly only in `MaterialHandlingLine.tsx`
- Machine-specific animation stays inside the machine file
- Line integration props: `active`, `showDataPanel={false}`, `showClickText={false}`

### Visual language

| Element | Cue |
|---------|-----|
| Process steel | Cool gray `#4a555c` family |
| Safety | `#e0a92c` rails / stripes |
| Stainless food contact | `#d4d8dc` |
| Dust utilities | Darker / distinct from product ducts |
| Robot | Orange accent (palletizer) |

### Definition of done (any phase)

1. Compiles (`tsc --noEmit`)
2. No new floating gaps in that area
3. Overview camera still frames plant
4. Checklist in this file updated

---

# Suggested next sprint (concrete)

**Sprint A — Connection audit (Phase 1)**  
Walk packing cell + milling flour header; close any visible air gaps.

**Sprint B — Dust system (Phase 7)**  
Bag filter + header + 4–5 takeoffs.

**Sprint C — Animation pass (Phase 13)**  
Wheat vs flour particle colors on split paths.

**Sprint D — Electrical spine (Phase 9)**  
MCC + cable tray over packing and cleaning.

Only after A–D feel solid: warehouse → building → SCADA.

---

# Final reminder

> **Before:** You built the machines.  
> **Now:** You build the plant.  
> **Later:** You make it a twin.

Build inside-out. Keep the scene open and adjustable until process connections and utilities are done. Then lock positions with structure and the building envelope. Finally, bind live data so the factory *behaves*, not just *looks* complete.
