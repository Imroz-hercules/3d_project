import { navigateTo, setDebugOrbit } from '../../navigation/navStore';
import { selectMachine } from '../../twin/tags';
import type { MachineId } from '../../twin/types';
import type { ProcessZoneId } from '../../navigation/types';
import { setLeftExpanded, setRightOpen } from './panelState';

/** Ensure Fly camera mode so 3D factory camera can animate (not Orbit / map-only). */
function ensureFlyCamera() {
  setDebugOrbit(false);
}

/** Selection + panel choreography for operator workflow. */
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
  ensureFlyCamera();
  selectMachine(null);
  navigateTo({ kind: 'overview' });
  setRightOpen(false);
}

export function resetCamera() {
  focusOverview();
}
