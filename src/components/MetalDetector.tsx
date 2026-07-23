'use client';

/**
 * MetalDetector.tsx - INDUSTRIAL FINAL-PRODUCT METAL DETECTOR
 * ------------------------------------------------------------------------
 * End-of-line metal detector for sealed flour bags. Protects the customer
 * (unlike the cleaning-section magnetic separator, which protects machinery).
 *
 * Key Features:
 * - Prominent Detection Tunnel (visual centerpiece)
 * - Internal detection coils
 * - Integrated stainless infeed/outfeed conveyors
 * - Side-mounted Control Cabinet with HMI and E-Stop
 * - Tower Light (Green pass / Red fail)
 * - Pneumatic Reject Arm + Reject Bin
 * - Intelligent bag animation through the tunnel
 *
 * Local travel axis: +X (infeed → tunnel → outfeed).
 * In MaterialHandlingLine the group sits on the packing +X centreline (no rotation).
 *
 * Usage:
 *   import { MetalDetector } from './MetalDetector';
 *   <MetalDetector position={[0, 0, 0]} active={true} />
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import {
  matPaintBlue,
  matPaintedSteel,
  matRubber,
  matSteel,
  matSteelDark,
  matStructureSteel,
  matRailYellow,
} from '../materials';

type V3 = [number, number, number];

const COLORS = {
  stainless: '#d4d8dc',
  stainlessDark: '#a0a8b0',
  frameSteel: '#4a555c',
  beltBlack: '#1a1a1a',
  rollerSteel: '#6b7278',
  tunnelInterior: '#111111',
  coilCopper: '#b87333',
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
   DETECTION TUNNEL — aperture faces ±X (travel axis)
   ========================================================================== */

function DetectionTunnel({
  position,
  apertureWidth,
  height,
  depth,
}: {
  position: V3;
  apertureWidth: number;
  height: number;
  depth: number;
}) {
  const wallT = 0.15;
  return (
    <group position={position}>
      {/* Top */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow dispose={null} material={matSteel}>
        <boxGeometry args={[depth, wallT, apertureWidth]} />
      </mesh>
      {/* Side walls (±Z) */}
      <mesh position={[0, 0, -apertureWidth / 2 + wallT / 2]} castShadow receiveShadow dispose={null} material={matSteel}>
        <boxGeometry args={[depth, height, wallT]} />
      </mesh>
      <mesh position={[0, 0, apertureWidth / 2 - wallT / 2]} castShadow receiveShadow dispose={null} material={matSteel}>
        <boxGeometry args={[depth, height, wallT]} />
      </mesh>

      {/* Dark aperture liner — hollow shell so the tunnel reads as an opening */}
      <mesh position={[0, height / 2 - 0.08, 0]}>
        <boxGeometry args={[depth - 0.08, 0.04, apertureWidth - 0.2]} />
        <meshStandardMaterial color={COLORS.tunnelInterior} metalness={0.1} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, -apertureWidth / 2 + 0.12]}>
        <boxGeometry args={[depth - 0.08, height - 0.2, 0.04]} />
        <meshStandardMaterial color={COLORS.tunnelInterior} metalness={0.1} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, apertureWidth / 2 - 0.12]}>
        <boxGeometry args={[depth - 0.08, height - 0.2, 0.04]} />
        <meshStandardMaterial color={COLORS.tunnelInterior} metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Detection coils (planes perpendicular to travel) */}
      {[-0.22, 0, 0.22].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[(apertureWidth - 0.25) / 2, 0.025, 8, 32]} />
            <meshStandardMaterial color={COLORS.coilCopper} metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <torusGeometry args={[(height - 0.25) / 2, 0.025, 8, 32]} />
            <meshStandardMaterial color={COLORS.coilCopper} metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Safety stripe on top lip */}
      <mesh position={[0, height / 2 - 0.08, 0]} dispose={null} material={matRailYellow}>
        <boxGeometry args={[depth - 0.1, 0.02, apertureWidth - 0.2]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   CONVEYOR SECTIONS
   ========================================================================== */

function ConveyorSection({ position, length, width }: { position: V3; length: number; width: number }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.1, width / 2 - 0.05]} castShadow dispose={null} material={matSteel}>
        <boxGeometry args={[length, 0.2, 0.05]} />
      </mesh>
      <mesh position={[0, 0.1, -width / 2 + 0.05]} castShadow dispose={null} material={matSteel}>
        <boxGeometry args={[length, 0.2, 0.05]} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow dispose={null} material={matRubber}>
        <boxGeometry args={[length - 0.1, 0.05, width - 0.15]} />
      </mesh>
      {[-length / 2 + 0.1, length / 2 - 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} dispose={null} material={matSteel}>
          <cylinderGeometry args={[0.08, 0.08, width - 0.2, 16]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   CONTROL CABINET & TOWER LIGHT
   ========================================================================== */

function ControlCabinet({ position, isFail }: { position: V3; isFail: boolean }) {
  const screenRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!screenRef.current) return;
    const mat = screenRef.current.material as THREE.MeshStandardMaterial;
    if (isFail) {
      mat.emissiveIntensity = 0.4 + Math.sin(clock.elapsedTime * 15) * 0.4;
      mat.color.set('#ff2222');
      mat.emissive.set('#ff2222');
    } else {
      mat.emissiveIntensity = 0.4;
      mat.color.set(COLORS.hmiScreen);
      mat.emissive.set(COLORS.hmiScreen);
    }
  });

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.4, 1.2, 0.6]} />
        <meshStandardMaterial color={COLORS.hmiBody} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh ref={screenRef} position={[0.21, 0.3, 0]}>
        <boxGeometry args={[0.02, 0.35, 0.45]} />
        <meshStandardMaterial color={COLORS.hmiScreen} emissive={COLORS.hmiScreen} emissiveIntensity={0.4} />
      </mesh>
      <Text position={[0.23, 0.3, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.045} color="#000000" anchorX="center" anchorY="middle" fontWeight="bold">
        {isFail ? 'METAL!' : 'CLEAR'}
      </Text>
      <mesh position={[0.21, -0.1, -0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
        <meshStandardMaterial color={COLORS.lightGreen} />
      </mesh>
      <mesh position={[0.21, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
        <meshStandardMaterial color={COLORS.lightRed} />
      </mesh>
      <mesh position={[0.22, -0.1, 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        <meshStandardMaterial color={COLORS.eStopRed} />
      </mesh>
      <mesh position={[0.24, -0.1, 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        <meshStandardMaterial color={COLORS.eStopRed} />
      </mesh>
    </group>
  );
}

function TowerLight({ position, status }: { position: V3; status: 'idle' | 'pass' | 'fail' }) {
  const greenRef = useRef<THREE.Mesh>(null!);
  const redRef = useRef<THREE.Mesh>(null!);
  const yellowRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const pulse = Math.sin(clock.elapsedTime * 12) > 0;
    if (greenRef.current) {
      (greenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        status === 'pass' && pulse ? 1.5 : 0.1;
    }
    if (redRef.current) {
      (redRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        status === 'fail' && pulse ? 1.5 : 0.1;
    }
    if (yellowRef.current) {
      (yellowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        status === 'idle' ? 0.4 : 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh dispose={null} material={matSteelDark}>
        <cylinderGeometry args={[0.03, 0.03, 0.5, 16]} />
      </mesh>
      <mesh ref={greenRef} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 16]} />
        <meshStandardMaterial color={COLORS.lightGreen} emissive={COLORS.lightGreen} emissiveIntensity={0.1} />
      </mesh>
      <mesh ref={yellowRef} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 16]} />
        <meshStandardMaterial color={COLORS.lightYellow} emissive={COLORS.lightYellow} emissiveIntensity={0.1} />
      </mesh>
      <mesh ref={redRef} position={[0, -0.11, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 16]} />
        <meshStandardMaterial color={COLORS.lightRed} emissive={COLORS.lightRed} emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   REJECT SYSTEM — pusher along +Z into side bin
   ========================================================================== */

function RejectSystem({ position, isActive }: { position: V3; isActive: boolean }) {
  const armRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (!armRef.current) return;
    const targetZ = isActive ? 0.5 : 0;
    armRef.current.position.z = THREE.MathUtils.damp(armRef.current.position.z, targetZ, 8, delta);
  });

  return (
    <group position={position}>
      {/* Reject bin on +Z side */}
      <group position={[0, -0.15, 0.75]}>
        <mesh position={[0, 0, 0.2]} castShadow dispose={null} material={matSteel}>
          <boxGeometry args={[0.8, 0.55, 0.05]} />
        </mesh>
        <mesh position={[-0.4, 0, 0]} castShadow dispose={null} material={matSteel}>
          <boxGeometry args={[0.05, 0.55, 0.45]} />
        </mesh>
        <mesh position={[0.4, 0, 0]} castShadow dispose={null} material={matSteel}>
          <boxGeometry args={[0.05, 0.55, 0.45]} />
        </mesh>
        <mesh position={[0, -0.22, 0]} rotation={[0.35, 0, 0]} castShadow dispose={null} material={matSteelDark}>
          <boxGeometry args={[0.8, 0.05, 0.5]} />
        </mesh>
      </group>

      {/* Pneumatic pusher from −Z side, extends +Z across belt */}
      <group position={[0, 0.25, -0.55]}>
        <mesh dispose={null} material={matSteelDark}>
          <boxGeometry args={[0.15, 0.15, 0.15]} />
        </mesh>
        <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} dispose={null} material={matSteel}>
          <cylinderGeometry args={[0.03, 0.03, 0.2, 16]} />
        </mesh>
        <mesh ref={armRef} position={[0, 0, 0.28]} castShadow dispose={null} material={matRailYellow}>
          <boxGeometry args={[0.35, 0.3, 0.05]} />
        </mesh>
      </group>
    </group>
  );
}

function DriveMotor({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow dispose={null} material={matPaintBlue}>
        <boxGeometry args={[0.28, 0.22, 0.22]} />
      </mesh>
      <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.05, 0.05, 0.12, 16]} />
      </mesh>
    </group>
  );
}

function SensorBox({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow dispose={null} material={matPaintedSteel}>
        <boxGeometry args={[0.18, 0.12, 0.12]} />
      </mesh>
      <mesh position={[0, -0.08, 0]} dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.02, 0.02, 0.06, 12]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   INTELLIGENT BAG — travels along local +X through tunnel
   ========================================================================== */

function DetectorBag({
  active,
  deckY,
  length,
  onDetect,
  onBagDone,
}: {
  active: boolean;
  deckY: number;
  length: number;
  onDetect: (isPass: boolean) => void;
  onBagDone: () => void;
}) {
  const bagRef = useRef<THREE.Group>(null!);
  const phaseRef = useRef<'infeed' | 'tunnel' | 'outfeed' | 'rejected' | 'done'>('infeed');
  const timerRef = useRef(0);
  const detectedRef = useRef(false);
  const [isPass] = useState(() => Math.random() > 0.12);
  const [done, setDone] = useState(false);

  useFrame((_, delta) => {
    if (!active || !bagRef.current || phaseRef.current === 'done') return;
    const phase = phaseRef.current;

    if (phase === 'infeed') {
      bagRef.current.position.x += delta * 0.85;
      if (bagRef.current.position.x >= 0) {
        bagRef.current.position.x = 0;
        phaseRef.current = 'tunnel';
        timerRef.current = 0;
        if (!detectedRef.current) {
          detectedRef.current = true;
          onDetect(isPass);
        }
      }
    } else if (phase === 'tunnel') {
      timerRef.current += delta;
      if (timerRef.current > 0.75) {
        phaseRef.current = isPass ? 'outfeed' : 'rejected';
        timerRef.current = 0;
      }
    } else if (phase === 'outfeed') {
      bagRef.current.position.x += delta * 0.85;
      if (bagRef.current.position.x > length / 2 + 0.25) {
        phaseRef.current = 'done';
        setDone(true);
        onBagDone();
      }
    } else if (phase === 'rejected') {
      timerRef.current += delta;
      if (timerRef.current >= 0.35) {
        bagRef.current.position.z += delta * 1.6;
        bagRef.current.position.x += delta * 0.25;
        bagRef.current.position.y -= delta * 0.4;
        bagRef.current.rotation.x = Math.min(bagRef.current.rotation.x + delta * 2, Math.PI / 5);
        if (bagRef.current.position.z > 1.15) {
          phaseRef.current = 'done';
          setDone(true);
          onBagDone();
        }
      }
    }
  });

  if (done) return null;

  return (
    <group ref={bagRef} position={[-length / 2 + 0.2, deckY + 0.4, 0]}>
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
  acceptedCount,
  rejectedCount,
  metalDetected,
}: {
  position: V3;
  active: boolean;
  acceptedCount: number;
  rejectedCount: number;
  metalDetected: boolean;
}) {
  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.55, -0.02]}>
          <planeGeometry args={[2.0, 2.2]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <Text position={[-0.9, 0.35, 0]} fontSize={0.16} color="#1c1c1c" anchorX="left" anchorY="top" fontWeight="bold">
          METAL DETECTOR
        </Text>
        <Text position={[-0.9, 0.1, 0]} fontSize={0.13} color={active ? COLORS.lightGreen : COLORS.lightRed} anchorX="left" anchorY="top">
          Status: {active ? 'RUNNING' : 'STOPPED'}
        </Text>
        <Text position={[-0.9, -0.15, 0]} fontSize={0.13} color="#3a3a3a" anchorX="left" anchorY="top">
          Sensitivity: Fe 1.0 mm
        </Text>
        <Text position={[-0.9, -0.4, 0]} fontSize={0.13} color="#3a3a3a" anchorX="left" anchorY="top">
          SUS 2.0 mm
        </Text>
        <Text position={[-0.9, -0.65, 0]} fontSize={0.13} color={COLORS.lightGreen} anchorX="left" anchorY="top">
          Accepted: {acceptedCount}
        </Text>
        <Text position={[-0.9, -0.9, 0]} fontSize={0.13} color={rejectedCount > 0 ? COLORS.lightRed : '#3a3a3a'} anchorX="left" anchorY="top">
          Rejected: {rejectedCount}
        </Text>
        <Text position={[-0.9, -1.15, 0]} fontSize={0.13} color={metalDetected ? COLORS.lightRed : COLORS.lightGreen} anchorX="left" anchorY="top">
          Metal Detected: {metalDetected ? 'YES' : 'NO'}
        </Text>
        <Text position={[-0.9, -1.4, 0]} fontSize={0.13} color="#3a3a3a" anchorX="left" anchorY="top">
          Alarm: {metalDetected ? 'ON' : 'OFF'}
        </Text>
      </group>
    </Float>
  );
}

/* ==========================================================================
   MAIN METAL DETECTOR COMPONENT
   ========================================================================== */

export interface MetalDetectorProps {
  position?: V3;
  length?: number;
  width?: number;
  height?: number;
  tunnelHeight?: number;
  tunnelDepth?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function MetalDetectorComponent({
  position = [0, 0, 0],
  length = 2.5,
  width = 0.9,
  height = 0.85,
  tunnelHeight = 1.0,
  tunnelDepth = 0.8,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
}: MetalDetectorProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [towerStatus, setTowerStatus] = useState<'idle' | 'pass' | 'fail'>('idle');
  const [rejectActive, setRejectActive] = useState(false);
  const [acceptedCount, setAcceptedCount] = useState(1548);
  const [rejectedCount, setRejectedCount] = useState(1);
  const [bagKey, setBagKey] = useState(0);
  const spawnTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = controlledActive !== undefined ? controlledActive : internalActive;
  const deckY = height;
  const sectionLen = (length - tunnelDepth - 0.1) / 2;

  const handleDetect = (isPass: boolean) => {
    setTowerStatus(isPass ? 'pass' : 'fail');
    setRejectActive(!isPass);
    if (isPass) setAcceptedCount((p) => p + 1);
    else setRejectedCount((p) => p + 1);

    setTimeout(() => {
      setTowerStatus('idle');
      setRejectActive(false);
    }, 1400);
  };

  const handleBagDone = () => {
    if (spawnTimeout.current) clearTimeout(spawnTimeout.current);
    spawnTimeout.current = setTimeout(() => setBagKey((p) => p + 1), 700);
  };

  useEffect(() => {
    if (!active) return;
    setBagKey((p) => p + 1);
    return () => {
      if (spawnTimeout.current) clearTimeout(spawnTimeout.current);
    };
  }, [active]);

  return (
    <group position={position}>
      {/* Legs to floor */}
      {[
        [length / 2 - 0.15, deckY / 2, width / 2 - 0.1],
        [-length / 2 + 0.15, deckY / 2, width / 2 - 0.1],
        [length / 2 - 0.15, deckY / 2, -width / 2 + 0.1],
        [-length / 2 + 0.15, deckY / 2, -width / 2 + 0.1],
      ].map((pos, i) => (
        <mesh key={i} position={pos as V3} dispose={null} material={matSteel}>
          <boxGeometry args={[0.12, deckY, 0.12]} />
        </mesh>
      ))}

      <group position={[0, deckY, 0]}>
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow dispose={null} material={matSteel}>
          <boxGeometry args={[length, 0.1, width]} />
        </mesh>

        <ConveyorSection position={[-(sectionLen / 2 + tunnelDepth / 2 + 0.05), 0, 0]} length={sectionLen} width={width} />
        <ConveyorSection position={[sectionLen / 2 + tunnelDepth / 2 + 0.05, 0, 0]} length={sectionLen} width={width} />

        <DetectionTunnel
          position={[0, tunnelHeight / 2 + 0.15, 0]}
          apertureWidth={width}
          height={tunnelHeight}
          depth={tunnelDepth}
        />

        <ControlCabinet position={[0, 0.55, width / 2 + 0.45]} isFail={towerStatus === 'fail'} />
        <TowerLight position={[0.35, 1.35, width / 2 + 0.45]} status={towerStatus} />

        <RejectSystem position={[0.45, 0.1, 0]} isActive={rejectActive} />
        <DriveMotor position={[length / 2 - 0.3, -0.15, -width / 2 - 0.15]} />
        <SensorBox position={[-tunnelDepth / 2 - 0.15, 0.55, width / 2 - 0.05]} />
        <SensorBox position={[tunnelDepth / 2 + 0.15, 0.55, width / 2 - 0.05]} />

        <mesh position={[0, 0.28, -width / 2 - 0.1]} dispose={null} material={matSteelDark}>
          <boxGeometry args={[length - 0.25, 0.05, 0.1]} />
        </mesh>
      </group>

      {active && (
        <DetectorBag
          key={bagKey}
          active={active}
          deckY={deckY}
          length={length}
          onDetect={handleDetect}
          onBagDone={handleBagDone}
        />
      )}

      {showDataPanel && (
        <DataPanel
          position={[length / 2 + 1.5, deckY + 1.0, 0]}
          active={active}
          acceptedCount={acceptedCount}
          rejectedCount={rejectedCount}
          metalDetected={towerStatus === 'fail'}
        />
      )}

      <mesh
        position={[0, deckY + 0.6, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setInternalActive(!internalActive);
        }}
        visible={false}
      >
        <boxGeometry args={[length + 1, 1.8, width + 1.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {showClickText && (
        <Text position={[0, deckY + tunnelHeight + 0.55, 0]} fontSize={0.1} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
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

export function MetalDetectorScene() {
  return (
    <Canvas shadows camera={{ position: [4, 3, 4], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <MetalDetectorComponent active />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.8, 0]}
      />
    </Canvas>
  );
}

export function MetalDetector() {
  return <MetalDetectorScene />;
}
export default MetalDetector;
