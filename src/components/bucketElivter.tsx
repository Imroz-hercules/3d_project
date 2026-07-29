'use client';

/**
 * BucketElevator.tsx — HIGH-FIDELITY INDUSTRIAL BUCKET ELEVATOR
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, flanged casing seams, interactive inspection doors 
 * with gaskets, detailed drive pulley with rubber lagging, robust I-beam 
 * support legs with gussets, and a high-fidelity gear motor.
 * ------------------------------------------------------------------------
 */

import React, { useMemo, useRef, useState } from 'react';
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
function BoltCircle({ radius, count, y = 0, size = 0.02, rotation = [0, 0, 0] as V3 }: { radius: number; count: number; y?: number; size?: number; rotation?: V3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <Bolt
            key={i}
            position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}
            rotation={[Math.PI / 2, 0, -a]}
            size={size}
          />
        );
      })}
    </>
  );
}

/* ==========================================================================
   3. BOOT SECTION (Upgraded with base plates, anchor bolts, and detailed inlet)
   ========================================================================== */

function BootSection({ width, depth, height, position }: { width: number; depth: number; height: number; position: V3 }) {
  return (
    <group position={position}>
      {/* Main boot housing */}
      <mesh castShadow receiveShadow material={matBody}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* Inlet opening */}
      <mesh position={[width / 2 + 0.02, 0, 0]} material={matBodyDark}>
        <boxGeometry args={[0.04, height * 0.6, depth * 0.7]} />
      </mesh>

      {/* Inlet flange with bolts */}
      <mesh position={[width / 2 + 0.06, 0, 0]} material={matStructure}>
        <boxGeometry args={[0.06, height * 0.65, depth * 0.75]} />
      </mesh>
      {/* Inlet flange bolts (simplified rows) */}
      {[-0.2, 0, 0.2].map((z) => (
        <Bolt key={z} position={[width / 2 + 0.09, 0, z]} rotation={[0, 0, Math.PI / 2]} size={0.018} />
      ))}

      {/* Bottom pulley with rubber lagging simulation */}
      <mesh position={[0, -height / 2 + 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={matRubber}>
        <cylinderGeometry args={[width * 0.36, width * 0.36, depth * 0.85, 32]} />
      </mesh>
      {/* Pulley steel end discs */}
      <mesh position={[0, -height / 2 + 0.15, depth * 0.45]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <cylinderGeometry args={[width * 0.38, width * 0.38, 0.06, 32]} />
      </mesh>
      <mesh position={[0, -height / 2 + 0.15, -depth * 0.45]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <cylinderGeometry args={[width * 0.38, width * 0.38, 0.06, 32]} />
      </mesh>

      {/* Cleanout door */}
      <mesh position={[0, -height / 2 + 0.03, depth / 2 + 0.02]} material={matBodyDark}>
        <boxGeometry args={[width * 0.5, height * 0.35, 0.04]} />
      </mesh>
      {/* Door gasket */}
      <mesh position={[0, -height / 2 + 0.03, depth / 2 + 0.04]} material={matGasket}>
        <boxGeometry args={[width * 0.46, height * 0.31, 0.01]} />
      </mesh>
      {/* Door handle */}
      <mesh position={[width * 0.2, -height / 2 + 0.03, depth / 2 + 0.06]} material={matStructure}>
        <boxGeometry args={[0.04, 0.12, 0.04]} />
      </mesh>
      {/* Door hinges */}
      {[-0.15, 0.15].map((x, i) => (
        <mesh key={i} position={[x, -height / 2 + 0.03, depth / 2 + 0.04]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
          <cylinderGeometry args={[0.02, 0.02, 0.05, 12]} />
        </mesh>
      ))}

      {/* Support legs with base plates */}
      {[
        [width / 2 - 0.12, -height / 2 - 0.3, depth / 2 - 0.12],
        [-width / 2 + 0.12, -height / 2 - 0.3, depth / 2 - 0.12],
        [width / 2 - 0.12, -height / 2 - 0.3, -depth / 2 + 0.12],
        [-width / 2 + 0.12, -height / 2 - 0.3, -depth / 2 + 0.12],
      ].map((pos, i) => (
        <group key={i}>
          <mesh position={pos} castShadow material={matStructure}>
            <boxGeometry args={[0.12, 0.6, 0.12]} />
          </mesh>
          <mesh position={[pos[0], pos[1] - 0.28, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.25, 0.06, 0.25]} />
          </mesh>
          {/* Anchor bolts */}
          {[-0.08, 0.08].map((dx) =>
            [-0.08, 0.08].map((dz) => (
              <Bolt key={`${dx}-${dz}`} position={[pos[0] + dx, pos[1] - 0.23, pos[2] + dz]} size={0.016} />
            ))
          )}
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   4. INTERACTIVE INSPECTION DOOR
   ========================================================================== */

function InspectionDoor({ position, rotation }: { position: V3; rotation: V3 }) {
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
        <boxGeometry args={[0.06, 0.7, 0.55]} />
      </mesh>
      {/* Gasket */}
      <mesh position={[0.035, 0, 0]} material={matGasket}>
        <boxGeometry args={[0.02, 0.66, 0.51]} />
      </mesh>
      {/* Hinged Door */}
      <group ref={doorRef} position={[0.04, 0, -0.25]}>
        <mesh
          position={[0, 0, 0.25]}
          castShadow
          material={hovered ? matSafety : matBody}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
          onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); setOpen((o) => !o); }}
        >
          <boxGeometry args={[0.05, 0.65, 0.5]} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.035, 0, 0.4]} material={matStructure}>
          <boxGeometry args={[0.04, 0.15, 0.04]} />
        </mesh>
        {/* Hinges */}
        {[-0.25, 0.25].map((z, i) => (
          <mesh key={i} position={[0.035, z, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 12]} />
          </mesh>
        ))}
      </group>
      {/* Frame bolts */}
      {[[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]].map(([y, z], i) => (
        <Bolt key={i} position={[0.04, y, z]} rotation={[0, Math.PI / 2, 0]} size={0.016} />
      ))}
    </group>
  );
}

/* ==========================================================================
   5. VERTICAL CASING (Upgraded with seams, stiffeners, and doors)
   ========================================================================== */

function VerticalCasing({ width, depth, height, position, inspectionDoors }: { width: number; depth: number; height: number; position: V3; inspectionDoors: boolean }) {
  const ribCount = Math.max(2, Math.floor(height / 2));
  const ribs = Array.from({ length: ribCount }, (_, i) => -height / 2 + 1 + i * (height / ribCount));

  return (
    <group position={position}>
      {/* Main casing */}
      <mesh castShadow receiveShadow material={matBody}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* Vertical panel seams */}
      {[ -width/2 + 0.01, width/2 - 0.01 ].map((x, i) => (
        <mesh key={i} position={[x, 0, depth / 2 + 0.005]} material={matBodyDark}>
          <boxGeometry args={[0.015, height - 0.2, 0.02]} />
        </mesh>
      ))}

      {/* Horizontal stiffener ribs with bolts */}
      {ribs.map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, depth / 2 + 0.01]} material={matStructure}>
            <boxGeometry args={[width * 0.96, 0.06, 0.025]} />
          </mesh>
          <mesh position={[0, y, -depth / 2 - 0.01]} material={matStructure}>
            <boxGeometry args={[width * 0.96, 0.06, 0.025]} />
          </mesh>
          {/* Bolts on ribs */}
          {[-width * 0.4, 0, width * 0.4].map((x) => (
            <Bolt key={`f-${x}`} position={[x, y, depth / 2 + 0.025]} size={0.016} />
          ))}
          {[-width * 0.4, 0, width * 0.4].map((x) => (
            <Bolt key={`b-${x}`} position={[x, y, -depth / 2 - 0.025]} rotation={[0, Math.PI, 0]} size={0.016} />
          ))}
        </group>
      ))}

      {/* Inspection doors */}
      {inspectionDoors &&
        Array.from({ length: Math.max(1, Math.floor(height / 3)) }, (_, i) => {
          const y = -height / 2 + 1.5 + i * 3;
          return (
            <InspectionDoor
              key={`door-${i}`}
              position={[width / 2 + 0.02, y, 0]}
              rotation={[0, 0, 0]}
            />
          );
        })}
    </group>
  );
}

/* ==========================================================================
   6. BUCKETS ON BELT (Upgraded with realistic bucket shape and lips)
   ========================================================================== */

function BucketsOnBelt({ width, depth, height, position, active, speed }: { width: number; depth: number; height: number; position: V3; active: boolean; speed: number }) {
  const beltRef = useRef<THREE.Group>(null!);
  const bucketCount = Math.floor(height / 0.35);
  const buckets = Array.from({ length: bucketCount }, (_, i) => i);

  useFrame((_, delta) => {
    if (beltRef.current && active) {
      beltRef.current.position.y += speed * delta;
      if (beltRef.current.position.y > 0.35) {
        beltRef.current.position.y = 0;
      }
    }
  });

  return (
    <group position={position}>
      {/* Belt */}
      <mesh position={[0, 0, 0]} material={matRubber}>
        <boxGeometry args={[width * 0.75, height, 0.06]} />
      </mesh>

      {/* Buckets */}
      <group ref={beltRef}>
        {buckets.map((i) => {
          const y = -height / 2 + 0.15 + (i / bucketCount) * height;
          return (
            <group key={i} position={[0, y, 0]}>
              {/* Bucket body (slightly tapered look via scaling) */}
              <mesh castShadow material={matBody}>
                <boxGeometry args={[width * 0.65, 0.14, depth * 0.65]} />
              </mesh>
              {/* Bucket front lip (wear edge) */}
              <mesh position={[0, 0, depth * 0.35]} material={matStructure}>
                <boxGeometry args={[width * 0.68, 0.16, 0.03]} />
              </mesh>
              {/* Bucket side wings */}
              <mesh position={[width * 0.32, 0, 0]} material={matBodyDark}>
                <boxGeometry args={[0.03, 0.14, depth * 0.6]} />
              </mesh>
              <mesh position={[-width * 0.32, 0, 0]} material={matBodyDark}>
                <boxGeometry args={[0.03, 0.14, depth * 0.6]} />
              </mesh>
              {/* Mounting bolts to belt */}
              <Bolt position={[width * 0.2, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} size={0.015} />
              <Bolt position={[-width * 0.2, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]} size={0.015} />
            </group>
          );
        })}
      </group>
    </group>
  );
}

/* ==========================================================================
   7. HEAD SECTION (Upgraded with lagged drive pulley and detailed spout)
   ========================================================================== */

function HeadSection({ width, depth, height, position, active }: { width: number; depth: number; height: number; position: V3; active: boolean }) {
  const pulleyRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (pulleyRef.current && active) {
      pulleyRef.current.rotation.z += delta * 2.5;
    }
  });

  return (
    <group position={position}>
      {/* Main head housing */}
      <mesh castShadow receiveShadow material={matBody}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* Drive pulley with rubber lagging */}
      <mesh ref={pulleyRef} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={matRubber}>
        <cylinderGeometry args={[width * 0.41, width * 0.41, depth * 0.85, 32]} />
      </mesh>
      {/* Pulley steel end discs */}
      <mesh position={[0, 0, depth * 0.45]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <cylinderGeometry args={[width * 0.43, width * 0.43, 0.06, 32]} />
      </mesh>
      <mesh position={[0, 0, -depth * 0.45]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <cylinderGeometry args={[width * 0.43, width * 0.43, 0.06, 32]} />
      </mesh>

      {/* Discharge outlet spout */}
      <mesh position={[0, height / 2 - 0.1, depth / 2 + 0.25]} castShadow material={matBodyDark}>
        <boxGeometry args={[width * 0.7, 0.35, 0.5]} />
      </mesh>
      {/* Outlet flange */}
      <mesh position={[0, height / 2 - 0.1, depth / 2 + 0.55]} material={matStructure}>
        <boxGeometry args={[width * 0.75, 0.4, 0.06]} />
      </mesh>
      {/* Outlet flange bolts */}
      {[-0.25, 0, 0.25].map((x) => (
        <Bolt key={x} position={[x, height / 2 - 0.1, depth / 2 + 0.58]} rotation={[0, 0, Math.PI / 2]} size={0.018} />
      ))}

      {/* Motor mounting plate */}
      <mesh position={[-width / 2 - 0.05, 0, 0]} material={matStructure}>
        <boxGeometry args={[0.08, height * 0.5, depth * 0.6]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   8. MOTOR AND GEARBOX (High-fidelity right-angle drive)
   ========================================================================== */

function MotorGearbox({ position, active, rpm }: { position: V3; active: boolean; rpm: number }) {
  const fanRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += (rpm / 60) * Math.PI * 2 * delta * 1.5;
    }
  });

  return (
    <group position={position}>
      {/* Right-angle gearbox */}
      <mesh castShadow material={matStructure}>
        <boxGeometry args={[0.25, 0.28, 0.28]} />
      </mesh>
      {/* Gearbox mounting bolts */}
      {[[-0.1, -0.12], [0.1, -0.12], [-0.1, 0.12], [0.1, 0.12]].map(([x, z], i) => (
        <Bolt key={i} position={[x, 0, z]} rotation={[0, 0, Math.PI / 2]} size={0.018} />
      ))}

      {/* Motor body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={matMotor}>
        <cylinderGeometry args={[0.22, 0.22, 0.55, 24]} />
      </mesh>

      {/* Cooling fins */}
      {Array.from({ length: 12 }, (_, i) => {
        const z = -0.22 + (i / 11) * 0.44;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
            <cylinderGeometry args={[0.24, 0.24, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Terminal box */}
      <mesh position={[0, 0.24, 0]} material={matMotorDark}>
        <boxGeometry args={[0.12, 0.08, 0.14]} />
      </mesh>

      {/* Fan cover */}
      <mesh position={[0, 0, 0.32]} rotation={[0, 0, Math.PI / 2]} castShadow material={matMotorDark}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 24]} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.35]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <cylinderGeometry args={[0.17, 0.17, 0.02, 8]} />
      </mesh>

      {/* Output shaft to pulley */}
      <mesh position={[0, 0, -0.3]} rotation={[0, 0, Math.PI / 2]} material={matBodyDark}>
        <cylinderGeometry args={[0.05, 0.05, 0.15, 16]} />
      </mesh>

      {/* Safety coupling guard */}
      <mesh position={[0, 0.05, -0.2]} material={matSafety}>
        <boxGeometry args={[0.15, 0.15, 0.12]} />
      </mesh>
      <mesh position={[0, 0.05, -0.2]}>
        <boxGeometry args={[0.13, 0.03, 0.005]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Status indicator */}
      <mesh position={[0, 0.24, 0.08]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={active ? COLORS.accentGreen : COLORS.accentRed} emissive={active ? COLORS.accentGreen : COLORS.accentRed} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   9. MAINTENANCE PLATFORM (Upgraded with grating, toe boards, and rails)
   ========================================================================== */

function MaintenancePlatform({ width, depth, position }: { width: number; depth: number; position: V3 }) {
  return (
    <group position={position}>
      {/* Platform surface */}
      <mesh castShadow receiveShadow material={matBodyDark}>
        <boxGeometry args={[width, 0.06, depth]} />
      </mesh>

      {/* Grating pattern simulation */}
      {Array.from({ length: 10 }, (_, i) => {
        const x = -width / 2 + 0.15 + (i / 9) * (width - 0.3);
        return (
          <mesh key={i} position={[x, 0.04, 0]} material={matStructure}>
            <boxGeometry args={[0.025, 0.02, depth * 0.95]} />
          </mesh>
        );
      })}

      {/* Toe board */}
      <mesh position={[0, 0.08, depth / 2 - 0.03]} material={matSafety}>
        <boxGeometry args={[width, 0.12, 0.04]} />
      </mesh>

      {/* Safety railing posts */}
      {[-width / 2 + 0.1, 0, width / 2 - 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.35, depth / 2 - 0.03]} material={matSafety}>
          <boxGeometry args={[0.04, 0.7, 0.04]} />
        </mesh>
      ))}

      {/* Safety railing top bar */}
      <mesh position={[0, 0.7, depth / 2 - 0.03]} material={matSafety}>
        <boxGeometry args={[width, 0.04, 0.04]} />
      </mesh>
      <mesh position={[0, 0.4, depth / 2 - 0.03]} material={matSafety}>
        <boxGeometry args={[width, 0.04, 0.04]} />
      </mesh>

      {/* Support brackets */}
      {[
        [width / 2 - 0.1, -0.25, depth / 2 - 0.1],
        [-width / 2 + 0.1, -0.25, depth / 2 - 0.1],
        [width / 2 - 0.1, -0.25, -depth / 2 + 0.1],
        [-width / 2 + 0.1, -0.25, -depth / 2 + 0.1],
      ].map((pos, i) => (
        <mesh key={i} position={pos} castShadow material={matStructure}>
          <boxGeometry args={[0.08, 0.5, 0.08]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   10. DATA PANEL
   ========================================================================== */

function DataPanel({ position, active, rpm, beltSpeed, label }: { position: V3; active: boolean; rpm: number; beltSpeed: number; label: string }) {
  const lines = [
    { text: `BUCKET ELEVATOR`, size: 0.18, color: '#1c1c1c', bold: true },
    { text: `ID: ${label}`, size: 0.14, color: '#3a3a3a' },
    { text: `Status: ${active ? '● RUNNING' : '○ STOPPED'}`, size: 0.14, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Motor RPM: ${active ? rpm.toFixed(0) : '0'}`, size: 0.14, color: '#3a3a3a' },
    { text: `Belt Speed: ${active ? beltSpeed.toFixed(1) : '0.0'} m/s`, size: 0.14, color: '#3a3a3a' },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.3, -0.02]}>
          <planeGeometry args={[2, 1.3]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.3, -0.015]}>
          <planeGeometry args={[2.04, 1.34]} />
          <meshStandardMaterial color={COLORS.accentYellow} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {lines.map((line, i) => (
          <Text key={i} position={[-0.9, -i * 0.26, 0]} fontSize={line.size} color={line.color} anchorX="left" anchorY="top" fontWeight={line.bold ? 'bold' : 'normal'}>
            {line.text}
          </Text>
        ))}
      </group>
    </Float>
  );
}

/* ==========================================================================
   11. MAIN BUCKET ELEVATOR COMPONENT
   ========================================================================== */

export interface BucketElevatorProps {
  position?: V3;
  width?: number;
  depth?: number;
  height?: number;
  rpm?: number;
  beltSpeed?: number;
  active?: boolean;
  label?: string;
  showInspectionDoors?: boolean;
  showPlatform?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function BucketElevatorComponent({
  position = [0, 0, 0],
  width = 1.5,
  depth = 1.2,
  height = 8,
  rpm = 45,
  beltSpeed = 1.2,
  active: controlledActive,
  label = 'ELEVATOR-01',
  showInspectionDoors = true,
  showPlatform = true,
  showDataPanel = true,
  showClickText = true,
}: BucketElevatorProps) {
  const [internalActive, setInternalActive] = useState(false);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  const bootHeight = 1.5;
  const headHeight = 1.8;
  const casingHeight = height - bootHeight - headHeight;

  return (
    <group position={position}>
      {/* Boot section */}
      <BootSection width={width} depth={depth} height={bootHeight} position={[0, bootHeight / 2, 0]} />

      {/* Vertical casing */}
      <VerticalCasing
        width={width}
        depth={depth}
        height={casingHeight}
        position={[0, bootHeight + casingHeight / 2, 0]}
        inspectionDoors={showInspectionDoors}
      />

      {/* Buckets on belt */}
      <BucketsOnBelt
        width={width}
        depth={depth}
        height={height - 0.5}
        position={[0, height / 2, 0]}
        active={active}
        speed={beltSpeed}
      />

      {/* Head section */}
      <HeadSection width={width} depth={depth} height={headHeight} position={[0, height - headHeight / 2, 0]} active={active} />

      {/* Motor and gearbox */}
      <MotorGearbox position={[-width / 2 - 0.5, height - headHeight / 2, 0]} active={active} rpm={rpm} />

      {/* Maintenance platform */}
      {showPlatform && (
        <MaintenancePlatform width={width + 1.5} depth={depth + 1} position={[0, height - 0.5, depth / 2 + 0.8]} />
      )}

      {/* Data panel */}
      {showDataPanel && (
        <DataPanel position={[width / 2 + 1.5, height / 2, 0]} active={active} rpm={rpm} beltSpeed={beltSpeed} label={label} />
      )}

      {showClickText && (
        <Text position={[0, height + 0.5, 0]} fontSize={0.12} color={COLORS.accentYellow} anchorX="center" anchorY="middle">
          {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
        </Text>
      )}

      {/* Invisible click target */}
      {controlledActive === undefined && (
        <mesh position={[0, height / 2, 0]} onClick={() => setInternalActive(!internalActive)} visible={false}>
          <boxGeometry args={[width * 2, height, depth * 2]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
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
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.5]} />
      <directionalLight
        position={[15, 20, 10]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-far={50}
        shadow-bias={-0.0001}
      />
    </>
  );
}

export function BucketElevatorScene() {
  const [active, setActive] = useState(false);

  return (
    <Canvas shadows camera={{ position: [8, 6, 8], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <BucketElevatorComponent width={1.5} depth={1.2} height={8} rpm={45} beltSpeed={1.2} active={active} label="ELEVATOR-01" />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={5} maxDistance={25} maxPolarAngle={Math.PI / 2.05} target={[0, 4, 0]} />
    </Canvas>
  );
}

export function BucketElevator() {
  return <BucketElevatorScene />;
}

export default BucketElevator;