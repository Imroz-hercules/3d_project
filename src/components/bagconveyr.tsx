'use client';

/**
 * BagConveyor.tsx — HIGH-FIDELITY INDUSTRIAL BAG CONVEYOR
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, robust I-beam support legs with gussets, a 
 * high-fidelity gear motor with safety coupling guard, detailed side 
 * guides, industrial photoelectric sensor, and a realistic animated 
 * flour bag with seam details.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { ScrollingBelt } from './machineParts/animation';

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
  sensorGreen: '#3fae56',
  sensorRed: '#ff2222',
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
   3. CONVEYOR FRAME (I-beam legs, base plates, gussets, bracing)
   ========================================================================== */

function ConveyorFrame({ length, width, height }: { length: number; width: number; height: number }) {
  const legPositions: V3[] = [
    [length / 2 - 0.2, height / 2, width / 2 - 0.15],
    [-length / 2 + 0.2, height / 2, width / 2 - 0.15],
    [length / 2 - 0.2, height / 2, -width / 2 + 0.15],
    [-length / 2 + 0.2, height / 2, -width / 2 + 0.15],
  ];

  return (
    <group>
      {legPositions.map((pos, i) => (
        <group key={i}>
          {/* I-beam leg simulation */}
          <mesh position={pos} castShadow material={matStructure}>
            <boxGeometry args={[0.14, height, 0.14]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.16, height, 0.05]} />
          </mesh>
          <mesh position={pos} material={matStructure}>
            <boxGeometry args={[0.05, height, 0.16]} />
          </mesh>

          {/* Base plate */}
          <mesh position={[pos[0], -height / 2 + 0.04, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.3, 0.08, 0.3]} />
          </mesh>

          {/* Anchor bolts */}
          {[-0.1, 0.1].map((dx) =>
            [-0.1, 0.1].map((dz) => (
              <Bolt key={`${dx}-${dz}`} position={[pos[0] + dx, -height / 2 + 0.09, pos[2] + dz]} size={0.016} />
            ))
          )}

          {/* Top gusset plate */}
          <mesh position={[pos[0], height / 2 - 0.1, pos[2]]} castShadow material={matStructure}>
            <boxGeometry args={[0.18, 0.25, 0.05]} />
          </mesh>
        </group>
      ))}

      {/* Main Frame Rails (Longitudinal) */}
      <mesh position={[0, height - 0.1, width / 2 - 0.08]} castShadow material={matStructure}>
        <boxGeometry args={[length, 0.12, 0.08]} />
      </mesh>
      <mesh position={[0, height - 0.1, -width / 2 + 0.08]} castShadow material={matStructure}>
        <boxGeometry args={[length, 0.12, 0.08]} />
      </mesh>

      {/* Cross Members */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = -length / 2 + 0.3 + (i / 5) * (length - 0.6);
        return (
          <mesh key={i} position={[x, height - 0.1, 0]} castShadow material={matStructure}>
            <boxGeometry args={[0.08, 0.1, width - 0.16]} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   4. BELT & ROLLERS (Enhanced with bearings and end caps)
   ========================================================================== */

function BeltAndRollers({ length, width, height, active }: { length: number; width: number; height: number; active: boolean }) {
  const driveRollerRef = useRef<THREE.Mesh>(null!);
  const tailRollerRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (active) {
      if (driveRollerRef.current) driveRollerRef.current.rotation.z += delta * 3;
      if (tailRollerRef.current) tailRollerRef.current.rotation.z -= delta * 3;
    }
  });

  return (
    <group>
      {/* Belt Surface — texture scrolls in sync with roller rotation */}
      <ScrollingBelt
        length={length - 0.3}
        width={width - 0.2}
        position={[0, height - 0.05, 0]}
        active={active}
        speed={0.36}
      />

      {/* Drive Roller (Right end) */}
      <mesh ref={driveRollerRef} position={[length / 2 - 0.15, height - 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[0.12, 0.12, width - 0.25, 24]} />
      </mesh>

      {/* Tail Roller (Left end) */}
      <mesh ref={tailRollerRef} position={[-length / 2 + 0.15, height - 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matBodyDark}>
        <cylinderGeometry args={[0.12, 0.12, width - 0.25, 24]} />
      </mesh>

      {/* Roller End Caps & Bearings */}
      {[length / 2 - 0.15, -length / 2 + 0.15].map((x, i) => (
        <group key={i}>
          <mesh position={[x, height - 0.1, width / 2 - 0.15]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
            <cylinderGeometry args={[0.14, 0.14, 0.05, 24]} />
          </mesh>
          <mesh position={[x, height - 0.1, -width / 2 + 0.15]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
            <cylinderGeometry args={[0.14, 0.14, 0.05, 24]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   5. GEAR MOTOR (High-fidelity with coupling guard)
   ========================================================================== */

function GearMotor({ position, active }: { position: V3; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 8;
    }
  });

  return (
    <group position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Gearbox */}
      <mesh castShadow material={matStructure}>
        <boxGeometry args={[0.25, 0.25, 0.2]} />
      </mesh>
      {/* Gearbox mounting bolts */}
      {[[-0.1, -0.08], [0.1, -0.08], [-0.1, 0.08], [0.1, 0.08]].map(([x, z], i) => (
        <Bolt key={i} position={[x, 0, z]} rotation={[0, 0, Math.PI / 2]} size={0.016} />
      ))}

      {/* Motor Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={hovered ? matMotor : matMotor}>
        <cylinderGeometry args={[0.18, 0.18, 0.4, 24]} />
      </mesh>

      {/* Cooling Fins */}
      {Array.from({ length: 8 }, (_, i) => {
        const z = -0.15 + (i / 7) * 0.3;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
            <cylinderGeometry args={[0.2, 0.2, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Terminal Box */}
      <mesh position={[0, 0.2, 0]} material={matMotorDark}>
        <boxGeometry args={[0.1, 0.06, 0.12]} />
      </mesh>

      {/* Fan Cover & Blades */}
      <mesh position={[0, 0, 0.22]} rotation={[0, 0, Math.PI / 2]} castShadow material={matMotorDark}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 24]} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.25]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <cylinderGeometry args={[0.13, 0.13, 0.03, 8]} />
      </mesh>

      {/* Shaft to Roller */}
      <mesh position={[0, 0, -0.25]} rotation={[0, 0, Math.PI / 2]} material={matBodyDark}>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 16]} />
      </mesh>

      {/* Safety Coupling Guard */}
      <mesh position={[0, 0.05, -0.2]} material={matSafety}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.2, 0.06]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial color={active ? COLORS.accentGreen : COLORS.accentRed} emissive={active ? COLORS.accentGreen : COLORS.accentRed} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   6. SIDE GUIDES & SAFETY GUARDS
   ========================================================================== */

function SideGuidesAndGuards({ length, width, height }: { length: number; width: number; height: number }) {
  return (
    <group>
      {/* Side Guide Rails */}
      <mesh position={[0, height + 0.05, width / 2 - 0.05]} castShadow material={matBody}>
        <boxGeometry args={[length - 0.3, 0.12, 0.05]} />
      </mesh>
      <mesh position={[0, height + 0.05, -width / 2 + 0.05]} castShadow material={matBody}>
        <boxGeometry args={[length - 0.3, 0.12, 0.05]} />
      </mesh>

      {/* Safety Guards (Yellow) around rollers */}
      {[
        [length / 2 - 0.15, width / 2 + 0.1],
        [length / 2 - 0.15, -width / 2 - 0.1],
        [-length / 2 + 0.15, width / 2 + 0.1],
        [-length / 2 + 0.15, -width / 2 - 0.1],
      ].map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, height - 0.1, z]} castShadow material={matSafety}>
            <boxGeometry args={[0.3, 0.3, 0.15]} />
          </mesh>
          {/* Guard stripe */}
          <mesh position={[x, height - 0.1, z + (z > 0 ? 0.08 : -0.08)]}>
            <boxGeometry args={[0.28, 0.28, 0.01]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   7. PHOTOELECTRIC SENSOR (Industrial style)
   ========================================================================== */

function PhotoelectricSensor({ position, bagDetected }: { position: V3; bagDetected: boolean }) {
  return (
    <group position={position}>
      {/* Mounting Bracket */}
      <mesh material={matStructure}>
        <boxGeometry args={[0.04, 0.15, 0.08]} />
      </mesh>
      {/* Sensor Body */}
      <mesh position={[0, 0.1, 0]} castShadow material={matBodyDark}>
        <boxGeometry args={[0.06, 0.1, 0.05]} />
      </mesh>
      {/* Sensor Lens */}
      <mesh position={[0, 0.1, 0.03]}>
        <cylinderGeometry args={[0.02, 0.02, 0.01, 16]} />
        <meshStandardMaterial 
          color={bagDetected ? COLORS.sensorGreen : COLORS.sensorRed}
          emissive={bagDetected ? COLORS.sensorGreen : COLORS.sensorRed}
          emissiveIntensity={bagDetected ? 1.0 : 0.5}
        />
      </mesh>
      {/* Mounting bolts */}
      <Bolt position={[0, 0.05, 0.04]} rotation={[0, Math.PI / 2, 0]} size={0.012} />
      <Bolt position={[0, 0.15, 0.04]} rotation={[0, Math.PI / 2, 0]} size={0.012} />
    </group>
  );
}

/* ==========================================================================
   8. CABLE TRAY
   ========================================================================== */

function CableTray({ length, width, height }: { length: number; width: number; height: number }) {
  return (
    <group position={[0, height * 0.5, -width / 2 - 0.15]}>
      {/* Tray Bottom */}
      <mesh castShadow material={matStructure}>
        <boxGeometry args={[length - 0.4, 0.03, 0.12]} />
      </mesh>
      {/* Tray Sides */}
      <mesh position={[0, 0.04, 0.05]} material={matStructure}>
        <boxGeometry args={[length - 0.4, 0.08, 0.02]} />
      </mesh>
      <mesh position={[0, 0.04, -0.05]} material={matStructure}>
        <boxGeometry args={[length - 0.4, 0.08, 0.02]} />
      </mesh>
      {/* Cables (simulated) */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[length - 0.5, 0.04, 0.08]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   9. REALISTIC ANIMATED FLOUR BAG
   ========================================================================== */

function ConveyorBag({
  startX,
  beltY,
  travel,
  active,
  onComplete,
}: {
  startX: number;
  beltY: number;
  travel: number;
  active: boolean;
  onComplete: () => void;
}) {
  const bagRef = useRef<THREE.Mesh>(null!);
  const seamRef = useRef<THREE.Mesh>(null!);
  const progressRef = useRef(0);
  const doneRef = useRef(false);

  useFrame((_, delta) => {
    if (!active || !bagRef.current || doneRef.current) return;
    const speed = 0.45;
    progressRef.current = Math.min(travel, progressRef.current + delta * speed);
    bagRef.current.position.x = startX + progressRef.current;
    
    if (seamRef.current) {
      seamRef.current.position.x = startX + progressRef.current;
    }

    if (progressRef.current >= travel - 0.01) {
      doneRef.current = true;
      onComplete();
    }
  });

  return (
    <group>
      {/* Main Bag Body */}
      <mesh ref={bagRef} position={[startX, beltY, 0]} castShadow>
        <boxGeometry args={[0.4, 0.55, 0.3]} />
        <meshStandardMaterial color="#f0f0eb" roughness={0.95} metalness={0} />
      </mesh>
      {/* Bag Seam / Fold line detail */}
      <mesh ref={seamRef} position={[startX, beltY + 0.27, 0]}>
        <boxGeometry args={[0.41, 0.02, 0.31]} />
        <meshStandardMaterial color="#d0d0cb" roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   10. PLC DATA PANEL
   ========================================================================== */

function DataPanel({ position, active, bagCount, sensorActive }: { 
  position: V3; active: boolean; bagCount: number; sensorActive: boolean; 
}) {
  const lines = [
    { text: `BAG CONVEYOR`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: ${active ? 'RUNNING' : 'STOPPED'}`, size: 0.13, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Speed: ${active ? '18' : '0'} m/min`, size: 0.13, color: '#3a3a3a' },
    { text: `Bag Count: ${bagCount.toLocaleString()}`, size: 0.13, color: '#3a3a3a' },
    { text: `Sensor: ${sensorActive ? 'ACTIVE' : 'CLEAR'}`, size: 0.13, color: sensorActive ? COLORS.sensorGreen : '#3a3a3a' },
    { text: `Motor Current: ${active ? '3.1' : '0.0'} A`, size: 0.13, color: '#3a3a3a' },
    { text: `Alarm: OFF`, size: 0.13, color: COLORS.accentGreen },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.4, -0.02]}>
          <planeGeometry args={[2.0, 1.8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.4, -0.015]}>
          <planeGeometry args={[2.04, 1.84]} />
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
   11. MAIN BAG CONVEYOR COMPONENT
   ========================================================================== */

export interface BagConveyorProps {
  position?: V3;
  length?: number;
  width?: number;
  height?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function BagConveyorComponent({
  position = [0, 0, 0],
  length = 3.5,
  width = 0.7,
  height = 0.85,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
}: BagConveyorProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [bagCount, setBagCount] = useState(1456);
  const [sensorActive, setSensorActive] = useState(false);
  const [bags, setBags] = useState<Array<{ id: number }>>([]);
  
  const active = controlledActive !== undefined ? controlledActive : internalActive;
  const startX = -length / 2 + 0.35;
  const travel = length - 0.7;
  const beltY = height + 0.28;

  useEffect(() => {
    if (!active) {
      setBags([]);
      setSensorActive(false);
      return;
    }

    const interval = setInterval(() => {
      setBags((prev) => [...prev, { id: Date.now() }]);
      setSensorActive(true);
      setTimeout(() => setSensorActive(false), 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [active]);

  const handleBagComplete = (bagId: number) => {
    setBags((prev) => prev.filter((b) => b.id !== bagId));
    setBagCount((prev) => prev + 1);
  };

  return (
    <group position={position}>
      <ConveyorFrame length={length} width={width} height={height} />
      <BeltAndRollers length={length} width={width} height={height} active={active} />
      <GearMotor position={[length / 2 + 0.3, height - 0.1, width / 2 + 0.15]} active={active} />
      <SideGuidesAndGuards length={length} width={width} height={height} />
      <PhotoelectricSensor position={[-length / 2 + 0.5, height + 0.15, width / 2 + 0.1]} bagDetected={sensorActive} />
      <CableTray length={length} width={width} height={height} />
      
      {bags.map((bag) => (
        <ConveyorBag
          key={bag.id}
          startX={startX}
          beltY={beltY}
          travel={travel}
          active={active}
          onComplete={() => handleBagComplete(bag.id)}
        />
      ))}

      {showDataPanel && (
        <DataPanel 
          position={[0, height + 1.5, width / 2 + 1.5]} 
          active={active} 
          bagCount={bagCount}
          sensorActive={sensorActive}
        />
      )}

      <mesh position={[0, height / 2, 0]} onClick={() => setInternalActive(!internalActive)} visible={false}>
        <boxGeometry args={[length + 1, height + 1, width + 1]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {showClickText && (
        <Text position={[0, height + 1.2, 0]} fontSize={0.1} color={COLORS.accentCyan} anchorX="center" anchorY="middle">
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

export function BagConveyorScene() {
  const [active, setActive] = useState(true);
  return (
    <Canvas shadows camera={{ position: [6, 4, 6], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <BagConveyorComponent length={3.5} width={0.7} height={0.85} active={active} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={3} maxDistance={15} maxPolarAngle={Math.PI / 2.05} target={[0, 0.5, 0]} />
    </Canvas>
  );
}

export function BagConveyor() { return <BagConveyorScene />; }
export default BagConveyor;