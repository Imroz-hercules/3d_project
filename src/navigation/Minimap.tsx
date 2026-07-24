import {
  zoneBoundsFromRegistry,
  ZONE_FLOW,
  ZONE_LABELS,
  overviewBoundsFromPlant,
} from './zoneRegistry';
import { buildMachineRegistry } from './MachineRegistry';
import { navigateTo } from './navStore';
import { useCameraPose, useNavState } from './useNavState';
import { useTwinState } from '../twin/useTwinState';
import { useTheme } from '../theme';
import type { ProcessZoneId } from './types';

export function Minimap() {
  const zones = zoneBoundsFromRegistry();
  const machines = buildMachineRegistry();
  const plant = overviewBoundsFromPlant();
  const pose = useCameraPose();
  const { focus } = useNavState();
  const { selectedId } = useTwinState();
  const { tokens } = useTheme();
  const nav = tokens.hud.navigation;

  const w = 200;
  const h = 150;
  const pad = 10;
  const bw = Math.max(0.01, plant.maxX - plant.minX);
  const bd = Math.max(0.01, plant.maxZ - plant.minZ);
  const sx = (x: number) => pad + ((x - plant.minX) / bw) * (w - pad * 2);
  const sz = (z: number) => pad + ((z - plant.minZ) / bd) * (h - pad * 2);

  const activeZone: ProcessZoneId | null =
    focus.kind === 'zone'
      ? focus.zone
      : focus.kind === 'machine'
        ? (machines.find((m) => m.id === focus.machineId)?.zone ?? null)
        : null;

  const flowZones = ZONE_FLOW.filter((id) => zones.some((z) => z.id === id));
  const flowCenters = flowZones.map((id) => {
    const z = zones.find((b) => b.id === id)!;
    return {
      id,
      x: sx((z.minX + z.maxX) / 2),
      y: sz((z.minZ + z.maxZ) / 2),
    };
  });

  const camX = sx(pose.x);
  const camY = sz(pose.z);
  const arrowLen = 14;
  const tipX = camX + pose.dirX * arrowLen;
  const tipY = camY + pose.dirZ * arrowLen;

  return (
    <div className="stwin-minimap">
      <div className="stwin-minimap__label">Factory Map</div>
      <svg width={w} height={h} className="stwin-minimap__svg">
        <defs>
          <marker
            id="navArrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill={nav.minimapFlow} />
          </marker>
        </defs>

        {zones.map((z) => {
          const active = activeZone === z.id;
          return (
            <rect
              key={z.id}
              x={sx(z.minX)}
              y={sz(z.minZ)}
              width={Math.max(4, sx(z.maxX) - sx(z.minX))}
              height={Math.max(4, sz(z.maxZ) - sz(z.minZ))}
              fill={active ? nav.activeZone : nav.inactiveZone}
              stroke={active ? nav.activeZoneStroke : nav.inactiveZoneStroke}
              strokeWidth={active ? 1.5 : 1}
              style={{ cursor: 'pointer' }}
              onClick={() => navigateTo({ kind: 'zone', zone: z.id })}
            >
              <title>{ZONE_LABELS[z.id]}</title>
            </rect>
          );
        })}

        {flowCenters.slice(0, -1).map((a, i) => {
          const b = flowCenters[i + 1]!;
          return (
            <line
              key={`flow-${a.id}-${b.id}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={nav.minimapFlow}
              strokeWidth={1.5}
              markerEnd="url(#navArrow)"
            />
          );
        })}

        {machines.map((m) => (
          <circle
            key={m.id}
            cx={sx(m.position[0])}
            cy={sz(m.position[2])}
            r={selectedId === m.id ? 4.5 : 3}
            fill={selectedId === m.id ? nav.selectedMachine : nav.machineDot}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              navigateTo({ kind: 'machine', machineId: m.id });
            }}
          >
            <title>{m.name}</title>
          </circle>
        ))}

        <circle cx={camX} cy={camY} r={4} fill={nav.minimapCamera} />
        <line
          x1={camX}
          y1={camY}
          x2={tipX}
          y2={tipY}
          stroke={nav.minimapArrow}
          strokeWidth={2}
        />
        <polygon
          points={`${tipX},${tipY} ${tipX - pose.dirZ * 4 - pose.dirX * 3},${tipY + pose.dirX * 4 - pose.dirZ * 3} ${tipX + pose.dirZ * 4 - pose.dirX * 3},${tipY - pose.dirX * 4 - pose.dirZ * 3}`}
          fill={nav.minimapArrow}
        />
      </svg>
    </div>
  );
}
