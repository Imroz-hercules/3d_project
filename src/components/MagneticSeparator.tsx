'use client';

/**
 * MagneticSeparator.tsx — HIGH-FIDELITY INDUSTRIAL MAGNETIC SEPARATOR
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, flanged inlet/outlet spouts, interactive inspection 
 * door with gasket, robust I-beam support legs with gussets, and detailed 
 * rare-earth magnetic tubes.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useMemo } from 'react';
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

const matMagnet = new THREE.MeshStandardMaterial({
  color: '#c0c5c9',
  metalness: 0.9,
  roughness: 0.2,
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
  metalBlack: '#1a1a1a',
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
        <boxGeometry args={[length - 0.3, 0.08, 0.08]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   4. MAIN HOUSING & CHUTES (Enhanced with seams, ribs, flanges)
   ========================================================================== */

function HousingAndChutes({ length, height, depth }: { length: number; height: number; depth: number }) {
  return (
    <group>
      {/* Main Steel Housing */}
      <mesh castShadow receiveShadow material={matBody}>
        <boxGeometry args={[length, height, depth]} />
      </mesh>

      {/* Vertical & horizontal panel seams */}
      {[-length * 0.33, 0, length * 0.33].map((x, i) =>
        [depth / 2 + 0.01, -(depth / 2 + 0.01)].map((z, j) => (
          <mesh key={`seam-v-${i}-${j}`} position={[x, 0, z]} material={matBodyDark}>
            <boxGeometry args={[0.015, height * 0.9, 0.02]} />
          </mesh>
        ))
      )}

      {/* Horizontal stiffener ribs with bolts */}
      {[-height * 0.25, height * 0.25].map((y, i) => (
        <group key={`rib-${i}`}>
          <mesh position={[0, y, depth / 2 + 0.01]} material={matStructure}>
            <boxGeometry args={[length * 0.96, 0.05, 0.025]} />
          </mesh>
          <mesh position={[0, y, -depth / 2 - 0.01]} material={matStructure}>
            <boxGeometry args={[length * 0.96, 0.05, 0.025]} />
          </mesh>
          {[-length * 0.4, 0, length * 0.4].map((x) => (
            <Bolt key={`f-${x}`} position={[x, y, depth / 2 + 0.025]} size={0.016} />
          ))}
          {[-length * 0.4, 0, length * 0.4].map((x) => (
            <Bolt key={`b-${x}`} position={[x, y, -depth / 2 - 0.025]} rotation={[0, Math.PI, 0]} size={0.016} />
          ))}
        </group>
      ))}

      {/* Feed Inlet (Top) with flange */}
      <mesh position={[0, height / 2 + 0.25, 0]} castShadow material={matBody}>
        <boxGeometry args={[length * 0.5, 0.5, depth * 0.7]} />
      </mesh>
      <mesh position={[0, height / 2 + 0.52, 0]} material={matStructure}>
        <boxGeometry args={[length * 0.55, 0.06, depth * 0.75]} />
      </mesh>
      {/* Inlet flange bolts */}
      {[-length * 0.2, length * 0.2].map((x) =>
        [-depth * 0.3, depth * 0.3].map((z) => (
          <Bolt key={`in-${x}-${z}`} position={[x, height / 2 + 0.55, z]} size={0.018} />
        ))
      )}

      {/* Outlet Chute (Bottom) with flange */}
      <mesh position={[0, -height / 2 - 0.25, 0]} castShadow material={matBody}>
        <boxGeometry args={[length * 0.5, 0.5, depth * 0.7]} />
      </mesh>
      <mesh position={[0, -height / 2 - 0.52, 0]} material={matStructure}>
        <boxGeometry args={[length * 0.55, 0.06, depth * 0.75]} />
      </mesh>
      {/* Outlet flange bolts */}
      {[-length * 0.2, length * 0.2].map((x) =>
        [-depth * 0.3, depth * 0.3].map((z) => (
          <Bolt key={`out-${x}-${z}`} position={[x, -height / 2 - 0.55, z]} size={0.018} />
        ))
      )}

      {/* Warning Label Plate */}
      <group position={[0, 0, depth / 2 + 0.02]}>
        <mesh material={matSafety}>
          <boxGeometry args={[length * 0.4, 0.25, 0.015]} />
        </mesh>
        <Text position={[0, 0, 0.008]} fontSize={0.06} color="#000000" anchorX="center" anchorY="middle" fontWeight="bold">
          ⚠ MAGNETIC FIELD
        </Text>
        {/* Plate screws */}
        {[[-0.18, 0.1], [0.18, 0.1], [-0.18, -0.1], [0.18, -0.1]].map(([x, y], i) => (
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
   5. INTERACTIVE INSPECTION DOOR
   ========================================================================== */

function InspectionDoor({ length, height, isOpen, onToggle }: { length: number; height: number; isOpen: boolean; onToggle: () => void }) {
  const doorRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const targetRotation = isOpen ? -Math.PI * 0.65 : 0;

  useFrame((_, delta) => {
    if (doorRef.current) {
      doorRef.current.rotation.y = THREE.MathUtils.damp(doorRef.current.rotation.y, targetRotation, 5, delta);
    }
  });

  return (
    <group position={[-length / 2, 0, depth / 2 + 0.02]}>
      {/* Frame */}
      <mesh material={matStructure}>
        <boxGeometry args={[0.05, height, length]} />
      </mesh>
      {/* Gasket */}
      <mesh position={[0.03, 0, 0]} material={matGasket}>
        <boxGeometry args={[0.02, height - 0.08, length - 0.08]} />
      </mesh>
      {/* Hinged Door */}
      <group ref={doorRef} position={[0.04, 0, -length / 2]}>
        <mesh
          position={[0, 0, length / 2]}
          castShadow
          material={hovered ? matSafety : matBody}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
          onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onToggle(); }}
        >
          <boxGeometry args={[0.04, height - 0.04, length - 0.04]} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.04, 0, length * 0.35]} material={matStructure}>
          <boxGeometry args={[0.04, 0.15, 0.04]} />
        </mesh>
        {/* Hinges */}
        {[-height * 0.35, height * 0.35].map((y, i) => (
          <mesh key={i} position={[0.04, y, 0]} rotation={[0, Math.PI / 2, 0]} material={matStructure}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 12]} />
          </mesh>
        ))}
      </group>
      {/* Frame bolts */}
      {[[-height * 0.4, -length * 0.4], [height * 0.4, -length * 0.4], [-height * 0.4, length * 0.4], [height * 0.4, length * 0.4]].map(([y, z], i) => (
        <Bolt key={i} position={[0.04, y, z]} rotation={[0, Math.PI / 2, 0]} size={0.016} />
      ))}
    </group>
  );
}

/* ==========================================================================
   6. MAGNETIC BARS (Enhanced rare-earth tube look with brackets)
   ========================================================================== */

function MagneticBars({ metalDetected }: { metalDetected: boolean }) {
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
      {/* Magnetic Bars (Rare-earth tubes) */}
      {bars.map((bar) => (
        <group key={bar.id} position={[bar.x, 0, bar.z]}>
          {/* Main magnet tube */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={matMagnet}>
            <cylinderGeometry args={[0.035, 0.035, 0.55, 16]} />
          </mesh>
          {/* Mounting brackets */}
          {[-0.25, 0.25].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
              <torusGeometry args={[0.045, 0.01, 8, 16]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Stuck Metal Pieces */}
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
   7. STATUS INDICATOR LIGHT (Industrial beacon)
   ========================================================================== */

function StatusLight({ position, metalDetected }: { position: V3; metalDetected: boolean }) {
  const lightRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (lightRef.current && metalDetected) {
      const mat = lightRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + Math.sin(clock.elapsedTime * 8) * 0.6;
    }
  });

  return (
    <group position={position}>
      {/* Mounting bracket */}
      <mesh material={matStructure}>
        <boxGeometry args={[0.08, 0.15, 0.08]} />
      </mesh>
      {/* Beacon body */}
      <mesh position={[0, 0.1, 0]} material={matStructure}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
      </mesh>
      {/* Beacon lens */}
      <mesh ref={lightRef} position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color={metalDetected ? COLORS.accentRed : COLORS.accentGreen}
          emissive={metalDetected ? COLORS.accentRed : COLORS.accentGreen}
          emissiveIntensity={metalDetected ? 0.6 : 0.4}
          transparent
          opacity={0.8}
        />
      </mesh>
      {metalDetected && (
        <pointLight position={[0, 0.18, 0]} color={COLORS.accentRed} intensity={2} distance={1.5} />
      )}
    </group>
  );
}

/* ==========================================================================
   8. DATA PANEL (PLC Data)
   ========================================================================== */

function DataPanel({ position, metalDetected, collectedMetal }: { position: V3; metalDetected: boolean; collectedMetal: number }) {
  const lines = [
    { text: `MAGNETIC SEPARATOR`, size: 0.16, color: '#1c1c1c', bold: true },
    { text: `Status: RUNNING`, size: 0.13, color: COLORS.accentGreen },
    { text: `Metal Detected: ${metalDetected ? 'YES' : 'NO'}`, size: 0.13, color: metalDetected ? COLORS.accentRed : '#3a3a3a' },
    { text: `Collected Metal: ${collectedMetal.toFixed(1)} kg`, size: 0.13, color: '#3a3a3a' },
    { text: `Cleaning Required: ${metalDetected ? 'YES' : 'NO'}`, size: 0.13, color: metalDetected ? COLORS.accentRed : COLORS.accentGreen },
    { text: `Alarm: ${metalDetected ? 'ACTIVE' : 'OFF'}`, size: 0.13, color: metalDetected ? COLORS.accentRed : '#3a3a3a' },
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
          <meshStandardMaterial color={COLORS.accentCyan} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        {lines.map((line, i) => (
          <Text key={i} position={[-1, -i * 0.24, 0]} fontSize={line.size} color={line.color} anchorX="left" anchorY="top" fontWeight={line.bold ? 'bold' : 'normal'}>
            {line.text}
          </Text>
        ))}
      </group>
    </Float>
  );
}

/* ==========================================================================
   9. MAIN MAGNETIC SEPARATOR COMPONENT
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

// Need to declare depth for internal use
let depth = 0.7;

export function MagneticSeparatorComponent({
  position = [0, 0, 0],
  length = 1.2,
  width = 0.7,
  height = 0.9,
  active: controlledActive = true,
  showDataPanel = true,
  showClickText = true,
}: MagneticSeparatorProps) {
  depth = width; // Map width prop to internal depth variable for consistency
  const [isOpen, setIsOpen] = useState(false);
  const [metalDetected, setMetalDetected] = useState(false);
  const [collectedMetal, setCollectedMetal] = useState(2.4);

  useFrame(() => {
    if (controlledActive && !metalDetected) {
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
      <SupportFrame length={length} depth={depth} />

      {/* 2. Main Housing & Chutes */}
      <HousingAndChutes length={length} height={height} depth={depth} />

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
            setTimeout(handleClean, 500);
          }
        }} 
      />

      {/* 5. Status Indicator Light */}
      <StatusLight position={[length / 2 + 0.1, height / 2, depth / 2]} metalDetected={metalDetected} />

      {/* 6. Falling Grain Animation */}
      {controlledActive && (
        <Sparkles
          count={40}
          scale={[length * 0.4, height + 1, depth * 0.6]}
          size={3}
          speed={1.5}
          position={[0, 0, 0]}
          color="#e8d5b5"
        />
      )}

      {/* 7. Data Panel */}
      {showDataPanel && (
        <DataPanel
          position={[length / 2 + 1.5, height / 2, 0]}
          metalDetected={metalDetected}
          collectedMetal={collectedMetal}
        />
      )}

      {/* 8. Click Instruction */}
      {showClickText && (
        <Text
          position={[0, height / 2 + 0.8, depth / 2 + 0.2]}
          fontSize={0.08}
          color={COLORS.accentCyan}
          anchorX="center"
          anchorY="middle"
        >
          {isOpen ? '● DOOR OPEN (CLEANED)' : '○ CLICK HANDLE TO OPEN'}
        </Text>
      )}

      {/* 9. Invisible Click Target */}
      {controlledActive === undefined && (
        <mesh position={[0, 0, 0]} onClick={() => {}} visible={false}>
          <boxGeometry args={[length * 1.5, height + 1, depth * 1.5]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  );
}

/* ==========================================================================
   10. ENVIRONMENT & EXPORT
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

export function MagneticSeparatorScene() {
  return (
    <Canvas shadows camera={{ position: [4, 3, 4], fov: 45 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <MagneticSeparatorComponent length={1.2} width={0.7} height={0.9} active={true} />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={2} maxDistance={15} maxPolarAngle={Math.PI / 2.05} target={[0, 0.5, 0]} />
    </Canvas>
  );
}

export function MagneticSeparator() {
  return <MagneticSeparatorScene />;
}

export default MagneticSeparator;