'use client';

/**
 * Purifier.tsx — HIGH-FIDELITY INDUSTRIAL SEMOLINA PURIFIER
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, flanged inlet/outlet connections, interactive 
 * inspection doors with gaskets, robust I-beam support legs with gussets, 
 * and a high-fidelity side-mounted vibration motor with safety guard.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState } from 'react';
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
  semolinaColor: '#f0e6d2',
  branColor: '#8b5a2b',
  middlingsColor: '#e8d5b5',
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
   4. LOW SUPPORT FRAME (I-beam legs, base plates, gussets, bracing)
   ========================================================================== */

function SupportFrame({ width, depth }: { width: number; depth: number }) {
  const legHeight = 1.2;
  const legPositions: V3[] = [
    [width / 2 - 0.2, -legHeight / 2, depth / 2 - 0.2],
    [-width / 2 + 0.2, -legHeight / 2, depth / 2 - 0.2],
    [width / 2 - 0.2, -legHeight / 2, -depth / 2 + 0.2],
    [-width / 2 + 0.2, -legHeight / 2, -depth / 2 + 0.2],
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
            <boxGeometry args={[0.4, 0.08, 0.4]} />
          </mesh>

          {/* Anchor bolts */}
          {[-0.14, 0.14].map((dx) =>
            [-0.14, 0.14].map((dz) => (
              <Bolt key={`${dx}-${dz}`} position={[pos[0] + dx, -legHeight / 2 + 0.09, pos[2] + dz]} size={0.018} />
            ))
          )}

          {/* Top gusset plate */}
          <mesh position={[pos[0], legHeight / 2 - 0.15, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.22, 0.3, 0.05]} />
          </mesh>
        </group>
      ))}

      {/* Heavy cross bracing */}
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} castShadow material={matStructure}>
        <boxGeometry args={[width - 0.4, 0.12, 0.12]} />
      </mesh>
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} rotation={[0, Math.PI / 2, 0]} castShadow material={matStructure}>
        <boxGeometry args={[depth - 0.4, 0.12, 0.12]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   5. MAIN SIEVE CABINET (Enhanced with seams, ribs, flanges)
   ========================================================================== */

function SieveCabinet({ width, height, depth, active, isDoorOpen, onDoorToggle }: { width: number; height: number; depth: number; active: boolean; isDoorOpen: boolean; onDoorToggle: () => void }) {
  const cabinetRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const ribCount = 3;
  const ribs = Array.from({ length: ribCount }, (_, i) => -height / 2 + 0.5 + (i / (ribCount - 1)) * (height - 1));

  useFrame(({ clock }) => {
    if (!cabinetRef.current) return;
    if (active) {
      const t = clock.elapsedTime * 12;
      cabinetRef.current.position.x = Math.sin(t) * 0.015;
      cabinetRef.current.position.z = Math.sin(t * 0.8) * 0.005;
    } else {
      cabinetRef.current.position.x = THREE.MathUtils.damp(cabinetRef.current.position.x, 0, 5, 0.016);
      cabinetRef.current.position.z = THREE.MathUtils.damp(cabinetRef.current.position.z, 0, 5, 0.016);
    }
  });

  const doorWidth = width * 0.45;
  const doorHeight = height * 0.65;

  return (
    <group ref={cabinetRef}>
      {/* Main Body */}
      <mesh castShadow receiveShadow material={matBody} scale={hovered ? 1.005 : 1}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* Vertical panel seams */}
      {[-width / 2 + 0.01, width / 2 - 0.01].map((x, i) => (
        <mesh key={i} position={[x, 0, depth / 2 + 0.005]} material={matBodyDark}>
          <boxGeometry args={[0.015, height - 0.2, 0.02]} />
        </mesh>
      ))}

      {/* Horizontal stiffener ribs with bolts */}
      {ribs.map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, depth / 2 + 0.01]} material={matStructure}>
            <boxGeometry args={[width * 0.96, 0.05, 0.025]} />
          </mesh>
          <mesh position={[0, y, -depth / 2 - 0.01]} material={matStructure}>
            <boxGeometry args={[width * 0.96, 0.05, 0.025]} />
          </mesh>
          {[-width * 0.4, 0, width * 0.4].map((x) => (
            <Bolt key={`f-${x}`} position={[x, y, depth / 2 + 0.025]} size={0.016} />
          ))}
          {[-width * 0.4, 0, width * 0.4].map((x) => (
            <Bolt key={`b-${x}`} position={[x, y, -depth / 2 - 0.025]} rotation={[0, Math.PI, 0]} size={0.016} />
          ))}
        </group>
      ))}

      {/* Top & Bottom reinforcement caps */}
      <mesh position={[0, height / 2 + 0.05, 0]} material={matBodyDark}>
        <boxGeometry args={[width + 0.1, 0.1, depth + 0.1]} />
      </mesh>
      <mesh position={[0, -height / 2 - 0.05, 0]} material={matBodyDark}>
        <boxGeometry args={[width + 0.1, 0.1, depth + 0.1]} />
      </mesh>

      {/* Manufacturer Nameplate */}
      <group position={[0, height * 0.3, depth / 2 + 0.02]}>
        <mesh material={matBody}>
          <boxGeometry args={[width * 0.25, 0.2, 0.015]} />
        </mesh>
        <Text position={[0, 0.05, 0.008]} fontSize={0.06} color="#1a1a1a" anchorX="center" anchorY="middle" fontWeight="bold">
          PURIFIER
        </Text>
        <Text position={[0, -0.05, 0.008]} fontSize={0.045} color="#3a3a3a" anchorX="center" anchorY="middle">
          PU-6
        </Text>
        {/* Plate screws */}
        {[[-0.1, 0.08], [0.1, 0.08], [-0.1, -0.08], [0.1, -0.08]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.01]}>
            <cylinderGeometry args={[0.01, 0.01, 0.01, 6]} />
            <meshStandardMaterial color={COLORS.accentCyan} metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Interactive Inspection Doors */}
      <InspectionDoor 
        position={[-doorWidth / 2 - 0.02, 0, depth / 2 + 0.02]} 
        rotation={[0, 0, 0]} 
        width={doorWidth} 
        height={doorHeight} 
        isOpen={isDoorOpen} 
        onToggle={onToggle} 
      />
      <InspectionDoor 
        position={[doorWidth / 2 + 0.02, 0, depth / 2 + 0.02]} 
        rotation={[0, Math.PI, 0]} 
        width={doorWidth} 
        height={doorHeight} 
        isOpen={isDoorOpen} 
        onToggle={onToggle} 
      />
    </group>
  );
}

/* ==========================================================================
   6. ASPIRATION DUCT (Enhanced with flanges and fan details)
   ========================================================================== */

function AspirationDuct({ width, depth, height, position, damperOpen, onToggleDamper }: { width: number; depth: number; height: number; position: V3; damperOpen: boolean; onToggleDamper: () => void }) {
  const damperRef = useRef<THREE.Mesh>(null!);
  const fanRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (damperRef.current) {
      const targetY = damperOpen ? 0.3 : 0;
      damperRef.current.position.y = THREE.MathUtils.damp(damperRef.current.position.y, targetY, 4, delta);
    }
    if (fanRef.current) {
      fanRef.current.rotation.z += delta * 8;
    }
  });

  return (
    <group position={position}>
      {/* Main Horizontal Duct */}
      <mesh castShadow receiveShadow material={matBody}>
        <boxGeometry args={[width * 0.9, height * 0.6, depth * 0.8]} />
      </mesh>

      {/* Vertical Exhaust Pipe */}
      <mesh position={[width * 0.3, height * 0.6, 0]} castShadow material={matBodyDark}>
        <boxGeometry args={[0.6, height * 0.8, 0.6]} />
      </mesh>

      {/* Exhaust Fan Housing (Top) */}
      <mesh position={[width * 0.3, height * 1.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={matMotor}>
        <cylinderGeometry args={[0.35, 0.35, 0.2, 24]} />
      </mesh>
      <mesh ref={fanRef} position={[width * 0.3, height * 1.22, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 8]} />
      </mesh>

      {/* Duct flange connections */}
      <mesh position={[0, 0, depth * 0.41]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <torusGeometry args={[width * 0.45, 0.03, 8, 24]} />
      </mesh>
      <BoltCircle radius={width * 0.45} count={8} y={0} z={depth * 0.41} size={0.016} rotation={[Math.PI / 2, 0, 0]} />

      {/* Air Control Damper (Interactive sliding plate) */}
      <group 
        position={[-width * 0.3, 0, depth * 0.41]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => e.stopPropagation()}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onToggleDamper(); }}
      >
        <mesh ref={damperRef} material={matSafety}>
          <boxGeometry args={[0.4, 0.5, 0.04]} />
        </mesh>
        {/* Damper Handle */}
        <mesh position={[0, 0, 0.04]} material={matStructure}>
          <boxGeometry args={[0.05, 0.15, 0.05]} />
        </mesh>
        {/* Damper bolts */}
        <Bolt position={[0, 0.25, 0.05]} size={0.014} />
        <Bolt position={[0, -0.25, 0.05]} size={0.014} />
        <Text position={[0, -0.4, 0.05]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
          AIR DAMPER
        </Text>
      </group>
    </group>
  );
}

/* ==========================================================================
   7. SIDE VIBRATION MOTOR (High-fidelity with coupling guard)
   ========================================================================== */

function VibrationMotor({ position, active }: { position: V3; active: boolean }) {
  const weightRef = useRef<THREE.Mesh>(null!);
  const fanRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (weightRef.current && active) weightRef.current.rotation.x += delta * 15;
    if (fanRef.current && active) fanRef.current.rotation.z += delta * 12;
  });

  return (
    <group position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Motor Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={hovered ? matMotor : matMotor}>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 24]} />
      </mesh>

      {/* Cooling Fins */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = -0.25 + (i / 9) * 0.5;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
            <cylinderGeometry args={[0.32, 0.32, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Terminal Box */}
      <mesh position={[0, 0.32, 0]} material={matMotorDark}>
        <boxGeometry args={[0.12, 0.08, 0.14]} />
      </mesh>

      {/* Fan Cover & Blades */}
      <mesh position={[0, 0, 0.35]} rotation={[0, 0, Math.PI / 2]} castShadow material={matMotorDark}>
        <cylinderGeometry args={[0.25, 0.25, 0.06, 24]} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.38]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <cylinderGeometry args={[0.2, 0.2, 0.03, 8]} />
      </mesh>

      {/* Eccentric Weight Housing */}
      <mesh position={[0, 0, -0.35]} rotation={[0, 0, Math.PI / 2]} material={matBodyDark}>
        <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
      </mesh>
      <mesh ref={weightRef} position={[0, 0, -0.45]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <boxGeometry args={[0.15, 0.15, 0.1]} />
      </mesh>

      {/* Safety Coupling Guard */}
      <mesh position={[0, 0.05, -0.35]} material={matSafety}>
        <boxGeometry args={[0.25, 0.15, 0.25]} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.32, 0.08]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color={active ? COLORS.accentGreen : COLORS.accentRed} emissive={active ? COLORS.accentGreen : COLORS.accentRed} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   8. INLET & OUTLETS (Enhanced with flanges and bolts)
   ========================================================================== */

function InletAndOutlets({ width, depth, height }: { width: number; depth: number; height: number }) {
  const chuteWidth = width * 0.25;
  const chuteDepth = depth * 0.7;
  const spacing = width * 0.3;
  const positions = [-spacing, 0, spacing];
  const labels = ['SEMOLINA', 'MIDDLINGS', 'BRAN'];
  const colors = [COLORS.semolinaColor, COLORS.middlingsColor, COLORS.branColor];

  return (
    <group>
      {/* Feed Inlet (Top) with flange */}
      <mesh position={[0, height / 2 + 0.4, 0]} castShadow material={matBody}>
        <boxGeometry args={[0.6, 0.8, 0.6]} />
      </mesh>
      <mesh position={[0, height / 2 + 0.82, 0]} material={matStructure}>
        <boxGeometry args={[0.65, 0.06, 0.65]} />
      </mesh>
      {/* Inlet flange bolts */}
      {[-0.25, 0.25].map((x) =>
        [-0.25, 0.25].map((z) => (
          <Bolt key={`in-${x}-${z}`} position={[x, height / 2 + 0.85, z]} size={0.018} />
        ))
      )}

      {/* Outlet Chutes (Bottom) */}
      {positions.map((x, i) => (
        <group key={i} position={[x, -height / 2 - 0.4, 0]}>
          <mesh castShadow receiveShadow material={matBody}>
            <boxGeometry args={[chuteWidth, 0.8, chuteDepth]} />
          </mesh>
          <mesh position={[0, -0.42, 0]} material={matStructure}>
            <boxGeometry args={[chuteWidth + 0.05, 0.06, chuteDepth + 0.05]} />
          </mesh>
          {/* Outlet flange bolts */}
          {[-chuteWidth * 0.35, chuteWidth * 0.35].map((dx) =>
            [-chuteDepth * 0.35, chuteDepth * 0.35].map((dz) => (
              <Bolt key={`out-${dx}-${dz}`} position={[dx, -0.45, dz]} size={0.016} />
            ))
          )}
          <Text position={[0, 0, chuteDepth / 2 + 0.05]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
            {labels[i]}
          </Text>
          <mesh position={[0, 0.3, chuteDepth / 2 + 0.02]}>
            <boxGeometry args={[chuteWidth * 0.8, 0.08, 0.02]} />
            <meshStandardMaterial color={colors[i]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   9. ACCESS LADDER & PLATFORM (Industrial standard)
   ========================================================================== */

function AccessLadder({ height, depth }: { height: number; depth: number }) {
  return (
    <group position={[0, 0, depth / 2 + 0.3]}>
      {/* Ladder Rails */}
      <mesh position={[-0.3, 0, 0]} castShadow material={matStructure}>
        <boxGeometry args={[0.05, height * 0.8, 0.05]} />
      </mesh>
      <mesh position={[0.3, 0, 0]} castShadow material={matStructure}>
        <boxGeometry args={[0.05, height * 0.8, 0.05]} />
      </mesh>
      {/* Rungs */}
      {Array.from({ length: 10 }, (_, i) => {
        const y = -height * 0.3 + i * (height * 0.6 / 9);
        return (
          <mesh key={i} position={[0, y, 0.05]} castShadow material={matStructure}>
            <boxGeometry args={[0.5, 0.04, 0.04]} />
          </mesh>
        );
      })}
      {/* Top Platform */}
      <mesh position={[0, height * 0.4, 0.2]} castShadow material={matBodyDark}>
        <boxGeometry args={[1.2, 0.08, 0.8]} />
      </mesh>
      {/* Platform grating pattern */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = -0.5 + (i / 5) * 1.0;
        return (
          <mesh key={i} position={[x, height * 0.4 + 0.05, 0.2]} material={matStructure}>
            <boxGeometry args={[0.02, 0.02, 0.75]} />
          </mesh>
        );
      })}
      {/* Platform Railing & Toe Board */}
      <mesh position={[0, height * 0.4 + 0.06, 0.55]} material={matSafety}>
        <boxGeometry args={[1.2, 0.12, 0.04]} />
      </mesh>
      <mesh position={[0, height * 0.4 + 0.45, 0.55]} material={matSafety}>
        <boxGeometry args={[1.2, 0.04, 0.04]} />
      </mesh>
      {[-0.55, 0.55].map((x, i) => (
        <mesh key={i} position={[x, height * 0.4 + 0.25, 0.55]} material={matSafety}>
          <boxGeometry args={[0.04, 0.5, 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   10. DATA PANEL (PLC Data)
   ========================================================================== */

function DataPanel({ position, active }: { position: V3; active: boolean }) {
  const lines = [
    { text: `PURIFIER PU-6`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ${active ? 'RUNNING' : 'STOPPED'}`, size: 0.13, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Motor RPM: ${active ? '980' : '0'}`, size: 0.13, color: '#3a3a3a' },
    { text: `Airflow: ${active ? '4200' : '0'} m³/h`, size: 0.13, color: '#3a3a3a' },
    { text: `Feed Rate: ${active ? '7.5' : '0.0'} TPH`, size: 0.13, color: '#3a3a3a' },
    { text: `Semolina Purity: ${active ? '98.2' : '0.0'}%`, size: 0.13, color: '#3a3a3a' },
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
   11. MAIN PURIFIER COMPONENT
   ========================================================================== */

export interface PurifierProps {
  position?: V3;
  width?: number;
  height?: number;
  depth?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
  showAccessLadder?: boolean;
}

export function PurifierComponent({
  position = [0, 0, 0],
  width = 3.5,
  height = 2.0,
  depth = 2.2,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
  showAccessLadder = true,
}: PurifierProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [damperOpen, setDamperOpen] = useState(true);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  return (
    <group position={position}>
      {/* 1. Low Support Frame */}
      <SupportFrame width={width} depth={depth} />

      {/* 2. Main Sieve Cabinet (Vibrating) */}
      <SieveCabinet 
        width={width} height={height} depth={depth} 
        active={active} isDoorOpen={doorsOpen} onDoorToggle={() => setDoorsOpen(!doorsOpen)} 
      />

      {/* 3. Aspiration Duct */}
      <AspirationDuct 
        width={width} depth={depth} height={height} 
        position={[0, height / 2 + 0.4, 0]} 
        damperOpen={damperOpen} onToggleDamper={() => setDamperOpen(!damperOpen)} 
      />

      {/* 4. Side Vibration Motor */}
      <VibrationMotor position={[width / 2 + 0.5, 0, 0]} active={active} />

      {/* 5. Inlet & Outlets */}
      <InletAndOutlets width={width} depth={depth} height={height} />

      {/* 6. Access Ladder & Platform */}
      {showAccessLadder && <AccessLadder height={height} depth={depth} />}

      {/* 7. Animations */}
      {active && (
        <>
          {/* Airflow rising into duct */}
          <Sparkles count={50} scale={[width * 0.6, height * 0.5, depth * 0.6]} size={2} speed={1.5} position={[0, height / 2 + 0.2, 0]} color="#e0f0ff" />
          {/* Product streams */}
          <Sparkles count={30} scale={[0.3, 0.5, 0.3]} size={2} speed={1.5} position={[-width * 0.3, -height / 2 - 1, 0]} color={COLORS.semolinaColor} />
          <Sparkles count={20} scale={[0.3, 0.5, 0.3]} size={2} speed={1.5} position={[0, -height / 2 - 1, 0]} color={COLORS.middlingsColor} />
          <Sparkles count={15} scale={[0.3, 0.5, 0.3]} size={2} speed={1.5} position={[width * 0.3, -height / 2 - 1, 0]} color={COLORS.branColor} />
        </>
      )}

      {/* 8. Data Panel */}
      {showDataPanel && (
        <DataPanel position={[width / 2 + 2, height / 2, 0]} active={active} />
      )}

      {/* 9. Click Instructions */}
      {showClickText && (
        <>
          <Text position={[0, height / 2 + 1.5, depth / 2 + 0.5]} fontSize={0.1} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
            {doorsOpen ? '● DOORS OPEN' : '○ CLICK DOORS TO INSPECT'}
          </Text>
          <Text position={[0, -height / 2 - 1.5, depth / 2 + 0.5]} fontSize={0.1} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
            {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
          </Text>
        </>
      )}

      {/* 10. Invisible Click Targets */}
      {controlledActive === undefined && (
        <mesh position={[0, 0, 0]} onClick={() => setInternalActive(!internalActive)} visible={false}>
          <boxGeometry args={[width + 2, height + 3, depth + 2]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  );
}

/* ==========================================================================
   12. ENVIRONMENT & EXPORT
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

export function PurifierScene() {
  const [active, setActive] = useState(true);
  return (
    <Canvas shadows camera={{ position: [10, 6, 10], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <PurifierComponent width={3.5} height={2.0} depth={2.2} active={active} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={5} maxDistance={30} maxPolarAngle={Math.PI / 2.05} target={[0, 1, 0]} />
    </Canvas>
  );
}

export function Purifier() { return <PurifierScene />; }
export default Purifier;