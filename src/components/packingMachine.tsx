'use client';

/**
 * PackingMachine.tsx — HIGH-FIDELITY INDUSTRIAL AUTOMATIC PACKING MACHINE
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, flanged hopper connections, robust I-beam support 
 * legs with gussets, detailed pneumatic bag clamp, realistic flour bag 
 * with seam details, and an enhanced operator panel with safety guards.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { StatusBeacon } from './machineParts/StatusBeacon';

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

const COLORS = {
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  accentYellow: '#e0a92c',
  hmiScreen: '#00d4ff',
  hmiBody: '#2a2a2a',
  eStopRed: '#ff2222',
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
   3. MAIN FRAME (I-beam legs, base plates, gussets, bracing)
   ========================================================================== */

function MainFrame({ width, depth }: { width: number; depth: number }) {
  const legHeight = 0.8;
  const legPositions: V3[] = [
    [width / 2 - 0.2, legHeight / 2, depth / 2 - 0.2],
    [-width / 2 + 0.2, legHeight / 2, depth / 2 - 0.2],
    [width / 2 - 0.2, legHeight / 2, -depth / 2 + 0.2],
    [-width / 2 + 0.2, legHeight / 2, -depth / 2 + 0.2],
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
          <mesh position={[pos[0], legHeight / 2 - 0.1, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.2, 0.25, 0.05]} />
          </mesh>
        </group>
      ))}

      {/* Top Frame (Supports the hoppers) */}
      <mesh position={[0, legHeight + 0.1, 0]} castShadow material={matStructure}>
        <boxGeometry args={[width, 0.2, depth]} />
      </mesh>

      {/* Conveyor Structure */}
      <group position={[width / 2 + 0.6, legHeight - 0.1, 0]}>
        {/* Conveyor Side Rails */}
        <mesh position={[0, 0, 0.28]} castShadow material={matStructure}>
          <boxGeometry args={[1.2, 0.15, 0.08]} />
        </mesh>
        <mesh position={[0, 0, -0.28]} castShadow material={matStructure}>
          <boxGeometry args={[1.2, 0.15, 0.08]} />
        </mesh>
        
        {/* Conveyor Belt */}
        <mesh position={[0, 0.08, 0]} castShadow material={matRubber}>
          <boxGeometry args={[1.15, 0.04, 0.5]} />
        </mesh>
        
        {/* Rollers */}
        {Array.from({ length: 6 }, (_, i) => {
          const x = -0.5 + (i / 5) * 1.0;
          return (
            <mesh key={i} position={[x, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={matBodyDark}>
              <cylinderGeometry args={[0.06, 0.06, 0.45, 16]} />
            </mesh>
          );
        })}

        {/* Conveyor Drive Motor */}
        <mesh position={[0.65, 0, 0]} castShadow material={matBodyDark}>
          <boxGeometry args={[0.25, 0.25, 0.3]} />
        </mesh>
        {/* Drive motor safety guard */}
        <mesh position={[0.65, 0.15, 0]} material={matSafety}>
          <boxGeometry args={[0.2, 0.15, 0.25]} />
        </mesh>
      </group>
    </group>
  );
}

/* ==========================================================================
   4. HOPPERS & LOAD CELLS
   ========================================================================== */

function Hoppers({ width, depth, height }: { width: number; depth: number; height: number }) {
  const baseY = 1.2;

  return (
    <group position={[0, baseY, 0]}>
      {/* Load Cells (4 pucks) */}
      {[
        [width * 0.35, 0, depth * 0.35],
        [-width * 0.35, 0, depth * 0.35],
        [width * 0.35, 0, -depth * 0.35],
        [-width * 0.35, 0, -depth * 0.35],
      ].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh castShadow material={matBodyDark}>
            <cylinderGeometry args={[0.06, 0.06, 0.15, 16]} />
          </mesh>
          {/* Load cell mounting bolts */}
          <Bolt position={[0, 0.08, 0]} size={0.015} />
          <Bolt position={[0, -0.08, 0]} rotation={[0, Math.PI, 0]} size={0.015} />
        </group>
      ))}

      {/* Weigh Hopper */}
      <mesh position={[0, height * 0.3 + 0.15, 0]} castShadow receiveShadow material={matBody}>
        <boxGeometry args={[width * 0.8, height * 0.6, depth * 0.8]} />
      </mesh>
      
      {/* Weigh hopper stiffener rings */}
      {[-0.15, 0.15].map((y, i) => (
        <mesh key={i} position={[0, height * 0.3 + 0.15 + y, 0]} material={matStructure}>
           <boxGeometry args={[width * 0.82, 0.05, depth * 0.82]} />
        </mesh>
      ))}

      {/* Feed Hopper (Inverted pyramid) */}
      <mesh position={[0, height * 0.6 + 0.15 + height * 0.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow material={matBody}>
        <boxGeometry args={[width * 0.85, height * 0.6, depth * 0.85]} />
      </mesh>
      
      {/* Feed Hopper Top Flange */}
      <mesh position={[0, height * 0.9 + 0.15, 0]} material={matStructure}>
        <cylinderGeometry args={[0.4, 0.4, 0.1, 24]} />
      </mesh>
      <BoltCircle radius={0.4} count={8} y={height * 0.9 + 0.15} z={0} size={0.016} rotation={[0, 0, 0]} />
    </group>
  );
}

/* ==========================================================================
   5. BAG CLAMP & FILLING SPOUT
   ========================================================================== */

function BagClampAndSpout({ width, depth, clampOpen }: { width: number; depth: number; clampOpen: boolean }) {
  const jawOffset = clampOpen ? 0.25 : 0.05;
  const baseY = 1.2;

  return (
    <group position={[0, baseY - 0.2, 0]}>
      {/* Filling Spout */}
      <mesh castShadow material={matBody}>
        <cylinderGeometry args={[0.12, 0.12, 0.6, 24]} />
      </mesh>
      <mesh position={[0, -0.35, 0]} material={matStructure}>
        <cylinderGeometry args={[0.14, 0.14, 0.1, 24]} />
      </mesh>
      {/* Spout flange */}
      <mesh position={[0, -0.42, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <torusGeometry args={[0.15, 0.02, 8, 24]} />
      </mesh>

      {/* Left Jaw */}
      <mesh position={[-jawOffset - 0.15, 0.1, 0]} castShadow material={matBodyDark}>
        <boxGeometry args={[0.15, 0.3, depth * 0.6]} />
      </mesh>
      {/* Right Jaw */}
      <mesh position={[jawOffset + 0.15, 0.1, 0]} castShadow material={matBodyDark}>
        <boxGeometry args={[0.15, 0.3, depth * 0.6]} />
      </mesh>

      {/* Pneumatic Cylinders */}
      <group position={[-0.3, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow material={matBodyDark}>
          <cylinderGeometry args={[0.05, 0.05, 0.35, 16]} />
        </mesh>
        {/* Piston rod */}
        <mesh position={[0, -0.2, 0]} material={matBody}>
          <cylinderGeometry args={[0.02, 0.02, 0.15, 12]} />
        </mesh>
      </group>
      <group position={[0.3, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow material={matBodyDark}>
          <cylinderGeometry args={[0.05, 0.05, 0.35, 16]} />
        </mesh>
        <mesh position={[0, -0.2, 0]} material={matBody}>
          <cylinderGeometry args={[0.02, 0.02, 0.15, 12]} />
        </mesh>
      </group>
    </group>
  );
}

/* ==========================================================================
   6. REALISTIC ANIMATED FLOUR BAG
   ========================================================================== */

function AnimatedBag({
  width,
  depth,
  cycleProgressRef,
  active,
}: {
  width: number;
  depth: number;
  cycleProgressRef: React.MutableRefObject<number>;
  active: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const seamRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (!meshRef.current) return;
    if (!active) {
      meshRef.current.visible = false;
      return;
    }

    const cycleProgress = cycleProgressRef.current;
    let posY = 0.5;
    let scaleY = 0.01;
    let posX = 0;
    let visible = true;

    if (cycleProgress < 0.1) {
      posY = 0.5;
      scaleY = 0.01;
    } else if (cycleProgress < 0.5) {
      const fillProg = (cycleProgress - 0.1) / 0.4;
      posY = 0.5;
      scaleY = fillProg * 0.8 + 0.01;
    } else if (cycleProgress < 0.6) {
      const dropProg = (cycleProgress - 0.5) / 0.1;
      posY = 0.5 - dropProg * 0.4;
      scaleY = 0.81;
    } else {
      const convProg = (cycleProgress - 0.6) / 0.4;
      posY = 0.1;
      scaleY = 0.81;
      posX = width / 2 + 0.1 + convProg * 1.2;
      if (cycleProgress > 0.95) visible = false;
    }

    meshRef.current.visible = visible;
    meshRef.current.position.set(posX, posY, 0);
    meshRef.current.scale.set(1, Math.max(0.01, scaleY / 0.81), 1);
    
    if (seamRef.current) {
        seamRef.current.scale.set(1, Math.max(0.01, scaleY / 0.81), 1);
        seamRef.current.position.y = (scaleY * 0.81) / 2; // Keep seam at top
    }
  });

  return (
    <group ref={meshRef} position={[0, 0.5, 0]}>
      {/* Main Bag Body */}
      <mesh castShadow>
        <boxGeometry args={[depth * 0.35, 0.81, width * 0.22]} />
        <meshStandardMaterial color="#f0f0eb" roughness={0.95} metalness={0} />
      </mesh>
      {/* Bag Seam / Fold line detail */}
      <mesh ref={seamRef} position={[0, 0.4, 0]}>
        <boxGeometry args={[depth * 0.36, 0.02, width * 0.23]} />
        <meshStandardMaterial color="#d0d0cb" roughness={0.95} metalness={0} />
      </mesh>
      {/* Subtle bag branding/text simulation */}
      <mesh position={[0, 0.1, width * 0.111]}>
         <planeGeometry args={[depth * 0.25, 0.3]} />
         <meshStandardMaterial color="#e0e0db" roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   7. OPERATOR PANEL (Enhanced)
   ========================================================================== */

function OperatorPanel({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {/* Panel Box */}
      <mesh castShadow material={matBodyDark}>
        <boxGeometry args={[0.6, 0.8, 0.2]} />
      </mesh>
      
      {/* HMI Screen */}
      <mesh position={[0, 0.15, 0.11]}>
        <boxGeometry args={[0.45, 0.35, 0.02]} />
        <meshStandardMaterial color={COLORS.hmiScreen} emissive={COLORS.hmiScreen} emissiveIntensity={0.5} metalness={0.1} roughness={0.2} />
      </mesh>
      
      {/* Start/Stop Buttons */}
      <mesh position={[-0.15, -0.15, 0.11]}>
        <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
        <meshStandardMaterial color={COLORS.accentGreen} />
      </mesh>
      <mesh position={[0, -0.15, 0.11]}>
        <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
        <meshStandardMaterial color={COLORS.accentRed} />
      </mesh>
      
      {/* Emergency Stop (Big Red Mushroom with Yellow Ring) */}
      <mesh position={[0.15, -0.15, 0.11]}>
        <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
        <meshStandardMaterial color={COLORS.accentYellow} />
      </mesh>
      <mesh position={[0.15, -0.15, 0.13]}>
        <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
        <meshStandardMaterial color={COLORS.eStopRed} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   8. SAFETY GUARDS & PLATFORM
   ========================================================================== */

function SafetyGuards({ width, depth }: { width: number; depth: number }) {
  return (
    <group>
      {/* Yellow Safety Rails around the clamp area */}
      <mesh position={[width / 2 + 0.1, 0.8, depth / 2 + 0.2]} castShadow material={matSafety}>
        <boxGeometry args={[0.05, 0.8, 0.6]} />
      </mesh>
      <mesh position={[-width / 2 - 0.1, 0.8, depth / 2 + 0.2]} castShadow material={matSafety}>
        <boxGeometry args={[0.05, 0.8, 0.6]} />
      </mesh>
      <mesh position={[0, 1.2, depth / 2 + 0.2]} material={matSafety}>
        <boxGeometry args={[width + 0.3, 0.05, 0.05]} />
      </mesh>
      {/* Toe board */}
      <mesh position={[0, 0.45, depth / 2 + 0.2]} material={matSafety}>
        <boxGeometry args={[width + 0.3, 0.1, 0.04]} />
      </mesh>

      {/* Service Platform (Back/Side) */}
      <mesh position={[-width / 2 - 0.5, 1.5, 0]} castShadow material={matBodyDark}>
        <boxGeometry args={[0.8, 0.08, depth + 0.4]} />
      </mesh>
      {/* Platform grating pattern */}
      {Array.from({ length: 4 }, (_, i) => {
        const z = -depth / 2 + 0.2 + (i / 3) * depth;
        return (
          <mesh key={i} position={[-width / 2 - 0.5, 1.54, z]} material={matStructure}>
            <boxGeometry args={[0.75, 0.02, 0.04]} />
          </mesh>
        );
      })}
      
      {/* Platform Railing */}
      <mesh position={[-width / 2 - 0.9, 1.9, 0]} material={matSafety}>
        <boxGeometry args={[0.05, 0.8, depth + 0.4]} />
      </mesh>
      <mesh position={[-width / 2 - 0.9, 1.55, 0]} material={matSafety}>
        <boxGeometry args={[0.05, 0.1, depth + 0.4]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   9. PLC DATA PANEL
   ========================================================================== */

function DataPanel({ position, active, bagCount }: { position: V3; active: boolean; bagCount: number }) {
  const lines = [
    { text: `PACKING MACHINE 01`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ${active ? 'RUNNING' : 'STOPPED'}`, size: 0.13, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Target Weight: 25.00 kg`, size: 0.13, color: '#3a3a3a' },
    { text: `Actual Weight: 24.99 kg`, size: 0.13, color: '#3a3a3a' },
    { text: `Bag Count: ${bagCount.toLocaleString()}`, size: 0.13, color: '#3a3a3a' },
    { text: `Bag Rate: ${active ? '650' : '0'} Bags/hr`, size: 0.13, color: '#3a3a3a' },
    { text: `Valve: ${active ? 'OPEN' : 'CLOSED'}`, size: 0.13, color: '#3a3a3a' },
    { text: `Conveyor: ${active ? 'RUNNING' : 'STOPPED'}`, size: 0.13, color: '#3a3a3a' },
    { text: `Alarm: OFF`, size: 0.13, color: COLORS.accentGreen },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.5, -0.02]}>
          <planeGeometry args={[2.2, 2.2]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.5, -0.015]}>
          <planeGeometry args={[2.24, 2.24]} />
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
   10. MAIN PACKING MACHINE COMPONENT
   ========================================================================== */

export interface PackingMachineProps {
  position?: V3;
  width?: number;
  depth?: number;
  height?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function PackingMachineComponent({
  position = [0, 0, 0],
  width = 2.4,
  depth = 1.8,
  height = 2.0,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
}: PackingMachineProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [bagCount, setBagCount] = useState(1542);
  const [clampOpen, setClampOpen] = useState(true);
  const cycleRef = useRef(0);
  const bagMeshProgress = useRef(0);
  
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  useFrame((_, delta) => {
    if (active) {
      const speed = 1 / 4;
      let newProgress = cycleRef.current + delta * speed;
      if (newProgress >= 1) {
        newProgress = 0;
        setBagCount((prev) => prev + 1);
      }
      cycleRef.current = newProgress;
      bagMeshProgress.current = newProgress;

      const shouldOpen = newProgress >= 0.6;
      setClampOpen((prev) => (prev === shouldOpen ? prev : shouldOpen));
    } else {
      cycleRef.current = 0;
      bagMeshProgress.current = 0;
      setClampOpen(true);
    }
  });

  return (
    <group position={position}>
      <MainFrame width={width} depth={depth} />
      <Hoppers width={width} depth={depth} height={height} />
      <BagClampAndSpout width={width} depth={depth} clampOpen={clampOpen} />
      <AnimatedBag width={width} depth={depth} cycleProgressRef={bagMeshProgress} active={active} />
      <OperatorPanel position={[width / 2 + 0.1, 1.5, depth / 2 - 0.2]} />
      <SafetyGuards width={width} depth={depth} />
      <StatusBeacon
        position={[-width / 2 + 0.25, height + 1.35, -depth / 2 + 0.25]}
        status={active ? 'run' : 'idle'}
      />
      
      {showDataPanel && (
        <DataPanel 
          position={[width / 2 + 2, 2, 0]} 
          active={active} 
          bagCount={bagCount} 
        />
      )}

      <mesh position={[0, 1.5, 0]} onClick={() => setInternalActive(!internalActive)} visible={false}>
        <boxGeometry args={[width + 1, 3.5, depth + 2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {showClickText && (
        <Text position={[0, 3.5, depth / 2 + 0.5]} fontSize={0.1} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
          {active ? '● CLICK TO STOP CYCLE' : '○ CLICK TO START CYCLE'}
        </Text>
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[80, 80, '#5c5c54', '#79796e']} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.6} />
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

export function PackingMachineScene() {
  const [active, setActive] = useState(true);
  return (
    <Canvas shadows camera={{ position: [6, 5, 6], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <PackingMachineComponent active={active} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={4} maxDistance={20} maxPolarAngle={Math.PI / 2.05} target={[0, 1.5, 0]} />
    </Canvas>
  );
}

export function PackingMachine() { return <PackingMachineScene />; }
export default PackingMachine;