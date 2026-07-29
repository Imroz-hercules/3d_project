'use client';

/**
 * RotaryValve.tsx - HIGH-FIDELITY INDUSTRIAL EDITION (Omniverse Style)
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, weld seams, gusset plates, interactive inspection 
 * door, detailed motor with terminal box, gearbox with oil sight glass, 
 * and proper I-beam support legs with anchor bolts.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

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

const COLORS = {
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  concrete: '#9a9a92',
} as const;

type V3 = [number, number, number];

/* ==========================================================================
   2. DETAIL HELPERS
   ========================================================================== */

/** Realistic hex bolt with shank, head, and top highlight */
function Bolt({ position, rotation = [0, 0, 0] as V3, size = 0.022 }: { position: V3; rotation?: V3; size?: number }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Shank */}
      <mesh material={matBolt}>
        <cylinderGeometry args={[size * 0.6, size * 0.6, size * 1.5, 12]} />
      </mesh>
      {/* Hex Head */}
      <mesh position={[0, size * 0.8, 0]} material={matBolt}>
        <cylinderGeometry args={[size, size, size * 0.5, 6]} />
      </mesh>
      {/* Head Top Highlight */}
      <mesh position={[0, size * 1.05, 0]} material={matBodyDark}>
        <cylinderGeometry args={[size * 0.7, size * 0.7, size * 0.05, 6]} />
      </mesh>
    </group>
  );
}

/** Bolt circle for flanges */
function BoltCircle({ radius, count, y = 0, size = 0.02, rotation = [0, 0, 0] as V3 }: { radius: number; count: number; y?: number; size?: number; rotation?: V3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <Bolt
            key={i}
            position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}
            rotation={[Math.PI / 2, 0, -a]}
            size={size}
          />
        );
      })}
    </>
  );
}

/* ==========================================================================
   3. SQUARE FLANGE (Upgraded with raised face, gasket, and gussets)
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
      {/* Main flange plate */}
      <mesh castShadow receiveShadow material={matBodyDark}>
        <boxGeometry args={[size, thickness, size]} />
      </mesh>
      {/* Raised face */}
      <mesh position={[0, thickness / 2 + 0.005, 0]} material={matBody}>
        <cylinderGeometry args={[size * 0.35, size * 0.35, 0.015, 32]} />
      </mesh>
      {/* Gasket line */}
      <mesh position={[0, thickness / 2 + 0.002, 0]} material={matGasket}>
        <ringGeometry args={[size * 0.32, size * 0.38, 32]} />
      </mesh>
      
      {/* Bolts */}
      {boltPositions.map((pos, i) => (
        <Bolt key={i} position={pos} size={0.02} />
      ))}

      {/* Corner gussets */}
      {[
        [size / 2 - 0.06, size / 2 - 0.06], [-size / 2 + 0.06, size / 2 - 0.06],
        [size / 2 - 0.06, -size / 2 + 0.06], [-size / 2 + 0.06, -size / 2 + 0.06],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]} castShadow material={matStructure}>
          <boxGeometry args={[0.1, thickness + 0.02, 0.1]} />
        </mesh>
      ))}

      {label && (
        <Text position={[0, thickness / 2 + 0.12, size / 2 + 0.05]} fontSize={0.06} color={COLORS.accentCyan} anchorX="center" anchorY="middle" fontWeight="bold">
          {label}
        </Text>
      )}
    </group>
  );
}

/* ==========================================================================
   4. MAIN HOUSING (Upgraded with weld seams, inspection door, nameplate)
   ========================================================================== */

function MainHousing({ width, height, depth, hovered }: { width: number; height: number; depth: number; hovered: boolean }) {
  return (
    <group>
      {/* Main box body */}
      <mesh castShadow receiveShadow material={hovered ? matBody : matBody}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* Vertical weld seams */}
      {[ -width/2 + 0.01, width/2 - 0.01 ].map((x, i) => (
        <mesh key={i} position={[x, 0, depth / 2 + 0.005]} material={matBodyDark}>
          <boxGeometry args={[0.015, height - 0.1, 0.02]} />
        </mesh>
      ))}

      {/* Cylindrical end caps with stiffener rings */}
      {[ -1, 1 ].map((side, i) => (
        <group key={i} position={[(side * (width / 2 + depth / 2 - 0.05)), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow material={matBodyDark}>
            <cylinderGeometry args={[height / 2, height / 2, depth * 0.9, 32]} />
          </mesh>
          {/* Stiffener ring */}
          <mesh position={[0, 0, depth * 0.2]} material={matStructure}>
            <torusGeometry args={[height / 2 + 0.03, 0.04, 8, 32]} />
          </mesh>
        </group>
      ))}

      {/* Horizontal reinforcement ribs */}
      {[-height * 0.25, 0, height * 0.25].map((y, i) => (
        <mesh key={i} position={[0, y, depth / 2 + 0.008]} material={matStructure}>
          <boxGeometry args={[width * 0.96, 0.05, 0.025]} />
        </mesh>
      ))}

      {/* Interactive Inspection Door */}
      <InspectionDoor position={[0, 0, depth / 2 + 0.015]} rotation={[0, 0, 0]} />

      {/* Nameplate */}
      <group position={[0, height * 0.15, depth / 2 + 0.02]}>
        <mesh material={matBody}>
          <boxGeometry args={[0.5, 0.18, 0.01]} />
        </mesh>
        <Text position={[0, 0.03, 0.006]} fontSize={0.06} color="#1a1a1a" anchorX="center" anchorY="middle" fontWeight="bold">
          RV-250
        </Text>
        <Text position={[0, -0.04, 0.006]} fontSize={0.04} color="#3a3a3a" anchorX="center" anchorY="middle">
          250x250mm | 8 Vane
        </Text>
        {/* Plate screws */}
        {[[-0.22, 0.06], [0.22, 0.06], [-0.22, -0.06], [0.22, -0.06]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.008]}>
            <cylinderGeometry args={[0.01, 0.01, 0.01, 6]} />
            <meshStandardMaterial color={COLORS.accentCyan} metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ==========================================================================
   5. INSPECTION DOOR (Interactive)
   ========================================================================== */

function InspectionDoor({ position, rotation }: { position: V3; rotation: V3 }) {
  const doorRef = useRef<THREE.Group>(null!);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const targetAngle = open ? -Math.PI * 0.6 : 0;

  useFrame((_, delta) => {
    if (doorRef.current) {
      doorRef.current.rotation.y = THREE.MathUtils.damp(doorRef.current.rotation.y, targetAngle, 5, delta);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Door frame */}
      <mesh material={matStructure}>
        <boxGeometry args={[0.45, 0.55, 0.04]} />
      </mesh>
      {/* Gasket */}
      <mesh position={[0, 0, 0.025]} material={matGasket}>
        <boxGeometry args={[0.41, 0.51, 0.01]} />
      </mesh>
      {/* Hinged Door */}
      <group ref={doorRef} position={[-0.2, 0, 0.03]}>
        <mesh
          position={[0.2, 0, 0]}
          castShadow
          material={hovered ? matSafety : matBody}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
          onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); setOpen((o) => !o); }}
        >
          <boxGeometry args={[0.4, 0.5, 0.03]} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.32, 0, 0.025]} material={matStructure}>
          <boxGeometry args={[0.03, 0.15, 0.04]} />
        </mesh>
        {/* Hinges */}
        {[-0.18, 0.18].map((y, i) => (
          <mesh key={i} position={[0, y, 0.02]} rotation={[0, Math.PI / 2, 0]} material={matStructure}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 12]} />
          </mesh>
        ))}
      </group>
      {/* Frame bolts */}
      {[[-0.18, -0.22], [0.18, -0.22], [-0.18, 0.22], [0.18, 0.22]].map(([x, y], i) => (
        <Bolt key={i} position={[x, y, 0.025]} size={0.016} />
      ))}
    </group>
  );
}

/* ==========================================================================
   6. INTERNAL ROTOR
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
      {/* Central shaft */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[radius * 0.12, radius * 0.12, length * 1.3, 16]} />
      </mesh>
      {/* Vanes */}
      {vanes.map((angle, i) => (
        <group key={i} rotation={[angle, 0, 0]}>
          <mesh position={[0, radius * 0.5, 0]} castShadow material={matBody}>
            <boxGeometry args={[length * 0.85, radius * 0.85, 0.025]} />
          </mesh>
          {/* Vane wear edge */}
          <mesh position={[0, radius * 0.92, 0]} material={matStructure}>
            <boxGeometry args={[length * 0.82, 0.02, 0.03]} />
          </mesh>
        </group>
      ))}
      {/* End discs */}
      {[-length / 2, length / 2].map((pos, i) => (
        <mesh key={i} position={[pos, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
          <cylinderGeometry args={[radius * 0.95, radius * 0.95, 0.02, 24]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   7. GEAR MOTOR (Upgraded with terminal box, nameplate, breather)
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
      
      {/* Motor body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={hovered ? matMotor : matMotor}>
        <cylinderGeometry args={[0.22, 0.22, 0.55, 24]} />
      </mesh>

      {/* Cooling fins */}
      {Array.from({ length: 14 }, (_, i) => {
        const z = -0.22 + (i / 13) * 0.44;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
            <cylinderGeometry args={[0.24, 0.24, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Terminal box (top) */}
      <mesh position={[0, 0.26, 0]} castShadow material={matMotorDark}>
        <boxGeometry args={[0.14, 0.1, 0.16]} />
      </mesh>
      {/* Terminal box cover bolts */}
      {[[-0.05, 0.31, 0.09], [0.05, 0.31, 0.09], [-0.05, 0.31, -0.09], [0.05, 0.31, -0.09]].map((pos, i) => (
        <mesh key={i} position={pos} material={matBolt}>
          <cylinderGeometry args={[0.012, 0.012, 0.02, 6]} />
        </mesh>
      ))}

      {/* Fan cover (stamped metal look) */}
      <mesh position={[0, 0, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow material={matMotorDark}>
        <cylinderGeometry args={[0.23, 0.2, 0.08, 24]} />
      </mesh>
      <mesh position={[0, 0, 0.36]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
        <cylinderGeometry args={[0.21, 0.21, 0.06, 24, 1, true]} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.34]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 6]} />
      </mesh>

      {/* Mounting feet */}
      {[-0.15, 0.15].map((x, i) => (
        <mesh key={i} position={[x, -0.22, 0]} castShadow material={matMotorDark}>
          <boxGeometry args={[0.08, 0.04, 0.35]} />
        </mesh>
      ))}

      {/* Motor nameplate */}
      <mesh position={[0, 0.1, 0.23]} material={matBody}>
        <boxGeometry args={[0.12, 0.06, 0.01]} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.24, 0.06]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color={active ? COLORS.accentGreen : COLORS.accentRed} emissive={active ? COLORS.accentGreen : COLORS.accentRed} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   8. GEARBOX (Upgraded with oil sight glass and breather)
   ========================================================================== */

function Gearbox({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {/* Gearbox housing */}
      <mesh castShadow material={matStructure}>
        <boxGeometry args={[0.2, 0.28, 0.22]} />
      </mesh>
      
      {/* Oil sight glass (side) */}
      <mesh position={[0.11, -0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
        <meshPhysicalMaterial color="#3fae56" transparent opacity={0.7} roughness={0.1} metalness={0.1} />
      </mesh>
      {/* Sight glass frame */}
      <mesh position={[0.11, -0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.04, 0.008, 8, 16]} />
        <meshStandardMaterial color={matStructure.color} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Breather cap (top) */}
      <mesh position={[0, 0.15, 0]} material={matStructure}>
        <cylinderGeometry args={[0.025, 0.025, 0.04, 12]} />
      </mesh>

      {/* Shafts */}
      <mesh position={[0, 0, 0.15]} rotation={[0, 0, Math.PI / 2]} material={matBodyDark}>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 16]} />
      </mesh>
      <mesh position={[0, 0, -0.15]} rotation={[0, 0, Math.PI / 2]} material={matBodyDark}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 16]} />
      </mesh>

      {/* Mounting bolts */}
      {[[-0.08, -0.12], [0.08, -0.12], [-0.08, 0.12], [0.08, 0.12]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]} material={matBolt}>
          <cylinderGeometry args={[0.02, 0.02, 0.26, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   9. SAFETY GUARD (Upgraded with mounting brackets and stripes)
   ========================================================================== */

function SafetyGuard({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {/* Main guard body */}
      <mesh castShadow material={matSafety}>
        <boxGeometry args={[0.18, 0.32, 0.25]} />
      </mesh>
      {/* Warning stripe */}
      <mesh position={[0, 0, 0.13]}>
        <boxGeometry args={[0.16, 0.04, 0.005]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Mounting brackets */}
      {[-0.1, 0.1].map((x, i) => (
        <mesh key={i} position={[x, -0.18, 0]} material={matStructure}>
          <boxGeometry args={[0.04, 0.06, 0.2]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   10. SUPPORT LEGS (Upgraded to I-beam style with base plates & gussets)
   ========================================================================== */

function SupportLegs({ width, depth }: { width: number; depth: number }) {
  const legHeight = depth / 2 + 0.15;
  const legPositions: V3[] = [
    [width / 2 - 0.08, -legHeight / 2, depth / 2 - 0.08],
    [-width / 2 + 0.08, -legHeight / 2, depth / 2 - 0.08],
    [width / 2 - 0.08, -legHeight / 2, -depth / 2 + 0.08],
    [-width / 2 + 0.08, -legHeight / 2, -depth / 2 + 0.08],
  ];

  return (
    <group>
      {legPositions.map((pos, i) => {
        const isFront = pos[2] > 0;
        const gussetY = -legHeight / 2 + 0.3;
        return (
          <group key={i}>
            {/* I-beam leg simulation */}
            <mesh position={pos} castShadow material={matStructure}>
              <boxGeometry args={[0.08, legHeight, 0.08]} />
            </mesh>
            <mesh position={pos} material={matStructure}>
              <boxGeometry args={[0.1, legHeight, 0.03]} />
            </mesh>
            <mesh position={pos} material={matStructure}>
              <boxGeometry args={[0.03, legHeight, 0.1]} />
            </mesh>

            {/* Base plate */}
            <mesh position={[pos[0], -legHeight / 2 + 0.04, pos[2]]} castShadow material={matStructure}>
              <boxGeometry args={[0.18, 0.08, 0.18]} />
            </mesh>

            {/* Anchor bolts (4 per base) */}
            {[-0.06, 0.06].map((dx) =>
              [-0.06, 0.06].map((dz) => (
                <Bolt key={`${dx}-${dz}`} position={[pos[0] + dx, -legHeight / 2 + 0.09, pos[2] + dz]} size={0.016} />
              ))
            )}

            {/* Gusset plate (leg to housing) */}
            <mesh position={[pos[0], gussetY, pos[2] * 0.7]} castShadow material={matStructure}>
              <boxGeometry args={[0.12, 0.25, 0.04]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   11. DATA PANEL
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
        <mesh position={[0.9, -0.35, -0.02]}>
          <planeGeometry args={[2, 1.4]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0.9, -0.35, -0.015]}>
          <planeGeometry args={[2.02, 1.42]} />
          <meshStandardMaterial color={COLORS.accentCyan} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        {lines.map((line, i) => (
          <Text key={i} position={[0, -i * 0.22, 0]} fontSize={line.size} color={line.color} anchorX="left" anchorY="top" fontWeight={line.bold ? 'bold' : 'normal'}>
            {line.text}
          </Text>
        ))}
      </group>
    </Float>
  );
}

/* ==========================================================================
   12. MAIN COMPONENT
   ========================================================================== */

export interface RotaryValveProps {
  position?: V3;
  scale?: number;
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
   13. SCENE EXPORT
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
      <directionalLight position={[8, 12, 6]} intensity={1.4} castShadow shadow-mapSize-width={4096} shadow-mapSize-height={4096} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-far={30} shadow-bias={-0.0001} />
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
      <RotaryValveComponent active={active} onToggle={() => setActive(!active)} scale={1.5} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={2} maxDistance={15} maxPolarAngle={Math.PI / 2.05} target={[0, 0, 0]} />
    </Canvas>
  );
}

export function RotaryValve() { return <RotaryValveScene />; }
export default RotaryValve;