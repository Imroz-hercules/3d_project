import { useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { matPaintBlue, matPaintDark, matSteel } from "../../materials";

type V3 = [number, number, number];

/**
 * Reusable industrial motor — blue body, dark end bells, stainless shaft.
 * Style guide: motors = matPaintBlue.
 */
export function Motor({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  active = false,
  side = "right",
}: {
  position?: V3;
  rotation?: V3;
  scale?: number;
  active?: boolean;
  side?: "left" | "right";
}) {
  const fanRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 12;
    }
  });

  const xOffset = side === "left" ? -1 : 1;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow={false} dispose={null} material={matPaintBlue}>
        <cylinderGeometry args={[0.35, 0.35, 0.7, 24]} />
      </mesh>
      <mesh
        position={[xOffset * 0.4, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow={false}
        dispose={null}
        material={matPaintDark}
      >
        <cylinderGeometry args={[0.32, 0.32, 0.12, 24]} />
      </mesh>
      <mesh
        position={[xOffset * -0.4, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow={false}
        dispose={null}
        material={matPaintDark}
      >
        <cylinderGeometry args={[0.32, 0.32, 0.12, 24]} />
      </mesh>
      <mesh
        position={[xOffset * 0.55, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow={false}
        dispose={null}
        material={matSteel}
      >
        <cylinderGeometry args={[0.08, 0.08, 0.25, 12]} />
      </mesh>
      <mesh ref={fanRef} position={[xOffset * -0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.5, 0.04, 0.08]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Ignore unused ThreeEvent import pattern for hover callers */
export type MotorPointer = ThreeEvent<PointerEvent>;
