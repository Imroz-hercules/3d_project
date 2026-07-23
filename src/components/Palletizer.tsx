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
import {
  matConcrete,
  matPaintOrange,
  matRailYellow,
  matRubber,
  matSteel,
  matSteelDark,
  matStructureSteel,
} from '../materials';

type V3 = [number, number, number];

const COLORS = {
  fenceMesh: '#6b7278',
  woodBrown: '#8b6f47',
  woodDark: '#6b5235',
  bagWhite: '#f5f5f0',
  bagSeam: '#d4d8dc',
  wrapClear: '#c8d0d8',
  floorMark: '#e0a92c',
  hmiScreen: '#00d4ff',
  hmiBody: '#2a2a2a',
  eStopRed: '#ff2222',
  lightGreen: '#3fae56',
  lightYellow: '#e0a92c',
  lightRed: '#a4222c',
  accentCyan: '#00d4ff',
  safetyYellow: '#e0a92c',
} as const;

/* ==========================================================================
   6-AXIS ROBOT ARM (Hierarchical Kinematics)
   ========================================================================== */

function RobotArm({ 
  phase, 
  phaseProgress, 
  gripperOpen, 
  bagPosition,
  active = true,
}: { 
  phase: string; 
  phaseProgress: number; 
  gripperOpen: boolean; 
  bagPosition: V3 | null;
  active?: boolean;
}) {
  const baseRef = useRef<THREE.Group>(null!);
  const shoulderRef = useRef<THREE.Group>(null!);
  const upperArmRef = useRef<THREE.Group>(null!);
  const elbowRef = useRef<THREE.Group>(null!);
  const forearmRef = useRef<THREE.Group>(null!);
  const wristRef = useRef<THREE.Group>(null!);
  const jawLeftRef = useRef<THREE.Mesh>(null!);
  const jawRightRef = useRef<THREE.Mesh>(null!);

  // Mutate in useFrame — avoid setState every frame (major FPS killer)
  const angles = useRef({
    base: 0,
    shoulder: -0.3,
    upperArm: 0.8,
    elbow: -1.2,
    forearm: 0.4,
    wrist: 0,
  });

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
    if (!active) return;
    const a = angles.current;
    const target = getTargetAngles();
    const speed = 2.5;

    a.base = THREE.MathUtils.damp(a.base, target.base, speed, delta);
    a.shoulder = THREE.MathUtils.damp(a.shoulder, target.shoulder, speed, delta);
    a.upperArm = THREE.MathUtils.damp(a.upperArm, target.upperArm, speed, delta);
    a.elbow = THREE.MathUtils.damp(a.elbow, target.elbow, speed, delta);
    a.forearm = THREE.MathUtils.damp(a.forearm, target.forearm, speed, delta);
    a.wrist = THREE.MathUtils.damp(a.wrist, target.wrist, speed, delta);

    if (baseRef.current) baseRef.current.rotation.y = a.base;
    if (shoulderRef.current) shoulderRef.current.rotation.x = a.shoulder;
    if (upperArmRef.current) upperArmRef.current.rotation.x = a.upperArm;
    if (elbowRef.current) elbowRef.current.rotation.x = a.elbow;
    if (forearmRef.current) forearmRef.current.rotation.x = a.forearm;
    if (wristRef.current) wristRef.current.rotation.y = a.wrist;

    const jawOffset = gripperOpen ? 0.18 : 0.05;
    if (jawLeftRef.current) jawLeftRef.current.position.x = -jawOffset;
    if (jawRightRef.current) jawRightRef.current.position.x = jawOffset;
  });

  return (
    <group position={[0, 0.3, 0]}>
      {/* Robot Base Pedestal */}
      <mesh castShadow={false} receiveShadow={false} dispose={null} material={matPaintOrange}>
        <cylinderGeometry args={[0.4, 0.5, 0.3, 16]} />
      </mesh>
      <mesh position={[0, 0.15, 0]} dispose={null} material={matSteelDark}>
        <cylinderGeometry args={[0.35, 0.4, 0.1, 16]} />
      </mesh>

      {/* Axis 1: Base Rotation */}
      <group ref={baseRef}>
        <mesh position={[0, 0.35, 0]} castShadow={false} dispose={null} material={matSteelDark}>
          <sphereGeometry args={[0.25, 16, 16]} />
        </mesh>

        <group ref={shoulderRef} position={[0, 0.35, 0]} rotation={[-0.3, 0, 0]}>
          <mesh castShadow={false} dispose={null} material={matSteelDark}>
            <sphereGeometry args={[0.2, 16, 16]} />
          </mesh>
          
          <group ref={upperArmRef} position={[0, 0, 0]} rotation={[0.8, 0, 0]}>
            <mesh position={[0, 0.5, 0]} castShadow={false} dispose={null} material={matPaintOrange}>
              <boxGeometry args={[0.25, 1.0, 0.25]} />
            </mesh>
            <mesh position={[0.13, 0.5, 0]} dispose={null} material={matSteelDark}>
              <boxGeometry args={[0.02, 0.9, 0.26]} />
            </mesh>

            <group ref={elbowRef} position={[0, 1.0, 0]} rotation={[-1.2, 0, 0]}>
              <mesh castShadow={false} dispose={null} material={matSteelDark}>
                <sphereGeometry args={[0.18, 16, 16]} />
              </mesh>

              <group ref={forearmRef} position={[0, 0, 0]} rotation={[0.4, 0, 0]}>
                <mesh position={[0, 0.4, 0]} castShadow={false} dispose={null} material={matPaintOrange}>
                  <boxGeometry args={[0.2, 0.8, 0.2]} />
                </mesh>

                <group ref={wristRef} position={[0, 0.8, 0]}>
                  <mesh castShadow={false} dispose={null} material={matSteelDark}>
                    <sphereGeometry args={[0.12, 12, 12]} />
                  </mesh>

                  <mesh position={[0, -0.15, 0]} castShadow={false} dispose={null} material={matSteelDark}>
                    <cylinderGeometry args={[0.08, 0.1, 0.2, 12]} />
                  </mesh>

                  <mesh position={[0, -0.3, 0]} castShadow={false} dispose={null} material={matSteel}>
                    <boxGeometry args={[0.3, 0.15, 0.2]} />
                  </mesh>

                  <mesh ref={jawLeftRef} position={[-0.15, -0.45, 0]} castShadow={false} dispose={null} material={matSteel}>
                    <boxGeometry args={[0.08, 0.2, 0.15]} />
                  </mesh>
                  <mesh ref={jawRightRef} position={[0.15, -0.45, 0]} castShadow={false} dispose={null} material={matSteel}>
                    <boxGeometry args={[0.08, 0.2, 0.15]} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>

      {bagPosition && (
        <group position={bagPosition}>
          <mesh castShadow={false}>
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
          // Opening on −X for pick conveyor; opening on +X for pallet outfeed
          if (sideX === -1 && Math.abs(z) < 0.55) return null;
          if (sideX === 1 && z > 0.4 && z < 1.6) return null;
          return (
            <group key={`x-${sideX}-${i}`} position={[sideX * size / 2, fenceHeight / 2, z]}>
              {/* Mesh panel (wireframe effect) */}
              <mesh>
                <boxGeometry args={[0.05, fenceHeight, panelWidth - 0.1]} />
                <meshStandardMaterial color={COLORS.fenceMesh} metalness={0.6} roughness={0.4} wireframe />
              </mesh>
              {/* Frame */}
              <mesh position={[0, fenceHeight / 2 - 0.05, 0]} dispose={null} material={matRailYellow}>
                <boxGeometry args={[0.08, 0.08, panelWidth - 0.1]} />
              </mesh>
              <mesh position={[0, -fenceHeight / 2 + 0.05, 0]} dispose={null} material={matRailYellow}>
                <boxGeometry args={[0.08, 0.08, panelWidth - 0.1]} />
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
              <mesh position={[0, fenceHeight / 2 - 0.05, 0]} dispose={null} material={matRailYellow}>
                <boxGeometry args={[panelWidth - 0.1, 0.08, 0.08]} />
              </mesh>
              <mesh position={[0, -fenceHeight / 2 + 0.05, 0]} dispose={null} material={matRailYellow}>
                <boxGeometry args={[panelWidth - 0.1, 0.08, 0.08]} />
              </mesh>
            </group>
          );
        })
      )}

      {/* Safety Gate (one side, with opening) */}
      <group position={[0, fenceHeight / 2, size / 2]}>
        {/* Gate frame */}
        <mesh position={[-0.6, 0, 0]} dispose={null} material={matRailYellow}>
          <boxGeometry args={[0.08, fenceHeight, 0.08]} />
        </mesh>
        <mesh position={[0.6, 0, 0]} dispose={null} material={matRailYellow}>
          <boxGeometry args={[0.08, fenceHeight, 0.08]} />
        </mesh>
        {/* Gate mesh */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.1, fenceHeight - 0.2, 0.05]} />
          <meshStandardMaterial color={COLORS.fenceMesh} metalness={0.6} roughness={0.4} wireframe />
        </mesh>
        {/* Interlock switch */}
        <mesh position={[0.65, 0.5, 0.05]} dispose={null} material={matSteelDark}>
          <boxGeometry args={[0.08, 0.12, 0.06]} />
        </mesh>
      </group>
    </group>
  );
}

/* ==========================================================================
   WOODEN PALLET
   ========================================================================== */

function WoodenPallet({
  position,
  hasBags,
  bagCount,
  wrapped = false,
}: {
  position: V3;
  hasBags: boolean;
  bagCount: number;
  wrapped?: boolean;
}) {
  const palletWidth = 1.2;
  const palletDepth = 1.0;
  const palletHeight = 0.15;
  const layers = Math.floor(bagCount / 8);
  const bagsInLayer = bagCount % 8;
  const stackH = hasBags ? palletHeight + 0.04 + Math.max(layers, bagsInLayer > 0 ? layers + 1 : layers) * 0.7 : palletHeight;

  return (
    <group position={position}>
      <mesh position={[0, palletHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[palletWidth, palletHeight, palletDepth]} />
        <meshStandardMaterial color={COLORS.woodBrown} roughness={0.9} metalness={0} />
      </mesh>
      {[-0.4, -0.13, 0.13, 0.4].map((x, i) => (
        <mesh key={i} position={[x, palletHeight + 0.02, 0]} castShadow>
          <boxGeometry args={[0.12, 0.04, palletDepth - 0.1]} />
          <meshStandardMaterial color={COLORS.woodDark} roughness={0.9} metalness={0} />
        </mesh>
      ))}
      {[
        [-0.45, 0, -0.35], [0, 0, -0.35], [0.45, 0, -0.35],
        [-0.45, 0, 0], [0, 0, 0], [0.45, 0, 0],
        [-0.45, 0, 0.35], [0, 0, 0.35], [0.45, 0, 0.35],
      ].map((pos, i) => (
        <mesh key={i} position={pos as V3}>
          <boxGeometry args={[0.15, 0.1, 0.15]} />
          <meshStandardMaterial color={COLORS.woodDark} roughness={0.9} metalness={0} />
        </mesh>
      ))}

      {hasBags &&
        Array.from({ length: layers }, (_, layerIdx) => {
          const isAlternating = layerIdx % 2 === 1;
          return Array.from({ length: 8 }, (_, bagIdx) => {
            const row = Math.floor(bagIdx / 4);
            const col = bagIdx % 4;
            const x = isAlternating ? (col - 1.5) * 0.32 : (col - 1.5) * 0.25;
            const z = isAlternating ? (row - 0.5) * 0.25 : (row - 0.5) * 0.32;
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

      {hasBags &&
        Array.from({ length: bagsInLayer }, (_, idx) => {
          const row = Math.floor(idx / 4);
          const col = idx % 4;
          const isAlternating = layers % 2 === 1;
          const x = isAlternating ? (col - 1.5) * 0.32 : (col - 1.5) * 0.25;
          const z = isAlternating ? (row - 0.5) * 0.25 : (row - 0.5) * 0.32;
          const y = palletHeight + 0.04 + layers * 0.7 + 0.35;
          const rotY = isAlternating ? Math.PI / 2 : 0;
          return (
            <mesh key={`partial-${idx}`} position={[x, y, z]} rotation={[0, rotY, 0]} castShadow>
              <boxGeometry args={[0.4, 0.7, 0.3]} />
              <meshStandardMaterial color={COLORS.bagWhite} roughness={0.9} />
            </mesh>
          );
        })}

      {wrapped && hasBags && (
        <mesh position={[0, stackH / 2 + 0.1, 0]}>
          <boxGeometry args={[palletWidth + 0.08, Math.max(stackH - 0.05, 0.8), palletDepth + 0.08]} />
          <meshStandardMaterial
            color={COLORS.wrapClear}
            transparent
            opacity={0.28}
            metalness={0.15}
            roughness={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

/* ==========================================================================
   EMPTY PALLET MAGAZINE
   ========================================================================== */

function EmptyPalletMagazine({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {/* Magazine frame */}
      {[
        [-0.7, 0.6, -0.55],
        [0.7, 0.6, -0.55],
        [-0.7, 0.6, 0.55],
        [0.7, 0.6, 0.55],
      ].map((pos, i) => (
        <mesh key={i} position={pos as V3} castShadow dispose={null} material={matStructureSteel}>
          <boxGeometry args={[0.08, 1.2, 0.08]} />
        </mesh>
      ))}
      <mesh position={[0, 1.15, 0]} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[1.5, 0.08, 1.2]} />
      </mesh>
      {/* Stacked empty pallets waiting */}
      {[0, 0.18, 0.36, 0.54].map((y, i) => (
        <WoodenPallet key={i} position={[0, y, 0]} hasBags={false} bagCount={0} />
      ))}
      <Text position={[0, 1.45, 0]} fontSize={0.08} color={COLORS.safetyYellow} anchorX="center" anchorY="middle">
        EMPTY MAGAZINE
      </Text>
    </group>
  );
}

/* ==========================================================================
   PALLET OUTFEED CONVEYOR
   ========================================================================== */

function PalletOutfeedConveyor({ position, active = true }: { position: V3; active?: boolean }) {
  const length = 2.8;
  const rollersRef = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (!rollersRef.current || !active) return;
    rollersRef.current.children.forEach((child) => {
      child.rotation.x += delta * 2.5;
    });
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow dispose={null} material={matStructureSteel}>
        <boxGeometry args={[length, 0.12, 1.35]} />
      </mesh>
      <group ref={rollersRef}>
        {Array.from({ length: 7 }, (_, i) => {
          const x = -length / 2 + 0.25 + i * 0.4;
          return (
            <mesh key={i} position={[x, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteel}>
              <cylinderGeometry args={[0.06, 0.06, 1.2, 12]} />
            </mesh>
          );
        })}
      </group>
      {[
        [-length / 2 + 0.15, 0.2, 0.6],
        [length / 2 - 0.15, 0.2, 0.6],
        [-length / 2 + 0.15, 0.2, -0.6],
        [length / 2 - 0.15, 0.2, -0.6],
      ].map((pos, i) => (
        <mesh key={i} position={pos as V3} dispose={null} material={matStructureSteel}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
        </mesh>
      ))}
    </group>
  );
}

/** Wrapped pallet slides along outfeed toward forklift bay when complete. */
function AnimatedOutfeedPallet({
  start,
  end,
  active,
  palletComplete,
}: {
  start: V3;
  end: V3;
  active: boolean;
  palletComplete: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (palletComplete && active) {
      progress.current = Math.min(1, progress.current + delta * 0.22);
    } else if (!palletComplete) {
      progress.current = Math.max(0, progress.current - delta * 0.5);
    }
    const t = progress.current;
    groupRef.current.position.set(
      start[0] + (end[0] - start[0]) * t,
      start[1],
      start[2] + (end[2] - start[2]) * t
    );
  });

  return (
    <group ref={groupRef} position={start}>
      <WoodenPallet position={[0, 0, 0]} hasBags bagCount={64} wrapped />
    </group>
  );
}

/* ==========================================================================
   FORKLIFT LOADING BAY
   ========================================================================== */

function ForkliftLoadingBay({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {/* Floor marking rectangle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[3.2, 2.4]} />
        <meshStandardMaterial color="#6a6a62" roughness={0.95} />
      </mesh>
      {/* Yellow perimeter stripes */}
      {[
        [0, 0.015, 1.15],
        [0, 0.015, -1.15],
        [1.55, 0.015, 0],
        [-1.55, 0.015, 0],
      ].map((pos, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, i < 2 ? 0 : Math.PI / 2]} position={pos as V3}>
          <planeGeometry args={[i < 2 ? 3.2 : 2.4, 0.12]} />
          <meshStandardMaterial color={COLORS.floorMark} roughness={0.8} />
        </mesh>
      ))}

      <Text position={[0.7, 0.05, 1.35]} fontSize={0.1} color={COLORS.floorMark} anchorX="center" anchorY="middle">
        FORKLIFT ZONE
      </Text>
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
        <mesh key={i} position={pos as V3} dispose={null} material={matSteel}>
          <boxGeometry args={[0.08, height, 0.08]} />
        </mesh>
      ))}
      <mesh position={[0, height, 0]} castShadow dispose={null} material={matSteel}>
        <boxGeometry args={[1.5, 0.12, 0.8]} />
      </mesh>
      <mesh position={[0, height + 0.1, 0]} castShadow receiveShadow dispose={null} material={matRubber}>
        <boxGeometry args={[1.4, 0.05, 0.7]} />
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
    if (status === 'idle') return;
    const pulse = Math.sin(clock.elapsedTime * 8) > 0;
    if (greenRef.current) {
      (greenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 
        (status === 'running' && pulse) ? 1.5 : 0.1;
    }
    if (yellowRef.current) {
      (yellowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
    }
    if (redRef.current) {
      (redRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 
        (status === 'alarm' && pulse) ? 1.5 : 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh><cylinderGeometry args={[0.03, 0.03, 0.5, 16]} /><meshStandardMaterial color={COLORS.hmiBody} /></mesh>
      <mesh ref={greenRef} position={[0, 0.15, 0]}><cylinderGeometry args={[0.06, 0.06, 0.1, 16]} /><meshStandardMaterial color={COLORS.lightGreen} emissive={COLORS.lightGreen} emissiveIntensity={0.1} /></mesh>
      <mesh ref={yellowRef} position={[0, 0.02, 0]}><cylinderGeometry args={[0.06, 0.06, 0.1, 16]} /><meshStandardMaterial color={COLORS.lightYellow} emissive={COLORS.lightYellow} emissiveIntensity={0.1} /></mesh>
      <mesh ref={redRef} position={[0, -0.11, 0]}><cylinderGeometry args={[0.06, 0.06, 0.1, 16]} /><meshStandardMaterial color={COLORS.lightRed} emissive={COLORS.lightRed} emissiveIntensity={0.1} /></mesh>
    </group>
  );
}

/* ==========================================================================
   PLC DATA PANEL
   ========================================================================== */

function DataPanel({
  position,
  active,
  layerCount,
  bagCount,
  palletComplete,
  completedBags,
  palletNumber,
}: {
  position: V3;
  active: boolean;
  layerCount: number;
  bagCount: number;
  palletComplete: boolean;
  completedBags: number;
  palletNumber: number;
}) {
  const lines = [
    { text: `ROBOTIC PALLETIZER`, size: 0.15, color: '#1c1c1c', bold: true },
    { text: `Status: ${active ? 'AUTO' : 'STOPPED'}`, size: 0.12, color: active ? COLORS.lightGreen : COLORS.lightRed },
    { text: `Robot Speed: ${active ? '90' : '0'}%`, size: 0.12, color: '#3a3a3a' },
    { text: `Current Layer: ${layerCount}`, size: 0.12, color: '#3a3a3a' },
    { text: `Current Bag: ${bagCount}`, size: 0.12, color: '#3a3a3a' },
    { text: `Completed Bags: ${completedBags}`, size: 0.12, color: '#3a3a3a' },
    { text: `Pallet Number: ${palletNumber}`, size: 0.12, color: '#3a3a3a' },
    { text: `Pallet Complete: ${palletComplete ? 'YES' : 'NO'}`, size: 0.12, color: palletComplete ? COLORS.lightGreen : '#3a3a3a' },
    { text: `Alarm: OFF`, size: 0.12, color: COLORS.lightGreen },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.55, -0.02]}>
          <planeGeometry args={[2.3, 2.3]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.55, -0.015]}>
          <planeGeometry args={[2.34, 2.34]} />
          <meshStandardMaterial color={COLORS.safetyYellow} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {lines.map((line, i) => (
          <Text key={i} position={[-1.05, 0.35 - i * 0.2, 0]} fontSize={line.size} color={line.color} anchorX="left" anchorY="top" fontWeight={line.bold ? 'bold' : 'normal'}>
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
  const [gripperOpen, setGripperOpen] = useState(true);
  const [bagOnGripper, setBagOnGripper] = useState<V3 | null>(null);
  const [layerCount, setLayerCount] = useState(2);
  const [bagCount, setBagCount] = useState(3);
  const [palletComplete, setPalletComplete] = useState(false);
  const [completedBags, setCompletedBags] = useState(4800);
  const [palletNumber, setPalletNumber] = useState(154);
  const phaseRef = useRef(phase);
  const progressRef = useRef(0);
  const palletCompleteRef = useRef(palletComplete);
  phaseRef.current = phase;
  palletCompleteRef.current = palletComplete;
  
  const active = controlledActive !== undefined ? controlledActive : internalActive;
  const pickY = height + 0.35;

  useFrame((_, delta) => {
    if (!active) return;

    progressRef.current += delta;
    const t = progressRef.current;
    const current = phaseRef.current;

    const advance = (next: typeof phase) => {
      progressRef.current = 0;
      phaseRef.current = next;
      setPhase(next);
    };

    switch (current) {
      case 'IDLE':
        if (t > 0.5) {
          setGripperOpen(true);
          setBagOnGripper(null);
          advance('PICK');
        }
        break;
      case 'PICK':
        if (t > 1.5) {
          setGripperOpen(false);
          setBagOnGripper([-1.5, pickY, 0]);
          advance('LIFT');
        }
        break;
      case 'LIFT':
        if (t > 1.2) advance('PLACE');
        break;
      case 'PLACE':
        if (t > 1.5) advance('LOWER');
        break;
      case 'LOWER':
        if (t > 1.0) {
          setGripperOpen(true);
          setBagOnGripper(null);
          setCompletedBags((n) => n + 1);
          setBagCount((prev) => {
            const newCount = prev + 1;
            if (newCount >= 8) {
              setLayerCount((l) => {
                const next = l + 1;
                if (next >= 8) setPalletComplete(true);
                return next;
              });
              return 0;
            }
            return newCount;
          });
          advance('RETURN');
        }
        break;
      case 'RETURN':
        if (t > 1.5) {
          if (palletCompleteRef.current) {
            setLayerCount(0);
            setBagCount(0);
            setPalletComplete(false);
            setPalletNumber((n) => n + 1);
          }
          advance('IDLE');
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
        phaseProgress={0} 
        gripperOpen={gripperOpen}
        bagPosition={bagOnGripper}
        active={active}
      />

      {/* Empty pallet magazine (waiting) */}
      <EmptyPalletMagazine position={[1.2, 0, -1.8]} />

      {/* Active pallet being stacked */}
      <WoodenPallet
        position={[1.2, 0, 0.35]}
        hasBags={layerCount > 0 || bagCount > 0}
        bagCount={layerCount * 8 + bagCount}
      />

      {/* Pallet outfeed → forklift bay */}
      <PalletOutfeedConveyor position={[cellSize / 2 + 0.9, 0, 0.9]} active={active} />

      {/* Completed stretch-wrapped pallet slides to bay when cycle completes */}
      <AnimatedOutfeedPallet
        start={[cellSize / 2 + 0.4, 0.24, 0.9]}
        end={[cellSize / 2 + 3.2, 0.24, 0.9]}
        active={active}
        palletComplete={palletComplete}
      />

      {/* Forklift loading area outside the cell */}
      <ForkliftLoadingBay position={[cellSize / 2 + 3.6, 0, 0.9]} />

      <HMIPanel 
        position={[-cellSize / 2 + 0.3, 1.2, 0]} 
        layerCount={layerCount} 
        bagCount={bagCount}
        palletComplete={palletComplete}
      />

      <TowerLight position={[-cellSize / 2 + 0.3, 2.0, 0]} status={active ? 'running' : 'idle'} />

      {showDataPanel && (
        <DataPanel 
          position={[cellSize / 2 + 1.8, 2.4, -1.8]} 
          active={active} 
          layerCount={layerCount}
          bagCount={bagCount}
          palletComplete={palletComplete}
          completedBags={completedBags}
          palletNumber={palletNumber}
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
        <boxGeometry args={[cellSize + 4, 3, cellSize + 2]} />
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]} dispose={null} material={matConcrete}>
        <circleGeometry args={[40, 64]} />
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