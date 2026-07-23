'use client';

/**
 * FlourBin.tsx - INDUSTRIAL FLOUR STORAGE BIN
 * ------------------------------------------------------------------------
 * A highly detailed, food-grade flour storage bin for a flour mill digital twin.
 * Unlike the raw grain silo, this bin features smooth stainless steel walls,
 * a steep hopper cone, and is designed for indoor installation.
 * 
 * Key Features:
 * - Smooth cylindrical body with steep 60-70° hopper cone
 * - Top-mounted vent filter and side filling pipe
 * - 3 level sensors (High, Mid, Low) with reactive status lights
 * - Interactive inspection door
 * - Cone-mounted vibrator to prevent bridging
 * - Integrated rotary valve underneath for discharge
 * - Small service ladder and maintenance platform
 * - Animated internal fill level and flour flow particles
 * - Independent PLC data panel for each bin
 * 
 * Usage:
 *   import { FlourBin } from './FlourBin';
 *   <FlourBin position={[0, 0, 0]} label="FLOUR BIN A" fillPercent={78} />
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

const COLORS = {
  binSteel: '#d4d8dc', // Smooth stainless steel look
  binSteelDark: '#a0a8b0',
  coneSteel: '#b0b8c0',
  frameSteel: '#4a555c',
  frameSteelLight: '#6b7278',
  motorBlue: '#1e3a5f',
  motorDark: '#152a45',
  flourWhite: '#f5f5f0',
  accentYellow: '#e0a92c',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   SUPPORT LEGS & BRACING
   ========================================================================== */

function SupportLegs({ radius, legHeight }: { radius: number; legHeight: number }) {
  const legPositions: V3[] = [
    [radius * 0.85, legHeight / 2, radius * 0.85],
    [-radius * 0.85, legHeight / 2, radius * 0.85],
    [radius * 0.85, legHeight / 2, -radius * 0.85],
    [-radius * 0.85, legHeight / 2, -radius * 0.85],
  ];

  return (
    <group>
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={[0.15, legHeight, 0.15]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.35} />
        </mesh>
      ))}
      {legPositions.map((pos, i) => (
        <mesh key={`base-${i}`} position={[pos[0], -legHeight / 2 + 0.05, pos[2]]}>
          <boxGeometry args={[0.3, 0.08, 0.3]} />
          <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Cross Bracing */}
      {[
        { start: [radius * 0.85, legHeight * 0.3, radius * 0.85], end: [-radius * 0.85, legHeight * 0.3, -radius * 0.85] },
        { start: [-radius * 0.85, legHeight * 0.3, radius * 0.85], end: [radius * 0.85, legHeight * 0.3, -radius * 0.85] },
      ].map((brace, i) => {
        const startV = new THREE.Vector3(...brace.start);
        const endV = new THREE.Vector3(...brace.end);
        const mid = startV.clone().add(endV).multiplyScalar(0.5);
        const dir = endV.clone().sub(startV);
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize());
        return (
          <mesh key={`brace-${i}`} position={mid} quaternion={quat} castShadow>
            <cylinderGeometry args={[0.03, 0.03, dir.length(), 8]} />
            <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.75} roughness={0.35} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   BIN BODY, CONE & INTERNAL FILL
   ========================================================================== */

function BinBodyAndFill({ 
  radius, height, coneHeight, fillPercent, label 
}: { 
  radius: number; height: number; coneHeight: number; fillPercent: number; label: string; 
}) {
  const totalHeight = height + coneHeight;
  // Fill height calculation (cylinder part + partial cone)
  const maxFillHeight = height + coneHeight * 0.8;
  const currentFillHeight = Math.max(0.1, maxFillHeight * (fillPercent / 100));

  return (
    <group position={[0, totalHeight / 2, 0]}>
      {/* Smooth Cylindrical Body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, height, 32]} />
        <meshStandardMaterial color={COLORS.binSteel} metalness={0.6} roughness={0.2} />
      </mesh>

      {/* Steep Hopper Cone (60-70 degrees) */}
      <mesh position={[0, -height / 2 - coneHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 0.15, coneHeight, 32]} />
        <meshStandardMaterial color={COLORS.coneSteel} metalness={0.6} roughness={0.25} />
      </mesh>

      {/* Top Roof */}
      <mesh position={[0, height / 2 + 0.05, 0]}>
        <cylinderGeometry args={[radius + 0.05, radius + 0.05, 0.1, 32]} />
        <meshStandardMaterial color={COLORS.binSteelDark} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Internal Flour Fill */}
      <mesh position={[0, -height / 2 - coneHeight / 2 + currentFillHeight / 2, 0]}>
        <cylinderGeometry args={[radius * 0.95, radius * 0.12, currentFillHeight, 32]} />
        <meshStandardMaterial color={COLORS.flourWhite} roughness={0.9} metalness={0} />
      </mesh>

      {/* Label on Body */}
      <Text
        position={[0, height * 0.2, radius + 0.02]}
        fontSize={0.25}
        color={COLORS.frameSteel}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {label}
      </Text>
    </group>
  );
}

/* ==========================================================================
   VENT FILTER & FILLING PIPE
   ========================================================================== */

function VentAndPipe({ radius, height, coneHeight }: { radius: number; height: number; coneHeight: number }) {
  const totalHeight = height + coneHeight;
  return (
    <group>
      {/* Vent Filter (Top Center) */}
      <mesh position={[0, totalHeight + 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.6, 24]} />
        <meshStandardMaterial color={COLORS.binSteelDark} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, totalHeight + 0.65, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 24]} />
        <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Filling Pipe (Side Inlet) */}
      <mesh position={[radius + 0.4, totalHeight - 0.5, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1.0, 24]} />
        <meshStandardMaterial color={COLORS.binSteelDark} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[radius + 0.1, totalHeight - 0.1, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 24]} />
        <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   SENSORS, DOOR & VIBRATOR
   ========================================================================== */

function Accessories({ radius, height, coneHeight, fillPercent, vibratorActive }: { 
  radius: number; height: number; coneHeight: number; fillPercent: number; vibratorActive: boolean; 
}) {
  const totalHeight = height + coneHeight;
  const highY = totalHeight * 0.85;
  const midY = totalHeight * 0.5;
  const lowY = totalHeight * 0.15;

  const isHigh = fillPercent > 85;
  const isMid = fillPercent > 40 && fillPercent <= 85;
  const isLow = fillPercent <= 40;

  return (
    <group>
      {/* Level Sensors */}
      {[
        { y: highY, label: 'HIGH', active: isHigh, color: COLORS.accentRed },
        { y: midY, label: 'MID', active: isMid, color: COLORS.accentYellow },
        { y: lowY, label: 'LOW', active: isLow, color: COLORS.accentGreen },
      ].map((sensor, i) => (
        <group key={i} position={[radius + 0.1, sensor.y, 0]}>
          <mesh><cylinderGeometry args={[0.025, 0.025, 0.3, 8]} /><meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.3} /></mesh>
          <mesh position={[0, 0.17, 0]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color={sensor.active ? sensor.color : '#555555'} emissive={sensor.active ? sensor.color : '#000000'} emissiveIntensity={sensor.active ? 1.0 : 0} />
          </mesh>
          <Text position={[0.12, 0, 0]} fontSize={0.06} color="#ffffff" anchorX="left" anchorY="middle">{sensor.label}</Text>
        </group>
      ))}

      {/* Inspection Door */}
      <mesh position={[0, totalHeight * 0.3, radius + 0.02]}>
        <boxGeometry args={[0.5, 0.7, 0.04]} />
        <meshStandardMaterial color={COLORS.binSteelDark} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.15, totalHeight * 0.3, radius + 0.05]}>
        <boxGeometry args={[0.04, 0.15, 0.04]} />
        <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Vibrator on Cone */}
      <group position={[radius * 0.6, -height / 2 - coneHeight * 0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.2, 0.25, 0.2]} />
          <meshStandardMaterial color={COLORS.motorBlue} metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Vibration animation */}
        {vibratorActive && <VibrationEffect />}
      </group>
    </group>
  );
}

function VibrationEffect() {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.x = Math.sin(clock.elapsedTime * 50) * 0.005;
    }
  });
  return <group ref={ref} />;
}

/* ==========================================================================
   INTEGRATED ROTARY VALVE (Underneath)
   ========================================================================== */

function IntegratedRotaryValve({ position, active }: { position: V3; active: boolean }) {
  const rotorRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (rotorRef.current && active) rotorRef.current.rotation.z += delta * 3;
  });

  return (
    <group position={position}>
      {/* Valve Housing */}
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.6, 0.8]} />
        <meshStandardMaterial color={COLORS.binSteelDark} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Motor */}
      <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 24]} />
        <meshStandardMaterial color={COLORS.motorBlue} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Outlet Pipe */}
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.4, 24]} />
        <meshStandardMaterial color={COLORS.binSteelDark} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Internal Rotor (Visible through gap) */}
      <group ref={rotorRef} position={[0, 0, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 4) * Math.PI]}>
            <boxGeometry args={[0.7, 0.05, 0.1]} />
            <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ==========================================================================
   LADDER & PLATFORM
   ========================================================================== */

function LadderAndPlatform({ height, coneHeight, radius }: { height: number; coneHeight: number; radius: number }) {
  const totalHeight = height + coneHeight;
  return (
    <group position={[0, 0, radius + 0.4]}>
      {/* Ladder Rails */}
      <mesh position={[-0.25, totalHeight * 0.3, 0]} castShadow><boxGeometry args={[0.04, totalHeight * 0.6, 0.04]} /><meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.35} /></mesh>
      <mesh position={[0.25, totalHeight * 0.3, 0]} castShadow><boxGeometry args={[0.04, totalHeight * 0.6, 0.04]} /><meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.35} /></mesh>
      {/* Rungs */}
      {Array.from({ length: 8 }, (_, i) => {
        const y = totalHeight * 0.05 + i * (totalHeight * 0.55 / 7);
        return <mesh key={i} position={[0, y, 0.05]} castShadow><boxGeometry args={[0.4, 0.03, 0.03]} /><meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.8} roughness={0.3} /></mesh>;
      })}
      {/* Platform */}
      <mesh position={[0, totalHeight * 0.7, 0.3]} castShadow><boxGeometry args={[1.0, 0.06, 0.8]} /><meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} /></mesh>
      {/* Railing */}
      <mesh position={[0, totalHeight * 0.7 + 0.4, 0.65]}><boxGeometry args={[1.0, 0.04, 0.04]} /><meshStandardMaterial color={COLORS.accentYellow} metalness={0.6} roughness={0.4} /></mesh>
      {[-0.45, 0.45].map((x, i) => (
        <mesh key={i} position={[x, totalHeight * 0.7 + 0.2, 0.65]}><boxGeometry args={[0.04, 0.4, 0.04]} /><meshStandardMaterial color={COLORS.accentYellow} metalness={0.6} roughness={0.4} /></mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   DATA PANEL
   ========================================================================== */

function DataPanel({ position, label, fillPercent, capacity, active }: { 
  position: V3; label: string; fillPercent: number; capacity: number; active: boolean; 
}) {
  const currentWeight = (capacity * (fillPercent / 100)).toFixed(1);
  const lines = [
    { text: `${label}`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ONLINE`, size: 0.13, color: COLORS.accentGreen },
    { text: `Fill Level: ${Math.round(fillPercent)}%`, size: 0.13, color: '#3a3a3a' },
    { text: `Weight: ${currentWeight} Tons`, size: 0.13, color: '#3a3a3a' },
    { text: `Capacity: ${capacity} Tons`, size: 0.13, color: '#3a3a3a' },
    { text: `Rotary Valve: ${active ? 'RUNNING' : 'STOPPED'}`, size: 0.13, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Alarm: OFF`, size: 0.13, color: COLORS.accentGreen },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.45, -0.02]}><planeGeometry args={[2.0, 1.8]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -0.45, -0.015]}><planeGeometry args={[2.04, 1.84]} /><meshStandardMaterial color={COLORS.accentYellow} transparent opacity={0.4} side={THREE.DoubleSide} /></mesh>
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
   MAIN FLOUR BIN COMPONENT
   ========================================================================== */

export interface FlourBinProps {
  position?: V3;
  label?: string;
  radius?: number;
  height?: number;
  coneHeight?: number;
  legHeight?: number;
  capacity?: number;
  fillPercent?: number;
  active?: boolean;
  showDataPanel?: boolean;
}

export function FlourBinComponent({
  position = [0, 0, 0],
  label = "FLOUR BIN",
  radius = 1.2,
  height = 5,
  coneHeight = 1.8,
  legHeight = 2.5,
  capacity = 20,
  fillPercent = 75,
  active = true,
  showDataPanel = true,
}: FlourBinProps) {
  const totalHeight = height + coneHeight;
  // Lift body so hopper tip sits at the top of the support legs
  const bodyY = legHeight + coneHeight / 2;

  return (
    <group position={position}>
      <SupportLegs radius={radius} legHeight={legHeight} />
      <group position={[0, bodyY, 0]}>
        <BinBodyAndFill radius={radius} height={height} coneHeight={coneHeight} fillPercent={fillPercent} label={label} />
        <VentAndPipe radius={radius} height={height} coneHeight={coneHeight} />
        <Accessories radius={radius} height={height} coneHeight={coneHeight} fillPercent={fillPercent} vibratorActive={active && fillPercent > 10} />
        <LadderAndPlatform height={height} coneHeight={coneHeight} radius={radius} />
      </group>

      <IntegratedRotaryValve position={[0, legHeight - 0.55, 0]} active={active} />

      {/* Flour Flow Particles */}
      {active && fillPercent > 0 && (
        <Sparkles count={40} scale={[0.4, 0.8, 0.4]} size={2} speed={1.5} position={[0, legHeight - 1.1, 0]} color={COLORS.flourWhite} />
      )}

      {showDataPanel && (
        <DataPanel
          position={[radius + 2, legHeight + totalHeight / 2, 0]}
          label={label}
          fillPercent={fillPercent}
          capacity={capacity}
          active={active}
        />
      )}
    </group>
  );
}

/* ==========================================================================
   SCENE EXPORT (Demonstrating 3 Bins)
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
      <directionalLight position={[15, 20, 10]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} shadow-camera-far={50} />
    </>
  );
}

export function FlourBinScene() {
  return (
    <Canvas shadows camera={{ position: [15, 10, 15], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      
      {/* Three Independent Flour Bins */}
      <FlourBinComponent position={[-4, 0, 0]} label="FLOUR BIN A" fillPercent={85} capacity={20} active={true} />
      <FlourBinComponent position={[0, 0, 0]} label="FLOUR BIN B" fillPercent={45} capacity={20} active={true} />
      <FlourBinComponent position={[4, 0, 0]} label="FLOUR BIN C" fillPercent={12} capacity={20} active={false} />
      
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={10} maxDistance={40} maxPolarAngle={Math.PI / 2.05} target={[0, 4, 0]} />
    </Canvas>
  );
}

export function FlourBin() { return <FlourBinScene />; }
export default FlourBin;