# Visual realism baseline — 2026-07-23

Fill FPS / draw calls / triangles from the DEV Stats panel after each sprint.

| Milestone | Overview FPS | Draw calls | Triangles | Notes |
|-----------|--------------|------------|-----------|-------|
| Before Sprint 1 | | | | Flat mats, ambient 1.05, grid floor |
| After Sprint 1 (architecture) | | | | Visual parity expected |
| After Sprint 2 (lighting + floor) | | | | HDRI + concrete + contact shadows |
| After Sprint 3 (infrastructure) | | | | Platforms / pipes / cabinets |
| After Sprint 4 (roller mill) | | | | Gold standard |
| After Sprint 5 (all machines) | | | | Style guide applied plant-wide |
| After Sprint 8 (polish) | | | | Final |

## Realism enhancement (2026-07-29 plan)

Fill FPS / draw calls / triangles from the DEV Stats panel (overview camera) after loading with default flags (post-FX off, audio off).

| Milestone | Overview FPS | Draw calls | Triangles | Notes |
|-----------|--------------|------------|-----------|-------|
| After Phase A | | | | Floor markings, safety props, wear decals, flange bolts (gated ≥0.2 m), equipment IDs. All static, shared materials. |
| After Phase B | | | | ScrollingBelt + spin animations, LOD-gated dust/vapor (`useCameraNear`), sight-glass flow, status beacons, shared InspectionDoor, palletizer fence instanced (~90 → 2 draws). |
| After Phase C | | | | Fog, machine callouts (selected only), spatial audio scaffold (off by default), live WS bridge (demo fallback), measure + X-ray toggles (off by default). Post-FX behind `?fx=1` — measure with fx on AND off. |

Targets: overview FPS ≥ 45 (hard floor), draw calls < 600, triangles < 1.5M, textures ≤ 2K.

Build check 2026-07-29: `vite build` clean — 796 modules, bundle 1.81 MB (512 kB gzip). `tsc -b` still fails on ~100 pre-existing errors unrelated to this initiative (tracked separately).

Cost-mitigation summary for the new work:

- Dust/vapor emitters render only when camera is within their LOD radius; near-zero cost at overview.
- Sight-glass flow uses one instanced mesh per glass and is LOD-gated.
- Flange bolt/gasket detail only renders for flanges ≥ 0.2 m; bolts are one merged geometry per flange.
- Post-FX (SMAA/Bloom/Vignette) and audio are opt-in via URL flag / localStorage; default cost is zero.
- X-ray and measure tools do no work while their layer toggles are off.

## Visual checklist

- [ ] Metals respond to HDRI (soft reflections)
- [ ] Scene has light/dark contrast (not flat gray)
- [ ] Floor reads as concrete (no grid)
- [ ] Pipes/tanks look stainless vs painted platforms
- [x] Roller mill shows ≥ 4 material roles
- [x] Remaining machines follow same style guide (Sprint 5)

## Sprint 4 gate

Would every future machine be acceptable if it looked like this? **YES** (user confirmed 2026-07-23)

Notes: Roller mill uses style-guide PBR (stainless covers, painted frame, blue motors, rubber handwheels/belts, yellow guards), nameplate RM-01, warning label, cover bolts, oil stain under drive.

## Sprint 5 notes

Style guide remapped across cleaning, milling, storage, conveying, packing, palletizer, warehouse. Added `matPaintOrange` for palletizer robot.

