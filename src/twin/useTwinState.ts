import { useSyncExternalStore } from 'react';
import { getTwinState, subscribeTwin } from './tags';
import type { MachineId, MachineTags, TwinState } from './types';

export function useTwinState(): TwinState {
  return useSyncExternalStore(subscribeTwin, getTwinState, getTwinState);
}

/** Only re-renders when line on/off changes — safe for the full 3D plant tree. */
export function useLineActive(): boolean {
  return useSyncExternalStore(
    subscribeTwin,
    () => getTwinState().lineActive,
    () => getTwinState().lineActive
  );
}

/** Stable string snapshot so Object.is skips unrelated twin tag updates. */
function machineSelectAlarmKey(id: MachineId): string {
  const s = getTwinState();
  const selected = s.selectedId === id ? '1' : '0';
  const alarm = s.machines[id]?.alarm ?? 'OFF';
  return `${selected}:${alarm}`;
}

/** Selection + alarm for one machine — ignores RPM/weight noise from the demo sim. */
export function useMachineSelectAlarm(id: MachineId): {
  selected: boolean;
  alarm: MachineTags['alarm'];
} {
  const key = useSyncExternalStore(subscribeTwin, () => machineSelectAlarmKey(id), () =>
    machineSelectAlarmKey(id)
  );
  const [sel, alarm] = key.split(':') as ['0' | '1', MachineTags['alarm']];
  return { selected: sel === '1', alarm };
}
