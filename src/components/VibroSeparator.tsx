'use client';

/**
 * VibroSeparator.tsx - INDUSTRIAL PRE-CLEANER
 * ------------------------------------------------------------------------
 * A realistic industrial Vibro Separator (Pre-Cleaner) for a flour mill
 * digital twin. This is the first cleaning machine after the bucket elevator.
 *
 * Features:
 * - Static steel support frame with cross bracing
 * - Rubber spring mounts isolating the vibrating body
 * - Multi-deck vibrating screening box (animated)
 * - Top feed inlet
 * - Clean grain and waste outlet chutes
 * - Side-mounted electric drive motor with eccentric weights
 * - Inspection covers with bolts
 * - Interactive controls and floating data panel
 *
 * Usage:
 *   import { VibroSeparator } from './VibroSeparator';
 *   <VibroSeparator position={[0, 0, 0]} active={true} />
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
  bodySteel: '#6b7278',
  bodySteelLight: '#8a9199',
  bodySteelDark: '#4a5058',
  motorBlue: '#1e3a5f',
  motorDark: '#152a45',
  rubberBlack: '#2a2a2a',
  accentYellow: '#e0a92c',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   STATIC SUPPORT FRAME
   ========================================================================== */

function StaticFrame({ width, depth, height }: { width: number; depth: number; height: number }) {
  const legRadius = 0.12;
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
          <boxGeometry args={[0.2, height, 0.2]} />
          <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.75} roughness={0.35} />
        </mesh>
      ))}

      {/* Base Plates */}
      {legPositions.map((pos, i) => (
        <mesh key={`base-${i}`} position={[pos[0], -height / 2 + 0.05, pos[2]]}>
          <boxGeometry args={[0.4, 0.1, 0.4]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Top Cross Bracing (X pattern) */}
      {[
        { start: [width / 2 - 0.2, height / 2 - 0.3, depth / 2 - 0.2], end: [-width / 2 + 0.2, height / 2 - 0.3, -depth / 2 + 0.2] },
        { start: [-width / 2 + 0.2, height / 2 - 0.3, depth / 2 - 0.2], end: [width / 2 - 0.2, height / 2 - 0.3, -depth / 2 + 0.2] },
      ].map((brace, i) => {
        const startV = new THREE.Vector3(...brace.start);
        const endV = new THREE.Vector3(...brace.end);
        const mid = startV.clone().add(endV).multiplyScalar(0.5);
        const dir = endV.clone().sub(startV);
        const length = dir.length();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize());

        return (
          <mesh key={`brace-${i}`} position={mid} quaternion={quat} castShadow>
            <cylinderGeometry args={[0.06, 0.06, length, 8]} />
            <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.35} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   RUBBER SPRING MOUNTS
   ========================================================================== */

function SpringMounts({ width, depth, y }: { width: number; depth: number; y: number }) {
  const mountPositions: V3[] = [
    [width / 2 - 0.3, y, depth / 2 - 0.3],
    [-width / 2 + 0.3, y, depth / 2 - 0.3],
    [width / 2 - 0.3, y, -depth / 2 + 0.3],
    [-width / 2 + 0.3, y, -depth / 2 + 0.3],
    [0, y, depth / 2 - 0.3],
    [0, y, -depth / 2 + 0.3],
  ];

  return (
    <group>
      {mountPositions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Rubber spring body */}
          <mesh castShadow>
            <cylinderGeometry args={[0.15, 0.18, 0.6, 16]} />
            <meshStandardMaterial color={COLORS.rubberBlack} metalness={0.1} roughness={0.9} />
          </mesh>
          {/* Metal rings on rubber */}
          {[-0.2, 0, 0.2].map((ry, j) => (
            <mesh key={j} position={[0, ry, 0]}>
              <torusGeometry args={[0.16, 0.015, 8, 16]} />
              <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   VIBRATING SCREENING BODY
   ========================================================================== */

function VibratingBody({
  width,
  depth,
  height,
  active,
  hovered,
  onHover,
}: {
  width: number;
  depth: number;
  height: number;
  active: boolean;
  hovered: boolean;
  onHover: (v: boolean) => void;
}) {
  const bodyRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (!bodyRef.current) return;
    if (active) {
      // High-frequency, low-amplitude vibration
      const t = clock.elapsedTime * 60;
      bodyRef.current.position.x = Math.sin(t) * 0.008;
      bodyRef.current.position.y = Math.cos(t * 1.3) * 0.004;
      bodyRef.current.rotation.z = Math.sin(t * 0.7) * 0.003;
      bodyRef.current.rotation.x = Math.cos(t * 0.9) * 0.002;
    } else {
      // Smooth return to origin
      bodyRef.current.position.x = THREE.MathUtils.damp(bodyRef.current.position.x, 0, 5, 0.016);
      bodyRef.current.position.y = THREE.MathUtils.damp(bodyRef.current.position.y, 0, 5, 0.016);
      bodyRef.current.rotation.z = THREE.MathUtils.damp(bodyRef.current.rotation.z, 0, 5, 0.016);
      bodyRef.current.rotation.x = THREE.MathUtils.damp(bodyRef.current.rotation.x, 0, 5, 0.016);
    }
  });

  return (
    <group
      ref={bodyRef}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(false); }}
    >
      {/* Main screening box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={hovered ? COLORS.bodySteelLight : COLORS.bodySteel}
          metalness={0.65}
          roughness={0.4}
          emissive={hovered ? COLORS.accentCyan : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
      </mesh>

      {/* Deck separation lines (visual detail) */}
      {[-height * 0.25, height * 0.25].map((y, i) => (
        <mesh key={i} position={[0, y, depth / 2 + 0.01]}>
          <boxGeometry args={[width * 0.98, 0.03, 0.02]} />
          <meshStandardMaterial color={COLORS.bodySteelDark} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}

      {/* Inspection Doors */}
      {[
        { x: width * 0.35, y: 0, z: depth / 2 + 0.02 },
        { x: -width * 0.35, y: 0, z: depth / 2 + 0.02 },
      ].map((pos, i) => (
        <group key={i} position={[pos.x, pos.y, pos.z]}>
          <mesh>
            <boxGeometry args={[width * 0.35, height * 0.6, 0.03]} />
            <meshStandardMaterial color={COLORS.bodySteelDark} metalness={0.7} roughness={0.35} />
          </mesh>
          {/* Door handle */}
          <mesh position={[width * 0.12, 0, 0.02]}>
            <boxGeometry args={[0.04, 0.2, 0.04]} />
            <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.25} />
          </mesh>
          {/* Door bolts */}
          {[
            [-width * 0.15, height * 0.25, 0.02],
            [width * 0.15, height * 0.25, 0.02],
            [-width * 0.15, -height * 0.25, 0.02],
            [width * 0.15, -height * 0.25, 0.02],
          ].map((bpos, j) => (
            <mesh key={j} position={bpos}>
              <cylinderGeometry args={[0.025, 0.025, 0.03, 8]} />
              <meshStandardMaterial color={COLORS.frameSteel} metalness={0.85} roughness={0.25} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Top Feed Inlet */}
      <mesh position={[0, height / 2 + 0.4, 0]} castShadow>
        <boxGeometry args={[width * 0.4, 0.8, depth * 0.5]} />
        <meshStandardMaterial color={COLORS.bodySteel} metalness={0.65} roughness={0.4} />
      </mesh>
      {/* Inlet flange */}
      <mesh position={[0, height / 2 + 0.82, 0]}>
        <boxGeometry args={[width * 0.45, 0.06, depth * 0.55]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Clean Grain Outlet (Front Bottom) */}
      <mesh position={[0, -height / 2 - 0.3, depth * 0.3]} castShadow>
        <boxGeometry args={[width * 0.5, 0.6, depth * 0.4]} />
        <meshStandardMaterial color={COLORS.bodySteel} metalness={0.65} roughness={0.4} />
      </mesh>
      {/* Clean outlet flange */}
      <mesh position={[0, -height / 2 - 0.62, depth * 0.3]}>
        <boxGeometry args={[width * 0.55, 0.06, depth * 0.45]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Waste Outlet (Back Bottom) */}
      <mesh position={[0, -height / 2 - 0.3, -depth * 0.3]} castShadow>
        <boxGeometry args={[width * 0.35, 0.6, depth * 0.3]} />
        <meshStandardMaterial color={COLORS.bodySteelDark} metalness={0.65} roughness={0.4} />
      </mesh>
      {/* Waste outlet flange */}
      <mesh position={[0, -height / 2 - 0.62, -depth * 0.3]}>
        <boxGeometry args={[width * 0.4, 0.06, depth * 0.35]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Drive Motor Mount */}
      <mesh position={[width / 2 + 0.1, height * 0.2, 0]} castShadow>
        <boxGeometry args={[0.2, 0.4, depth * 0.6]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   DRIVE MOTOR (Eccentric Vibration Motor)
   ========================================================================== */

function DriveMotor({ position, active }: { position: V3; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 15; // Fast spinning for vibration motor
    }
  });

  return (
    <group
      position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Motor body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.5, 24]} />
        <meshStandardMaterial
          color={hovered ? '#2a4a6f' : COLORS.motorBlue}
          metalness={0.6}
          roughness={0.4}
          emissive={hovered ? COLORS.accentCyan : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
      </mesh>

      {/* Cooling fins */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = -0.2 + (i / 9) * 0.4;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.015, 24]} />
            <meshStandardMaterial color={COLORS.motorDark} metalness={0.65} roughness={0.35} />
          </mesh>
        );
      })}

      {/* Fan cover */}
      <mesh position={[0, 0, 0.28]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 24]} />
        <meshStandardMaterial color={COLORS.motorDark} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Fan blades */}
      <mesh ref={fanRef} position={[0, 0, 0.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.17, 0.17, 0.02, 8]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Eccentric weight housing (the part that causes vibration) */}
      <mesh position={[0, 0, -0.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.15, 16]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Status indicator */}
      <mesh position={[0, 0.24, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
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
   DATA PANEL
   ========================================================================== */

function DataPanel({
  position,
  active,
  rpm,
  amplitude,
  label,
}: {
  position: V3;
  active: boolean;
  rpm: number;
  amplitude: number;
  label: string;
}) {
  const lines = [
    { text: `VIBRO SEPARATOR`, size: 0.18, color: '#1c1c1c', bold: true },
    { text: `ID: ${label}`, size: 0.14, color: '#3a3a3a' },
    { text: `Status: ${active ? '● RUNNING' : '○ STOPPED'}`, size: 0.14, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Motor RPM: ${active ? rpm.toFixed(0) : '0'}`, size: 0.14, color: '#3a3a3a' },
    { text: `Amplitude: ${active ? amplitude.toFixed(1) : '0.0'} mm`, size: 0.14, color: '#3a3a3a' },
    { text: `Throughput: ${active ? '12.5' : '0.0'} t/h`, size: 0.14, color: '#3a3a3a' },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.35, -0.02]}>
          <planeGeometry args={[2.2, 1.5]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.35, -0.015]}>
          <planeGeometry args={[2.24, 1.54]} />
          <meshStandardMaterial color={COLORS.accentYellow} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {lines.map((line, i) => (
          <Text
            key={i}
            position={[-1, -i * 0.26, 0]}
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
   MAIN VIBRO SEPARATOR COMPONENT
   ========================================================================== */

export interface VibroSeparatorProps {
  position?: V3;
  width?: number;
  depth?: number;
  height?: number;
  rpm?: number;
  amplitude?: number;
  active?: boolean;
  label?: string;
}

export function VibroSeparatorComponent({
  position = [0, 0, 0],
  width = 3,
  depth = 2,
  height = 1.5,
  rpm = 960,
  amplitude = 4.5,
  active: controlledActive,
  label = 'VIBRO-01',
}: VibroSeparatorProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [bodyHovered, setBodyHovered] = useState(false);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  const frameHeight = 1.2;
  const springY = frameHeight / 2 + 0.3;

  return (
    <group position={position}>
      {/* Static Base Frame */}
      <StaticFrame width={width} depth={depth} height={frameHeight} />

      {/* Rubber Spring Mounts */}
      <SpringMounts width={width} depth={depth} y={springY} />

      {/* Vibrating Screening Body */}
      <VibratingBody
        width={width}
        depth={depth}
        height={height}
        active={active}
        hovered={bodyHovered}
        onHover={setBodyHovered}
      />

      {/* Drive Motor */}
      <DriveMotor
        position={[width / 2 + 0.35, height * 0.2, 0]}
        active={active}
      />

      {/* Data Panel */}
      <DataPanel
        position={[width / 2 + 1.8, height / 2 + 0.5, 0]}
        active={active}
        rpm={rpm}
        amplitude={amplitude}
        label={label}
      />

      {/* Click instruction */}
      <Text
        position={[0, height / 2 + frameHeight / 2 + 1.2, 0]}
        fontSize={0.12}
        color={COLORS.accentYellow}
        anchorX="center"
        anchorY="middle"
      >
        {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
      </Text>

      {/* Invisible click target for the whole machine */}
      <mesh
        position={[0, height / 2, 0]}
        onClick={() => setInternalActive(!internalActive)}
        visible={false}
      >
        <boxGeometry args={[width * 1.5, height + frameHeight, depth * 1.5]} />
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
      <ambientLight intensity={0.4} />
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

export function VibroSeparatorScene() {
  const [active, setActive] = useState(false);

  return (
    <Canvas shadows camera={{ position: [8, 6, 8], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <VibroSeparatorComponent
        width={3}
        depth={2}
        height={1.5}
        rpm={960}
        amplitude={4.5}
        active={active}
        label="VIBRO-01"
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 1, 0]}
      />
    </Canvas>
  );
}

export function VibroSeparator() {
  return <VibroSeparatorScene />;
}

export default VibroSeparator;