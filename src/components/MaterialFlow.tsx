'use client';

/**
 * MaterialFlow — animated product particles along plant paths.
 * Kinds: wheat (brown, raw/cleaning), flour (cream, milling→packing), dust (subtle motes).
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type V3 = [number, number, number];

export type MaterialKind = 'wheat' | 'flour' | 'dust';

const KIND_STYLE: Record<
  MaterialKind,
  { color: string; emissive: string; emissiveIntensity: number; count: number; size: number }
> = {
  wheat: {
    color: '#8b6914',
    emissive: '#5c4010',
    emissiveIntensity: 0.08,
    count: 70,
    size: 0.045,
  },
  flour: {
    color: '#f5f0e0',
    emissive: '#e8e0c8',
    emissiveIntensity: 0.12,
    count: 90,
    size: 0.038,
  },
  dust: {
    color: '#a89880',
    emissive: '#6a6050',
    emissiveIntensity: 0.05,
    count: 36,
    size: 0.018,
  },
};

function buildPath(points: V3[]): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < points.length - 1; i++) {
    path.add(
      new THREE.LineCurve3(new THREE.Vector3(...points[i]), new THREE.Vector3(...points[i + 1]))
    );
  }
  return path;
}

export interface MaterialFlowProps {
  /** Ordered waypoints along the product route. */
  path: V3[];
  active?: boolean;
  speed?: number;
  kind?: MaterialKind;
  /** Override default particle count for this kind. */
  count?: number;
}

export function MaterialFlow({
  path,
  active = true,
  speed = 0.08,
  kind = 'flour',
  count,
}: MaterialFlowProps) {
  const style = KIND_STYLE[kind];
  const particleCount = count ?? style.count;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const curve = useMemo(() => buildPath(path), [path]);
  const offsets = useMemo(
    () => Array.from({ length: particleCount }, (_, i) => i / particleCount),
    [particleCount]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current || !active || path.length < 2) return;
    const t0 = clock.elapsedTime * speed;

    offsets.forEach((offset, i) => {
      const t = (t0 + offset) % 1;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const size = style.size * (0.85 + (i % 5) * 0.06);

      dummy.position.copy(point);
      dummy.scale.setScalar(size);
      dummy.lookAt(point.clone().add(tangent));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (path.length < 2) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, particleCount]}
      castShadow={kind !== 'dust'}
      visible={active}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color={style.color}
        emissive={style.emissive}
        emissiveIntensity={style.emissiveIntensity}
        roughness={0.85}
        metalness={0.05}
        transparent={kind === 'dust'}
        opacity={kind === 'dust' ? 0.55 : 1}
      />
    </instancedMesh>
  );
}

/**
 * Soft dust motes drifting near a takeoff hood — not path-following.
 * Low count for performance; only visible when `active`.
 */
export function DustMotes({
  position,
  active = true,
  count = 28,
  radius = 0.55,
}: {
  position: V3;
  active?: boolean;
  count?: number;
  radius?: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        ox: ((i * 17) % 100) / 100 - 0.5,
        oy: ((i * 31) % 100) / 100,
        oz: ((i * 47) % 100) / 100 - 0.5,
        phase: i * 0.37,
        speed: 0.35 + (i % 5) * 0.08,
      })),
    [count]
  );

  useFrame(({ clock }) => {
    if (!meshRef.current || !active) return;
    const t = clock.elapsedTime;
    seeds.forEach((s, i) => {
      const y = Math.abs(Math.sin(t * s.speed + s.phase)) * radius * 1.2;
      const x = s.ox * radius * 2 + Math.sin(t * 0.4 + s.phase) * 0.12;
      const z = s.oz * radius * 2 + Math.cos(t * 0.35 + s.phase) * 0.1;
      dummy.position.set(x, y + s.oy * 0.2, z);
      dummy.scale.setScalar(0.012 + (i % 4) * 0.004);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={position} visible={active}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[1, 5, 5]} />
        <meshStandardMaterial
          color="#a89880"
          emissive="#6a6050"
          emissiveIntensity={0.06}
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
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
