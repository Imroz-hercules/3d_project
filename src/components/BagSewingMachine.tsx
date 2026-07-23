'use client';

/**
 * BagSewingMachine.tsx - INDUSTRIAL AUTOMATIC BAG SEWING MACHINE
 * ------------------------------------------------------------------------
 * A highly detailed industrial bag sewing machine for a flour mill digital twin.
 * This machine automatically stitches the top of filled flour bags as they 
 * pass through on the conveyor.
 * 
 * Key Features:
 * - Gantry-style steel frame straddling the conveyor path
 * - Prominent sewing head with animated up-and-down needle
 * - Thread reel (spool) mounted at the top with thread guides
 * - Height adjustment column for different bag sizes
 * - Bag guide rails to keep bags upright during sewing
 * - Small drive motor for the sewing mechanism
 * - Control box with HMI and Emergency Stop
 * - Animated bag passing through the sewing zone
 * - Real-time PLC data panel
 * 
 * Usage:
 *   import { BagSewingMachine } from './BagSewingMachine';
 *   <BagSewingMachine position={[0, 0, 0]} active={true} />
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

const COLORS = {
  frameSteel: '#4a555c',
  frameSteelDark: '#3a454c',
  frameSteelLight: '#6b7278',
  sewingHeadGray: '#5a6268',
  motorBlue: '#1e3a5f',
  motorDark: '#152a45',
  safetyYellow: '#e0a92c',
  hmiScreen: '#00d4ff',
  hmiBody: '#2a2a2a',
  eStopRed: '#ff2222',
  threadWhite: '#f5f5f0',
  bagWhite: '#f5f5f0',
  bagSeam: '#d4d8dc',
  concrete: '#9a9a92',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
} as const;

/* ==========================================================================
   GANTRY FRAME & HEIGHT ADJUSTMENT COLUMN
   ========================================================================== */

function GantryFrame({ width, depth, height }: { width: number; depth: number; height: number }) {
  return (
    <group>
      {/* Base Plates */}
      <mesh position={[width / 2 - 0.1, 0.05, depth / 2 - 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.1, 0.4]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-width / 2 + 0.1, 0.05, depth / 2 - 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.1, 0.4]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[width / 2 - 0.1, 0.05, -depth / 2 + 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.1, 0.4]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-width / 2 + 0.1, 0.05, -depth / 2 + 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.1, 0.4]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Vertical Legs */}
      <mesh position={[width / 2 - 0.1, height / 2, depth / 2 - 0.1]} castShadow>
        <boxGeometry args={[0.15, height, 0.15]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[-width / 2 + 0.1, height / 2, depth / 2 - 0.1]} castShadow>
        <boxGeometry args={[0.15, height, 0.15]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[width / 2 - 0.1, height / 2, -depth / 2 + 0.1]} castShadow>
        <boxGeometry args={[0.15, height, 0.15]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[-width / 2 + 0.1, height / 2, -depth / 2 + 0.1]} castShadow>
        <boxGeometry args={[0.15, height, 0.15]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Top Cross Beam */}
      <mesh position={[0, height - 0.1, 0]} castShadow>
        <boxGeometry args={[width, 0.2, depth]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Height Adjustment Column (Left side) */}
      <mesh position={[-width / 2 + 0.25, height * 0.6, 0]} castShadow>
        <boxGeometry args={[0.12, height * 0.8, 0.12]} />
        <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.75} roughness={0.35} />
      </mesh>
      {/* Adjustment Scale Markings */}
      {Array.from({ length: 10 }, (_, i) => {
        const y = height * 0.25 + i * (height * 0.6 / 9);
        return (
          <mesh key={i} position={[-width / 2 + 0.32, y, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.06]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   SEWING HEAD & ANIMATED NEEDLE
   ========================================================================== */

function SewingHead({ position, active }: { position: V3; active: boolean }) {
  const needleRef = useRef<THREE.Mesh>(null!);
  const motorFanRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (active) {
      // Rapid needle up/down motion
      if (needleRef.current) {
        needleRef.current.position.y = Math.sin(clock.elapsedTime * 25) * 0.08;
      }
      // Motor spinning
      if (motorFanRef.current) {
        motorFanRef.current.rotation.z += 0.5;
      }
    } else {
      if (needleRef.current) {
        needleRef.current.position.y = THREE.MathUtils.damp(needleRef.current.position.y, 0, 5, 0.016);
      }
    }
  });

  return (
    <group position={position}>
      {/* Main Head Housing */}
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.4, 0.4]} />
        <meshStandardMaterial color={COLORS.sewingHeadGray} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Drive Motor (Side) */}
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.25, 24]} />
        <meshStandardMaterial color={COLORS.motorBlue} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Motor Fan */}
      <mesh ref={motorFanRef} position={[0.35, 0, 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 8]} />
        <meshStandardMaterial color={COLORS.motorDark} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Needle Bar Housing */}
      <mesh position={[0, -0.25, 0]}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Animated Needle */}
      <mesh ref={needleRef} position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.15, 8]} />
        <meshStandardMaterial color="#c0c5c9" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Presser Foot */}
      <mesh position={[0, -0.28, 0.08]}>
        <boxGeometry args={[0.08, 0.04, 0.06]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.8} roughness={0.25} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   THREAD SYSTEM (Spool, Guides, Thread)
   ========================================================================== */

function ThreadSystem({ headPosition }: { headPosition: V3 }) {
  const spoolY = headPosition[1] + 0.6;
  const spoolX = headPosition[0];
  const spoolZ = headPosition[2];

  return (
    <group>
      {/* Spool Pin */}
      <mesh position={[spoolX, spoolY, spoolZ]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 16]} />
        <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Thread Spool */}
      <mesh position={[spoolX, spoolY + 0.05, spoolZ]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.15, 24]} />
        <meshStandardMaterial color={COLORS.threadWhite} roughness={0.9} metalness={0} />
      </mesh>

      {/* Thread Guides */}
      <mesh position={[spoolX, spoolY - 0.2, spoolZ + 0.1]}>
        <torusGeometry args={[0.03, 0.005, 8, 16]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[spoolX, headPosition[1] + 0.1, spoolZ + 0.15]}>
        <torusGeometry args={[0.02, 0.005, 8, 16]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Thread Line (Static visual representation) */}
      <mesh position={[spoolX, (spoolY + headPosition[1]) / 2, spoolZ + 0.12]}>
        <cylinderGeometry args={[0.003, 0.003, spoolY - headPosition[1] + 0.2, 8]} />
        <meshStandardMaterial color={COLORS.threadWhite} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   BAG GUIDES & CONTROL BOX
   ========================================================================== */

function BagGuidesAndControl({ width, depth, height }: { width: number; depth: number; height: number }) {
  return (
    <group>
      {/* Bag Guide Rails (Keep bag upright) */}
      <mesh position={[0.25, height * 0.3, depth / 2 - 0.05]} castShadow>
        <boxGeometry args={[0.05, height * 0.4, 0.05]} />
        <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-0.25, height * 0.3, depth / 2 - 0.05]} castShadow>
        <boxGeometry args={[0.05, height * 0.4, 0.05]} />
        <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Control Box */}
      <group position={[width / 2 - 0.1, height * 0.7, depth / 2 + 0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.4, 0.15]} />
          <meshStandardMaterial color={COLORS.hmiBody} metalness={0.5} roughness={0.5} />
        </mesh>
        {/* HMI Screen */}
        <mesh position={[0, 0.05, 0.08]}>
          <boxGeometry args={[0.22, 0.15, 0.01]} />
          <meshStandardMaterial color={COLORS.hmiScreen} emissive={COLORS.hmiScreen} emissiveIntensity={0.5} />
        </mesh>
        {/* Buttons */}
        <mesh position={[-0.08, -0.1, 0.08]}>
          <cylinderGeometry args={[0.02, 0.02, 0.03, 16]} />
          <meshStandardMaterial color={COLORS.accentGreen} />
        </mesh>
        <mesh position={[0, -0.1, 0.08]}>
          <cylinderGeometry args={[0.02, 0.02, 0.03, 16]} />
          <meshStandardMaterial color={COLORS.accentRed} />
        </mesh>
        {/* Emergency Stop */}
        <mesh position={[0.08, -0.1, 0.09]}>
          <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
          <meshStandardMaterial color={COLORS.eStopRed} />
        </mesh>
      </group>
    </group>
  );
}

/* ==========================================================================
   ANIMATED BAG PASSING THROUGH
   ========================================================================== */

function SewingBag({ active, onComplete }: { active: boolean; onComplete: () => void }) {
  const bagRef = useRef<THREE.Mesh>(null!);
  const [progress, setProgress] = useState(0);

  useFrame((_, delta) => {
    if (active && bagRef.current) {
      const speed = 0.4;
      const newProgress = progress + delta * speed;
      setProgress(newProgress);
      
      bagRef.current.position.z = -1.0 + newProgress;
      
      if (newProgress >= 2.0) {
        onComplete();
      }
    }
  });

  if (!active && progress === 0) return null;

  return (
    <group ref={bagRef} position={[0, 0.4, -1.0]}>
      {/* Bag Body */}
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.7, 0.3]} />
        <meshStandardMaterial color={COLORS.bagWhite} roughness={0.9} metalness={0} />
      </mesh>
      {/* Stitched Seam (appears as it passes the needle) */}
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.38, 0.02, 0.28]} />
        <meshStandardMaterial color={COLORS.bagSeam} roughness={0.8} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   PLC DATA PANEL
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
        <mesh position={[0, -0.4, -0.02]}><planeGeometry args={[2.0, 1.8]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -0.4, -0.015]}><planeGeometry args={[2.04, 1.84]} /><meshStandardMaterial color={COLORS.safetyYellow} transparent opacity={0.4} side={THREE.DoubleSide} /></mesh>
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
   MAIN BAG SEWING MACHINE COMPONENT
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
    setBagKey(prev => prev + 1); // Reset bag animation
  };

  // Auto-spawn bags when active
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

      {/* Click target */}
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
   SCENE EXPORT
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
      <directionalLight position={[10, 15, 10]} intensity={1.4} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-far={40} />
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