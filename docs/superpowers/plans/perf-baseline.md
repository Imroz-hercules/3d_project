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
