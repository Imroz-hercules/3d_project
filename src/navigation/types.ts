/** Navigation focus, zones, and machine registry shapes. */

import type { MachineId } from '../twin/types';

export type NavZoneId =
  | 'overview'
  | 'raw'
  | 'cleaning'
  | 'conditioning'
  | 'milling'
  | 'storage'
  | 'packing'
  | 'warehouse';

export type ProcessZoneId = Exclude<NavZoneId, 'overview'>;

export interface MachineRecord {
  id: MachineId;
  name: string;
  /** Plant-local metres (same space as layoutConstants). */
  position: [number, number, number];
  zone: ProcessZoneId;
  /** Axis-aligned size used for picking + sphere framing. */
  size: [number, number, number];
  /** Optional look-at override; default = position + [0, sizeY*0.35, 0]. */
  cameraTarget?: [number, number, number];
  status?: 'running' | 'stopped' | 'warn' | 'alarm';
}

export type NavFocus =
  | { kind: 'overview' }
  | { kind: 'zone'; zone: ProcessZoneId }
  | { kind: 'machine'; machineId: MachineId };

export interface CameraPose {
  x: number;
  z: number;
  dirX: number;
  dirZ: number;
}

export interface NavState {
  focus: NavFocus;
  history: NavFocus[];
  historyIndex: number;
  debugOrbit: boolean;
  cameraPose: CameraPose;
}
