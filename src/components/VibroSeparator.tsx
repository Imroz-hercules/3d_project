'use client';

/**
 * VibroSeparator.tsx - INDUSTRIAL PRE-CLEANER (wide & low deck)
 * ------------------------------------------------------------------------
 * A realistic industrial Vibro Separator for a flour mill digital twin.
 * This is the first cleaning machine after the bucket elevator.
 *
 * Layout (built upward from ground; group origin at y = 0):
 *
 *   y = 0           base plates (frame feet)
 *   y = 0 → Hf      steel frame: 4 legs + top ring + diagonal bracing
 *   y = Hf → Hf+Hs  8 rubber spring mounts (4 per long side)
 *   y = Hf+Hs → +Hb shallow, wide vibrating screening deck
 *   y = top         feed inlet (top centre)
 *
 * Outlets:
 *   - Clean grain outlet: +Z short end (front, main product)
 *   - Coarse waste outlet: -Z short end (back)
 *
 * Dimensions default to a wide & low deck (L 3.0 × W 1.5 × deck 0.55 m),
 * matching real vibro separator proportions.
 * ------------------------------------------------------------------------
 */

import React, { useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Sky, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

const COLORS = {
  frameSteel: '#4a555c',
  frameSteelDark: '#3a454c',
  bodySteel: '#6b7278',
  bodySteelLight: '#8a9199',
  bodySteelDark: '#4a5058',
  motorBlue: '#1e3a5f',
  motorDark: '#152a45',
  rubberBlack: '#2a2a2a',
  accentYellow: '#e0a92c',
  accentGreen: '#3fae56',
  accentRed: '#a4222c',
  accentCyan: '#00d4ff',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   STATIC SUPPORT FRAME  (base plates → legs → top ring → bracing)
   Builds upward from y = 0.  Group origin passed in is the ground.
   ========================================================================== */

function StaticFrame({
  width,
  depth,
  frameHeight,
}: {
  width: number;
  depth: number;
  frameHeight: number;
}) {
  // Leg inset from the body footprint edges
  const inset = 0.18;
  const legHalf = 0.1; // leg cross-section half (0.2 × 0.2)
  const legPositions: V3[] = [
    [width / 2 - inset, frameHeight / 2, depth / 2 - inset],
    [-width / 2 + inset, frameHeight / 2, depth / 2 - inset],
    [width / 2 - inset, frameHeight / 2, -depth / 2 + inset],
    [-width / 2 + inset, frameHeight / 2, -depth / 2 + inset],
  ];

  // Helper: a steel beam between two points
  const Beam = ({ start, end, radius = 0.05 }: { start: V3; end: V3; radius?: number }) => {
    const startV = new THREE.Vector3(...start);
    const endV = new THREE.Vector3(...end);
    const mid = startV.clone().add(endV).multiplyScalar(0.5);
    const dir = endV.clone().sub(startV);
    const length = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    return (
      <mesh position={mid.toArray() as V3} quaternion={quat} castShadow>
        <cylinderGeometry args={[radius, radius, length, 8]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.35} />
      </mesh>
    );
  };

  // Top ring corner points (at frame top)
  const topY = frameHeight;
  const corners: V3[] = legPositions.map((p) => [p[0], topY, p[2]]);

  return (
    <group>
      {/* Legs */}
      {legPositions.map((pos, i) => (
        <mesh key={`leg-${i}`} position={pos} castShadow receiveShadow>
          <boxGeometry args={[legHalf * 2, frameHeight, legHalf * 2]} />
          <meshStandardMaterial color={COLORS.frameSteelDark} metalness={0.75} roughness={0.35} />
        </mesh>
      ))}

      {/* Base plates (on the ground) */}
      {legPositions.map((pos, i) => (
        <mesh key={`base-${i}`} position={[pos[0], 0.05, pos[2]]} castShadow>
          <boxGeometry args={[0.4, 0.1, 0.4]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Top rectangular ring (long + short beams connecting the 4 legs at top) */}
      <Beam start={corners[0]} end={corners[1]} radius={0.06} />
      <Beam start={corners[2]} end={corners[3]} radius={0.06} />
      <Beam start={corners[0]} end={corners[2]} radius={0.06} />
      <Beam start={corners[1]} end={corners[3]} radius={0.06} />

      {/* Diagonal cross bracing under the deck (X pattern on the long axis) */}
      <Beam
        start={[corners[0][0], frameHeight - 0.2, corners[0][2]]}
        end={[corners[3][0], frameHeight - 0.2, corners[3][2]]}
        radius={0.045}
      />
      <Beam
        start={[corners[1][0], frameHeight - 0.2, corners[1][2]]}
        end={[corners[2][0], frameHeight - 0.2, corners[2][2]]}
        radius={0.045}
      />
    </group>
  );
}

/* ==========================================================================
   RUBBER SPRING MOUNTS
   Sits between the frame top ring (y = frameHeight) and the deck bottom
   (y = frameHeight + springHeight). 8 mounts: 4 per long side.
   ========================================================================== */

function SpringMounts({
  width,
  depth,
  baseY,
  springHeight,
}: {
  width: number;
  depth: number;
  baseY: number;
  springHeight: number;
}) {
  // 2 rows (±Z), 4 columns along the length (X)
  const cols = [-width / 2 + 0.4, -width / 6, width / 6, width / 2 - 0.4];
  const rows = [depth / 2 - 0.25, -depth / 2 + 0.25];
  const positions: V3[] = [];
  cols.forEach((x) => rows.forEach((z) => positions.push([x, baseY + springHeight / 2, z])));

  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Rubber spring body */}
          <mesh castShadow>
            <cylinderGeometry args={[0.13, 0.16, springHeight, 16]} />
            <meshStandardMaterial color={COLORS.rubberBlack} metalness={0.1} roughness={0.9} />
          </mesh>
          {/* Steel retaining rings */}
          {[-springHeight / 2 + 0.08, 0, springHeight / 2 - 0.08].map((ry, j) => (
            <mesh key={j} position={[0, ry, 0]}>
              <torusGeometry args={[0.14, 0.014, 8, 16]} />
              <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
          {/* Top + bottom spring caps */}
          <mesh position={[0, springHeight / 2, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.03, 16]} />
            <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, -springHeight / 2, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.03, 16]} />
            <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   VIBRATING SCREENING DECK (wide & shallow)
   ========================================================================== */

function VibratingBody({
  width,
  depth,
  height,
  baseY,
  active,
  hovered,
  onHover,
}: {
  width: number;
  depth: number;
  height: number;
  baseY: number;
  active: boolean;
  hovered: boolean;
  onHover: (v: boolean) => void;
}) {
  const bodyRef = useRef<THREE.Group>(null!);
  const centerY = baseY + height / 2;

  useFrame(({ clock }) => {
    if (!bodyRef.current) return;
    if (active) {
      // High-frequency, low-amplitude vibration
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
    <group
      ref={bodyRef}
      position={[0, centerY, 0]}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); onHover(false); }}
    >
      {/* Main screening deck (wide & shallow) */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={hovered ? COLORS.bodySteelLight : COLORS.bodySteel}
          metalness={0.65}
          roughness={0.4}
          emissive={hovered ? COLORS.accentCyan : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
      </mesh>

      {/* Deck separation seams on both long faces */}
      {[-width * 0.28, width * 0.28].map((x, i) =>
        [depth / 2 + 0.012, -(depth / 2 + 0.012)].map((z, j) => (
          <mesh key={`seam-${i}-${j}`} position={[x, 0, z]}>
            <boxGeometry args={[0.03, height * 0.9, 0.02]} />
            <meshStandardMaterial color={COLORS.bodySteelDark} metalness={0.7} roughness={0.35} />
          </mesh>
        ))
      )}

      {/* Inspection doors on both long sides */}
      {[
        { x: width * 0.0, z: depth / 2 + 0.02 },
        { x: width * 0.0, z: -(depth / 2 + 0.02) },
      ].map((p, i) => (
        <group key={`door-${i}`} position={[p.x, 0, p.z]}>
          <mesh>
            <boxGeometry args={[width * 0.35, height * 0.6, 0.03]} />
            <meshStandardMaterial color={COLORS.bodySteelDark} metalness={0.7} roughness={0.35} />
          </mesh>
          {/* Door handle */}
          <mesh position={[width * 0.12, 0, 0.02]}>
            <boxGeometry args={[0.04, 0.14, 0.04]} />
            <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* Top feed inlet (centre top) */}
      <mesh position={[0, height / 2 + 0.18, 0]} castShadow>
        <boxGeometry args={[width * 0.32, 0.36, depth * 0.45]} />
        <meshStandardMaterial color={COLORS.bodySteel} metalness={0.65} roughness={0.4} />
      </mesh>
      {/* Inlet flange */}
      <mesh position={[0, height / 2 + 0.38, 0]}>
        <boxGeometry args={[width * 0.38, 0.05, depth * 0.52]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Clean grain outlet — front short end (+Z) */}
      <mesh position={[0, -height * 0.05, depth / 2 + 0.18]} castShadow>
        <boxGeometry args={[width * 0.45, height * 0.5, 0.36]} />
        <meshStandardMaterial color={COLORS.bodySteel} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[0, -height * 0.05, depth / 2 + 0.38]}>
        <boxGeometry args={[width * 0.5, height * 0.55, 0.06]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>

      {/* Coarse waste outlet — back short end (-Z) */}
      <mesh position={[0, -height * 0.15, -(depth / 2 + 0.16)]} castShadow>
        <boxGeometry args={[width * 0.32, height * 0.45, 0.32]} />
        <meshStandardMaterial color={COLORS.bodySteelDark} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={[0, -height * 0.15, -(depth / 2 + 0.34)]}>
        <boxGeometry args={[width * 0.37, height * 0.5, 0.06]} />
        <meshStandardMaterial color={COLORS.frameSteel} metalness={0.75} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   DRIVE MOTOR (Eccentric Vibration Motor) — mounted on +X long side
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
    <group
      position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
    >
      {/* Motor body (horizontal axis along X) */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.45, 24]} />
        <meshStandardMaterial
          color={hovered ? '#2a4a6f' : COLORS.motorBlue}
          metalness={0.6}
          roughness={0.4}
          emissive={hovered ? COLORS.accentCyan : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
      </mesh>

      {/* Cooling fins */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = -0.18 + (i / 8) * 0.36;
        return (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.015, 24]} />
            <meshStandardMaterial color={COLORS.motorDark} metalness={0.65} roughness={0.35} />
          </mesh>
        );
      })}

      {/* Eccentric weight housings on both shaft ends */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.14, 16]} />
          <meshStandardMaterial color={COLORS.frameSteel} metalness={0.8} roughness={0.25} />
        </mesh>
      ))}

      {/* Status indicator */}
      <mesh position={[0, 0.24, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
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
   DATA PANEL
   ========================================================================== */

function DataPanel({
  position,
  active,
  rpm,
  amplitude,
  label,
}: {
  position: V3;
  active: boolean;
  rpm: number;
  amplitude: number;
  label: string;
}) {
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
          <Text
            key={i}
            position={[-1, -i * 0.26, 0]}
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
   MAIN VIBRO SEPARATOR COMPONENT
   ========================================================================== */

export interface VibroSeparatorProps {
  position?: V3;
  width?: number;
  depth?: number;
  /** Deck (screening body) height — kept shallow for a wide/low machine. */
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
  height = 0.55,
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

  // Vertical stack (all measured from the ground, group origin y = 0)
  const deckBaseY = frameHeight + springHeight; // deck bottom
  const deckTopY = deckBaseY + height;          // deck top
  const inletTopY = deckTopY + 0.4;             // feed inlet flange top

  return (
    <group position={position}>
      {/* 1. Static base frame (base plates → legs → top ring) */}
      <StaticFrame width={width} depth={depth} frameHeight={frameHeight} />

      {/* 2. Rubber spring mounts (frame top → deck bottom) */}
      <SpringMounts width={width} depth={depth} baseY={frameHeight} springHeight={springHeight} />

      {/* 3. Vibrating screening deck */}
      <VibratingBody
        width={width}
        depth={depth}
        height={height}
        baseY={deckBaseY}
        active={active}
        hovered={bodyHovered}
        onHover={setBodyHovered}
      />

      {/* 4. Eccentric vibration motor (on the +X long side, mid-deck) */}
      <DriveMotor position={[width / 2 + 0.3, deckBaseY + height / 2, 0]} active={active} />

      {/* 5. Data panel */}
      {showDataPanel && (
        <DataPanel
          position={[width / 2 + 1.7, deckTopY + 0.2, 0]}
          active={active}
          rpm={rpm}
          amplitude={amplitude}
          label={label}
        />
      )}

      {/* 6. Click instruction */}
      {showClickText && (
        <Text
          position={[0, inletTopY + 0.5, 0]}
          fontSize={0.12}
          color={COLORS.accentYellow}
          anchorX="center"
          anchorY="middle"
        >
          {active ? '● CLICK TO STOP' : '○ CLICK TO START'}
        </Text>
      )}

      {/* 7. Invisible click target for the whole machine */}
      <mesh
        position={[0, deckTopY / 2, 0]}
        onClick={() => setInternalActive(!internalActive)}
        visible={false}
      >
        <boxGeometry args={[width * 1.5, deckTopY, depth * 1.5]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   ENVIRONMENT (standalone scene)
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

export function VibroSeparatorScene() {
  const [active, setActive] = useState(false);

  return (
    <Canvas shadows camera={{ position: [6, 3.5, 6], fov: 40 }}>
      <Ground />
      <Sky sunPosition={[100, 30, 100]} turbidity={6} rayleigh={1} mieCoefficient={0.005} />
      <Lights />
      <VibroSeparatorComponent
        width={3}
        depth={1.5}
        height={0.55}
        frameHeight={0.9}
        springHeight={0.45}
        rpm={960}
        amplitude={4.5}
        active={active}
        label="VIBRO-01"
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 1.2, 0]}
      />
    </Canvas>
  );
}

export function VibroSeparator() {
  return <VibroSeparatorScene />;
}

export default VibroSeparator;
