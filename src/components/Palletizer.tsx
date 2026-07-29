'use client';

/**
 * Palletizer.tsx — HIGH-FIDELITY INDUSTRIAL 6-AXIS ROBOTIC PALLETIZER
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, detailed cable management tracks on the robot arm, 
 * a pneumatic parallel gripper, a highly detailed safety fence with a 
 * sliding gate, realistic wooden pallets with physically-based stretch 
 * wrap, and upgraded industrial conveyors.
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

const matRobotOrange = new THREE.MeshPhysicalMaterial({
  color: '#e87010',
  metalness: 0.4,
  roughness: 0.3,
  clearcoat: 0.5,
  clearcoatRoughness: 0.3,
});

const matRobotDark = new THREE.MeshStandardMaterial({
  color: '#3a4045',
  metalness: 0.8,
  roughness: 0.4,
});

const matSteel = new THREE.MeshStandardMaterial({
  color: '#8a9199',
  metalness: 0.8,
  roughness: 0.3,
});

const matSteelDark = new THREE.MeshStandardMaterial({
  color: '#4a5058',
  metalness: 0.85,
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
  roughness: 0.95,
});

const matWood = new THREE.MeshStandardMaterial({
  color: '#8b6f47',
  metalness: 0.0,
  roughness: 0.9,
});

const matWoodDark = new THREE.MeshStandardMaterial({
  color: '#6b5235',
  metalness: 0.0,
  roughness: 0.95,
});

const matWrap = new THREE.MeshPhysicalMaterial({
  color: '#e0e8f0',
  metalness: 0.1,
  roughness: 0.2,
  transmission: 0.6,
  thickness: 0.5,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  side: THREE.DoubleSide,
});

const COLORS = {
  fenceMesh: '#5a6268',
  bagWhite: '#f0f0eb',
  bagSeam: '#d0d0cb',
  floorMark: '#e0a92c',
  hmiScreen: '#00d4ff',
  hmiBody: '#2a2a2a',
  eStopRed: '#ff2222',
  lightGreen: '#3fae56',
  lightRed: '#a4222c',
  accentCyan: '#00d4ff',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   2. DETAIL HELPERS
   ========================================================================== */

/** Realistic hex bolt */
function Bolt({ position, rotation = [0, 0, 0] as V3, size = 0.02 }: { position: V3; rotation?: V3; size?: number }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={matSteelDark}>
        <cylinderGeometry args={[size * 0.6, size * 0.6, size * 1.2, 12]} />
      </mesh>
      <mesh position={[0, size * 0.6, 0]} material={matSteelDark}>
        <cylinderGeometry args={[size, size, size * 0.4, 6]} />
      </mesh>
    </group>
  );
}

/** Cable track simulation */
function CableTrack({ start, end }: { start: V3; end: V3 }) {
  const startV = new THREE.Vector3(...start);
  const endV = new THREE.Vector3(...end);
  const mid = startV.clone().add(endV).multiplyScalar(0.5);
  const dir = endV.clone().sub(startV);
  const length = dir.length();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

  return (
    <mesh position={mid.toArray() as V3} quaternion={quat} material={matRubber}>
      <cylinderGeometry args={[0.03, 0.03, length, 8]} />
    </mesh>
  );
}

/* ==========================================================================
   3. 6-AXIS ROBOT ARM (High-fidelity with cables and pneumatic gripper)
   ========================================================================== */

function RobotArm({ 
  phase, 
  gripperOpen, 
  bagPosition,
  active = true,
}: { 
  phase: string; 
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
      case 'PICK': return { base: 0, shoulder: -0.2, upperArm: 0.5, elbow: -0.8, forearm: 0.3, wrist: 0 };
      case 'LIFT': return { base: 0, shoulder: -0.5, upperArm: 0.9, elbow: -1.3, forearm: 0.4, wrist: 0 };
      case 'PLACE': return { base: Math.PI / 2, shoulder: -0.3, upperArm: 0.6, elbow: -1.0, forearm: 0.3, wrist: 0 };
      case 'LOWER': return { base: Math.PI / 2, shoulder: -0.1, upperArm: 0.4, elbow: -0.7, forearm: 0.2, wrist: 0 };
      case 'RETURN': return { base: 0, shoulder: -0.3, upperArm: 0.8, elbow: -1.2, forearm: 0.4, wrist: 0 };
      default: return { base: 0, shoulder: -0.3, upperArm: 0.8, elbow: -1.2, forearm: 0.4, wrist: 0 };
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
      {/* Robot Base Pedestal with Flange */}
      <mesh castShadow material={matRobotOrange}>
        <cylinderGeometry args={[0.4, 0.5, 0.3, 16]} />
      </mesh>
      <mesh position={[0, 0.15, 0]} material={matRobotDark}>
        <cylinderGeometry args={[0.45, 0.45, 0.05, 16]} />
      </mesh>
      {/* Base bolts */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <Bolt key={i} position={[Math.cos(a) * 0.35, 0.18, Math.sin(a) * 0.35]} rotation={[Math.PI / 2, 0, a]} size={0.025} />;
      })}

      {/* Axis 1: Base Rotation */}
      <group ref={baseRef}>
        <mesh position={[0, 0.35, 0]} castShadow material={matRobotDark}>
          <cylinderGeometry args={[0.25, 0.25, 0.2, 16]} />
        </mesh>

        {/* Axis 2: Shoulder */}
        <group ref={shoulderRef} position={[0, 0.45, 0]} rotation={[-0.3, 0, 0]}>
          <mesh castShadow material={matRobotDark}>
            <sphereGeometry args={[0.22, 16, 16]} />
          </mesh>
          
          {/* Axis 3: Upper Arm */}
          <group ref={upperArmRef} position={[0, 0, 0]} rotation={[0.8, 0, 0]}>
            <mesh position={[0, 0.5, 0]} castShadow material={matRobotOrange}>
              <boxGeometry args={[0.28, 1.0, 0.28]} />
            </mesh>
            {/* Cable track upper */}
            <CableTrack start={[0, 0.2, -0.15]} end={[0, 0.9, -0.15]} />
            
            {/* Axis 4: Elbow */}
            <group ref={elbowRef} position={[0, 1.0, 0]} rotation={[-1.2, 0, 0]}>
              <mesh castShadow material={matRobotDark}>
                <cylinderGeometry args={[0.2, 0.2, 0.25, 16]} />
              </mesh>

              {/* Axis 5: Forearm */}
              <group ref={forearmRef} position={[0, 0, 0]} rotation={[0.4, 0, 0]}>
                <mesh position={[0, 0.4, 0]} castShadow material={matRobotOrange}>
                  <boxGeometry args={[0.24, 0.8, 0.24]} />
                </mesh>
                {/* Cable track lower */}
                <CableTrack start={[0, 0.1, -0.13]} end={[0, 0.8, -0.13]} />

                {/* Axis 6: Wrist */}
                <group ref={wristRef} position={[0, 0.8, 0]}>
                  <mesh castShadow material={matRobotDark}>
                    <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
                  </mesh>

                  {/* Gripper Mount */}
                  <mesh position={[0, -0.15, 0]} castShadow material={matRobotDark}>
                    <boxGeometry args={[0.2, 0.15, 0.2]} />
                  </mesh>

                  {/* Pneumatic Gripper */}
                  <group position={[0, -0.25, 0]}>
                    {/* Gripper Body */}
                    <mesh castShadow material={matSteel}>
                      <boxGeometry args={[0.35, 0.15, 0.25]} />
                    </mesh>
                    {/* Pneumatic Cylinders */}
                    <mesh position={[-0.12, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} material={matSteelDark}>
                      <cylinderGeometry args={[0.04, 0.04, 0.15, 12]} />
                    </mesh>
                    <mesh position={[0.12, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} material={matSteelDark}>
                      <cylinderGeometry args={[0.04, 0.04, 0.15, 12]} />
                    </mesh>
                    
                    {/* Left Jaw */}
                    <mesh ref={jawLeftRef} position={[-0.15, -0.15, 0]} castShadow material={matSteel}>
                      <boxGeometry args={[0.06, 0.25, 0.15]} />
                    </mesh>
                    <mesh position={[-0.15, -0.28, 0.08]} material={matRubber}>
                      <boxGeometry args={[0.07, 0.05, 0.16]} />
                    </mesh>

                    {/* Right Jaw */}
                    <mesh ref={jawRightRef} position={[0.15, -0.15, 0]} castShadow material={matSteel}>
                      <boxGeometry args={[0.06, 0.25, 0.15]} />
                    </mesh>
                    <mesh position={[0.15, -0.28, 0.08]} material={matRubber}>
                      <boxGeometry args={[0.07, 0.05, 0.16]} />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>

      {/* Carried Bag */}
      {bagPosition && (
        <group position={bagPosition}>
          <mesh castShadow>
            <boxGeometry args={[0.4, 0.7, 0.3]} />
            <meshStandardMaterial color={COLORS.bagWhite} roughness={0.95} metalness={0} />
          </mesh>
          <mesh position={[0, 0.36, 0]}>
            <boxGeometry args={[0.41, 0.02, 0.31]} />
            <meshStandardMaterial color={COLORS.bagSeam} roughness={0.95} metalness={0} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/* ==========================================================================
   4. SAFETY FENCE (High-fidelity with sliding gate)
   ========================================================================== */

function SafetyFence({ size }: { size: number }) {
  const fenceHeight = 2.2;
  const panelWidth = 1.0;
  const panelsPerSide = Math.floor(size / panelWidth);

  return (
    <group>
      {/* Fence Panels */}
      {[-1, 1].map((sideX) =>
        Array.from({ length: panelsPerSide }, (_, i) => {
          const z = -size / 2 + panelWidth / 2 + i * panelWidth;
          if (sideX === -1 && Math.abs(z) < 0.6) return null; // Infeed opening
          if (sideX === 1 && z > 0.4 && z < 1.6) return null; // Outfeed opening
          return (
            <group key={`x-${sideX}-${i}`} position={[sideX * size / 2, fenceHeight / 2, z]}>
              {/* Yellow Frame */}
              <mesh position={[0, fenceHeight / 2 - 0.05, 0]} material={matSafety}><boxGeometry args={[0.08, 0.08, panelWidth - 0.1]} /></mesh>
              <mesh position={[0, -fenceHeight / 2 + 0.05, 0]} material={matSafety}><boxGeometry args={[0.08, 0.08, panelWidth - 0.1]} /></mesh>
              <mesh position={[0.04, 0, panelWidth / 2 - 0.05]} material={matSafety}><boxGeometry args={[0.08, fenceHeight - 0.1, 0.08]} /></mesh>
              <mesh position={[0.04, 0, -panelWidth / 2 + 0.05]} material={matSafety}><boxGeometry args={[0.08, fenceHeight - 0.1, 0.08]} /></mesh>
              {/* Mesh infill */}
              <mesh position={[0.04, 0, 0]}>
                <boxGeometry args={[0.02, fenceHeight - 0.15, panelWidth - 0.2]} />
                <meshStandardMaterial color={COLORS.fenceMesh} metalness={0.6} roughness={0.4} wireframe />
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
              <mesh position={[0, fenceHeight / 2 - 0.05, 0]} material={matSafety}><boxGeometry args={[panelWidth - 0.1, 0.08, 0.08]} /></mesh>
              <mesh position={[0, -fenceHeight / 2 + 0.05, 0]} material={matSafety}><boxGeometry args={[panelWidth - 0.1, 0.08, 0.08]} /></mesh>
              <mesh position={[panelWidth / 2 - 0.05, 0, 0.04]} material={matSafety}><boxGeometry args={[0.08, fenceHeight - 0.1, 0.08]} /></mesh>
              <mesh position={[-panelWidth / 2 + 0.05, 0, 0.04]} material={matSafety}><boxGeometry args={[0.08, fenceHeight - 0.1, 0.08]} /></mesh>
              <mesh position={[0, 0, 0.04]}>
                <boxGeometry args={[panelWidth - 0.2, fenceHeight - 0.15, 0.02]} />
                <meshStandardMaterial color={COLORS.fenceMesh} metalness={0.6} roughness={0.4} wireframe />
              </mesh>
            </group>
          );
        })
      )}

      {/* Sliding Safety Gate */}
      <group position={[0, fenceHeight / 2, size / 2]}>
        <mesh position={[-0.6, 0, 0]} material={matSafety}><boxGeometry args={[0.1, fenceHeight, 0.1]} /></mesh>
        <mesh position={[0.6, 0, 0]} material={matSafety}><boxGeometry args={[0.1, fenceHeight, 0.1]} /></mesh>
        {/* Gate Panel */}
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[1.1, fenceHeight - 0.2, 0.08]} />
          <meshStandardMaterial color={COLORS.fenceMesh} metalness={0.6} roughness={0.4} wireframe />
        </mesh>
        <mesh position={[0, fenceHeight / 2 - 0.1, 0.05]} material={matSafety}><boxGeometry args={[1.1, 0.08, 0.08]} /></mesh>
        <mesh position={[0, -fenceHeight / 2 + 0.1, 0.05]} material={matSafety}><boxGeometry args={[1.1, 0.08, 0.08]} /></mesh>
        {/* Handle & Interlock */}
        <mesh position={[0.4, 0, 0.12]} material={matSteelDark}><boxGeometry args={[0.05, 0.2, 0.05]} /></mesh>
        <mesh position={[0.65, 0.5, 0.1]} material={matSteelDark}><boxGeometry args={[0.08, 0.12, 0.06]} /></mesh>
      </group>
    </group>
  );
}

/* ==========================================================================
   5. WOODEN PALLET (With realistic stretch wrap)
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
      {/* Pallet Base */}
      <mesh position={[0, palletHeight / 2, 0]} castShadow receiveShadow material={matWood}>
        <boxGeometry args={[palletWidth, palletHeight, palletDepth]} />
      </mesh>
      {/* Top Deck Boards */}
      {[-0.4, -0.13, 0.13, 0.4].map((x, i) => (
        <mesh key={i} position={[x, palletHeight + 0.02, 0]} castShadow material={matWoodDark}>
          <boxGeometry args={[0.12, 0.04, palletDepth - 0.1]} />
        </mesh>
      ))}
      {/* Support Blocks */}
      {[
        [-0.45, 0, -0.35], [0, 0, -0.35], [0.45, 0, -0.35],
        [-0.45, 0, 0], [0, 0, 0], [0.45, 0, 0],
        [-0.45, 0, 0.35], [0, 0, 0.35], [0.45, 0, 0.35],
      ].map((pos, i) => (
        <mesh key={i} position={pos as V3} material={matWoodDark}>
          <boxGeometry args={[0.15, 0.1, 0.15]} />
        </mesh>
      ))}

      {/* Bags */}
      {hasBags && Array.from({ length: layers }, (_, layerIdx) => {
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
              <meshStandardMaterial color={COLORS.bagWhite} roughness={0.95} metalness={0} />
            </mesh>
          );
        });
      })}
      {hasBags && Array.from({ length: bagsInLayer }, (_, idx) => {
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
            <meshStandardMaterial color={COLORS.bagWhite} roughness={0.95} metalness={0} />
          </mesh>
        );
      })}

      {/* Stretch Wrap */}
      {wrapped && hasBags && (
        <mesh position={[0, stackH / 2 + 0.1, 0]} castShadow>
          <boxGeometry args={[palletWidth + 0.08, Math.max(stackH - 0.05, 0.8), palletDepth + 0.08]} />
          <meshPhysicalMaterial
            color={matWrap.color}
            metalness={matWrap.metalness}
            roughness={matWrap.roughness}
            transmission={matWrap.transmission}
            thickness={matWrap.thickness}
            clearcoat={matWrap.clearcoat}
            clearcoatRoughness={matWrap.clearcoatRoughness}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

/* ==========================================================================
   6. EMPTY PALLET MAGAZINE
   ========================================================================== */

function EmptyPalletMagazine({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {/* Magazine frame posts */}
      {[[-0.7, 0.6, -0.55], [0.7, 0.6, -0.55], [-0.7, 0.6, 0.55], [0.7, 0.6, 0.55]].map((pos, i) => (
        <mesh key={i} position={pos as V3} castShadow material={matSteelDark}>
          <boxGeometry args={[0.08, 1.2, 0.08]} />
        </mesh>
      ))}
      <mesh position={[0, 1.15, 0]} material={matSteelDark}>
        <boxGeometry args={[1.5, 0.08, 1.2]} />
      </mesh>
      {/* Stacked empty pallets */}
      {[0, 0.18, 0.36, 0.54].map((y, i) => (
        <WoodenPallet key={i} position={[0, y, 0]} hasBags={false} bagCount={0} />
      ))}
      <Text position={[0, 1.45, 0]} fontSize={0.08} color={COLORS.floorMark} anchorX="center" anchorY="middle" fontWeight="bold">
        EMPTY MAGAZINE
      </Text>
    </group>
  );
}

/* ==========================================================================
   7. PALLET OUTFEED CONVEYOR (Heavy-duty roller)
   ========================================================================== */

function PalletOutfeedConveyor({ position, active = true }: { position: V3; active?: boolean }) {
  const length = 2.8;
  const rollersRef = useRef<THREE.Group>(null!);
  
  useFrame((_, delta) => {
    if (!rollersRef.current || !active) return;
    rollersRef.current.children.forEach((child: any) => {
      child.rotation.x += delta * 2.5;
    });
  });

  return (
    <group position={position}>
      {/* Frame */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow material={matSteelDark}>
        <boxGeometry args={[length, 0.12, 1.35]} />
      </mesh>
      {/* Rollers */}
      <group ref={rollersRef}>
        {Array.from({ length: 7 }, (_, i) => {
          const x = -length / 2 + 0.25 + i * 0.4;
          return (
            <mesh key={i} position={[x, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matSteel}>
              <cylinderGeometry args={[0.06, 0.06, 1.2, 16]} />
            </mesh>
          );
        })}
      </group>
      {/* Legs */}
      {[[-length / 2 + 0.15, 0.2, 0.6], [length / 2 - 0.15, 0.2, 0.6], [-length / 2 + 0.15, 0.2, -0.6], [length / 2 - 0.15, 0.2, -0.6]].map((pos, i) => (
        <mesh key={i} position={pos as V3} material={matSteelDark}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
        </mesh>
      ))}
    </group>
  );
}

function AnimatedOutfeedPallet({ start, end, active, palletComplete }: { start: V3; end: V3; active: boolean; palletComplete: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (palletComplete && active) progress.current = Math.min(1, progress.current + delta * 0.22);
    else if (!palletComplete) progress.current = Math.max(0, progress.current - delta * 0.5);
    
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
   8. FORKLIFT LOADING BAY & PICK CONVEYOR
   ========================================================================== */

function ForkliftLoadingBay({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[3.2, 2.4]} />
        <meshStandardMaterial color="#6a6a62" roughness={0.95} />
      </mesh>
      {[
        [0, 0.015, 1.15], [0, 0.015, -1.15], [1.55, 0.015, 0], [-1.55, 0.015, 0],
      ].map((pos, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, i < 2 ? 0 : Math.PI / 2]} position={pos as V3}>
          <planeGeometry args={[i < 2 ? 3.2 : 2.4, 0.12]} />
          <meshStandardMaterial color={COLORS.floorMark} roughness={0.8} />
        </mesh>
      ))}
      <Text position={[0.7, 0.05, 1.35]} fontSize={0.1} color={COLORS.floorMark} anchorX="center" anchorY="middle" fontWeight="bold">
        FORKLIFT ZONE
      </Text>
    </group>
  );
}

function PickConveyor({ position, height = 0.85 }: { position: V3; height?: number }) {
  return (
    <group position={position}>
      {[[-0.6, height / 2, -0.28], [0.6, height / 2, -0.28], [-0.6, height / 2, 0.28], [0.6, height / 2, 0.28]].map((pos, i) => (
        <mesh key={i} position={pos as V3} material={matSteelDark}>
          <boxGeometry args={[0.08, height, 0.08]} />
        </mesh>
      ))}
      <mesh position={[0, height, 0]} castShadow material={matSteelDark}>
        <boxGeometry args={[1.5, 0.12, 0.8]} />
      </mesh>
      <mesh position={[0, height + 0.1, 0]} castShadow receiveShadow material={matRubber}>
        <boxGeometry args={[1.4, 0.05, 0.7]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   9. HMI PANEL & TOWER LIGHT
   ========================================================================== */

function HMIPanel({ position, layerCount, bagCount, palletComplete }: { position: V3; layerCount: number; bagCount: number; palletComplete: boolean }) {
  return (
    <group position={position}>
      <mesh castShadow material={COLORS.hmiBody as any}>
        <boxGeometry args={[0.5, 0.7, 0.2]} />
        <meshStandardMaterial color={COLORS.hmiBody} metalness={0.5} roughness={0.5} />
      </mesh>
      <Bolt position={[-0.22, 0.25, 0.11]} rotation={[0, Math.PI / 2, 0]} size={0.015} />
      <Bolt position={[0.22, 0.25, 0.11]} rotation={[0, Math.PI / 2, 0]} size={0.015} />
      <Bolt position={[-0.22, -0.25, 0.11]} rotation={[0, Math.PI / 2, 0]} size={0.015} />
      <Bolt position={[0.22, -0.25, 0.11]} rotation={[0, Math.PI / 2, 0]} size={0.015} />

      <mesh position={[0, 0.15, 0.11]}>
        <boxGeometry args={[0.4, 0.35, 0.02]} />
        <meshStandardMaterial color={COLORS.hmiScreen} emissive={COLORS.hmiScreen} emissiveIntensity={0.5} metalness={0.1} roughness={0.2} />
      </mesh>
      <Text position={[0, 0.2, 0.12]} fontSize={0.04} color="#000000" anchorX="center" anchorY="middle" fontWeight="bold">
        LAYER: {layerCount}
      </Text>
      <Text position={[0, 0.1, 0.12]} fontSize={0.035} color="#000000" anchorX="center" anchorY="middle">
        BAG: {bagCount}
      </Text>

      <mesh position={[-0.12, -0.15, 0.11]}><cylinderGeometry args={[0.03, 0.03, 0.04, 16]} /><meshStandardMaterial color={COLORS.lightGreen} /></mesh>
      <mesh position={[0, -0.15, 0.11]}><cylinderGeometry args={[0.03, 0.03, 0.04, 16]} /><meshStandardMaterial color={COLORS.lightRed} /></mesh>
      
      <mesh position={[0.12, -0.15, 0.11]}><cylinderGeometry args={[0.04, 0.04, 0.02, 16]} /><meshStandardMaterial color={COLORS.floorMark} /></mesh>
      <mesh position={[0.12, -0.15, 0.125]}><cylinderGeometry args={[0.035, 0.035, 0.02, 16]} /><meshStandardMaterial color={COLORS.eStopRed} /></mesh>
    </group>
  );
}

function TowerLight({ position, status }: { position: V3; status: 'idle' | 'running' | 'alarm' }) {
  const greenRef = useRef<THREE.Mesh>(null!);
  const redRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (status === 'idle') return;
    const pulse = Math.sin(clock.elapsedTime * 8) > 0;
    if (greenRef.current) {
      (greenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = (status === 'running' && pulse) ? 1.5 : 0.1;
    }
    if (redRef.current) {
      (redRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = (status === 'alarm' && pulse) ? 1.5 : 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh material={matSteelDark}><cylinderGeometry args={[0.03, 0.03, 0.5, 16]} /></mesh>
      <mesh ref={greenRef} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 16]} />
        <meshStandardMaterial color={COLORS.lightGreen} emissive={COLORS.lightGreen} emissiveIntensity={0.1} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 16]} />
        <meshStandardMaterial color={COLORS.floorMark} emissive={COLORS.floorMark} emissiveIntensity={0.1} transparent opacity={0.8} />
      </mesh>
      <mesh ref={redRef} position={[0, -0.11, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 16]} />
        <meshStandardMaterial color={COLORS.lightRed} emissive={COLORS.lightRed} emissiveIntensity={0.1} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.22, 0]} material={matSteelDark}><cylinderGeometry args={[0.065, 0.065, 0.04, 16]} /></mesh>
    </group>
  );
}

/* ==========================================================================
   10. PLC DATA PANEL
   ========================================================================== */

function DataPanel({ position, active, layerCount, bagCount, palletComplete, completedBags, palletNumber }: {
  position: V3; active: boolean; layerCount: number; bagCount: number; palletComplete: boolean; completedBags: number; palletNumber: number;
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
        <mesh position={[0, -0.55, -0.02]}><planeGeometry args={[2.3, 2.3]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -0.55, -0.015]}><planeGeometry args={[2.34, 2.34]} /><meshStandardMaterial color={COLORS.floorMark} transparent opacity={0.4} side={THREE.DoubleSide} /></mesh>
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
   11. MAIN PALLETIZER COMPONENT
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
        if (t > 0.5) { setGripperOpen(true); setBagOnGripper(null); advance('PICK'); }
        break;
      case 'PICK':
        if (t > 1.5) { setGripperOpen(false); setBagOnGripper([-1.5, pickY, 0]); advance('LIFT'); }
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
              setLayerCount((l) => { const next = l + 1; if (next >= 8) setPalletComplete(true); return next; });
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
            setLayerCount(0); setBagCount(0); setPalletComplete(false); setPalletNumber((n) => n + 1);
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
      <RobotArm phase={phase} gripperOpen={gripperOpen} bagPosition={bagOnGripper} active={active} />
      <EmptyPalletMagazine position={[1.2, 0, -1.8]} />
      <WoodenPallet position={[1.2, 0, 0.35]} hasBags={layerCount > 0 || bagCount > 0} bagCount={layerCount * 8 + bagCount} />
      <PalletOutfeedConveyor position={[cellSize / 2 + 0.9, 0, 0.9]} active={active} />
      <AnimatedOutfeedPallet start={[cellSize / 2 + 0.4, 0.24, 0.9]} end={[cellSize / 2 + 3.2, 0.24, 0.9]} active={active} palletComplete={palletComplete} />
      <ForkliftLoadingBay position={[cellSize / 2 + 3.6, 0, 0.9]} />
      <HMIPanel position={[-cellSize / 2 + 0.3, 1.2, 0]} layerCount={layerCount} bagCount={bagCount} palletComplete={palletComplete} />
      <TowerLight position={[-cellSize / 2 + 0.3, 2.0, 0]} status={active ? 'running' : 'idle'} />
      
      {showDataPanel && (
        <DataPanel position={[cellSize / 2 + 1.8, 2.4, -1.8]} active={active} layerCount={layerCount} bagCount={bagCount} palletComplete={palletComplete} completedBags={completedBags} palletNumber={palletNumber} />
      )}

      <mesh position={[0, 1.5, 0]} onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); setInternalActive(!internalActive); }} visible={false}>
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
   12. ENVIRONMENT & EXPORT
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
      <directionalLight position={[10, 15, 10]} intensity={1.4} castShadow shadow-mapSize-width={4096} shadow-mapSize-height={4096} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-far={40} shadow-bias={-0.0001} />
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