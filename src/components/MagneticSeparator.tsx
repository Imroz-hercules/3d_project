'use client';

/**
 * MagneticSeparator.tsx - INDUSTRIAL MAGNETIC SEPARATOR
 * ------------------------------------------------------------------------
 * A realistic, compact industrial magnetic separator for a flour mill 
 * digital twin. It removes ferrous metal contaminants from the grain flow.
 * 
 * Key Features:
 * - Compact, box-shaped steel housing
 * - Top feed inlet and bottom outlet chute
 * - Internal permanent magnetic bars (visible when door is open)
 * - Interactive inspection/cleaning door with hinges and handle
 * - Simulated metal pieces that stick to bars when detected
 * - Alarm/status indicator light
 * - Falling grain particle animation
 * - Floating PLC data panel
 * 
 * Usage:
 *   import { MagneticSeparator } from './MagneticSeparator';
 *   <MagneticSeparator position={[0, 0, 0]} active={true} />
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

const COLORS = {
  housingSteel: '#6b7278',
  housingDark: '#4a5058',
  housingLight: '#8a9199',
  magnetSilver: '#c0c5c9',
  frameSteel: '#4a555c',
  frameSteelDark: '#3a454c',
  warningYellow: '#e0a92c',
  warningRed: '#a4222c',
  accentGreen: '#3fae56',
  accentCyan: '#00d4ff',
  metalBlack: '#1a1a1a',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   SUPPORT FRAME
   ========================================================================== */

function SupportFrame({ length, depth }: { length: number; depth: number }) {
  const legHeight = 1.2;
  const legPositions: V3[] = [
    [length / 2 - 0.15, -legHeight / 2, depth / 2 - 0.15],
    [-length / 2 + 0.15, -legHeight / 2, depth / 2 - 0.15],
    [length / 2 - 0.15, -legHeight / 2, -depth / 2 + 0.15],
    [-length / 2 + 0.15, -legHeight / 2, -depth / 2 + 0.15],
  ];

  return (
    <group>
      {legPositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={[0.12, legHeight, 0.12]} />
          <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.75} roughness={0.35} />
        </mesh>
      ))}
      {legPositions.map((pos, i) => (
        <mesh key={`base-${i}`} position={[pos[0], -legHeight / 2 + 0.05, pos[2]]}>
          <boxGeometry args={[0.25, 0.08, 0.25]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Cross brace */}
      <mesh position={[0, -legHeight / 2 + 0.3, 0]} castShadow>
        <boxGeometry args={[length - 0.3, 0.08, 0.08]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.35} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   MAIN HOUSING & CHUTES
   ========================================================================== */

function HousingAndChutes({ length, height, depth }: { length: number; height: number; depth: number }) {
  return (
    <group>
      {/* Main Steel Housing */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, height, depth]} />
        <meshStandardMaterial color={COLORS.housingSteel} metalness={0.65} roughness={0.4} />
      </mesh>

      {/* Feed Inlet (Top) */}
      <mesh position={[0, height / 2 + 0.25, 0]} castShadow>
        <boxGeometry args={[length * 0.5, 0.5, depth * 0.7]} />
        <meshStandardMaterial color={COLORS.housingSteel} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[0, height / 2 + 0.52, 0]}>
        <boxGeometry args={[length * 0.55, 0.06, depth * 0.75]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Outlet Chute (Bottom) */}
      <mesh position={[0, -height / 2 - 0.25, 0]} castShadow>
        <boxGeometry args={[length * 0.5, 0.5, depth * 0.7]} />
        <meshStandardMaterial color={COLORS.housingSteel} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[0, -height / 2 - 0.52, 0]}>
        <boxGeometry args={[length * 0.55, 0.06, depth * 0.75]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Warning Label Plate */}
      <mesh position={[0, 0, depth / 2 + 0.02]}>
        <boxGeometry args={[length * 0.4, 0.25, 0.01]} />
        <meshStandardMaterial color={COLORS.warningYellow} metalness={0.3} roughness={0.6} />
      </mesh>
      <Text
        position={[0, 0, depth / 2 + 0.03]}
        fontSize={0.06}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        ⚠ MAGNETIC FIELD
      </Text>
    </group>
  );
}

/* ==========================================================================
   MAGNETIC BARS & DETECTED METAL
   ========================================================================== */

function MagneticBars({ metalDetected }: { metalDetected: boolean }) {
  // 2 rows, 6 columns of magnetic bars
  const bars = useMemo(() => {
    const items = [];
    const zPositions = [-0.15, 0.15];
    const xPositions = [-0.4, -0.24, -0.08, 0.08, 0.24, 0.4];
    
    zPositions.forEach((z, zi) => {
      xPositions.forEach((x, xi) => {
        items.push({ x, z, id: `${zi}-${xi}` });
      });
    });
    return items;
  }, []);

  // Simulated metal pieces stuck to specific bars
  const metalPieces = useMemo(() => {
    if (!metalDetected) return [];
    return [
      { x: -0.24, z: 0.15, y: 0.04, scale: 0.03 },
      { x: 0.08, z: -0.15, y: -0.03, scale: 0.025 },
      { x: 0.4, z: 0.15, y: 0.02, scale: 0.035 },
    ];
  }, [metalDetected]);

  return (
    <group>
      {/* Magnetic Bars */}
      {bars.map((bar) => (
        <mesh key={bar.id} position={[bar.x, 0, bar.z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.55, 16]} />
          <meshStandardMaterial color={COLORS.magnetSilver} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Stuck Metal Pieces (visible when door is open or if we peek inside) */}
      {metalPieces.map((piece, i) => (
        <mesh key={`metal-${i}`} position={[piece.x, piece.y, piece.z]}>
          <boxGeometry args={[piece.scale, piece.scale, piece.scale * 1.5]} />
          <meshStandardMaterial color={COLORS.metalBlack} metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   INSPECTION DOOR (Interactive)
   ========================================================================== */

function InspectionDoor({ 
  length, 
  height, 
  isOpen, 
  onToggle 
}: { 
  length: number; 
  height: number; 
  isOpen: boolean; 
  onToggle: () => void; 
}) {
  const doorRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    const targetRotation = isOpen ? -Math.PI / 2.2 : 0;
    doorRef.current.rotation.y = THREE.MathUtils.damp(
      doorRef.current.rotation.y, 
      targetRotation, 
      4, 
      delta
    );
  });

  return (
    <group
      ref={doorRef}
      position={[-length / 2, 0, 0.46]} // Pivot at left edge of front face
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onToggle(); }}
    >
      {/* Door Panel */}
      <mesh position={[length / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, height, 0.06]} />
        <meshStandardMaterial 
          color={hovered ? COLORS.housingLight : COLORS.housingSteel} 
          metalness={0.65} 
          roughness={0.4} 
        />
      </mesh>

      {/* Door Frame/Seal */}
      <mesh position={[length / 2, 0, 0.04]}>
        <boxGeometry args={[length - 0.1, height - 0.1, 0.02]} />
        <meshStandardMaterial color={COLORS.housingDark} metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Hinges */}
      {[0.35, -0.35].map((y, i) => (
        <mesh key={i} position={[0.05, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.12, 12]} />
          <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Handle */}
      <group position={[length - 0.15, 0, 0.06]}>
        <mesh>
          <boxGeometry args={[0.04, 0.2, 0.04]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.08, 12]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

/* ==========================================================================
   STATUS INDICATOR LIGHT
   ========================================================================== */

function StatusLight({ position, metalDetected }: { position: V3; metalDetected: boolean }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.06, 0.06, 0.15, 16]} />
        <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color={metalDetected ? COLORS.warningRed : COLORS.accentGreen}
          emissive={metalDetected ? COLORS.warningRed : COLORS.accentGreen}
          emissiveIntensity={metalDetected ? 1.2 : 0.6}
        />
      </mesh>
      {metalDetected && (
        <pointLight position={[0, 0.1, 0]} color={COLORS.warningRed} intensity={2} distance={1.5} />
      )}
    </group>
  );
}

/* ==========================================================================
   DATA PANEL (PLC Data)
   ========================================================================== */

function DataPanel({
  position,
  metalDetected,
  collectedMetal,
}: {
  position: V3;
  metalDetected: boolean;
  collectedMetal: number;
}) {
  const lines = [
    { text: `MAGNETIC SEPARATOR`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: RUNNING`, size: 0.13, color: COLORS.accentGreen },
    { text: `Metal Detected: ${metalDetected ? 'YES' : 'NO'}`, size: 0.13, color: metalDetected ? COLORS.warningRed : '#3a3a3a' },
    { text: `Collected Metal: ${collectedMetal.toFixed(1)} kg`, size: 0.13, color: '#3a3a3a' },
    { text: `Cleaning Required: ${metalDetected ? 'YES' : 'NO'}`, size: 0.13, color: metalDetected ? COLORS.warningYellow : COLORS.accentGreen },
    { text: `Alarm: ${metalDetected ? 'ACTIVE' : 'OFF'}`, size: 0.13, color: metalDetected ? COLORS.warningRed : '#3a3a3a' },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.4, -0.02]}>
          <planeGeometry args={[2.2, 1.6]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.4, -0.015]}>
          <planeGeometry args={[2.24, 1.64]} />
          <meshStandardMaterial color={COLORS.warningYellow} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {lines.map((line, i) => (
          <Text
            key={i}
            position={[-1, -i * 0.24, 0]}
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
   MAIN MAGNETIC SEPARATOR COMPONENT
   ========================================================================== */

export interface MagneticSeparatorProps {
  position?: V3;
  length?: number;
  width?: number;
  height?: number;
  active?: boolean;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function MagneticSeparatorComponent({
  position = [0, 0, 0],
  length = 1.2,
  width = 0.7,
  height = 0.9,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
}: MagneticSeparatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [metalDetected, setMetalDetected] = useState(false);
  const [collectedMetal, setCollectedMetal] = useState(2.4);

  // Simulate metal detection over time
  useFrame(() => {
    if (controlledActive && !metalDetected) {
      // Random chance to detect metal
      if (Math.random() < 0.002) {
        setMetalDetected(true);
      }
    }
    if (metalDetected) {
      setCollectedMetal((prev) => Math.min(prev + 0.001, 5.0));
    }
  });

  const handleClean = () => {
    if (isOpen && metalDetected) {
      setMetalDetected(false);
      setCollectedMetal(0.0);
    }
  };

  return (
    <group position={position}>
      {/* 1. Support Frame */}
      <SupportFrame length={length} depth={width} />

      {/* 2. Main Housing & Chutes */}
      <HousingAndChutes length={length} height={height} depth={width} />

      {/* 3. Internal Magnetic Bars */}
      <MagneticBars metalDetected={metalDetected} />

      {/* 4. Interactive Inspection Door */}
      <InspectionDoor 
        length={length} 
        height={height} 
        isOpen={isOpen} 
        onToggle={() => {
          setIsOpen(!isOpen);
          if (!isOpen && metalDetected) {
            // Auto-clean when opened for maintenance
            setTimeout(handleClean, 500);
          }
        }} 
      />

      {/* 5. Status Indicator Light */}
      <StatusLight position={[length / 2 + 0.1, height / 2, width / 2]} metalDetected={metalDetected} />

      {/* 6. Falling Grain Animation (only when active) */}
      {controlledActive && (
        <Sparkles
          count={40}
          scale={[length * 0.4, height + 1, width * 0.6]}
          size={3}
          speed={1.5}
          position={[0, 0, 0]}
          color="#e8d5b5"
        />
      )}

      {showDataPanel && (
        <DataPanel
          position={[length / 2 + 1.5, height / 2, 0]}
          metalDetected={metalDetected}
          collectedMetal={collectedMetal}
        />
      )}

      {showClickText && (
        <Text
          position={[0, height / 2 + 0.8, width / 2 + 0.2]}
          fontSize={0.08}
          color={COLORS.accentCyan}
          anchorX="center"
          anchorY="middle"
        >
          {isOpen ? '● DOOR OPEN (CLEANED)' : '○ CLICK HANDLE TO OPEN'}
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
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-far={40}
      />
    </>
  );
}

/* ==========================================================================
   EXPORT - SCENE
   ========================================================================== */

export function MagneticSeparatorScene() {
  return (
    <Canvas shadows camera={{ position: [4, 3, 4], fov: 45 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <MagneticSeparatorComponent
        length={1.2}
        width={0.7}
        height={0.9}
        active={true}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.5, 0]}
      />
    </Canvas>
  );
}

export function MagneticSeparator() {
  return <MagneticSeparatorScene />;
}

export default MagneticSeparator;