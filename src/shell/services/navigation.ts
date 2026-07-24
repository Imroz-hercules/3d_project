import type { ProcessZoneId } from '../../navigation/types';
import { navigateTo } from '../../navigation/navStore';
import { focusMachine, focusOverview, focusZone, resetCamera } from './selection';
import { setLineActive, getTwinState } from '../../twin/tags';
import { publishEvent } from './events';
import { syncToastsFromEvents } from './notifications';
import type { MachineId } from '../../twin/types';

export function goOverview() {
  focusOverview();
}

export function goZone(zone: ProcessZoneId) {
  focusZone(zone);
}

export function goMachine(id: MachineId) {
  focusMachine(id);
}

export function startLine() {
  setLineActive(true);
  publishEvent({
    severity: 'info',
    category: 'process',
    message: 'Line Started',
  });
  syncToastsFromEvents();
}

export function stopLine() {
  setLineActive(false);
  publishEvent({
    severity: 'operator',
    category: 'operator',
    message: 'Line Stopped by Operator',
  });
  syncToastsFromEvents();
}

export function pauseLine() {
  // Demo: pause = stop without operator severity toast spam
  if (!getTwinState().lineActive) return;
  setLineActive(false);
  publishEvent({
    severity: 'info',
    category: 'process',
    message: 'Line Paused',
  });
}

export function cameraPresetOverview() {
  navigateTo({ kind: 'overview' });
}

export function cameraPresetZone(zone: ProcessZoneId) {
  navigateTo({ kind: 'zone', zone });
}

export { resetCamera };
