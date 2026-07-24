import { navigateTo } from '../../navigation/navStore';
import { selectMachine } from '../../twin/tags';
import type { MachineId } from '../../twin/types';
import type { ProcessZoneId } from '../../navigation/types';
import { setLeftExpanded, setRightOpen } from './panelState';

/** Selection + panel choreography for operator workflow. */
export function focusMachine(machineId: MachineId) {
  navigateTo({ kind: 'machine', machineId });
  setRightOpen(true);
  setLeftExpanded(false);
}

export function focusZone(zone: ProcessZoneId) {
  navigateTo({ kind: 'zone', zone });
  setRightOpen(false);
}

export function focusOverview() {
  selectMachine(null);
  navigateTo({ kind: 'overview' });
  setRightOpen(false);
}

export function clearSelection() {
  selectMachine(null);
  navigateTo({ kind: 'overview' });
  setRightOpen(false);
}

export function resetCamera() {
  focusOverview();
}
