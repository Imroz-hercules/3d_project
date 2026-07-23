'use client';

/**
 * Dampener.tsx - INDUSTRIAL WHEAT DAMPENER
 * ------------------------------------------------------------------------
 * A realistic industrial wheat dampener for a flour mill digital twin.
 * It adds controlled moisture to wheat before milling by mixing water
 * uniformly with the grain using a rotating shaft with paddles.
 * 
 * Key Features:
 * - Horizontal cylindrical mixing chamber
 * - Internal mixing rotor with paddles (animated)
 * - Water spray manifold with 6 nozzles on top
 * - Water supply pipe with flow indicator
 * - Top feed inlet and bottom outlet
 * - Side-mounted drive motor with gearbox
 * - Support frame with vibration dampers
 * - Water droplet particle effects when active
 * - Grain flow animation
 * - Interactive water flow control
 * - Floating PLC data panel
 * 
 * Usage:
 *   import { Dampener } from './Dampener';
 *   <Dampener position={[0, 0, 0]} active={true} />
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import {
  matPaintBlue,
  matPaintDark,
  matPaintYellow,
  matPaintedSteel,
  matRubber,
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
  gearboxGray: '#5a6268',
  frameSteel: '#4a555c',
  frameSteelDark: '#3a454c',
  waterBlue: '#4a9eff',
  waterPipe: '#7a8288',
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
  const legHeight = 1.3;
  const legPositions: V3[] = [
    [length / 2 - 0.25, -legHeight / 2, radius - 0.15],
    [-length / 2 + 0.25, -legHeight / 2, radius - 0.15],
    [length / 2 - 0.25, -legHeight / 2, -(radius - 0.15)],
    [-length / 2 + 0.25, -legHeight / 2, -(radius - 0.15)],
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
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} castShadow dispose={null} material={matStructureSteel}>
        <boxGeometry args={[length - 0.5, 0.08, 0.08]} />
      </mesh>
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} rotation={[0, Math.PI / 2, 0]} castShadow dispose={null} material={matStructureSteel}>
        <boxGeometry args={[radius * 1.8, 0.08, 0.08]} />
      </mesh>
      {/* Vibration dampers (rubber mounts) */}
      {legPositions.map((pos, i) => (
        <mesh key={`damper-${i}`} position={[pos[0], -legHeight / 2 + 0.15, pos[2]]} dispose={null} material={matRubber}>
          <cylinderGeometry args={[0.08, 0.1, 0.1, 16]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   MAIN CYLINDRICAL HOUSING
   ========================================================================== */

function MainHousing({ length, radius }: { length: number; radius: number }) {
  return (
    <group>
      {/* Main Cylinder Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow dispose={null} material={matSteel}>
        <cylinderGeometry args={[radius, radius, length, 32]} />
      </mesh>

      {/* End Caps */}
      <mesh position={[-length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteelDark}>
        <cylinderGeometry args={[radius, radius, 0.12, 32]} />
      </mesh>
      <mesh position={[length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteelDark}>
        <cylinderGeometry args={[radius, radius, 0.12, 32]} />
      </mesh>

      {/* Reinforcement Rings */}
      {[-length / 3, 0, length / 3].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteelDark}>
          <torusGeometry args={[radius + 0.02, 0.04, 8, 32]} />
        </mesh>
      ))}

      {/* Sight Glass (Inspection Window) */}
      <mesh position={[0, radius * 0.6, radius + 0.01]}>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 24]} />
        <meshPhysicalMaterial
          color="#d4e6ff"
          transparent
          opacity={0.4}
          roughness={0.05}
          transmission={0.7}
          thickness={0.1}
        />
      </mesh>
      {/* Sight glass frame */}
      <mesh position={[0, radius * 0.6, radius + 0.02]} rotation={[Math.PI / 2, 0, 0]} dispose={null} material={matStructureSteel}>
        <torusGeometry args={[0.17, 0.025, 8, 24]} />
      </mesh>

      {/* Warning Label */}
      <mesh position={[0, -radius * 0.5, -radius - 0.02]} rotation={[0, Math.PI, 0]} dispose={null} material={matPaintYellow}>
        <boxGeometry args={[length * 0.3, 0.2, 0.01]} />
      </mesh>
      <Text
        position={[0, -radius * 0.5, -radius - 0.03]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.05}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        ⚠ WATER + GRAIN MIXING
      </Text>
    </group>
  );
}

/* ==========================================================================
   INTERNAL MIXING ROTOR
   ========================================================================== */

function MixingRotor({ length, radius, active }: { length: number; radius: number; active: boolean }) {
  const rotorRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (rotorRef.current && active) {
      rotorRef.current.rotation.x += delta * 12; // ~1450 RPM scaled
    }
  });

  // Generate mixing paddles along the shaft
  const paddles = useMemo(() => {
    const items = [];
    const rows = 8;
    const cols = 3;
    for (let i = 0; i < rows; i++) {
      const x = -length / 2 + 0.4 + (i / (rows - 1)) * (length - 0.8);
      for (let j = 0; j < cols; j++) {
        const angle = (j / cols) * Math.PI * 2 + (i % 2) * 0.3; // Offset every other row
        items.push({ x, angle, id: `${i}-${j}` });
      }
    }
    return items;
  }, [length]);

  return (
    <group ref={rotorRef}>
      {/* Central Shaft */}
      <mesh rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.06, 0.06, length * 0.85, 16]} />
      </mesh>

      {/* Mixing Paddles */}
      {paddles.map((p) => {
        const y = Math.cos(p.angle) * (radius * 0.5);
        const z = Math.sin(p.angle) * (radius * 0.5);
        return (
          <group key={p.id} position={[p.x, y, z]} rotation={[0, 0, p.angle]}>
            <mesh castShadow dispose={null} material={matSteelDark}>
              <boxGeometry args={[0.12, 0.03, radius * 0.45]} />
            </mesh>
            {/* Paddle edge */}
            <mesh position={[0, 0, radius * 0.22]} dispose={null} material={matSteel}>
              <boxGeometry args={[0.12, 0.05, 0.06]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   WATER SPRAY SYSTEM
   ========================================================================== */

function WaterSpraySystem({ length, radius, active }: { length: number; radius: number; active: boolean }) {
  const nozzlePositions = useMemo(() => {
    const items = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const x = -length / 3 + (i / (count - 1)) * (length * 0.66);
      items.push(x);
    }
    return items;
  }, [length]);

  return (
    <group>
      {/* Water Supply Pipe (Vertical) */}
      <mesh position={[0, radius + 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.08, 0.08, 1.0, 24]} />
      </mesh>

      {/* Water Flow Meter */}
      <mesh position={[0, radius + 0.8, 0]} castShadow dispose={null} material={matStructureSteel}>
        <boxGeometry args={[0.2, 0.25, 0.2]} />
      </mesh>
      <mesh position={[0, radius + 0.8, 0.11]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 24]} />
        <meshStandardMaterial
          color={active ? COLORS.waterBlue : '#555555'}
          emissive={active ? COLORS.waterBlue : '#000000'}
          emissiveIntensity={active ? 0.6 : 0}
        />
      </mesh>

      {/* Spray Manifold (Horizontal pipe) */}
      <mesh position={[0, radius + 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.06, 0.06, length * 0.7, 24]} />
      </mesh>

      {/* Spray Nozzles */}
      {nozzlePositions.map((x, i) => (
        <group key={i} position={[x, radius + 0.05, 0]}>
          {/* Nozzle body */}
          <mesh dispose={null} material={matStructureSteel}>
            <cylinderGeometry args={[0.04, 0.05, 0.12, 16]} />
          </mesh>
          {/* Nozzle tip */}
          <mesh position={[0, -0.08, 0]} dispose={null} material={matSteel}>
            <cylinderGeometry args={[0.025, 0.04, 0.04, 16]} />
          </mesh>
        </group>
      ))}

      {/* Water Droplet Particles (when active) */}
      {active && (
        <Sparkles
          count={80}
          scale={[length * 0.6, 0.3, radius * 0.8]}
          size={4}
          speed={2}
          position={[0, radius - 0.1, 0]}
          color={COLORS.waterBlue}
        />
      )}
    </group>
  );
}

/* ==========================================================================
   FEED INLET & OUTLET
   ========================================================================== */

function InletOutlet({ length, radius }: { length: number; radius: number }) {
  return (
    <group>
      {/* Feed Inlet (Top Left) */}
      <mesh position={[-length / 3, radius + 0.35, 0]} castShadow dispose={null} material={matSteel}>
        <boxGeometry args={[0.45, 0.7, 0.55]} />
      </mesh>
      <mesh position={[-length / 3, radius + 0.72, 0]} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[0.5, 0.06, 0.6]} />
      </mesh>

      {/* Outlet (Bottom Right) */}
      <mesh position={[length / 3, -radius - 0.35, 0]} castShadow dispose={null} material={matSteel}>
        <boxGeometry args={[0.45, 0.7, 0.55]} />
      </mesh>
      <mesh position={[length / 3, -radius - 0.72, 0]} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[0.5, 0.06, 0.6]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   DRIVE MOTOR & GEARBOX
   ========================================================================== */

function DriveMotorGearbox({ position, active }: { position: V3; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 10;
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
        <boxGeometry args={[0.4, 0.4, 0.35]} />
      </mesh>

      {/* Motor Body */}
      <mesh position={[0, 0, 0.35]} rotation={[0, 0, Math.PI / 2]} castShadow dispose={null} material={matPaintBlue}>
        <cylinderGeometry args={[0.22, 0.22, 0.5, 24]} />
      </mesh>

      {/* Cooling Fins */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = 0.35 - 0.2 + (i / 9) * 0.4;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matPaintDark}>
            <cylinderGeometry args={[0.24, 0.24, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Fan Cover */}
      <mesh position={[0, 0, 0.62]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matPaintDark}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 24]} />
      </mesh>

      {/* Fan Blades */}
      <mesh ref={fanRef} position={[0, 0, 0.64]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matStructureSteel}>
        <cylinderGeometry args={[0.16, 0.16, 0.02, 8]} />
      </mesh>

      {/* Shaft Coupling */}
      <mesh position={[0, 0, -0.2]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.24, 0.35]}>
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
   DATA PANEL (PLC Data)
   ========================================================================== */

function DataPanel({
  position,
  active,
  waterFlow,
  moistureActual,
}: {
  position: V3;
  active: boolean;
  waterFlow: number;
  moistureActual: number;
}) {
  const lines = [
    { text: `DAMPENER-01`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ${active ? 'RUNNING' : 'STOPPED'}`, size: 0.13, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Water Flow: ${active ? waterFlow.toFixed(1) : '0.0'} L/min`, size: 0.13, color: '#3a3a3a' },
    { text: `Moisture Set: 16.0%`, size: 0.13, color: '#3a3a3a' },
    { text: `Actual Moisture: ${active ? moistureActual.toFixed(1) : '0.0'}%`, size: 0.13, color: '#3a3a3a' },
    { text: `Motor RPM: ${active ? '1450' : '0'}`, size: 0.13, color: '#3a3a3a' },
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
   MAIN DAMPENER COMPONENT
   ========================================================================== */

export interface DampenerProps {
  position?: V3;
  length?: number;
  radius?: number;
  active?: boolean;
  waterFlow?: number;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function DampenerComponent({
  position = [0, 0, 0],
  length = 2.2,
  radius = 0.65,
  active: controlledActive = true,
  waterFlow: controlledWaterFlow = 1.8,
  showDataPanel = true,
  showClickText = true,
}: DampenerProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [waterFlow] = useState(controlledWaterFlow);
  const [moistureActual, setMoistureActual] = useState(15.8);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  // Simulate moisture level approaching setpoint
  useFrame(() => {
    if (active) {
      setMoistureActual((prev) => {
        const target = 16.0;
        const diff = target - prev;
        return prev + diff * 0.01 + (Math.random() - 0.5) * 0.05;
      });
    }
  });

  return (
    <group position={position}>
      {/* 1. Support Frame */}
      <SupportFrame length={length} radius={radius} />

      {/* 2. Main Cylindrical Housing */}
      <MainHousing length={length} radius={radius} />

      {/* 3. Internal Mixing Rotor */}
      <MixingRotor length={length} radius={radius} active={active} />

      {/* 4. Water Spray System */}
      <WaterSpraySystem length={length} radius={radius} active={active} />

      {/* 5. Feed Inlet & Outlet */}
      <InletOutlet length={length} radius={radius} />

      {/* 6. Drive Motor & Gearbox */}
      <DriveMotorGearbox position={[length / 2 + 0.5, 0, 0]} active={active} />

      {/* 7. Grain Flow Animation */}
      {active && (
        <Sparkles
          count={50}
          scale={[length * 0.5, radius * 2.2, radius * 0.7]}
          size={3}
          speed={1.8}
          position={[0, 0, 0]}
          color="#e8d5b5"
        />
      )}

      {showDataPanel && (
        <DataPanel
          position={[0, radius + 1.5, 0]}
          active={active}
          waterFlow={waterFlow}
          moistureActual={moistureActual}
        />
      )}

      {showClickText && (
        <Text
          position={[0, 0, radius + 0.6]}
          fontSize={0.08}
          color={COLORS.accentCyan}
          anchorX="center"
          anchorY="middle"
        >
          {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
        </Text>
      )}

      {/* Invisible Click Target */}
      <mesh
        position={[0, 0, 0]}
        onClick={() => setInternalActive(!internalActive)}
        visible={false}
      >
        <boxGeometry args={[length + 1.2, radius * 3, radius * 3]} />
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.66, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[80, 80, '#5c5c54', '#79796e']} position={[0, -0.65, 0]} />
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

export function DampenerScene() {
  const [active, setActive] = useState(true);

  return (
    <Canvas shadows camera={{ position: [5, 4, 5], fov: 45 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <DampenerComponent
        length={2.2}
        radius={0.65}
        active={active}
        waterFlow={1.8}
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

export function Dampener() {
  return <DampenerScene />;
}

export default Dampener;