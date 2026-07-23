import type { ProcessZoneId } from './types';
import { buildMachineRegistry } from './MachineRegistry';
import { plantBounds } from '../components/layoutConstants';

export const ZONE_LABELS: Record<ProcessZoneId, string> = {
  raw: 'Raw Material',
  cleaning: 'Cleaning',
  conditioning: 'Conditioning',
  milling: 'Milling',
  storage: 'Flour Storage',
  packing: 'Packing',
  warehouse: 'Warehouse',
};

/** Process order for minimap flow arrows (skip zones with no machines). */
export const ZONE_FLOW: ProcessZoneId[] = [
  'raw',
  'cleaning',
  'conditioning',
  'milling',
  'storage',
  'packing',
  'warehouse',
];

export interface ZoneBounds {
  id: ProcessZoneId;
  label: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export function zoneBoundsFromRegistry(): ZoneBounds[] {
  const machines = buildMachineRegistry();
  const zones = Object.keys(ZONE_LABELS) as ProcessZoneId[];
  const pad = 2.5;
  return zones
    .map((id) => {
      const ms = machines.filter((m) => m.zone === id);
      if (ms.length === 0) return null;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      for (const m of ms) {
        const [x, y, z] = m.position;
        const [sx, sy, sz] = m.size;
        minX = Math.min(minX, x - sx / 2);
        maxX = Math.max(maxX, x + sx / 2);
        minY = Math.min(minY, y - sy / 2);
        maxY = Math.max(maxY, y + sy / 2);
        minZ = Math.min(minZ, z - sz / 2);
        maxZ = Math.max(maxZ, z + sz / 2);
      }
      return {
        id,
        label: ZONE_LABELS[id],
        minX: minX - pad,
        maxX: maxX + pad,
        minY: Math.max(0, minY - pad),
        maxY: maxY + pad,
        minZ: minZ - pad,
        maxZ: maxZ + pad,
      };
    })
    .filter((z): z is ZoneBounds => z != null);
}

export function overviewBoundsFromPlant(): ZoneBounds {
  const b = plantBounds();
  return {
    id: 'raw',
    label: 'Entire Factory',
    minX: b.minX,
    maxX: b.maxX,
    minY: 0,
    maxY: 12,
    minZ: b.minZ,
    maxZ: b.maxZ,
  };
}
