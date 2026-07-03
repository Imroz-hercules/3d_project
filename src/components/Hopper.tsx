'use client';

/**
 * Hopper.tsx - EXACT REFERENCE MATCH
 * ------------------------------------------------------------------------
 * Matches the cgtrader reference image exactly:
 * - Large square funnel hopper with wide top opening
 * - Dark blue interior
 * - Diagonal support beams underneath
 * - Glass-enclosed control room on the side
 * - Vertical support columns
 * - Conveyor belt extending to the right
 * - Motorized drive unit at conveyor end
 * - Discharge chute/hood over conveyor
 * ------------------------------------------------------------------------
 */

import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text } from '@react-three/drei';
import * as THREE from 'three';
import { FlourFill } from './MaterialFlow';

type V3 = [number, number, number];

const COLORS = {
  steel: '#8a9199',
  steelDark: '#5a6268',
  steelLight: '#a8b0b8',
  frameSteel: '#6b7278',
  frameSteelDark: '#4a5058',
  hopperInterior: '#1a3a8a',
  hopperInteriorDark: '#0d1f5c',
  glass: '#a8d4f0',
  glassFrame: '#4a555c',
  conveyorBelt: '#2a2a2a',
  conveyorFrame: '#5a6268',
  motorBlue: '#1e3a5f',
  motorDark: '#152a45',
  concrete: '#9a9a92',
  accentYellow: '#e0a92c',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
} as const;

/* ==========================================================================
   STRUT HELPER
   ========================================================================== */

function Strut({
  start,
  end,
  radius = 0.06,
  color = COLORS.frameSteel,
}: {
  start: V3;
  end: V3;
  radius?: number;
  color?: string;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const startV = new THREE.Vector3(...start);
    const endV = new THREE.Vector3(...end);
    const dir = new THREE.Vector3().subVectors(endV, startV);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(startV, endV).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    return { position: mid, quaternion: quat, length: len };
  }, [start, end]);

  return (
    <mesh position={position} quaternion={quaternion} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial color={color} metalness={0.75} roughness={0.35} />
    </mesh>
  );
}

/* ==========================================================================
   LARGE SQUARE HOPPER FUNNEL (top section)
   ========================================================================== */

function HopperFunnel({
  topWidth,
  topDepth,
  bottomWidth,
  bottomDepth,
  height,
  baseY,
  showInterior = true,
}: {
  topWidth: number;
  topDepth: number;
  bottomWidth: number;
  bottomDepth: number;
  height: number;
  baseY: number;
  showInterior?: boolean;
}) {
  // Create a tapered box using a custom geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const hw = topWidth / 2;
    const hd = topDepth / 2;
    const bw = bottomWidth / 2;
    const bd = bottomDepth / 2;
    const h = height;

    // 8 vertices: 4 top corners, 4 bottom corners
    const vertices = new Float32Array([
      // Top face (y = h)
      -hw, h, -hd,
      hw, h, -hd,
      hw, h, hd,
      -hw, h, hd,
      // Bottom face (y = 0)
      -bw, 0, -bd,
      bw, 0, -bd,
      bw, 0, bd,
      -bw, 0, bd,
    ]);

    // 6 faces, 2 triangles each = 36 indices
    const indices = [
      // Top face
      0, 2, 1, 0, 3, 2,
      // Bottom face
      4, 5, 6, 4, 6, 7,
      // Front face (z = +)
      3, 7, 6, 3, 6, 2,
      // Back face (z = -)
      0, 1, 5, 0, 5, 4,
      // Right face (x = +)
      1, 2, 6, 1, 6, 5,
      // Left face (x = -)
      0, 4, 7, 0, 7, 3,
    ];

    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [topWidth, topDepth, bottomWidth, bottomDepth, height]);

  return (
    <group position={[0, baseY, 0]}>
      {/* Outer shell */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={COLORS.steel}
          metalness={0.65}
          roughness={0.4}
        />
      </mesh>

      {showInterior && (
        <mesh geometry={geometry} position={[0, 0.02, 0]} scale={[0.94, 0.94, 0.94]}>
          <meshStandardMaterial
            color={COLORS.hopperInteriorDark}
            metalness={0.2}
            roughness={0.7}
            side={THREE.BackSide}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      )}

      {/* Top rim frame */}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[topWidth + 0.15, 0.12, topDepth + 0.15]} />
        <meshStandardMaterial color={COLORS.steelLight} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Top rim inner edge — subtle lip only */}
      <mesh position={[0, height + 0.01, 0]}>
        <boxGeometry args={[topWidth - 0.1, 0.04, topDepth - 0.1]} />
        <meshStandardMaterial color={COLORS.steelDark} metalness={0.6} roughness={0.45} />
      </mesh>

      {/* Bottom outlet flange */}
      <mesh position={[0, -0.03, 0]}>
        <boxGeometry args={[bottomWidth + 0.15, 0.06, bottomDepth + 0.15]} />
        <meshStandardMaterial color={COLORS.steelLight} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[bottomWidth - 0.05, 0.04, bottomDepth - 0.05]} />
        <meshStandardMaterial color={COLORS.hopperInteriorDark} metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   DIAGONAL SUPPORT BEAMS (underneath hopper)
   ========================================================================== */

function DiagonalSupports({
  topWidth,
  topDepth,
  bottomWidth,
  bottomDepth,
  height,
  baseY,
}: {
  topWidth: number;
  topDepth: number;
  bottomWidth: number;
  bottomDepth: number;
  height: number;
  baseY: number;
}) {
  const tw = topWidth / 2;
  const td = topDepth / 2;
  const bw = bottomWidth / 2;
  const bd = bottomDepth / 2;

  // Diagonal beams from top corners to bottom center area
  const diagonals: { start: V3; end: V3 }[] = [];

  // Main corner diagonals
  diagonals.push({ start: [-tw, baseY + height, -td], end: [-bw, baseY, -bd] });
  diagonals.push({ start: [tw, baseY + height, -td], end: [bw, baseY, -bd] });
  diagonals.push({ start: [tw, baseY + height, td], end: [bw, baseY, bd] });
  diagonals.push({ start: [-tw, baseY + height, td], end: [-bw, baseY, bd] });

  // Cross bracing (X pattern on each face)
  // Front face
  diagonals.push({ start: [-tw, baseY + height, td], end: [bw, baseY, bd] });
  diagonals.push({ start: [tw, baseY + height, td], end: [-bw, baseY, bd] });
  // Back face
  diagonals.push({ start: [-tw, baseY + height, -td], end: [bw, baseY, -bd] });
  diagonals.push({ start: [tw, baseY + height, -td], end: [-bw, baseY, -bd] });

  // Additional mid-level supports
  const midY = baseY + height * 0.5;
  const midW = (tw + bw) / 2;
  const midD = (td + bd) / 2;

  diagonals.push({ start: [-midW, midY, -midD], end: [-bw, baseY, -bd] });
  diagonals.push({ start: [midW, midY, -midD], end: [bw, baseY, -bd] });
  diagonals.push({ start: [midW, midY, midD], end: [bw, baseY, bd] });
  diagonals.push({ start: [-midW, midY, midD], end: [-bw, baseY, bd] });

  return (
    <group>
      {diagonals.map((d, i) => (
        <Strut key={i} start={d.start} end={d.end} radius={0.08} color={COLORS.frameSteel} />
      ))}
    </group>
  );
}

/* ==========================================================================
   VERTICAL SUPPORT COLUMNS
   ========================================================================== */

function SupportColumns({
  width,
  depth,
  height,
  baseY,
}: {
  width: number;
  depth: number;
  height: number;
  baseY: number;
}) {
  const columns: V3[] = [
    [width / 2 - 0.1, baseY + height / 2, depth / 2 - 0.1],
    [-width / 2 + 0.1, baseY + height / 2, depth / 2 - 0.1],
    [width / 2 - 0.1, baseY + height / 2, -depth / 2 + 0.1],
    [-width / 2 + 0.1, baseY + height / 2, -depth / 2 + 0.1],
    // Additional mid columns
    [0, baseY + height / 2, depth / 2 - 0.1],
    [0, baseY + height / 2, -depth / 2 + 0.1],
  ];

  return (
    <group>
      {columns.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={[0.15, height, 0.15]} />
          <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.75} roughness={0.35} />
        </mesh>
      ))}

      {/* Column base plates */}
      {columns.map((pos, i) => (
        <mesh key={`base-${i}`} position={[pos[0], baseY + 0.05, pos[2]]}>
          <boxGeometry args={[0.3, 0.1, 0.3]} />
          <meshStandardMaterial color={COLORS.steelDark} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   GLASS CONTROL ROOM
   ========================================================================== */

function ControlRoom({
  width,
  height,
  depth,
  position,
}: {
  width: number;
  height: number;
  depth: number;
  position: V3;
}) {
  return (
    <group position={position}>
      {/* Steel frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={COLORS.glassFrame}
          metalness={0.7}
          roughness={0.35}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Glass panels - front */}
      <mesh position={[0, 0, depth / 2 + 0.01]}>
        <planeGeometry args={[width * 0.95, height * 0.95]} />
        <meshPhysicalMaterial
          color={COLORS.glass}
          transparent
          opacity={0.35}
          roughness={0.05}
          transmission={0.6}
          thickness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glass panels - side */}
      <mesh position={[width / 2 + 0.01, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth * 0.95, height * 0.95]} />
        <meshPhysicalMaterial
          color={COLORS.glass}
          transparent
          opacity={0.35}
          roughness={0.05}
          transmission={0.6}
          thickness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glass panels - back */}
      <mesh position={[0, 0, -(depth / 2 + 0.01)]}>
        <planeGeometry args={[width * 0.95, height * 0.95]} />
        <meshPhysicalMaterial
          color={COLORS.glass}
          transparent
          opacity={0.3}
          roughness={0.05}
          transmission={0.5}
          thickness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Frame dividers - vertical */}
      {[-width / 3, 0, width / 3].map((x, i) => (
        <mesh key={i} position={[x, 0, depth / 2 + 0.02]}>
          <boxGeometry args={[0.04, height, 0.04]} />
          <meshStandardMaterial color={COLORS.glassFrame} metalness={0.75} roughness={0.3} />
        </mesh>
      ))}

      {/* Frame dividers - horizontal */}
      {[-height / 3, 0, height / 3].map((y, i) => (
        <mesh key={i} position={[0, y, depth / 2 + 0.02]}>
          <boxGeometry args={[width, 0.04, 0.04]} />
          <meshStandardMaterial color={COLORS.glassFrame} metalness={0.75} roughness={0.3} />
        </mesh>
      ))}

      {/* Door */}
      <mesh position={[width * 0.15, 0, depth / 2 + 0.03]}>
        <boxGeometry args={[width * 0.3, height * 0.85, 0.05]} />
        <meshPhysicalMaterial
          color={COLORS.glass}
          transparent
          opacity={0.4}
          roughness={0.05}
          transmission={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Door frame */}
      <mesh position={[width * 0.15, 0, depth / 2 + 0.04]}>
        <boxGeometry args={[width * 0.32, height * 0.87, 0.02]} />
        <meshStandardMaterial color={COLORS.glassFrame} metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Door handle */}
      <mesh position={[width * 0.15 + width * 0.12, 0, depth / 2 + 0.08]}>
        <boxGeometry args={[0.03, 0.15, 0.04]} />
        <meshStandardMaterial color={COLORS.steelDark} metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   CONVEYOR BELT SYSTEM
   ========================================================================== */

function ConveyorSystem({
  length,
  width,
  height,
  position,
  active,
  onToggle,
}: {
  length: number;
  width: number;
  height: number;
  position: V3;
  active: boolean;
  onToggle: () => void;
}) {
  const beltRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (beltRef.current && active) {
      const mat = beltRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.05 + Math.sin(clock.elapsedTime * 3) * 0.03;
    }
  });

  return (
    <group position={position}>
      {/* Main conveyor frame/trough */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, height * 0.3, width]} />
        <meshStandardMaterial color={COLORS.conveyorFrame} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Side rails */}
      <mesh position={[0, height * 0.15, width / 2 - 0.05]} castShadow>
        <boxGeometry args={[length, height * 0.2, 0.08]} />
        <meshStandardMaterial color={COLORS.steelDark} metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[0, height * 0.15, -(width / 2 - 0.05)]} castShadow>
        <boxGeometry args={[length, height * 0.2, 0.08]} />
        <meshStandardMaterial color={COLORS.steelDark} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Conveyor belt surface */}
      <mesh
        ref={beltRef}
        position={[0, height * 0.32, 0]}
        castShadow
        receiveShadow
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onToggle(); }}
      >
        <boxGeometry args={[length * 0.97, 0.04, width * 0.85]} />
        <meshStandardMaterial
          color={hovered ? '#4a4a4a' : COLORS.conveyorBelt}
          metalness={0.3}
          roughness={0.9}
          emissive={active ? '#222222' : '#000000'}
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Belt texture lines */}
      {Array.from({ length: 20 }, (_, i) => {
        const x = -length / 2 + 0.3 + (i / 19) * (length - 0.6);
        return (
          <mesh key={i} position={[x, height * 0.34, 0]}>
            <boxGeometry args={[0.02, 0.005, width * 0.8]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.4} roughness={0.8} />
          </mesh>
        );
      })}

      {/* Support legs under conveyor */}
      {[-length / 3, 0, length / 3].map((x, i) => (
        <group key={i}>
          <mesh position={[x, -height * 0.3, width / 2 - 0.1]} castShadow>
            <boxGeometry args={[0.08, height * 0.6, 0.08]} />
            <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.75} roughness={0.35} />
          </mesh>
          <mesh position={[x, -height * 0.3, -(width / 2 - 0.1)]} castShadow>
            <boxGeometry args={[0.08, height * 0.6, 0.08]} />
            <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.75} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* Cross bracing under conveyor */}
      {[-length / 3, 0, length / 3].map((x, i) => (
        <mesh key={`brace-${i}`} position={[x, -height * 0.15, 0]}>
          <boxGeometry args={[0.04, 0.04, width * 0.9]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   CONVEYOR DRIVE MOTOR (at end of conveyor)
   ========================================================================== */

function ConveyorDriveMotor({
  position,
  active,
}: {
  position: V3;
  active: boolean;
}) {
  const fanRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 5;
    }
  });

  return (
    <group position={position}>
      {/* Motor body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.7, 24]} />
        <meshStandardMaterial color={COLORS.motorBlue} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Cooling fins */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = -0.3 + (i / 9) * 0.6;
        return (
          <mesh key={i} position={[0, 0, z]}>
            <cylinderGeometry args={[0.32, 0.32, 0.02, 24]} />
            <meshStandardMaterial color={COLORS.motorDark} metalness={0.65} roughness={0.35} />
          </mesh>
        );
      })}

      {/* Gearbox */}
      <mesh position={[0, 0, -0.4]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.2]} />
        <meshStandardMaterial color={COLORS.steelDark} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Drive shaft to roller */}
      <mesh position={[0, 0, -0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.2, 16]} />
        <meshStandardMaterial color={COLORS.steel} metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Fan cover */}
      <mesh ref={fanRef} position={[0, 0, 0.38]}>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 8]} />
        <meshStandardMaterial color={COLORS.motorDark} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Status light */}
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial
          color={active ? COLORS.accentGreen : COLORS.accentRed}
          emissive={active ? COLORS.accentGreen : COLORS.accentRed}
          emissiveIntensity={0.9}
        />
      </mesh>

      {/* Mounting base */}
      <mesh position={[0, -0.35, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color={COLORS.steelDark} metalness={0.75} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   DISCHARGE CHUTE/HOOD (over conveyor)
   ========================================================================== */

function DischargeChute({
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
      {/* Chute body - tapered */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={COLORS.steel} metalness={0.65} roughness={0.4} />
      </mesh>

      {/* Chute opening (bottom) */}
      <mesh position={[0, -height / 2 + 0.02, 0]}>
        <boxGeometry args={[width * 0.8, 0.04, depth * 0.9]} />
        <meshStandardMaterial color={COLORS.hopperInteriorDark} metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Chute top flange */}
      <mesh position={[0, height / 2 + 0.03, 0]}>
        <boxGeometry args={[width + 0.1, 0.06, depth + 0.1]} />
        <meshStandardMaterial color={COLORS.steelLight} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Side panels */}
      <mesh position={[width / 2 + 0.01, 0, 0]}>
        <boxGeometry args={[0.04, height * 0.9, depth * 0.95]} />
        <meshStandardMaterial color={COLORS.steelDark} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[-width / 2 - 0.01, 0, 0]}>
        <boxGeometry args={[0.04, height * 0.9, depth * 0.95]} />
        <meshStandardMaterial color={COLORS.steelDark} metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   DATA PANEL
   ========================================================================== */

function DataPanel({
  position,
  active,
  label,
}: {
  position: V3;
  active: boolean;
  label: string;
}) {
  const lines = [
    { text: `HOPPER SYSTEM`, size: 0.2, color: '#1c1c1c', bold: true },
    { text: `ID: ${label}`, size: 0.14, color: '#3a3a3a' },
    { text: `Status: ${active ? '● RUNNING' : '○ STOPPED'}`, size: 0.14, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Conveyor: ${active ? 'ACTIVE' : 'IDLE'}`, size: 0.14, color: '#3a3a3a' },
  ];

  return (
    <group position={position}>
      <mesh position={[0, -0.3, -0.02]}>
        <planeGeometry args={[2.2, 1.3]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.3, -0.015]}>
        <planeGeometry args={[2.24, 1.34]} />
        <meshStandardMaterial color={COLORS.accentYellow} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {lines.map((line, i) => (
        <Text
          key={i}
          position={[-1, -i * 0.28, 0]}
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
  );
}

/* ==========================================================================
   MAIN HOPPER COMPONENT
   ========================================================================== */

export interface HopperProps {
  position?: V3;
  hopperTopWidth?: number;
  hopperTopDepth?: number;
  hopperBottomWidth?: number;
  hopperBottomDepth?: number;
  hopperHeight?: number;
  conveyorLength?: number;
  conveyorWidth?: number;
  conveyorHeight?: number;
  active?: boolean;
  label?: string;
  hopperBaseY?: number;
  showConveyor?: boolean;
  showControlRoom?: boolean;
  showDataPanel?: boolean;
  showSupports?: boolean;
  showInterior?: boolean;
  showFlourFill?: boolean;
  flourFillLevel?: number;
}

export function HopperComponent({
  position = [0, 0, 0],
  hopperTopWidth = 5,
  hopperTopDepth = 5,
  hopperBottomWidth = 2,
  hopperBottomDepth = 2,
  hopperHeight = 3,
  conveyorLength = 6,
  conveyorWidth = 1.8,
  conveyorHeight = 1.2,
  active: controlledActive,
  label = 'HOPPER-01',
  hopperBaseY = 2.5,
  showConveyor = true,
  showControlRoom = true,
  showDataPanel = true,
  showSupports = true,
  showInterior = true,
  showFlourFill = false,
  flourFillLevel = 0.6,
}: HopperProps) {
  const [internalActive, setInternalActive] = useState(false);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  // Positions
  const controlRoomY = 1.2;
  const controlRoomWidth = 2.5;
  const controlRoomDepth = 2;
  const controlRoomHeight = 2.2;

  const conveyorY = 0.6;
  const dischargeChuteY = hopperBaseY - 0.5;

  return (
    <group position={position}>
      {showSupports && (
        <SupportColumns
          width={hopperTopWidth}
          depth={hopperTopDepth}
          height={hopperBaseY}
          baseY={0}
        />
      )}

      <HopperFunnel
        topWidth={hopperTopWidth}
        topDepth={hopperTopDepth}
        bottomWidth={hopperBottomWidth}
        bottomDepth={hopperBottomDepth}
        height={hopperHeight}
        baseY={hopperBaseY}
        showInterior={showInterior}
      />

      {showFlourFill && (
        <FlourFill
          topWidth={hopperTopWidth}
          topDepth={hopperTopDepth}
          bottomWidth={hopperBottomWidth}
          bottomDepth={hopperBottomDepth}
          height={hopperHeight}
          baseY={hopperBaseY}
          fillLevel={flourFillLevel}
        />
      )}

      {showSupports && (
        <DiagonalSupports
          topWidth={hopperTopWidth}
          topDepth={hopperTopDepth}
          bottomWidth={hopperBottomWidth}
          bottomDepth={hopperBottomDepth}
          height={hopperHeight}
          baseY={hopperBaseY}
        />
      )}

      {showControlRoom && (
        <ControlRoom
          width={controlRoomWidth}
          height={controlRoomHeight}
          depth={controlRoomDepth}
          position={[-hopperTopWidth / 2 - controlRoomWidth / 2 + 0.3, controlRoomY, 0]}
        />
      )}

      {showConveyor && (
        <>
          <DischargeChute
            width={1.5}
            depth={conveyorWidth * 0.9}
            height={1.2}
            position={[0, dischargeChuteY, 0]}
          />
          <ConveyorSystem
            length={conveyorLength}
            width={conveyorWidth}
            height={conveyorHeight}
            position={[conveyorLength / 2 - 0.5, conveyorY, 0]}
            active={active}
            onToggle={() => setInternalActive(!internalActive)}
          />
          <ConveyorDriveMotor
            position={[conveyorLength - 0.3, conveyorY + 0.3, 0]}
            active={active}
          />
        </>
      )}

      {showDataPanel && (
        <DataPanel
          position={[0, hopperBaseY + hopperHeight + 1, 0]}
          active={active}
          label={label}
        />
      )}

      {showConveyor && (
        <Text
          position={[conveyorLength / 2, conveyorY + 1.5, 0]}
          fontSize={0.12}
          color={COLORS.accentYellow}
          anchorX="center"
          anchorY="middle"
        >
          {active ? '● CLICK CONVEYOR TO STOP' : '○ CLICK CONVEYOR TO START'}
        </Text>
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
      <gridHelper args={[80, 80, '#5c5c54', '#79796e']} position={[0, 0, 0]} />
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
      <directionalLight position={[-10, 12, -8]} intensity={0.4} />
    </>
  );
}

/* ==========================================================================
   EXPORT - SCENE
   ========================================================================== */

export function HopperScene() {
  const [active, setActive] = useState(false);

  return (
    <Canvas shadows camera={{ position: [12, 8, 12], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <HopperComponent
        hopperTopWidth={5}
        hopperTopDepth={5}
        hopperBottomWidth={2}
        hopperBottomDepth={2}
        hopperHeight={3}
        conveyorLength={6}
        conveyorWidth={1.8}
        conveyorHeight={1.2}
        active={active}
        label="HOPPER-01"
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.05}
        target={[2, 2, 0]}
      />
    </Canvas>
  );
}

export function Hopper() {
  return <HopperScene />;
}

export default Hopper;