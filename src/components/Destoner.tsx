'use client';

/**
 * Destoner.tsx — HIGH-FIDELITY INDUSTRIAL DESTONER
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, flanged inlet/outlet spouts, interactive inspection 
 * doors with gaskets, robust I-beam support legs with gussets, and a 
 * high-fidelity eccentric vibration motor.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

/* ==========================================================================
   1. HIGH-FIDELITY PBR MATERIALS
   ========================================================================== */

const matBody = new THREE.MeshPhysicalMaterial({
  color: '#b8c0c8',
  metalness: 0.6,
  roughness: 0.4,
  clearcoat: 0.35,
  clearcoatRoughness: 0.4,
});

const matBodyDark = new THREE.MeshStandardMaterial({
  color: '#6b7278',
  metalness: 0.75,
  roughness: 0.45,
});

const matStructure = new THREE.MeshStandardMaterial({
  color: '#4a5058',
  metalness: 0.82,
  roughness: 0.5,
});

const matBolt = new THREE.MeshStandardMaterial({
  color: '#2a2e32',
  metalness: 0.92,
  roughness: 0.28,
});

const matMotor = new THREE.MeshPhysicalMaterial({
  color: '#1e3a5f',
  metalness: 0.6,
  roughness: 0.4,
  clearcoat: 0.25,
});

const matMotorDark = new THREE.MeshStandardMaterial({
  color: '#152a45',
  metalness: 0.65,
  roughness: 0.45,
});

const matSafety = new THREE.MeshStandardMaterial({
  color: '#e0a92c',
  metalness: 0.5,
  roughness: 0.6,
});

const matGasket = new THREE.MeshStandardMaterial({
  color: '#1a1a1a',
  metalness: 0.0,
  roughness: 0.95,
});

const matRubber = new THREE.MeshStandardMaterial({
  color: '#1a1a1a',
  metalness: 0.1,
  roughness: 0.9,
});

const COLORS = {
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   2. DETAIL HELPERS
   ========================================================================== */

/** Realistic hex bolt with shank, head, and top highlight */
function Bolt({ position, rotation = [0, 0, 0] as V3, size = 0.02 }: { position: V3; rotation?: V3; size?: number }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={matBolt}>
        <cylinderGeometry args={[size * 0.6, size * 0.6, size * 1.5, 12]} />
      </mesh>
      <mesh position={[0, size * 0.8, 0]} material={matBolt}>
        <cylinderGeometry args={[size, size, size * 0.5, 6]} />
      </mesh>
      <mesh position={[0, size * 1.05, 0]} material={matBodyDark}>
        <cylinderGeometry args={[size * 0.7, size * 0.7, size * 0.05, 6]} />
      </mesh>
    </group>
  );
}

/** Bolt circle for flanges */
function BoltCircle({ radius, count, y = 0, z = 0, size = 0.02, rotation = [0, 0, 0] as V3 }: { radius: number; count: number; y?: number; z?: number; size?: number; rotation?: V3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <Bolt
            key={i}
            position={[Math.cos(a) * radius, y, Math.sin(a) * radius + z]}
            rotation={rotation}
            size={size}
          />
        );
      })}
    </>
  );
}

/* ==========================================================================
   3. INTERACTIVE INSPECTION DOOR
   ========================================================================== */

function InspectionDoor({ position, rotation, width, height }: { position: V3; rotation: V3; width: number; height: number }) {
  const doorRef = useRef<THREE.Group>(null!);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const targetAngle = open ? -Math.PI * 0.65 : 0;

  useFrame((_, delta) => {
    if (doorRef.current) {
      doorRef.current.rotation.y = THREE.MathUtils.damp(doorRef.current.rotation.y, targetAngle, 5, delta);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh material={matStructure}>
        <boxGeometry args={[0.05, height, width]} />
      </mesh>
      {/* Gasket */}
      <mesh position={[rotation[1] === Math.PI ? -0.03 : 0.03, 0, 0]} material={matGasket}>
        <boxGeometry args={[0.02, height - 0.08, width - 0.08]} />
      </mesh>
      {/* Hinged Door */}
      <group ref={doorRef} position={[rotation[1] === Math.PI ? -0.04 : 0.04, 0, -width / 2]}>
        <mesh
          position={[0, 0, width / 2]}
          castShadow
          material={hovered ? matSafety : matBody}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
          onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); setOpen((o) => !o); }}
        >
          <boxGeometry args={[0.04, height - 0.04, width - 0.04]} />
        </mesh>
        {/* Handle */}
        <mesh position={[rotation[1] === Math.PI ? -0.05 : 0.05, 0, width * 0.35]} material={matStructure}>
          <boxGeometry args={[0.04, 0.15, 0.04]} />
        </mesh>
        {/* Hinges */}
        {[-height * 0.35, height * 0.35].map((y, i) => (
          <mesh key={i} position={[rotation[1] === Math.PI ? -0.04 : 0.04, y, 0]} rotation={[0, Math.PI / 2, 0]} material={matStructure}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 12]} />
          </mesh>
        ))}
      </group>
      {/* Frame bolts */}
      {[[-height * 0.4, -width * 0.4], [height * 0.4, -width * 0.4], [-height * 0.4, width * 0.4], [height * 0.4, width * 0.4]].map(([y, z], i) => (
        <Bolt key={i} position={[rotation[1] === Math.PI ? -0.04 : 0.04, y, z]} rotation={[0, Math.PI / 2, 0]} size={0.016} />
      ))}
    </group>
  );
}

/* ==========================================================================
   4. STATIC SUPPORT FRAME (I-beam legs, base plates, gussets, bracing)
   ========================================================================== */

function StaticFrame({ length, width, frameHeight }: { length: number; width: number; frameHeight: number }) {
  const inset = 0.25;
  const legPositions: V3[] = [
    [length / 2 - inset, frameHeight / 2, width / 2 - inset],
    [-length / 2 + inset, frameHeight / 2, width / 2 - inset],
    [length / 2 - inset, frameHeight / 2, -width / 2 + inset],
    [-length / 2 + inset, frameHeight / 2, -width / 2 + inset],
  ];

  const Beam = ({ start, end, radius = 0.05 }: { start: V3; end: V3; radius?: number }) => {
    const startV = new THREE.Vector3(...start);
    const endV = new THREE.Vector3(...end);
    const mid = startV.clone().add(endV).multiplyScalar(0.5);
    const dir = endV.clone().sub(startV);
    const len = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return (
      <mesh position={mid.toArray() as V3} quaternion={quat} castShadow material={matStructure}>
        <cylinderGeometry args={[radius, radius, len, 8]} />
      </mesh>
    );
  };

  const topY = frameHeight;
  const corners: V3[] = legPositions.map((p) => [p[0], topY, p[2]]);

  return (
    <group>
      {legPositions.map((pos, i) => {
        const gussetY = frameHeight - 0.25;
        return (
          <group key={i}>
            {/* I-beam leg simulation */}
            <mesh position={pos} castShadow material={matStructure}>
              <boxGeometry args={[0.14, frameHeight, 0.14]} />
            </mesh>
            <mesh position={pos} material={matStructure}>
              <boxGeometry args={[0.16, frameHeight, 0.05]} />
            </mesh>
            <mesh position={pos} material={matStructure}>
              <boxGeometry args={[0.05, frameHeight, 0.16]} />
            </mesh>

            {/* Base plate */}
            <mesh position={[pos[0], 0.04, pos[2]]} castShadow material={matStructure}>
              <boxGeometry args={[0.35, 0.08, 0.35]} />
            </mesh>

            {/* Anchor bolts */}
            {[-0.12, 0.12].map((dx) =>
              [-0.12, 0.12].map((dz) => (
                <Bolt key={`${dx}-${dz}`} position={[pos[0] + dx, 0.09, pos[2] + dz]} size={0.018} />
              ))
            )}

            {/* Top gusset plate */}
            <mesh position={[pos[0] * 0.85, gussetY, pos[2] * 0.85]} castShadow material={matStructure}>
              <boxGeometry args={[0.22, 0.3, 0.05]} />
            </mesh>
          </group>
        );
      })}

      {/* Top rectangular ring */}
      <Beam start={corners[0]} end={corners[1]} radius={0.06} />
      <Beam start={corners[2]} end={corners[3]} radius={0.06} />
      <Beam start={corners[0]} end={corners[2]} radius={0.06} />
      <Beam start={corners[1]} end={corners[3]} radius={0.06} />

      {/* Diagonal cross bracing */}
      <Beam start={[corners[0][0], frameHeight - 0.2, corners[0][2]]} end={[corners[3][0], frameHeight - 0.2, corners[3][2]]} radius={0.045} />
      <Beam start={[corners[1][0], frameHeight - 0.2, corners[1][2]]} end={[corners[2][0], frameHeight - 0.2, corners[2][2]]} radius={0.045} />
    </group>
  );
}

/* ==========================================================================
   5. RUBBER SPRING MOUNTS
   ========================================================================== */

function RubberMounts({ length, width, y, springHeight = 0.5 }: { length: number; width: number; y: number; springHeight?: number }) {
  const positions: V3[] = [
    [length / 2 - 0.4, y + springHeight / 2, width / 2 - 0.4],
    [-length / 2 + 0.4, y + springHeight / 2, width / 2 - 0.4],
    [length / 2 - 0.4, y + springHeight / 2, -width / 2 + 0.4],
    [-length / 2 + 0.4, y + springHeight / 2, -width / 2 + 0.4],
  ];

  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Rubber spring body */}
          <mesh castShadow material={matRubber}>
            <cylinderGeometry args={[0.13, 0.16, springHeight, 16]} />
          </mesh>
          {/* Steel retaining rings */}
          {[-springHeight / 2 + 0.08, 0, springHeight / 2 - 0.08].map((ry, j) => (
            <mesh key={j} position={[0, ry, 0]} material={matStructure}>
              <torusGeometry args={[0.14, 0.014, 8, 16]} />
            </mesh>
          ))}
          {/* Top + bottom spring caps */}
          <mesh position={[0, springHeight / 2, 0]} material={matStructure}>
            <cylinderGeometry args={[0.16, 0.16, 0.03, 16]} />
          </mesh>
          <mesh position={[0, -springHeight / 2, 0]} material={matStructure}>
            <cylinderGeometry args={[0.16, 0.16, 0.03, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   6. VIBRATING DECK (Enhanced with seams, ribs, flanges, doors)
   ========================================================================== */

function VibratingDeck({
  length,
  width,
  deckThickness,
  active,
  hovered,
  onHover,
}: {
  length: number;
  width: number;
  deckThickness: number;
  active: boolean;
  hovered: boolean;
  onHover: (v: boolean) => void;
}) {
  const deckRef = useRef<THREE.Group>(null!);
  const angle = 0.12; // ~7 degrees slope

  useFrame(({ clock }) => {
    if (!deckRef.current) return;
    if (active) {
      const t = clock.elapsedTime * 50;
      deckRef.current.position.x = Math.sin(t) * 0.006;
      deckRef.current.position.y = Math.cos(t * 1.2) * 0.003;
      deckRef.current.rotation.z = Math.sin(t * 0.8) * 0.002;
    } else {
      deckRef.current.position.x = THREE.MathUtils.damp(deckRef.current.position.x, 0, 5, 0.016);
      deckRef.current.position.y = THREE.MathUtils.damp(deckRef.current.position.y, 0, 5, 0.016);
      deckRef.current.rotation.z = THREE.MathUtils.damp(deckRef.current.rotation.z, 0, 5, 0.016);
    }
  });

  return (
    <group ref={deckRef} rotation={[0, 0, angle]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(false); }}
    >
      {/* Main deck body */}
      <mesh castShadow receiveShadow material={matBody} scale={hovered ? 1.005 : 1}>
        <boxGeometry args={[length, deckThickness, width]} />
      </mesh>

      {/* Vertical & horizontal panel seams */}
      {[-length * 0.33, 0, length * 0.33].map((x, i) =>
        [width / 2 + 0.01, -(width / 2 + 0.01)].map((z, j) => (
          <mesh key={`seam-v-${i}-${j}`} position={[x, 0, z]} material={matBodyDark}>
            <boxGeometry args={[0.015, deckThickness * 0.9, 0.02]} />
          </mesh>
        ))
      )}

      {/* Horizontal stiffener ribs with bolts */}
      {[-deckThickness * 0.25, deckThickness * 0.25].map((y, i) => (
        <group key={`rib-${i}`}>
          <mesh position={[0, y, width / 2 + 0.01]} material={matStructure}>
            <boxGeometry args={[length * 0.96, 0.05, 0.025]} />
          </mesh>
          <mesh position={[0, y, -width / 2 - 0.01]} material={matStructure}>
            <boxGeometry args={[length * 0.96, 0.05, 0.025]} />
          </mesh>
          {[-length * 0.4, 0, length * 0.4].map((x) => (
            <Bolt key={`f-${x}`} position={[x, y, width / 2 + 0.025]} size={0.016} />
          ))}
          {[-length * 0.4, 0, length * 0.4].map((x) => (
            <Bolt key={`b-${x}`} position={[x, y, -width / 2 - 0.025]} rotation={[0, Math.PI, 0]} size={0.016} />
          ))}
        </group>
      ))}

      {/* Interactive Inspection Doors */}
      <InspectionDoor position={[0, 0, width / 2 + 0.02]} rotation={[0, 0, 0]} width={length * 0.35} height={deckThickness * 2.5} />
      <InspectionDoor position={[0, 0, -(width / 2 + 0.02)]} rotation={[0, Math.PI, 0]} width={length * 0.35} height={deckThickness * 2.5} />

      {/* Feed Inlet (Top end, X = -length/2) with flange */}
      <mesh position={[-length / 2 - 0.3, deckThickness / 2 + 0.15, 0]} castShadow material={matBody}>
        <boxGeometry args={[0.6, 0.5, width * 0.6]} />
      </mesh>
      <mesh position={[-length / 2 - 0.6, deckThickness / 2 + 0.4, 0]} material={matStructure}>
        <boxGeometry args={[0.08, 0.1, width * 0.65]} />
      </mesh>
      {/* Inlet flange bolts */}
      {[-width * 0.25, width * 0.25].map((z) => (
        <Bolt key={`in-${z}`} position={[-length / 2 - 0.64, deckThickness / 2 + 0.4, z]} rotation={[0, 0, Math.PI / 2]} size={0.018} />
      ))}

      {/* Clean Grain Outlet (Lower end, X = length/2, Z = 0) with flange */}
      <mesh position={[length / 2 + 0.2, -deckThickness / 2 - 0.1, 0]} castShadow material={matBody}>
        <boxGeometry args={[0.5, 0.4, width * 0.7]} />
      </mesh>
      <mesh position={[length / 2 + 0.45, -deckThickness / 2 - 0.3, 0]} material={matStructure}>
        <boxGeometry args={[0.08, 0.1, width * 0.75]} />
      </mesh>
      <BoltCircle radius={width * 0.35} count={6} y={-deckThickness / 2 - 0.3} z={0} size={0.018} rotation={[0, 0, Math.PI / 2]} />

      {/* Stone Outlet (Bottom end, X = length/2, Z = -width/2 + offset) with flange */}
      <mesh position={[length / 2 + 0.15, -deckThickness / 2 - 0.2, -width / 2 + 0.3]} castShadow material={matBodyDark}>
        <boxGeometry args={[0.4, 0.3, width * 0.25]} />
      </mesh>
      <mesh position={[length / 2 + 0.35, -deckThickness / 2 - 0.35, -width / 2 + 0.3]} material={matStructure}>
        <boxGeometry args={[0.08, 0.08, width * 0.3]} />
      </mesh>
      <BoltCircle radius={width * 0.15} count={4} y={-deckThickness / 2 - 0.35} z={-width / 2 + 0.3} size={0.016} rotation={[0, 0, Math.PI / 2]} />

      {/* Aspiration Hood (Top duct) with flange */}
      <mesh position={[0, deckThickness / 2 + 0.2, 0]} castShadow material={matBodyDark}>
        <boxGeometry args={[length * 0.7, 0.4, width * 0.7]} />
      </mesh>
      {/* Aspiration duct pipe */}
      <mesh position={[0, deckThickness / 2 + 0.6, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={matBody}>
        <cylinderGeometry args={[0.25, 0.25, 0.5, 24]} />
      </mesh>
      {/* Duct flange */}
      <mesh position={[0, deckThickness / 2 + 0.85, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <torusGeometry args={[0.28, 0.03, 8, 24]} />
      </mesh>
      <BoltCircle radius={0.28} count={8} y={deckThickness / 2 + 0.85} z={0} size={0.016} rotation={[Math.PI / 2, 0, 0]} />

      {/* Motor mounting plate */}
      <mesh position={[0, -deckThickness / 2 - 0.05, width / 2 + 0.1]} castShadow material={matStructure}>
        <boxGeometry args={[0.6, 0.3, 0.15]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   7. DRIVE MOTOR (High-fidelity eccentric motor)
   ========================================================================== */

function DriveMotor({ position, active }: { position: V3; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 15;
    }
  });

  return (
    <group position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Motor body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={hovered ? matMotor : matMotor}>
        <cylinderGeometry args={[0.2, 0.2, 0.5, 24]} />
      </mesh>

      {/* Cooling fins */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = -0.2 + (i / 9) * 0.4;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
            <cylinderGeometry args={[0.22, 0.22, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Terminal box */}
      <mesh position={[0, 0.22, 0]} material={matMotorDark}>
        <boxGeometry args={[0.12, 0.08, 0.14]} />
      </mesh>

      {/* Fan cover & blades */}
      <mesh position={[0, 0, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow material={matMotorDark}>
        <cylinderGeometry args={[0.18, 0.18, 0.06, 24]} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.33]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 8]} />
      </mesh>

      {/* Eccentric weight housing */}
      <mesh position={[0, 0, -0.3]} rotation={[0, 0, Math.PI / 2]} castShadow material={matStructure}>
        <cylinderGeometry args={[0.14, 0.14, 0.12, 16]} />
      </mesh>

      {/* Status indicator */}
      <mesh position={[0, 0.22, 0.08]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={active ? COLORS.accentGreen : COLORS.accentRed} emissive={active ? COLORS.accentGreen : COLORS.accentRed} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   8. DATA PANEL
   ========================================================================== */

function DataPanel({ position, active, rpm, airflow, label }: { position: V3; active: boolean; rpm: number; airflow: number; label: string }) {
  const lines = [
    { text: `DESTONER`, size: 0.18, color: '#1c1c1c', bold: true },
    { text: `ID: ${label}`, size: 0.14, color: '#3a3a3a' },
    { text: `Status: ${active ? '● RUNNING' : '○ STOPPED'}`, size: 0.14, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Motor RPM: ${active ? rpm.toFixed(0) : '0'}`, size: 0.14, color: '#3a3a3a' },
    { text: `Airflow: ${active ? airflow.toFixed(0) : '0'} m³/h`, size: 0.14, color: '#3a3a3a' },
    { text: `Throughput: ${active ? '8.5' : '0.0'} t/h`, size: 0.14, color: '#3a3a3a' },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.4, -0.02]}>
          <planeGeometry args={[2.2, 1.6]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.4, -0.015]}>
          <planeGeometry args={[2.24, 1.64]} />
          <meshStandardMaterial color={COLORS.accentYellow} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {lines.map((line, i) => (
          <Text key={i} position={[-1, -i * 0.26, 0]} fontSize={line.size} color={line.color} anchorX="left" anchorY="top" fontWeight={line.bold ? 'bold' : 'normal'}>
            {line.text}
          </Text>
        ))}
      </group>
    </Float>
  );
}

/* ==========================================================================
   9. MAIN DESTONER COMPONENT
   ========================================================================== */

export interface DestonerProps {
  position?: V3;
  width?: number;
  depth?: number; // Kept for backward compatibility, maps to deckThickness
  length?: number;
  rpm?: number;
  airflow?: number;
  active?: boolean;
  label?: string;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function DestonerComponent({
  position = [0, 0, 0],
  width = 1.8,
  depth = 1.2, // Legacy prop, we'll use it as deckThickness
  length = 3.5,
  rpm = 900,
  airflow = 4500,
  active: controlledActive,
  label = 'DESTONER-01',
  showDataPanel = true,
  showClickText = true,
}: DestonerProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [bodyHovered, setBodyHovered] = useState(false);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  const frameHeight = 1.2;
  const springHeight = 0.5;
  const springY = frameHeight / 2;
  const deckY = springY + springHeight / 2 + 0.25; // Deck center Y

  return (
    <group position={position}>
      {/* Static Base Frame */}
      <StaticFrame length={length} width={width} frameHeight={frameHeight} />

      {/* Rubber Spring Mounts */}
      <RubberMounts length={length} width={width} y={springY} springHeight={springHeight} />

      {/* Vibrating Deck + motor elevated onto frame */}
      <group position={[0, deckY, 0]}>
        <VibratingDeck
          length={length}
          width={width}
          deckThickness={depth}
          active={active}
          hovered={bodyHovered}
          onHover={setBodyHovered}
        />
        <DriveMotor position={[0, -depth / 2 - 0.1, width / 2 + 0.35]} active={active} />
      </group>

      {showDataPanel && (
        <DataPanel position={[length / 2 + 1.8, deckY + 1, 0]} active={active} rpm={rpm} airflow={airflow} label={label} />
      )}

      {showClickText && (
        <Text position={[0, deckY + 2.5, 0]} fontSize={0.12} color={COLORS.accentYellow} anchorX="center" anchorY="middle">
          {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
        </Text>
      )}

      {/* Invisible click target */}
      {controlledActive === undefined && (
        <mesh position={[0, deckY, 0]} onClick={() => setInternalActive(!internalActive)} visible={false}>
          <boxGeometry args={[length * 1.5, 2.5, width * 1.5]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  );
}

/* ==========================================================================
   10. ENVIRONMENT & EXPORT
   ========================================================================== */

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.61, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[80, 80, '#5c5c54', '#79796e']} position={[0, -0.6, 0]} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.5]} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-far={50}
        shadow-bias={-0.0001}
      />
    </>
  );
}

export function DestonerScene() {
  const [active, setActive] = useState(false);

  return (
    <Canvas shadows camera={{ position: [8, 6, 8], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <DestonerComponent length={3.5} width={1.8} depth={0.5} rpm={900} airflow={4500} active={active} label="DESTONER-01" />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={4} maxDistance={25} maxPolarAngle={Math.PI / 2.05} target={[0, 1, 0]} />
    </Canvas>
  );
}

export function Destoner() {
  return <DestonerScene />;
}

export default Destoner;