import { useMemo } from 'react';
import * as THREE from 'three';
import { matPaintDark, matSteel } from '../../materials';

type V3 = [number, number, number];

export type BeaconStatus = 'run' | 'idle' | 'fault';

const LAMP_COLORS: Record<'green' | 'yellow' | 'red', string> = {
  green: '#2ecc71',
  yellow: '#f1c40f',
  red: '#e74c3c',
};

/**
 * Tri-color industrial stack light (andon): green = running, yellow = idle,
 * red = fault. Only the active segment is emissive.
 */
export function StatusBeacon({
  position,
  status,
  scale = 1,
}: {
  position: V3;
  status: BeaconStatus;
  scale?: number;
}) {
  const lampMats = useMemo(() => {
    const make = (color: string, lit: boolean) =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: lit ? 1.1 : 0.05,
        roughness: 0.4,
        metalness: 0.05,
        transparent: true,
        opacity: lit ? 0.95 : 0.6,
      });
    return {
      green: make(LAMP_COLORS.green, status === 'run'),
      yellow: make(LAMP_COLORS.yellow, status === 'idle'),
      red: make(LAMP_COLORS.red, status === 'fault'),
    };
  }, [status]);

  return (
    <group position={position} scale={scale}>
      {/* Pole */}
      <mesh position={[0, 0.12, 0]} castShadow={false} dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.018, 0.018, 0.24, 8]} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.01, 0]} castShadow={false} dispose={null} material={matPaintDark}>
        <cylinderGeometry args={[0.05, 0.06, 0.03, 10]} />
      </mesh>
      {/* Lamp stack: red top, yellow mid, green bottom */}
      <mesh position={[0, 0.3, 0]} material={lampMats.green}>
        <cylinderGeometry args={[0.045, 0.045, 0.09, 12]} />
      </mesh>
      <mesh position={[0, 0.4, 0]} material={lampMats.yellow}>
        <cylinderGeometry args={[0.045, 0.045, 0.09, 12]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={lampMats.red}>
        <cylinderGeometry args={[0.045, 0.045, 0.09, 12]} />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 0.565, 0]} castShadow={false} dispose={null} material={matPaintDark}>
        <cylinderGeometry args={[0.05, 0.045, 0.04, 12]} />
      </mesh>
    </group>
  );
}
