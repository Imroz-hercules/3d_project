'use client';

/**
 * Scourer.tsx - INDUSTRIAL WHEAT SCOURER
 * ------------------------------------------------------------------------
 * A realistic industrial wheat scourer for a flour mill digital twin.
 * It cleans the surface of the wheat kernel using a high-speed rotor 
 * with beaters inside a cylindrical perforated housing.
 * 
 * Key Features:
 * - Cylindrical main housing with perforated screen simulation
 * - Internal high-speed rotor with beating arms (animated)
 * - Side-mounted drive motor with cooling fan
 * - Top feed inlet and bottom clean grain outlet
 * - Aspiration dust vent on top
 * - Interactive inspection door to view internal beaters
 * - Simulated grain flow and dust extraction particles
 * - Floating PLC data panel
 * 
 * Usage:
 *   import { Scourer } from './Scourer';
 *   <Scourer position={[0, 0, 0]} active={true} />
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import {
  matPaintBlue,
  matPaintDark,
  matPaintedSteel,
  matRailYellow,
  matSteel,
  matSteelDark,
  matStructureSteel,
} from '../materials';

type V3 = [number, number, number];

const COLORS = {
  housingSteel: '#6b7278',
  housingDark: '#4a5058',
  housingLight: '#8a9199',
  rotorSteel: '#8a9199',
  rotorDark: '#5a6268',
  motorBlue: '#1e3a5f',
  motorDark: '#152a45',
  frameSteel: '#4a555c',
  frameSteelDark: '#3a454c',
  dustGray: '#a0a8b0',
  accentYellow: '#e0a92c',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   SUPPORT FRAME
   ========================================================================== */

function SupportFrame({ length, radius }: { length: number; radius: number }) {
  const legHeight = 1.2;
  const legPositions: V3[] = [
    [length / 2 - 0.2, -legHeight / 2, radius - 0.1],
    [-length / 2 + 0.2, -legHeight / 2, radius - 0.1],
    [length / 2 - 0.2, -legHeight / 2, -(radius - 0.1)],
    [-length / 2 + 0.2, -legHeight / 2, -(radius - 0.1)],
  ];

  return (
    <group>
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow dispose={null} material={matPaintedSteel}>
          <boxGeometry args={[0.15, legHeight, 0.15]} />
        </mesh>
      ))}
      {legPositions.map((pos, i) => (
        <mesh key={`base-${i}`} position={[pos[0], -legHeight / 2 + 0.05, pos[2]]} dispose={null} material={matStructureSteel}>
          <boxGeometry args={[0.3, 0.08, 0.3]} />
        </mesh>
      ))}
      {/* Cross bracing */}
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} castShadow dispose={null} material={matPaintedSteel}>
        <boxGeometry args={[length - 0.4, 0.08, 0.08]} />
      </mesh>
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} rotation={[0, Math.PI / 2, 0]} castShadow dispose={null} material={matPaintedSteel}>
        <boxGeometry args={[radius * 1.5, 0.08, 0.08]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   MAIN CYLINDRICAL HOUSING
   ========================================================================== */

function MainHousing({
  length,
  radius,
  isDoorOpen,
  onDoorToggle,
}: {
  length: number;
  radius: number;
  isDoorOpen: boolean;
  onDoorToggle: () => void;
}) {
  const doorRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    const targetRotation = isDoorOpen ? -Math.PI / 2.2 : 0;
    doorRef.current.rotation.y = THREE.MathUtils.damp(
      doorRef.current.rotation.y,
      targetRotation,
      4,
      delta
    );
  });

  return (
    <group>
      {/* Main Cylinder Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow dispose={null} material={matSteel}>
        <cylinderGeometry args={[radius, radius, length, 32]} />
      </mesh>

      {/* Perforated Screen Simulation (Texture detail) */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.01]}>
        <cylinderGeometry args={[radius + 0.01, radius + 0.01, length * 0.9, 32, 1, true]} />
        <meshStandardMaterial 
          color={COLORS.housingDark} 
          metalness={0.7} 
          roughness={0.5} 
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>

      {/* End Caps */}
      <mesh position={[-length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteelDark}>
        <cylinderGeometry args={[radius, radius, 0.1, 32]} />
      </mesh>
      <mesh position={[length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteelDark}>
        <cylinderGeometry args={[radius, radius, 0.1, 32]} />
      </mesh>

      {/* Inspection Door */}
      <group
        ref={doorRef}
        position={[0, 0, radius + 0.02]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onDoorToggle(); }}
      >
        <mesh position={[0, 0, 0]} castShadow receiveShadow dispose={null} material={matSteel} scale={hovered ? 1.01 : 1}>
          <boxGeometry args={[length * 0.4, radius * 1.2, 0.08]} />
        </mesh>
        {/* Door Handle */}
        <mesh position={[length * 0.15, 0, 0.06]} dispose={null} material={matStructureSteel}>
          <boxGeometry args={[0.05, 0.25, 0.05]} />
        </mesh>
        <mesh position={[length * 0.15, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]} dispose={null} material={matStructureSteel}>
          <cylinderGeometry args={[0.03, 0.03, 0.08, 12]} />
        </mesh>
        {/* Hinges */}
        {[-0.4, 0.4].map((y, i) => (
          <mesh key={i} position={[-length * 0.2, y * radius, 0]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matPaintedSteel}>
            <cylinderGeometry args={[0.04, 0.04, 0.12, 12]} />
          </mesh>
        ))}
      </group>

      {/* Warning Label */}
      <mesh position={[0, radius * 0.5, -radius - 0.02]} rotation={[0, Math.PI, 0]} dispose={null} material={matRailYellow}>
        <boxGeometry args={[length * 0.3, 0.2, 0.01]} />
      </mesh>
      <Text
        position={[0, radius * 0.5, -radius - 0.03]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.05}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        ⚠ HIGH SPEED ROTOR
      </Text>
    </group>
  );
}

/* ==========================================================================
   INTERNAL ROTOR & BEATERS
   ========================================================================== */

function InternalRotor({ length, radius, active }: { length: number; radius: number; active: boolean }) {
  const rotorRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (rotorRef.current && active) {
      // Visual representation of 1450 RPM (scaled for visibility)
      rotorRef.current.rotation.x += delta * 15;
    }
  });

  // Generate beaters along the shaft
  const beaters = useMemo(() => {
    const items = [];
    const rows = 6;
    const cols = 4;
    for (let i = 0; i < rows; i++) {
      const x = -length / 2 + 0.3 + (i / (rows - 1)) * (length - 0.6);
      for (let j = 0; j < cols; j++) {
        const angle = (j / cols) * Math.PI * 2;
        items.push({ x, angle, id: `${i}-${j}` });
      }
    }
    return items;
  }, [length]);

  return (
    <group ref={rotorRef}>
      {/* Central Shaft */}
      <mesh rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.08, 0.08, length * 0.9, 16]} />
      </mesh>

      {/* Beaters */}
      {beaters.map((b) => {
        const y = Math.cos(b.angle) * (radius * 0.6);
        const z = Math.sin(b.angle) * (radius * 0.6);
        return (
          <group key={b.id} position={[b.x, y, z]} rotation={[0, 0, b.angle]}>
            <mesh castShadow dispose={null} material={matSteelDark}>
              <boxGeometry args={[0.15, 0.04, radius * 0.5]} />
            </mesh>
            {/* Beater tip */}
            <mesh position={[0, 0, radius * 0.25]} dispose={null} material={matSteel}>
              <boxGeometry args={[0.15, 0.06, 0.08]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   DRIVE MOTOR
   ========================================================================== */

function DriveMotor({ position, active }: { position: V3; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 12;
    }
  });

  return (
    <group position={position}>
      {/* Motor Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow dispose={null} material={matPaintBlue}>
        <cylinderGeometry args={[0.25, 0.25, 0.5, 24]} />
      </mesh>

      {/* Cooling Fins */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = -0.2 + (i / 9) * 0.4;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matPaintDark}>
            <cylinderGeometry args={[0.27, 0.27, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Fan Cover */}
      <mesh position={[0, 0, 0.28]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matPaintDark}>
        <cylinderGeometry args={[0.23, 0.23, 0.06, 24]} />
      </mesh>

      {/* Fan Blades */}
      <mesh ref={fanRef} position={[0, 0, 0.3]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matStructureSteel}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 8]} />
      </mesh>

      {/* Coupling to Rotor */}
      <mesh position={[0, 0, -0.28]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 16]} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.27, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
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
   INLET, OUTLET & DUST VENT
   ========================================================================== */

function InletOutletVent({ length, radius }: { length: number; radius: number }) {
  return (
    <group>
      {/* Feed Inlet (Top Left) */}
      <mesh position={[-length / 3, radius + 0.3, 0]} castShadow dispose={null} material={matSteel}>
        <boxGeometry args={[0.4, 0.6, 0.5]} />
      </mesh>
      <mesh position={[-length / 3, radius + 0.62, 0]} dispose={null} material={matPaintedSteel}>
        <boxGeometry args={[0.45, 0.06, 0.55]} />
      </mesh>

      {/* Clean Grain Outlet (Bottom Right) */}
      <mesh position={[length / 3, -radius - 0.3, 0]} castShadow dispose={null} material={matSteel}>
        <boxGeometry args={[0.4, 0.6, 0.5]} />
      </mesh>
      <mesh position={[length / 3, -radius - 0.62, 0]} dispose={null} material={matPaintedSteel}>
        <boxGeometry args={[0.45, 0.06, 0.55]} />
      </mesh>

      {/* Aspiration Dust Vent (Top Center) */}
      <mesh position={[0, radius + 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 24]} />
      </mesh>
      <mesh position={[0, radius + 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} dispose={null} material={matPaintedSteel}>
        <cylinderGeometry args={[0.23, 0.23, 0.05, 24]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   DATA PANEL (PLC Data)
   ========================================================================== */

function DataPanel({
  position,
  active,
}: {
  position: V3;
  active: boolean;
}) {
  const lines = [
    { text: `WHEAT SCOURER`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ${active ? 'RUNNING' : 'STOPPED'}`, size: 0.13, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Rotor RPM: ${active ? '1450' : '0'}`, size: 0.13, color: '#3a3a3a' },
    { text: `Feed Rate: ${active ? '10' : '0'} TPH`, size: 0.13, color: '#3a3a3a' },
    { text: `Motor Load: ${active ? '48' : '0'}%`, size: 0.13, color: '#3a3a3a' },
    { text: `Bearing Temp: ${active ? '35' : '24'}°C`, size: 0.13, color: '#3a3a3a' },
    { text: `Alarm: OFF`, size: 0.13, color: COLORS.accentGreen },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.4, -0.02]}>
          <planeGeometry args={[2.0, 1.6]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.4, -0.015]}>
          <planeGeometry args={[2.04, 1.64]} />
          <meshStandardMaterial color={COLORS.accentYellow} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {lines.map((line, i) => (
          <Text
            key={i}
            position={[-0.9, -i * 0.22, 0]}
            fontSize={line.size}
            color={line.color}
            anchorX="left"
            anchorY="top"
            fontWeight={line.bold ? 'bold' : 'normal'}
          >
            {line.text}
          </Text>
        ))}
      </group>
    </Float>
  );
}

/* ==========================================================================
   MAIN SCOURER COMPONENT
   ========================================================================== */

export interface ScourerProps {
  position?: V3;
  length?: number;
  radius?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function ScourerComponent({
  position = [0, 0, 0],
  length = 2.0,
  radius = 0.6,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
}: ScourerProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [isDoorOpen, setIsDoorOpen] = useState(false);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  return (
    <group position={position}>
      {/* 1. Support Frame */}
      <SupportFrame length={length} radius={radius} />

      {/* 2. Main Cylindrical Housing */}
      <MainHousing
        length={length}
        radius={radius}
        isDoorOpen={isDoorOpen}
        onDoorToggle={() => setIsDoorOpen(!isDoorOpen)}
      />

      {/* 3. Internal Rotor & Beaters */}
      <InternalRotor length={length} radius={radius} active={active} />

      {/* 4. Drive Motor */}
      <DriveMotor position={[length / 2 + 0.4, 0, 0]} active={active} />

      {/* 5. Inlet, Outlet & Dust Vent */}
      <InletOutletVent length={length} radius={radius} />

      {/* 6. Grain Flow Animation */}
      {active && (
        <Sparkles
          count={60}
          scale={[length * 0.6, radius * 2.5, radius * 0.8]}
          size={3}
          speed={2}
          position={[0, 0, 0]}
          color="#e8d5b5"
        />
      )}

      {/* 7. Dust Extraction Animation */}
      {active && (
        <Sparkles
          count={30}
          scale={[0.3, 0.8, 0.3]}
          size={2}
          speed={1.5}
          position={[0, radius + 0.6, 0]}
          color={COLORS.dustGray}
        />
      )}

      {showDataPanel && (
        <DataPanel
          position={[0, radius + 1.2, 0]}
          active={active}
        />
      )}

      {showClickText && (
        <Text
          position={[0, 0, radius + 0.5]}
          fontSize={0.08}
          color={COLORS.accentCyan}
          anchorX="center"
          anchorY="middle"
        >
          {isDoorOpen ? '● DOOR OPEN' : '○ CLICK DOOR TO INSPECT'}
        </Text>
      )}

      {/* Invisible Click Target for whole machine */}
      <mesh
        position={[0, 0, 0]}
        onClick={() => setInternalActive(!internalActive)}
        visible={false}
      >
        <boxGeometry args={[length + 1, radius * 3, radius * 3]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   ENVIRONMENT
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
        position={[10, 15, 10]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-far={40}
      />
    </>
  );
}

/* ==========================================================================
   EXPORT - SCENE
   ========================================================================== */

export function ScourerScene() {
  const [active, setActive] = useState(true);

  return (
    <Canvas shadows camera={{ position: [5, 4, 5], fov: 45 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <ScourerComponent
        length={2.0}
        radius={0.6}
        active={active}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  );
}

export function Scourer() {
  return <ScourerScene />;
}

export default Scourer;