import { navigateTo, setDebugOrbit } from '../../navigation/navStore';
import { selectMachine } from '../../twin/tags';
import type { MachineId } from '../../twin/types';
import type { ProcessZoneId } from '../../navigation/types';
import { setLeftExpanded, setRightOpen } from './panelState';

/** Ensure Fly camera mode so 3D factory camera can animate (not Orbit / map-only). */
function ensureFlyCamera() {
  setDebugOrbit(false);
}

/**
 * Select a machine and open the inspector — does NOT move the camera.
 * Use for 3D clicks, alarms, search, minimap, timeline.
 */
export function inspectMachine(machineId: MachineId) {
  selectMachine(machineId);
  setRightOpen(true);
}

/**
 * Left-panel machine nav: select + fly the factory camera to that asset.
 */
export function focusMachine(machineId: MachineId) {
  ensureFlyCamera();
  navigateTo({ kind: 'machine', machineId });
  setRightOpen(true);
  setLeftExpanded(false);
}

export function focusZone(zone: ProcessZoneId) {
  ensureFlyCamera();
  navigateTo({ kind: 'zone', zone });
  setRightOpen(false);
}

export function focusOverview() {
  ensureFlyCamera();
  selectMachine(null);
  navigateTo({ kind: 'overview' });
  setRightOpen(false);
}

export function clearSelection() {
  selectMachine(null);
  setRightOpen(false);
}

export function resetCamera() {
  focusOverview();
}
