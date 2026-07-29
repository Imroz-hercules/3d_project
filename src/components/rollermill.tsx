'use client';

/**
 * RollerMill.tsx — HIGH-FIDELITY INDUSTRIAL ROLLER MILL
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, flanged inlet/outlet connections, interactive 
 * inspection door with gasket, robust I-beam support legs with gussets, 
 * and a high-fidelity drive motor with safety coupling guard.
 * ------------------------------------------------------------------------
 */

import { useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float, Sparkles } from '@react-three/drei';
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
  accentYellow: '#e0a92c',
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
function BoltCircle({ radius, count, y = 0, z = 0, size = 0.02, rotation = [0, 0, 0] as V3 }: { radius: number; count: number; y?: number; z?: number; size?: number; rotation?: V3 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <Bolt
            key={i}
            position={[Math.cos(a) * radius, y, Math.sin(a) * radius + z]}
            rotation={rotation}
            size={size}
          />
        );
      })}
    </>
  );
}

/* ==========================================================================
   3. SUPPORT FRAME (I-beam legs, base plates, gussets, bracing)
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
        <group key={i}>
          {/* I-beam leg simulation */}
          <mesh position={pos} castShadow material={matStructure}>
            <boxGeometry args={[0.16, legHeight, 0.16]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.18, legHeight, 0.06]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.06, legHeight, 0.18]} />
          </mesh>

          {/* Base plate */}
          <mesh position={[pos[0], -legHeight / 2 + 0.04, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.4, 0.08, 0.4]} />
          </mesh>

          {/* Anchor bolts */}
          {[-0.14, 0.14].map((dx) =>
            [-0.14, 0.14].map((dz) => (
              <Bolt key={`${dx}-${dz}`} position={[pos[0] + dx, -legHeight / 2 + 0.09, pos[2] + dz]} size={0.018} />
            ))
          )}

          {/* Top gusset plate */}
          <mesh position={[pos[0], legHeight / 2 - 0.15, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.22, 0.3, 0.05]} />
          </mesh>
        </group>
      ))}

      {/* Cross bracing */}
      <mesh position={[0, -legHeight / 2 + 0.5, 0]} castShadow material={matStructure}>
        <boxGeometry args={[width - 0.5, 0.08, 0.08]} />
      </mesh>
      <mesh position={[0, -legHeight / 2 + 0.5, 0]} rotation={[0, Math.PI / 2, 0]} castShadow material={matStructure}>
        <boxGeometry args={[depth - 0.5, 0.08, 0.08]} />
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
   4. INTERACTIVE INSPECTION DOOR
   ========================================================================== */

function InspectionDoor({ position, rotation, width, height, isOpen, onToggle }: { position: V3; rotation: V3; width: number; height: number; isOpen: boolean; onToggle: () => void }) {
  const doorRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const targetAngle = isOpen ? -Math.PI * 0.65 : 0;

  useFrame((_, delta) => {
    if (doorRef.current) {
      doorRef.current.rotation.y = THREE.MathUtils.damp(doorRef.current.rotation.y, targetAngle, 5, delta);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh material={matStructure}>
        <boxGeometry args={[0.05, height, width]} />
      </mesh>
      {/* Gasket */}
      <mesh position={[rotation[1] === Math.PI ? -0.03 : 0.03, 0, 0]} material={matGasket}>
        <boxGeometry args={[0.02, height - 0.08, width - 0.08]} />
      </mesh>
      {/* Hinged Door */}
      <group ref={doorRef} position={[rotation[1] === Math.PI ? -0.04 : 0.04, 0, -width / 2]}>
        <mesh
          position={[0, 0, width / 2]}
          castShadow
          material={hovered ? matSafety : matBody}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
          onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onToggle(); }}
        >
          <boxGeometry args={[0.04, height - 0.04, width - 0.04]} />
        </mesh>
        {/* Handle */}
        <mesh position={[rotation[1] === Math.PI ? -0.05 : 0.05, 0, width * 0.35]} material={matStructure}>
          <boxGeometry args={[0.04, 0.15, 0.04]} />
        </mesh>
        {/* Hinges */}
        {[-height * 0.35, height * 0.35].map((y, i) => (
          <mesh key={i} position={[rotation[1] === Math.PI ? -0.04 : 0.04, y, 0]} rotation={[0, Math.PI / 2, 0]} material={matStructure}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 12]} />
          </mesh>
        ))}
      </group>
      {/* Frame bolts */}
      {[[-height * 0.4, -width * 0.4], [height * 0.4, -width * 0.4], [-height * 0.4, width * 0.4], [height * 0.4, width * 0.4]].map(([y, z], i) => (
        <Bolt key={i} position={[rotation[1] === Math.PI ? -0.04 : 0.04, y, z]} rotation={[0, Math.PI / 2, 0]} size={0.016} />
      ))}
    </group>
  );
}

/* ==========================================================================
   5. MAIN HOUSING (Enhanced with seams, ribs, flanges)
   ========================================================================== */

function MainHousing({ width, height, depth }: { width: number; height: number; depth: number }) {
  const ribCount = 3;
  const ribs = Array.from({ length: ribCount }, (_, i) => -height / 2 + 0.5 + (i / (ribCount - 1)) * (height - 1));

  return (
    <group>
      <mesh castShadow receiveShadow material={matBody}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* Vertical panel seams */}
      {[-width / 2 + 0.01, width / 2 - 0.01].map((x, i) => (
        <mesh key={i} position={[x, 0, depth / 2 + 0.005]} material={matBodyDark}>
          <boxGeometry args={[0.015, height - 0.2, 0.02]} />
        </mesh>
      ))}

      {/* Horizontal stiffener ribs with bolts */}
      {ribs.map((y, i) => (
        <group key={i}>
          <mesh position={[0, y, depth / 2 + 0.01]} material={matStructure}>
            <boxGeometry args={[width * 0.96, 0.05, 0.025]} />
          </mesh>
          <mesh position={[0, y, -depth / 2 - 0.01]} material={matStructure}>
            <boxGeometry args={[width * 0.96, 0.05, 0.025]} />
          </mesh>
          {[-width * 0.4, 0, width * 0.4].map((x) => (
            <Bolt key={`f-${x}`} position={[x, y, depth / 2 + 0.025]} size={0.016} />
          ))}
          {[-width * 0.4, 0, width * 0.4].map((x) => (
            <Bolt key={`b-${x}`} position={[x, y, -depth / 2 - 0.025]} rotation={[0, Math.PI, 0]} size={0.016} />
          ))}
        </group>
      ))}

      {/* Top & Bottom reinforcement bands */}
      <mesh position={[0, height / 2 - 0.1, 0]} material={matBodyDark}>
        <boxGeometry args={[width + 0.05, 0.2, depth + 0.05]} />
      </mesh>
      <mesh position={[0, -height / 2 + 0.1, 0]} material={matBodyDark}>
        <boxGeometry args={[width + 0.05, 0.2, depth + 0.05]} />
      </mesh>

      {/* Side motor mounting plates */}
      <mesh position={[width / 2 + 0.02, 0, 0]} material={matBodyDark}>
        <boxGeometry args={[0.04, height * 0.8, depth * 0.9]} />
      </mesh>
      <mesh position={[-width / 2 - 0.02, 0, 0]} material={matBodyDark}>
        <boxGeometry args={[0.04, height * 0.8, depth * 0.9]} />
      </mesh>

      {/* Cover corner bolts */}
      {[
        [width * 0.35, height * 0.35, depth / 2 + 0.03],
        [-width * 0.35, height * 0.35, depth / 2 + 0.03],
        [width * 0.35, -height * 0.25, depth / 2 + 0.03],
        [-width * 0.35, -height * 0.25, depth / 2 + 0.03],
      ].map((p, i) => (
        <Bolt key={i} position={p} rotation={[Math.PI / 2, 0, 0]} size={0.02} />
      ))}

      {/* Yellow guard strip */}
      <mesh position={[0, -height / 2 + 0.35, depth / 2 + 0.02]} material={matSafety}>
        <boxGeometry args={[width * 0.9, 0.08, 0.02]} />
      </mesh>

      {/* Nameplate */}
      <group position={[0, height * 0.28, depth / 2 + 0.02]}>
        <mesh material={matBody}>
          <boxGeometry args={[width * 0.42, 0.16, 0.015]} />
        </mesh>
        <Text position={[0, 0.04, 0.008]} fontSize={0.06} color="#1a1a1a" anchorX="center" anchorY="middle" fontWeight="bold">
          ROLLER MILL
        </Text>
        <Text position={[0, -0.05, 0.008]} fontSize={0.045} color="#3a3a3a" anchorX="center" anchorY="middle">
          RM-01
        </Text>
        {/* Plate screws */}
        {[[-0.18, 0.06], [0.18, 0.06], [-0.18, -0.06], [0.18, -0.06]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.01]}>
            <cylinderGeometry args={[0.01, 0.01, 0.01, 6]} />
            <meshStandardMaterial color={COLORS.accentCyan} metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Warning Label */}
      <group position={[width * 0.28, -height * 0.15, depth / 2 + 0.02]}>
        <mesh material={matSafety}>
          <boxGeometry args={[0.25, 0.12, 0.015]} />
        </mesh>
        <Text position={[0, 0.03, 0.008]} fontSize={0.04} color="#000000" anchorX="center" anchorY="middle" fontWeight="bold">
          WARNING
        </Text>
        <Text position={[0, -0.03, 0.008]} fontSize={0.03} color="#000000" anchorX="center" anchorY="middle">
          MOVING ROLLS
        </Text>
      </group>

      {/* Interactive Inspection Doors */}
      <InspectionDoor 
        position={[0, 0, depth / 2 + 0.02]} 
        rotation={[0, 0, 0]} 
        width={width * 0.45} 
        height={height * 0.7} 
        isOpen={false} 
        onToggle={() => {}} 
      />
    </group>
  );
}

/* ==========================================================================
   6. FEED HOPPER (Enhanced with flanges and bolts)
   ========================================================================== */

function FeedHopper({ width, depth, position }: { width: number; depth: number; position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow material={matBody}>
        <boxGeometry args={[width * 0.7, 0.8, depth * 0.7]} />
      </mesh>
      <mesh position={[0, 0.42, 0]} material={matStructure}>
        <boxGeometry args={[width * 0.75, 0.06, depth * 0.75]} />
      </mesh>
      {/* Inlet flange bolts */}
      {[-width * 0.3, width * 0.3].map((x) =>
        [-depth * 0.3, depth * 0.3].map((z) => (
          <Bolt key={`in-${x}-${z}`} position={[x, 0.45, z]} size={0.018} />
        ))
      )}
      <mesh position={[0, -0.42, 0]} material={matStructure}>
        <boxGeometry args={[width * 0.5, 0.06, depth * 0.5]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   7. GRINDING ROLLERS (Heavy-duty with wear tips)
   ========================================================================== */

function GrindingRollers({ width: _width, depth, active }: { width: number; depth: number; active: boolean }) {
  void _width;
  const roller1Ref = useRef<THREE.Mesh>(null!);
  const roller2Ref = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (active) {
      if (roller1Ref.current) roller1Ref.current.rotation.x += delta * 8;
      if (roller2Ref.current) roller2Ref.current.rotation.x -= delta * 8.5;
    }
  });

  const rollerLength = depth * 0.85;
  const rollerRadius = 0.3;

  return (
    <group>
      {/* Roller 1 (Fast roll) */}
      <mesh ref={roller1Ref} position={[-0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[rollerRadius, rollerRadius, rollerLength, 32]} />
      </mesh>

      {/* Roller 2 (Slow roll) */}
      <mesh ref={roller2Ref} position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[rollerRadius, rollerRadius, rollerLength, 32]} />
      </mesh>

      {/* End discs */}
      {[-0.2, 0.2].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0, rollerLength / 2 + 0.05]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
            <cylinderGeometry args={[rollerRadius * 1.1, rollerRadius * 1.1, 0.08, 32]} />
          </mesh>
          <mesh position={[x, 0, -(rollerLength / 2 + 0.05)]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
            <cylinderGeometry args={[rollerRadius * 1.1, rollerRadius * 1.1, 0.08, 32]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   8. SIDE MOTORS (High-fidelity with coupling guard)
   ========================================================================== */

function SideMotors({ position, active, side }: { position: V3; active: boolean; side: 'left' | 'right' }) {
  const fanRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 12;
    }
  });

  const xOffset = side === 'left' ? -1 : 1;

  return (
    <group position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Motor body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={hovered ? matMotor : matMotor}>
        <cylinderGeometry args={[0.35, 0.35, 0.7, 24]} />
      </mesh>

      {/* Cooling fins */}
      {Array.from({ length: 12 }, (_, i) => {
        const z = -0.3 + (i / 11) * 0.6;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
            <cylinderGeometry args={[0.37, 0.37, 0.02, 24]} />
          </mesh>
        );
      })}

      {/* Terminal box */}
      <mesh position={[0, 0.37, 0]} material={matMotorDark}>
        <boxGeometry args={[0.12, 0.08, 0.14]} />
      </mesh>

      {/* Fan cover */}
      <mesh position={[0, 0, 0.4]} rotation={[0, 0, Math.PI / 2]} castShadow material={matMotorDark}>
        <cylinderGeometry args={[0.33, 0.33, 0.08, 24]} />
      </mesh>

      {/* Fan blades */}
      <mesh ref={fanRef} position={[0, 0, 0.42]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <cylinderGeometry args={[0.28, 0.28, 0.03, 8]} />
      </mesh>

      {/* Belt guard */}
      <mesh position={[xOffset * 0.15, 0, -0.4]} castShadow material={matSafety}>
        <boxGeometry args={[0.3, 0.5, 0.4]} />
      </mesh>
      {/* Rubber belt hint */}
      <mesh position={[xOffset * 0.15, 0, -0.55]} material={matRubber}>
        <boxGeometry args={[0.08, 0.35, 0.06]} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.37, 0.08]}>
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
   9. ADJUSTMENT HANDWHEELS
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
      <mesh ref={wheel1Ref} position={[-0.3, 0, 0]} castShadow material={matRubber}>
        <torusGeometry args={[0.15, 0.03, 8, 24]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.3, 0, 0]} rotation={[0, 0, (i / 4) * Math.PI]} material={matRubber}>
          <boxGeometry args={[0.02, 0.28, 0.02]} />
        </mesh>
      ))}

      <mesh ref={wheel2Ref} position={[0.3, 0, 0]} castShadow material={matRubber}>
        <torusGeometry args={[0.15, 0.03, 8, 24]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0.3, 0, 0]} rotation={[0, 0, (i / 4) * Math.PI]} material={matRubber}>
          <boxGeometry args={[0.02, 0.28, 0.02]} />
        </mesh>
      ))}

      <Text position={[-0.3, -0.25, 0]} fontSize={0.06} color="#3a454c" anchorX="center" anchorY="middle" fontWeight="bold">
        GAP ADJ
      </Text>
      <Text position={[0.3, -0.25, 0]} fontSize={0.06} color="#3a454c" anchorX="center" anchorY="middle" fontWeight="bold">
        GAP ADJ
      </Text>
    </group>
  );
}

/* ==========================================================================
   10. OUTLET CHUTE (Enhanced with flanges)
   ========================================================================== */

function OutletChute({ width, depth, position }: { width: number; depth: number; position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow material={matBody}>
        <boxGeometry args={[width * 0.6, 0.8, depth * 0.6]} />
      </mesh>
      <mesh position={[0, -0.42, 0]} material={matStructure}>
        <boxGeometry args={[width * 0.65, 0.06, depth * 0.65]} />
      </mesh>
      {/* Outlet flange bolts */}
      {[-width * 0.25, width * 0.25].map((x) =>
        [-depth * 0.25, depth * 0.25].map((z) => (
          <Bolt key={`out-${x}-${z}`} position={[x, -0.45, z]} size={0.018} />
        ))
      )}
    </group>
  );
}

/* ==========================================================================
   11. CONTROL PANEL
   ========================================================================== */

function ControlPanel({ position, active }: { position: V3; active: boolean }) {
  return (
    <group position={position}>
      <mesh castShadow material={matBodyDark}>
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
        <mesh key={i} position={[x, 0, 0.1]} material={matStructure}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   12. DATA PANEL (PLC Data)
   ========================================================================== */

function DataPanel({ position, active }: { position: V3; active: boolean }) {
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
          <meshStandardMaterial color={COLORS.accentCyan} transparent opacity={0.3} side={THREE.DoubleSide} />
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
   13. MAIN ROLLER MILL COMPONENT
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
      <InspectionDoor 
        position={[0, 0, depth / 2 + 0.02]} 
        rotation={[0, 0, 0]} 
        width={width * 0.45} 
        height={height * 0.7} 
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

      {/* 11. Data Panel */}
      {showDataPanel && (
        <DataPanel
          position={[width / 2 + 2, height / 2, 0]}
          active={active}
        />
      )}

      {/* 12. Click Instructions */}
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

      {/* 13. Invisible Click Targets */}
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
   14. ENVIRONMENT & EXPORT
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