import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { matFlange } from '../../materials';
import { plantCenter } from '../layoutConstants';
import { useCameraNear } from '../../perf/useCameraNear';

type V3 = [number, number, number];

/**
 * Transparent inspection sight glass on a duct run with instanced product
 * dots streaming through it. Dots animate only when `active` and the camera
 * is near; the glass shell itself always renders so the duct reads sealed.
 */
export function SightGlassFlow({
  start,
  end,
  radius = 0.13,
  color = '#f5f0e0',
  active = true,
  count = 12,
  speed = 0.8,
  nearRadius = 24,
}: {
  start: V3;
  end: V3;
  radius?: number;
  color?: string;
  active?: boolean;
  count?: number;
  speed?: number;
  nearRadius?: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { mid, quat, len, dir } = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const d = new THREE.Vector3().subVectors(e, s);
    const l = d.length();
    const m = new THREE.Vector3().addVectors(s, e).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      d.clone().normalize()
    );
    return { mid: m, quat: q, len: l, dir: d.normalize() };
  }, [start, end]);

  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#cfe4ec',
        transparent: true,
        opacity: 0.28,
        roughness: 0.15,
        metalness: 0.1,
        depthWrite: false,
      }),
    []
  );

  const [cx, , cz] = plantCenter();
  const isNear = useCameraNear([mid.x - cx, mid.y, mid.z - cz], nearRadius);
  const animate = active && isNear;

  const offsets = useMemo(
    () => Array.from({ length: count }, (_, i) => i / count),
    [count]
  );
  const startV = useMemo(() => new THREE.Vector3(...start), [start]);

  useFrame(({ clock }) => {
    if (!animate || !meshRef.current) return;
    const t0 = clock.elapsedTime * speed;
    // Falling direction: dots travel start → end
    offsets.forEach((offset, i) => {
      const t = (t0 + offset) % 1;
      dummy.position.copy(startV).addScaledVector(dir, t * len);
      // Slight radial scatter so the stream isn't a laser line
      dummy.position.x += Math.sin(i * 2.1) * radius * 0.35;
      dummy.position.z += Math.cos(i * 3.7) * radius * 0.35;
      dummy.scale.setScalar(0.03 + (i % 4) * 0.008);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (len < 0.05) return null;

  return (
    <group>
      {/* Glass shell */}
      <mesh position={mid.toArray() as V3} quaternion={quat} material={glassMat} dispose={null}>
        <cylinderGeometry args={[radius, radius, len, 12, 1, true]} />
      </mesh>
      {/* Stainless end collars */}
      <mesh position={start} quaternion={quat} castShadow={false} dispose={null} material={matFlange}>
        <cylinderGeometry args={[radius * 1.18, radius * 1.18, 0.05, 12]} />
      </mesh>
      <mesh position={end} quaternion={quat} castShadow={false} dispose={null} material={matFlange}>
        <cylinderGeometry args={[radius * 1.18, radius * 1.18, 0.05, 12]} />
      </mesh>
      {/* Product stream */}
      {animate && (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} roughness={0.85} />
        </instancedMesh>
      )}
    </group>
  );
}
