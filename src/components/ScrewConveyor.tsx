'use client';

/**
 * ScrewConveyor.tsx — floor-mounted U-trough screw conveyor (reference style).
 * Low-profile channel (350 mm), 3 m run, drive motor at discharge end.
 */

import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

const COLORS = {
  troughSteel: '#7a8288',
  troughDark: '#5a6268',
  troughLight: '#959ca3',
  flangeSteel: '#8a9199',
  augerSteel: '#9aa2a8',
  augerDark: '#5a6268',
  motorBlue: '#1e3a5f',
  motorBlueDark: '#152a45',
  gearboxGray: '#5a6268',
  boltSteel: '#3a4045',
  coverSteel: '#8a9199',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
} as const;

/* ==========================================================================
   U-TROUGH — open-top channel along +X
   ========================================================================== */

function UTrough({ length, width, height }: { length: number; width: number; height: number }) {
  const wall = 0.04;
  const bottomY = height / 2;

  return (
    <group>
      {/* Bottom */}
      <mesh position={[length / 2, bottomY, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, wall, width]} />
        <meshStandardMaterial color={COLORS.troughDark} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Left / right walls */}
      <mesh position={[length / 2, bottomY + height / 2, width / 2 - wall / 2]} castShadow>
        <boxGeometry args={[length, height, wall]} />
        <meshStandardMaterial color={COLORS.troughSteel} metalness={0.65} roughness={0.42} />
      </mesh>
      <mesh position={[length / 2, bottomY + height / 2, -(width / 2 - wall / 2)]} castShadow>
        <boxGeometry args={[length, height, wall]} />
        <meshStandardMaterial color={COLORS.troughSteel} metalness={0.65} roughness={0.42} />
      </mesh>
      {/* Hinged cover panels */}
      <mesh position={[length / 2, bottomY + height + wall / 2, 0]} castShadow>
        <boxGeometry args={[length * 0.96, wall, width * 0.92]} />
        <meshStandardMaterial color={COLORS.coverSteel} metalness={0.55} roughness={0.48} />
      </mesh>
      {/* End plate — inlet */}
      <mesh position={[0.02, bottomY + height / 2, 0]} castShadow>
        <boxGeometry args={[wall, height * 0.9, width * 0.9]} />
        <meshStandardMaterial color={COLORS.troughDark} metalness={0.7} roughness={0.38} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   INLET COLLAR — receives material from rotary valve above
   ========================================================================== */

function InletCollar({ width, troughHeight, dropHeight }: { width: number; troughHeight: number; dropHeight: number }) {
  const w = width * 0.85;
  return (
    <group>
      {/* Vertical drop from valve */}
      <mesh position={[0, troughHeight + dropHeight / 2, 0]} castShadow>
        <boxGeometry args={[w, dropHeight, w]} />
        <meshStandardMaterial color={COLORS.troughSteel} metalness={0.65} roughness={0.4} />
      </mesh>
      {/* Inlet flange */}
      <mesh position={[0, troughHeight + dropHeight + 0.025, 0]} castShadow>
        <cylinderGeometry args={[w * 0.55, w * 0.55, 0.05, 16]} />
        <meshStandardMaterial color={COLORS.flangeSteel} metalness={0.75} roughness={0.35} />
      </mesh>
      {/* Transition into trough */}
      <mesh position={[0, troughHeight + 0.02, 0]} castShadow>
        <boxGeometry args={[w * 0.9, 0.06, w * 0.9]} />
        <meshStandardMaterial color={COLORS.troughLight} metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   AUGER — horizontal shaft along +X
   ========================================================================== */

function AugerScrew({
  length,
  radius,
  troughHeight,
  active,
  rpm,
}: {
  length: number;
  radius: number;
  troughHeight: number;
  active: boolean;
  rpm: number;
}) {
  const ref = useRef<THREE.Group>(null!);
  const segments = Math.max(18, Math.floor(length * 8));
  const turns = length / (radius * 2.2);
  const shaftY = troughHeight / 2 + 0.04;

  useFrame((_, delta) => {
    if (ref.current && active) {
      ref.current.rotation.x += (rpm / 60) * Math.PI * 2 * delta;
    }
  });

  return (
    <group ref={ref} position={[length / 2, shaftY, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[radius * 0.15, radius * 0.15, length * 0.94, 10]} />
        <meshStandardMaterial color={COLORS.augerDark} metalness={0.85} roughness={0.25} />
      </mesh>
      {Array.from({ length: segments }, (_, i) => {
        const t = i / segments;
        const x = t * length - length / 2;
        const angle = t * turns * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[x, Math.cos(angle) * radius * 0.5, Math.sin(angle) * radius * 0.5]}
            rotation={[angle, 0, 0]}
            castShadow
          >
            <boxGeometry args={[length / segments + 0.015, 0.025, radius * 0.95]} />
            <meshStandardMaterial color={COLORS.augerSteel} metalness={0.8} roughness={0.3} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   DRIVE MOTOR — mounted on +Z side at discharge end (reference)
   ========================================================================== */

function DriveMotor({
  position,
  active,
  rpm,
}: {
  position: V3;
  active: boolean;
  rpm: number;
}) {
  const fanRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.x += (rpm / 60) * Math.PI * 2 * delta * 1.5;
    }
  });

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.18, 0.22, 0.2]} />
        <meshStandardMaterial color={COLORS.gearboxGray} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.32, 16]} />
        <meshStandardMaterial color={COLORS.motorBlue} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.015, 6]} />
        <meshStandardMaterial color={COLORS.motorBlueDark} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.13, 0.1]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial
          color={active ? COLORS.accentGreen : COLORS.accentRed}
          emissive={active ? COLORS.accentGreen : COLORS.accentRed}
          emissiveIntensity={0.9}
        />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   DISCHARGE SPOUT — circular outlet at end
   ========================================================================== */

function DischargeSpout({ position, width }: { position: V3; width: number }) {
  const r = width * 0.38;
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.12, width * 0.7, width * 0.85]} />
        <meshStandardMaterial color={COLORS.troughSteel} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r, r, 0.06, 20]} />
        <meshStandardMaterial color={COLORS.flangeSteel} metalness={0.75} roughness={0.35} />
      </mesh>
      {/* Open discharge hole */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r * 0.75, r * 0.75, 0.08, 20]} />
        <meshStandardMaterial color={COLORS.troughDark} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   FRAME SKIDS — low supports on ground
   ========================================================================== */

function FrameSkids({ length, width }: { length: number; width: number }) {
  const skidY = 0.03;
  return (
    <>
      {[-length * 0.35, length * 0.35].map((x, i) => (
        <mesh key={i} position={[length / 2 + x, skidY / 2, 0]} castShadow>
          <boxGeometry args={[0.08, skidY, width + 0.1]} />
          <meshStandardMaterial color={COLORS.troughDark} metalness={0.75} roughness={0.4} />
        </mesh>
      ))}
    </>
  );
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export interface ScrewConveyorProps {
  /** Inlet end position (floor level, left end of trough). */
  position?: V3;
  length?: number;
  width?: number;
  troughHeight?: number;
  /** Height of vertical inlet drop from valve. */
  inletDropHeight?: number;
  rpm?: number;
  active?: boolean;
  showLabel?: boolean;
  showInletCollar?: boolean;
  axis?: 'x' | 'z';
  onToggle?: () => void;
}

export function ScrewConveyorComponent({
  position = [0, 0, 0],
  length = 3,
  width = 0.64,
  troughHeight = 0.35,
  inletDropHeight = 0.22,
  rpm = 35,
  active: controlledActive,
  showLabel = false,
  showInletCollar = true,
  axis = 'x',
  onToggle,
}: ScrewConveyorProps) {
  const [internalActive, setInternalActive] = useState(true);
  const active = controlledActive !== undefined ? controlledActive : internalActive;
  const augerRadius = width * 0.36;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onToggle) onToggle();
    else setInternalActive(!internalActive);
  };

  return (
    <group
      position={position}
      rotation={axis === 'z' ? [0, Math.PI / 2, 0] : [0, 0, 0]}
      onClick={handleClick}
    >
      <FrameSkids length={length} width={width} />
      <UTrough length={length} width={width} height={troughHeight} />
      <AugerScrew
        length={length}
        radius={augerRadius}
        troughHeight={troughHeight}
        active={active}
        rpm={rpm}
      />

      {showInletCollar && (
        <InletCollar width={width} troughHeight={troughHeight} dropHeight={inletDropHeight} />
      )}

      <DischargeSpout
        position={[length, troughHeight / 2 + 0.04, 0]}
        width={width}
      />

      <DriveMotor
        position={[length - 0.15, troughHeight / 2 + 0.05, width / 2 + 0.18]}
        active={active}
        rpm={rpm}
      />

      {showLabel && (
        <Text
          position={[length / 2, troughHeight + 0.35, 0]}
          fontSize={0.08}
          color={COLORS.accentCyan}
          anchorX="center"
          anchorY="middle"
        >
          {active ? '● SCREW RUNNING' : '○ SCREW STOPPED'}
        </Text>
      )}
    </group>
  );
}

/** World X of discharge end. */
export function screwConveyorDischargeX(inletX: number, length: number) {
  return inletX + length;
}

export default ScrewConveyorComponent;
