import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { matRailYellow, matRubber, matSteel, matStructureSteel } from '../../materials';

type V3 = [number, number, number];

/**
 * Shared interactive inspection door: hinged panel with damped swing,
 * hover highlight (safety yellow), gasket, handle, hinges, and frame bolts.
 * Controlled (isOpen/onToggle) or uncontrolled (internal state).
 */
export function InspectionDoor({
  position,
  rotation = [0, 0, 0],
  width,
  height,
  isOpen,
  onToggle,
}: {
  position: V3;
  rotation?: V3;
  width: number;
  height: number;
  isOpen?: boolean;
  onToggle?: () => void;
}) {
  const doorRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  const open = isOpen ?? internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen((o) => !o));
  const targetAngle = open ? -Math.PI * 0.65 : 0;
  const sideSign = rotation[1] === Math.PI ? -1 : 1;

  useFrame((_, delta) => {
    if (doorRef.current) {
      doorRef.current.rotation.y = THREE.MathUtils.damp(
        doorRef.current.rotation.y,
        targetAngle,
        5,
        delta
      );
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh castShadow={false} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[0.05, height, width]} />
      </mesh>
      {/* Gasket */}
      <mesh position={[sideSign * 0.03, 0, 0]} castShadow={false} dispose={null} material={matRubber}>
        <boxGeometry args={[0.02, height - 0.08, width - 0.08]} />
      </mesh>
      {/* Hinged panel */}
      <group ref={doorRef} position={[sideSign * 0.04, 0, -width / 2]}>
        <mesh
          position={[0, 0, width / 2]}
          castShadow={false}
          dispose={null}
          material={hovered ? matRailYellow : matSteel}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setHovered(false);
          }}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            toggle();
          }}
        >
          <boxGeometry args={[0.04, height - 0.04, width - 0.04]} />
        </mesh>
        {/* Handle */}
        <mesh
          position={[sideSign * 0.05, 0, width * 0.35]}
          castShadow={false}
          dispose={null}
          material={matStructureSteel}
        >
          <boxGeometry args={[0.04, 0.15, 0.04]} />
        </mesh>
        {/* Hinges */}
        {[-height * 0.35, height * 0.35].map((y, i) => (
          <mesh
            key={i}
            position={[sideSign * 0.04, y, 0]}
            rotation={[0, Math.PI / 2, 0]}
            castShadow={false}
            dispose={null}
            material={matStructureSteel}
          >
            <cylinderGeometry args={[0.025, 0.025, 0.06, 12]} />
          </mesh>
        ))}
      </group>
      {/* Frame corner bolts */}
      {(
        [
          [-height * 0.4, -width * 0.4],
          [height * 0.4, -width * 0.4],
          [-height * 0.4, width * 0.4],
          [height * 0.4, width * 0.4],
        ] as [number, number][]
      ).map(([y, z], i) => (
        <mesh
          key={i}
          position={[sideSign * 0.04, y, z]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow={false}
          dispose={null}
          material={matStructureSteel}
        >
          <cylinderGeometry args={[0.016, 0.016, 0.03, 6]} />
        </mesh>
      ))}
    </group>
  );
}
