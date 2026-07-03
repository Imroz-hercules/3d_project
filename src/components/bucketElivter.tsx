'use client';

/**
 * BucketElevator.tsx - INDUSTRIAL BUCKET ELEVATOR
 * ------------------------------------------------------------------------
 * A realistic industrial bucket elevator for vertical material transport
 * in a flour mill digital twin.
 *
 * Features:
 * - Boot section with inlet from screw conveyor
 * - Tall vertical casing with inspection doors
 * - Internal buckets on belt (animated)
 * - Head section with drive pulley and discharge outlet
 * - Motor and gearbox assembly
 * - Support structure and maintenance platform
 * - Interactive controls
 *
 * Usage:
 *   import { BucketElevator } from './BucketElevator';
 *   <BucketElevator position={[0, 0, 0]} height={8} width={1.5} depth={1.2} />
 * ------------------------------------------------------------------------
 */

import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

const COLORS = {
  casingSteel: '#6b7278',
  casingDark: '#4a5058',
  casingLight: '#8a9199',
  frameSteel: '#5a6268',
  frameSteelDark: '#3a454c',
  bucketSteel: '#7a8288',
  beltBlack: '#2a2a2a',
  motorBlue: '#1e3a5f',
  motorDark: '#152a45',
  pulleySteel: '#6b7278',
  platformSteel: '#4a555c',
  accentYellow: '#e0a92c',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   BOOT SECTION (Bottom)
   ========================================================================== */

function BootSection({
  width,
  depth,
  height,
  position,
}: {
  width: number;
  depth: number;
  height: number;
  position: V3;
}) {
  return (
    <group position={position}>
      {/* Main boot housing */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={COLORS.casingSteel}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Inlet opening (from screw conveyor) */}
      <mesh position={[width / 2 + 0.01, 0, 0]}>
        <boxGeometry args={[0.05, height * 0.6, depth * 0.7]} />
        <meshStandardMaterial
          color={COLORS.casingDark}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Inlet flange */}
      <mesh position={[width / 2 + 0.05, 0, 0]}>
        <boxGeometry args={[0.08, height * 0.65, depth * 0.75]} />
        <meshStandardMaterial
          color={COLORS.frameSteel}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>

      {/* Bottom pulley */}
      <mesh position={[0, -height / 2 + 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[width * 0.35, width * 0.35, depth * 0.85, 24]} />
        <meshStandardMaterial
          color={COLORS.pulleySteel}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      {/* Pulley end caps */}
      <mesh position={[0, -height / 2 + 0.15, depth * 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[width * 0.38, width * 0.38, 0.05, 24]} />
        <meshStandardMaterial
          color={COLORS.frameSteelDark}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, -height / 2 + 0.15, -depth * 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[width * 0.38, width * 0.38, 0.05, 24]} />
        <meshStandardMaterial
          color={COLORS.frameSteelDark}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>

      {/* Cleanout door */}
      <mesh position={[0, -height / 2 + 0.02, depth / 2 + 0.01]}>
        <boxGeometry args={[width * 0.6, height * 0.4, 0.04]} />
        <meshStandardMaterial
          color={COLORS.casingDark}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Door handle */}
      <mesh position={[width * 0.25, -height / 2 + 0.02, depth / 2 + 0.04]}>
        <boxGeometry args={[0.08, 0.15, 0.03]} />
        <meshStandardMaterial
          color={COLORS.frameSteel}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      {/* Support legs */}
      {[
        [width / 2 - 0.1, -height / 2 - 0.3, depth / 2 - 0.1],
        [-width / 2 + 0.1, -height / 2 - 0.3, depth / 2 - 0.1],
        [width / 2 - 0.1, -height / 2 - 0.3, -depth / 2 + 0.1],
        [-width / 2 + 0.1, -height / 2 - 0.3, -depth / 2 + 0.1],
      ].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.12, 0.6, 0.12]} />
          <meshStandardMaterial
            color={COLORS.frameSteelDark}
            metalness={0.75}
            roughness={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   VERTICAL CASING
   ========================================================================== */

function VerticalCasing({
  width,
  depth,
  height,
  position,
  inspectionDoors,
}: {
  width: number;
  depth: number;
  height: number;
  position: V3;
  inspectionDoors: boolean;
}) {
  return (
    <group position={position}>
      {/* Main casing */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={COLORS.casingSteel}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Reinforcement ribs */}
      {Array.from({ length: Math.floor(height / 1.5) }, (_, i) => {
        const y = -height / 2 + 0.5 + i * 1.5;
        return (
          <group key={i}>
            <mesh position={[0, y, depth / 2 + 0.01]}>
              <boxGeometry args={[width * 0.95, 0.08, 0.02]} />
              <meshStandardMaterial
                color={COLORS.casingDark}
                metalness={0.75}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0, y, -(depth / 2 + 0.01)]}>
              <boxGeometry args={[width * 0.95, 0.08, 0.02]} />
              <meshStandardMaterial
                color={COLORS.casingDark}
                metalness={0.75}
                roughness={0.3}
              />
            </mesh>
          </group>
        );
      })}

      {/* Inspection doors */}
      {inspectionDoors &&
        Array.from({ length: Math.floor(height / 2) }, (_, i) => {
          const y = -height / 2 + 1 + i * 2;
          return (
            <group key={`door-${i}`}>
              <mesh position={[width / 2 + 0.01, y, 0]}>
                <boxGeometry args={[0.04, 0.8, 0.6]} />
                <meshStandardMaterial
                  color={COLORS.casingDark}
                  metalness={0.7}
                  roughness={0.35}
                />
              </mesh>
              {/* Door bolts */}
              {[
                [width / 2 + 0.02, y + 0.35, 0.25],
                [width / 2 + 0.02, y + 0.35, -0.25],
                [width / 2 + 0.02, y - 0.35, 0.25],
                [width / 2 + 0.02, y - 0.35, -0.25],
              ].map((pos, j) => (
                <mesh key={j} position={pos}>
                  <cylinderGeometry args={[0.025, 0.025, 0.03, 8]} />
                  <meshStandardMaterial
                    color={COLORS.frameSteel}
                    metalness={0.85}
                    roughness={0.25}
                  />
                </mesh>
              ))}
            </group>
          );
        })}
    </group>
  );
}

/* ==========================================================================
   BUCKETS ON BELT
   ========================================================================== */

function BucketsOnBelt({
  width,
  depth,
  height,
  position,
  active,
  speed,
}: {
  width: number;
  depth: number;
  height: number;
  position: V3;
  active: boolean;
  speed: number;
}) {
  const beltRef = useRef<THREE.Group>(null!);
  const bucketCount = Math.floor(height / 0.4);
  const buckets = Array.from({ length: bucketCount }, (_, i) => i);

  useFrame((_, delta) => {
    if (beltRef.current && active) {
      beltRef.current.position.y += speed * delta;
      if (beltRef.current.position.y > 0.4) {
        beltRef.current.position.y = 0;
      }
    }
  });

  return (
    <group position={position}>
      {/* Belt */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width * 0.7, height, 0.05]} />
        <meshStandardMaterial
          color={COLORS.beltBlack}
          metalness={0.3}
          roughness={0.8}
        />
      </mesh>

      {/* Buckets */}
      <group ref={beltRef}>
        {buckets.map((i) => {
          const y = -height / 2 + 0.2 + (i / bucketCount) * height;
          return (
            <group key={i} position={[0, y, 0]}>
              {/* Bucket body */}
              <mesh castShadow>
                <boxGeometry args={[width * 0.6, 0.15, depth * 0.7]} />
                <meshStandardMaterial
                  color={COLORS.bucketSteel}
                  metalness={0.75}
                  roughness={0.3}
                />
              </mesh>
              {/* Bucket front lip */}
              <mesh position={[0, 0, depth * 0.35]}>
                <boxGeometry args={[width * 0.62, 0.17, 0.03]} />
                <meshStandardMaterial
                  color={COLORS.frameSteel}
                  metalness={0.8}
                  roughness={0.25}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

/* ==========================================================================
   HEAD SECTION (Top)
   ========================================================================== */

function HeadSection({
  width,
  depth,
  height,
  position,
  active,
}: {
  width: number;
  depth: number;
  height: number;
  position: V3;
  active: boolean;
}) {
  const pulleyRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (pulleyRef.current && active) {
      pulleyRef.current.rotation.z += delta * 3;
    }
  });

  return (
    <group position={position}>
      {/* Main head housing */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={COLORS.casingSteel}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Drive pulley */}
      <mesh
        ref={pulleyRef}
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[width * 0.4, width * 0.4, depth * 0.85, 24]} />
        <meshStandardMaterial
          color={COLORS.pulleySteel}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      {/* Pulley end caps */}
      <mesh position={[0, 0, depth * 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[width * 0.43, width * 0.43, 0.05, 24]} />
        <meshStandardMaterial
          color={COLORS.frameSteelDark}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 0, -depth * 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[width * 0.43, width * 0.43, 0.05, 24]} />
        <meshStandardMaterial
          color={COLORS.frameSteelDark}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>

      {/* Discharge outlet */}
      <mesh position={[0, height / 2 - 0.1, depth / 2 + 0.3]}>
        <boxGeometry args={[width * 0.8, 0.4, 0.6]} />
        <meshStandardMaterial
          color={COLORS.casingDark}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Outlet flange */}
      <mesh position={[0, height / 2 - 0.1, depth / 2 + 0.6]}>
        <boxGeometry args={[width * 0.85, 0.45, 0.08]} />
        <meshStandardMaterial
          color={COLORS.frameSteel}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>

      {/* Motor mounting plate */}
      <mesh position={[-width / 2 - 0.05, 0, 0]}>
        <boxGeometry args={[0.1, height * 0.6, depth * 0.7]} />
        <meshStandardMaterial
          color={COLORS.frameSteel}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   MOTOR AND GEARBOX
   ========================================================================== */

function MotorGearbox({
  position,
  active,
  rpm,
}: {
  position: V3;
  active: boolean;
  rpm: number;
}) {
  const fanRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += (rpm / 60) * Math.PI * 2 * delta * 1.5;
    }
  });

  return (
    <group position={position}>
      {/* Motor body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.6, 24]} />
        <meshStandardMaterial
          color={COLORS.motorBlue}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Cooling fins */}
      {Array.from({ length: 12 }, (_, i) => {
        const z = -0.25 + (i / 11) * 0.5;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.27, 0.27, 0.015, 24]} />
            <meshStandardMaterial
              color={COLORS.motorDark}
              metalness={0.65}
              roughness={0.35}
            />
          </mesh>
        );
      })}

      {/* Fan cover */}
      <mesh position={[0, 0, 0.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.23, 0.23, 0.08, 24]} />
        <meshStandardMaterial
          color={COLORS.motorDark}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Fan blades */}
      <mesh ref={fanRef} position={[0, 0, 0.38]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.03, 8]} />
        <meshStandardMaterial
          color={COLORS.frameSteelDark}
          metalness={0.75}
          roughness={0.3}
        />
      </mesh>

      {/* Gearbox */}
      <mesh position={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.3]} />
        <meshStandardMaterial
          color={COLORS.frameSteel}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>

      {/* Output shaft */}
      <mesh position={[0, 0, -0.5]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.2, 16]} />
        <meshStandardMaterial
          color={COLORS.pulleySteel}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      {/* Status indicator */}
      <mesh position={[0, 0.27, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
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
   MAINTENANCE PLATFORM
   ========================================================================== */

function MaintenancePlatform({
  width,
  depth,
  position,
}: {
  width: number;
  depth: number;
  position: V3;
}) {
  return (
    <group position={position}>
      {/* Platform surface */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial
          color={COLORS.platformSteel}
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>

      {/* Platform grating pattern */}
      {Array.from({ length: 8 }, (_, i) => {
        const x = -width / 2 + 0.2 + (i / 7) * (width - 0.4);
        return (
          <mesh key={i} position={[x, 0.05, 0]}>
            <boxGeometry args={[0.03, 0.02, depth * 0.9]} />
            <meshStandardMaterial
              color={COLORS.frameSteelDark}
              metalness={0.75}
              roughness={0.3}
            />
          </mesh>
        );
      })}

      {/* Safety railing */}
      <mesh position={[0, 0.5, depth / 2 - 0.05]}>
        <boxGeometry args={[width, 0.04, 0.04]} />
        <meshStandardMaterial
          color={COLORS.accentYellow}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Railing posts */}
      {[-width / 2 + 0.1, 0, width / 2 - 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.25, depth / 2 - 0.05]}>
          <boxGeometry args={[0.04, 0.5, 0.04]} />
          <meshStandardMaterial
            color={COLORS.accentYellow}
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Support brackets */}
      {[
        [width / 2 - 0.1, -0.3, depth / 2 - 0.1],
        [-width / 2 + 0.1, -0.3, depth / 2 - 0.1],
        [width / 2 - 0.1, -0.3, -depth / 2 + 0.1],
        [-width / 2 + 0.1, -0.3, -depth / 2 + 0.1],
      ].map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.08, 0.6, 0.08]} />
          <meshStandardMaterial
            color={COLORS.frameSteelDark}
            metalness={0.75}
            roughness={0.35}
          />
        </mesh>
      ))}
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
  beltSpeed,
  label,
}: {
  position: V3;
  active: boolean;
  rpm: number;
  beltSpeed: number;
  label: string;
}) {
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
          <Text
            key={i}
            position={[-0.9, -i * 0.26, 0]}
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
   MAIN BUCKET ELEVATOR COMPONENT
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
      <BootSection
        width={width}
        depth={depth}
        height={bootHeight}
        position={[0, bootHeight / 2, 0]}
      />

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
      <HeadSection
        width={width}
        depth={depth}
        height={headHeight}
        position={[0, height - headHeight / 2, 0]}
        active={active}
      />

      {/* Motor and gearbox */}
      <MotorGearbox
        position={[-width / 2 - 0.5, height - headHeight / 2, 0]}
        active={active}
        rpm={rpm}
      />

      {/* Maintenance platform */}
      {showPlatform && (
        <MaintenancePlatform
          width={width + 1.5}
          depth={depth + 1}
          position={[0, height - 0.5, depth / 2 + 0.8]}
        />
      )}

      {/* Data panel */}
      {showDataPanel && (
        <DataPanel
          position={[width / 2 + 1.5, height / 2, 0]}
          active={active}
          rpm={rpm}
          beltSpeed={beltSpeed}
          label={label}
        />
      )}

      {showClickText && (
        <Text
          position={[0, height + 0.5, 0]}
          fontSize={0.12}
          color={COLORS.accentYellow}
          anchorX="center"
          anchorY="middle"
        >
          {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
        </Text>
      )}

      {/* Invisible click target — only when not externally controlled */}
      {controlledActive === undefined && (
        <mesh
          position={[0, height / 2, 0]}
          onClick={() => setInternalActive(!internalActive)}
          visible={false}
        >
          <boxGeometry args={[width * 2, height, depth * 2]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  );
}

/* ==========================================================================
   ENVIRONMENT
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

export function BucketElevatorScene() {
  const [active, setActive] = useState(false);

  return (
    <Canvas shadows camera={{ position: [8, 6, 8], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <BucketElevatorComponent
        width={1.5}
        depth={1.2}
        height={8}
        rpm={45}
        beltSpeed={1.2}
        active={active}
        label="ELEVATOR-01"
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 4, 0]}
      />
    </Canvas>
  );
}

export function BucketElevator() {
  return <BucketElevatorScene />;
}

export default BucketElevator;