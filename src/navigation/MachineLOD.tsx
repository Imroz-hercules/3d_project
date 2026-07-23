import { Detailed } from '@react-three/drei';
import type { ReactNode } from 'react';

/** Distance LOD — full detail nearby, simple proxy when far. */
export function MachineLOD({
  distance = 28,
  full,
  simple,
}: {
  distance?: number;
  full: ReactNode;
  simple: ReactNode;
}) {
  return (
    <Detailed distances={[0, distance]}>
      <group>{full}</group>
      <group>{simple}</group>
    </Detailed>
  );
}
