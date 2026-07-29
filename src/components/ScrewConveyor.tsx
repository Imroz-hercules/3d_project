'use client';

/**
 * ScrewConveyor.tsx — HIGH-FIDELITY INDUSTRIAL U-TROUGH SCREW CONVEYOR
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, flanged trough seams, intermediate hanger bearings, 
 * a detailed right-angle gearbox with high-fidelity motor, yellow safety 
 * coupling guard, and proper I-beam mounting skids.
 * ------------------------------------------------------------------------
 */

import { useRef, useState, useMemo } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
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
   3. U-TROUGH (Upgraded with flanges, support rings, and inspection cover)
   ========================================================================== */

function UTrough({ length, width, height }: { length: number; width: number; height: number }) {
  const wall = 0.04;
  const bottomY = height / 2;
  const supportCount = Math.max(2, Math.floor(length / 0.75));
  const supports = Array.from({ length: supportCount }, (_, i) => (i / (supportCount - 1)) * length);

  return (
    <group>
      {/* Bottom plate */}
      <mesh position={[length / 2, bottomY, 0]} castShadow receiveShadow material={matBodyDark}>
        <boxGeometry args={[length, wall, width]} />
      </mesh>

      {/* Left / right walls with top flanges */}
      {[1, -1].map((side) => (
        <group key={side}>
          <mesh position={[length / 2, bottomY + height / 2, side * (width / 2 - wall / 2)]} castShadow material={matBody}>
            <boxGeometry args={[length, height, wall]} />
          </mesh>
          {/* Top flange */}
          <mesh position={[length / 2, bottomY + height + wall / 2, side * (width / 2 - wall / 2)]} castShadow material={matBodyDark}>
            <boxGeometry args={[length, wall * 1.5, wall * 2]} />
          </mesh>
        </group>
      ))}

      {/* Support rings underneath */}
      {supports.map((x, i) => (
        <mesh key={i} position={[x, bottomY - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
          <torusGeometry args={[width / 2 + 0.02, 0.04, 8, 24, Math.PI]} />
        </mesh>
      ))}

      {/* Hinged inspection cover (middle) */}
      <InspectionCover x={length / 2} width={width} height={height} wall={wall} />

      {/* Inlet end plate */}
      <mesh position={[0.02, bottomY + height / 2, 0]} castShadow material={matBodyDark}>
        <boxGeometry args={[wall, height * 0.9, width * 0.9]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   4. INSPECTION COVER (Interactive)
   ========================================================================== */

function InspectionCover({ x, width, height, wall }: { x: number; width: number; height: number; wall: number }) {
  const doorRef = useRef<THREE.Group>(null!);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const targetAngle = open ? -Math.PI * 0.7 : 0;

  useFrame((_, delta) => {
    if (doorRef.current) {
      doorRef.current.rotation.x = THREE.MathUtils.damp(doorRef.current.rotation.x, targetAngle, 5, delta);
    }
  });

  const coverWidth = width * 0.6;
  const coverLength = 0.6;

  return (
    <group position={[x, height + wall, 0]}>
      {/* Frame */}
      <mesh material={matStructure}>
        <boxGeometry args={[coverLength + 0.04, wall * 1.5, coverWidth + 0.04]} />
      </mesh>
      {/* Gasket */}
      <mesh position={[0, -wall * 0.5, 0]} material={matGasket}>
        <boxGeometry args={[coverLength, wall * 0.5, coverWidth]} />
      </mesh>
      {/* Hinged Door */}
      <group ref={doorRef} position={[0, 0, -coverWidth / 2]}>
        <mesh
          position={[0, 0, coverWidth / 2]}
          castShadow
          material={hovered ? matSafety : matBody}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
          onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); setOpen((o) => !o); }}
        >
          <boxGeometry args={[coverLength, wall, coverWidth]} />
        </mesh>
        {/* Handle */}
        <mesh position={[0, wall * 0.5, coverWidth * 0.7]} material={matStructure}>
          <boxGeometry args={[0.04, 0.04, 0.12]} />
        </mesh>
        {/* Hinges */}
        {[-0.2, 0.2].map((z, i) => (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
            <cylinderGeometry args={[0.02, 0.02, 0.05, 12]} />
          </mesh>
        ))}
      </group>
      {/* Latches */}
      {[0.25, -0.25].map((z, i) => (
        <mesh key={i} position={[0, 0, z]} material={matStructure}>
          <boxGeometry args={[0.06, wall * 2, 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   5. INLET COLLAR (Upgraded with transition hopper and flange)
   ========================================================================== */

function InletCollar({ width, troughHeight, dropHeight }: { width: number; troughHeight: number; dropHeight: number }) {
  const w = width * 0.85;
  return (
    <group>
      {/* Vertical drop pipe */}
      <mesh position={[0, troughHeight + dropHeight / 2, 0]} castShadow material={matBody}>
        <boxGeometry args={[w, dropHeight, w]} />
      </mesh>
      {/* Transition hopper */}
      <mesh position={[0, troughHeight + 0.03, 0]} castShadow material={matBodyDark}>
        <boxGeometry args={[w * 1.1, 0.06, w * 1.1]} />
      </mesh>
      {/* Inlet flange with bolts */}
      <mesh position={[0, troughHeight + dropHeight + 0.03, 0]} castShadow material={matStructure}>
        <cylinderGeometry args={[w * 0.55, w * 0.55, 0.05, 24]} />
      </mesh>
      <BoltCircle radius={w * 0.55} count={8} y={troughHeight + dropHeight + 0.03} size={0.018} />
    </group>
  );
}

/* ==========================================================================
   6. AUGER SCREW (Upgraded with shaft, flighting, and hanger bearings)
   ========================================================================== */

function AugerScrew({
  length,
  radius,
  troughHeight,
  active,
  rpm,
}: {
  length: number;
  radius: number;
  troughHeight: number;
  active: boolean;
  rpm: number;
}) {
  const ref = useRef<THREE.Group>(null!);
  const segments = Math.max(24, Math.floor(length * 10));
  const turns = length / (radius * 2.5);
  const shaftY = troughHeight / 2 + 0.04;

  // Hanger bearings for long conveyors
  const hangerCount = Math.max(0, Math.floor(length / 2.5) - 1);
  const hangers = Array.from({ length: hangerCount }, (_, i) => ((i + 1) / (hangerCount + 1)) * length);

  useFrame((_, delta) => {
    if (ref.current && active) {
      ref.current.rotation.x += (rpm / 60) * Math.PI * 2 * delta;
    }
  });

  return (
    <group ref={ref} position={[length / 2, shaftY, 0]}>
      {/* Central shaft */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[radius * 0.15, radius * 0.15, length * 0.96, 16]} />
      </mesh>

      {/* Flighting (auger blades) */}
      {Array.from({ length: segments }, (_, i) => {
        const t = i / segments;
        const x = t * length - length / 2;
        const angle = t * turns * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[x, Math.cos(angle) * radius * 0.5, Math.sin(angle) * radius * 0.5]}
            rotation={[angle, 0, 0]}
            castShadow
            material={matBody}
          >
            <boxGeometry args={[length / segments + 0.02, 0.03, radius * 0.95]} />
          </mesh>
        );
      })}

      {/* Hanger bearings */}
      {hangers.map((hx, i) => (
        <group key={i} position={[hx - length / 2, radius * 0.8, 0]}>
          {/* Bearing housing */}
          <mesh castShadow material={matStructure}>
            <boxGeometry args={[0.15, 0.2, width * 0.9]} />
          </mesh>
          {/* Mounting bolts to trough */}
          {[-0.05, 0.05].map((dx) =>
            [-width * 0.4, width * 0.4].map((dz) => (
              <Bolt key={`${dx}-${dz}`} position={[dx, 0.1, dz]} rotation={[0, 0, Math.PI / 2]} size={0.016} />
            ))
          )}
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   7. DRIVE MOTOR & GEARBOX (High-fidelity right-angle drive)
   ========================================================================== */

function DriveMotorGearbox({
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
      {/* Right-angle gearbox */}
      <mesh castShadow material={matStructure}>
        <boxGeometry args={[0.22, 0.25, 0.25]} />
      </mesh>
      {/* Gearbox mounting bolts */}
      {[[-0.08, -0.1], [0.08, -0.1], [-0.08, 0.1], [0.08, 0.1]].map(([x, z], i) => (
        <Bolt key={i} position={[x, 0, z]} rotation={[0, 0, Math.PI / 2]} size={0.018} />
      ))}
      
      {/* Motor body */}
      <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow material={matMotor}>
        <cylinderGeometry args={[0.14, 0.14, 0.35, 24]} />
      </mesh>

      {/* Motor cooling fins */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = 0.2 - 0.15 + (i / 9) * 0.3;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} material={matMotorDark}>
            <cylinderGeometry args={[0.155, 0.155, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Terminal box */}
      <mesh position={[0, 0.16, 0.2]} material={matMotorDark}>
        <boxGeometry args={[0.1, 0.08, 0.12]} />
      </mesh>

      {/* Fan cover */}
      <mesh position={[0, 0, 0.38]} rotation={[Math.PI / 2, 0, 0]} castShadow material={matMotorDark}>
        <cylinderGeometry args={[0.12, 0.12, 0.06, 24]} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 8]} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.16, 0.26]}>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshStandardMaterial color={active ? COLORS.accentGreen : COLORS.accentRed} emissive={active ? COLORS.accentGreen : COLORS.accentRed} emissiveIntensity={0.9} />
      </mesh>

      {/* Safety Guard over coupling */}
      <mesh position={[0, 0.05, 0.12]} castShadow material={matSafety}>
        <boxGeometry args={[0.18, 0.15, 0.12]} />
      </mesh>
      <mesh position={[0, 0.05, 0.12]}>
        <boxGeometry args={[0.16, 0.03, 0.005]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   8. DISCHARGE SPOUT (Upgraded with flanged circular outlet)
   ========================================================================== */

function DischargeSpout({ position, width }: { position: V3; width: number }) {
  const r = width * 0.38;
  return (
    <group position={position}>
      {/* Transition box */}
      <mesh castShadow material={matBodyDark}>
        <boxGeometry args={[0.15, width * 0.7, width * 0.85]} />
      </mesh>
      {/* Circular outlet pipe */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matBody}>
        <cylinderGeometry args={[r, r, 0.15, 24]} />
      </mesh>
      {/* Outlet flange */}
      <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <torusGeometry args={[r + 0.04, 0.03, 8, 24]} />
      </mesh>
      <BoltCircle radius={r + 0.04} count={6} y={0} size={0.016} rotation={[0, 0, Math.PI / 2]} />
    </group>
  );
}

/* ==========================================================================
   9. FRAME SKIDS (Upgraded to I-beam style with mounting pads)
   ========================================================================== */

function FrameSkids({ length, width }: { length: number; width: number }) {
  const skidY = 0.04;
  return (
    <>
      {[-length * 0.35, length * 0.35].map((x, i) => (
        <group key={i} position={[length / 2 + x, skidY / 2, 0]}>
          {/* I-beam simulation */}
          <mesh castShadow material={matStructure}>
            <boxGeometry args={[0.1, skidY, width + 0.15]} />
          </mesh>
          <mesh material={matStructure}>
            <boxGeometry args={[0.12, skidY, 0.04]} />
          </mesh>
          <mesh material={matStructure}>
            <boxGeometry args={[0.04, skidY, width + 0.15]} />
          </mesh>
          {/* Mounting pads with anchor holes */}
          {[-width / 2, width / 2].map((z) => (
            <mesh key={z} position={[0, -skidY / 2 - 0.02, z]} material={matStructure}>
              <boxGeometry args={[0.15, 0.04, 0.15]} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

/* ==========================================================================
   10. MAIN COMPONENT
   ========================================================================== */

export interface ScrewConveyorProps {
  position?: V3;
  length?: number;
  width?: number;
  troughHeight?: number;
  inletDropHeight?: number;
  rpm?: number;
  active?: boolean;
  showLabel?: boolean;
  showInletCollar?: boolean;
  axis?: 'x' | 'z';
  onToggle?: () => void;
}

export function ScrewConveyorComponent({
  position = [0, 0, 0],
  length = 3,
  width = 0.64,
  troughHeight = 0.35,
  inletDropHeight = 0.22,
  rpm = 35,
  active: controlledActive,
  showLabel = false,
  showInletCollar = true,
  axis = 'x',
  onToggle,
}: ScrewConveyorProps) {
  const [internalActive, setInternalActive] = useState(true);
  const active = controlledActive !== undefined ? controlledActive : internalActive;
  const augerRadius = width * 0.36;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onToggle) onToggle();
    else setInternalActive(!internalActive);
  };

  return (
    <group
      position={position}
      rotation={axis === 'z' ? [0, Math.PI / 2, 0] : [0, 0, 0]}
      onClick={handleClick}
    >
      <FrameSkids length={length} width={width} />
      <UTrough length={length} width={width} height={troughHeight} />
      <AugerScrew
        length={length}
        radius={augerRadius}
        troughHeight={troughHeight}
        active={active}
        rpm={rpm}
      />

      {showInletCollar && (
        <InletCollar width={width} troughHeight={troughHeight} dropHeight={inletDropHeight} />
      )}

      <DischargeSpout
        position={[length, troughHeight / 2 + 0.04, 0]}
        width={width}
      />

      <DriveMotorGearbox
        position={[length - 0.15, troughHeight / 2 + 0.05, width / 2 + 0.18]}
        active={active}
        rpm={rpm}
      />

      {showLabel && (
        <Text
          position={[length / 2, troughHeight + 0.35, 0]}
          fontSize={0.08}
          color={COLORS.accentCyan}
          anchorX="center"
          anchorY="middle"
        >
          {active ? '● SCREW RUNNING' : '○ SCREW STOPPED'}
        </Text>
      )}
    </group>
  );
}

/** World X of discharge end. */
export function screwConveyorDischargeX(inletX: number, length: number) {
  return inletX + length;
}

export default ScrewConveyorComponent;