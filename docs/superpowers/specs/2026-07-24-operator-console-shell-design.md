# Operator Console Shell (B+ / C+ / A+) — Design Spec

**Date:** 2026-07-24  
**Status:** Approved for implementation  
**Phase:** 1 — Operator HMI shell (no Phase 2 3D polish)

## Goal

Replace scattered HUD controls with a professional industrial operator console around the existing 3D digital twin, without competing with the scene for attention.

## Scope (Phase 1)

**In**
- C+ adaptive hybrid layout (docked top + timeline; overlay left/right tools; floating minimap)
- Factory Health (ops) vs production KPI strip (complementary, not redundant)
- Left tools: Navigation (zone health dots), Visibility, Quick Actions
- Right inspector: tabs + breadcrumb; Factory Overview when nothing selected
- Timeline (all events, categorized) + Notification badge/popover + severity-based toasts
- Search → fly + highlight + open inspector
- Selection workflow: fly → right opens → left collapses → timeline stays → minimap highlights
- `src/shell/` with OperatorShell, pure UI components, shell services, adapters

**Out (Phase 2)**
- 3D status rings, floating badges, material-flow polish, exterior sky/horizon/environment
- Dedicated chrome store (deferred until multi-window / docking / workspaces)

## Information architecture (one home each)

| Concern | Home |
|---------|------|
| Navigation / zone health | LeftTools |
| Commands / camera / sim / health / KPIs | CommandBar |
| Machine or factory details | RightInspector |
| All events | TimelineDock |
| Actionable attention | NotificationCenter (badge + toast) |
| Orientation | Floating Minimap |

## Layout (C+)

- **Top bar:** always docked
- **Timeline:** always docked (full width)
- **Left:** overlay, collapsed by default, hover/expand + pin
- **Right:** overlay, opens on selection (or pin), Factory Overview when none
- **Notifications:** slim dock badge + toast flash (not a permanent dock column)
- **Minimap:** floating bottom-right over canvas
- Canvas is full-bleed between top and timeline (~80–90% attention)

## Notification routing

Shared `FactoryEvent` model feeds both timeline and notifications.

| Type | Toast | Badge | Timeline |
|------|-------|-------|----------|
| Process | no | no | yes |
| Warning | yes (auto-dismiss) | yes | yes |
| Alarm (critical) | yes (sticky until ack) | yes | yes |
| Maintenance | no | yes | yes |
| Operator action | yes | yes | yes |

## Architecture (A+)

```
OperatorShell
  → Shell Services (selection, navigation, timeline, notifications, kpi, visibility)
  → Adapters (twin tags, navStore, theme)
  → Twin / scene
```

- Components render only
- Services coordinate behavior and own event filtering / KPI derivation
- No global chrome store yet; panel pin/open state lives in OperatorShell (or a tiny module local to shell)

## Event model

```ts
interface FactoryEvent {
  id: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'alarm' | 'maintenance' | 'operator';
  category: 'process' | 'alarm' | 'maintenance' | 'operator';
  machineId?: MachineId;
  zoneId?: string;
  message: string;
  acknowledged?: boolean;
}
```

## Visibility layers

Phase 1 wires real toggles where scene already supports them (building, cutaway). Additional layers (pipes, dust, electrical, roof) may be stubbed with UI state until scene modules expose props.

## Demo data

Plant KPIs (T/H, today’s output, power, OEE) and timeline seeds are derived from / synthesized by the demo simulation until live PLC tags exist.
