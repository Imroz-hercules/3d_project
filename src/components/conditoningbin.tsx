'use client';

/**
 * ConditioningBin.tsx — HIGH-FIDELITY INDUSTRIAL TEMPERING BIN
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, flanged inlet/outlet/vent connections, interactive 
 * inspection hatch with gasket, robust I-beam support legs with gussets, 
 * and horizontal stiffener rings.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useMemo } from 'react';
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

const matGasket = new THREE.MeshStandardMaterial({
  color: '#1a1a1a',
  metalness: 0.0,
  roughness: 0.95,
});

const COLORS = {
  accentYellow: '#e0a92c',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  grainColor: '#e8d5b5',
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
   3. SUPPORT LEGS (I-beam style with base plates, gussets, bracing)
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
          <mesh key={`brace-${i}`} position={mid} quaternion={quat} castShadow material={matStructure}>
            <cylinderGeometry args={[0.05, 0.05, length, 8]} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   4. INTERACTIVE INSPECTION HATCH
   ========================================================================== */

function InspectionHatch({ position, rotation, width, height }: { position: V3; rotation: V3; width: number; height: number }) {
  const doorRef = useRef<THREE.Group>(null!);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const targetAngle = open ? -Math.PI * 0.65 : 0;

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
          material={hovered ? matBody : matBody}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
          onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); setOpen((o) => !o); }}
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
   5. MAIN BIN BODY & CONE (Enhanced with seams, ribs, flanges)
   ========================================================================== */

function BinBodyAndCone({ radius, height, coneHeight, fillPercent }: { radius: number; height: number; coneHeight: number; fillPercent: number }) {
  const totalHeight = height + coneHeight;
  const fillHeight = Math.max(0.1, (height + coneHeight * 0.5) * (fillPercent / 100));
  const ribCount = 4;
  const ribs = Array.from({ length: ribCount }, (_, i) => -height / 2 + 0.5 + (i / (ribCount - 1)) * (height - 1));

  return (
    <group position={[0, totalHeight / 2, 0]}>
      {/* Cylindrical Body */}
      <mesh castShadow receiveShadow material={matBody}>
        <cylinderGeometry args={[radius, radius, height, 64]} />
      </mesh>

      {/* Vertical Seams/Ribs */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * (radius + 0.01);
        const z = Math.sin(angle) * (radius + 0.01);
        return (
          <mesh key={i} position={[x, 0, z]} rotation={[0, -angle, 0]} material={matBodyDark}>
            <boxGeometry args={[0.02, height - 0.2, 0.04]} />
          </mesh>
        );
      })}

      {/* Horizontal stiffener rings with bolts */}
      {ribs.map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
            <torusGeometry args={[radius + 0.03, 0.04, 8, 64]} />
          </mesh>
          {/* Bolts on ring */}
          {Array.from({ length: 8 }, (_, j) => {
            const angle = (j / 8) * Math.PI * 2;
            const bx = Math.cos(angle) * (radius + 0.04);
            const bz = Math.sin(angle) * (radius + 0.04);
            return <Bolt key={j} position={[bx, y, bz]} rotation={[Math.PI / 2, 0, -angle]} size={0.016} />;
          })}
        </group>
      ))}

      {/* Conical Bottom (Hopper) */}
      <mesh position={[0, -height / 2 - coneHeight / 2, 0]} castShadow receiveShadow material={matBodyDark}>
        <cylinderGeometry args={[radius, radius * 0.2, coneHeight, 64]} />
      </mesh>

      {/* Bottom Outlet Flange */}
      <mesh position={[0, -height / 2 - coneHeight - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <torusGeometry args={[radius * 0.22, 0.03, 8, 24]} />
      </mesh>
      <BoltCircle radius={radius * 0.22} count={6} y={-height / 2 - coneHeight - 0.05} z={0} size={0.016} rotation={[Math.PI / 2, 0, 0]} />

      {/* Grain Fill Material */}
      <mesh position={[0, -height / 2 - coneHeight / 2 + fillHeight / 2, 0]}>
        <cylinderGeometry args={[radius * 0.95, radius * 0.18, fillHeight, 64]} />
        <meshStandardMaterial color={COLORS.grainColor} roughness={0.9} metalness={0} />
      </mesh>

      {/* Top Roof */}
      <mesh position={[0, height / 2 + 0.1, 0]} material={matBodyDark}>
        <cylinderGeometry args={[radius + 0.1, radius + 0.1, 0.2, 64]} />
      </mesh>

      {/* Interactive Inspection Hatch */}
      <InspectionHatch 
        position={[0, 0, radius + 0.02]} 
        rotation={[0, 0, 0]} 
        width={0.7} 
        height={0.9} 
      />
    </group>
  );
}

/* ==========================================================================
   6. INLET, OUTLET & VENT (Enhanced with flanges and bolts)
   ========================================================================== */

function InletOutletVent({ radius, height, coneHeight }: { radius: number; height: number; coneHeight: number }) {
  const totalHeight = height + coneHeight;
  const outletRadius = radius * 0.2;

  return (
    <group>
      {/* Feed Inlet Pipe (Top Side) with flange */}
      <mesh position={[radius + 0.5, totalHeight - 0.5, 0]} rotation={[0, 0, Math.PI / 4]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[0.25, 0.25, 1.2, 24]} />
      </mesh>
      <mesh position={[radius + 0.15, totalHeight - 0.15, 0]} rotation={[0, 0, Math.PI / 4]} material={matStructure}>
        <torusGeometry args={[0.3, 0.03, 8, 24]} />
      </mesh>
      <BoltCircle radius={0.3} count={6} y={totalHeight - 0.15} z={0} size={0.016} rotation={[0, 0, Math.PI / 4]} />

      {/* Vent Filter (Top Center) with flange */}
      <mesh position={[0, totalHeight + 0.3, 0]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 24]} />
      </mesh>
      <mesh position={[0, totalHeight + 0.65, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <torusGeometry args={[0.35, 0.03, 8, 24]} />
      </mesh>
      <BoltCircle radius={0.35} count={8} y={totalHeight + 0.65} z={0} size={0.016} rotation={[Math.PI / 2, 0, 0]} />

      {/* Outlet Pipe (Bottom) */}
      <mesh position={[0, -coneHeight / 2 - 0.35, 0]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[outletRadius, outletRadius, 0.6, 24]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   7. SENSORS (Enhanced mounting)
   ========================================================================== */

function LevelSensors({ radius, height, coneHeight, fillPercent }: { radius: number; height: number; coneHeight: number; fillPercent: number }) {
  const totalHeight = height + coneHeight;
  const highLevelY = totalHeight * 0.85;
  const lowLevelY = totalHeight * 0.25;
  const fullAlarmY = totalHeight * 0.95;

  const isHigh = fillPercent > 80;
  const isLow = fillPercent < 20;
  const isFull = fillPercent > 95;

  return (
    <group>
      {[
        { y: highLevelY, label: 'HIGH', active: isHigh, color: COLORS.accentYellow },
        { y: lowLevelY, label: 'LOW', active: isLow, color: COLORS.accentRed },
        { y: fullAlarmY, label: 'FULL', active: isFull, color: COLORS.accentRed },
      ].map((sensor, i) => (
        <group key={i} position={[radius + 0.15, sensor.y, 0]}>
          {/* Mounting bracket */}
          <mesh material={matStructure}>
            <boxGeometry args={[0.08, 0.1, 0.08]} />
          </mesh>
          {/* Sensor rod */}
          <mesh position={[0, 0.1, 0]} material={matStructure}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
          </mesh>
          {/* Sensor light */}
          <mesh position={[0, 0.27, 0]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial
              color={sensor.active ? sensor.color : '#555555'}
              emissive={sensor.active ? sensor.color : '#000000'}
              emissiveIntensity={sensor.active ? 1.0 : 0}
            />
          </mesh>
          <Text position={[0.15, 0.1, 0]} fontSize={0.08} color="#ffffff" anchorX="left" anchorY="middle" fontWeight="bold">
            {sensor.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   8. DATA PANEL (PLC Data)
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
          <meshStandardMaterial color={COLORS.accentCyan} transparent opacity={0.3} side={THREE.DoubleSide} />
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
   9. MAIN CONDITIONING BIN COMPONENT
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

  useFrame(({ clock }) => {
    if (!autoDemo || controlledFill !== undefined) return;
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

        {/* 4. Sensors */}
        <LevelSensors
          radius={radius}
          height={height}
          coneHeight={coneHeight}
          fillPercent={fillPercent}
        />
      </group>

      {/* 5. Data Panel */}
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
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.5]} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.2}
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