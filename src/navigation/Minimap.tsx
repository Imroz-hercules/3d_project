import {
  zoneBoundsFromRegistry,
  ZONE_LABELS,
  overviewBoundsFromPlant,
} from './zoneRegistry';
import { buildMachineRegistry } from './MachineRegistry';
import { useCameraPose, useNavState } from './useNavState';
import { useTwinState } from '../twin/useTwinState';
import type { ProcessZoneId } from './types';
import { inspectMachine, focusZone } from '../shell/services/selection';

const MAP_W = 240;
const MAP_H = 170;

/** Factory Map — aerial plant image with live camera / zone overlays. */
export function Minimap() {
  const zones = zoneBoundsFromRegistry();
  const machines = buildMachineRegistry();
  const plant = overviewBoundsFromPlant();
  const pose = useCameraPose();
  const { focus } = useNavState();
  const { selectedId } = useTwinState();

  const pad = 8;
  const bw = Math.max(0.01, plant.maxX - plant.minX);
  const bd = Math.max(0.01, plant.maxZ - plant.minZ);
  const sx = (x: number) => pad + ((x - plant.minX) / bw) * (MAP_W - pad * 2);
  const sz = (z: number) => pad + ((z - plant.minZ) / bd) * (MAP_H - pad * 2);

  const activeZone: ProcessZoneId | null =
    focus.kind === 'zone'
      ? focus.zone
      : focus.kind === 'machine'
        ? (machines.find((m) => m.id === focus.machineId)?.zone ?? null)
        : null;

  const camX = sx(pose.x);
  const camY = sz(pose.z);
  const arrowLen = 14;
  const tipX = camX + pose.dirX * arrowLen;
  const tipY = camY + pose.dirZ * arrowLen;

  return (
    <div className="stwin-minimap">
      <div className="stwin-minimap__label">Factory Map</div>
      <div className="stwin-minimap__frame" style={{ width: MAP_W, height: MAP_H }}>
        <img
          className="stwin-minimap__photo"
          src="/images/factory-map.png"
          alt="Factory aerial view"
          draggable={false}
        />
        <svg
          className="stwin-minimap__overlay"
          width={MAP_W}
          height={MAP_H}
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        >
          {/* Invisible zone hit targets over the photo */}
          {zones.map((z) => {
            const active = activeZone === z.id;
            return (
              <rect
                key={z.id}
                x={sx(z.minX)}
                y={sz(z.minZ)}
                width={Math.max(4, sx(z.maxX) - sx(z.minX))}
                height={Math.max(4, sz(z.maxZ) - sz(z.minZ))}
                fill={active ? 'rgba(102, 232, 194, 0.22)' : 'transparent'}
                stroke={active ? 'rgba(102, 232, 194, 0.85)' : 'transparent'}
                strokeWidth={active ? 1.5 : 0}
                style={{ cursor: 'pointer' }}
                onClick={() => focusZone(z.id)}
              >
                <title>{ZONE_LABELS[z.id]}</title>
              </rect>
            );
          })}

          {machines.map((m) => (
            <circle
              key={m.id}
              cx={sx(m.position[0])}
              cy={sz(m.position[2])}
              r={selectedId === m.id ? 4.5 : 3}
              fill={selectedId === m.id ? '#66E8C2' : 'rgba(255,255,255,0.55)'}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={0.75}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                inspectMachine(m.id);
              }}
            >
              <title>{m.name}</title>
            </circle>
          ))}

          <circle cx={camX} cy={camY} r={4} fill="#F4F7F8" stroke="#18222D" strokeWidth={1} />
          <line
            x1={camX}
            y1={camY}
            x2={tipX}
            y2={tipY}
            stroke="#F2B45B"
            strokeWidth={2}
          />
          <polygon
            points={`${tipX},${tipY} ${tipX - pose.dirZ * 4 - pose.dirX * 3},${tipY + pose.dirX * 4 - pose.dirZ * 3} ${tipX + pose.dirZ * 4 - pose.dirX * 3},${tipY - pose.dirX * 4 - pose.dirZ * 3}`}
            fill="#F2B45B"
          />
        </svg>
      </div>
    </div>
  );
}
