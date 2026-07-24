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

