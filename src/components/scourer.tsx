'use client';

/**
 * Scourer.tsx — HIGH-FIDELITY INDUSTRIAL WHEAT SCOURER
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, flanged inlet/outlet/vent spouts, interactive 
 * inspection door with gasket, robust I-beam support legs with gussets, 
 * and a high-fidelity drive motor with coupling guard.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { InspectionDoor } from './machineParts/InspectionDoor';

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

const COLORS = {
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  dustGray: '#a0a8b0',
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

function SupportFrame({ length, radius }: { length: number; radius: number }) {
  const legHeight = 1.2;
  const legPositions: V3[] = [
    [length / 2 - 0.2, -legHeight / 2, radius - 0.1],
    [-length / 2 + 0.2, -legHeight / 2, radius - 0.1],
    [length / 2 - 0.2, -legHeight / 2, -(radius - 0.1)],
    [-length / 2 + 0.2, -legHeight / 2, -(radius - 0.1)],
  ];

  return (
    <group>
      {legPositions.map((pos, i) => (
        <group key={i}>
          {/* I-beam leg simulation */}
          <mesh position={pos} castShadow material={matStructure}>
            <boxGeometry args={[0.12, legHeight, 0.12]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.14, legHeight, 0.04]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.04, legHeight, 0.14]} />
          </mesh>

          {/* Base plate */}
          <mesh position={[pos[0], -legHeight / 2 + 0.04, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.3, 0.08, 0.3]} />
          </mesh>

          {/* Anchor bolts */}
          {[-0.1, 0.1].map((dx) =>
            [-0.1, 0.1].map((dz) => (
              <Bolt key={`${dx}-${dz}`} position={[pos[0] + dx, -legHeight / 2 + 0.09, pos[2] + dz]} size={0.016} />
            ))
          )}

          {/* Top gusset plate */}
          <mesh position={[pos[0], -legHeight / 2 + 0.3, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.18, 0.25, 0.04]} />
          </mesh>
        </group>
      ))}

      {/* Cross bracing */}
      <mesh position={[0, -legHeight / 2 + 0.3, 0]} castShadow material={matStructure}>
        <boxGeometry args={[length - 0.4, 0.08, 0.08]} />
      </mesh>
      <mesh position={[0, -legHeight / 2 + 0.3, 0]} rotation={[0, Math.PI / 2, 0]} castShadow material={matStructure}>
        <boxGeometry args={[radius * 1.5, 0.08, 0.08]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   4. INTERACTIVE INSPECTION DOOR — shared part (see machineParts/InspectionDoor)
   ========================================================================== */

/* ==========================================================================
   5. MAIN CYLINDRICAL HOUSING (Enhanced with seams, ribs, flanges)
   ========================================================================== */

function MainHousing({ length, radius, isDoorOpen, onDoorToggle }: { length: number; radius: number; isDoorOpen: boolean; onDoorToggle: () => void }) {
  const ribCount = 4;
  const ribs = Array.from({ length: ribCount }, (_, i) => -length / 2 + 0.3 + (i / (ribCount - 1)) * (length - 0.6));

  return (
    <group>
      {/* Main Cylinder Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={matBody}>
        <cylinderGeometry args={[radius, radius, length, 48]} />
      </mesh>

      {/* Vertical panel seams */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, i) => {
        const x = Math.cos(a) * (radius + 0.005);
        const z = Math.sin(a) * (radius + 0.005);
        return (
          <mesh key={i} position={[x, 0, z]} rotation={[0, -a, 0]} material={matBodyDark}>
            <boxGeometry args={[0.015, length - 0.2, 0.03]} />
          </mesh>
        );
      })}

      {/* Horizontal stiffener rings with bolts */}
      {ribs.map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0, radius + 0.01]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
            <torusGeometry args={[radius + 0.03, 0.04, 8, 48]} />
          </mesh>
          {/* Bolts on ring */}
          {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, j) => {
            const bx = Math.cos(a) * (radius + 0.04);
            const bz = Math.sin(a) * (radius + 0.04);
            return <Bolt key={j} position={[x, bz, -bx]} rotation={[0, Math.PI / 2, -a]} size={0.016} />;
          })}
        </group>
      ))}

      {/* End Caps */}
      <mesh position={[-length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[radius, radius, 0.1, 48]} />
      </mesh>
      <mesh position={[length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[radius, radius, 0.1, 48]} />
      </mesh>

      {/* Interactive Inspection Door */}
      <InspectionDoor
        position={[0, 0, radius + 0.02]}
        rotation={[0, 0, 0]}
        width={length * 0.4}
        height={radius * 1.2}
        isOpen={isDoorOpen}
        onToggle={onDoorToggle}
      />

      {/* Warning Label Plate */}
      <group position={[0, radius * 0.5, -radius - 0.02]} rotation={[0, Math.PI, 0]}>
        <mesh material={matSafety}>
          <boxGeometry args={[length * 0.3, 0.2, 0.015]} />
        </mesh>
        <Text position={[0, 0, 0.008]} fontSize={0.05} color="#000000" anchorX="center" anchorY="middle" fontWeight="bold">
          ⚠ HIGH SPEED ROTOR
        </Text>
        {/* Plate screws */}
        {[[-0.13, 0.08], [0.13, 0.08], [-0.13, -0.08], [0.13, -0.08]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.01]}>
            <cylinderGeometry args={[0.01, 0.01, 0.01, 6]} />
            <meshStandardMaterial color={COLORS.accentCyan} metalness={0.9} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ==========================================================================
   6. INTERNAL ROTOR & BEATERS (Heavy-duty scourer beaters)
   ========================================================================== */

function InternalRotor({ length, radius, active }: { length: number; radius: number; active: boolean }) {
  const rotorRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (rotorRef.current && active) {
      rotorRef.current.rotation.x += delta * 15; // ~1450 RPM scaled
    }
  });

  const beaters = useMemo(() => {
    const items = [];
    const rows = 6;
    const cols = 4;
    for (let i = 0; i < rows; i++) {
      const x = -length / 2 + 0.3 + (i / (rows - 1)) * (length - 0.6);
      for (let j = 0; j < cols; j++) {
        const angle = (j / cols) * Math.PI * 2 + (i % 2) * 0.3; // Offset rows for better scouring
        items.push({ x, angle, id: `${i}-${j}` });
      }
    }
    return items;
  }, [length]);

  return (
    <group ref={rotorRef}>
      {/* Central Shaft */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[0.08, 0.08, length * 0.9, 16]} />
      </mesh>

      {/* Beaters */}
      {beaters.map((b) => {
        const y = Math.cos(b.angle) * (radius * 0.6);
        const z = Math.sin(b.angle) * (radius * 0.6);
        return (
          <group key={b.id} position={[b.x, y, z]} rotation={[0, 0, b.angle]}>
            {/* Beater arm */}
            <mesh castShadow material={matStructure}>
              <boxGeometry args={[0.15, 0.04, radius * 0.5]} />
            </mesh>
            {/* Beater tip (wear edge) */}
            <mesh position={[0, 0, radius * 0.25]} castShadow material={matBodyDark}>
              <boxGeometry args={[0.15, 0.06, 0.08]} />
            </mesh>
          </group>
        );
      })}

      {/* End discs */}
      {[-length / 2 + 0.15, length / 2 - 0.15].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
          <cylinderGeometry args={[radius * 0.95, radius * 0.95, 0.02, 24]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   7. DRIVE MOTOR (High-fidelity with coupling guard)
   ========================================================================== */

function DriveMotor({ position, active }: { position: V3; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 12;
    }
  });

  return (
    <group position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Motor Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={hovered ? matMotor : matMotor}>
        <cylinderGeometry args={[0.25, 0.25, 0.5, 24]} />
      </mesh>

      {/* Cooling Fins */}
      {Array.from({ length: 10 }, (_, i) => {
        const z = -0.2 + (i / 9) * 0.4;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
            <cylinderGeometry args={[0.27, 0.27, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Terminal Box */}
      <mesh position={[0, 0.27, 0]} material={matMotorDark}>
        <boxGeometry args={[0.12, 0.08, 0.14]} />
      </mesh>

      {/* Fan Cover & Blades */}
      <mesh position={[0, 0, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow material={matMotorDark}>
        <cylinderGeometry args={[0.23, 0.23, 0.06, 24]} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.33]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <cylinderGeometry args={[0.18, 0.18, 0.02, 8]} />
      </mesh>

      {/* Coupling to Rotor */}
      <mesh position={[0, 0, -0.28]} rotation={[0, 0, Math.PI / 2]} material={matBodyDark}>
        <cylinderGeometry args={[0.1, 0.1, 0.15, 16]} />
      </mesh>

      {/* Safety Coupling Guard */}
      <mesh position={[0, 0.05, -0.2]} material={matSafety}>
        <boxGeometry args={[0.15, 0.15, 0.12]} />
      </mesh>
      <mesh position={[0, 0.05, -0.2]}>
        <boxGeometry args={[0.13, 0.03, 0.005]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.27, 0.08]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={active ? COLORS.accentGreen : COLORS.accentRed} emissive={active ? COLORS.accentGreen : COLORS.accentRed} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   8. INLET, OUTLET & DUST VENT (Enhanced with flanges and bolts)
   ========================================================================== */

function InletOutletVent({ length, radius }: { length: number; radius: number }) {
  return (
    <group>
      {/* Feed Inlet (Top Left) with flange */}
      <mesh position={[-length / 3, radius + 0.3, 0]} castShadow material={matBody}>
        <boxGeometry args={[0.4, 0.6, 0.5]} />
      </mesh>
      <mesh position={[-length / 3, radius + 0.62, 0]} material={matStructure}>
        <boxGeometry args={[0.45, 0.06, 0.55]} />
      </mesh>
      {/* Inlet flange bolts */}
      {[-0.15, 0.15].map((x) =>
        [-0.2, 0.2].map((z) => (
          <Bolt key={`in-${x}-${z}`} position={[-length / 3, radius + 0.65, z]} size={0.018} />
        ))
      )}

      {/* Clean Grain Outlet (Bottom Right) with flange */}
      <mesh position={[length / 3, -radius - 0.3, 0]} castShadow material={matBody}>
        <boxGeometry args={[0.4, 0.6, 0.5]} />
      </mesh>
      <mesh position={[length / 3, -radius - 0.62, 0]} material={matStructure}>
        <boxGeometry args={[0.45, 0.06, 0.55]} />
      </mesh>
      {/* Outlet flange bolts */}
      {[-0.15, 0.15].map((x) =>
        [-0.2, 0.2].map((z) => (
          <Bolt key={`out-${x}-${z}`} position={[length / 3, -radius - 0.65, z]} size={0.018} />
        ))
      )}

      {/* Aspiration Dust Vent (Top Center) with flange */}
      <mesh position={[0, radius + 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 24]} />
      </mesh>
      <mesh position={[0, radius + 0.42, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <torusGeometry args={[0.23, 0.03, 8, 24]} />
      </mesh>
      <BoltCircle radius={0.23} count={8} y={radius + 0.42} z={0} size={0.016} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

/* ==========================================================================
   9. DATA PANEL (PLC Data)
   ========================================================================== */

function DataPanel({ position, active }: { position: V3; active: boolean }) {
  const lines = [
    { text: `WHEAT SCOURER`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ${active ? 'RUNNING' : 'STOPPED'}`, size: 0.13, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Rotor RPM: ${active ? '1450' : '0'}`, size: 0.13, color: '#3a3a3a' },
    { text: `Feed Rate: ${active ? '10' : '0'} TPH`, size: 0.13, color: '#3a3a3a' },
    { text: `Motor Load: ${active ? '48' : '0'}%`, size: 0.13, color: '#3a3a3a' },
    { text: `Bearing Temp: ${active ? '35' : '24'}°C`, size: 0.13, color: '#3a3a3a' },
    { text: `Alarm: OFF`, size: 0.13, color: COLORS.accentGreen },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.4, -0.02]}>
          <planeGeometry args={[2.0, 1.6]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.4, -0.015]}>
          <planeGeometry args={[2.04, 1.64]} />
          <meshStandardMaterial color={COLORS.accentCyan} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        {lines.map((line, i) => (
          <Text key={i} position={[-0.9, -i * 0.22, 0]} fontSize={line.size} color={line.color} anchorX="left" anchorY="top" fontWeight={line.bold ? 'bold' : 'normal'}>
            {line.text}
          </Text>
        ))}
      </group>
    </Float>
  );
}

/* ==========================================================================
   10. MAIN SCOURER COMPONENT
   ========================================================================== */

export interface ScourerProps {
  position?: V3;
  length?: number;
  radius?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function ScourerComponent({
  position = [0, 0, 0],
  length = 2.0,
  radius = 0.6,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
}: ScourerProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [isDoorOpen, setIsDoorOpen] = useState(false);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  return (
    <group position={position}>
      {/* 1. Support Frame */}
      <SupportFrame length={length} radius={radius} />

      {/* 2. Main Cylindrical Housing */}
      <MainHousing
        length={length}
        radius={radius}
        isDoorOpen={isDoorOpen}
        onDoorToggle={() => setIsDoorOpen(!isDoorOpen)}
      />

      {/* 3. Internal Rotor & Beaters */}
      <InternalRotor length={length} radius={radius} active={active} />

      {/* 4. Drive Motor */}
      <DriveMotor position={[length / 2 + 0.4, 0, 0]} active={active} />

      {/* 5. Inlet, Outlet & Dust Vent */}
      <InletOutletVent length={length} radius={radius} />

      {/* 6. Grain Flow Animation */}
      {active && (
        <Sparkles
          count={60}
          scale={[length * 0.6, radius * 2.5, radius * 0.8]}
          size={3}
          speed={2}
          position={[0, 0, 0]}
          color="#e8d5b5"
        />
      )}

      {/* 7. Dust Extraction Animation */}
      {active && (
        <Sparkles
          count={30}
          scale={[0.3, 0.8, 0.3]}
          size={2}
          speed={1.5}
          position={[0, radius + 0.6, 0]}
          color={COLORS.dustGray}
        />
      )}

      {/* 8. Data Panel */}
      {showDataPanel && (
        <DataPanel position={[0, radius + 1.2, 0]} active={active} />
      )}

      {/* 9. Click Instruction */}
      {showClickText && (
        <Text position={[0, 0, radius + 0.5]} fontSize={0.08} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
          {isDoorOpen ? '● DOOR OPEN' : '○ CLICK DOOR TO INSPECT'}
        </Text>
      )}

      {/* 10. Invisible Click Target for whole machine */}
      {controlledActive === undefined && (
        <mesh position={[0, 0, 0]} onClick={() => setInternalActive(!internalActive)} visible={false}>
          <boxGeometry args={[length + 1, radius * 3, radius * 3]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  );
}

/* ==========================================================================
   11. ENVIRONMENT & EXPORT
   ========================================================================== */

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.61, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[80, 80, '#5c5c54', '#79796e']} position={[0, -0.6, 0]} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.5]} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-far={40}
        shadow-bias={-0.0001}
      />
    </>
  );
}

export function ScourerScene() {
  const [active, setActive] = useState(true);

  return (
    <Canvas shadows camera={{ position: [5, 4, 5], fov: 45 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <ScourerComponent length={2.0} radius={0.6} active={active} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={2} maxDistance={15} maxPolarAngle={Math.PI / 2.05} target={[0, 0.5, 0]} />
    </Canvas>
  );
}

export function Scourer() {
  return <ScourerScene />;
}

export default Scourer;