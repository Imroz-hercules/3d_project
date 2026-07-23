'use client';

/**
 * RotaryValve.tsx - REALISTIC INDUSTRIAL EDITION (SIZED UP)
 * ------------------------------------------------------------------------
 * Updated with a global 'scale' prop to easily resize the entire assembly
 * (including motor, bolts, and guard) without breaking proportions.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import {
  matPaintBlue,
  matPaintDark,
  matPaintedSteel,
  matSteel,
  matSteelDark,
  matStructureSteel,
  matRailYellow,
} from '../materials';

/* ==========================================================================
   1. TYPES / INDUSTRIAL MATERIAL PALETTE
   ========================================================================== */

type V3 = [number, number, number];

const COLORS = {
  housingGray: '#6b7278',
  housingDark: '#4a5058',
  housingLight: '#8a9199',
  flangeSteel: '#7a8288',
  flangeBright: '#9aa2a8',
  rotorSteel: '#8a9199',
  rotorDark: '#5a6268',
  motorBlue: '#1e3a5f',
  motorBlueDark: '#152a45',
  motorBlueLight: '#2a4a6f',
  gearboxGray: '#5a6268',
  safetyYellow: '#e8a817',
  safetyYellowDark: '#c88a0a',
  boltSteel: '#3a4045',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   2. BOLT HELPER
   ========================================================================== */

function Bolt({ position, size = 0.04 }: { position: V3; size?: number }) {
  return (
    <group position={position}>
      <mesh castShadow dispose={null} material={matSteelDark}>
        <cylinderGeometry args={[size, size, 0.025, 6]} />
      </mesh>
      <mesh position={[0, 0.013, 0]} dispose={null} material={matSteel}>
        <cylinderGeometry args={[size * 0.7, size * 0.7, 0.005, 6]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   3. SQUARE FLANGE
   ========================================================================== */

function SquareFlange({ size, thickness, position, label }: { size: number; thickness: number; position: V3; label?: string }) {
  const boltPositions: V3[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const r = size * 0.42;
    boltPositions.push([Math.cos(angle) * r, 0, Math.sin(angle) * r]);
  }

  return (
    <group position={position}>
      <mesh castShadow receiveShadow dispose={null} material={matSteel}>
        <boxGeometry args={[size, thickness, size]} />
      </mesh>
      <mesh position={[0, thickness / 2 + 0.005, 0]} dispose={null} material={matSteel}>
        <cylinderGeometry args={[size * 0.35, size * 0.35, 0.01, 32]} />
      </mesh>
      {boltPositions.map((pos, i) => <Bolt key={i} position={pos} size={0.035} />)}
      {[
        [size / 2 - 0.05, size / 2 - 0.05], [-size / 2 + 0.05, size / 2 - 0.05],
        [size / 2 - 0.05, -size / 2 + 0.05], [-size / 2 + 0.05, -size / 2 + 0.05],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]} dispose={null} material={matSteelDark}>
          <boxGeometry args={[0.08, thickness + 0.01, 0.08]} />
        </mesh>
      ))}
      {label && (
        <Text position={[0, thickness / 2 + 0.08, size / 2 + 0.05]} fontSize={0.06} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
          {label}
        </Text>
      )}
    </group>
  );
}

/* ==========================================================================
   4. MAIN HOUSING
   ========================================================================== */

function MainHousing({ width, height, depth, hovered }: { width: number; height: number; depth: number; hovered: boolean }) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={hovered ? COLORS.housingLight : COLORS.housingGray}
          metalness={0.65} roughness={0.45}
          emissive={hovered ? COLORS.accentCyan : '#000000'}
          emissiveIntensity={hovered ? 0.1 : 0}
        />
      </mesh>
      <mesh position={[-width / 2 - depth / 2 + 0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow dispose={null} material={matSteel}>
        <cylinderGeometry args={[height / 2, height / 2, depth * 0.9, 24]} />
      </mesh>
      <mesh position={[width / 2 + depth / 2 - 0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow dispose={null} material={matSteel}>
        <cylinderGeometry args={[height / 2, height / 2, depth * 0.9, 24]} />
      </mesh>
      {[-height * 0.25, 0, height * 0.25].map((y, i) => (
        <mesh key={i} position={[0, y, depth / 2 + 0.005]} dispose={null} material={matSteelDark}>
          <boxGeometry args={[width * 0.95, 0.02, 0.015]} />
        </mesh>
      ))}
      <mesh position={[0, height * 0.15, depth / 2 + 0.01]} dispose={null} material={matSteel}>
        <boxGeometry args={[width * 0.3, height * 0.15, 0.005]} />
      </mesh>
      <Text position={[0, height * 0.15, depth / 2 + 0.02]} fontSize={0.05} color={COLORS.boltSteel} anchorX="center" anchorY="middle">RV-250</Text>
      <mesh position={[0, 0, depth / 2 + 0.01]} dispose={null} material={matSteelDark}>
        <cylinderGeometry args={[height * 0.25, height * 0.25, 0.02, 24]} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const r = height * 0.28;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r, depth / 2 + 0.02]} dispose={null} material={matSteelDark}>
            <cylinderGeometry args={[0.02, 0.02, 0.02, 6]} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   5. INTERNAL ROTOR
   ========================================================================== */

function Rotor({ radius, length, vaneCount, active, rpm }: { radius: number; length: number; vaneCount: number; active: boolean; rpm: number }) {
  const rotorRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (rotorRef.current && active) {
      rotorRef.current.rotation.x += (rpm / 60) * Math.PI * 2 * delta;
    }
  });
  const vanes = Array.from({ length: vaneCount }, (_, i) => (i / vaneCount) * Math.PI * 2);

  return (
    <group ref={rotorRef}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[radius * 0.12, radius * 0.12, length * 1.3, 16]} />
        <meshStandardMaterial color={COLORS.rotorSteel} metalness={0.85} roughness={0.2} />
      </mesh>
      {vanes.map((angle, i) => (
        <group key={i} rotation={[angle, 0, 0]}>
          <mesh position={[0, radius * 0.5, 0]} castShadow>
            <boxGeometry args={[length * 0.85, radius * 0.85, 0.025]} />
            <meshStandardMaterial color={COLORS.rotorSteel} metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, radius * 0.92, 0]}>
            <boxGeometry args={[length * 0.82, 0.015, 0.03]} />
            <meshStandardMaterial color={COLORS.rotorDark} metalness={0.9} roughness={0.15} />
          </mesh>
        </group>
      ))}
      {[-length / 2, length / 2].map((pos, i) => (
        <mesh key={i} position={[pos, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.95, radius * 0.95, 0.02, 24]} />
          <meshStandardMaterial color={COLORS.rotorDark} metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   6. GEAR MOTOR
   ========================================================================== */

function GearMotor({ position, active, rpm, hovered, onHover }: { position: V3; active: boolean; rpm: number; hovered: boolean; onHover: (v: boolean) => void }) {
  const fanRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (fanRef.current && active) fanRef.current.rotation.z += (rpm / 60) * Math.PI * 2 * delta * 1.5;
  });

  return (
    <group position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(false); }}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.55, 24]} />
        <meshStandardMaterial color={hovered ? COLORS.motorBlueLight : COLORS.motorBlue} metalness={0.6} roughness={0.4} />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => {
        const z = -0.22 + (i / 13) * 0.44;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.015, 24]} />
            <meshStandardMaterial color={COLORS.motorBlueDark} metalness={0.65} roughness={0.4} />
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.23, 0.2, 0.08, 24]} />
        <meshStandardMaterial color={COLORS.motorBlueDark} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.36]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.21, 0.21, 0.06, 24, 1, true]} />
        <meshStandardMaterial color={COLORS.motorBlueDark} metalness={0.7} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.34]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 6]} />
        <meshStandardMaterial color={COLORS.housingDark} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.24, 0]} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.1]} />
        <meshStandardMaterial color={COLORS.motorBlueDark} metalness={0.6} roughness={0.4} />
      </mesh>
      {[-0.15, 0.15].map((x, i) => (
        <mesh key={i} position={[x, -0.22, 0]} castShadow>
          <boxGeometry args={[0.08, 0.04, 0.35]} />
          <meshStandardMaterial color={COLORS.motorBlueDark} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 0.24, 0.06]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color={active ? COLORS.accentGreen : COLORS.accentRed} emissive={active ? COLORS.accentGreen : COLORS.accentRed} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   7. GEARBOX & SAFETY GUARD
   ========================================================================== */

function Gearbox({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow><boxGeometry args={[0.2, 0.28, 0.22]} /><meshStandardMaterial color={COLORS.gearboxGray} metalness={0.7} roughness={0.4} /></mesh>
      <mesh position={[0, 0, 0.15]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, 0.1, 16]} /><meshStandardMaterial color={COLORS.rotorSteel} metalness={0.85} roughness={0.2} /></mesh>
      <mesh position={[0, 0, -0.15]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, 0.1, 16]} /><meshStandardMaterial color={COLORS.rotorSteel} metalness={0.85} roughness={0.2} /></mesh>
      {[[-0.08, -0.12], [0.08, -0.12], [-0.08, 0.12], [0.08, 0.12]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]}><cylinderGeometry args={[0.02, 0.02, 0.24, 6]} /><meshStandardMaterial color={COLORS.boltSteel} metalness={0.9} roughness={0.3} /></mesh>
      ))}
    </group>
  );
}

function SafetyGuard({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow><boxGeometry args={[0.18, 0.32, 0.25]} /><meshStandardMaterial color={COLORS.safetyYellow} metalness={0.5} roughness={0.5} /></mesh>
      {[-0.1, 0.1].map((x, i) => (
        <mesh key={i} position={[x, -0.18, 0]}><boxGeometry args={[0.04, 0.04, 0.2]} /><meshStandardMaterial color={COLORS.safetyYellowDark} metalness={0.6} roughness={0.45} /></mesh>
      ))}
      <mesh position={[0, 0, 0.13]}><boxGeometry args={[0.16, 0.04, 0.005]} /><meshStandardMaterial color="#000000" /></mesh>
    </group>
  );
}

/* ==========================================================================
   8. SUPPORT LEGS
   ========================================================================== */

function SupportLegs({ width, depth }: { width: number; depth: number }) {
  const legPositions: V3[] = [
    [width / 2 - 0.08, -depth / 2 - 0.15, depth / 2 - 0.08],
    [-width / 2 + 0.08, -depth / 2 - 0.15, depth / 2 - 0.08],
    [width / 2 - 0.08, -depth / 2 - 0.15, -depth / 2 + 0.08],
    [-width / 2 + 0.08, -depth / 2 - 0.15, -depth / 2 + 0.08],
  ];
  return (
    <group>
      {legPositions.map((pos, i) => (
        <group key={i}>
          <mesh position={pos} castShadow><boxGeometry args={[0.08, depth / 2 + 0.15, 0.08]} /><meshStandardMaterial color={COLORS.housingDark} metalness={0.7} roughness={0.4} /></mesh>
          <mesh position={[pos[0], -depth / 2 - 0.15, pos[2]]}><boxGeometry args={[0.14, 0.02, 0.14]} /><meshStandardMaterial color={COLORS.flangeSteel} metalness={0.75} roughness={0.35} /></mesh>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   9. DATA PANEL
   ========================================================================== */

function DataPanel({ position, rpm, active, flowRate, temperature }: { position: V3; rpm: number; active: boolean; flowRate: number; temperature: number }) {
  const lines = [
    { text: `ROTARY VALVE RV-250`, size: 0.14, color: '#1c1c1c', bold: true },
    { text: `RPM: ${active ? rpm.toFixed(0) : '0'}`, size: 0.11, color: '#3a3a3a' },
    { text: `Status: ${active ? '● RUNNING' : '○ STOPPED'}`, size: 0.11, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Flow: ${active ? flowRate.toFixed(1) : '0.0'} t/h`, size: 0.11, color: '#3a3a3a' },
    { text: `Temp: ${temperature.toFixed(1)}°C`, size: 0.11, color: '#3a3a3a' },
  ];
  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0.9, -0.35, -0.02]}><planeGeometry args={[2, 1.4]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0.9, -0.35, -0.015]}><planeGeometry args={[2.02, 1.42]} /><meshStandardMaterial color={COLORS.accentCyan} transparent opacity={0.3} side={THREE.DoubleSide} /></mesh>
        {lines.map((line, i) => (
          <Text key={i} position={[0, -i * 0.22, 0]} fontSize={line.size} color={line.color} anchorX="left" anchorY="top" fontWeight={line.bold ? 'bold' : 'normal'}>{line.text}</Text>
        ))}
      </group>
    </Float>
  );
}

/* ==========================================================================
   10. MAIN COMPONENT (WITH SCALE PROP)
   ========================================================================== */

export interface RotaryValveProps {
  position?: V3;
  scale?: number; // <--- NEW PROP TO CONTROL OVERALL SIZE
  width?: number;
  height?: number;
  depth?: number;
  vaneCount?: number;
  rpm?: number;
  active?: boolean;
  flowRate?: number;
  temperature?: number;
  showMotor?: boolean;
  showGearbox?: boolean;
  showGuard?: boolean;
  showLegs?: boolean;
  showDataPanel?: boolean;
  onToggle?: () => void;
}

export function RotaryValveComponent({
  position = [0, 0, 0],
  scale = 1,
  width = 0.6,
  height = 0.45,
  depth = 0.6,
  vaneCount = 8,
  rpm = 25,
  active: controlledActive,
  flowRate = 15.5,
  temperature = 42.3,
  showMotor = true,
  showGearbox = true,
  showGuard = true,
  showLegs = true,
  showDataPanel = true,
  onToggle,
}: RotaryValveProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [housingHovered, setHousingHovered] = useState(false);
  const [motorHovered, setMotorHovered] = useState(false);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onToggle) onToggle();
    else setInternalActive(!internalActive);
  };

  const rotorRadius = height * 0.42;
  const rotorLength = width * 0.85;

  return (
    // WRAPPED IN A SCALE GROUP
    <group position={position} scale={scale} onClick={handleClick}>
      <SquareFlange size={width * 1.15} thickness={0.06} position={[0, height / 2 + 0.03, 0]} label="INLET" />
      <MainHousing width={width} height={height} depth={depth} hovered={housingHovered} />
      <Rotor radius={rotorRadius} length={rotorLength} vaneCount={vaneCount} active={active} rpm={rpm} />
      <SquareFlange size={width * 1.15} thickness={0.06} position={[0, -(height / 2 + 0.03), 0]} label="OUTLET" />
      {showGearbox && <Gearbox position={[width / 2 + 0.12, 0, 0]} />}
      {showGuard && <SafetyGuard position={[width / 2 + 0.25, 0, 0]} />}
      {showMotor && <GearMotor position={[width / 2 + 0.55, 0, 0]} active={active} rpm={rpm} hovered={motorHovered} onHover={setMotorHovered} />}
      {showLegs && <SupportLegs width={width} depth={depth} />}
      {showDataPanel && <DataPanel position={[-(width / 2 + 1.3), height / 2, 0]} rpm={rpm} active={active} flowRate={flowRate} temperature={temperature} />}
      <Text position={[0, -(height / 2 + 0.5), depth / 2 + 0.1]} fontSize={0.08} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
        {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
      </Text>
    </group>
  );
}

/* ==========================================================================
   11. SCENE EXPORT
   ========================================================================== */

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -1.5, 0]}>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[60, 60, '#5c5c54', '#79796e']} position={[0, -1.49, 0]} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.5]} />
      <directionalLight position={[8, 12, 6]} intensity={1.4} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-far={30} />
    </>
  );
}

export function RotaryValveScene() {
  const [active, setActive] = useState(false);
  return (
    <Canvas shadows camera={{ position: [4, 3, 4], fov: 45 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <RotaryValveComponent active={active} onToggle={() => setActive(!active)} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={2} maxDistance={15} maxPolarAngle={Math.PI / 2.05} target={[0, 0, 0]} />
    </Canvas>
  );
}

export function RotaryValve() { return <RotaryValveScene />; }
export default RotaryValve;