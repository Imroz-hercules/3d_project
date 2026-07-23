'use client';

/**
 * ConditioningBin.tsx - INDUSTRIAL TEMPERING BIN
 * ------------------------------------------------------------------------
 * A realistic industrial conditioning bin (tempering bin) for a flour mill 
 * digital twin. This is where wheat rests after dampening to allow moisture 
 * to penetrate the kernel before milling.
 * 
 * Key Features:
 * - Tall, slim cylindrical body (distinct from the raw grain silo)
 * - Conical bottom hopper for discharge
 * - Support legs with cross bracing
 * - Top feed inlet pipe (from dampener)
 * - Bottom outlet pipe (to roller mill feed system)
 * - Vent filter on top
 * - Level sensors (High, Low, Full) with status lights
 * - Inspection hatch
 * - Animated fill level (grain inside)
 * - Floating PLC data panel
 * 
 * Usage:
 *   import { ConditioningBin } from './ConditioningBin';
 *   <ConditioningBin position={[0, 0, 0]} fillPercent={65} />
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import {
  matPaintedSteel,
  matSteel,
  matSteelDark,
  matStructureSteel,
} from '../materials';

type V3 = [number, number, number];

const COLORS = {
  binSteel: '#7a8288',
  binSteelDark: '#4a5058',
  binSteelLight: '#9aa2a8',
  coneSteel: '#5a6268',
  frameSteel: '#4a555c',
  frameSteelDark: '#3a454c',
  pipeSteel: '#6b7278',
  accentYellow: '#e0a92c',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  grainColor: '#e8d5b5',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   SUPPORT LEGS & BRACING
   ========================================================================== */

function SupportLegs({ radius, legHeight }: { radius: number; legHeight: number }) {
  const legPositions: V3[] = [
    [radius * 0.8, legHeight / 2, radius * 0.8],
    [-radius * 0.8, legHeight / 2, radius * 0.8],
    [radius * 0.8, legHeight / 2, -radius * 0.8],
    [-radius * 0.8, legHeight / 2, -radius * 0.8],
  ];

  return (
    <group>
      {/* Legs */}
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow dispose={null} material={matPaintedSteel}>
          <boxGeometry args={[0.2, legHeight, 0.2]} />
        </mesh>
      ))}
      
      {/* Base Plates */}
      {legPositions.map((pos, i) => (
        <mesh key={`base-${i}`} position={[pos[0], -legHeight / 2 + 0.05, pos[2]]} dispose={null} material={matStructureSteel}>
          <boxGeometry args={[0.4, 0.1, 0.4]} />
        </mesh>
      ))}

      {/* Cross Bracing (X pattern) */}
      {[
        { start: [radius * 0.8, legHeight * 0.3, radius * 0.8], end: [-radius * 0.8, legHeight * 0.3, -radius * 0.8] },
        { start: [-radius * 0.8, legHeight * 0.3, radius * 0.8], end: [radius * 0.8, legHeight * 0.3, -radius * 0.8] },
        { start: [radius * 0.8, legHeight * 0.7, radius * 0.8], end: [-radius * 0.8, legHeight * 0.7, -radius * 0.8] },
        { start: [-radius * 0.8, legHeight * 0.7, radius * 0.8], end: [radius * 0.8, legHeight * 0.7, -radius * 0.8] },
      ].map((brace, i) => {
        const startV = new THREE.Vector3(...brace.start);
        const endV = new THREE.Vector3(...brace.end);
        const mid = startV.clone().add(endV).multiplyScalar(0.5);
        const dir = endV.clone().sub(startV);
        const length = dir.length();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize());
        return (
          <mesh key={`brace-${i}`} position={mid} quaternion={quat} castShadow dispose={null} material={matStructureSteel}>
            <cylinderGeometry args={[0.04, 0.04, length, 8]} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   MAIN BIN BODY & CONE
   ========================================================================== */

function BinBodyAndCone({ 
  radius, 
  height, 
  coneHeight, 
  fillPercent 
}: { 
  radius: number; 
  height: number; 
  coneHeight: number; 
  fillPercent: number; 
}) {
  const totalHeight = height + coneHeight;
  const fillHeight = Math.max(0.1, (height + coneHeight * 0.5) * (fillPercent / 100));

  return (
    <group position={[0, totalHeight / 2, 0]}>
      {/* Cylindrical Body */}
      <mesh castShadow receiveShadow dispose={null} material={matSteel}>
        <cylinderGeometry args={[radius, radius, height, 32]} />
      </mesh>

      {/* Vertical Seams/Ribs */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * (radius + 0.02);
        const z = Math.sin(angle) * (radius + 0.02);
        return (
          <mesh key={i} position={[x, 0, z]} dispose={null} material={matSteelDark}>
            <boxGeometry args={[0.05, height, 0.05]} />
          </mesh>
        );
      })}

      {/* Conical Bottom (Hopper) */}
      <mesh position={[0, -height / 2 - coneHeight / 2, 0]} castShadow receiveShadow dispose={null} material={matSteel}>
        <cylinderGeometry args={[radius, radius * 0.2, coneHeight, 32]} />
      </mesh>

      {/* Grain Fill Material */}
      <mesh position={[0, -height / 2 - coneHeight / 2 + fillHeight / 2, 0]}>
        <cylinderGeometry args={[radius * 0.95, radius * 0.18, fillHeight, 32]} />
        <meshStandardMaterial color={COLORS.grainColor} roughness={0.9} metalness={0} />
      </mesh>

      {/* Top Roof (Flat with slight slope) */}
      <mesh position={[0, height / 2 + 0.1, 0]} dispose={null} material={matSteelDark}>
        <cylinderGeometry args={[radius + 0.1, radius + 0.1, 0.2, 32]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   INLET, OUTLET & VENT
   ========================================================================== */

function InletOutletVent({ radius, height, coneHeight }: { radius: number; height: number; coneHeight: number }) {
  const totalHeight = height + coneHeight;
  const outletRadius = radius * 0.2;

  return (
    <group>
      {/* Feed Inlet Pipe (Top Side) */}
      <mesh position={[radius + 0.5, totalHeight - 0.5, 0]} rotation={[0, 0, Math.PI / 4]} castShadow dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.25, 0.25, 1.2, 24]} />
      </mesh>
      {/* Inlet Flange */}
      <mesh position={[radius + 0.15, totalHeight - 0.15, 0]} rotation={[0, 0, Math.PI / 4]} dispose={null} material={matStructureSteel}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 24]} />
      </mesh>

      {/* Vent Filter (Top Center) */}
      <mesh position={[0, totalHeight + 0.3, 0]} castShadow dispose={null} material={matSteelDark}>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 24]} />
      </mesh>
      <mesh position={[0, totalHeight + 0.65, 0]} dispose={null} material={matStructureSteel}>
        <cylinderGeometry args={[0.35, 0.35, 0.1, 24]} />
      </mesh>

      {/* Outlet Pipe (Bottom) */}
      <mesh position={[0, -coneHeight / 2 - 0.3, 0]} castShadow dispose={null} material={matSteel}>
        <cylinderGeometry args={[outletRadius, outletRadius, 0.6, 24]} />
      </mesh>
      {/* Outlet Flange */}
      <mesh position={[0, -coneHeight / 2 - 0.65, 0]} dispose={null} material={matStructureSteel}>
        <cylinderGeometry args={[outletRadius + 0.05, outletRadius + 0.05, 0.1, 24]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   SENSORS & INSPECTION HATCH
   ========================================================================== */

function SensorsAndHatch({ radius, height, coneHeight, fillPercent }: { radius: number; height: number; coneHeight: number; fillPercent: number }) {
  const totalHeight = height + coneHeight;
  const highLevelY = totalHeight * 0.85;
  const lowLevelY = totalHeight * 0.25;
  const fullAlarmY = totalHeight * 0.95;

  const isHigh = fillPercent > 80;
  const isLow = fillPercent < 20;
  const isFull = fillPercent > 95;

  return (
    <group>
      {/* Sensor Rods */}
      {[
        { y: highLevelY, label: 'HIGH', active: isHigh, color: COLORS.accentYellow },
        { y: lowLevelY, label: 'LOW', active: isLow, color: COLORS.accentRed },
        { y: fullAlarmY, label: 'FULL', active: isFull, color: COLORS.accentRed },
      ].map((sensor, i) => (
        <group key={i} position={[radius + 0.1, sensor.y, 0]}>
          <mesh dispose={null} material={matStructureSteel}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial
              color={sensor.active ? sensor.color : '#555555'}
              emissive={sensor.active ? sensor.color : '#000000'}
              emissiveIntensity={sensor.active ? 1.0 : 0}
            />
          </mesh>
          <Text
            position={[0.15, 0, 0]}
            fontSize={0.08}
            color="#ffffff"
            anchorX="left"
            anchorY="middle"
          >
            {sensor.label}
          </Text>
        </group>
      ))}

      {/* Inspection Hatch (Small door on the side) */}
      <mesh position={[0, totalHeight * 0.4, radius + 0.02]} dispose={null} material={matSteelDark}>
        <boxGeometry args={[0.6, 0.8, 0.05]} />
      </mesh>
      {/* Hatch Handle */}
      <mesh position={[0.2, totalHeight * 0.4, radius + 0.06]} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[0.04, 0.2, 0.04]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   DATA PANEL (PLC Data)
   ========================================================================== */

function DataPanel({
  position,
  fillPercent,
  capacity,
  temperature,
  moisture,
  residenceTime,
}: {
  position: V3;
  fillPercent: number;
  capacity: number;
  temperature: number;
  moisture: number;
  residenceTime: number;
}) {
  const currentWeight = Math.round(capacity * (fillPercent / 100));
  const lines = [
    { text: `CONDITIONING BIN`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ONLINE`, size: 0.13, color: COLORS.accentGreen },
    { text: `Fill Level: ${Math.round(fillPercent)}%`, size: 0.13, color: '#3a3a3a' },
    { text: `Current Weight: ${currentWeight} Tons`, size: 0.13, color: '#3a3a3a' },
    { text: `Capacity: ${capacity} Tons`, size: 0.13, color: '#3a3a3a' },
    { text: `Temperature: ${temperature.toFixed(1)}°C`, size: 0.13, color: '#3a3a3a' },
    { text: `Moisture: ${moisture.toFixed(1)}%`, size: 0.13, color: '#3a3a3a' },
    { text: `Residence Time: ${residenceTime} Hours`, size: 0.13, color: '#3a3a3a' },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.45, -0.02]}>
          <planeGeometry args={[2.2, 2.0]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.45, -0.015]}>
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
   MAIN CONDITIONING BIN COMPONENT
   ========================================================================== */

export interface ConditioningBinProps {
  position?: V3;
  radius?: number;
  height?: number;
  coneHeight?: number;
  legHeight?: number;
  capacity?: number;
  fillPercent?: number;
  autoDemo?: boolean;
  showDataPanel?: boolean;
}

export function ConditioningBinComponent({
  position = [0, 0, 0],
  radius = 1.5,
  height = 6,
  coneHeight = 1.5,
  legHeight = 2.5,
  capacity = 12,
  fillPercent: controlledFill,
  autoDemo = true,
  showDataPanel = true,
}: ConditioningBinProps) {
  const [internalFill, setInternalFill] = useState(65);
  const fillPercent = controlledFill !== undefined ? controlledFill : internalFill;
  const [temperature] = useState(28);
  const [moisture] = useState(16.0);
  const [residenceTime] = useState(10);

  /** Raise body so cone tip / outlet clear the floor between the legs. */
  const bodyLift = coneHeight / 2 + 0.7;

  // Auto-demo animation for fill level
  useFrame(({ clock }) => {
    if (!autoDemo || controlledFill !== undefined) return;
    // Slowly oscillate fill level between 40% and 85%
    const t = clock.elapsedTime * 0.1;
    const newFill = 62.5 + Math.sin(t) * 22.5;
    setInternalFill(newFill);
  });

  return (
    <group position={position}>
      {/* 1. Support Legs */}
      <SupportLegs radius={radius} legHeight={legHeight} />

      <group position={[0, bodyLift, 0]}>
        {/* 2. Main Body & Cone (with grain fill) */}
        <BinBodyAndCone
          radius={radius}
          height={height}
          coneHeight={coneHeight}
          fillPercent={fillPercent}
        />

        {/* 3. Inlet, Outlet & Vent */}
        <InletOutletVent radius={radius} height={height} coneHeight={coneHeight} />

        {/* 4. Sensors & Hatch */}
        <SensorsAndHatch
          radius={radius}
          height={height}
          coneHeight={coneHeight}
          fillPercent={fillPercent}
        />
      </group>

      {showDataPanel && (
        <DataPanel
          position={[radius + 2, bodyLift + height / 2 + 1, 0]}
          fillPercent={fillPercent}
          capacity={capacity}
          temperature={temperature}
          moisture={moisture}
          residenceTime={residenceTime}
        />
      )}
    </group>
  );
}

/* ==========================================================================
   ENVIRONMENT
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
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.5]} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.2}
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

export function ConditioningBinScene() {
  return (
    <Canvas shadows camera={{ position: [10, 8, 10], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <ConditioningBinComponent
        radius={1.5}
        height={6}
        coneHeight={1.5}
        legHeight={2.5}
        capacity={12}
        autoDemo={true}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 4, 0]}
      />
    </Canvas>
  );
}

export function ConditioningBin() {
  return <ConditioningBinScene />;
}

export default ConditioningBin;