'use client';

/**
 * Dampener.tsx — HIGH-FIDELITY INDUSTRIAL WHEAT DAMPENER
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, flanged inlet/outlet/water connections, robust 
 * I-beam support legs with gussets, and a high-fidelity drive motor 
 * with safety coupling guard.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float, Sparkles } from '@react-three/drei';
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

const matRubber = new THREE.MeshStandardMaterial({
  color: '#1a1a1a',
  metalness: 0.1,
  roughness: 0.9,
});

const matGlass = new THREE.MeshPhysicalMaterial({
  color: '#d4e6ff',
  transparent: true,
  opacity: 0.4,
  roughness: 0.05,
  transmission: 0.7,
  thickness: 0.1,
});

const COLORS = {
  waterBlue: '#4a9eff',
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
   3. SUPPORT FRAME (I-beam legs, base plates, gussets, dampers)
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
        <group key={i}>
          {/* I-beam leg simulation */}
          <mesh position={pos} castShadow material={matStructure}>
            <boxGeometry args={[0.14, legHeight, 0.14]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.16, legHeight, 0.05]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.05, legHeight, 0.16]} />
          </mesh>

          {/* Vibration damper (rubber mount) */}
          <mesh position={[pos[0], -legHeight / 2 + 0.15, pos[2]]} castShadow material={matRubber}>
            <cylinderGeometry args={[0.08, 0.1, 0.12, 16]} />
          </mesh>

          {/* Base plate */}
          <mesh position={[pos[0], -legHeight / 2 + 0.04, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.35, 0.08, 0.35]} />
          </mesh>

          {/* Anchor bolts */}
          {[-0.12, 0.12].map((dx) =>
            [-0.12, 0.12].map((dz) => (
              <Bolt key={`${dx}-${dz}`} position={[pos[0] + dx, -legHeight / 2 + 0.09, pos[2] + dz]} size={0.018} />
            ))
          )}

          {/* Top gusset plate */}
          <mesh position={[pos[0], -legHeight / 2 + 0.35, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.2, 0.3, 0.05]} />
          </mesh>
        </group>
      ))}

      {/* Cross bracing */}
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} castShadow material={matStructure}>
        <boxGeometry args={[length - 0.5, 0.08, 0.08]} />
      </mesh>
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} rotation={[0, Math.PI / 2, 0]} castShadow material={matStructure}>
        <boxGeometry args={[radius * 1.8, 0.08, 0.08]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   4. MAIN CYLINDRICAL HOUSING (Enhanced with seams, ribs, flanges)
   ========================================================================== */

function MainHousing({ length, radius }: { length: number; radius: number }) {
  const ribCount = 4;
  const ribs = Array.from({ length: ribCount }, (_, i) => -length / 2 + 0.3 + (i / (ribCount - 1)) * (length - 0.6));

  return (
    <group>
      {/* Main Cylinder Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={matBody}>
        <cylinderGeometry args={[radius, radius, length, 48]} />
      </mesh>

      {/* Vertical panel seams */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, i) => {
        const x = Math.cos(a) * (radius + 0.005);
        const z = Math.sin(a) * (radius + 0.005);
        return (
          <mesh key={i} position={[x, 0, z]} rotation={[0, -a, 0]} material={matBodyDark}>
            <boxGeometry args={[0.015, length - 0.2, 0.03]} />
          </mesh>
        );
      })}

      {/* Horizontal stiffener rings with bolts */}
      {ribs.map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0, radius + 0.01]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
            <torusGeometry args={[radius + 0.03, 0.04, 8, 48]} />
          </mesh>
          {/* Bolts on ring */}
          {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, j) => {
            const bx = Math.cos(a) * (radius + 0.04);
            const bz = Math.sin(a) * (radius + 0.04);
            return <Bolt key={j} position={[x, bz, -bx]} rotation={[0, Math.PI / 2, -a]} size={0.016} />;
          })}
        </group>
      ))}

      {/* End Caps */}
      <mesh position={[-length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[radius, radius, 0.12, 48]} />
      </mesh>
      <mesh position={[length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[radius, radius, 0.12, 48]} />
      </mesh>

      {/* Sight Glass (Inspection Window) */}
      <group position={[0, radius * 0.6, radius + 0.01]}>
        <mesh material={matGlass}>
          <cylinderGeometry args={[0.15, 0.15, 0.05, 24]} />
        </mesh>
        <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
          <torusGeometry args={[0.17, 0.025, 8, 24]} />
        </mesh>
        {/* Sight glass bolts */}
        {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, i) => {
          const bx = Math.cos(a) * 0.17;
          const bz = Math.sin(a) * 0.17;
          return <Bolt key={i} position={[bx, bz, 0.04]} rotation={[Math.PI / 2, 0, -a]} size={0.012} />;
        })}
      </group>

      {/* Warning Label Plate */}
      <group position={[0, -radius * 0.5, -radius - 0.02]} rotation={[0, Math.PI, 0]}>
        <mesh material={matSafety}>
          <boxGeometry args={[length * 0.3, 0.2, 0.015]} />
        </mesh>
        <Text position={[0, 0, 0.008]} fontSize={0.05} color="#000000" anchorX="center" anchorY="middle" fontWeight="bold">
          ⚠ WATER + GRAIN MIXING
        </Text>
        {/* Plate screws */}
        {[[-0.13, 0.08], [0.13, 0.08], [-0.13, -0.08], [0.13, -0.08]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.01]}>
            <cylinderGeometry args={[0.01, 0.01, 0.01, 6]} />
            <meshStandardMaterial color={COLORS.accentCyan} metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ==========================================================================
   5. INTERNAL MIXING ROTOR (Heavy-duty beaters)
   ========================================================================== */

function MixingRotor({ length, radius, active }: { length: number; radius: number; active: boolean }) {
  const rotorRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (rotorRef.current && active) {
      rotorRef.current.rotation.x += delta * 12; // ~1450 RPM scaled
    }
  });

  const paddles = useMemo(() => {
    const items = [];
    const rows = 8;
    const cols = 3;
    for (let i = 0; i < rows; i++) {
      const x = -length / 2 + 0.4 + (i / (rows - 1)) * (length - 0.8);
      for (let j = 0; j < cols; j++) {
        const angle = (j / cols) * Math.PI * 2 + (i % 2) * 0.3;
        items.push({ x, angle, id: `${i}-${j}` });
      }
    }
    return items;
  }, [length]);

  return (
    <group ref={rotorRef}>
      {/* Central Shaft */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[0.06, 0.06, length * 0.85, 16]} />
      </mesh>

      {/* Mixing Paddles */}
      {paddles.map((p) => {
        const y = Math.cos(p.angle) * (radius * 0.5);
        const z = Math.sin(p.angle) * (radius * 0.5);
        return (
          <group key={p.id} position={[p.x, y, z]} rotation={[0, 0, p.angle]}>
            {/* Paddle arm */}
            <mesh castShadow material={matStructure}>
              <boxGeometry args={[0.12, 0.03, radius * 0.45]} />
            </mesh>
            {/* Paddle wear tip */}
            <mesh position={[0, 0, radius * 0.22]} castShadow material={matBodyDark}>
              <boxGeometry args={[0.12, 0.06, 0.06]} />
            </mesh>
          </group>
        );
      })}

      {/* End discs */}
      {[-length / 2 + 0.15, length / 2 - 0.15].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
          <cylinderGeometry args={[radius * 0.95, radius * 0.95, 0.02, 24]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   6. WATER SPRAY SYSTEM (Enhanced with fittings and flanges)
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
      <mesh position={[0, radius + 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[0.08, 0.08, 1.0, 24]} />
      </mesh>

      {/* Water Flow Meter with flanges */}
      <mesh position={[0, radius + 0.8, 0]} castShadow material={matStructure}>
        <boxGeometry args={[0.2, 0.25, 0.2]} />
      </mesh>
      <mesh position={[0, radius + 0.8, 0.11]} material={matBody}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 24]} />
      </mesh>
      {/* Flow meter flanges */}
      <mesh position={[0, radius + 0.68, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <torusGeometry args={[0.1, 0.02, 8, 24]} />
      </mesh>
      <mesh position={[0, radius + 0.92, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <torusGeometry args={[0.1, 0.02, 8, 24]} />
      </mesh>
      <BoltCircle radius={0.1} count={4} y={radius + 0.68} z={0} size={0.014} rotation={[Math.PI / 2, 0, 0]} />
      <BoltCircle radius={0.1} count={4} y={radius + 0.92} z={0} size={0.014} rotation={[Math.PI / 2, 0, 0]} />

      {/* Spray Manifold (Horizontal pipe) */}
      <mesh position={[0, radius + 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[0.06, 0.06, length * 0.7, 24]} />
      </mesh>

      {/* Spray Nozzles */}
      {nozzlePositions.map((x, i) => (
        <group key={i} position={[x, radius + 0.05, 0]}>
          {/* Nozzle body */}
          <mesh material={matStructure}>
            <cylinderGeometry args={[0.04, 0.05, 0.12, 16]} />
          </mesh>
          {/* Nozzle tip */}
          <mesh position={[0, -0.08, 0]} material={matBodyDark}>
            <cylinderGeometry args={[0.025, 0.04, 0.04, 16]} />
          </mesh>
          {/* Nozzle mounting nut */}
          <mesh position={[0, 0.06, 0]} material={matStructure}>
            <cylinderGeometry args={[0.055, 0.055, 0.03, 6]} />
          </mesh>
        </group>
      ))}

      {/* Water Droplet Particles */}
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
   7. FEED INLET & OUTLET (Enhanced with flanges and bolts)
   ========================================================================== */

function InletOutlet({ length, radius }: { length: number; radius: number }) {
  return (
    <group>
      {/* Feed Inlet (Top Left) with flange */}
      <mesh position={[-length / 3, radius + 0.35, 0]} castShadow material={matBody}>
        <boxGeometry args={[0.45, 0.7, 0.55]} />
      </mesh>
      <mesh position={[-length / 3, radius + 0.72, 0]} material={matStructure}>
        <boxGeometry args={[0.5, 0.06, 0.6]} />
      </mesh>
      {/* Inlet flange bolts */}
      {[-0.2, 0.2].map((x) =>
        [-0.25, 0.25].map((z) => (
          <Bolt key={`in-${x}-${z}`} position={[-length / 3, radius + 0.75, z]} size={0.018} />
        ))
      )}

      {/* Outlet (Bottom Right) with flange */}
      <mesh position={[length / 3, -radius - 0.35, 0]} castShadow material={matBody}>
        <boxGeometry args={[0.45, 0.7, 0.55]} />
      </mesh>
      <mesh position={[length / 3, -radius - 0.72, 0]} material={matStructure}>
        <boxGeometry args={[0.5, 0.06, 0.6]} />
      </mesh>
      {/* Outlet flange bolts */}
      {[-0.2, 0.2].map((x) =>
        [-0.25, 0.25].map((z) => (
          <Bolt key={`out-${x}-${z}`} position={[length / 3, -radius - 0.75, z]} size={0.018} />
        ))
      )}
    </group>
  );
}

/* ==========================================================================
   8. DRIVE MOTOR & GEARBOX (High-fidelity with coupling guard)
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
    <group position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Gearbox */}
      <mesh castShadow material={matStructure}>
        <boxGeometry args={[0.4, 0.4, 0.35]} />
      </mesh>
      {/* Gearbox mounting bolts */}
      {[[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]].map(([x, z], i) => (
        <Bolt key={i} position={[x, 0, z]} rotation={[0, 0, Math.PI / 2]} size={0.018} />
      ))}

      {/* Motor Body */}
      <mesh position={[0, 0, 0.35]} rotation={[0, 0, Math.PI / 2]} castShadow material={hovered ? matMotor : matMotor}>
        <cylinderGeometry args={[0.22, 0.22, 0.5, 24]} />
      </mesh>

      {/* Cooling Fins */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = 0.35 - 0.2 + (i / 9) * 0.4;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
            <cylinderGeometry args={[0.24, 0.24, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Terminal Box */}
      <mesh position={[0, 0.24, 0.35]} material={matMotorDark}>
        <boxGeometry args={[0.12, 0.08, 0.14]} />
      </mesh>

      {/* Fan Cover & Blades */}
      <mesh position={[0, 0, 0.62]} rotation={[0, 0, Math.PI / 2]} castShadow material={matMotorDark}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 24]} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.64]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <cylinderGeometry args={[0.16, 0.16, 0.02, 8]} />
      </mesh>

      {/* Shaft Coupling */}
      <mesh position={[0, 0, -0.2]} rotation={[0, 0, Math.PI / 2]} material={matBodyDark}>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
      </mesh>

      {/* Safety Coupling Guard */}
      <mesh position={[0, 0.05, -0.12]} material={matSafety}>
        <boxGeometry args={[0.15, 0.15, 0.12]} />
      </mesh>
      <mesh position={[0, 0.05, -0.12]}>
        <boxGeometry args={[0.13, 0.03, 0.005]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.24, 0.43]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={active ? COLORS.accentGreen : COLORS.accentRed} emissive={active ? COLORS.accentGreen : COLORS.accentRed} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   9. DATA PANEL (PLC Data)
   ========================================================================== */

function DataPanel({ position, active, waterFlow, moistureActual }: { position: V3; active: boolean; waterFlow: number; moistureActual: number }) {
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
          <meshStandardMaterial color={COLORS.accentCyan} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        {lines.map((line, i) => (
          <Text key={i} position={[-0.9, -i * 0.22, 0]} fontSize={line.size} color={line.color} anchorX="left" anchorY="top" fontWeight={line.bold ? 'bold' : 'normal'}>
            {line.text}
          </Text>
        ))}
      </group>
    </Float>
  );
}

/* ==========================================================================
   10. MAIN DAMPENER COMPONENT
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

      {/* 8. Data Panel */}
      {showDataPanel && (
        <DataPanel position={[0, radius + 1.5, 0]} active={active} waterFlow={waterFlow} moistureActual={moistureActual} />
      )}

      {/* 9. Click Instruction */}
      {showClickText && (
        <Text position={[0, 0, radius + 0.6]} fontSize={0.08} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
          {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
        </Text>
      )}

      {/* 10. Invisible Click Target */}
      {controlledActive === undefined && (
        <mesh position={[0, 0, 0]} onClick={() => setInternalActive(!internalActive)} visible={false}>
          <boxGeometry args={[length + 1.2, radius * 3, radius * 3]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  );
}

/* ==========================================================================
   11. ENVIRONMENT & EXPORT
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
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-far={40}
        shadow-bias={-0.0001}
      />
    </>
  );
}

export function DampenerScene() {
  const [active, setActive] = useState(true);

  return (
    <Canvas shadows camera={{ position: [5, 4, 5], fov: 45 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <DampenerComponent length={2.2} radius={0.65} active={active} waterFlow={1.8} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={2} maxDistance={15} maxPolarAngle={Math.PI / 2.05} target={[0, 0.5, 0]} />
    </Canvas>
  );
}

export function Dampener() {
  return <DampenerScene />;
}

export default Dampener;