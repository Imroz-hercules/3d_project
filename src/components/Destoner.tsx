'use client';

/**
 * Destoner.tsx - INDUSTRIAL DESTONER
 * ------------------------------------------------------------------------
 * A realistic industrial Destoner for a flour mill digital twin.
 * It separates stones and heavy impurities from the grain using a 
 * vibrating, sloped deck and aspiration (air flow).
 *
 * Features:
 * - Static steel support frame with cross bracing
 * - Rubber spring mounts isolating the vibrating deck
 * - Long, sloped vibrating deck with riffles/perforations
 * - Feed inlet at the top end
 * - Clean grain outlet at the lower end
 * - Stone/heavy impurity outlet at the bottom end
 * - Aspiration hood/duct on top for air suction
 * - Side-mounted eccentric vibration motor
 * - Interactive controls and floating data panel
 *
 * Usage:
 *   import { Destoner } from './Destoner';
 *   <Destoner position={[0, 0, 0]} active={true} />
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
  ductSteel: '#7a8288',
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

      {/* Cross Bracing */}
      {[
        { start: [width / 2 - 0.2, height / 2 - 0.3, depth / 2 - 0.2], end: [-width / 2 + 0.2, height / 2 - 0.3, -depth / 2 + 0.2] },
        { start: [-width / 2 + 0.2, height / 2 - 0.3, depth / 2 - 0.2], end: [width / 2 - 0.2, height / 2 - 0.3, -depth / 2 + 0.2] },
        { start: [width / 2 - 0.2, height / 2 - 0.3, depth / 2 - 0.2], end: [-width / 2 + 0.2, height / 2 - 0.3, depth / 2 - 0.2] },
        { start: [width / 2 - 0.2, height / 2 - 0.3, -depth / 2 + 0.2], end: [-width / 2 + 0.2, height / 2 - 0.3, -depth / 2 + 0.2] },
      ].map((brace, i) => {
        const startV = new THREE.Vector3(...brace.start);
        const endV = new THREE.Vector3(...brace.end);
        const mid = startV.clone().add(endV).multiplyScalar(0.5);
        const dir = endV.clone().sub(startV);
        const length = dir.length();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize());

        return (
          <mesh key={`brace-${i}`} position={mid} quaternion={quat} castShadow>
            <cylinderGeometry args={[0.05, 0.05, length, 8]} />
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

function RubberMounts({ width, depth, y }: { width: number; depth: number; y: number }) {
  const mountPositions: V3[] = [
    [width / 2 - 0.3, y, depth / 2 - 0.3],
    [-width / 2 + 0.3, y, depth / 2 - 0.3],
    [width / 2 - 0.3, y, -depth / 2 + 0.3],
    [-width / 2 + 0.3, y, -depth / 2 + 0.3],
  ];

  return (
    <group>
      {mountPositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.15, 0.5, 16]} />
            <meshStandardMaterial color={COLORS.rubberBlack} metalness={0.1} roughness={0.9} />
          </mesh>
          {[-0.15, 0, 0.15].map((ry, j) => (
            <mesh key={j} position={[0, ry, 0]}>
              <torusGeometry args={[0.13, 0.01, 8, 16]} />
              <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   VIBRATING DECK (Main Body)
   ========================================================================== */

function VibratingDeck({
  width,
  depth,
  length,
  active,
  hovered,
  onHover,
}: {
  width: number;
  depth: number;
  length: number;
  active: boolean;
  hovered: boolean;
  onHover: (v: boolean) => void;
}) {
  const deckRef = useRef<THREE.Group>(null!);
  const angle = 0.12; // ~7 degrees slope

  useFrame(({ clock }) => {
    if (!deckRef.current) return;
    if (active) {
      const t = clock.elapsedTime * 50;
      deckRef.current.position.x = Math.sin(t) * 0.006;
      deckRef.current.position.y = Math.cos(t * 1.2) * 0.003;
      deckRef.current.rotation.z = Math.sin(t * 0.8) * 0.002;
    } else {
      deckRef.current.position.x = THREE.MathUtils.damp(deckRef.current.position.x, 0, 5, 0.016);
      deckRef.current.position.y = THREE.MathUtils.damp(deckRef.current.position.y, 0, 5, 0.016);
      deckRef.current.rotation.z = THREE.MathUtils.damp(deckRef.current.rotation.z, 0, 5, 0.016);
    }
  });

  return (
    <group
      ref={deckRef}
      rotation={[0, 0, angle]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(false); }}
    >
      {/* Main deck body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, 0.4, width]} />
        <meshStandardMaterial
          color={hovered ? COLORS.bodySteelLight : COLORS.bodySteel}
          metalness={0.65}
          roughness={0.4}
          emissive={hovered ? COLORS.accentCyan : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
      </mesh>

      {/* Deck surface (perforated look simulation) */}
      <mesh position={[0, 0.21, 0]}>
        <boxGeometry args={[length * 0.95, 0.02, width * 0.95]} />
        <meshStandardMaterial color={COLORS.bodySteelDark} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Riffles (parallel lines on deck) */}
      {Array.from({ length: 12 }, (_, i) => {
        const x = -length / 2 + 0.3 + (i / 11) * (length - 0.6);
        return (
          <mesh key={i} position={[x, 0.23, 0]}>
            <boxGeometry args={[0.03, 0.04, width * 0.9]} />
            <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
          </mesh>
        );
      })}

      {/* Side panels */}
      <mesh position={[0, 0.1, width / 2]}>
        <boxGeometry args={[length, 0.5, 0.05]} />
        <meshStandardMaterial color={COLORS.bodySteel} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.1, -width / 2]}>
        <boxGeometry args={[length, 0.5, 0.05]} />
        <meshStandardMaterial color={COLORS.bodySteel} metalness={0.65} roughness={0.4} />
      </mesh>

      {/* Feed Inlet (Top end) */}
      <mesh position={[-length / 2 - 0.3, 0.3, 0]} castShadow>
        <boxGeometry args={[0.6, 0.5, width * 0.6]} />
        <meshStandardMaterial color={COLORS.bodySteel} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[-length / 2 - 0.6, 0.5, 0]}>
        <boxGeometry args={[0.08, 0.1, width * 0.65]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Clean Grain Outlet (Lower end) */}
      <mesh position={[length / 2 + 0.2, -0.1, 0]} castShadow>
        <boxGeometry args={[0.5, 0.4, width * 0.7]} />
        <meshStandardMaterial color={COLORS.bodySteel} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[length / 2 + 0.45, -0.3, 0]}>
        <boxGeometry args={[0.08, 0.1, width * 0.75]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Stone Outlet (Bottom end, smaller) */}
      <mesh position={[length / 2 + 0.15, -0.3, -width * 0.3]} castShadow>
        <boxGeometry args={[0.4, 0.3, width * 0.25]} />
        <meshStandardMaterial color={COLORS.bodySteelDark} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[length / 2 + 0.35, -0.45, -width * 0.3]}>
        <boxGeometry args={[0.08, 0.08, width * 0.3]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Aspiration Hood (Top duct) */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[length * 0.8, 0.4, width * 0.8]} />
        <meshStandardMaterial color={COLORS.ductSteel} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Aspiration duct pipe */}
      <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.6, 24]} />
        <meshStandardMaterial color={COLORS.ductSteel} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.05, 24]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Motor mounting plate */}
      <mesh position={[0, -0.1, width / 2 + 0.1]} castShadow>
        <boxGeometry args={[0.6, 0.3, 0.15]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   DRIVE MOTOR
   ========================================================================== */

function DriveMotor({ position, active }: { position: V3; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 15;
    }
  });

  return (
    <group
      position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
    >
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.45, 24]} />
        <meshStandardMaterial
          color={hovered ? '#2a4a6f' : COLORS.motorBlue}
          metalness={0.6}
          roughness={0.4}
          emissive={hovered ? COLORS.accentCyan : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
      </mesh>

      {Array.from({ length: 10 }, (_, i) => {
        const z = -0.18 + (i / 9) * 0.36;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.015, 24]} />
            <meshStandardMaterial color={COLORS.motorDark} metalness={0.65} roughness={0.35} />
          </mesh>
        );
      })}

      <mesh position={[0, 0, 0.25]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.06, 24]} />
        <meshStandardMaterial color={COLORS.motorDark} metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh ref={fanRef} position={[0, 0, 0.28]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 8]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.75} roughness={0.3} />
      </mesh>

      <mesh position={[0, 0, -0.25]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 16]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.25} />
      </mesh>

      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.03, 12, 12]} />
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
  airflow,
  label,
}: {
  position: V3;
  active: boolean;
  rpm: number;
  airflow: number;
  label: string;
}) {
  const lines = [
    { text: `DESTONER`, size: 0.18, color: '#1c1c1c', bold: true },
    { text: `ID: ${label}`, size: 0.14, color: '#3a3a3a' },
    { text: `Status: ${active ? '● RUNNING' : '○ STOPPED'}`, size: 0.14, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Motor RPM: ${active ? rpm.toFixed(0) : '0'}`, size: 0.14, color: '#3a3a3a' },
    { text: `Airflow: ${active ? airflow.toFixed(0) : '0'} m³/h`, size: 0.14, color: '#3a3a3a' },
    { text: `Throughput: ${active ? '8.5' : '0.0'} t/h`, size: 0.14, color: '#3a3a3a' },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.4, -0.02]}>
          <planeGeometry args={[2.2, 1.6]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.4, -0.015]}>
          <planeGeometry args={[2.24, 1.64]} />
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
   MAIN DESTONER COMPONENT
   ========================================================================== */

export interface DestonerProps {
  position?: V3;
  width?: number;
  depth?: number;
  length?: number;
  rpm?: number;
  airflow?: number;
  active?: boolean;
  label?: string;
}

export function DestonerComponent({
  position = [0, 0, 0],
  width = 1.8,
  depth = 1.2,
  length = 3.5,
  rpm = 900,
  airflow = 4500,
  active: controlledActive,
  label = 'DESTONER-01',
}: DestonerProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [bodyHovered, setBodyHovered] = useState(false);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  const frameHeight = 1.2;
  const springY = frameHeight / 2 + 0.25;

  return (
    <group position={position}>
      {/* Static Base Frame */}
      <StaticFrame width={length} depth={width} height={frameHeight} />

      {/* Rubber Spring Mounts */}
      <RubberMounts width={length} depth={width} y={springY} />

      {/* Vibrating Deck */}
      <VibratingDeck
        width={width}
        depth={depth}
        length={length}
        active={active}
        hovered={bodyHovered}
        onHover={setBodyHovered}
      />

      {/* Drive Motor */}
      <DriveMotor
        position={[0, -0.1, width / 2 + 0.35]}
        active={active}
      />

      {/* Data Panel */}
      <DataPanel
        position={[length / 2 + 1.8, 1, 0]}
        active={active}
        rpm={rpm}
        airflow={airflow}
        label={label}
      />

      {/* Click instruction */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.12}
        color={COLORS.accentYellow}
        anchorX="center"
        anchorY="middle"
      >
        {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
      </Text>

      {/* Invisible click target */}
      <mesh
        position={[0, 1, 0]}
        onClick={() => setInternalActive(!internalActive)}
        visible={false}
      >
        <boxGeometry args={[length * 1.5, 2.5, width * 1.5]} />
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

export function DestonerScene() {
  const [active, setActive] = useState(false);

  return (
    <Canvas shadows camera={{ position: [8, 6, 8], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <DestonerComponent
        width={1.8}
        depth={1.2}
        length={3.5}
        rpm={900}
        airflow={4500}
        active={active}
        label="DESTONER-01"
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

export function Destoner() {
  return <DestonerScene />;
}

export default Destoner;