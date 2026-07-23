# Perf baseline — 2026-07-23

Hardware: PENDING
Branch: main

> Open app with `npm run dev`; read Stats panel (top-left) after each pose settles 3s.

| Pose | FPS | Draw calls | Triangles | Notes |
|------|-----|------------|-----------|-------|
| Overview | PENDING | PENDING | PENDING | Default camera |
| Milling close | PENDING | PENDING | PENDING | Roller mill / plansifter cluster |
| Packing close | PENDING | PENDING | PENDING | Packing cell + palletizer |
| Orbit drag (min) | PENDING | PENDING | PENDING | Min FPS while dragging OrbitControls ~5s |

Hypothesis after Task 1: PENDING — update after baseline capture. Per decision gate: if draw calls ≥ 1500 → prioritize materials/merge/instances (Tasks 6–8); if FPS low but draw calls OK → shadows/useFrame/particles (Tasks 2, 5, 10); if FPS fine but camera laggy → controls tuning (Task 3).

## Shadows OFF (Task 2)

Canvas `shadows={false}`, `dpr={[1, 1.5]}`; directional light `castShadow` / shadow map disabled. Compare vs Task 1 baseline when user fills numbers.

| Pose | FPS | Draw calls | Triangles | Notes |
|------|-----|------------|-----------|-------|
| Overview | PENDING | PENDING | PENDING | Default camera |
| Milling close | PENDING | PENDING | PENDING | Roller mill / plansifter cluster |
| Packing close | PENDING | PENDING | PENDING | Packing cell + palletizer |
| Orbit drag (min) | PENDING | PENDING | PENDING | Min FPS while dragging OrbitControls ~5s |

Working decision (Task 2): shadows left OFF until Task 9 selective whitelist. Fill PENDING numbers when measuring; if FPS delta was <15 after user measures, reconsider re-enabling earlier.

## Controls feel (Task 3)

OrbitControls: `dampingFactor={0.05}`, `rotateSpeed={0.8}`, `zoomSpeed={1}`, `panSpeed={1}`.
Manual feel: PENDING — orbit/pan/zoom ~20s and note if snappier vs prior `0.08` damping.

## Scene overhead (Task 4)

- Environment HDR (`preset="city"`) removed; Sky kept
- Grid divisions capped: `min(40, max(20, round(gridSize/4)))`
- DPR remains `[1, 1.5]`

| Pose | FPS | Draw calls | Triangles | Notes |
|------|-----|------------|-----------|-------|
| Overview | PENDING | PENDING | PENDING | After Task 4 scene cuts |
