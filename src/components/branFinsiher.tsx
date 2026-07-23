'use client';

/**
 * BranFinisher.tsx - INDUSTRIAL BRAN FINISHER
 * ------------------------------------------------------------------------
 * A highly detailed industrial bran finisher for a flour mill digital twin.
 * This machine recovers remaining flour attached to bran particles using
 * a high-speed rotor and a perforated screen.
 * 
 * Key Features:
 * - Horizontal cylindrical housing with perforated screen visualization
 * - Heavy-duty internal rotor with hammer-style beaters (animated)
 * - Side-mounted drive motor and gearbox
 * - Top feed inlet for bran
 * - Bottom flour collection chute (recovered flour)
 * - End-discharge bran outlet (final bran)
 * - Interactive inspection door
 * - Multi-stream particle animations
 * - Floating PLC data panel
 * 
 * Usage:
 *   import { BranFinisher } from './BranFinisher';
 *   <BranFinisher position={[0, 0, 0]} active={true} />
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
  matSteel,
  matSteelDark,
  matStructureSteel,
} from '../materials';

type V3 = [number, number, number];

const COLORS = {
  housingSteel: '#6b7278',
  housingDark: '#4a5058',
  housingLight: '#8a9199',
  rotorSteel: '#7a8288',
  rotorDark: '#5a6268',
  motorBlue: '#1e3a5f',
  motorDark: '#152a45',
  gearboxGray: '#5a6268',
  frameSteel: '#3a454c',
  frameSteelLight: '#4a555c',
  accentYellow: '#e0a92c',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  flourWhite: '#f5f5f0',
  branBrown: '#8b5a2b',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   SUPPORT FRAME
   ========================================================================== */

function SupportFrame({ length, radius }: { length: number; radius: number }) {
  const legHeight = 1.2;
  const legPositions: V3[] = [
    [length / 2 - 0.25, -legHeight / 2, radius - 0.1],
    [-length / 2 + 0.25, -legHeight / 2, radius - 0.1],
    [length / 2 - 0.25, -legHeight / 2, -(radius - 0.1)],
    [-length / 2 + 0.25, -legHeight / 2, -(radius - 0.1)],
  ];

  return (
    <group>
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow dispose={null} material={matPaintedSteel}>
          <boxGeometry args={[0.18, legHeight, 0.18]} />
        </mesh>
      ))}
      {legPositions.map((pos, i) => (
        <mesh key={`base-${i}`} position={[pos[0], -legHeight / 2 + 0.05, pos[2]]} dispose={null} material={matStructureSteel}>
          <boxGeometry args={[0.35, 0.08, 0.35]} />
        </mesh>
      ))}
      {/* Cross bracing */}
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} castShadow dispose={null} material={matStructureSteel}>
        <boxGeometry args={[length - 0.5, 0.1, 0.1]} />
      </mesh>
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} rotation={[0, Math.PI / 2, 0]} castShadow dispose={null} material={matStructureSteel}>
        <boxGeometry args={[radius * 1.8, 0.1, 0.1]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   MAIN CYLINDRICAL HOUSING & SCREEN
   ========================================================================== */

function MainHousing({ 
  length, radius, isDoorOpen, onDoorToggle 
}: { 
  length: number; radius: number; isDoorOpen: boolean; onDoorToggle: () => void; 
}) {
  const doorRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    const targetRot = isDoorOpen ? -Math.PI / 2.2 : 0;
    if (doorRef.current) {
      doorRef.current.rotation.y = THREE.MathUtils.damp(doorRef.current.rotation.y, targetRot, 4, delta);
    }
  });

  return (
    <group>
      {/* Outer Solid Housing (Top half mostly solid, bottom half allows flour to fall) */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow dispose={null} material={matSteel} scale={hovered ? 1.01 : 1}>
        <cylinderGeometry args={[radius, radius, length, 32, 1, true]} />
      </mesh>

      {/* Perforated Screen Visualization (Wireframe overlay) */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.01]}>
        <cylinderGeometry args={[radius - 0.02, radius - 0.02, length * 0.95, 24, 12, true]} />
        <meshStandardMaterial 
          color={COLORS.housingDark} 
          wireframe 
          transparent 
          opacity={0.6}
        />
      </mesh>

      {/* End Caps */}
      <mesh position={[-length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteelDark}>
        <cylinderGeometry args={[radius, radius, 0.1, 32]} />
      </mesh>
      <mesh position={[length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteelDark}>
        <cylinderGeometry args={[radius, radius, 0.1, 32]} />
      </mesh>

      {/* Reinforcement Rings */}
      {[-length / 3, 0, length / 3].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteelDark}>
          <torusGeometry args={[radius + 0.03, 0.04, 8, 32]} />
        </mesh>
      ))}

      {/* Manufacturer Plate */}
      <mesh position={[0, radius * 0.6, radius + 0.02]} dispose={null} material={matSteel}>
        <boxGeometry args={[length * 0.3, 0.25, 0.01]} />
      </mesh>
      <Text position={[0, radius * 0.6, radius + 0.03]} fontSize={0.06} color={COLORS.frameSteel} anchorX="center" anchorY="middle" fontWeight="bold">
        BRAN FINISHER BF-40
      </Text>

      {/* Interactive Inspection Door */}
      <group
        ref={doorRef}
        position={[0, 0, radius + 0.02]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onDoorToggle(); }}
      >
        <mesh castShadow receiveShadow dispose={null} material={matSteel}>
          <boxGeometry args={[length * 0.4, radius * 1.2, 0.08]} />
        </mesh>
        {/* Door Handle */}
        <mesh position={[length * 0.15, 0, 0.06]} dispose={null} material={matStructureSteel}>
          <boxGeometry args={[0.05, 0.25, 0.05]} />
        </mesh>
        {/* Hinges */}
        {[-0.4, 0.4].map((y, i) => (
          <mesh key={i} position={[-length * 0.2, y * radius, 0]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matStructureSteel}>
            <cylinderGeometry args={[0.04, 0.04, 0.12, 12]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ==========================================================================
   INTERNAL HEAVY-DUTY ROTOR
   ========================================================================== */

function InternalRotor({ length, radius, active }: { length: number; radius: number; active: boolean }) {
  const rotorRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (rotorRef.current && active) {
      // High speed rotation (1450 RPM scaled)
      rotorRef.current.rotation.x += delta * 15;
    }
  });

  // Generate heavy hammer-style beaters
  const beaters = useMemo(() => {
    const items = [];
    const rows = 6;
    const cols = 4;
    for (let i = 0; i < rows; i++) {
      const x = -length / 2 + 0.3 + (i / (rows - 1)) * (length - 0.6);
      for (let j = 0; j < cols; j++) {
        const angle = (j / cols) * Math.PI * 2 + (i % 2) * 0.4; // Offset rows
        items.push({ x, angle, id: `${i}-${j}` });
      }
    }
    return items;
  }, [length]);

  return (
    <group ref={rotorRef}>
      {/* Central Heavy Shaft */}
      <mesh rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.1, 0.1, length * 0.9, 16]} />
      </mesh>

      {/* Hammer Beaters */}
      {beaters.map((b) => {
        const y = Math.cos(b.angle) * (radius * 0.65);
        const z = Math.sin(b.angle) * (radius * 0.65);
        return (
          <group key={b.id} position={[b.x, y, z]} rotation={[0, 0, b.angle]}>
            {/* Beater Arm */}
            <mesh castShadow dispose={null} material={matSteelDark}>
              <boxGeometry args={[0.15, 0.05, radius * 0.5]} />
            </mesh>
            {/* Hammer Head */}
            <mesh position={[0, 0, radius * 0.25]} castShadow dispose={null} material={matSteel}>
              <boxGeometry args={[0.15, 0.12, 0.12]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   DRIVE MOTOR & GEARBOX
   ========================================================================== */

function DriveMotor({ position, active }: { position: V3; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 12;
    }
  });

  return (
    <group
      position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Gearbox */}
      <mesh castShadow dispose={null} material={matPaintDark}>
        <boxGeometry args={[0.45, 0.45, 0.4]} />
      </mesh>

      {/* Motor Body */}
      <mesh position={[0, 0, 0.4]} rotation={[0, 0, Math.PI / 2]} castShadow dispose={null} material={matPaintBlue}>
        <cylinderGeometry args={[0.28, 0.28, 0.6, 24]} />
      </mesh>

      {/* Cooling Fins */}
      {Array.from({ length: 12 }, (_, i) => {
        const z = 0.4 - 0.25 + (i / 11) * 0.5;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matPaintDark}>
            <cylinderGeometry args={[0.3, 0.3, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Fan Cover */}
      <mesh position={[0, 0, 0.72]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matPaintDark}>
        <cylinderGeometry args={[0.26, 0.26, 0.08, 24]} />
      </mesh>

      {/* Fan Blades */}
      <mesh ref={fanRef} position={[0, 0, 0.75]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matStructureSteel}>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 8]} />
      </mesh>

      {/* Shaft Coupling */}
      <mesh position={[0, 0, -0.25]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 16]} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.3, 0.4]}>
        <sphereGeometry args={[0.04, 12, 12]} />
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
   INLET & OUTLETS (Feed, Flour, Bran)
   ========================================================================== */

function InletAndOutlets({ length, radius }: { length: number; radius: number }) {
  return (
    <group>
      {/* Feed Inlet (Top Center) */}
      <mesh position={[0, radius + 0.4, 0]} castShadow dispose={null} material={matSteel}>
        <boxGeometry args={[0.5, 0.8, 0.6]} />
      </mesh>
      <mesh position={[0, radius + 0.82, 0]} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[0.55, 0.06, 0.65]} />
      </mesh>

      {/* Recovered Flour Outlet (Bottom Collection Tray/Chute) */}
      <mesh position={[0, -radius - 0.5, 0]} castShadow dispose={null} material={matSteel}>
        <boxGeometry args={[length * 0.8, 0.6, radius * 1.2]} />
      </mesh>
      <mesh position={[0, -radius - 0.82, 0]} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[length * 0.85, 0.06, radius * 1.25]} />
      </mesh>
      <Text position={[0, -radius - 0.5, radius * 0.65]} fontSize={0.06} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
        RECOVERED FLOUR
      </Text>

      {/* Final Bran Outlet (End Discharge Chute) */}
      <mesh position={[length / 2 + 0.4, -0.1, 0]} castShadow dispose={null} material={matSteelDark}>
        <boxGeometry args={[0.8, 0.6, 0.5]} />
      </mesh>
      <mesh position={[length / 2 + 0.85, -0.1, 0]} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[0.1, 0.65, 0.55]} />
      </mesh>
      <Text position={[length / 2 + 0.4, -0.1, 0.3]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
        FINAL BRAN
      </Text>
    </group>
  );
}

/* ==========================================================================
   DATA PANEL (PLC Data)
   ========================================================================== */

function DataPanel({ position, active }: { position: V3; active: boolean }) {
  const lines = [
    { text: `BRAN FINISHER BF-40`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ${active ? 'RUNNING' : 'STOPPED'}`, size: 0.13, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Rotor RPM: ${active ? '1450' : '0'}`, size: 0.13, color: '#3a3a3a' },
    { text: `Feed Rate: ${active ? '2.5' : '0.0'} TPH`, size: 0.13, color: '#3a3a3a' },
    { text: `Recovered Flour: ${active ? '120' : '0'} kg/h`, size: 0.13, color: '#3a3a3a' },
    { text: `Motor Load: ${active ? '52' : '0'}%`, size: 0.13, color: '#3a3a3a' },
    { text: `Alarm: OFF`, size: 0.13, color: COLORS.accentGreen },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.45, -0.02]}><planeGeometry args={[2.2, 1.8]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -0.45, -0.015]}><planeGeometry args={[2.24, 1.84]} /><meshStandardMaterial color={COLORS.accentYellow} transparent opacity={0.4} side={THREE.DoubleSide} /></mesh>
        {lines.map((line, i) => (
          <Text key={i} position={[-1, -i * 0.22, 0]} fontSize={line.size} color={line.color} anchorX="left" anchorY="top" fontWeight={line.bold ? 'bold' : 'normal'}>
            {line.text}
          </Text>
        ))}
      </group>
    </Float>
  );
}

/* ==========================================================================
   MAIN BRAN FINISHER COMPONENT
   ========================================================================== */

export interface BranFinisherProps {
  position?: V3;
  length?: number;
  radius?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function BranFinisherComponent({
  position = [0, 0, 0],
  length = 2.5,
  radius = 0.65,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
}: BranFinisherProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [isDoorOpen, setIsDoorOpen] = useState(false);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  return (
    <group position={position}>
      {/* 1. Support Frame */}
      <SupportFrame length={length} radius={radius} />

      {/* 2. Main Housing & Screen */}
      <MainHousing 
        length={length} radius={radius} 
        isDoorOpen={isDoorOpen} onDoorToggle={() => setIsDoorOpen(!isDoorOpen)} 
      />

      {/* 3. Internal Rotor */}
      <InternalRotor length={length} radius={radius} active={active} />

      {/* 4. Drive Motor */}
      <DriveMotor position={[length / 2 + 0.6, 0, 0]} active={active} />

      {/* 5. Inlet & Outlets */}
      <InletAndOutlets length={length} radius={radius} />

      {/* 6. Particle Animations */}
      {active && (
        <>
          {/* Bran entering top */}
          <Sparkles count={40} scale={[0.4, 0.6, 0.4]} size={3} speed={2} position={[0, radius + 1, 0]} color={COLORS.branBrown} />
          {/* Recovered flour falling down */}
          <Sparkles count={60} scale={[length * 0.7, 0.8, radius]} size={2} speed={1.5} position={[0, -radius - 0.2, 0]} color={COLORS.flourWhite} />
          {/* Final bran exiting end */}
          <Sparkles count={30} scale={[0.6, 0.4, 0.4]} size={3} speed={2} position={[length / 2 + 1, -0.1, 0]} color={COLORS.branBrown} />
        </>
      )}

      {/* 7. Data Panel */}
      {showDataPanel && (
        <DataPanel position={[0, radius + 1.5, 0]} active={active} />
      )}

      {/* 8. Instructions */}
      {showClickText && (
        <>
          <Text position={[0, 0, radius + 0.6]} fontSize={0.08} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
            {isDoorOpen ? '● DOOR OPEN' : '○ CLICK DOOR TO INSPECT'}
          </Text>
          <Text position={[0, -radius - 1.5, 0]} fontSize={0.08} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
            {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
          </Text>
        </>
      )}

      {/* 9. Invisible Click Target */}
      <mesh position={[0, 0, 0]} onClick={() => setInternalActive(!internalActive)} visible={false}>
        <boxGeometry args={[length + 1.5, radius * 3, radius * 3]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   SCENE EXPORT
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
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.5]} />
      <directionalLight position={[15, 20, 10]} intensity={1.4} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-camera-far={50} />
    </>
  );
}

export function BranFinisherScene() {
  const [active, setActive] = useState(true);
  return (
    <Canvas shadows camera={{ position: [6, 5, 6], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <BranFinisherComponent length={2.5} radius={0.65} active={active} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={3} maxDistance={20} maxPolarAngle={Math.PI / 2.05} target={[0, 0.5, 0]} />
    </Canvas>
  );
}

export function BranFinisher() { return <BranFinisherScene />; }
export default BranFinisher;