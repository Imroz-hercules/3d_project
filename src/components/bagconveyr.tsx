'use client';

/**
 * BagConveyor.tsx - INDUSTRIAL BAG CONVEYOR
 * ------------------------------------------------------------------------
 * A realistic industrial bag conveyor for a flour mill digital twin.
 * This conveyor receives filled bags from the packing machine and 
 * transports them to the sewing machine.
 * 
 * Key Features:
 * - Welded steel frame with adjustable legs
 * - PVC/rubber belt with animated texture
 * - Drive roller with side-mounted gear motor
 * - Tail roller at opposite end
 * - Side guide rails to prevent bags from falling
 * - Photoelectric sensor for bag detection
 * - Cable tray for power/data
 * - Safety guards around rotating rollers
 * - Event-driven operation (starts when bag arrives)
 * - Animated bags moving along the belt
 * - Real-time PLC data panel
 * 
 * Usage:
 *   import { BagConveyor } from './BagConveyor';
 *   <BagConveyor position={[0, 0, 0]} length={3.5} active={true} />
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

const COLORS = {
  frameSteel: '#4a555c',
  frameSteelDark: '#3a454c',
  frameSteelLight: '#6b7278',
  beltBlack: '#1a1a1a',
  beltGray: '#2a2a2a',
  rollerSteel: '#6b7278',
  rollerDark: '#4a5058',
  motorBlue: '#1e3a5f',
  motorDark: '#152a45',
  safetyYellow: '#e0a92c',
  safetyYellowDark: '#c88a0a',
  sensorRed: '#ff2222',
  sensorGreen: '#3fae56',
  bagWhite: '#f5f5f0',
  concrete: '#9a9a92',
  accentCyan: '#00d4ff',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
} as const;

/* ==========================================================================
   CONVEYOR FRAME & LEGS
   ========================================================================== */

function ConveyorFrame({ length, width, height }: { length: number; width: number; height: number }) {
  const legPositions: V3[] = [
    [length / 2 - 0.15, height / 2, width / 2 - 0.1],
    [-length / 2 + 0.15, height / 2, width / 2 - 0.1],
    [length / 2 - 0.15, height / 2, -width / 2 + 0.1],
    [-length / 2 + 0.15, height / 2, -width / 2 + 0.1],
  ];

  return (
    <group>
      {/* Main Frame Rails (Longitudinal) */}
      <mesh position={[0, height - 0.15, width / 2 - 0.08]} castShadow>
        <boxGeometry args={[length, 0.15, 0.08]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, height - 0.15, -width / 2 + 0.08]} castShadow>
        <boxGeometry args={[length, 0.15, 0.08]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Cross Members */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = -length / 2 + 0.3 + (i / 5) * (length - 0.6);
        return (
          <mesh key={i} position={[x, height - 0.15, 0]} castShadow>
            <boxGeometry args={[0.08, 0.12, width - 0.16]} />
            <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
          </mesh>
        );
      })}

      {/* Support Legs */}
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={[0.1, height - 0.15, 0.1]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Adjustable Feet */}
      {legPositions.map((pos, i) => (
        <mesh key={`foot-${i}`} position={[pos[0], 0.05, pos[2]]}>
          <cylinderGeometry args={[0.08, 0.1, 0.1, 16]} />
          <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   BELT & ROLLERS
   ========================================================================== */

function BeltAndRollers({ length, width, height, active }: { length: number; width: number; height: number; active: boolean }) {
  const beltRef = useRef<THREE.Mesh>(null!);
  const driveRollerRef = useRef<THREE.Mesh>(null!);
  const tailRollerRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (active) {
      // Animate belt texture offset
      if (beltRef.current) {
        const material = beltRef.current.material as THREE.MeshStandardMaterial;
        if (material.map) {
          material.map.offset.x += delta * 0.5;
        }
      }
      // Rotate rollers
      if (driveRollerRef.current) driveRollerRef.current.rotation.z += delta * 3;
      if (tailRollerRef.current) tailRollerRef.current.rotation.z -= delta * 3;
    }
  });

  return (
    <group>
      {/* Belt Surface */}
      <mesh ref={beltRef} position={[0, height - 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[length - 0.3, 0.05, width - 0.2]} />
        <meshStandardMaterial 
          color={COLORS.beltBlack} 
          roughness={0.9} 
          metalness={0.1}
          map={null} // In production, add a texture with repeating pattern
        />
      </mesh>

      {/* Drive Roller (Right end) */}
      <mesh ref={driveRollerRef} position={[length / 2 - 0.15, height - 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, width - 0.25, 24]} />
        <meshStandardMaterial color={COLORS.rollerSteel} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Tail Roller (Left end) */}
      <mesh ref={tailRollerRef} position={[-length / 2 + 0.15, height - 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, width - 0.25, 24]} />
        <meshStandardMaterial color={COLORS.rollerSteel} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Roller End Caps */}
      {[length / 2 - 0.15, -length / 2 + 0.15].map((x, i) => (
        <group key={i}>
          <mesh position={[x, height - 0.1, width / 2 - 0.15]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.05, 24]} />
            <meshStandardMaterial color={COLORS.rollerDark} metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[x, height - 0.1, -width / 2 + 0.15]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.05, 24]} />
            <meshStandardMaterial color={COLORS.rollerDark} metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   GEAR MOTOR
   ========================================================================== */

function GearMotor({ position, active }: { position: V3; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 8;
    }
  });

  return (
    <group position={position}>
      {/* Motor Body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.4, 24]} />
        <meshStandardMaterial color={COLORS.motorBlue} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Cooling Fins */}
      {Array.from({ length: 8 }, (_, i) => {
        const z = -0.15 + (i / 7) * 0.3;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.015, 24]} />
            <meshStandardMaterial color={COLORS.motorDark} metalness={0.65} roughness={0.35} />
          </mesh>
        );
      })}

      {/* Fan Cover */}
      <mesh position={[0, 0, 0.22]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 24]} />
        <meshStandardMaterial color={COLORS.motorDark} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Fan Blades */}
      <mesh ref={fanRef} position={[0, 0, 0.25]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.03, 8]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Gearbox */}
      <mesh position={[0, 0, -0.25]} castShadow>
        <boxGeometry args={[0.25, 0.25, 0.2]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Shaft to Roller */}
      <mesh position={[0, 0, -0.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 0.1, 16]} />
        <meshStandardMaterial color={COLORS.rollerSteel} metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Status LED */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.03, 12, 12]} />
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
   SIDE GUIDES & SAFETY GUARDS
   ========================================================================== */

function SideGuidesAndGuards({ length, width, height }: { length: number; width: number; height: number }) {
  return (
    <group>
      {/* Side Guide Rails */}
      <mesh position={[0, height + 0.05, width / 2 - 0.05]} castShadow>
        <boxGeometry args={[length - 0.3, 0.15, 0.05]} />
        <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, height + 0.05, -width / 2 + 0.05]} castShadow>
        <boxGeometry args={[length - 0.3, 0.15, 0.05]} />
        <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Safety Guards (Yellow) around rollers */}
      <mesh position={[length / 2 - 0.15, height - 0.1, width / 2 + 0.1]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.15]} />
        <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[length / 2 - 0.15, height - 0.1, -width / 2 - 0.1]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.15]} />
        <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-length / 2 + 0.15, height - 0.1, width / 2 + 0.1]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.15]} />
        <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-length / 2 + 0.15, height - 0.1, -width / 2 - 0.1]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.15]} />
        <meshStandardMaterial color={COLORS.safetyYellow} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   PHOTOELECTRIC SENSOR
   ========================================================================== */

function PhotoelectricSensor({ position, bagDetected }: { position: V3; bagDetected: boolean }) {
  return (
    <group position={position}>
      {/* Sensor Body */}
      <mesh castShadow>
        <boxGeometry args={[0.08, 0.12, 0.06]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Sensor Lens */}
      <mesh position={[0, 0, 0.035]}>
        <cylinderGeometry args={[0.025, 0.025, 0.01, 16]} />
        <meshStandardMaterial 
          color={bagDetected ? COLORS.sensorGreen : COLORS.sensorRed}
          emissive={bagDetected ? COLORS.sensorGreen : COLORS.sensorRed}
          emissiveIntensity={bagDetected ? 1.0 : 0.5}
        />
      </mesh>
      {/* Mounting Bracket */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[0.03, 0.04, 0.05]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   CABLE TRAY
   ========================================================================== */

function CableTray({ length, width, height }: { length: number; width: number; height: number }) {
  return (
    <group position={[0, height * 0.5, -width / 2 - 0.15]}>
      {/* Tray Bottom */}
      <mesh castShadow>
        <boxGeometry args={[length - 0.4, 0.03, 0.12]} />
        <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Tray Sides */}
      <mesh position={[0, 0.04, 0.05]}>
        <boxGeometry args={[length - 0.4, 0.08, 0.02]} />
        <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.04, -0.05]}>
        <boxGeometry args={[length - 0.4, 0.08, 0.02]} />
        <meshStandardMaterial color={COLORS.frameSteelLight} metalness={0.7} roughness={0.35} />
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
   ANIMATED BAG ON CONVEYOR
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
  const progressRef = useRef(0);
  const doneRef = useRef(false);

  useFrame((_, delta) => {
    if (!active || !bagRef.current || doneRef.current) return;
    const speed = 0.45;
    progressRef.current = Math.min(travel, progressRef.current + delta * speed);
    bagRef.current.position.x = startX + progressRef.current;
    if (progressRef.current >= travel - 0.01) {
      doneRef.current = true;
      onComplete();
    }
  });

  return (
    <mesh ref={bagRef} position={[startX, beltY, 0]} castShadow>
      <boxGeometry args={[0.4, 0.55, 0.3]} />
      <meshStandardMaterial color={COLORS.bagWhite} roughness={0.9} metalness={0} />
    </mesh>
  );
}

/* ==========================================================================
   PLC DATA PANEL
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
        <mesh position={[0, -0.4, -0.02]}><planeGeometry args={[2.0, 1.8]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, -0.4, -0.015]}><planeGeometry args={[2.04, 1.84]} /><meshStandardMaterial color={COLORS.safetyYellow} transparent opacity={0.4} side={THREE.DoubleSide} /></mesh>
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
   MAIN BAG CONVEYOR COMPONENT
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

  // Simulate bag arrival and sensor detection (local coords)
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
   SCENE EXPORT
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
      <directionalLight position={[10, 15, 10]} intensity={1.4} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-far={40} />
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