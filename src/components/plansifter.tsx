'use client';

/**
 * Plansifter.tsx - INDUSTRIAL PLANSIFTER
 * ------------------------------------------------------------------------
 * A highly detailed industrial plansifter for a flour mill digital twin.
 * This is the tall, suspended machine that separates the ground product 
 * from the roller mill into flour, semolina, bran, and middlings.
 * 
 * Key Features:
 * - Tall steel support frame
 * - 4 suspension rods (iconic plansifter feature)
 * - Large rectangular sieve cabinet (gently vibrates/gyrates)
 * - Top-mounted drive motor with counterweight
 * - Multiple outlet chutes at the bottom (Flour, Semolina, Bran, Oversize)
 * - Large interactive front inspection doors
 * - Access ladder and platform
 * - Multi-stream particle animation for different products
 * - Floating PLC data panel
 * 
 * Usage:
 *   import { Plansifter } from './Plansifter';
 *   <Plansifter position={[0, 0, 0]} active={true} />
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

const COLORS = {
  cabinetSteel: '#8a9199',
  cabinetDark: '#5a6268',
  cabinetLight: '#a0a8b0',
  frameSteel: '#3a454c',
  frameSteelLight: '#4a555c',
  motorBlue: '#1e3a5f',
  motorDark: '#152a45',
  rodSteel: '#6b7278',
  accentYellow: '#e0a92c',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  flourWhite: '#f5f5f0',
  branBrown: '#8b5a2b',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   TALL SUPPORT FRAME
   ========================================================================== */

function SupportFrame({ width, depth, height }: { width: number; depth: number; height: number }) {
  const legPositions: V3[] = [
    [width / 2 - 0.2, height / 2, depth / 2 - 0.2],
    [-width / 2 + 0.2, height / 2, depth / 2 - 0.2],
    [width / 2 - 0.2, height / 2, -depth / 2 + 0.2],
    [-width / 2 + 0.2, height / 2, -depth / 2 + 0.2],
  ];

  return (
    <group>
      {/* Main Legs */}
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={[0.25, height, 0.25]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.35} />
        </mesh>
      ))}

      {/* Base Plates */}
      {legPositions.map((pos, i) => (
        <mesh key={`base-${i}`} position={[pos[0], -height / 2 + 0.05, pos[2]]}>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Top Cross Beams (where rods attach) */}
      <mesh position={[0, height / 2 - 0.1, 0]} castShadow>
        <boxGeometry args={[width, 0.2, 0.2]} />
        <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0, height / 2 - 0.1, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[depth, 0.2, 0.2]} />
        <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.75} roughness={0.35} />
      </mesh>
      
      {/* Mid-level bracing */}
      <mesh position={[0, 0, depth / 2 - 0.1]} castShadow>
        <boxGeometry args={[width - 0.4, 0.15, 0.15]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, -(depth / 2 - 0.1)]} castShadow>
        <boxGeometry args={[width - 0.4, 0.15, 0.15]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.35} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   SUSPENSION RODS
   ========================================================================== */

function SuspensionRods({ width, depth, cabinetHeight, frameHeight }: { 
  width: number; 
  depth: number; 
  cabinetHeight: number; 
  frameHeight: number; 
}) {
  const rodLength = frameHeight / 2 - cabinetHeight / 2 - 0.2;
  const rodPositions: V3[] = [
    [width / 2 - 0.4, -rodLength / 2 + 0.1, depth / 2 - 0.4],
    [-width / 2 + 0.4, -rodLength / 2 + 0.1, depth / 2 - 0.4],
    [width / 2 - 0.4, -rodLength / 2 + 0.1, -depth / 2 + 0.4],
    [-width / 2 + 0.4, -rodLength / 2 + 0.1, -depth / 2 + 0.4],
  ];

  return (
    <group>
      {rodPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.04, 0.04, rodLength, 12]} />
          <meshStandardMaterial color={COLORS.rodSteel} metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   MAIN SIEVE CABINET (Vibrating Body)
   ========================================================================== */

function SieveCabinet({ 
  width, 
  height, 
  depth, 
  active, 
  isDoorOpen, 
  onDoorToggle 
}: { 
  width: number; 
  height: number; 
  depth: number; 
  active: boolean; 
  isDoorOpen: boolean; 
  onDoorToggle: () => void; 
}) {
  const cabinetRef = useRef<THREE.Group>(null!);
  const door1Ref = useRef<THREE.Group>(null!);
  const door2Ref = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (!cabinetRef.current) return;
    
    // Gentle gyratory vibration motion
    if (active) {
      const t = clock.elapsedTime * 4;
      cabinetRef.current.position.x = Math.sin(t) * 0.025;
      cabinetRef.current.position.z = Math.cos(t) * 0.025;
      cabinetRef.current.rotation.y = Math.sin(t * 0.5) * 0.005;
    } else {
      cabinetRef.current.position.x = THREE.MathUtils.damp(cabinetRef.current.position.x, 0, 5, 0.016);
      cabinetRef.current.position.z = THREE.MathUtils.damp(cabinetRef.current.position.z, 0, 5, 0.016);
      cabinetRef.current.rotation.y = THREE.MathUtils.damp(cabinetRef.current.rotation.y, 0, 5, 0.016);
    }

    // Door animation
    const targetRot = isDoorOpen ? -Math.PI / 2.2 : 0;
    if (door1Ref.current) {
      door1Ref.current.rotation.y = THREE.MathUtils.damp(door1Ref.current.rotation.y, targetRot, 4, 0.016);
    }
    if (door2Ref.current) {
      door2Ref.current.rotation.y = THREE.MathUtils.damp(door2Ref.current.rotation.y, -targetRot, 4, 0.016);
    }
  });

  const doorWidth = width * 0.45;
  const doorHeight = height * 0.6;

  return (
    <group ref={cabinetRef}>
      {/* Main Cabinet Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial 
          color={hovered ? COLORS.cabinetLight : COLORS.cabinetSteel} 
          metalness={0.65} 
          roughness={0.4} 
        />
      </mesh>

      {/* Horizontal Sieve Stack Lines (Visual detail) */}
      {Array.from({ length: 8 }, (_, i) => {
        const y = -height / 2 + 0.5 + i * (height / 9);
        return (
          <mesh key={i} position={[0, y, depth / 2 + 0.01]}>
            <boxGeometry args={[width * 0.98, 0.04, 0.02]} />
            <meshStandardMaterial color={COLORS.cabinetDark} metalness={0.7} roughness={0.35} />
          </mesh>
        );
      })}

      {/* Top Cap */}
      <mesh position={[0, height / 2 + 0.05, 0]}>
        <boxGeometry args={[width + 0.1, 0.1, depth + 0.1]} />
        <meshStandardMaterial color={COLORS.cabinetDark} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Bottom Base */}
      <mesh position={[0, -height / 2 - 0.05, 0]}>
        <boxGeometry args={[width + 0.1, 0.1, depth + 0.1]} />
        <meshStandardMaterial color={COLORS.cabinetDark} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Manufacturer Plate */}
      <mesh position={[0, height * 0.35, depth / 2 + 0.02]}>
        <boxGeometry args={[width * 0.3, 0.25, 0.01]} />
        <meshStandardMaterial color={COLORS.cabinetLight} metalness={0.8} roughness={0.25} />
      </mesh>
      <Text
        position={[0, height * 0.35, depth / 2 + 0.03]}
        fontSize={0.07}
        color={COLORS.frameSteel}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        PLANSIFTER PS-8
      </Text>

      {/* Interactive Inspection Doors */}
      <group
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onDoorToggle(); }}
      >
        {/* Left Door */}
        <group ref={door1Ref} position={[-doorWidth / 2 - 0.02, 0, depth / 2 + 0.02]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[doorWidth, doorHeight, 0.08]} />
            <meshStandardMaterial color={COLORS.cabinetSteel} metalness={0.65} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[doorWidth - 0.1, doorHeight - 0.1, 0.02]} />
            <meshStandardMaterial color={COLORS.cabinetDark} metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[doorWidth / 2 - 0.1, 0, 0.08]}>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.8} roughness={0.25} />
          </mesh>
        </group>

        {/* Right Door */}
        <group ref={door2Ref} position={[doorWidth / 2 + 0.02, 0, depth / 2 + 0.02]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[doorWidth, doorHeight, 0.08]} />
            <meshStandardMaterial color={COLORS.cabinetSteel} metalness={0.65} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[doorWidth - 0.1, doorHeight - 0.1, 0.02]} />
            <meshStandardMaterial color={COLORS.cabinetDark} metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[-doorWidth / 2 + 0.1, 0, 0.08]}>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ==========================================================================
   TOP DRIVE MOTOR & COUNTERWEIGHT
   ========================================================================== */

function TopDriveMotor({ position, active }: { position: V3; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null!);
  const counterweightRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 10;
    }
    if (counterweightRef.current && active) {
      // Counterweight spins with the motor shaft
      counterweightRef.current.rotation.y += delta * 10;
    }
  });

  return (
    <group position={position}>
      {/* Motor Housing */}
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.5, 0.5]} />
        <meshStandardMaterial color={COLORS.motorBlue} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Motor Shaft Housing */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.2, 24]} />
        <meshStandardMaterial color={COLORS.motorDark} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Counterweight (Visible spinning part) */}
      <mesh ref={counterweightRef} position={[0, -0.45, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.1]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Fan Cover (Side) */}
      <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 24]} />
        <meshStandardMaterial color={COLORS.motorDark} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Fan Blades */}
      <mesh ref={fanRef} position={[0.38, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.03, 8]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.27, 0.2]}>
        <sphereGeometry args={[0.04, 12, 12]} />
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
   MULTIPLE OUTLET CHUTES
   ========================================================================== */

function OutletChutes({ width, depth, position }: { width: number; depth: number; position: V3 }) {
  const chuteWidth = width * 0.2;
  const chuteDepth = depth * 0.8;
  const spacing = width * 0.25;
  const positions = [-spacing * 1.5, -spacing * 0.5, spacing * 0.5, spacing * 1.5];
  const labels = ['FLOUR', 'SEMOLINA', 'BRAN', 'OVERSIZE'];
  const colors = [COLORS.flourWhite, '#e8d5b5', COLORS.branBrown, '#8a9199'];

  return (
    <group position={position}>
      {positions.map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* Chute Body */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[chuteWidth, 0.8, chuteDepth]} />
            <meshStandardMaterial color={COLORS.cabinetSteel} metalness={0.65} roughness={0.4} />
          </mesh>
          {/* Bottom Flange */}
          <mesh position={[0, -0.42, 0]}>
            <boxGeometry args={[chuteWidth + 0.05, 0.06, chuteDepth + 0.05]} />
            <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.75} roughness={0.3} />
          </mesh>
          {/* Label */}
          <Text
            position={[0, 0, chuteDepth / 2 + 0.05]}
            fontSize={0.06}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {labels[i]}
          </Text>
          {/* Colored indicator stripe */}
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
   FEED INLET
   ========================================================================== */

function FeedInlet({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.8, 0.6]} />
        <meshStandardMaterial color={COLORS.cabinetSteel} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.65, 0.06, 0.65]} />
        <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.75} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   ACCESS LADDER & PLATFORM
   ========================================================================== */

function AccessLadder({ height, depth }: { height: number; depth: number }) {
  return (
    <group position={[0, 0, depth / 2 + 0.3]}>
      {/* Ladder Rails */}
      <mesh position={[-0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.05, height * 0.8, 0.05]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.05, height * 0.8, 0.05]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.35} />
      </mesh>
      {/* Rungs */}
      {Array.from({ length: 12 }, (_, i) => {
        const y = -height * 0.35 + i * (height * 0.7 / 11);
        return (
          <mesh key={i} position={[0, y, 0.05]} castShadow>
            <boxGeometry args={[0.5, 0.04, 0.04]} />
            <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.8} roughness={0.3} />
          </mesh>
        );
      })}
      {/* Top Platform */}
      <mesh position={[0, height * 0.45, 0.2]} castShadow>
        <boxGeometry args={[1.2, 0.08, 0.8]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Platform Railing */}
      <mesh position={[0, height * 0.45 + 0.4, 0.55]}>
        <boxGeometry args={[1.2, 0.04, 0.04]} />
        <meshStandardMaterial color={COLORS.accentYellow} metalness={0.6} roughness={0.4} />
      </mesh>
      {[-0.55, 0.55].map((x, i) => (
        <mesh key={i} position={[x, height * 0.45 + 0.2, 0.55]}>
          <boxGeometry args={[0.04, 0.4, 0.04]} />
          <meshStandardMaterial color={COLORS.accentYellow} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   DATA PANEL (PLC Data)
   ========================================================================== */

function DataPanel({
  position,
  active,
}: {
  position: V3;
  active: boolean;
}) {
  const lines = [
    { text: `PLANSIFTER PS-8`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ${active ? 'RUNNING' : 'STOPPED'}`, size: 0.13, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Motor RPM: ${active ? '960' : '0'}`, size: 0.13, color: '#3a3a3a' },
    { text: `Vibration: ${active ? '4.2' : '0.0'} mm`, size: 0.13, color: '#3a3a3a' },
    { text: `Feed Rate: ${active ? '12.0' : '0.0'} TPH`, size: 0.13, color: '#3a3a3a' },
    { text: `Flour Outlet: ${active ? '4.8' : '0.0'} TPH`, size: 0.13, color: '#3a3a3a' },
    { text: `Bran Outlet: ${active ? '2.1' : '0.0'} TPH`, size: 0.13, color: '#3a3a3a' },
    { text: `Alarm: OFF`, size: 0.13, color: COLORS.accentGreen },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.5, -0.02]}>
          <planeGeometry args={[2.2, 2.0]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.5, -0.015]}>
          <planeGeometry args={[2.24, 2.04]} />
          <meshStandardMaterial color={COLORS.accentYellow} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {lines.map((line, i) => (
          <Text
            key={i}
            position={[-1, -i * 0.22, 0]}
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
   MAIN PLANSIFTER COMPONENT
   ========================================================================== */

export interface PlansifterProps {
  position?: V3;
  width?: number;
  height?: number;
  depth?: number;
  frameHeight?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function PlansifterComponent({
  position = [0, 0, 0],
  width = 2.5,
  height = 3.5,
  depth = 2.0,
  frameHeight = 6.0,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
}: PlansifterProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  return (
    <group position={position}>
      {/* 1. Tall Support Frame */}
      <SupportFrame width={width} depth={depth} height={frameHeight} />

      {/* 2. Suspension Rods */}
      <SuspensionRods width={width} depth={depth} cabinetHeight={height} frameHeight={frameHeight} />

      {/* 3. Main Sieve Cabinet (Vibrating) */}
      <SieveCabinet 
        width={width} 
        height={height} 
        depth={depth} 
        active={active} 
        isDoorOpen={doorsOpen} 
        onDoorToggle={() => setDoorsOpen(!doorsOpen)} 
      />

      {/* 4. Top Drive Motor */}
      <TopDriveMotor position={[0, height / 2 + 0.3, 0]} active={active} />

      {/* 5. Feed Inlet */}
      <FeedInlet position={[0, height / 2 + 0.8, 0]} />

      {/* 6. Multiple Outlet Chutes */}
      <OutletChutes width={width} depth={depth} position={[0, -height / 2 - 0.4, 0]} />

      {/* 7. Access Ladder & Platform */}
      <AccessLadder height={frameHeight} depth={depth} />

      {/* 8. Particle Animations (Multi-stream) */}
      {active && (
        <>
          {/* Flour stream (white) */}
          <Sparkles count={40} scale={[0.4, 0.5, 0.4]} size={2} speed={1.5} position={[-width * 0.375, -height / 2 - 1, 0]} color={COLORS.flourWhite} />
          {/* Semolina stream (light yellow) */}
          <Sparkles count={30} scale={[0.4, 0.5, 0.4]} size={2} speed={1.5} position={[-width * 0.125, -height / 2 - 1, 0]} color="#e8d5b5" />
          {/* Bran stream (brown) */}
          <Sparkles count={25} scale={[0.4, 0.5, 0.4]} size={2} speed={1.5} position={[width * 0.125, -height / 2 - 1, 0]} color={COLORS.branBrown} />
          {/* Oversize stream (gray) */}
          <Sparkles count={15} scale={[0.4, 0.5, 0.4]} size={2} speed={1.5} position={[width * 0.375, -height / 2 - 1, 0]} color="#8a9199" />
        </>
      )}

      {showDataPanel && (
        <DataPanel position={[width / 2 + 2, height / 2, 0]} active={active} />
      )}

      {showClickText && (
        <>
          <Text
            position={[0, height / 2 + 1.5, depth / 2 + 0.5]}
            fontSize={0.1}
            color={COLORS.accentCyan}
            anchorX="center"
            anchorY="middle"
          >
            {doorsOpen ? '● DOORS OPEN' : '○ CLICK DOORS TO INSPECT'}
          </Text>
          <Text
            position={[0, -height / 2 - 1.5, depth / 2 + 0.5]}
            fontSize={0.1}
            color={COLORS.accentCyan}
            anchorX="center"
            anchorY="middle"
          >
            {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
          </Text>
        </>
      )}

      {/* Invisible Click Targets */}
      <mesh
        position={[0, 0, 0]}
        onClick={() => setInternalActive(!internalActive)}
        visible={false}
      >
        <boxGeometry args={[width + 2, frameHeight, depth + 2]} />
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -3.01, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[80, 80, '#5c5c54', '#79796e']} position={[0, -3, 0]} />
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
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-far={50}
      />
    </>
  );
}

/* ==========================================================================
   EXPORT - SCENE
   ========================================================================== */

export function PlansifterScene() {
  const [active, setActive] = useState(true);

  return (
    <Canvas shadows camera={{ position: [12, 8, 12], fov: 35 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <PlansifterComponent
        width={2.5}
        height={3.5}
        depth={2.0}
        frameHeight={6.0}
        active={active}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={35}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 1, 0]}
      />
    </Canvas>
  );
}

export function Plansifter() {
  return <PlansifterScene />;
}

export default Plansifter;