import { Detailed } from '@react-three/drei';
import type { ReactNode } from 'react';

type V3 = [number, number, number];

/**
 * Distance LOD — full detail nearby, simple proxy when far.
 * `position` must be the machine world position so Detailed measures
 * camera distance to the asset, not the plant origin.
 */
export function MachineLOD({
  distance = 28,
  full,
  simple,
  position,
}: {
  distance?: number;
  full: ReactNode;
  simple: ReactNode;
  position?: V3;
}) {
  return (
    <Detailed distances={[0, distance]} position={position}>
      <group>{full}</group>
      <group>{simple}</group>
    </Detailed>
  );
}
