'use client';

/**
 * Purifier.tsx - INDUSTRIAL SEMOLINA PURIFIER
 * ------------------------------------------------------------------------
 * A highly detailed industrial purifier for a flour mill digital twin.
 * Distinct from the plansifter, this machine is lower, wider, and features
 * a prominent aspiration duct for air suction to separate semolina from
 * fine bran and dust.
 * 
 * Key Features:
 * - Low, wide rectangular sieve cabinet (linear vibration)
 * - Prominent top-mounted aspiration duct with exhaust fan
 * - Air control damper (interactive sliding plate)
 * - Side-mounted eccentric vibration motor
 * - 3 distinct outlet chutes (Semolina, Bran, Middlings)
 * - Large interactive front inspection doors
 * - Access ladder and side platform
 * - Airflow and product particle animations
 * - Floating PLC data panel
 * 
 * Usage:
 *   import { Purifier } from './Purifier';
 *   <Purifier position={[0, 0, 0]} active={true} />
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import {
  matPaintBlue,
  matPaintDark,
  matPaintedSteel,
  matRailYellow,
  matSteel,
  matSteelDark,
  matStructureSteel,
} from '../materials';

type V3 = [number, number, number];

const COLORS = {
  cabinetSteel: '#7a8288',
  cabinetDark: '#4a5058',
  cabinetLight: '#9aa2a8',
  frameSteel: '#3a454c',
  frameSteelLight: '#4a555c',
  motorBlue: '#1e3a5f',
  motorDark: '#152a45',
  accentYellow: '#e0a92c',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  semolinaColor: '#f0e6d2',
  branColor: '#8b5a2b',
  middlingsColor: '#e8d5b5',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   LOW SUPPORT FRAME
   ========================================================================== */

function SupportFrame({ width, depth }: { width: number; depth: number }) {
  const legHeight = 1.2;
  const legPositions: V3[] = [
    [width / 2 - 0.2, -legHeight / 2, depth / 2 - 0.2],
    [-width / 2 + 0.2, -legHeight / 2, depth / 2 - 0.2],
    [width / 2 - 0.2, -legHeight / 2, -depth / 2 + 0.2],
    [-width / 2 + 0.2, -legHeight / 2, -depth / 2 + 0.2],
  ];

  return (
    <group>
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow dispose={null} material={matPaintedSteel}>
          <boxGeometry args={[0.2, legHeight, 0.2]} />
        </mesh>
      ))}
      {legPositions.map((pos, i) => (
        <mesh key={`base-${i}`} position={[pos[0], -legHeight / 2 + 0.05, pos[2]]} dispose={null} material={matStructureSteel}>
          <boxGeometry args={[0.4, 0.1, 0.4]} />
        </mesh>
      ))}
      {/* Heavy cross bracing */}
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} castShadow dispose={null} material={matStructureSteel}>
        <boxGeometry args={[width - 0.4, 0.12, 0.12]} />
      </mesh>
      <mesh position={[0, -legHeight / 2 + 0.4, 0]} rotation={[0, Math.PI / 2, 0]} castShadow dispose={null} material={matStructureSteel}>
        <boxGeometry args={[depth - 0.4, 0.12, 0.12]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   MAIN SIEVE CABINET (Linear Vibration)
   ========================================================================== */

function SieveCabinet({ 
  width, height, depth, active, isDoorOpen, onDoorToggle 
}: { 
  width: number; height: number; depth: number; 
  active: boolean; isDoorOpen: boolean; onDoorToggle: () => void; 
}) {
  const cabinetRef = useRef<THREE.Group>(null!);
  const door1Ref = useRef<THREE.Group>(null!);
  const door2Ref = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (!cabinetRef.current) return;
    
    // Linear shaking motion (distinct from plansifter's gyratory motion)
    if (active) {
      const t = clock.elapsedTime * 12;
      cabinetRef.current.position.x = Math.sin(t) * 0.015;
      cabinetRef.current.position.z = Math.sin(t * 0.8) * 0.005;
    } else {
      cabinetRef.current.position.x = THREE.MathUtils.damp(cabinetRef.current.position.x, 0, 5, 0.016);
      cabinetRef.current.position.z = THREE.MathUtils.damp(cabinetRef.current.position.z, 0, 5, 0.016);
    }

    // Door animation
    const targetRot = isDoorOpen ? -Math.PI / 2.2 : 0;
    if (door1Ref.current) door1Ref.current.rotation.y = THREE.MathUtils.damp(door1Ref.current.rotation.y, targetRot, 4, 0.016);
    if (door2Ref.current) door2Ref.current.rotation.y = THREE.MathUtils.damp(door2Ref.current.rotation.y, -targetRot, 4, 0.016);
  });

  const doorWidth = width * 0.45;
  const doorHeight = height * 0.65;

  return (
    <group ref={cabinetRef}>
      {/* Main Body */}
      <mesh castShadow receiveShadow dispose={null} material={matSteel} scale={hovered ? 1.01 : 1}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* Horizontal Sieve Lines */}
      {Array.from({ length: 6 }, (_, i) => {
        const y = -height / 2 + 0.4 + i * (height / 7);
        return (
          <mesh key={i} position={[0, y, depth / 2 + 0.01]} dispose={null} material={matSteelDark}>
            <boxGeometry args={[width * 0.98, 0.03, 0.02]} />
          </mesh>
        );
      })}

      {/* Top & Bottom Caps */}
      <mesh position={[0, height / 2 + 0.05, 0]} dispose={null} material={matSteelDark}>
        <boxGeometry args={[width + 0.1, 0.1, depth + 0.1]} />
      </mesh>
      <mesh position={[0, -height / 2 - 0.05, 0]} dispose={null} material={matSteelDark}>
        <boxGeometry args={[width + 0.1, 0.1, depth + 0.1]} />
      </mesh>

      {/* Manufacturer Plate */}
      <mesh position={[0, height * 0.3, depth / 2 + 0.02]} dispose={null} material={matSteelDark}>
        <boxGeometry args={[width * 0.25, 0.2, 0.01]} />
      </mesh>
      <Text position={[0, height * 0.3, depth / 2 + 0.03]} fontSize={0.06} color={COLORS.frameSteel} anchorX="center" anchorY="middle" fontWeight="bold">
        PURIFIER PU-6
      </Text>

      {/* Interactive Doors */}
      <group
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onDoorToggle(); }}
      >
        <group ref={door1Ref} position={[-doorWidth / 2 - 0.02, 0, depth / 2 + 0.02]}>
          <mesh castShadow receiveShadow dispose={null} material={matSteel}>
            <boxGeometry args={[doorWidth, doorHeight, 0.08]} />
          </mesh>
          <mesh position={[0, 0, 0.05]} dispose={null} material={matSteelDark}>
            <boxGeometry args={[doorWidth - 0.1, doorHeight - 0.1, 0.02]} />
          </mesh>
          <mesh position={[doorWidth / 2 - 0.1, 0, 0.08]} dispose={null} material={matStructureSteel}>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
          </mesh>
        </group>

        <group ref={door2Ref} position={[doorWidth / 2 + 0.02, 0, depth / 2 + 0.02]}>
          <mesh castShadow receiveShadow dispose={null} material={matSteel}>
            <boxGeometry args={[doorWidth, doorHeight, 0.08]} />
          </mesh>
          <mesh position={[0, 0, 0.05]} dispose={null} material={matSteelDark}>
            <boxGeometry args={[doorWidth - 0.1, doorHeight - 0.1, 0.02]} />
          </mesh>
          <mesh position={[-doorWidth / 2 + 0.1, 0, 0.08]} dispose={null} material={matStructureSteel}>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* ==========================================================================
   ASPIRATION DUCT (The Key Differentiator)
   ========================================================================== */

function AspirationDuct({ width, depth, height, position, damperOpen, onToggleDamper }: { 
  width: number; depth: number; height: number; position: V3; 
  damperOpen: boolean; onToggleDamper: () => void; 
}) {
  const damperRef = useRef<THREE.Mesh>(null!);
  const fanRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    // Damper sliding animation
    if (damperRef.current) {
      const targetY = damperOpen ? 0.3 : 0;
      damperRef.current.position.y = THREE.MathUtils.damp(damperRef.current.position.y, targetY, 4, delta);
    }
    // Exhaust fan rotation
    if (fanRef.current) {
      fanRef.current.rotation.z += delta * 8;
    }
  });

  return (
    <group position={position}>
      {/* Main Horizontal Duct */}
      <mesh castShadow receiveShadow dispose={null} material={matSteel}>
        <boxGeometry args={[width * 0.9, height * 0.6, depth * 0.8]} />
      </mesh>

      {/* Vertical Exhaust Pipe */}
      <mesh position={[width * 0.3, height * 0.6, 0]} castShadow dispose={null} material={matSteel}>
        <boxGeometry args={[0.6, height * 0.8, 0.6]} />
      </mesh>

      {/* Exhaust Fan Housing (Top) */}
      <mesh position={[width * 0.3, height * 1.1, 0]} rotation={[Math.PI / 2, 0, 0]} dispose={null} material={matPaintBlue}>
        <cylinderGeometry args={[0.35, 0.35, 0.2, 24]} />
      </mesh>
      <mesh ref={fanRef} position={[width * 0.3, height * 1.22, 0]} rotation={[Math.PI / 2, 0, 0]} dispose={null} material={matStructureSteel}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 8]} />
      </mesh>

      {/* Air Control Damper (Interactive sliding plate) */}
      <group 
        position={[-width * 0.3, 0, depth * 0.41]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => e.stopPropagation()}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onToggleDamper(); }}
      >
        <mesh ref={damperRef} dispose={null} material={matRailYellow}>
          <boxGeometry args={[0.4, 0.5, 0.04]} />
        </mesh>
        {/* Damper Handle */}
        <mesh position={[0, 0, 0.04]} dispose={null} material={matStructureSteel}>
          <boxGeometry args={[0.05, 0.15, 0.05]} />
        </mesh>
        <Text position={[0, -0.4, 0.05]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle">
          AIR DAMPER
        </Text>
      </group>
    </group>
  );
}

/* ==========================================================================
   SIDE VIBRATION MOTOR
   ========================================================================== */

function VibrationMotor({ position, active }: { position: V3; active: boolean }) {
  const weightRef = useRef<THREE.Mesh>(null!);
  const fanRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (weightRef.current && active) weightRef.current.rotation.x += delta * 15;
    if (fanRef.current && active) fanRef.current.rotation.z += delta * 12;
  });

  return (
    <group position={position}>
      {/* Motor Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow dispose={null} material={matPaintBlue}>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 24]} />
      </mesh>
      {/* Cooling Fins */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = -0.25 + (i / 9) * 0.5;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matPaintDark}>
            <cylinderGeometry args={[0.32, 0.32, 0.015, 24]} />
          </mesh>
        );
      })}
      {/* Fan */}
      <mesh position={[0, 0, 0.35]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matPaintDark}>
        <cylinderGeometry args={[0.25, 0.25, 0.06, 24]} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.38]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matStructureSteel}>
        <cylinderGeometry args={[0.2, 0.2, 0.03, 8]} />
      </mesh>
      {/* Eccentric Weight Housing (Visible spinning part) */}
      <mesh position={[0, 0, -0.35]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matPaintDark}>
        <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
      </mesh>
      <mesh ref={weightRef} position={[0, 0, -0.45]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[0.15, 0.15, 0.1]} />
      </mesh>
      {/* Status LED */}
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color={active ? COLORS.accentGreen : COLORS.accentRed} emissive={active ? COLORS.accentGreen : COLORS.accentRed} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   INLET & OUTLETS
   ========================================================================== */

function InletAndOutlets({ width, depth, height }: { width: number; depth: number; height: number }) {
  const chuteWidth = width * 0.25;
  const chuteDepth = depth * 0.7;
  const spacing = width * 0.3;
  const positions = [-spacing, 0, spacing];
  const labels = ['SEMOLINA', 'MIDDLINGS', 'BRAN'];
  const colors = [COLORS.semolinaColor, COLORS.middlingsColor, COLORS.branColor];

  return (
    <group>
      {/* Feed Inlet (Top) */}
      <mesh position={[0, height / 2 + 0.4, 0]} castShadow dispose={null} material={matSteel}>
        <boxGeometry args={[0.6, 0.8, 0.6]} />
      </mesh>
      <mesh position={[0, height / 2 + 0.82, 0]} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[0.65, 0.06, 0.65]} />
      </mesh>

      {/* Outlet Chutes (Bottom) */}
      {positions.map((x, i) => (
        <group key={i} position={[x, -height / 2 - 0.4, 0]}>
          <mesh castShadow receiveShadow dispose={null} material={matSteel}>
            <boxGeometry args={[chuteWidth, 0.8, chuteDepth]} />
          </mesh>
          <mesh position={[0, -0.42, 0]} dispose={null} material={matStructureSteel}>
            <boxGeometry args={[chuteWidth + 0.05, 0.06, chuteDepth + 0.05]} />
          </mesh>
          <Text position={[0, 0, chuteDepth / 2 + 0.05]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
            {labels[i]}
          </Text>
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
   ACCESS LADDER & PLATFORM
   ========================================================================== */

function AccessLadder({ height, depth }: { height: number; depth: number }) {
  return (
    <group position={[0, 0, depth / 2 + 0.3]}>
      <mesh position={[-0.3, 0, 0]} castShadow dispose={null} material={matPaintedSteel}><boxGeometry args={[0.05, height * 0.8, 0.05]} /></mesh>
      <mesh position={[0.3, 0, 0]} castShadow dispose={null} material={matPaintedSteel}><boxGeometry args={[0.05, height * 0.8, 0.05]} /></mesh>
      {Array.from({ length: 10 }, (_, i) => {
        const y = -height * 0.3 + i * (height * 0.6 / 9);
        return (
          <mesh key={i} position={[0, y, 0.05]} castShadow dispose={null} material={matStructureSteel}>
            <boxGeometry args={[0.5, 0.04, 0.04]} />
          </mesh>
        );
      })}
      <mesh position={[0, height * 0.4, 0.2]} castShadow dispose={null} material={matPaintedSteel}>
        <boxGeometry args={[1.2, 0.08, 0.8]} />
      </mesh>
      <mesh position={[0, height * 0.4 + 0.4, 0.55]} dispose={null} material={matRailYellow}>
        <boxGeometry args={[1.2, 0.04, 0.04]} />
      </mesh>
      {[-0.55, 0.55].map((x, i) => (
        <mesh key={i} position={[x, height * 0.4 + 0.2, 0.55]} dispose={null} material={matRailYellow}>
          <boxGeometry args={[0.04, 0.4, 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   DATA PANEL
   ========================================================================== */

function DataPanel({ position, active }: { position: V3; active: boolean }) {
  const lines = [
    { text: `PURIFIER PU-6`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ${active ? 'RUNNING' : 'STOPPED'}`, size: 0.13, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Motor RPM: ${active ? '980' : '0'}`, size: 0.13, color: '#3a3a3a' },
    { text: `Airflow: ${active ? '4200' : '0'} m³/h`, size: 0.13, color: '#3a3a3a' },
    { text: `Feed Rate: ${active ? '7.5' : '0.0'} TPH`, size: 0.13, color: '#3a3a3a' },
    { text: `Semolina Purity: ${active ? '98.2' : '0.0'}%`, size: 0.13, color: '#3a3a3a' },
    { text: `Alarm: OFF`, size: 0.13, color: COLORS.accentGreen },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.45, -0.02]}><planeGeometry args={[2.2, 1.8]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -0.45, -0.015]}><planeGeometry args={[2.24, 1.84]} /><meshStandardMaterial color={COLORS.accentYellow} transparent opacity={0.4} side={THREE.DoubleSide} /></mesh>
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
   MAIN PURIFIER COMPONENT
   ========================================================================== */

export interface PurifierProps {
  position?: V3;
  width?: number;
  height?: number;
  depth?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
  showAccessLadder?: boolean;
}

export function PurifierComponent({
  position = [0, 0, 0],
  width = 3.5,
  height = 2.0,
  depth = 2.2,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
  showAccessLadder = true,
}: PurifierProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [damperOpen, setDamperOpen] = useState(true);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  return (
    <group position={position}>
      <SupportFrame width={width} depth={depth} />
      
      <SieveCabinet 
        width={width} height={height} depth={depth} 
        active={active} isDoorOpen={doorsOpen} onDoorToggle={() => setDoorsOpen(!doorsOpen)} 
      />

      <AspirationDuct 
        width={width} depth={depth} height={height} 
        position={[0, height / 2 + 0.4, 0]} 
        damperOpen={damperOpen} onToggleDamper={() => setDamperOpen(!damperOpen)} 
      />

      <VibrationMotor position={[width / 2 + 0.5, 0, 0]} active={active} />
      <InletAndOutlets width={width} depth={depth} height={height} />
      {showAccessLadder && <AccessLadder height={height} depth={depth} />}

      {/* Animations */}
      {active && (
        <>
          {/* Airflow rising into duct */}
          <Sparkles count={50} scale={[width * 0.6, height * 0.5, depth * 0.6]} size={2} speed={1.5} position={[0, height / 2 + 0.2, 0]} color="#e0f0ff" />
          {/* Product streams */}
          <Sparkles count={30} scale={[0.3, 0.5, 0.3]} size={2} speed={1.5} position={[-width * 0.3, -height / 2 - 1, 0]} color={COLORS.semolinaColor} />
          <Sparkles count={20} scale={[0.3, 0.5, 0.3]} size={2} speed={1.5} position={[0, -height / 2 - 1, 0]} color={COLORS.middlingsColor} />
          <Sparkles count={15} scale={[0.3, 0.5, 0.3]} size={2} speed={1.5} position={[width * 0.3, -height / 2 - 1, 0]} color={COLORS.branColor} />
        </>
      )}

      {showDataPanel && (
        <DataPanel position={[width / 2 + 2, height / 2, 0]} active={active} />
      )}

      {showClickText && (
        <>
          <Text position={[0, height / 2 + 1.5, depth / 2 + 0.5]} fontSize={0.1} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
            {doorsOpen ? '● DOORS OPEN' : '○ CLICK DOORS TO INSPECT'}
          </Text>
          <Text position={[0, -height / 2 - 1.5, depth / 2 + 0.5]} fontSize={0.1} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
            {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
          </Text>
        </>
      )}

      <mesh position={[0, 0, 0]} onClick={() => setInternalActive(!internalActive)} visible={false}>
        <boxGeometry args={[width + 2, height + 3, depth + 2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   SCENE EXPORT
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
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.5]} />
      <directionalLight position={[15, 20, 10]} intensity={1.4} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-camera-far={50} />
    </>
  );
}

export function PurifierScene() {
  const [active, setActive] = useState(true);
  return (
    <Canvas shadows camera={{ position: [10, 6, 10], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <PurifierComponent width={3.5} height={2.0} depth={2.2} active={active} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={5} maxDistance={30} maxPolarAngle={Math.PI / 2.05} target={[0, 1, 0]} />
    </Canvas>
  );
}

export function Purifier() { return <PurifierScene />; }
export default Purifier;