'use client';

/**
 * CheckWeigher.tsx - INDUSTRIAL CHECK WEIGHER
 * ------------------------------------------------------------------------
 * A highly detailed, "intelligent" industrial check weigher for a flour mill
 * digital twin. Unlike a standard conveyor, this machine actively inspects
 * every bag, pauses it for weighing, and sorts it based on tolerance.
 *
 * Key Features:
 * - Distinct 3-section layout: Infeed, Weigh Platform, Outfeed
 * - Visible load cells supporting the central weigh platform
 * - Animated bag lifecycle (Enters -> Pauses & Weighs -> Passes or Rejects)
 * - Dynamic HMI display that updates with the "measured" weight
 * - 3-tier Tower Light that flashes Green (Pass) or Red (Reject)
 * - Pneumatic Reject Arm that physically pushes failed bags off the line
 * - Real-time PLC data panel with accepted/rejected counts
 *
 * Local travel axis: +X (infeed → platform → outfeed).
 * In MaterialHandlingLine the group is rotated −90° Y so flow continues on +Z.
 *
 * Usage:
 *   import { CheckWeigher } from './CheckWeigher';
 *   <CheckWeigher position={[0, 0, 0]} active={true} />
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

const COLORS = {
  frameSteel: '#4a555c',
  frameSteelDark: '#3a454c',
  frameSteelLight: '#6b7278',
  beltBlack: '#1a1a1a',
  rollerSteel: '#6b7278',
  platformSteel: '#d4d8dc',
  motorBlue: '#1e3a5f',
  safetyYellow: '#e0a92c',
  hmiScreen: '#00d4ff',
  hmiBody: '#2a2a2a',
  eStopRed: '#ff2222',
  lightGreen: '#3fae56',
  lightYellow: '#e0a92c',
  lightRed: '#a4222c',
  bagWhite: '#f5f5f0',
  concrete: '#9a9a92',
  accentCyan: '#00d4ff',
} as const;

/* ==========================================================================
   CONVEYOR SECTIONS (Infeed & Outfeed)
   ========================================================================== */

function ConveyorSection({ position, length, width }: { position: V3; length: number; width: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.1, width / 2 - 0.05]} castShadow>
        <boxGeometry args={[length, 0.2, 0.05]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.1, -width / 2 + 0.05]} castShadow>
        <boxGeometry args={[length, 0.2, 0.05]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[length - 0.1, 0.05, width - 0.15]} />
        <meshStandardMaterial color={COLORS.beltBlack} roughness={0.9} metalness={0.1} />
      </mesh>
      {[-length / 2 + 0.1, length / 2 - 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, width - 0.2, 16]} />
          <meshStandardMaterial color={COLORS.rollerSteel} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   WEIGH PLATFORM & LOAD CELLS
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
      {[
        [0.25, 0.05, width / 2 - 0.15],
        [-0.25, 0.05, width / 2 - 0.15],
        [0.25, 0.05, -width / 2 + 0.15],
        [-0.25, 0.05, -width / 2 + 0.15],
      ].map((pos, i) => (
        <mesh key={i} position={pos as V3}>
          <cylinderGeometry args={[0.04, 0.04, 0.1, 16]} />
          <meshStandardMaterial color={COLORS.rollerSteel} metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      <mesh ref={plateRef} position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.08, width - 0.1]} />
        <meshStandardMaterial color={COLORS.platformSteel} metalness={0.8} roughness={0.1} />
      </mesh>

      <mesh position={[0.4, 0.1, 0]}>
        <boxGeometry args={[0.02, 0.15, width - 0.1]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} />
      </mesh>
      <mesh position={[-0.4, 0.1, 0]}>
        <boxGeometry args={[0.02, 0.15, width - 0.1]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   TOWER LIGHT & HMI
   ========================================================================== */

function TowerLight({ position, status }: { position: V3; status: 'idle' | 'pass' | 'fail' }) {
  const greenRef = useRef<THREE.Mesh>(null!);
  const redRef = useRef<THREE.Mesh>(null!);
  const yellowRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const pulse = Math.sin(clock.elapsedTime * 10) > 0;
    if (greenRef.current) {
      (greenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        status === 'pass' && pulse ? 1.5 : 0.2;
    }
    if (redRef.current) {
      (redRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        status === 'fail' && pulse ? 1.5 : 0.2;
    }
    if (yellowRef.current) {
      (yellowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        status === 'idle' ? 0.45 : 0.15;
    }
  });

  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 16]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} />
      </mesh>
      <mesh ref={greenRef} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
        <meshStandardMaterial color={COLORS.lightGreen} emissive={COLORS.lightGreen} emissiveIntensity={0.2} />
      </mesh>
      <mesh ref={yellowRef} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
        <meshStandardMaterial color={COLORS.lightYellow} emissive={COLORS.lightYellow} emissiveIntensity={0.2} />
      </mesh>
      <mesh ref={redRef} position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
        <meshStandardMaterial color={COLORS.lightRed} emissive={COLORS.lightRed} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

function HMIAndControls({ position, currentWeight }: { position: V3; currentWeight: string }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.4, 0.3, 0.15]} />
        <meshStandardMaterial color={COLORS.hmiBody} />
      </mesh>
      <mesh position={[0, 0.05, 0.08]}>
        <boxGeometry args={[0.32, 0.15, 0.01]} />
        <meshStandardMaterial color={COLORS.hmiScreen} emissive={COLORS.hmiScreen} emissiveIntensity={0.4} />
      </mesh>
      <Text position={[0, 0.05, 0.09]} fontSize={0.04} color="#000000" anchorX="center" anchorY="middle" fontWeight="bold">
        {currentWeight}
      </Text>
      <mesh position={[0.15, -0.05, 0.08]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        <meshStandardMaterial color={COLORS.eStopRed} />
      </mesh>
      <mesh position={[0.15, -0.05, 0.1]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        <meshStandardMaterial color={COLORS.eStopRed} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   PNEUMATIC REJECT ARM (extends across belt from +Z side)
   ========================================================================== */

function RejectArm({ position, isActive }: { position: V3; isActive: boolean }) {
  const armRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (!armRef.current) return;
    const targetZ = isActive ? -0.45 : 0;
    armRef.current.position.z = THREE.MathUtils.damp(armRef.current.position.z, targetZ, 8, delta);
  });

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} />
      </mesh>
      <mesh position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.2, 16]} />
        <meshStandardMaterial color={COLORS.rollerSteel} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh ref={armRef} position={[0, 0, -0.28]} castShadow>
        <boxGeometry args={[0.4, 0.25, 0.05]} />
        <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   DRIVE MOTOR
   ========================================================================== */

function DriveMotor({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.28, 0.22, 0.22]} />
        <meshStandardMaterial color={COLORS.motorBlue} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.12, 16]} />
        <meshStandardMaterial color={COLORS.rollerSteel} metalness={0.85} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   INTELLIGENT ANIMATED BAG — travels along local +X
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
      if (bagRef.current.position.x >= 0) {
        bagRef.current.position.x = 0;
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
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.7, 0.4]} />
        <meshStandardMaterial color={COLORS.bagWhite} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.28, 0.02, 0.38]} />
        <meshStandardMaterial color="#d4d8dc" />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   PLC DATA PANEL
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
        <Text position={[-0.9, 0.35, 0]} fontSize={0.16} color="#1c1c1c" anchorX="left" anchorY="top" fontWeight="bold">
          CHECK WEIGHER
        </Text>
        <Text position={[-0.9, 0.1, 0]} fontSize={0.13} color={active ? COLORS.lightGreen : COLORS.lightRed} anchorX="left" anchorY="top">
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
        <Text position={[-0.9, -0.9, 0]} fontSize={0.13} color={COLORS.lightGreen} anchorX="left" anchorY="top">
          Accepted: {acceptedCount}
        </Text>
        <Text position={[-0.9, -1.15, 0]} fontSize={0.13} color={rejectedCount > 0 ? COLORS.lightRed : '#3a3a3a'} anchorX="left" anchorY="top">
          Rejected: {rejectedCount}
        </Text>
        <Text position={[-0.9, -1.4, 0]} fontSize={0.13} color="#3a3a3a" anchorX="left" anchorY="top">
          Alarm: OFF
        </Text>
      </group>
    </Float>
  );
}

/* ==========================================================================
   MAIN CHECK WEIGHER COMPONENT
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

  // Detect weighing start via bag key remount — platform dips while tower idle→weigh
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

  return (
    <group position={position}>
      {/* Legs to floor */}
      {[
        [length / 2 - 0.1, deckY / 2, width / 2 - 0.1],
        [-length / 2 + 0.1, deckY / 2, width / 2 - 0.1],
        [length / 2 - 0.1, deckY / 2, -width / 2 + 0.1],
        [-length / 2 + 0.1, deckY / 2, -width / 2 + 0.1],
      ].map((pos, i) => (
        <mesh key={i} position={pos as V3}>
          <boxGeometry args={[0.1, deckY, 0.1]} />
          <meshStandardMaterial color={COLORS.frameSteel} />
        </mesh>
      ))}

      {/* Deck assembly */}
      <group position={[0, deckY, 0]}>
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[length, 0.1, width]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
        </mesh>

        <ConveyorSection position={[-(sectionLen / 2 + 0.4), 0, 0]} length={sectionLen} width={width} />
        <ConveyorSection position={[sectionLen / 2 + 0.4, 0, 0]} length={sectionLen} width={width} />
        <WeighPlatform width={width} weighing={weighing} />

        <RejectArm position={[0.55, 0.25, width / 2 + 0.28]} isActive={rejectActive} />
        <DriveMotor position={[length / 2 - 0.25, -0.15, -width / 2 - 0.15]} />

        <HMIAndControls position={[0, 0.75, width / 2 + 0.12]} currentWeight={currentWeight} />
        <TowerLight position={[0.45, 0.85, width / 2 + 0.12]} status={towerStatus} />

        <mesh position={[0, 0.25, -width / 2 - 0.1]}>
          <boxGeometry args={[length - 0.2, 0.05, 0.1]} />
          <meshStandardMaterial color={COLORS.frameSteelLight} />
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
        onClick={(e) => {
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
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-far={40}
      />
    </>
  );
}

export function CheckWeigherScene() {
  return (
    <Canvas shadows camera={{ position: [4, 3, 4], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <CheckWeigherComponent active />
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
