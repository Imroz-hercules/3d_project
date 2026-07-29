'use client';

/**
 * Invisible click hotspot + selection highlight for digital-twin assets.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { focusMachine } from '../shell/services/selection';
import { useMachineSelectAlarm } from './useTwinState';
import type { MachineId } from './types';

type V3 = [number, number, number];

export function SelectableMachine({
  id,
  position,
  size = [2.5, 3, 2.5],
}: {
  id: MachineId;
  position: V3;
  size?: V3;
}) {
  const { selected, alarm } = useMachineSelectAlarm(id);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    if (!selected && alarm === 'OFF') {
      ringRef.current.visible = false;
      return;
    }
    const pulse = 0.55 + Math.sin(clock.elapsedTime * 4) * 0.35;
    const mat = ringRef.current.material as THREE.MeshStandardMaterial;
    if (selected) {
      mat.emissiveIntensity = pulse;
      ringRef.current.visible = true;
    } else {
      mat.emissiveIntensity = 0.35 + Math.sin(clock.elapsedTime * 6) * 0.25;
      ringRef.current.visible = true;
    }
  });

  const color = alarm === 'ALARM' ? '#c62828' : alarm === 'WARN' ? '#ef6c00' : '#3ecf8e';

  return (
    <group position={position}>
      <mesh
        visible={false}
        onClick={(e) => {
          e.stopPropagation();
          focusMachine(id);
        }}
      >
        <boxGeometry args={size} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh ref={ringRef} position={[0, size[1] * 0.55, 0]} visible={false}>
        <torusGeometry args={[Math.max(size[0], size[2]) * 0.45, 0.06, 8, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}
