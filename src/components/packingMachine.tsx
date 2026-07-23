'use client';

/**
 * PackingMachine.tsx - INDUSTRIAL AUTOMATIC PACKING MACHINE
 * ------------------------------------------------------------------------
 * A highly detailed industrial packing machine (weigh filler) for a flour mill 
 * digital twin. This is the centerpiece of the packing cell, receiving flour 
 * from the bin, weighing it, filling the bag, and discharging it.
 * 
 * Key Features:
 * - Heavy powder-coated steel main frame
 * - Stainless steel feed and weigh hoppers
 * - Visible load cells (4 pucks) supporting the weigh hopper
 * - Pneumatic bag clamp system (animated opening/closing jaws)
 * - Stainless steel filling spout
 * - Animated bag filling cycle (clamp -> fill -> drop -> convey)
 * - Integrated takeaway belt conveyor with moving rollers
 * - Operator control panel with HMI screen and Emergency Stop
 * - Yellow safety guards and service platform
 * - Real-time PLC data panel
 * 
 * Usage:
 *   import { PackingMachine } from './PackingMachine';
 *   <PackingMachine position={[0, 0, 0]} active={true} />
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

const COLORS = {
  frameSteel: '#4a555c',
  frameSteelDark: '#3a454c',
  stainless: '#d4d8dc',
  stainlessDark: '#a0a8b0',
  safetyYellow: '#e0a92c',
  safetyYellowDark: '#c88a0a',
  hmiScreen: '#00d4ff',
  hmiBody: '#2a2a2a',
  eStopRed: '#ff2222',
  bagWhite: '#f5f5f0',
  beltBlack: '#1a1a1a',
  rollerSteel: '#6b7278',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   MAIN FRAME & CONVEYOR STRUCTURE
   ========================================================================== */

function MainFrame({ width, depth }: { width: number; depth: number }) {
  const legHeight = 0.8;
  const legPositions: V3[] = [
    [width / 2 - 0.15, legHeight / 2, depth / 2 - 0.15],
    [-width / 2 + 0.15, legHeight / 2, depth / 2 - 0.15],
    [width / 2 - 0.15, legHeight / 2, -depth / 2 + 0.15],
    [-width / 2 + 0.15, legHeight / 2, -depth / 2 + 0.15],
  ];

  return (
    <group>
      {/* Legs */}
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={[0.15, legHeight, 0.15]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      
      {/* Base Plates */}
      {legPositions.map((pos, i) => (
        <mesh key={`base-${i}`} position={[pos[0], -legHeight / 2 + 0.05, pos[2]]}>
          <boxGeometry args={[0.3, 0.1, 0.3]} />
          <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Top Frame (Supports the hoppers) */}
      <mesh position={[0, legHeight + 0.1, 0]} castShadow>
        <boxGeometry args={[width, 0.2, depth]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Conveyor Structure (Extends out the front) */}
      <group position={[0, legHeight - 0.1, depth / 2 + 0.6]}>
        {/* Conveyor Side Rails */}
        <mesh position={[width / 2 - 0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.15, 1.2]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[-width / 2 + 0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.15, 1.2]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Conveyor Belt */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[width - 0.3, 0.04, 1.15]} />
          <meshStandardMaterial color={COLORS.beltBlack} roughness={0.9} metalness={0.1} />
        </mesh>
        {/* Moving Rollers (Animated via texture or just static for now, we'll animate the bag over it) */}
        {Array.from({ length: 6 }, (_, i) => {
          const z = -0.5 + (i / 5) * 1.0;
          return (
            <mesh key={i} position={[0, 0.08, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, width - 0.35, 16]} />
              <meshStandardMaterial color={COLORS.rollerSteel} metalness={0.8} roughness={0.2} />
            </mesh>
          );
        })}
        {/* Conveyor Motor/Drive at the end */}
        <mesh position={[0, 0, 0.65]} castShadow>
          <boxGeometry args={[0.3, 0.2, 0.2]} />
          <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.7} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/* ==========================================================================
   HOPPERS & LOAD CELLS
   ========================================================================== */

function Hoppers({ width, depth, height }: { width: number; depth: number; height: number }) {
  const baseY = 1.2; // Top of the main frame legs

  return (
    <group position={[0, baseY, 0]}>
      {/* Load Cells (4 pucks between frame and weigh hopper) */}
      {[
        [width / 2 - 0.3, 0, depth / 2 - 0.3],
        [-width / 2 + 0.3, 0, depth / 2 - 0.3],
        [width / 2 - 0.3, 0, -depth / 2 + 0.3],
        [-width / 2 + 0.3, 0, -depth / 2 + 0.3],
      ].map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[0.06, 0.06, 0.15, 16]} />
          <meshStandardMaterial color={COLORS.stainlessDark} metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* Weigh Hopper (Boxy, stainless steel) */}
      <mesh position={[0, height / 2 + 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.8, height * 0.6, depth * 0.8]} />
        <meshStandardMaterial color={COLORS.stainless} metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Feed Hopper (Inverted pyramid on top) */}
      <mesh position={[0, height * 0.6 + 0.15 + height * 0.3, 0]} castShadow receiveShadow>
        <coneGeometry args={[width * 0.45, height * 0.6, 4]} />
        <meshStandardMaterial color={COLORS.stainless} metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Rotate cone to align with box */}
      <mesh position={[0, height * 0.6 + 0.15 + height * 0.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[width * 0.85, height * 0.6, depth * 0.85]} />
        <meshStandardMaterial color={COLORS.stainless} metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* Feed Hopper Top Flange (Connection to Rotary Valve) */}
      <mesh position={[0, height * 0.9 + 0.15, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.1, 24]} />
        <meshStandardMaterial color={COLORS.stainlessDark} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   BAG CLAMP & FILLING SPOUT
   ========================================================================== */

function BagClampAndSpout({ width, depth, clampOpen }: { width: number; depth: number; clampOpen: boolean }) {
  const jawOffset = clampOpen ? 0.25 : 0.05;
  const baseY = 1.2;

  return (
    <group position={[0, baseY - 0.2, 0]}>
      {/* Filling Spout (Center tube) */}
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.6, 24]} />
        <meshStandardMaterial color={COLORS.stainless} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.1, 24]} />
        <meshStandardMaterial color={COLORS.stainlessDark} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Left Jaw */}
      <mesh position={[-jawOffset - 0.15, 0.1, 0]} castShadow>
        <boxGeometry args={[0.15, 0.3, depth * 0.6]} />
        <meshStandardMaterial color={COLORS.stainlessDark} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Right Jaw */}
      <mesh position={[jawOffset + 0.15, 0.1, 0]} castShadow>
        <boxGeometry args={[0.15, 0.3, depth * 0.6]} />
        <meshStandardMaterial color={COLORS.stainlessDark} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Pneumatic Cylinders (Above jaws) */}
      <mesh position={[-0.3, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 16]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.3, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 16]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   ANIMATED BAG
   ========================================================================== */

function AnimatedBag({ width, depth, cycleProgress }: { width: number; depth: number; cycleProgress: number }) {
  // cycleProgress: 0 to 1
  // 0.0 - 0.1: Clamp closes, bag appears
  // 0.1 - 0.5: Bag fills (scales Y)
  // 0.5 - 0.6: Clamp opens, bag drops
  // 0.6 - 1.0: Bag moves on conveyor

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
    posY = 0.1; // On conveyor
    scaleY = 0.81;
    posX = convProg * 1.2; // Move along conveyor
    if (cycleProgress > 0.95) visible = false;
  }

  if (!visible) return null;

  return (
    <mesh position={[posX, posY, depth / 2 + 0.6]} castShadow>
      <boxGeometry args={[width * 0.4, scaleY, depth * 0.4]} />
      <meshStandardMaterial color={COLORS.bagWhite} roughness={0.9} metalness={0} />
    </mesh>
  );
}

/* ==========================================================================
   OPERATOR PANEL
   ========================================================================== */

function OperatorPanel({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {/* Panel Box */}
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.8, 0.2]} />
        <meshStandardMaterial color={COLORS.hmiBody} metalness={0.5} roughness={0.5} />
      </mesh>
      
      {/* HMI Screen */}
      <mesh position={[0, 0.15, 0.11]}>
        <boxGeometry args={[0.45, 0.35, 0.02]} />
        <meshStandardMaterial color={COLORS.hmiScreen} emissive={COLORS.hmiScreen} emissiveIntensity={0.5} metalness={0.1} roughness={0.2} />
      </mesh>
      
      {/* Buttons */}
      <mesh position={[-0.15, -0.15, 0.11]}>
        <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
        <meshStandardMaterial color={COLORS.accentGreen} />
      </mesh>
      <mesh position={[0, -0.15, 0.11]}>
        <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
        <meshStandardMaterial color={COLORS.accentRed} />
      </mesh>
      
      {/* Emergency Stop (Big Red Mushroom) */}
      <mesh position={[0.15, -0.15, 0.12]}>
        <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
        <meshStandardMaterial color={COLORS.eStopRed} />
      </mesh>
      <mesh position={[0.15, -0.15, 0.14]}>
        <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
        <meshStandardMaterial color={COLORS.eStopRed} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   SAFETY GUARDS & PLATFORM
   ========================================================================== */

function SafetyGuards({ width, depth }: { width: number; depth: number }) {
  return (
    <group>
      {/* Yellow Safety Rails around the clamp area */}
      <mesh position={[width / 2 + 0.1, 0.8, depth / 2 + 0.2]}>
        <boxGeometry args={[0.05, 0.8, 0.6]} />
        <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-width / 2 - 0.1, 0.8, depth / 2 + 0.2]}>
        <boxGeometry args={[0.05, 0.8, 0.6]} />
        <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.2, depth / 2 + 0.2]}>
        <boxGeometry args={[width + 0.3, 0.05, 0.05]} />
        <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Service Platform (Back/Side) */}
      <mesh position={[-width / 2 - 0.5, 1.5, 0]} castShadow>
        <boxGeometry args={[0.8, 0.05, depth + 0.4]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Platform Railing */}
      <mesh position={[-width / 2 - 0.9, 1.9, 0]}>
        <boxGeometry args={[0.05, 0.8, depth + 0.4]} />
        <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   PLC DATA PANEL
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
        <mesh position={[0, -0.5, -0.02]}><planeGeometry args={[2.2, 2.2]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -0.5, -0.015]}><planeGeometry args={[2.24, 2.24]} /><meshStandardMaterial color={COLORS.safetyYellow} transparent opacity={0.4} side={THREE.DoubleSide} /></mesh>
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
   MAIN PACKING MACHINE COMPONENT
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
  const [cycleProgress, setCycleProgress] = useState(0);
  const [bagCount, setBagCount] = useState(1542);
  const [clampOpen, setClampOpen] = useState(true);
  
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  useFrame((_, delta) => {
    if (active) {
      // Cycle takes 4 seconds
      const speed = 1 / 4; 
      let newProgress = cycleProgress + delta * speed;
      
      if (newProgress >= 1) {
        newProgress = 0;
        setBagCount(prev => prev + 1);
      }
      
      setCycleProgress(newProgress);

      // Clamp logic based on cycle
      if (newProgress < 0.1 || (newProgress >= 0.5 && newProgress < 0.6)) {
        setClampOpen(false); // Closing or Closed
      } else if (newProgress >= 0.1 && newProgress < 0.5) {
        setClampOpen(false); // Filling (Clamp closed)
      } else {
        setClampOpen(true); // Open (Dropping and Conveying)
      }
    } else {
      setClampOpen(true);
      setCycleProgress(0);
    }
  });

  return (
    <group position={position}>
      <MainFrame width={width} depth={depth} />
      <Hoppers width={width} depth={depth} height={height} />
      <BagClampAndSpout width={width} depth={depth} clampOpen={clampOpen} />
      <AnimatedBag width={width} depth={depth} cycleProgress={cycleProgress} />
      <OperatorPanel position={[width / 2 + 0.1, 1.5, depth / 2 - 0.2]} />
      <SafetyGuards width={width} depth={depth} />
      
      {showDataPanel && (
        <DataPanel 
          position={[width / 2 + 2, 2, 0]} 
          active={active} 
          bagCount={bagCount} 
        />
      )}

      {/* Click target */}
      <mesh position={[0, 1.5, 0]} onClick={() => setInternalActive(!internalActive)} visible={false}>
        <boxGeometry args={[width + 1, 3.5, depth + 2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {showClickText && (
        <Text position={[0, 3.5, depth / 2 + 0.5]} fontSize={0.1} color={COLORS.hmiScreen} anchorX="center" anchorY="middle">
          {active ? '● CLICK TO STOP CYCLE' : '○ CLICK TO START CYCLE'}
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