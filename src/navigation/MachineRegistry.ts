/**
 * Single machine lookup for HUD, camera, minimap, LOD, selection, and search.
 * Positions always come from layoutConstants helpers — never duplicate world coords here.
 */

import type { MachineRecord, ProcessZoneId } from './types';
import type { MachineId } from '../twin/types';
import { MACHINE_LABELS } from '../twin/types';
import {
  elevatorPosition,
  separatorPosition,
  rollerMillPosition,
  flourBinPosition,
  packingMachinePosition,
  checkWeigherPosition,
  metalDetectorPosition,
  palletizerPosition,
  siloPosition,
  conditioningBinPosition,
  warehouseStagingPosition,
} from '../components/layoutConstants';

/** Central list — rebuild whenever layout helpers change (cheap pure function). */
export function buildMachineRegistry(): MachineRecord[] {
  return [
    {
      id: 'silo',
      name: MACHINE_LABELS.silo,
      position: [siloPosition()[0], 2, siloPosition()[2]],
      zone: 'raw',
      size: [3.2, 6, 3.2],
    },
    {
      id: 'elevator',
      name: MACHINE_LABELS.elevator,
      position: elevatorPosition(),
      zone: 'raw',
      size: [2.2, 7, 2.2],
    },
    {
      id: 'vibro',
      name: MACHINE_LABELS.vibro,
      position: separatorPosition(),
      zone: 'cleaning',
      size: [3.5, 3, 2.2],
    },
    {
      id: 'conditioning_bin',
      name: MACHINE_LABELS.conditioning_bin,
      position: conditioningBinPosition(),
      zone: 'conditioning',
      size: [4, 8, 4],
    },
    {
      id: 'roller_mill',
      name: MACHINE_LABELS.roller_mill,
      position: rollerMillPosition(),
      zone: 'milling',
      size: [3.2, 4, 2.8],
    },
    {
      id: 'flour_bin_a',
      name: MACHINE_LABELS.flour_bin_a,
      position: flourBinPosition('A'),
      zone: 'storage',
      size: [3, 8, 3],
    },
    {
      id: 'packing',
      name: MACHINE_LABELS.packing,
      position: packingMachinePosition(),
      zone: 'packing',
      size: [3, 4, 2.5],
    },
    {
      id: 'check_weigher',
      name: MACHINE_LABELS.check_weigher,
      position: checkWeigherPosition(),
      zone: 'packing',
      size: [2.8, 2.5, 1.6],
    },
    {
      id: 'metal_detector',
      name: MACHINE_LABELS.metal_detector,
      position: metalDetectorPosition(),
      zone: 'packing',
      size: [3, 2.8, 1.8],
    },
    {
      id: 'palletizer',
      name: MACHINE_LABELS.palletizer,
      position: palletizerPosition(),
      zone: 'packing',
      size: [6, 4, 6],
    },
    {
      id: 'warehouse',
      name: MACHINE_LABELS.warehouse,
      position: warehouseStagingPosition(),
      zone: 'warehouse',
      size: [8, 4, 6],
    },
  ];
}

export function getMachine(id: MachineId, list = buildMachineRegistry()) {
  return list.find((m) => m.id === id);
}

export function machinesInZone(zone: ProcessZoneId, list = buildMachineRegistry()) {
  return list.filter((m) => m.zone === zone);
}

export function searchMachines(query: string, list = buildMachineRegistry()) {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
  );
}
