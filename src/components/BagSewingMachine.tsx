'use client';

/**
 * BagSewingMachine.tsx — HIGH-FIDELITY INDUSTRIAL AUTOMATIC BAG SEWING MACHINE
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, robust I-beam gantry legs with gussets, a highly 
 * detailed sewing head with realistic needle bar and presser foot, enhanced 
 * thread system with tensioners, and a realistic animated flour bag.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useEffect } from 'react';
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
  threadWhite: '#f5f5f0',
  bagWhite: '#f0f0eb',
  bagSeam: '#d0d0cb',
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
   3. GANTRY FRAME (I-beam legs, base plates, gussets, height adjustment)
   ========================================================================== */

function GantryFrame({ width, depth, height }: { width: number; depth: number; height: number }) {
  const beltY = 0.85;
  const legPositions: V3[] = [
    [width / 2 - 0.15, beltY / 2, depth / 2 - 0.15],
    [-width / 2 + 0.15, beltY / 2, depth / 2 - 0.15],
    [width / 2 - 0.15, beltY / 2, -depth / 2 + 0.15],
    [-width / 2 + 0.15, beltY / 2, -depth / 2 + 0.15],
  ];

  return (
    <group>
      {/* Legs */}
      {legPositions.map((pos, i) => (
        <group key={i}>
          {/* I-beam leg simulation */}
          <mesh position={pos} castShadow material={matStructure}>
            <boxGeometry args={[0.14, beltY, 0.14]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.16, beltY, 0.05]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.05, beltY, 0.16]} />
          </mesh>

          {/* Base plate */}
          <mesh position={[pos[0], -beltY / 2 + 0.04, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.35, 0.08, 0.35]} />
          </mesh>

          {/* Anchor bolts */}
          {[-0.12, 0.12].map((dx) =>
            [-0.12, 0.12].map((dz) => (
              <Bolt key={`${dx}-${dz}`} position={[pos[0] + dx, -beltY / 2 + 0.09, pos[2] + dz]} size={0.016} />
            ))
          )}
        </group>
      ))}

      {/* Integrated sewing conveyor bed */}
      <mesh position={[0, beltY, 0]} castShadow receiveShadow material={matRubber}>
        <boxGeometry args={[width * 0.6, 0.06, depth + 0.3]} />
      </mesh>
      
      {/* Bed side supports */}
      <mesh position={[width * 0.25, beltY + 0.08, 0]} castShadow material={matStructure}>
        <boxGeometry args={[0.06, 0.12, depth + 0.25]} />
      </mesh>
      <mesh position={[-width * 0.25, beltY + 0.08, 0]} castShadow material={matStructure}>
        <boxGeometry args={[0.06, 0.12, depth + 0.25]} />
      </mesh>

      {/* Top Cross Beam */}
      <mesh position={[0, height - 0.1, 0]} castShadow material={matStructure}>
        <boxGeometry args={[width, 0.2, depth]} />
      </mesh>
      
      {/* Top beam gussets */}
      {legPositions.map((pos, i) => (
        <mesh key={`gusset-${i}`} position={[pos[0], height - 0.25, pos[2]]} castShadow material={matStructure}>
          <boxGeometry args={[0.15, 0.2, 0.05]} />
        </mesh>
      ))}

      {/* Height Adjustment Column (Left side) */}
      <mesh position={[-width / 2 + 0.25, height * 0.6, 0]} castShadow material={matBody}>
        <boxGeometry args={[0.12, height * 0.8, 0.12]} />
      </mesh>
      
      {/* Adjustment Scale Markings */}
      {Array.from({ length: 10 }, (_, i) => {
        const y = height * 0.25 + i * (height * 0.6 / 9);
        return (
          <group key={i}>
            <mesh position={[-width / 2 + 0.32, y, 0]}>
              <boxGeometry args={[0.03, 0.02, 0.08]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
            <Text position={[-width / 2 + 0.45, y, 0]} fontSize={0.04} color="#000000" anchorX="left" anchorY="middle">
              {Math.round((i / 9) * 100)}
            </Text>
          </group>
        );
      })}
      
      {/* Locking handle */}
      <mesh position={[-width / 2 + 0.32, height * 0.6, 0.08]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.02, 0.15, 0.02]} />
        <meshStandardMaterial color={COLORS.accentRed} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   4. SEWING HEAD & ANIMATED NEEDLE (High-fidelity)
   ========================================================================== */

function SewingHead({ position, active }: { position: V3; active: boolean }) {
  const needleRef = useRef<THREE.Mesh>(null!);
  const motorFanRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (active) {
      if (needleRef.current) {
        needleRef.current.position.y = Math.sin(clock.elapsedTime * 30) * 0.06;
      }
      if (motorFanRef.current) {
        motorFanRef.current.rotation.z += 0.6;
      }
    } else {
      if (needleRef.current) {
        needleRef.current.position.y = THREE.MathUtils.damp(needleRef.current.position.y, 0, 5, 0.016);
      }
    }
  });

  return (
    <group position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Main Head Housing */}
      <mesh castShadow material={hovered ? matBody : matBody}>
        <boxGeometry args={[0.5, 0.4, 0.4]} />
      </mesh>

      {/* Drive Motor (Side) */}
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matMotor}>
        <cylinderGeometry args={[0.12, 0.12, 0.25, 24]} />
      </mesh>
      
      {/* Motor cooling fins */}
      {Array.from({ length: 6 }, (_, i) => {
        const z = -0.08 + (i / 5) * 0.16;
        return (
          <mesh key={i} position={[0.35, 0, z]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
            <cylinderGeometry args={[0.13, 0.13, 0.01, 24]} />
          </mesh>
        );
      })}
      
      {/* Motor fan */}
      <mesh ref={motorFanRef} position={[0.35, 0, 0.14]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 8]} />
      </mesh>

      {/* Needle Bar Housing */}
      <mesh position={[0, -0.25, 0]} castShadow material={matBodyDark}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
      </mesh>

      {/* Animated Needle */}
      <mesh ref={needleRef} position={[0, -0.35, 0]} castShadow material={matStructure}>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
      </mesh>
      
      {/* Needle eye detail */}
      <mesh position={[0, -0.4, 0]} material={matBody}>
        <boxGeometry args={[0.015, 0.015, 0.005]} />
      </mesh>

      {/* Presser Foot */}
      <mesh position={[0, -0.28, 0.08]} castShadow material={matBodyDark}>
        <boxGeometry args={[0.08, 0.04, 0.06]} />
      </mesh>
      
      {/* Safety guard over drive belt */}
      <mesh position={[0.2, 0, 0]} material={matSafety}>
        <boxGeometry args={[0.15, 0.25, 0.15]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   5. THREAD SYSTEM (Spool, Guides, Tensioner, Thread)
   ========================================================================== */

function ThreadSystem({ headPosition }: { headPosition: V3 }) {
  const spoolY = headPosition[1] + 0.6;
  const spoolX = headPosition[0];
  const spoolZ = headPosition[2];

  return (
    <group>
      {/* Spool Pin */}
      <mesh position={[spoolX, spoolY, spoolZ]} material={matStructure}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 16]} />
      </mesh>

      {/* Thread Spool */}
      <mesh position={[spoolX, spoolY + 0.05, spoolZ]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.15, 24]} />
        <meshStandardMaterial color={COLORS.threadWhite} roughness={0.9} metalness={0} />
      </mesh>
      
      {/* Spool end caps */}
      <mesh position={[spoolX, spoolY + 0.05, spoolZ + 0.08]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <cylinderGeometry args={[0.13, 0.13, 0.02, 24]} />
      </mesh>

      {/* Thread Tensioner Discs */}
      <mesh position={[spoolX, spoolY - 0.15, spoolZ + 0.1]} rotation={[0, 0, Math.PI / 2]} material={matBodyDark}>
        <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
      </mesh>
      <mesh position={[spoolX, spoolY - 0.15, spoolZ + 0.12]} rotation={[0, 0, Math.PI / 2]} material={matBodyDark}>
        <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
      </mesh>

      {/* Thread Guides */}
      <mesh position={[spoolX, spoolY - 0.2, spoolZ + 0.11]} material={matStructure}>
        <torusGeometry args={[0.03, 0.005, 8, 16]} />
      </mesh>
      <mesh position={[spoolX, headPosition[1] + 0.1, spoolZ + 0.15]} material={matStructure}>
        <torusGeometry args={[0.02, 0.005, 8, 16]} />
      </mesh>

      {/* Thread Line (Static visual representation) */}
      <mesh position={[spoolX, (spoolY + headPosition[1]) / 2, spoolZ + 0.12]}>
        <cylinderGeometry args={[0.002, 0.002, spoolY - headPosition[1] + 0.2, 8]} />
        <meshStandardMaterial color={COLORS.threadWhite} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   6. BAG GUIDES & CONTROL BOX (Enhanced)
   ========================================================================== */

function BagGuidesAndControl({ width, depth, height }: { width: number; depth: number; height: number }) {
  return (
    <group>
      {/* Bag Guide Rails (Keep bag upright) */}
      <mesh position={[0.25, height * 0.3, depth / 2 - 0.05]} castShadow material={matSafety}>
        <boxGeometry args={[0.05, height * 0.4, 0.05]} />
      </mesh>
      <mesh position={[-0.25, height * 0.3, depth / 2 - 0.05]} castShadow material={matSafety}>
        <boxGeometry args={[0.05, height * 0.4, 0.05]} />
      </mesh>
      
      {/* Guide rail mounting brackets */}
      <mesh position={[0.25, height * 0.1, depth / 2 - 0.05]} material={matStructure}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
      </mesh>
      <mesh position={[-0.25, height * 0.1, depth / 2 - 0.05]} material={matStructure}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
      </mesh>

      {/* Control Box */}
      <group position={[width / 2 - 0.1, height * 0.7, depth / 2 + 0.1]}>
        <mesh castShadow material={matBodyDark}>
          <boxGeometry args={[0.3, 0.4, 0.15]} />
        </mesh>
        
        {/* Mounting bolts */}
        <Bolt position={[-0.12, 0.15, 0.08]} rotation={[0, Math.PI / 2, 0]} size={0.012} />
        <Bolt position={[0.12, 0.15, 0.08]} rotation={[0, Math.PI / 2, 0]} size={0.012} />
        <Bolt position={[-0.12, -0.15, 0.08]} rotation={[0, Math.PI / 2, 0]} size={0.012} />
        <Bolt position={[0.12, -0.15, 0.08]} rotation={[0, Math.PI / 2, 0]} size={0.012} />

        {/* HMI Screen */}
        <mesh position={[0, 0.05, 0.08]}>
          <boxGeometry args={[0.22, 0.15, 0.01]} />
          <meshStandardMaterial color={COLORS.hmiScreen} emissive={COLORS.hmiScreen} emissiveIntensity={0.5} metalness={0.1} roughness={0.2} />
        </mesh>
        
        {/* Start/Stop Buttons */}
        <mesh position={[-0.08, -0.1, 0.08]}>
          <cylinderGeometry args={[0.02, 0.02, 0.03, 16]} />
          <meshStandardMaterial color={COLORS.accentGreen} />
        </mesh>
        <mesh position={[0, -0.1, 0.08]}>
          <cylinderGeometry args={[0.02, 0.02, 0.03, 16]} />
          <meshStandardMaterial color={COLORS.accentRed} />
        </mesh>
        
        {/* Emergency Stop (Big Red Mushroom with Yellow Ring) */}
        <mesh position={[0.08, -0.1, 0.08]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
          <meshStandardMaterial color={COLORS.accentYellow} />
        </mesh>
        <mesh position={[0.08, -0.1, 0.095]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshStandardMaterial color={COLORS.eStopRed} />
        </mesh>
      </group>
    </group>
  );
}

/* ==========================================================================
   7. REALISTIC ANIMATED FLOUR BAG
   ========================================================================== */

function SewingBag({ active, onComplete }: { active: boolean; onComplete: () => void }) {
  const bagRef = useRef<THREE.Group>(null!);
  const seamRef = useRef<THREE.Mesh>(null!);
  const stitchRef = useRef<THREE.Mesh>(null!);
  const progressRef = useRef(0);
  const doneRef = useRef(false);

  useFrame((_, delta) => {
    if (!active || !bagRef.current || doneRef.current) return;
    const speed = 0.4;
    progressRef.current = Math.min(2.0, progressRef.current + delta * speed);
    bagRef.current.position.z = -1.0 + progressRef.current;
    
    if (seamRef.current) seamRef.current.position.z = -1.0 + progressRef.current;
    if (stitchRef.current) stitchRef.current.position.z = -1.0 + progressRef.current;

    if (progressRef.current >= 2.0 - 0.001) {
      doneRef.current = true;
      onComplete();
    }
  });

  useEffect(() => {
    progressRef.current = 0;
    doneRef.current = false;
    if (bagRef.current) bagRef.current.position.z = -1.0;
  }, [active]);

  if (!active) return null;

  return (
    <group ref={bagRef} position={[0, 1.2, -1.0]}>
      {/* Main Bag Body */}
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.7, 0.3]} />
        <meshStandardMaterial color={COLORS.bagWhite} roughness={0.95} metalness={0} />
      </mesh>
      
      {/* Bag Top Seam / Fold line detail */}
      <mesh ref={seamRef} position={[0, 0.36, 0]}>
        <boxGeometry args={[0.41, 0.02, 0.31]} />
        <meshStandardMaterial color={COLORS.bagSeam} roughness={0.95} metalness={0} />
      </mesh>
      
      {/* Simulated Stitch Line (appears after passing needle) */}
      <mesh ref={stitchRef} position={[0, 0.36, 0.15]}>
        <boxGeometry args={[0.38, 0.01, 0.02]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} metalness={0} />
      </mesh>
      
      {/* Subtle bag branding panel */}
      <mesh position={[0, 0.1, 0.151]}>
         <planeGeometry args={[0.25, 0.3]} />
         <meshStandardMaterial color="#e0e0db" roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   8. PLC DATA PANEL
   ========================================================================== */

function DataPanel({ position, active, stitchCount }: { position: V3; active: boolean; stitchCount: number }) {
  const lines = [
    { text: `BAG SEWING MACHINE`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ${active ? 'RUNNING' : 'STOPPED'}`, size: 0.13, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Stitch Count: ${stitchCount.toLocaleString()}`, size: 0.13, color: '#3a3a3a' },
    { text: `Motor Speed: ${active ? '1800' : '0'} RPM`, size: 0.13, color: '#3a3a3a' },
    { text: `Thread Break: OFF`, size: 0.13, color: COLORS.accentGreen },
    { text: `Bag Present: ${active ? 'YES' : 'NO'}`, size: 0.13, color: '#3a3a3a' },
    { text: `Alarm: OFF`, size: 0.13, color: COLORS.accentGreen },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.4, -0.02]}>
          <planeGeometry args={[2.0, 1.8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.4, -0.015]}>
          <planeGeometry args={[2.04, 1.84]} />
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
   9. MAIN BAG SEWING MACHINE COMPONENT
   ========================================================================== */

export interface BagSewingMachineProps {
  position?: V3;
  width?: number;
  depth?: number;
  height?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function BagSewingMachineComponent({
  position = [0, 0, 0],
  width = 1.0,
  depth = 0.8,
  height = 2.2,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
}: BagSewingMachineProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [stitchCount, setStitchCount] = useState(1456);
  const [bagKey, setBagKey] = useState(0);
  
  const active = controlledActive !== undefined ? controlledActive : internalActive;
  const headPosition: V3 = [0, height * 0.6, 0];

  const handleBagComplete = () => {
    setStitchCount(prev => prev + 1);
    setBagKey(prev => prev + 1);
  };

  useEffect(() => {
    if (active) {
      const interval = setInterval(() => {
        setBagKey(prev => prev + 1);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [active]);

  return (
    <group position={position}>
      <GantryFrame width={width} depth={depth} height={height} />
      <SewingHead position={headPosition} active={active} />
      <ThreadSystem headPosition={headPosition} />
      <BagGuidesAndControl width={width} depth={depth} height={height} />
      
      <SewingBag key={bagKey} active={active} onComplete={handleBagComplete} />

      {showDataPanel && (
        <DataPanel 
          position={[width / 2 + 1.5, height * 0.7, 0]} 
          active={active} 
          stitchCount={stitchCount} 
        />
      )}

      <mesh position={[0, height / 2, 0]} onClick={() => setInternalActive(!internalActive)} visible={false}>
        <boxGeometry args={[width + 1, height, depth + 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {showClickText && (
        <Text position={[0, height + 0.3, 0]} fontSize={0.1} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
          {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
        </Text>
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

export function BagSewingMachineScene() {
  const [active, setActive] = useState(true);
  return (
    <Canvas shadows camera={{ position: [4, 3, 4], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <BagSewingMachineComponent active={active} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={2} maxDistance={15} maxPolarAngle={Math.PI / 2.05} target={[0, 1, 0]} />
    </Canvas>
  );
}

export function BagSewingMachine() { return <BagSewingMachineScene />; }
export default BagSewingMachine;