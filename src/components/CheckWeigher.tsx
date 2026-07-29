'use client';

/**
 * CheckWeigher.tsx — HIGH-FIDELITY INDUSTRIAL CHECK WEIGHER
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, robust I-beam support legs with gussets, a 
 * high-fidelity weigh platform with detailed load cells, an enhanced 
 * pneumatic reject arm, a detailed drive motor with safety guard, and 
 * a realistic animated flour bag.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useEffect } from 'react';
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
  hmiScreen: '#00d4ff',
  hmiBody: '#2a2a2a',
  eStopRed: '#ff2222',
  bagWhite: '#f0f0eb',
  bagSeam: '#d0d0cb',
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
   3. CONVEYOR SECTIONS (Enhanced with I-beam rails and rollers)
   ========================================================================== */

function ConveyorSection({ position, length, width }: { position: V3; length: number; width: number }) {
  return (
    <group position={position}>
      {/* Side Rails (I-beam style) */}
      <mesh position={[0, 0.1, width / 2 - 0.05]} castShadow material={matStructure}>
        <boxGeometry args={[length, 0.15, 0.05]} />
      </mesh>
      <mesh position={[0, 0.1, width / 2 - 0.05]} material={matStructure}>
        <boxGeometry args={[length, 0.05, 0.12]} />
      </mesh>
      <mesh position={[0, 0.1, -width / 2 + 0.05]} castShadow material={matStructure}>
        <boxGeometry args={[length, 0.15, 0.05]} />
      </mesh>
      <mesh position={[0, 0.1, -width / 2 + 0.05]} material={matStructure}>
        <boxGeometry args={[length, 0.05, 0.12]} />
      </mesh>

      {/* Belt */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow material={matRubber}>
        <boxGeometry args={[length - 0.1, 0.04, width - 0.15]} />
      </mesh>

      {/* Rollers */}
      {[-length / 2 + 0.1, length / 2 - 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={matBodyDark}>
          <cylinderGeometry args={[0.06, 0.06, width - 0.2, 16]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   4. WEIGH PLATFORM & LOAD CELLS (High-fidelity)
   ========================================================================== */

function WeighPlatform({ width, weighing }: { width: number; weighing: boolean }) {
  const plateRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (!plateRef.current) return;
    const targetY = weighing ? 0.13 : 0.15;
    plateRef.current.position.y = THREE.MathUtils.damp(plateRef.current.position.y, targetY, 12, delta);
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Load Cells (4 pucks) */}
      {[
        [0.25, 0.05, width / 2 - 0.15],
        [-0.25, 0.05, width / 2 - 0.15],
        [0.25, 0.05, -width / 2 + 0.15],
        [-0.25, 0.05, -width / 2 + 0.15],
      ].map((pos, i) => (
        <group key={i} position={pos as V3}>
          <mesh castShadow material={matBodyDark}>
            <cylinderGeometry args={[0.04, 0.04, 0.1, 16]} />
          </mesh>
          {/* Load cell mounting bolts */}
          <Bolt position={[0, 0.06, 0]} size={0.014} />
          <Bolt position={[0, -0.06, 0]} rotation={[0, Math.PI, 0]} size={0.014} />
        </group>
      ))}

      {/* Weigh Plate */}
      <mesh ref={plateRef} position={[0, 0.15, 0]} castShadow receiveShadow material={matBody}>
        <boxGeometry args={[0.7, 0.08, width - 0.1]} />
      </mesh>
      
      {/* Weigh plate stiffener ribs */}
      <mesh position={[0.3, 0.15, 0]} material={matStructure}>
        <boxGeometry args={[0.04, 0.08, width - 0.12]} />
      </mesh>
      <mesh position={[-0.3, 0.15, 0]} material={matStructure}>
        <boxGeometry args={[0.04, 0.08, width - 0.12]} />
      </mesh>

      {/* Side guides for weigh section */}
      <mesh position={[0.4, 0.1, 0]} castShadow material={matBodyDark}>
        <boxGeometry args={[0.02, 0.15, width - 0.1]} />
      </mesh>
      <mesh position={[-0.4, 0.1, 0]} castShadow material={matBodyDark}>
        <boxGeometry args={[0.02, 0.15, width - 0.1]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   5. TOWER LIGHT & HMI (Industrial style)
   ========================================================================== */

function TowerLight({ position, status }: { position: V3; status: 'idle' | 'pass' | 'fail' }) {
  const greenRef = useRef<THREE.Mesh>(null!);
  const redRef = useRef<THREE.Mesh>(null!);
  const yellowRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const pulse = Math.sin(clock.elapsedTime * 10) > 0;
    if (greenRef.current) {
      (greenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = status === 'pass' && pulse ? 1.5 : 0.2;
    }
    if (redRef.current) {
      (redRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = status === 'fail' && pulse ? 1.5 : 0.2;
    }
    if (yellowRef.current) {
      (yellowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = status === 'idle' ? 0.45 : 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Mounting bracket */}
      <mesh material={matStructure}>
        <boxGeometry args={[0.06, 0.1, 0.06]} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 0.35, 0]} material={matStructure}>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 16]} />
      </mesh>
      {/* Green Lens */}
      <mesh ref={greenRef} position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
        <meshStandardMaterial color={COLORS.accentGreen} emissive={COLORS.accentGreen} emissiveIntensity={0.2} transparent opacity={0.8} />
      </mesh>
      {/* Yellow Lens */}
      <mesh ref={yellowRef} position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
        <meshStandardMaterial color={COLORS.accentYellow} emissive={COLORS.accentYellow} emissiveIntensity={0.2} transparent opacity={0.8} />
      </mesh>
      {/* Red Lens */}
      <mesh ref={redRef} position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
        <meshStandardMaterial color={COLORS.accentRed} emissive={COLORS.accentRed} emissiveIntensity={0.2} transparent opacity={0.8} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.04, 16]} />
        <meshStandardMaterial color={matStructure.color} />
      </mesh>
    </group>
  );
}

function HMIAndControls({ position, currentWeight }: { position: V3; currentWeight: string }) {
  return (
    <group position={position}>
      {/* HMI Box */}
      <mesh castShadow material={matBodyDark}>
        <boxGeometry args={[0.4, 0.3, 0.15]} />
      </mesh>
      
      {/* Mounting bolts */}
      <Bolt position={[-0.15, 0.1, 0.08]} rotation={[0, Math.PI / 2, 0]} size={0.012} />
      <Bolt position={[0.15, 0.1, 0.08]} rotation={[0, Math.PI / 2, 0]} size={0.012} />
      <Bolt position={[-0.15, -0.1, 0.08]} rotation={[0, Math.PI / 2, 0]} size={0.012} />
      <Bolt position={[0.15, -0.1, 0.08]} rotation={[0, Math.PI / 2, 0]} size={0.012} />

      {/* HMI Screen */}
      <mesh position={[0, 0.05, 0.08]}>
        <boxGeometry args={[0.32, 0.15, 0.01]} />
        <meshStandardMaterial color={COLORS.hmiScreen} emissive={COLORS.hmiScreen} emissiveIntensity={0.4} metalness={0.1} roughness={0.2} />
      </mesh>
      <Text position={[0, 0.05, 0.09]} fontSize={0.04} color="#000000" anchorX="center" anchorY="middle" fontWeight="bold">
        {currentWeight}
      </Text>
      
      {/* Emergency Stop (Big Red Mushroom with Yellow Ring) */}
      <mesh position={[0.15, -0.05, 0.08]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
        <meshStandardMaterial color={COLORS.accentYellow} />
      </mesh>
      <mesh position={[0.15, -0.05, 0.095]}>
        <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
        <meshStandardMaterial color={COLORS.eStopRed} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   6. PNEUMATIC REJECT ARM (Enhanced with cylinder and piston rod)
   ========================================================================== */

function RejectArm({ position, isActive }: { position: V3; isActive: boolean }) {
  const armRef = useRef<THREE.Mesh>(null!);
  const pistonRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (!armRef.current || !pistonRef.current) return;
    const targetZ = isActive ? -0.45 : 0;
    const targetPiston = isActive ? -0.25 : -0.12;
    
    armRef.current.position.z = THREE.MathUtils.damp(armRef.current.position.z, targetZ, 8, delta);
    pistonRef.current.position.z = THREE.MathUtils.damp(pistonRef.current.position.z, targetPiston, 8, delta);
  });

  return (
    <group position={position}>
      {/* Cylinder Body */}
      <mesh castShadow material={matBodyDark}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
      </mesh>
      {/* Piston Rod */}
      <mesh ref={pistonRef} position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow material={matBody}>
        <cylinderGeometry args={[0.03, 0.03, 0.2, 16]} />
      </mesh>
      {/* Pusher Plate (Yellow) */}
      <mesh ref={armRef} position={[0, 0, -0.28]} castShadow material={matSafety}>
        <boxGeometry args={[0.4, 0.25, 0.05]} />
      </mesh>
      {/* Pusher plate stripe */}
      <mesh position={[0, 0, -0.31]}>
        <boxGeometry args={[0.38, 0.23, 0.01]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {/* Mounting bolts */}
      <Bolt position={[-0.05, 0.08, 0.08]} rotation={[0, Math.PI / 2, 0]} size={0.014} />
      <Bolt position={[0.05, 0.08, 0.08]} rotation={[0, Math.PI / 2, 0]} size={0.014} />
      <Bolt position={[-0.05, -0.08, 0.08]} rotation={[0, Math.PI / 2, 0]} size={0.014} />
      <Bolt position={[0.05, -0.08, 0.08]} rotation={[0, Math.PI / 2, 0]} size={0.014} />
    </group>
  );
}

/* ==========================================================================
   7. DRIVE MOTOR (High-fidelity with safety guard)
   ========================================================================== */

function DriveMotor({ position, active }: { position: V3; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 8;
    }
  });

  return (
    <group position={position}>
      {/* Motor Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={matMotor}>
        <cylinderGeometry args={[0.15, 0.15, 0.35, 24]} />
      </mesh>

      {/* Cooling Fins */}
      {Array.from({ length: 8 }, (_, i) => {
        const z = -0.12 + (i / 7) * 0.24;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
            <cylinderGeometry args={[0.16, 0.16, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Terminal Box */}
      <mesh position={[0, 0.16, 0]} material={matMotorDark}>
        <boxGeometry args={[0.1, 0.06, 0.12]} />
      </mesh>

      {/* Fan Cover & Blades */}
      <mesh position={[0, 0, 0.19]} rotation={[0, 0, Math.PI / 2]} castShadow material={matMotorDark}>
        <cylinderGeometry args={[0.14, 0.14, 0.06, 24]} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.22]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <cylinderGeometry args={[0.11, 0.11, 0.03, 8]} />
      </mesh>

      {/* Shaft to Roller */}
      <mesh position={[0, 0, -0.22]} rotation={[0, 0, Math.PI / 2]} material={matBodyDark}>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 16]} />
      </mesh>

      {/* Safety Coupling Guard */}
      <mesh position={[0, 0.05, -0.15]} material={matSafety}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   8. REALISTIC ANIMATED FLOUR BAG
   ========================================================================== */

function IntelligentBag({
  active,
  deckY,
  length,
  onWeighComplete,
  onBagDone,
}: {
  active: boolean;
  deckY: number;
  length: number;
  onWeighComplete: (isPass: boolean, weightKg: string) => void;
  onBagDone: () => void;
}) {
  const bagRef = useRef<THREE.Group>(null!);
  const seamRef = useRef<THREE.Mesh>(null!);
  const phaseRef = useRef<'infeed' | 'weighing' | 'outfeed' | 'rejected' | 'done'>('infeed');
  const timerRef = useRef(0);
  const weighedRef = useRef(false);
  const [isPass] = useState(() => Math.random() > 0.1);
  const [done, setDone] = useState(false);

  useFrame((_, delta) => {
    if (!active || !bagRef.current || phaseRef.current === 'done') return;

    const phase = phaseRef.current;

    if (phase === 'infeed') {
      bagRef.current.position.x += delta * 0.8;
      if (seamRef.current) seamRef.current.position.x += delta * 0.8;
      
      if (bagRef.current.position.x >= 0) {
        bagRef.current.position.x = 0;
        if (seamRef.current) seamRef.current.position.x = 0;
        phaseRef.current = 'weighing';
        timerRef.current = 0;
        weighedRef.current = false;
      }
    } else if (phase === 'weighing') {
      timerRef.current += delta;
      if (timerRef.current > 1.5 && !weighedRef.current) {
        weighedRef.current = true;
        const weight = isPass
          ? (24.95 + Math.random() * 0.1).toFixed(2)
          : (24.50 + Math.random() * 0.25).toFixed(2);
        onWeighComplete(isPass, weight);
        phaseRef.current = isPass ? 'outfeed' : 'rejected';
        timerRef.current = 0;
      }
    } else if (phase === 'outfeed') {
      bagRef.current.position.x += delta * 0.8;
      if (seamRef.current) seamRef.current.position.x += delta * 0.8;
      
      if (bagRef.current.position.x > length / 2 + 0.3) {
        phaseRef.current = 'done';
        setDone(true);
        onBagDone();
      }
    } else if (phase === 'rejected') {
      timerRef.current += delta;
      if (timerRef.current >= 0.45) {
        bagRef.current.position.z += delta * 1.5;
        bagRef.current.position.x += delta * 0.35;
        if (seamRef.current) {
          seamRef.current.position.z += delta * 1.5;
          seamRef.current.position.x += delta * 0.35;
        }
        if (bagRef.current.position.z > 1.0) {
          phaseRef.current = 'done';
          setDone(true);
          onBagDone();
        }
      }
    }
  });

  if (done) return null;

  return (
    <group ref={bagRef} position={[-length / 2 + 0.15, deckY + 0.4, 0]}>
      {/* Main Bag Body */}
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.7, 0.4]} />
        <meshStandardMaterial color={COLORS.bagWhite} roughness={0.95} metalness={0} />
      </mesh>
      {/* Bag Top Seam / Fold line detail */}
      <mesh ref={seamRef} position={[0, 0.36, 0]}>
        <boxGeometry args={[0.31, 0.02, 0.41]} />
        <meshStandardMaterial color={COLORS.bagSeam} roughness={0.95} metalness={0} />
      </mesh>
      {/* Subtle bag branding panel */}
      <mesh position={[0, 0.1, 0.201]}>
         <planeGeometry args={[0.2, 0.25]} />
         <meshStandardMaterial color="#e0e0db" roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   9. PLC DATA PANEL
   ========================================================================== */

function DataPanel({
  position,
  active,
  currentWeight,
  acceptedCount,
  rejectedCount,
}: {
  position: V3;
  active: boolean;
  currentWeight: string;
  acceptedCount: number;
  rejectedCount: number;
}) {
  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.55, -0.02]}>
          <planeGeometry args={[2.0, 2.2]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.55, -0.015]}>
          <planeGeometry args={[2.04, 2.24]} />
          <meshStandardMaterial color={COLORS.accentCyan} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        <Text position={[-0.9, 0.35, 0]} fontSize={0.16} color="#1c1c1c" anchorX="left" anchorY="top" fontWeight="bold">
          CHECK WEIGHER
        </Text>
        <Text position={[-0.9, 0.1, 0]} fontSize={0.13} color={active ? COLORS.accentGreen : COLORS.accentRed} anchorX="left" anchorY="top">
          Status: {active ? 'RUNNING' : 'STOPPED'}
        </Text>
        <Text position={[-0.9, -0.15, 0]} fontSize={0.13} color="#3a3a3a" anchorX="left" anchorY="top">
          Target: 25.00 kg
        </Text>
        <Text position={[-0.9, -0.4, 0]} fontSize={0.13} color="#3a3a3a" anchorX="left" anchorY="top">
          Actual: {currentWeight}
        </Text>
        <Text position={[-0.9, -0.65, 0]} fontSize={0.13} color="#3a3a3a" anchorX="left" anchorY="top">
          Tolerance: ±50 g
        </Text>
        <Text position={[-0.9, -0.9, 0]} fontSize={0.13} color={COLORS.accentGreen} anchorX="left" anchorY="top">
          Accepted: {acceptedCount}
        </Text>
        <Text position={[-0.9, -1.15, 0]} fontSize={0.13} color={rejectedCount > 0 ? COLORS.accentRed : '#3a3a3a'} anchorX="left" anchorY="top">
          Rejected: {rejectedCount}
        </Text>
        <Text position={[-0.9, -1.4, 0]} fontSize={0.13} color={COLORS.accentGreen} anchorX="left" anchorY="top">
          Alarm: OFF
        </Text>
      </group>
    </Float>
  );
}

/* ==========================================================================
   10. MAIN CHECK WEIGHER COMPONENT
   ========================================================================== */

export interface CheckWeigherProps {
  position?: V3;
  length?: number;
  width?: number;
  height?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function CheckWeigherComponent({
  position = [0, 0, 0],
  length = 2.2,
  width = 0.9,
  height = 0.85,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
}: CheckWeigherProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [currentWeight, setCurrentWeight] = useState('0.00 kg');
  const [towerStatus, setTowerStatus] = useState<'idle' | 'pass' | 'fail'>('idle');
  const [rejectActive, setRejectActive] = useState(false);
  const [weighing, setWeighing] = useState(false);
  const [acceptedCount, setAcceptedCount] = useState(1523);
  const [rejectedCount, setRejectedCount] = useState(3);
  const [bagKey, setBagKey] = useState(0);
  const spawnTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = controlledActive !== undefined ? controlledActive : internalActive;
  const deckY = height;

  const handleWeighComplete = (isPass: boolean, weightKg: string) => {
    setCurrentWeight(`${weightKg} kg`);
    setTowerStatus(isPass ? 'pass' : 'fail');
    setRejectActive(!isPass);
    setWeighing(false);

    if (isPass) setAcceptedCount((prev) => prev + 1);
    else setRejectedCount((prev) => prev + 1);

    setTimeout(() => {
      setTowerStatus('idle');
      setRejectActive(false);
    }, 1500);
  };

  const handleBagDone = () => {
    if (spawnTimeout.current) clearTimeout(spawnTimeout.current);
    spawnTimeout.current = setTimeout(() => {
      setBagKey((prev) => prev + 1);
      setCurrentWeight('0.00 kg');
    }, 600);
  };

  useEffect(() => {
    if (!active) return;
    setBagKey((prev) => prev + 1);
    return () => {
      if (spawnTimeout.current) clearTimeout(spawnTimeout.current);
    };
  }, [active]);

  useEffect(() => {
    if (!active) {
      setWeighing(false);
      return;
    }
    const t = setTimeout(() => setWeighing(true), 900);
    const t2 = setTimeout(() => setWeighing(false), 2800);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [bagKey, active]);

  const sectionLen = (length - 0.75) / 2;
  const legPositions: V3[] = [
    [length / 2 - 0.15, deckY / 2, width / 2 - 0.15],
    [-length / 2 + 0.15, deckY / 2, width / 2 - 0.15],
    [length / 2 - 0.15, deckY / 2, -width / 2 + 0.15],
    [-length / 2 + 0.15, deckY / 2, -width / 2 + 0.15],
  ];

  return (
    <group position={position}>
      {/* Legs with I-beam simulation, base plates, and gussets */}
      {legPositions.map((pos, i) => (
        <group key={i}>
          <mesh position={pos} castShadow material={matStructure}>
            <boxGeometry args={[0.14, deckY, 0.14]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.16, deckY, 0.05]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.05, deckY, 0.16]} />
          </mesh>
          {/* Base plate */}
          <mesh position={[pos[0], -deckY / 2 + 0.04, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.35, 0.08, 0.35]} />
          </mesh>
          {/* Anchor bolts */}
          {[-0.12, 0.12].map((dx) =>
            [-0.12, 0.12].map((dz) => (
              <Bolt key={`${dx}-${dz}`} position={[pos[0] + dx, -deckY / 2 + 0.09, pos[2] + dz]} size={0.016} />
            ))
          )}
          {/* Top gusset */}
          <mesh position={[pos[0], deckY / 2 - 0.1, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.18, 0.25, 0.05]} />
          </mesh>
        </group>
      ))}

      {/* Deck assembly */}
      <group position={[0, deckY, 0]}>
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow material={matStructure}>
          <boxGeometry args={[length, 0.1, width]} />
        </mesh>

        <ConveyorSection position={[-(sectionLen / 2 + 0.4), 0, 0]} length={sectionLen} width={width} />
        <ConveyorSection position={[sectionLen / 2 + 0.4, 0, 0]} length={sectionLen} width={width} />
        <WeighPlatform width={width} weighing={weighing} />

        <RejectArm position={[0.55, 0.25, width / 2 + 0.28]} isActive={rejectActive} />
        <DriveMotor position={[length / 2 - 0.25, -0.15, -width / 2 - 0.15]} active={active} />

        <HMIAndControls position={[0, 0.75, width / 2 + 0.12]} currentWeight={currentWeight} />
        <TowerLight position={[0.45, 0.85, width / 2 + 0.12]} status={towerStatus} />

        <mesh position={[0, 0.25, -width / 2 - 0.1]} castShadow material={matBodyDark}>
          <boxGeometry args={[length - 0.2, 0.05, 0.1]} />
        </mesh>
      </group>

      {active && (
        <IntelligentBag
          key={bagKey}
          active={active}
          deckY={deckY}
          length={length}
          onWeighComplete={handleWeighComplete}
          onBagDone={handleBagDone}
        />
      )}

      {showDataPanel && (
        <DataPanel
          position={[length / 2 + 1.5, deckY + 0.8, 0]}
          active={active}
          currentWeight={currentWeight}
          acceptedCount={acceptedCount}
          rejectedCount={rejectedCount}
        />
      )}

      <mesh
        position={[0, deckY + 0.4, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          setInternalActive(!internalActive);
        }}
        visible={false}
      >
        <boxGeometry args={[length + 1, 1.5, width + 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {showClickText && (
        <Text position={[0, deckY + 1.35, 0]} fontSize={0.1} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
          {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
        </Text>
      )}
    </group>
  );
}

/* ==========================================================================
   11. ENVIRONMENT & EXPORT
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
        position={[10, 15, 10]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-far={40}
        shadow-bias={-0.0001}
      />
    </>
  );
}

export function CheckWeigherScene() {
  const [active, setActive] = useState(true);
  return (
    <Canvas shadows camera={{ position: [4, 3, 4], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <CheckWeigherComponent active={active} />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  );
}

export function CheckWeigher() {
  return <CheckWeigherScene />;
}
export default CheckWeigher;