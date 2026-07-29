'use client';

/**
 * BranFinisher.tsx — HIGH-FIDELITY INDUSTRIAL BRAN FINISHER
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, flanged inlet/outlet connections, interactive 
 * inspection door with gasket, robust I-beam support legs with gussets, 
 * and a high-fidelity drive motor with safety coupling guard.
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
  accentYellow: '#e0a92c',
  flourWhite: '#f5f5f0',
  branBrown: '#8b5a2b',
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

function InspectionDoor({ position, rotation, width, height, isOpen, onToggle }: { position: V3; rotation: V3; width: number; height: number; isOpen: boolean; onToggle: () => void }) {
  const doorRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const targetAngle = isOpen ? -Math.PI * 0.65 : 0;

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
          onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onToggle(); }}
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
   4. SUPPORT FRAME (I-beam legs, base plates, gussets, bracing)
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
        <group key={i}>
          {/* I-beam leg simulation */}
          <mesh position={pos} castShadow material={matStructure}>
            <boxGeometry args={[0.16, legHeight, 0.16]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.18, legHeight, 0.06]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.06, legHeight, 0.18]} />
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
          <mesh position={[pos[0], legHeight / 2 - 0.15, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.22, 0.3, 0.05]} />
          </mesh>
        </group>
      ))}

      {/* Cross bracing */}
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} castShadow material={matStructure}>
        <boxGeometry args={[length - 0.5, 0.1, 0.1]} />
      </mesh>
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} rotation={[0, Math.PI / 2, 0]} castShadow material={matStructure}>
        <boxGeometry args={[radius * 1.8, 0.1, 0.1]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   5. MAIN CYLINDRICAL HOUSING (Enhanced with seams, ribs, flanges)
   ========================================================================== */

function MainHousing({ length, radius, isDoorOpen, onDoorToggle }: { length: number; radius: number; isDoorOpen: boolean; onDoorToggle: () => void }) {
  const ribCount = 4;
  const ribs = Array.from({ length: ribCount }, (_, i) => -length / 2 + 0.3 + (i / (ribCount - 1)) * (length - 0.6));

  return (
    <group>
      {/* Outer Solid Housing */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={matBody}>
        <cylinderGeometry args={[radius, radius, length, 64]} />
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
            <torusGeometry args={[radius + 0.03, 0.04, 8, 64]} />
          </mesh>
          {/* Bolts on ring */}
          {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, j) => {
            const bx = Math.cos(a) * (radius + 0.04);
            const bz = Math.sin(a) * (radius + 0.04);
            return <Bolt key={j} position={[x, bz, -bx]} rotation={[0, Math.PI / 2, -a]} size={0.016} />;
          })}
        </group>
      ))}

      {/* Perforated Screen Visualization (Wireframe overlay) */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.01]}>
        <cylinderGeometry args={[radius - 0.02, radius - 0.02, length * 0.95, 24, 12, true]} />
        <meshStandardMaterial color={COLORS.branBrown} wireframe transparent opacity={0.4} />
      </mesh>

      {/* End Caps */}
      <mesh position={[-length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[radius, radius, 0.1, 64]} />
      </mesh>
      <mesh position={[length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[radius, radius, 0.1, 64]} />
      </mesh>

      {/* Manufacturer Nameplate */}
      <group position={[0, radius * 0.6, radius + 0.02]}>
        <mesh material={matBody}>
          <boxGeometry args={[length * 0.3, 0.25, 0.015]} />
        </mesh>
        <Text position={[0, 0.06, 0.008]} fontSize={0.06} color="#1a1a1a" anchorX="center" anchorY="middle" fontWeight="bold">
          BRAN FINISHER
        </Text>
        <Text position={[0, -0.06, 0.008]} fontSize={0.045} color="#3a3a3a" anchorX="center" anchorY="middle">
          BF-40
        </Text>
        {/* Plate screws */}
        {[[-0.13, 0.1], [0.13, 0.1], [-0.13, -0.1], [0.13, -0.1]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.01]}>
            <cylinderGeometry args={[0.01, 0.01, 0.01, 6]} />
            <meshStandardMaterial color={COLORS.accentCyan} metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Interactive Inspection Door */}
      <InspectionDoor 
        position={[0, 0, radius + 0.02]} 
        rotation={[0, 0, 0]} 
        width={length * 0.4} 
        height={radius * 1.2} 
        isOpen={isDoorOpen} 
        onToggle={onDoorToggle} 
      />
    </group>
  );
}

/* ==========================================================================
   6. INTERNAL HEAVY-DUTY ROTOR (Enhanced beaters)
   ========================================================================== */

function InternalRotor({ length, radius, active }: { length: number; radius: number; active: boolean }) {
  const rotorRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (rotorRef.current && active) {
      rotorRef.current.rotation.x += delta * 15;
    }
  });

  const beaters = useMemo(() => {
    const items = [];
    const rows = 6;
    const cols = 4;
    for (let i = 0; i < rows; i++) {
      const x = -length / 2 + 0.3 + (i / (rows - 1)) * (length - 0.6);
      for (let j = 0; j < cols; j++) {
        const angle = (j / cols) * Math.PI * 2 + (i % 2) * 0.4;
        items.push({ x, angle, id: `${i}-${j}` });
      }
    }
    return items;
  }, [length]);

  return (
    <group ref={rotorRef}>
      {/* Central Heavy Shaft */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[0.1, 0.1, length * 0.9, 16]} />
      </mesh>

      {/* Hammer Beaters */}
      {beaters.map((b) => {
        const y = Math.cos(b.angle) * (radius * 0.65);
        const z = Math.sin(b.angle) * (radius * 0.65);
        return (
          <group key={b.id} position={[b.x, y, z]} rotation={[0, 0, b.angle]}>
            {/* Beater Arm */}
            <mesh castShadow material={matStructure}>
              <boxGeometry args={[0.15, 0.05, radius * 0.5]} />
            </mesh>
            {/* Hammer Head */}
            <mesh position={[0, 0, radius * 0.25]} castShadow material={matBodyDark}>
              <boxGeometry args={[0.15, 0.12, 0.12]} />
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
   7. DRIVE MOTOR (High-fidelity with coupling guard)
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
    <group position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Gearbox */}
      <mesh castShadow material={matStructure}>
        <boxGeometry args={[0.45, 0.45, 0.4]} />
      </mesh>
      {/* Gearbox mounting bolts */}
      {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z], i) => (
        <Bolt key={i} position={[x, 0, z]} rotation={[0, 0, Math.PI / 2]} size={0.018} />
      ))}

      {/* Motor Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={hovered ? matMotor : matMotor}>
        <cylinderGeometry args={[0.28, 0.28, 0.6, 24]} />
      </mesh>

      {/* Cooling Fins */}
      {Array.from({ length: 12 }, (_, i) => {
        const z = 0.4 - 0.25 + (i / 11) * 0.5;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
            <cylinderGeometry args={[0.3, 0.3, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Terminal Box */}
      <mesh position={[0, 0.3, 0]} material={matMotorDark}>
        <boxGeometry args={[0.12, 0.08, 0.14]} />
      </mesh>

      {/* Fan Cover & Blades */}
      <mesh position={[0, 0, 0.72]} rotation={[0, 0, Math.PI / 2]} castShadow material={matMotorDark}>
        <cylinderGeometry args={[0.26, 0.26, 0.08, 24]} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.75]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 8]} />
      </mesh>

      {/* Shaft Coupling */}
      <mesh position={[0, 0, -0.25]} rotation={[0, 0, Math.PI / 2]} material={matBodyDark}>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 16]} />
      </mesh>

      {/* Safety Coupling Guard */}
      <mesh position={[0, 0.05, -0.2]} material={matSafety}>
        <boxGeometry args={[0.25, 0.15, 0.25]} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.3, 0.08]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color={active ? COLORS.accentGreen : COLORS.accentRed} emissive={active ? COLORS.accentGreen : COLORS.accentRed} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   8. INLET & OUTLETS (Enhanced with flanges and bolts)
   ========================================================================== */

function InletAndOutlets({ length, radius }: { length: number; radius: number }) {
  return (
    <group>
      {/* Feed Inlet (Top Center) with flange */}
      <mesh position={[0, radius + 0.4, 0]} castShadow material={matBody}>
        <boxGeometry args={[0.5, 0.8, 0.6]} />
      </mesh>
      <mesh position={[0, radius + 0.82, 0]} material={matStructure}>
        <boxGeometry args={[0.55, 0.06, 0.65]} />
      </mesh>
      {/* Inlet flange bolts */}
      {[-0.2, 0.2].map((x) =>
        [-0.25, 0.25].map((z) => (
          <Bolt key={`in-${x}-${z}`} position={[x, radius + 0.85, z]} size={0.018} />
        ))
      )}

      {/* Recovered Flour Outlet (Bottom Collection Tray/Chute) */}
      <mesh position={[0, -radius - 0.5, 0]} castShadow material={matBody}>
        <boxGeometry args={[length * 0.8, 0.6, radius * 1.2]} />
      </mesh>
      <mesh position={[0, -radius - 0.82, 0]} material={matStructure}>
        <boxGeometry args={[length * 0.85, 0.06, radius * 1.25]} />
      </mesh>
      {/* Outlet flange bolts */}
      {[-length * 0.35, length * 0.35].map((x) =>
        [-radius * 0.55, radius * 0.55].map((z) => (
          <Bolt key={`out-${x}-${z}`} position={[x, -radius - 0.85, z]} size={0.016} />
        ))
      )}
      <Text position={[0, -radius - 0.5, radius * 0.65]} fontSize={0.06} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
        RECOVERED FLOUR
      </Text>

      {/* Final Bran Outlet (End Discharge Chute) */}
      <mesh position={[length / 2 + 0.4, -0.1, 0]} castShadow material={matBodyDark}>
        <boxGeometry args={[0.8, 0.6, 0.5]} />
      </mesh>
      <mesh position={[length / 2 + 0.85, -0.1, 0]} material={matStructure}>
        <boxGeometry args={[0.1, 0.65, 0.55]} />
      </mesh>
      {/* Outlet flange bolts */}
      {[-0.2, 0.2].map((x) =>
        [-0.2, 0.2].map((z) => (
          <Bolt key={`bran-${x}-${z}`} position={[length / 2 + 0.9, -0.1 + x, z]} rotation={[0, 0, Math.PI / 2]} size={0.016} />
        ))
      )}
      <Text position={[length / 2 + 0.4, -0.1, 0.3]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
        FINAL BRAN
      </Text>
    </group>
  );
}

/* ==========================================================================
   9. DATA PANEL (PLC Data)
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
        <mesh position={[0, -0.45, -0.02]}>
          <planeGeometry args={[2.2, 1.8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.45, -0.015]}>
          <planeGeometry args={[2.24, 1.84]} />
          <meshStandardMaterial color={COLORS.accentCyan} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
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
   10. MAIN BRAN FINISHER COMPONENT
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
      {controlledActive === undefined && (
        <mesh position={[0, 0, 0]} onClick={() => setInternalActive(!internalActive)} visible={false}>
          <boxGeometry args={[length + 1.5, radius * 3, radius * 3]} />
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