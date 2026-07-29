/**
 * Live PLC tag bridge — WebSocket client with demo-sim fallback.
 *
 * Endpoint resolution (first match wins):
 *   1. URL query      ?ws=ws://host:port/path   (persisted to localStorage)
 *   2. localStorage   'twin.ws'
 *   3. Vite env       VITE_TWIN_WS_URL
 * No endpoint → bridge stays idle and the demo simulator keeps running.
 *
 * Expected message shapes (JSON):
 *   { "type": "tags", "machines": { "<machineId>": { "values": {...}, "running"?: bool, "alarm"?: "OFF"|"WARN"|"ALARM" } } }
 *   { "type": "tag", "id": "<machineId>", "key": "<tagName>", "value": <number|string|boolean> }
 *   { "type": "line", "active": bool }
 *
 * While connected, demoMode is switched off (the simulator no-ops). On
 * disconnect the bridge reconnects with backoff and re-enables demo mode so
 * the twin never freezes.
 */

import { getTwinState, patchTwinState, setLineActive, setMachines } from './tags';
import type { AlarmLevel, MachineId, MachineTags } from './types';

interface TagsMessage {
  type: 'tags';
  machines: Partial<
    Record<MachineId, { values?: MachineTags['values']; running?: boolean; alarm?: AlarmLevel }>
  >;
}
interface TagMessage {
  type: 'tag';
  id: MachineId;
  key: string;
  value: number | string | boolean;
}
interface LineMessage {
  type: 'line';
  active: boolean;
}
type BridgeMessage = TagsMessage | TagMessage | LineMessage;

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let backoffMs = 1000;
let started = false;

function resolveEndpoint(): string | null {
  if (typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('ws');
  if (param) {
    window.localStorage.setItem('twin.ws', param);
    return param;
  }
  const stored = window.localStorage.getItem('twin.ws');
  if (stored) return stored;
  const env = import.meta.env.VITE_TWIN_WS_URL as string | undefined;
  return env || null;
}

function applyMessage(msg: BridgeMessage) {
  const state = getTwinState();
  if (msg.type === 'line') {
    setLineActive(msg.active);
    return;
  }
  if (msg.type === 'tag') {
    const m = state.machines[msg.id];
    if (!m) return;
    setMachines({
      ...state.machines,
      [msg.id]: { ...m, values: { ...m.values, [msg.key]: msg.value } },
    });
    return;
  }
  if (msg.type === 'tags') {
    const machines = { ...state.machines };
    for (const [id, patch] of Object.entries(msg.machines)) {
      const m = machines[id as MachineId];
      if (!m || !patch) continue;
      machines[id as MachineId] = {
        ...m,
        running: patch.running ?? m.running,
        alarm: patch.alarm ?? m.alarm,
        values: { ...m.values, ...(patch.values ?? {}) },
      };
    }
    setMachines(machines);
  }
}

function connect(url: string) {
  try {
    socket = new WebSocket(url);
  } catch {
    scheduleReconnect(url);
    return;
  }

  socket.onopen = () => {
    backoffMs = 1000;
    patchTwinState({ demoMode: false });
    console.info('[twin] live bridge connected:', url);
  };

  socket.onmessage = (ev) => {
    try {
      applyMessage(JSON.parse(ev.data as string) as BridgeMessage);
    } catch {
      // Ignore malformed frames; keep the stream alive.
    }
  };

  socket.onclose = () => {
    patchTwinState({ demoMode: true });
    scheduleReconnect(url);
  };

  socket.onerror = () => {
    socket?.close();
  };
}

function scheduleReconnect(url: string) {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    backoffMs = Math.min(backoffMs * 2, 15000);
    connect(url);
  }, backoffMs);
}

/** Idempotent: call once at shell mount. No endpoint → demo sim keeps running. */
export function startLiveBridge() {
  if (started) return;
  started = true;
  const url = resolveEndpoint();
  if (!url) return;
  connect(url);
}

export function stopLiveBridge() {
  started = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  socket?.close();
  socket = null;
  patchTwinState({ demoMode: true });
}
