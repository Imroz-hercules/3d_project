'use client';

/**
 * Palletizer.tsx - INDUSTRIAL 6-AXIS ROBOTIC PALLETIZER
 * ------------------------------------------------------------------------
 * The final major machine in the flour mill production line. A visually 
 * impressive 6-axis robotic arm that picks flour bags from the conveyor 
 * and stacks them onto pallets in an alternating pattern.
 * 
 * Key Features:
 * - Full 6-axis articulated robot arm (Base, Shoulder, Upper Arm, Elbow, 
 *   Forearm, Wrist) with proper hierarchical kinematics
 * - Clamp-style gripper with animated opening/closing jaws
 * - Complete pick-and-place animation cycle with state machine
 * - Safety fence enclosure with mesh panels and safety gate
 * - Wooden pallet with realistic slat construction
 * - Completed pallet with stacked bags in alternating layer pattern
 * - HMI panel with production stats
 * - 3-tier tower light
 * - Real-time PLC data panel
 * 
 * Usage:
 *   import { Palletizer } from './Palletizer';
 *   <Palletizer position={[0, 0, 0]} active={true} />
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

const COLORS = {
  robotOrange: '#ff6600',
  robotDark: '#cc5200',
  robotLight: '#ff8533',
  jointGray: '#4a5058',
  gripperSteel: '#6b7278',
  safetyYellow: '#e0a92c',
  fenceGray: '#8a9199',
  fenceMesh: '#6b7278',
  woodBrown: '#8b6f47',
  woodDark: '#6b5235',
  bagWhite: '#f5f5f0',
  bagSeam: '#d4d8dc',
  beltBlack: '#1a1a1a',
  rollerSteel: '#6b7278',
  hmiScreen: '#00d4ff',
  hmiBody: '#2a2a2a',
  eStopRed: '#ff2222',
  lightGreen: '#3fae56',
  lightYellow: '#e0a92c',
  lightRed: '#a4222c',
  concrete: '#9a9a92',
  accentCyan: '#00d4ff',
} as const;

/* ==========================================================================
   6-AXIS ROBOT ARM (Hierarchical Kinematics)
   ========================================================================== */

function RobotArm({ 
  phase, 
  phaseProgress, 
  gripperOpen, 
  bagPosition 
}: { 
  phase: string; 
  phaseProgress: number; 
  gripperOpen: boolean; 
  bagPosition: V3 | null;
}) {
  const baseRef = useRef<THREE.Group>(null!);
  const shoulderRef = useRef<THREE.Group>(null!);
  const upperArmRef = useRef<THREE.Group>(null!);
  const elbowRef = useRef<THREE.Group>(null!);
  const forearmRef = useRef<THREE.Group>(null!);
  const wristRef = useRef<THREE.Group>(null!);
  const jawLeftRef = useRef<THREE.Mesh>(null!);
  const jawRightRef = useRef<THREE.Mesh>(null!);

  // Joint angles (radians)
  const [angles, setAngles] = useState({
    base: 0,
    shoulder: -0.3,
    upperArm: 0.8,
    elbow: -1.2,
    forearm: 0.4,
    wrist: 0,
  });

  // Target angles based on phase
  const getTargetAngles = () => {
    switch (phase) {
      case 'PICK':
        return { base: 0, shoulder: -0.2, upperArm: 0.5, elbow: -0.8, forearm: 0.3, wrist: 0 };
      case 'LIFT':
        return { base: 0, shoulder: -0.5, upperArm: 0.9, elbow: -1.3, forearm: 0.4, wrist: 0 };
      case 'PLACE':
        return { base: Math.PI / 2, shoulder: -0.3, upperArm: 0.6, elbow: -1.0, forearm: 0.3, wrist: 0 };
      case 'LOWER':
        return { base: Math.PI / 2, shoulder: -0.1, upperArm: 0.4, elbow: -0.7, forearm: 0.2, wrist: 0 };
      case 'RETURN':
        return { base: 0, shoulder: -0.3, upperArm: 0.8, elbow: -1.2, forearm: 0.4, wrist: 0 };
      default:
        return { base: 0, shoulder: -0.3, upperArm: 0.8, elbow: -1.2, forearm: 0.4, wrist: 0 };
    }
  };

  useFrame((_, delta) => {
    const target = getTargetAngles();
    const speed = 2.5;
    
    const newAngles = {
      base: THREE.MathUtils.damp(angles.base, target.base, speed, delta),
      shoulder: THREE.MathUtils.damp(angles.shoulder, target.shoulder, speed, delta),
      upperArm: THREE.MathUtils.damp(angles.upperArm, target.upperArm, speed, delta),
      elbow: THREE.MathUtils.damp(angles.elbow, target.elbow, speed, delta),
      forearm: THREE.MathUtils.damp(angles.forearm, target.forearm, speed, delta),
      wrist: THREE.MathUtils.damp(angles.wrist, target.wrist, speed, delta),
    };
    setAngles(newAngles);

    // Gripper animation
    const jawOffset = gripperOpen ? 0.18 : 0.05;
    if (jawLeftRef.current) jawLeftRef.current.position.x = -jawOffset;
    if (jawRightRef.current) jawRightRef.current.position.x = jawOffset;
  });

  return (
    <group position={[0, 0.3, 0]}>
      {/* Robot Base Pedestal */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.5, 0.3, 24]} />
        <meshStandardMaterial color={COLORS.robotOrange} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.1, 24]} />
        <meshStandardMaterial color={COLORS.robotDark} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Axis 1: Base Rotation */}
      <group ref={baseRef} rotation={[0, angles.base, 0]}>
        {/* Base joint sphere */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <sphereGeometry args={[0.25, 24, 24]} />
          <meshStandardMaterial color={COLORS.jointGray} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Axis 2: Shoulder */}
        <group ref={shoulderRef} position={[0, 0.35, 0]} rotation={[angles.shoulder, 0, 0]}>
          {/* Shoulder joint */}
          <mesh castShadow>
            <sphereGeometry args={[0.2, 24, 24]} />
            <meshStandardMaterial color={COLORS.jointGray} metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Upper Arm */}
          <group ref={upperArmRef} position={[0, 0, 0]} rotation={[angles.upperArm, 0, 0]}>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.25, 1.0, 0.25]} />
              <meshStandardMaterial color={COLORS.robotOrange} metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Arm detail stripe */}
            <mesh position={[0.13, 0.5, 0]}>
              <boxGeometry args={[0.02, 0.9, 0.26]} />
              <meshStandardMaterial color={COLORS.robotDark} metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Axis 3: Elbow */}
            <group ref={elbowRef} position={[0, 1.0, 0]} rotation={[angles.elbow, 0, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[0.18, 24, 24]} />
                <meshStandardMaterial color={COLORS.jointGray} metalness={0.8} roughness={0.2} />
              </mesh>

              {/* Forearm */}
              <group ref={forearmRef} position={[0, 0, 0]} rotation={[angles.forearm, 0, 0]}>
                <mesh position={[0, 0.4, 0]} castShadow>
                  <boxGeometry args={[0.2, 0.8, 0.2]} />
                  <meshStandardMaterial color={COLORS.robotOrange} metalness={0.6} roughness={0.4} />
                </mesh>

                {/* Axis 4: Wrist */}
                <group ref={wristRef} position={[0, 0.8, 0]} rotation={[0, angles.wrist, 0]}>
                  <mesh castShadow>
                    <sphereGeometry args={[0.12, 24, 24]} />
                    <meshStandardMaterial color={COLORS.jointGray} metalness={0.8} roughness={0.2} />
                  </mesh>

                  {/* Wrist to gripper adapter */}
                  <mesh position={[0, -0.15, 0]} castShadow>
                    <cylinderGeometry args={[0.08, 0.1, 0.2, 16]} />
                    <meshStandardMaterial color={COLORS.robotDark} metalness={0.7} roughness={0.3} />
                  </mesh>

                  {/* Gripper Base */}
                  <mesh position={[0, -0.3, 0]} castShadow>
                    <boxGeometry args={[0.3, 0.15, 0.2]} />
                    <meshStandardMaterial color={COLORS.gripperSteel} metalness={0.7} roughness={0.3} />
                  </mesh>

                  {/* Left Jaw */}
                  <mesh ref={jawLeftRef} position={[-0.15, -0.45, 0]} castShadow>
                    <boxGeometry args={[0.08, 0.2, 0.15]} />
                    <meshStandardMaterial color={COLORS.gripperSteel} metalness={0.7} roughness={0.3} />
                  </mesh>
                  {/* Right Jaw */}
                  <mesh ref={jawRightRef} position={[0.15, -0.45, 0]} castShadow>
                    <boxGeometry args={[0.08, 0.2, 0.15]} />
                    <meshStandardMaterial color={COLORS.gripperSteel} metalness={0.7} roughness={0.3} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* Bag being carried (attached to gripper) */}
      {bagPosition && (
        <group position={bagPosition}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.7, 0.3]} />
            <meshStandardMaterial color={COLORS.bagWhite} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.36, 0]}>
            <boxGeometry args={[0.38, 0.02, 0.28]} />
            <meshStandardMaterial color={COLORS.bagSeam} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/* ==========================================================================
   SAFETY FENCE
   ========================================================================== */

function SafetyFence({ size }: { size: number }) {
  const fenceHeight = 2.2;
  const panelWidth = 1.0;
  const panelsPerSide = Math.floor(size / panelWidth);

  return (
    <group>
      {/* Fence Panels on all 4 sides */}
      {[-1, 1].map((sideX) =>
        Array.from({ length: panelsPerSide }, (_, i) => {
          const z = -size / 2 + panelWidth / 2 + i * panelWidth;
          // Opening on −X face for pick-conveyor infeed from metal detector
          if (sideX === -1 && Math.abs(z) < 0.55) return null;
          return (
            <group key={`x-${sideX}-${i}`} position={[sideX * size / 2, fenceHeight / 2, z]}>
              {/* Mesh panel (wireframe effect) */}
              <mesh>
                <boxGeometry args={[0.05, fenceHeight, panelWidth - 0.1]} />
                <meshStandardMaterial color={COLORS.fenceMesh} metalness={0.6} roughness={0.4} wireframe />
              </mesh>
              {/* Frame */}
              <mesh position={[0, fenceHeight / 2 - 0.05, 0]}>
                <boxGeometry args={[0.08, 0.08, panelWidth - 0.1]} />
                <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, -fenceHeight / 2 + 0.05, 0]}>
                <boxGeometry args={[0.08, 0.08, panelWidth - 0.1]} />
                <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.6} roughness={0.4} />
              </mesh>
            </group>
          );
        })
      )}
      {[-1, 1].map((sideZ) =>
        Array.from({ length: panelsPerSide }, (_, i) => {
          const x = -size / 2 + panelWidth / 2 + i * panelWidth;
          return (
            <group key={`z-${sideZ}-${i}`} position={[x, fenceHeight / 2, sideZ * size / 2]}>
              <mesh>
                <boxGeometry args={[panelWidth - 0.1, fenceHeight, 0.05]} />
                <meshStandardMaterial color={COLORS.fenceMesh} metalness={0.6} roughness={0.4} wireframe />
              </mesh>
              <mesh position={[0, fenceHeight / 2 - 0.05, 0]}>
                <boxGeometry args={[panelWidth - 0.1, 0.08, 0.08]} />
                <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position={[0, -fenceHeight / 2 + 0.05, 0]}>
                <boxGeometry args={[panelWidth - 0.1, 0.08, 0.08]} />
                <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.6} roughness={0.4} />
              </mesh>
            </group>
          );
        })
      )}

      {/* Safety Gate (one side, with opening) */}
      <group position={[0, fenceHeight / 2, size / 2]}>
        {/* Gate frame */}
        <mesh position={[-0.6, 0, 0]}>
          <boxGeometry args={[0.08, fenceHeight, 0.08]} />
          <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0.6, 0, 0]}>
          <boxGeometry args={[0.08, fenceHeight, 0.08]} />
          <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Gate mesh */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.1, fenceHeight - 0.2, 0.05]} />
          <meshStandardMaterial color={COLORS.fenceMesh} metalness={0.6} roughness={0.4} wireframe />
        </mesh>
        {/* Interlock switch */}
        <mesh position={[0.65, 0.5, 0.05]}>
          <boxGeometry args={[0.08, 0.12, 0.06]} />
          <meshStandardMaterial color={COLORS.jointGray} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/* ==========================================================================
   WOODEN PALLET
   ========================================================================== */

function WoodenPallet({ position, hasBags, bagCount }: { position: V3; hasBags: boolean; bagCount: number }) {
  const palletWidth = 1.2;
  const palletDepth = 1.0;
  const palletHeight = 0.15;
  const layers = Math.floor(bagCount / 8);
  const bagsInLayer = bagCount % 8;

  return (
    <group position={position}>
      {/* Pallet Base */}
      <mesh position={[0, palletHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[palletWidth, palletHeight, palletDepth]} />
        <meshStandardMaterial color={COLORS.woodBrown} roughness={0.9} metalness={0} />
      </mesh>
      {/* Pallet Slats (top) */}
      {[-0.4, -0.13, 0.13, 0.4].map((x, i) => (
        <mesh key={i} position={[x, palletHeight + 0.02, 0]} castShadow>
          <boxGeometry args={[0.12, 0.04, palletDepth - 0.1]} />
          <meshStandardMaterial color={COLORS.woodDark} roughness={0.9} metalness={0} />
        </mesh>
      ))}
      {/* Pallet Blocks (bottom support) */}
      {[
        [-0.45, 0, -0.35], [0, 0, -0.35], [0.45, 0, -0.35],
        [-0.45, 0, 0], [0, 0, 0], [0.45, 0, 0],
        [-0.45, 0, 0.35], [0, 0, 0.35], [0.45, 0, 0.35],
      ].map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.15, 0.1, 0.15]} />
          <meshStandardMaterial color={COLORS.woodDark} roughness={0.9} metalness={0} />
        </mesh>
      ))}

      {/* Stacked Bags */}
      {Array.from({ length: layers }, (_, layerIdx) => {
        const isAlternating = layerIdx % 2 === 1;
        return Array.from({ length: 8 }, (_, bagIdx) => {
          const row = Math.floor(bagIdx / 4);
          const col = bagIdx % 4;
          const x = isAlternating 
            ? (col - 1.5) * 0.32 
            : (col - 1.5) * 0.25;
          const z = isAlternating 
            ? (row - 0.5) * 0.25 
            : (row - 0.5) * 0.32;
          const y = palletHeight + 0.04 + layerIdx * 0.7 + 0.35;
          const rotY = isAlternating ? Math.PI / 2 : 0;
          return (
            <mesh key={`${layerIdx}-${bagIdx}`} position={[x, y, z]} rotation={[0, rotY, 0]} castShadow>
              <boxGeometry args={[0.4, 0.7, 0.3]} />
              <meshStandardMaterial color={COLORS.bagWhite} roughness={0.9} />
            </mesh>
          );
        });
      })}

      {/* Partial layer bags */}
      {Array.from({ length: bagsInLayer }, (_, idx) => {
        const row = Math.floor(idx / 4);
        const col = idx % 4;
        const isAlternating = layers % 2 === 1;
        const x = isAlternating 
          ? (col - 1.5) * 0.32 
          : (col - 1.5) * 0.25;
        const z = isAlternating 
          ? (row - 0.5) * 0.25 
          : (row - 0.5) * 0.32;
        const y = palletHeight + 0.04 + layers * 0.7 + 0.35;
        const rotY = isAlternating ? Math.PI / 2 : 0;
        return (
          <mesh key={`partial-${idx}`} position={[x, y, z]} rotation={[0, rotY, 0]} castShadow>
            <boxGeometry args={[0.4, 0.7, 0.3]} />
            <meshStandardMaterial color={COLORS.bagWhite} roughness={0.9} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   PICK CONVEYOR (Infeed)
   ========================================================================== */

function PickConveyor({ position, height = 0.85 }: { position: V3; height?: number }) {
  return (
    <group position={position}>
      {[
        [-0.6, height / 2, -0.28],
        [0.6, height / 2, -0.28],
        [-0.6, height / 2, 0.28],
        [0.6, height / 2, 0.28],
      ].map((pos, i) => (
        <mesh key={i} position={pos as V3}>
          <boxGeometry args={[0.08, height, 0.08]} />
          <meshStandardMaterial color={COLORS.rollerSteel} metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, height, 0]} castShadow>
        <boxGeometry args={[1.5, 0.12, 0.8]} />
        <meshStandardMaterial color={COLORS.rollerSteel} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, height + 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.05, 0.7]} />
        <meshStandardMaterial color={COLORS.beltBlack} roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   HMI PANEL & TOWER LIGHT
   ========================================================================== */

function HMIPanel({ position, layerCount, bagCount, palletComplete }: { 
  position: V3; layerCount: number; bagCount: number; palletComplete: boolean; 
}) {
  return (
    <group position={position}>
      {/* Panel Body */}
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.7, 0.2]} />
        <meshStandardMaterial color={COLORS.hmiBody} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.15, 0.11]}>
        <boxGeometry args={[0.4, 0.35, 0.02]} />
        <meshStandardMaterial color={COLORS.hmiScreen} emissive={COLORS.hmiScreen} emissiveIntensity={0.5} />
      </mesh>
      {/* Screen Content */}
      <Text position={[0, 0.2, 0.12]} fontSize={0.04} color="#000000" anchorX="center" anchorY="middle" fontWeight="bold">
        LAYER: {layerCount}
      </Text>
      <Text position={[0, 0.1, 0.12]} fontSize={0.035} color="#000000" anchorX="center" anchorY="middle">
        BAG: {bagCount}
      </Text>
      {/* Buttons */}
      <mesh position={[-0.12, -0.15, 0.11]}>
        <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
        <meshStandardMaterial color={COLORS.lightGreen} />
      </mesh>
      <mesh position={[0, -0.15, 0.11]}>
        <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
        <meshStandardMaterial color={COLORS.lightRed} />
      </mesh>
      {/* Emergency Stop */}
      <mesh position={[0.12, -0.15, 0.12]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        <meshStandardMaterial color={COLORS.eStopRed} />
      </mesh>
      <mesh position={[0.12, -0.15, 0.14]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        <meshStandardMaterial color={COLORS.eStopRed} />
      </mesh>
    </group>
  );
}

function TowerLight({ position, status }: { position: V3; status: 'idle' | 'running' | 'alarm' }) {
  const greenRef = useRef<THREE.Mesh>(null!);
  const yellowRef = useRef<THREE.Mesh>(null!);
  const redRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const pulse = Math.sin(clock.elapsedTime * 8) > 0;
    if (greenRef.current) {
      (greenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 
        (status === 'running' && pulse) ? 1.5 : 0.1;
    }
    if (yellowRef.current) {
      (yellowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 
        (status === 'idle' && pulse) ? 1.5 : 0.1;
    }
    if (redRef.current) {
      (redRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 
        (status === 'alarm' && pulse) ? 1.5 : 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh><cylinderGeometry args={[0.03, 0.03, 0.5, 16]} /><meshStandardMaterial color={COLORS.jointGray} /></mesh>
      <mesh ref={greenRef} position={[0, 0.15, 0]}><cylinderGeometry args={[0.06, 0.06, 0.1, 16]} /><meshStandardMaterial color={COLORS.lightGreen} emissive={COLORS.lightGreen} emissiveIntensity={0.1} /></mesh>
      <mesh ref={yellowRef} position={[0, 0.02, 0]}><cylinderGeometry args={[0.06, 0.06, 0.1, 16]} /><meshStandardMaterial color={COLORS.lightYellow} emissive={COLORS.lightYellow} emissiveIntensity={0.1} /></mesh>
      <mesh ref={redRef} position={[0, -0.11, 0]}><cylinderGeometry args={[0.06, 0.06, 0.1, 16]} /><meshStandardMaterial color={COLORS.lightRed} emissive={COLORS.lightRed} emissiveIntensity={0.1} /></mesh>
    </group>
  );
}

/* ==========================================================================
   PLC DATA PANEL
   ========================================================================== */

function DataPanel({ position, active, layerCount, bagCount, palletComplete }: { 
  position: V3; active: boolean; layerCount: number; bagCount: number; palletComplete: boolean; 
}) {
  const lines = [
    { text: `ROBOTIC PALLETIZER`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ${active ? 'AUTO' : 'STOPPED'}`, size: 0.13, color: active ? COLORS.lightGreen : COLORS.lightRed },
    { text: `Robot Speed: ${active ? '85' : '0'}%`, size: 0.13, color: '#3a3a3a' },
    { text: `Current Layer: ${layerCount}`, size: 0.13, color: '#3a3a3a' },
    { text: `Current Bag: ${bagCount}`, size: 0.13, color: '#3a3a3a' },
    { text: `Pallet Complete: ${palletComplete ? 'YES' : 'NO'}`, size: 0.13, color: palletComplete ? COLORS.lightGreen : '#3a3a3a' },
    { text: `Bags on Pallet: ${layerCount * 8 + bagCount}`, size: 0.13, color: '#3a3a3a' },
    { text: `Alarm: OFF`, size: 0.13, color: COLORS.lightGreen },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.45, -0.02]}><planeGeometry args={[2.2, 2.0]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -0.45, -0.015]}><planeGeometry args={[2.24, 2.04]} /><meshStandardMaterial color={COLORS.safetyYellow} transparent opacity={0.4} side={THREE.DoubleSide} /></mesh>
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
   MAIN PALLETIZER COMPONENT
   ========================================================================== */

export interface PalletizerProps {
  position?: V3;
  cellSize?: number;
  height?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function PalletizerComponent({
  position = [0, 0, 0],
  cellSize = 5,
  height = 0.85,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
}: PalletizerProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [phase, setPhase] = useState<'IDLE' | 'PICK' | 'LIFT' | 'PLACE' | 'LOWER' | 'RETURN'>('IDLE');
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [gripperOpen, setGripperOpen] = useState(true);
  const [bagOnGripper, setBagOnGripper] = useState<V3 | null>(null);
  const [layerCount, setLayerCount] = useState(2);
  const [bagCount, setBagCount] = useState(3);
  const [palletComplete, setPalletComplete] = useState(false);
  
  const active = controlledActive !== undefined ? controlledActive : internalActive;
  const pickY = height + 0.35;

  useFrame((_, delta) => {
    if (!active) return;

    setPhaseProgress(prev => prev + delta);

    switch (phase) {
      case 'IDLE':
        if (phaseProgress > 0.5) {
          setPhase('PICK');
          setPhaseProgress(0);
          setGripperOpen(true);
          setBagOnGripper(null);
        }
        break;
      case 'PICK':
        if (phaseProgress > 1.5) {
          setGripperOpen(false);
          setBagOnGripper([-1.5, pickY, 0]);
          setPhase('LIFT');
          setPhaseProgress(0);
        }
        break;
      case 'LIFT':
        if (phaseProgress > 1.2) {
          setPhase('PLACE');
          setPhaseProgress(0);
        }
        break;
      case 'PLACE':
        if (phaseProgress > 1.5) {
          setPhase('LOWER');
          setPhaseProgress(0);
        }
        break;
      case 'LOWER':
        if (phaseProgress > 1.0) {
          setGripperOpen(true);
          setBagOnGripper(null);
          setBagCount(prev => {
            const newCount = prev + 1;
            if (newCount >= 8) {
              setLayerCount(l => {
                const next = l + 1;
                if (next >= 8) setPalletComplete(true);
                return next;
              });
              return 0;
            }
            return newCount;
          });
          setPhase('RETURN');
          setPhaseProgress(0);
        }
        break;
      case 'RETURN':
        if (phaseProgress > 1.5) {
          if (palletComplete) {
            setLayerCount(0);
            setBagCount(0);
            setPalletComplete(false);
          }
          setPhase('IDLE');
          setPhaseProgress(0);
        }
        break;
    }
  });

  return (
    <group position={position}>
      <SafetyFence size={cellSize} />

      <PickConveyor position={[-1.5, 0, 0]} height={height} />

      <RobotArm 
        phase={phase} 
        phaseProgress={phaseProgress} 
        gripperOpen={gripperOpen}
        bagPosition={bagOnGripper}
      />

      <WoodenPallet position={[1.2, 0, 0.5]} hasBags={layerCount > 0 || bagCount > 0} bagCount={layerCount * 8 + bagCount} />
      <WoodenPallet position={[1.2, 0, -1.5]} hasBags={true} bagCount={40} />

      <HMIPanel 
        position={[-cellSize / 2 + 0.3, 1.2, 0]} 
        layerCount={layerCount} 
        bagCount={bagCount}
        palletComplete={palletComplete}
      />

      <TowerLight position={[-cellSize / 2 + 0.3, 2.0, 0]} status={active ? 'running' : 'idle'} />

      {showDataPanel && (
        <DataPanel 
          position={[cellSize / 2 + 1.5, 2, 0]} 
          active={active} 
          layerCount={layerCount}
          bagCount={bagCount}
          palletComplete={palletComplete}
        />
      )}

      <mesh
        position={[0, 1.5, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setInternalActive(!internalActive);
        }}
        visible={false}
      >
        <boxGeometry args={[cellSize, 3, cellSize]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {showClickText && (
        <Text position={[0, 2.8, 0]} fontSize={0.12} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
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
      <directionalLight position={[10, 15, 10]} intensity={1.4} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-far={40} />
    </>
  );
}

export function PalletizerScene() {
  return (
    <Canvas shadows camera={{ position: [8, 6, 8], fov: 35 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <PalletizerComponent active />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={5} maxDistance={20} maxPolarAngle={Math.PI / 2.05} target={[0, 1.5, 0]} />
    </Canvas>
  );
}

export function Palletizer() { return <PalletizerScene />; }
export default Palletizer;