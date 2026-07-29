import { useMemo } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { getMachine } from '../navigation/MachineRegistry';
import { useTwinState } from './useTwinState';

/**
 * Floating data callout above the selected machine: name, run/alarm status,
 * and the first live tag values from the twin. Billboarded, no DOM overlay,
 * so it composes with fog/post-FX. Mounted once inside the plant group.
 */

const ALARM_COLORS = {
  OFF: '#3ecf8e',
  WARN: '#f1c40f',
  ALARM: '#e74c3c',
} as const;

function formatValue(v: number | string | boolean): string {
  if (typeof v === 'boolean') return v ? 'ON' : 'OFF';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(1);
  return v;
}

export function MachineCallout() {
  const twin = useTwinState();
  const id = twin.selectedId;
  const machine = useMemo(() => (id ? getMachine(id) : undefined), [id]);
  if (!id || !machine) return null;

  const tags = twin.machines[id];
  const entries = Object.entries(tags?.values ?? {}).slice(0, 3);
  const alarm = tags?.alarm ?? 'OFF';
  const statusColor = tags?.running ? ALARM_COLORS[alarm] : '#8a9199';
  const statusText = !tags?.running ? 'STOPPED' : alarm === 'OFF' ? 'RUNNING' : alarm;

  const [mx, my, mz] = machine.position;
  const topY = my + machine.size[1] / 2 + 0.7;
  const panelH = 0.42 + entries.length * 0.17;

  return (
    <Billboard position={[mx, topY, mz]} follow>
      {/* Leader line to the machine */}
      <mesh position={[0, -panelH / 2 - 0.25, 0]}>
        <planeGeometry args={[0.015, 0.5]} />
        <meshBasicMaterial color="#dfe6ec" transparent opacity={0.65} />
      </mesh>

      {/* Panel background */}
      <mesh>
        <planeGeometry args={[2.0, panelH]} />
        <meshBasicMaterial color="#10161c" transparent opacity={0.82} />
      </mesh>
      {/* Status edge strip */}
      <mesh position={[-0.98, 0, 0.001]}>
        <planeGeometry args={[0.05, panelH]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* Header */}
      <Text
        position={[-0.88, panelH / 2 - 0.14, 0.002]}
        fontSize={0.12}
        color="#f2f5f7"
        anchorX="left"
        anchorY="middle"
        maxWidth={1.8}
      >
        {machine.name}
      </Text>
      <Text
        position={[0.92, panelH / 2 - 0.14, 0.002]}
        fontSize={0.085}
        color={statusColor}
        anchorX="right"
        anchorY="middle"
      >
        {statusText}
      </Text>

      {/* Live tag rows */}
      {entries.map(([key, value], i) => (
        <group key={key} position={[0, panelH / 2 - 0.38 - i * 0.17, 0.002]}>
          <Text position={[-0.88, 0, 0]} fontSize={0.09} color="#9fb0bd" anchorX="left" anchorY="middle">
            {key}
          </Text>
          <Text position={[0.92, 0, 0]} fontSize={0.095} color="#e8eef2" anchorX="right" anchorY="middle">
            {formatValue(value)}
          </Text>
        </group>
      ))}
    </Billboard>
  );
}
