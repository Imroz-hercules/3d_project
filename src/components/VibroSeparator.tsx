'use client';

/**
 * VibroSeparator.tsx — HIGH-FIDELITY INDUSTRIAL PRE-CLEANER
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat materials, 
 * realistic hex bolts, flanged inlet/outlet spouts, interactive inspection 
 * doors with gaskets, robust I-beam support legs with gussets, and a 
 * high-fidelity dual-shaft eccentric vibration motor.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
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
   3. STATIC SUPPORT FRAME (I-beam legs, base plates, gussets, bracing)
   ========================================================================== */

function StaticFrame({ width, depth, frameHeight }: { width: number; depth: number; frameHeight: number }) {
  const inset = 0.2;
  const legPositions: V3[] = [
    [width / 2 - inset, frameHeight / 2, depth / 2 - inset],
    [-width / 2 + inset, frameHeight / 2, depth / 2 - inset],
    [width / 2 - inset, frameHeight / 2, -depth / 2 + inset],
    [-width / 2 + inset, frameHeight / 2, -depth / 2 + inset],
  ];

  const Beam = ({ start, end, radius = 0.05 }: { start: V3; end: V3; radius?: number }) => {
    const startV = new THREE.Vector3(...start);
    const endV = new THREE.Vector3(...end);
    const mid = startV.clone().add(endV).multiplyScalar(0.5);
    const dir = endV.clone().sub(startV);
    const length = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return (
      <mesh position={mid.toArray() as V3} quaternion={quat} castShadow material={matStructure}>
        <cylinderGeometry args={[radius, radius, length, 8]} />
      </mesh>
    );
  };

  const topY = frameHeight;
  const corners: V3[] = legPositions.map((p) => [p[0], topY, p[2]]);

  return (
    <group>
      {legPositions.map((pos, i) => {
        const isFront = pos[2] > 0;
        const gussetY = frameHeight - 0.25;
        return (
          <group key={i}>
            {/* I-beam leg simulation */}
            <mesh position={pos} castShadow material={matStructure}>
              <boxGeometry args={[0.12, frameHeight, 0.12]} />
            </mesh>
            <mesh position={pos} material={matStructure}>
              <boxGeometry args={[0.14, frameHeight, 0.04]} />
            </mesh>
            <mesh position={pos} material={matStructure}>
              <boxGeometry args={[0.04, frameHeight, 0.14]} />
            </mesh>

            {/* Base plate */}
            <mesh position={[pos[0], 0.04, pos[2]]} castShadow material={matStructure}>
              <boxGeometry args={[0.35, 0.08, 0.35]} />
            </mesh>

            {/* Anchor bolts */}
            {[-0.12, 0.12].map((dx) =>
              [-0.12, 0.12].map((dz) => (
                <Bolt key={`${dx}-${dz}`} position={[pos[0] + dx, 0.09, pos[2] + dz]} size={0.018} />
              ))
            )}

            {/* Top gusset plate */}
            <mesh position={[pos[0] * 0.85, gussetY, pos[2] * 0.85]} castShadow material={matStructure}>
              <boxGeometry args={[0.2, 0.3, 0.04]} />
            </mesh>
          </group>
        );
      })}

      {/* Top rectangular ring */}
      <Beam start={corners[0]} end={corners[1]} radius={0.06} />
      <Beam start={corners[2]} end={corners[3]} radius={0.06} />
      <Beam start={corners[0]} end={corners[2]} radius={0.06} />
      <Beam start={corners[1]} end={corners[3]} radius={0.06} />

      {/* Diagonal cross bracing */}
      <Beam start={[corners[0][0], frameHeight - 0.2, corners[0][2]]} end={[corners[3][0], frameHeight - 0.2, corners[3][2]]} radius={0.045} />
      <Beam start={[corners[1][0], frameHeight - 0.2, corners[1][2]]} end={[corners[2][0], frameHeight - 0.2, corners[2][2]]} radius={0.045} />
    </group>
  );
}

/* ==========================================================================
   4. RUBBER SPRING MOUNTS (Enhanced with caps and rings)
   ========================================================================== */

function SpringMounts({ width, depth, baseY, springHeight }: { width: number; depth: number; baseY: number; springHeight: number }) {
  const cols = [-width / 2 + 0.4, -width / 6, width / 6, width / 2 - 0.4];
  const rows = [depth / 2 - 0.25, -depth / 2 + 0.25];
  const positions: V3[] = [];
  cols.forEach((x) => rows.forEach((z) => positions.push([x, baseY + springHeight / 2, z])));

  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Rubber spring body */}
          <mesh castShadow material={matRubber}>
            <cylinderGeometry args={[0.13, 0.16, springHeight, 16]} />
          </mesh>
          {/* Steel retaining rings */}
          {[-springHeight / 2 + 0.08, 0, springHeight / 2 - 0.08].map((ry, j) => (
            <mesh key={j} position={[0, ry, 0]} material={matStructure}>
              <torusGeometry args={[0.14, 0.014, 8, 16]} />
            </mesh>
          ))}
          {/* Top + bottom spring caps */}
          <mesh position={[0, springHeight / 2, 0]} material={matStructure}>
            <cylinderGeometry args={[0.16, 0.16, 0.03, 16]} />
          </mesh>
          <mesh position={[0, -springHeight / 2, 0]} material={matStructure}>
            <cylinderGeometry args={[0.16, 0.16, 0.03, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   5. INTERACTIVE INSPECTION DOOR
   ========================================================================== */

function InspectionDoor({ position, rotation, width, height }: { position: V3; rotation: V3; width: number; height: number }) {
  const doorRef = useRef<THREE.Group>(null!);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const targetAngle = open ? -Math.PI * 0.65 : 0;

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
          onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); setOpen((o) => !o); }}
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
   6. VIBRATING SCREENING DECK (Enhanced with seams, ribs, flanges)
   ========================================================================== */

function VibratingBody({
  width, depth, height, baseY, active, hovered, onHover,
}: {
  width: number; depth: number; height: number; baseY: number; active: boolean; hovered: boolean; onHover: (v: boolean) => void;
}) {
  const bodyRef = useRef<THREE.Group>(null!);
  const centerY = baseY + height / 2;

  useFrame(({ clock }) => {
    if (!bodyRef.current) return;
    if (active) {
      const t = clock.elapsedTime * 60;
      bodyRef.current.position.x = Math.sin(t) * 0.008;
      bodyRef.current.position.y = centerY + Math.cos(t * 1.3) * 0.004;
      bodyRef.current.rotation.z = Math.sin(t * 0.7) * 0.003;
      bodyRef.current.rotation.x = Math.cos(t * 0.9) * 0.002;
    } else {
      bodyRef.current.position.x = THREE.MathUtils.damp(bodyRef.current.position.x, 0, 5, 0.016);
      bodyRef.current.position.y = THREE.MathUtils.damp(bodyRef.current.position.y, centerY, 5, 0.016);
      bodyRef.current.rotation.z = THREE.MathUtils.damp(bodyRef.current.rotation.z, 0, 5, 0.016);
      bodyRef.current.rotation.x = THREE.MathUtils.damp(bodyRef.current.rotation.x, 0, 5, 0.016);
    }
  });

  return (
    <group ref={bodyRef} position={[0, centerY, 0]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(false); }}
    >
      {/* Main screening deck */}
      <mesh castShadow receiveShadow material={matBody} scale={hovered ? 1.005 : 1}>
        <boxGeometry args={[width, height, depth]} />
      </mesh>

      {/* Vertical & horizontal panel seams */}
      {[-width * 0.33, 0, width * 0.33].map((x, i) =>
        [depth / 2 + 0.01, -(depth / 2 + 0.01)].map((z, j) => (
          <mesh key={`seam-v-${i}-${j}`} position={[x, 0, z]} material={matBodyDark}>
            <boxGeometry args={[0.015, height - 0.1, 0.02]} />
          </mesh>
        ))
      )}

      {/* Horizontal stiffener ribs with bolts */}
      {[-height * 0.25, height * 0.25].map((y, i) => (
        <group key={`rib-${i}`}>
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

      {/* Interactive Inspection Doors */}
      <InspectionDoor position={[0, 0, depth / 2 + 0.02]} rotation={[0, 0, 0]} width={width * 0.4} height={height * 0.65} />
      <InspectionDoor position={[0, 0, -(depth / 2 + 0.02)]} rotation={[0, Math.PI, 0]} width={width * 0.4} height={height * 0.65} />

      {/* Top feed inlet with flange */}
      <mesh position={[0, height / 2 + 0.18, 0]} castShadow material={matBody}>
        <boxGeometry args={[width * 0.32, 0.36, depth * 0.45]} />
      </mesh>
      <mesh position={[0, height / 2 + 0.38, 0]} material={matStructure}>
        <boxGeometry args={[width * 0.38, 0.05, depth * 0.52]} />
      </mesh>
      {/* Inlet flange bolts */}
      {[-width * 0.15, width * 0.15].map((x) =>
        [-depth * 0.2, depth * 0.2].map((z) => (
          <Bolt key={`in-${x}-${z}`} position={[x, height / 2 + 0.41, z]} size={0.018} />
        ))
      )}

      {/* Clean grain outlet (+Z) with flange */}
      <mesh position={[0, -height * 0.05, depth / 2 + 0.18]} castShadow material={matBody}>
        <boxGeometry args={[width * 0.45, height * 0.5, 0.36]} />
      </mesh>
      <mesh position={[0, -height * 0.05, depth / 2 + 0.38]} material={matStructure}>
        <boxGeometry args={[width * 0.5, height * 0.55, 0.06]} />
      </mesh>
      <BoltCircle radius={width * 0.25} count={6} y={-height * 0.05} z={depth / 2 + 0.41} size={0.018} rotation={[Math.PI / 2, 0, 0]} />

      {/* Coarse waste outlet (-Z) with flange */}
      <mesh position={[0, -height * 0.15, -(depth / 2 + 0.16)]} castShadow material={matBodyDark}>
        <boxGeometry args={[width * 0.32, height * 0.45, 0.32]} />
      </mesh>
      <mesh position={[0, -height * 0.15, -(depth / 2 + 0.34)]} material={matStructure}>
        <boxGeometry args={[width * 0.37, height * 0.5, 0.06]} />
      </mesh>
      <BoltCircle radius={width * 0.18} count={6} y={-height * 0.15} z={-(depth / 2 + 0.37)} size={0.018} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

/* ==========================================================================
   7. DRIVE MOTOR (High-fidelity dual-shaft eccentric motor)
   ========================================================================== */

function DriveMotor({ position, active }: { position: V3; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (fanRef.current && active) {
      fanRef.current.rotation.z += delta * 15;
    }
  });

  return (
    <group position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Motor body */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={hovered ? matMotor : matMotor}>
        <cylinderGeometry args={[0.2, 0.2, 0.5, 24]} />
      </mesh>

      {/* Cooling fins */}
      {Array.from({ length: 10 }, (_, i) => {
        const x = -0.2 + (i / 9) * 0.4;
        return (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={matMotorDark}>
            <cylinderGeometry args={[0.22, 0.22, 0.015, 24]} />
          </mesh>
        );
      })}

      {/* Terminal box */}
      <mesh position={[0, 0.22, 0]} material={matMotorDark}>
        <boxGeometry args={[0.12, 0.08, 0.14]} />
      </mesh>

      {/* Fan cover & blades */}
      <mesh position={[0, 0, 0.3]} rotation={[0, 0, Math.PI / 2]} castShadow material={matMotorDark}>
        <cylinderGeometry args={[0.18, 0.18, 0.06, 24]} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.33]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 8]} />
      </mesh>

      {/* Eccentric weight housings on both shaft ends */}
      {[-0.32, 0.32].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={matStructure}>
          <cylinderGeometry args={[0.14, 0.14, 0.12, 16]} />
        </mesh>
      ))}

      {/* Status indicator */}
      <mesh position={[0, 0.22, 0.08]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshStandardMaterial color={active ? COLORS.accentGreen : COLORS.accentRed} emissive={active ? COLORS.accentGreen : COLORS.accentRed} emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   8. DATA PANEL
   ========================================================================== */

function DataPanel({ position, active, rpm, amplitude, label }: { position: V3; active: boolean; rpm: number; amplitude: number; label: string }) {
  const lines = [
    { text: `VIBRO SEPARATOR`, size: 0.18, color: '#1c1c1c', bold: true },
    { text: `ID: ${label}`, size: 0.14, color: '#3a3a3a' },
    { text: `Status: ${active ? '● RUNNING' : '○ STOPPED'}`, size: 0.14, color: active ? COLORS.accentGreen : COLORS.accentRed },
    { text: `Motor RPM: ${active ? rpm.toFixed(0) : '0'}`, size: 0.14, color: '#3a3a3a' },
    { text: `Amplitude: ${active ? amplitude.toFixed(1) : '0.0'} mm`, size: 0.14, color: '#3a3a3a' },
    { text: `Throughput: ${active ? '12.5' : '0.0'} t/h`, size: 0.14, color: '#3a3a3a' },
  ];

  return (
    <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
      <group position={position}>
        <mesh position={[0, -0.35, -0.02]}>
          <planeGeometry args={[2.2, 1.5]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.92} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.35, -0.015]}>
          <planeGeometry args={[2.24, 1.54]} />
          <meshStandardMaterial color={COLORS.accentYellow} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {lines.map((line, i) => (
          <Text key={i} position={[-1, -i * 0.26, 0]} fontSize={line.size} color={line.color} anchorX="left" anchorY="top" fontWeight={line.bold ? 'bold' : 'normal'}>
            {line.text}
          </Text>
        ))}
      </group>
    </Float>
  );
}

/* ==========================================================================
   9. MAIN VIBRO SEPARATOR COMPONENT
   ========================================================================== */

export interface VibroSeparatorProps {
  position?: V3;
  width?: number;
  depth?: number;
  height?: number;
  frameHeight?: number;
  springHeight?: number;
  rpm?: number;
  amplitude?: number;
  active?: boolean;
  label?: string;
  showDataPanel?: boolean;
  showClickText?: boolean;
}

export function VibroSeparatorComponent({
  position = [0, 0, 0],
  width = 3,
  depth = 1.5,
  height = 0.6,
  frameHeight = 0.9,
  springHeight = 0.45,
  rpm = 960,
  amplitude = 4.5,
  active: controlledActive,
  label = 'VIBRO-01',
  showDataPanel = true,
  showClickText = true,
}: VibroSeparatorProps) {
  const [internalActive, setInternalActive] = useState(false);
  const [bodyHovered, setBodyHovered] = useState(false);
  const active = controlledActive !== undefined ? controlledActive : internalActive;

  const deckBaseY = frameHeight + springHeight;
  const deckTopY = deckBaseY + height;
  const inletTopY = deckTopY + 0.4;

  return (
    <group position={position}>
      <StaticFrame width={width} depth={depth} frameHeight={frameHeight} />
      <SpringMounts width={width} depth={depth} baseY={frameHeight} springHeight={springHeight} />
      <VibratingBody
        width={width} depth={depth} height={height} baseY={deckBaseY}
        active={active} hovered={bodyHovered} onHover={setBodyHovered}
      />
      <DriveMotor position={[width / 2 + 0.35, deckBaseY + height / 2, 0]} active={active} />
      
      {showDataPanel && (
        <DataPanel position={[width / 2 + 1.7, deckTopY + 0.2, 0]} active={active} rpm={rpm} amplitude={amplitude} label={label} />
      )}

      {showClickText && (
        <Text position={[0, inletTopY + 0.5, 0]} fontSize={0.12} color={COLORS.accentYellow} anchorX="center" anchorY="middle">
          {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
        </Text>
      )}

      {controlledActive === undefined && (
        <mesh position={[0, deckTopY / 2, 0]} onClick={() => setInternalActive(!internalActive)} visible={false}>
          <boxGeometry args={[width * 1.5, deckTopY, depth * 1.5]} />
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[80, 80, '#5c5c54', '#79796e']} position={[0, 0.01, 0]} />
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

export function VibroSeparatorScene() {
  const [active, setActive] = useState(false);

  return (
    <Canvas shadows camera={{ position: [6, 3.5, 6], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <VibroSeparatorComponent width={3} depth={1.5} height={0.6} frameHeight={0.9} springHeight={0.45} rpm={960} amplitude={4.5} active={active} label="VIBRO-01" />
      <OrbitControls enableDamping dampingFactor={0.08} minDistance={4} maxDistance={25} maxPolarAngle={Math.PI / 2.05} target={[0, 1.2, 0]} />
    </Canvas>
  );
}

export function VibroSeparator() {
  return <VibroSeparatorScene />;
}

export default VibroSeparator;