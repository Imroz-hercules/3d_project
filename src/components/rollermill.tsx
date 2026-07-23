'use client';

/**
 * RollerMill.tsx - INDUSTRIAL ROLLER MILL (CENTERPIECE MACHINE)
 * ------------------------------------------------------------------------
 * A highly detailed industrial roller mill for a flour mill digital twin.
 * This is the most important machine where wheat is ground between precision
 * steel rollers. Features two large grinding rollers, side-mounted motors,
 * adjustment handwheels, inspection doors, and a control panel.
 * 
 * Key Features:
 * - Large rectangular main housing with industrial styling
 * - Top feed hopper with feed rollers
 * - Two large grinding rollers (animated rotation)
 * - Side-mounted drive motors (one on each side)
 * - Belt drive guards
 * - Adjustment handwheels (front)
 * - Front inspection doors (interactive, can open)
 * - Bottom outlet chute
 * - Control panel with status indicators
 * - Support frame with heavy legs
 * - Animated roller rotation and grain flow
 * - Floating PLC data panel
 * 
 * Usage:
 *   import { RollerMill } from './RollerMill';
 *   <RollerMill position={[0, 0, 0]} active={true} />
 * ------------------------------------------------------------------------
 */

import { useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import {
  matPaintBlue,
  matPaintDark,
  matPaintedSteel,
  matRailYellow,
  matRubber,
  matSteel,
  matSteelDark,
  matStructureSteel,
} from '../materials';
import { Nameplate, WarningLabel } from './machineParts/Nameplate';

type V3 = [number, number, number];

/** Accents / emissives that stay local (not in shared PBR library). */
const COLORS = {
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  accentYellow: '#e0a92c',
  housingLight: '#8a9199',
  // Fallback tints for hover / leftover local mats (prefer shared mats on meshes)
  housingSteel: '#6b7278',
  housingDark: '#4a5058',
  rollerSteel: '#a0a8b0',
  rollerDark: '#7a8288',
  motorBlue: '#1e3a5f',
  motorDark: '#152a45',
  frameSteel: '#4a555c',
  frameSteelDark: '#3a454c',
  handwheelBlack: '#2a2a2a',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   SUPPORT FRAME
   ========================================================================== */

function SupportFrame({ width, depth, height: _height }: { width: number; depth: number; height: number }) {
  void _height;
  const legHeight = 1.5;
  const legPositions: V3[] = [
    [width / 2 - 0.2, -legHeight / 2, depth / 2 - 0.2],
    [-width / 2 + 0.2, -legHeight / 2, depth / 2 - 0.2],
    [width / 2 - 0.2, -legHeight / 2, -depth / 2 + 0.2],
    [-width / 2 + 0.2, -legHeight / 2, -depth / 2 + 0.2],
  ];

  return (
    <group>
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow={false} receiveShadow={false} dispose={null} material={matPaintedSteel}>
          <boxGeometry args={[0.25, legHeight, 0.25]} />
        </mesh>
      ))}
      {legPositions.map((pos, i) => (
        <mesh key={`base-${i}`} position={[pos[0], -legHeight / 2 + 0.05, pos[2]]} dispose={null} material={matStructureSteel}>
          <boxGeometry args={[0.4, 0.1, 0.4]} />
        </mesh>
      ))}
      <mesh position={[0, -legHeight / 2 + 0.5, 0]} castShadow={false} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[width - 0.5, 0.1, 0.1]} />
      </mesh>
      <mesh position={[0, -legHeight / 2 + 0.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow={false} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[depth - 0.5, 0.1, 0.1]} />
      </mesh>
      {/* Oil stain under drive side */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width * 0.25, -legHeight + 0.02, 0]}>
        <circleGeometry args={[0.45, 16]} />
        <meshStandardMaterial color="#6a6558" transparent opacity={0.35} roughness={0.98} metalness={0} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   MAIN HOUSING
   ========================================================================== */

function MainHousing({ width, height, depth }: { width: number; height: number; depth: number }) {
  const boltPositions: V3[] = [
    [width * 0.35, height * 0.35, depth / 2 + 0.03],
    [-width * 0.35, height * 0.35, depth / 2 + 0.03],
    [width * 0.35, -height * 0.25, depth / 2 + 0.03],
    [-width * 0.35, -height * 0.25, depth / 2 + 0.03],
  ];

  return (
    <group>
      <mesh castShadow={false} receiveShadow={false} dispose={null} material={matSteel}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>
      <mesh position={[0, height / 2 - 0.1, 0]} dispose={null} material={matSteelDark}>
        <boxGeometry args={[width + 0.05, 0.2, depth + 0.05]} />
      </mesh>
      <mesh position={[0, -height / 2 + 0.1, 0]} dispose={null} material={matSteelDark}>
        <boxGeometry args={[width + 0.05, 0.2, depth + 0.05]} />
      </mesh>
      <mesh position={[width / 2 + 0.02, 0, 0]} dispose={null} material={matSteelDark}>
        <boxGeometry args={[0.04, height * 0.8, depth * 0.9]} />
      </mesh>
      <mesh position={[-width / 2 - 0.02, 0, 0]} dispose={null} material={matSteelDark}>
        <boxGeometry args={[0.04, height * 0.8, depth * 0.9]} />
      </mesh>
      {/* Cover corner bolts */}
      {boltPositions.map((p, i) => (
        <mesh key={i} position={p} rotation={[Math.PI / 2, 0, 0]} dispose={null} material={matSteelDark}>
          <cylinderGeometry args={[0.025, 0.025, 0.04, 6]} />
        </mesh>
      ))}
      {/* Yellow guard strip */}
      <mesh position={[0, -height / 2 + 0.35, depth / 2 + 0.02]} dispose={null} material={matRailYellow}>
        <boxGeometry args={[width * 0.9, 0.08, 0.02]} />
      </mesh>
      <Nameplate
        position={[0, height * 0.28, depth / 2 + 0.02]}
        width={width * 0.42}
        height={0.16}
        title="ROLLER MILL"
        subtitle="RM-01"
      />
      <WarningLabel
        position={[width * 0.28, -height * 0.15, depth / 2 + 0.02]}
        title="WARNING"
        subtitle="MOVING ROLLS"
      />
    </group>
  );
}

/* ==========================================================================
   FEED HOPPER
   ========================================================================== */

function FeedHopper({ width, depth, position }: { width: number; depth: number; position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow={false} receiveShadow={false} dispose={null} material={matSteel}>
        <boxGeometry args={[width * 0.7, 0.8, depth * 0.7]} />
      </mesh>
      <mesh position={[0, 0.42, 0]} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[width * 0.75, 0.06, depth * 0.75]} />
      </mesh>
      <mesh position={[0, -0.42, 0]} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[width * 0.5, 0.06, depth * 0.5]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   GRINDING ROLLERS (Internal, Animated)
   ========================================================================== */

function GrindingRollers({ width: _width, depth, active }: { width: number; depth: number; active: boolean }) {
  void _width;
  const roller1Ref = useRef<THREE.Mesh>(null!);
  const roller2Ref = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (active) {
      // Two rollers rotate in opposite directions at slightly different speeds
      if (roller1Ref.current) roller1Ref.current.rotation.x += delta * 8;
      if (roller2Ref.current) roller2Ref.current.rotation.x -= delta * 8.5;
    }
  });

  const rollerLength = depth * 0.85;
  const rollerRadius = 0.3;

  return (
    <group>
      {/* Roller 1 (Fast roll) */}
      <mesh ref={roller1Ref} position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow={false} dispose={null} material={matSteel}>
        <cylinderGeometry args={[rollerRadius, rollerRadius, rollerLength, 32]} />
      </mesh>

      <mesh ref={roller2Ref} position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow={false} dispose={null} material={matSteel}>
        <cylinderGeometry args={[rollerRadius, rollerRadius, rollerLength, 32]} />
      </mesh>

      {[-0.2, 0.2].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0, rollerLength / 2 + 0.05]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteelDark}>
            <cylinderGeometry args={[rollerRadius * 1.1, rollerRadius * 1.1, 0.08, 32]} />
          </mesh>
          <mesh position={[x, 0, -(rollerLength / 2 + 0.05)]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matSteelDark}>
            <cylinderGeometry args={[rollerRadius * 1.1, rollerRadius * 1.1, 0.08, 32]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   SIDE MOTORS
   ========================================================================== */

function SideMotors({ position, active, side }: { position: V3; active: boolean; side: 'left' | 'right' }) {
  const fanRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 12;
    }
  });

  const xOffset = side === 'left' ? -1 : 1;

  return (
    <group position={position}>
      {/* Motor body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow={false} dispose={null} material={matPaintBlue}>
        <cylinderGeometry args={[0.35, 0.35, 0.7, 24]} />
      </mesh>

      {/* Cooling fins */}
      {Array.from({ length: 12 }, (_, i) => {
        const z = -0.3 + (i / 11) * 0.6;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matPaintDark}>
            <cylinderGeometry args={[0.37, 0.37, 0.02, 24]} />
          </mesh>
        );
      })}

      {/* Fan cover */}
      <mesh position={[0, 0, 0.4]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matPaintDark}>
        <cylinderGeometry args={[0.33, 0.33, 0.08, 24]} />
      </mesh>

      {/* Fan blades */}
      <mesh ref={fanRef} position={[0, 0, 0.42]} rotation={[0, 0, Math.PI / 2]} dispose={null} material={matStructureSteel}>
        <cylinderGeometry args={[0.28, 0.28, 0.03, 8]} />
      </mesh>

      {/* Belt guard */}
      <mesh position={[xOffset * 0.15, 0, -0.4]} castShadow={false} dispose={null} material={matRailYellow}>
        <boxGeometry args={[0.3, 0.5, 0.4]} />
      </mesh>
      {/* Rubber belt hint */}
      <mesh position={[xOffset * 0.15, 0, -0.55]} dispose={null} material={matRubber}>
        <boxGeometry args={[0.08, 0.35, 0.06]} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.37, 0]}>
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
   ADJUSTMENT HANDWHEELS
   ========================================================================== */

function AdjustmentHandwheels({ position, active }: { position: V3; active: boolean }) {
  const wheel1Ref = useRef<THREE.Mesh>(null!);
  const wheel2Ref = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (active) {
      if (wheel1Ref.current) wheel1Ref.current.rotation.z += delta * 0.5;
      if (wheel2Ref.current) wheel2Ref.current.rotation.z -= delta * 0.5;
    }
  });

  return (
    <group position={position}>
      <mesh ref={wheel1Ref} position={[-0.3, 0, 0]} castShadow={false} dispose={null} material={matRubber}>
        <torusGeometry args={[0.15, 0.03, 8, 24]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.3, 0, 0]} rotation={[0, 0, (i / 4) * Math.PI]} dispose={null} material={matRubber}>
          <boxGeometry args={[0.02, 0.28, 0.02]} />
        </mesh>
      ))}

      <mesh ref={wheel2Ref} position={[0.3, 0, 0]} castShadow={false} dispose={null} material={matRubber}>
        <torusGeometry args={[0.15, 0.03, 8, 24]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0.3, 0, 0]} rotation={[0, 0, (i / 4) * Math.PI]} dispose={null} material={matRubber}>
          <boxGeometry args={[0.02, 0.28, 0.02]} />
        </mesh>
      ))}

      <Text position={[-0.3, -0.25, 0]} fontSize={0.06} color="#3a454c" anchorX="center" anchorY="middle">
        GAP ADJ
      </Text>
      <Text position={[0.3, -0.25, 0]} fontSize={0.06} color="#3a454c" anchorX="center" anchorY="middle">
        GAP ADJ
      </Text>
    </group>
  );
}

/* ==========================================================================
   INSPECTION DOORS (Interactive)
   ========================================================================== */

function InspectionDoors({ width, height, depth, isOpen, onToggle }: { 
  width: number; 
  height: number; 
  depth: number; 
  isOpen: boolean; 
  onToggle: () => void; 
}) {
  const door1Ref = useRef<THREE.Group>(null!);
  const door2Ref = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    const targetRotation = isOpen ? -Math.PI / 2.5 : 0;
    if (door1Ref.current) {
      door1Ref.current.rotation.y = THREE.MathUtils.damp(door1Ref.current.rotation.y, targetRotation, 4, delta);
    }
    if (door2Ref.current) {
      door2Ref.current.rotation.y = THREE.MathUtils.damp(door2Ref.current.rotation.y, -targetRotation, 4, delta);
    }
  });

  const doorWidth = width * 0.45;
  const doorHeight = height * 0.7;

  return (
    <group
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onToggle(); }}
    >
      <group ref={door1Ref} position={[-doorWidth / 2 - 0.02, 0, depth / 2 + 0.02]}>
        <mesh castShadow={false} receiveShadow={false} dispose={null} material={matSteel} scale={hovered ? 1.01 : 1}>
          <boxGeometry args={[doorWidth, doorHeight, 0.08]} />
        </mesh>
        <mesh position={[0, 0, 0.05]} dispose={null} material={matSteelDark}>
          <boxGeometry args={[doorWidth - 0.1, doorHeight - 0.1, 0.02]} />
        </mesh>
        <mesh position={[doorWidth / 2 - 0.1, 0, 0.08]} dispose={null} material={matStructureSteel}>
          <boxGeometry args={[0.05, 0.25, 0.05]} />
        </mesh>
      </group>

      <group ref={door2Ref} position={[doorWidth / 2 + 0.02, 0, depth / 2 + 0.02]}>
        <mesh castShadow={false} receiveShadow={false} dispose={null} material={matSteel} scale={hovered ? 1.01 : 1}>
          <boxGeometry args={[doorWidth, doorHeight, 0.08]} />
        </mesh>
        <mesh position={[0, 0, 0.05]} dispose={null} material={matSteelDark}>
          <boxGeometry args={[doorWidth - 0.1, doorHeight - 0.1, 0.02]} />
        </mesh>
        <mesh position={[-doorWidth / 2 + 0.1, 0, 0.08]} dispose={null} material={matStructureSteel}>
          <boxGeometry args={[0.05, 0.25, 0.05]} />
        </mesh>
      </group>
    </group>
  );
}

/* ==========================================================================
   OUTLET CHUTE
   ========================================================================== */

function OutletChute({ width, depth, position }: { width: number; depth: number; position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow={false} receiveShadow={false} dispose={null} material={matSteel}>
        <boxGeometry args={[width * 0.6, 0.8, depth * 0.6]} />
      </mesh>
      <mesh position={[0, -0.42, 0]} dispose={null} material={matStructureSteel}>
        <boxGeometry args={[width * 0.65, 0.06, depth * 0.65]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   CONTROL PANEL
   ========================================================================== */

function ControlPanel({ position, active }: { position: V3; active: boolean }) {
  return (
    <group position={position}>
      <mesh castShadow={false} dispose={null} material={matPaintedSteel}>
        <boxGeometry args={[0.5, 0.7, 0.15]} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[0.45, 0.65, 0.02]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[-0.1, 0.2, 0.1]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial
          color={active ? COLORS.accentGreen : COLORS.accentRed}
          emissive={active ? COLORS.accentGreen : COLORS.accentRed}
          emissiveIntensity={0.9}
        />
      </mesh>
      <mesh position={[0, 0.2, 0.1]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={COLORS.accentYellow} emissive={COLORS.accentYellow} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.1, 0.2, 0.1]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
      {[-0.1, 0, 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.1]} dispose={null} material={matStructureSteel}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   DATA PANEL (PLC Data)
   ========================================================================== */

function DataPanel({
  position,
  active,
}: {
  position: V3;
  active: boolean;
}) {
  const lines = [
    { text: `ROLLER MILL RM-500`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ${active ? 'RUNNING' : 'STOPPED'}`, size: 0.13, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Motor RPM: ${active ? '1450' : '0'}`, size: 0.13, color: '#3a3a3a' },
    { text: `Roll Speed: ${active ? '520' : '0'} RPM`, size: 0.13, color: '#3a3a3a' },
    { text: `Roll Gap: 0.35 mm`, size: 0.13, color: '#3a3a3a' },
    { text: `Motor Load: ${active ? '58' : '0'}%`, size: 0.13, color: '#3a3a3a' },
    { text: `Temperature: ${active ? '42' : '24'}°C`, size: 0.13, color: '#3a3a3a' },
    { text: `Alarm: OFF`, size: 0.13, color: COLORS.accentGreen },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.45, -0.02]}>
          <planeGeometry args={[2.2, 2.0]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.45, -0.015]}>
          <planeGeometry args={[2.24, 2.04]} />
          <meshStandardMaterial color={COLORS.accentYellow} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {lines.map((line, i) => (
          <Text
            key={i}
            position={[-1, -i * 0.22, 0]}
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
   MAIN ROLLER MILL COMPONENT
   ========================================================================== */

export interface RollerMillProps {
  position?: V3;
  width?: number;
  height?: number;
  depth?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function RollerMillComponent({
  position = [0, 0, 0],
  width = 2.5,
  height = 2.2,
  depth = 1.8,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
}: RollerMillProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  return (
    <group position={position}>
      {/* 1. Support Frame */}
      <SupportFrame width={width} depth={depth} height={1.5} />

      {/* 2. Main Housing */}
      <MainHousing width={width} height={height} depth={depth} />

      {/* 3. Feed Hopper (Top) */}
      <FeedHopper width={width} depth={depth} position={[0, height / 2 + 0.4, 0]} />

      {/* 4. Grinding Rollers (Inside) */}
      <GrindingRollers width={width} depth={depth} active={active} />

      {/* 5. Side Motors */}
      <SideMotors position={[width / 2 + 0.5, 0, 0]} active={active} side="right" />
      <SideMotors position={[-width / 2 - 0.5, 0, 0]} active={active} side="left" />

      {/* 6. Adjustment Handwheels (Front) */}
      <AdjustmentHandwheels position={[0, -height * 0.2, depth / 2 + 0.2]} active={active} />

      {/* 7. Inspection Doors (Front, Interactive) */}
      <InspectionDoors 
        width={width} 
        height={height} 
        depth={depth} 
        isOpen={doorsOpen} 
        onToggle={() => setDoorsOpen(!doorsOpen)} 
      />

      {/* 8. Outlet Chute (Bottom) */}
      <OutletChute width={width} depth={depth} position={[0, -height / 2 - 0.4, 0]} />

      {/* 9. Control Panel (Side) */}
      <ControlPanel position={[width / 2 + 0.1, height * 0.2, depth / 2 + 0.1]} active={active} />

      {/* 10. Grain Flow Animation */}
      {active && (
        <Sparkles
          count={80}
          scale={[width * 0.5, height + 1, depth * 0.5]}
          size={3}
          speed={2}
          position={[0, 0, 0]}
          color="#e8d5b5"
        />
      )}

      {showDataPanel && (
        <DataPanel
          position={[width / 2 + 2, height / 2, 0]}
          active={active}
        />
      )}

      {showClickText && (
        <>
          <Text
            position={[0, height / 2 + 1.2, depth / 2 + 0.3]}
            fontSize={0.1}
            color={COLORS.accentCyan}
            anchorX="center"
            anchorY="middle"
          >
            {doorsOpen ? '● DOORS OPEN' : '○ CLICK DOORS TO INSPECT'}
          </Text>
          <Text
            position={[0, -height / 2 - 1, depth / 2 + 0.3]}
            fontSize={0.1}
            color={COLORS.accentCyan}
            anchorX="center"
            anchorY="middle"
          >
            {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
          </Text>
        </>
      )}

      {/* Invisible Click Targets */}
      <mesh
        position={[0, 0, 0]}
        onClick={() => setInternalActive(!internalActive)}
        visible={false}
      >
        <boxGeometry args={[width + 2, height + 2, depth + 2]} />
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.76, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[80, 80, '#5c5c54', '#79796e']} position={[0, -0.75, 0]} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} />
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

export function RollerMillScene() {
  const [active, setActive] = useState(true);

  return (
    <Canvas shadows camera={{ position: [8, 6, 8], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <RollerMillComponent
        width={2.5}
        height={2.2}
        depth={1.8}
        active={active}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 1, 0]}
      />
    </Canvas>
  );
}

export function RollerMill() {
  return <RollerMillScene />;
}

export default RollerMill;