'use client';

/**
 * MaterialFlow.tsx — animated flour particles along the production line path.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type V3 = [number, number, number];

const FLOUR_COLOR = '#f0e0b8';
const PARTICLE_COUNT = 120;

function buildPath(points: V3[]): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < points.length - 1; i++) {
    path.add(new THREE.LineCurve3(
      new THREE.Vector3(...points[i]),
      new THREE.Vector3(...points[i + 1])
    ));
  }
  return path;
}

export interface MaterialFlowProps {
  /** Ordered waypoints from silo outlet → screw discharge. */
  path: V3[];
  active?: boolean;
  speed?: number;
}

export function MaterialFlow({ path, active = true, speed = 0.08 }: MaterialFlowProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const curve = useMemo(() => buildPath(path), [path]);
  const offsets = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, (_, i) => i / PARTICLE_COUNT),
    []
  );

  useFrame(({ clock }) => {
    if (!meshRef.current || !active) return;
    const t0 = clock.elapsedTime * speed;

    offsets.forEach((offset, i) => {
      const t = (t0 + offset) % 1;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const size = 0.04 + (i % 5) * 0.008;

      dummy.position.copy(point);
      dummy.scale.setScalar(size);
      dummy.lookAt(point.clone().add(tangent));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]} castShadow>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color={FLOUR_COLOR}
        emissive="#d4c090"
        emissiveIntensity={0.15}
        roughness={0.85}
        metalness={0.05}
      />
    </instancedMesh>
  );
}

/** Visible flour fill level inside a hopper funnel. */
export function FlourFill({
  topWidth,
  topDepth,
  bottomWidth,
  bottomDepth,
  height,
  baseY,
  fillLevel = 0.65,
}: {
  topWidth: number;
  topDepth: number;
  bottomWidth: number;
  bottomDepth: number;
  height: number;
  baseY: number;
  fillLevel?: number;
}) {
  const fillH = Math.max(0.05, height * fillLevel);
  const t = fillH / height;
  const w = bottomWidth + (topWidth - bottomWidth) * t;
  const d = bottomDepth + (topDepth - bottomDepth) * t;

  return (
    <mesh position={[0, baseY + fillH / 2, 0]} castShadow>
      <boxGeometry args={[w * 0.92, fillH, d * 0.92]} />
      <meshStandardMaterial color="#e8d4a0" roughness={0.9} metalness={0.02} />
    </mesh>
  );
}

export default MaterialFlow;
