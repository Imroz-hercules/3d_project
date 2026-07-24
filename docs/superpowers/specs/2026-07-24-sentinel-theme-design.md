# Sentinel Night / Day Theme — Design Spec

**Date:** 2026-07-24  
**Status:** Approved for implementation  
**Source:** Digital Twin UI Design System (Sentinel Twin palette)

## Goal

Add a persistent **Night | Day** theme toggle to the R3F flour-mill digital twin. Dark mode uses the full Sentinel holographic palette; light mode is a true Sentinel Day counterpart (same design language, adapted surfaces/text). Machine PBR materials and semantic status colors never change with theme.

## Scope

**In:** HUD/nav overlays via CSS variables; canvas clear color; ambient / hemisphere / directional / environment intensity; exposure; fog; contact shadow opacity; ~250ms synchronized lerp; `prefers-reduced-motion` snap.

**Out:** Machine materials/geometry; Sabil ledger / full Mill-B KPI rebuild; secondary HDRI swap; bloom/SSAO/DOF; app-shell brand teal `#0098CC`.

## Architecture

```
ThemeToggle → ThemeStore → ThemeRoot (data-theme + CSS vars)
                        → ThemeSceneBridge(scene props) → scene lerp
```

Tokens split: `hud` | `scene.environment` + `scene.rendering` | `motion` | frozen `STATUS`.  
Store mirrors `navStore` (listeners + `useSyncExternalStore`).  
Theme names: `sentinel-night` | `sentinel-day`. Default: night. Persist: `localStorage` key `stwin.theme`.

## Migration

M0 tokens/store/root/toggle → M1 scene bridge → M2 TwinHud → M3 nav chrome → M4 Minimap → M5 polish/a11y.

## Bridge allowlist

May: clear, ambient, hemi, directional, env intensity, fog, exposure, contact shadows.  
Must not: materials, meshes, geometry, machine colors, status indicators.
