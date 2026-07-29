import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { usePlantMaterials } from "../../materials";

/**
 * Plant slab: tiled concrete + subtle expansion joints + aisle paint.
 */
export function IndustrialFloor({ radius }: { radius: number }) {
  const { concrete } = usePlantMaterials();
  const meshRef = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    const g = meshRef.current?.geometry;
    if (!g) return;
    if (!g.attributes.uv2 && g.attributes.uv) {
      g.setAttribute("uv2", g.attributes.uv.clone());
    }
  }, []);

  const jointMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#8a8a82",
        roughness: 0.95,
        metalness: 0,
      }),
    []
  );
  const size = radius * 2;
  const joints: [number, number, number, number][] = [];
  for (let x = -radius + 6; x < radius; x += 6) {
    joints.push([x, 0, 0.06, size]);
  }
  for (let z = -radius + 6; z < radius; z += 6) {
    joints.push([0, z, size, 0.06]);
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow={false}
        dispose={null}
        material={concrete}
      >
        <planeGeometry args={[size, size, 1, 1]} />
      </mesh>

      {joints.map(([x, z, w, d], i) => (
        <mesh
          key={`j-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, -0.015, z]}
          material={jointMat}
        >
          <planeGeometry args={[w, d]} />
        </mesh>
      ))}
    </group>
  );
}
