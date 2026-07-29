'use client';

/**
 * FlourBin.tsx — HIGH-FIDELITY INDUSTRIAL FLOUR STORAGE BIN
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, flanged inlet/outlet connections, interactive 
 * inspection door with gasket, robust I-beam support legs with gussets, 
 * horizontal stiffener rings, and a high-fidelity integrated rotary valve 
 * with safety coupling guard.
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
  color: '#d4d8dc',
  metalness: 0.7,
  roughness: 0.35,
  clearcoat: 0.4,
  clearcoatRoughness: 0.35,
});

const matBodyDark = new THREE.MeshStandardMaterial({
  color: '#a0a8b0',
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

function InspectionDoor({ position, rotation, width, height }: { position: V3; rotation: V3; width: number; height: number }) {
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
          material={hovered ? matSafety : matBody}
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
   4. SUPPORT LEGS (I-beam legs, base plates, gussets, bracing)
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
            <boxGeometry args={[0.3, 0.08, 0.3]} />
          </mesh>

          {/* Anchor bolts */}
          {[-0.1, 0.1].map((dx) =>
            [-0.1, 0.1].map((dz) => (
              <Bolt key={`${dx}-${dz}`} position={[pos[0] + dx, -legHeight / 2 + 0.09, pos[2] + dz]} size={0.018} />
            ))
          )}

          {/* Top gusset plate */}
          <mesh position={[pos[0], legHeight / 2 - 0.15, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.22, 0.3, 0.05]} />
          </mesh>
        </group>
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
          <mesh key={`brace-${i}`} position={mid} quaternion={quat} castShadow material={matStructure}>
            <cylinderGeometry args={[0.04, 0.04, dir.length(), 8]} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   5. BIN BODY, CONE & INTERNAL FILL (Enhanced with seams, ribs, flanges)
   ========================================================================== */

function BinBodyAndFill({ radius, height, coneHeight, fillPercent, label }: { radius: number; height: number; coneHeight: number; fillPercent: number; label: string }) {
  const totalHeight = height + coneHeight;
  const maxFillHeight = height + coneHeight * 0.8;
  const currentFillHeight = Math.max(0.1, maxFillHeight * (fillPercent / 100));
  const ribCount = 3;
  const ribs = Array.from({ length: ribCount }, (_, i) => -height / 2 + 0.5 + (i / (ribCount - 1)) * (height - 1));

  return (
    <group position={[0, totalHeight / 2, 0]}>
      {/* Smooth Cylindrical Body */}
      <mesh castShadow receiveShadow material={matBody}>
        <cylinderGeometry args={[radius, radius, height, 64]} />
      </mesh>

      {/* Vertical panel seams */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, i) => {
        const x = Math.cos(a) * (radius + 0.005);
        const z = Math.sin(a) * (radius + 0.005);
        return (
          <mesh key={i} position={[x, 0, z]} rotation={[0, -a, 0]} material={matBodyDark}>
            <boxGeometry args={[0.015, height - 0.2, 0.03]} />
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
          {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, j) => {
            const bx = Math.cos(a) * (radius + 0.04);
            const bz = Math.sin(a) * (radius + 0.04);
            return <Bolt key={j} position={[bx, y, bz]} rotation={[Math.PI / 2, 0, -a]} size={0.016} />;
          })}
        </group>
      ))}

      {/* Steep Hopper Cone (60-70 degrees) */}
      <mesh position={[0, -height / 2 - coneHeight / 2, 0]} castShadow receiveShadow material={matBodyDark}>
        <cylinderGeometry args={[radius, radius * 0.15, coneHeight, 64]} />
      </mesh>

      {/* Bottom outlet flange */}
      <mesh position={[0, -height / 2 - coneHeight - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <torusGeometry args={[radius * 0.18, 0.03, 8, 24]} />
      </mesh>
      <BoltCircle radius={radius * 0.18} count={6} y={-height / 2 - coneHeight - 0.05} z={0} size={0.016} rotation={[Math.PI / 2, 0, 0]} />

      {/* Top Roof */}
      <mesh position={[0, height / 2 + 0.05, 0]} material={matBodyDark}>
        <cylinderGeometry args={[radius + 0.05, radius + 0.05, 0.1, 64]} />
      </mesh>

      {/* Internal Flour Fill */}
      <mesh position={[0, -height / 2 - coneHeight / 2 + currentFillHeight / 2, 0]}>
        <cylinderGeometry args={[radius * 0.95, radius * 0.12, currentFillHeight, 64]} />
        <meshStandardMaterial color={COLORS.flourWhite} roughness={0.9} metalness={0} />
      </mesh>

      {/* Manufacturer Nameplate */}
      <group position={[0, height * 0.2, radius + 0.02]}>
        <mesh material={matBody}>
          <boxGeometry args={[1.2, 0.3, 0.015]} />
        </mesh>
        <Text position={[0, 0.08, 0.008]} fontSize={0.12} color="#1a1a1a" anchorX="center" anchorY="middle" fontWeight="bold">
          {label}
        </Text>
        <Text position={[0, -0.05, 0.008]} fontSize={0.08} color="#3a3a3a" anchorX="center" anchorY="middle">
          CAP: 20 TONS
        </Text>
        {/* Plate screws */}
        {[[-0.55, 0.12], [0.55, 0.12], [-0.55, -0.12], [0.55, -0.12]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.01]}>
            <cylinderGeometry args={[0.01, 0.01, 0.01, 6]} />
            <meshStandardMaterial color={COLORS.accentCyan} metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Interactive Inspection Door */}
      <InspectionDoor 
        position={[0, totalHeight * 0.3, radius + 0.02]} 
        rotation={[0, 0, 0]} 
        width={0.5} 
        height={0.7} 
      />
    </group>
  );
}

/* ==========================================================================
   6. VENT FILTER & FILLING PIPE (Enhanced with flanges)
   ========================================================================== */

function VentAndPipe({ radius, height, coneHeight }: { radius: number; height: number; coneHeight: number }) {
  const totalHeight = height + coneHeight;
  return (
    <group>
      {/* Vent Filter (Top Center) with flange */}
      <mesh position={[0, totalHeight + 0.3, 0]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[0.25, 0.25, 0.6, 24]} />
      </mesh>
      <mesh position={[0, totalHeight + 0.65, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <torusGeometry args={[0.3, 0.03, 8, 24]} />
      </mesh>
      <BoltCircle radius={0.3} count={8} y={totalHeight + 0.65} z={0} size={0.016} rotation={[Math.PI / 2, 0, 0]} />

      {/* Filling Pipe (Side Inlet) with flange */}
      <mesh position={[radius + 0.4, totalHeight - 0.5, 0]} rotation={[0, 0, Math.PI / 6]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[0.2, 0.2, 1.0, 24]} />
      </mesh>
      <mesh position={[radius + 0.1, totalHeight - 0.1, 0]} rotation={[0, 0, Math.PI / 6]} material={matStructure}>
        <torusGeometry args={[0.25, 0.03, 8, 24]} />
      </mesh>
      <BoltCircle radius={0.25} count={6} y={totalHeight - 0.1} z={0} size={0.016} rotation={[0, 0, Math.PI / 6]} />
    </group>
  );
}

/* ==========================================================================
   7. LEVEL SENSORS (Enhanced mounting)
   ========================================================================== */

function LevelSensors({ radius, height, coneHeight, fillPercent }: { radius: number; height: number; coneHeight: number; fillPercent: number }) {
  const totalHeight = height + coneHeight;
  const highY = totalHeight * 0.85;
  const midY = totalHeight * 0.5;
  const lowY = totalHeight * 0.15;

  const isHigh = fillPercent > 85;
  const isMid = fillPercent > 40 && fillPercent <= 85;
  const isLow = fillPercent <= 40;

  return (
    <group>
      {[
        { y: highY, label: 'HIGH', active: isHigh, color: COLORS.accentRed },
        { y: midY, label: 'MID', active: isMid, color: COLORS.accentYellow },
        { y: lowY, label: 'LOW', active: isLow, color: COLORS.accentGreen },
      ].map((sensor, i) => (
        <group key={i} position={[radius + 0.15, sensor.y, 0]}>
          {/* Mounting bracket */}
          <mesh material={matStructure}>
            <boxGeometry args={[0.08, 0.1, 0.08]} />
          </mesh>
          {/* Sensor rod */}
          <mesh position={[0, 0.1, 0]} material={matStructure}>
            <cylinderGeometry args={[0.025, 0.025, 0.3, 8]} />
          </mesh>
          {/* Sensor light */}
          <mesh position={[0, 0.27, 0]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color={sensor.active ? sensor.color : '#555555'} emissive={sensor.active ? sensor.color : '#000000'} emissiveIntensity={sensor.active ? 1.0 : 0} />
          </mesh>
          <Text position={[0.12, 0.1, 0]} fontSize={0.06} color="#ffffff" anchorX="left" anchorY="middle" fontWeight="bold">
            {sensor.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   8. CONE VIBRATOR (Enhanced with mounting)
   ========================================================================== */

function ConeVibrator({ position, vibratorActive }: { position: V3; vibratorActive: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  
  useFrame(({ clock }) => {
    if (ref.current && vibratorActive) {
      ref.current.position.x = Math.sin(clock.elapsedTime * 50) * 0.005;
    }
  });

  return (
    <group position={position}>
      <group ref={ref}>
        {/* Vibrator body */}
        <mesh castShadow material={matMotor}>
          <boxGeometry args={[0.2, 0.25, 0.2]} />
        </mesh>
        {/* Mounting bracket */}
        <mesh position={[0, 0, 0.12]} material={matStructure}>
          <boxGeometry args={[0.25, 0.1, 0.05]} />
        </mesh>
        {/* Mounting bolts */}
        <Bolt position={[-0.08, 0, 0.15]} size={0.014} />
        <Bolt position={[0.08, 0, 0.15]} size={0.014} />
      </group>
    </group>
  );
}

/* ==========================================================================
   9. INTEGRATED ROTARY VALVE (High-fidelity with safety guard)
   ========================================================================== */

function IntegratedRotaryValve({ position, active }: { position: V3; active: boolean }) {
  const rotorRef = useRef<THREE.Group>(null!);
  const fanRef = useRef<THREE.Mesh>(null!);
  
  useFrame((_, delta) => {
    if (rotorRef.current && active) rotorRef.current.rotation.z += delta * 3;
    if (fanRef.current && active) fanRef.current.rotation.z += delta * 12;
  });

  return (
    <group position={position}>
      {/* Valve Housing */}
      <mesh castShadow material={matBodyDark}>
        <boxGeometry args={[0.8, 0.6, 0.8]} />
      </mesh>

      {/* Motor */}
      <mesh position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matMotor}>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 24]} />
      </mesh>
      
      {/* Motor cooling fins */}
      {Array.from({ length: 8 }, (_, i) => {
        const z = -0.15 + (i / 7) * 0.3;
        return (
          <mesh key={i} position={[0.5, 0, z]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
            <cylinderGeometry args={[0.22, 0.22, 0.015, 24]} />
          </mesh>
        );
      })}
      
      {/* Motor fan */}
      <mesh ref={fanRef} position={[0.5, 0, 0.23]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 8]} />
      </mesh>

      {/* Outlet Pipe */}
      <mesh position={[0, -0.4, 0]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[0.25, 0.25, 0.4, 24]} />
      </mesh>
      
      {/* Outlet flange */}
      <mesh position={[0, -0.62, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <torusGeometry args={[0.28, 0.03, 8, 24]} />
      </mesh>
      <BoltCircle radius={0.28} count={6} y={-0.62} z={0} size={0.016} rotation={[Math.PI / 2, 0, 0]} />

      {/* Internal Rotor */}
      <group ref={rotorRef} position={[0, 0, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 4) * Math.PI]} material={matStructure}>
            <boxGeometry args={[0.7, 0.05, 0.1]} />
          </mesh>
        ))}
      </group>

      {/* Safety coupling guard */}
      <mesh position={[0.35, 0.05, 0]} material={matSafety}>
        <boxGeometry args={[0.15, 0.15, 0.2]} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0.5, 0.22, 0]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={active ? COLORS.accentGreen : COLORS.accentRed} emissive={active ? COLORS.accentGreen : COLORS.accentRed} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   10. LADDER & PLATFORM (Industrial standard)
   ========================================================================== */

function LadderAndPlatform({ height, coneHeight, radius }: { height: number; coneHeight: number; radius: number }) {
  const totalHeight = height + coneHeight;
  return (
    <group position={[0, 0, radius + 0.4]}>
      {/* Ladder Rails */}
      <mesh position={[-0.25, totalHeight * 0.3, 0]} castShadow material={matStructure}>
        <boxGeometry args={[0.05, totalHeight * 0.6, 0.05]} />
      </mesh>
      <mesh position={[0.25, totalHeight * 0.3, 0]} castShadow material={matStructure}>
        <boxGeometry args={[0.05, totalHeight * 0.6, 0.05]} />
      </mesh>
      {/* Rungs */}
      {Array.from({ length: 8 }, (_, i) => {
        const y = totalHeight * 0.05 + i * (totalHeight * 0.55 / 7);
        return (
          <mesh key={i} position={[0, y, 0.05]} castShadow material={matStructure}>
            <boxGeometry args={[0.4, 0.04, 0.04]} />
          </mesh>
        );
      })}
      {/* Platform */}
      <mesh position={[0, totalHeight * 0.7, 0.3]} castShadow material={matBodyDark}>
        <boxGeometry args={[1.0, 0.08, 0.8]} />
      </mesh>
      {/* Platform grating pattern */}
      {Array.from({ length: 5 }, (_, i) => {
        const x = -0.4 + (i / 4) * 0.8;
        return (
          <mesh key={i} position={[x, totalHeight * 0.7 + 0.05, 0.3]} material={matStructure}>
            <boxGeometry args={[0.02, 0.02, 0.75]} />
          </mesh>
        );
      })}
      {/* Railing & Toe Board */}
      <mesh position={[0, totalHeight * 0.7 + 0.06, 0.65]} material={matSafety}>
        <boxGeometry args={[1.0, 0.12, 0.04]} />
      </mesh>
      <mesh position={[0, totalHeight * 0.7 + 0.45, 0.65]} material={matSafety}>
        <boxGeometry args={[1.0, 0.04, 0.04]} />
      </mesh>
      {[-0.45, 0.45].map((x, i) => (
        <mesh key={i} position={[x, totalHeight * 0.7 + 0.25, 0.65]} material={matSafety}>
          <boxGeometry args={[0.04, 0.5, 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   11. DATA PANEL (PLC Data)
   ========================================================================== */

function DataPanel({ position, label, fillPercent, capacity, active }: { position: V3; label: string; fillPercent: number; capacity: number; active: boolean }) {
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
        <mesh position={[0, -0.45, -0.02]}>
          <planeGeometry args={[2.0, 1.8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.45, -0.015]}>
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
   12. MAIN FLOUR BIN COMPONENT
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
  const bodyY = legHeight + coneHeight / 2;
  const vibratorActive = active && fillPercent > 10;

  return (
    <group position={position}>
      {/* 1. Support Legs */}
      <SupportLegs radius={radius} legHeight={legHeight} />

      <group position={[0, bodyY, 0]}>
        {/* 2. Bin Body & Fill */}
        <BinBodyAndFill radius={radius} height={height} coneHeight={coneHeight} fillPercent={fillPercent} label={label} />

        {/* 3. Vent & Pipe */}
        <VentAndPipe radius={radius} height={height} coneHeight={coneHeight} />

        {/* 4. Level Sensors */}
        <LevelSensors radius={radius} height={height} coneHeight={coneHeight} fillPercent={fillPercent} />

        {/* 5. Cone Vibrator */}
        <ConeVibrator position={[radius * 0.6, -height / 2 - coneHeight * 0.4, 0]} vibratorActive={vibratorActive} />

        {/* 6. Ladder & Platform */}
        <LadderAndPlatform height={height} coneHeight={coneHeight} radius={radius} />
      </group>

      {/* 7. Integrated Rotary Valve */}
      <IntegratedRotaryValve position={[0, legHeight - 0.55, 0]} active={active} />

      {/* 8. Flour Flow Particles */}
      {active && fillPercent > 0 && (
        <Sparkles count={40} scale={[0.4, 0.8, 0.4]} size={2} speed={1.5} position={[0, legHeight - 1.1, 0]} color={COLORS.flourWhite} />
      )}

      {/* 9. Data Panel */}
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
   13. ENVIRONMENT & EXPORT
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
        position={[15, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-far={50}
        shadow-bias={-0.0001}
      />
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