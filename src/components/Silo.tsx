'use client';

/**
 * Silo.tsx
 * ------------------------------------------------------------------------
 * A complete, self-contained, realistic industrial grain silo scene built
 * with React Three Fiber + drei. Single file, no external image assets.
 *
 * Install:
 *   npm install three @react-three/fiber @react-three/drei
 *
 * Usage:
 *   import Silo from './Silo';
 *   export default function Page() { return <Silo />; }
 *
 * Includes: fullscreen Canvas, camera, OrbitControls, lights, ground, grid,
 * sky, silo cylinder body, roof, hopper cone, 6 legs, cross bracing,
 * platform, guard rails, ladder, an interactive hatch, an animated grain
 * fill gauge, shadows, PBR materials, hover effects, and idle animations
 * (blinking beacon, spinning roof turbine, breathing fill level).
 * ------------------------------------------------------------------------
 */

import React, { useMemo, useRef, useState, Suspense } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Sky, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  matDeck,
  matPaintedSteel,
  matRailYellow,
  matSteel,
  matSteelDark,
  matStructureSteel,
} from '../materials';

/* ==========================================================================
   1. CONFIG / DIMENSIONS
   ========================================================================== */

const SILO_RADIUS = 1.2;
const CYL_HEIGHT = 3.6;
const ROOF_HEIGHT = 0.9;
const HOPPER_HEIGHT = 1.2;
const HOPPER_BOTTOM_RADIUS = 0.18;
const LEG_HEIGHT = 2.8;
const LEG_COUNT = 4;
const LEG_BASE_RADIUS = SILO_RADIUS * 1.05;
const LEG_TOP_RADIUS = SILO_RADIUS * 0.62;

const HOPPER_BOTTOM_Y = LEG_HEIGHT;
const HOPPER_TOP_Y = HOPPER_BOTTOM_Y + HOPPER_HEIGHT;

/** World-space anchor for downstream connections (slide gate / transition chute). */
export { SILO_RADIUS };
export const SILO_OUTLET_Y = HOPPER_BOTTOM_Y;
export const SILO_OUTLET_RADIUS = HOPPER_BOTTOM_RADIUS;
const CYL_BOTTOM_Y = HOPPER_TOP_Y;
const CYL_TOP_Y = CYL_BOTTOM_Y + CYL_HEIGHT;
const ROOF_APEX_Y = CYL_TOP_Y + ROOF_HEIGHT;
const PLATFORM_Y = CYL_TOP_Y - 0.15;
const PLATFORM_WIDTH = 1.1;
const RAIL_HEIGHT = 1.0;

/* ==========================================================================
   2. MATERIAL PALETTE
   ========================================================================== */

const COLORS = {
  metal: '#c7ced4',
  metalDark: '#8b949c',
  steelDark: '#2a2e32',
  roof: '#b5bdc4',
  accentRed: '#a4222c',
  accentYellow: '#e0a92c',
  grain: '#d4a017',
  glass: '#dfe9ee',
  concrete: '#9a9a92',
} as const;

/* ==========================================================================
   3. HELPERS
   ========================================================================== */

type V3 = [number, number, number];

function polar(radius: number, angle: number, y: number): V3 {
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
}

function lerpV3(a: V3, b: V3, t: number): V3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/** A cylindrical strut/beam drawn between two arbitrary points in space.
 *  Reused for legs, cross-bracing, guard-rail posts, and the ladder. */
function Strut({
  start,
  end,
  radius = 0.05,
  material = matStructureSteel,
}: {
  start: V3;
  end: V3;
  radius?: number;
  material?: THREE.Material;
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
    <mesh position={position} quaternion={quaternion} castShadow receiveShadow dispose={null} material={material}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
    </mesh>
  );
}

/* ==========================================================================
   4. LEG GEOMETRY — computed once, shared by Legs / CrossBraces / Ladder
   ========================================================================== */

const legAngles: number[] = Array.from({ length: LEG_COUNT }, (_, i) => (i / LEG_COUNT) * Math.PI * 2);
const legBase: V3[] = legAngles.map((a) => polar(LEG_BASE_RADIUS, a, 0));
const legTop: V3[] = legAngles.map((a) => polar(LEG_TOP_RADIUS, a, LEG_HEIGHT));

function legPoint(i: number, t: number): V3 {
  return lerpV3(legBase[i], legTop[i], t);
}

/* ==========================================================================
   5. GROUND + GRID
   ========================================================================== */

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <circleGeometry args={[45, 64]} />
        <meshStandardMaterial color={COLORS.concrete} roughness={0.95} metalness={0.05} />
      </mesh>
      <gridHelper args={[90, 90, '#5c5c54', '#79796e']} />
    </group>
  );
}

/* ==========================================================================
   6. LIGHTS
   ========================================================================== */

function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#cfe8ff', '#4a4a3f', 0.4]} />
      <directionalLight
        position={[18, 24, 12]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-far={70}
      />
    </>
  );
}

/* ==========================================================================
   7. SILO BODY — cylinder with horizontal reinforcing ribs + hover glow
   ========================================================================== */

function SiloBody({ hovered, onHover }: { hovered: boolean; onHover: (v: boolean) => void }) {
  const ribCount = 9;
  const ribs = Array.from(
    { length: ribCount },
    (_, i) => CYL_BOTTOM_Y + (i + 1) * (CYL_HEIGHT / (ribCount + 1))
  );

  return (
    <group>
      <mesh
        position={[0, CYL_BOTTOM_Y + CYL_HEIGHT / 2, 0]}
        castShadow
        receiveShadow
        dispose={null}
        material={matSteel}
        scale={hovered ? 1.01 : 1}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover(true);
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover(false);
        }}
      >
        <cylinderGeometry args={[SILO_RADIUS, SILO_RADIUS, CYL_HEIGHT, 48, 1, false]} />
      </mesh>
      {ribs.map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow dispose={null} material={matSteelDark}>
          <torusGeometry args={[SILO_RADIUS + 0.02, 0.045, 8, 48]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   8. ROOF
   ========================================================================== */

function Roof() {
  return (
    <group>
      <mesh position={[0, CYL_TOP_Y + ROOF_HEIGHT / 2, 0]} castShadow dispose={null} material={matSteel}>
        <coneGeometry args={[SILO_RADIUS + 0.15, ROOF_HEIGHT, 48]} />
      </mesh>
      <mesh position={[0, ROOF_APEX_Y, 0]} castShadow dispose={null} material={matSteelDark}>
        <sphereGeometry args={[0.12, 16, 16]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   9. HOPPER — bottom cone (wide at cylinder, narrow at the legs)
   ========================================================================== */

function Hopper() {
  return (
    <mesh position={[0, HOPPER_BOTTOM_Y + HOPPER_HEIGHT / 2, 0]} castShadow receiveShadow dispose={null} material={matSteel}>
      {/* radiusTop faces up toward the cylinder (wide), radiusBottom faces
          down toward the legs (narrow funnel point) */}
      <cylinderGeometry args={[SILO_RADIUS, HOPPER_BOTTOM_RADIUS, HOPPER_HEIGHT, 48]} />
    </mesh>
  );
}

/* ==========================================================================
   10. LEGS — 6 support legs, flared outward at the base for stability
   ========================================================================== */

function Legs() {
  return (
    <>
      {legAngles.map((_, i) => (
        <Strut key={i} start={legBase[i]} end={legTop[i]} radius={0.15} material={matPaintedSteel} />
      ))}
    </>
  );
}

/* ==========================================================================
   11. CROSS BRACES — X-bracing between adjacent legs + a stiffening ring
   ========================================================================== */

function CrossBraces() {
  const bands: [number, number][] = [
    [0.25, 0.6],
    [0.6, 0.95],
  ];

  const struts: { start: V3; end: V3 }[] = [];
  legAngles.forEach((_, i) => {
    const next = (i + 1) % LEG_COUNT;
    bands.forEach(([t1, t2]) => {
      struts.push({ start: legPoint(i, t1), end: legPoint(next, t2) });
      struts.push({ start: legPoint(next, t1), end: legPoint(i, t2) });
    });
    struts.push({ start: legPoint(i, 0.6), end: legPoint(next, 0.6) });
  });

  return (
    <>
      {struts.map((s, i) => (
        <Strut key={i} start={s.start} end={s.end} radius={0.045} material={matStructureSteel} />
      ))}
    </>
  );
}

/* ==========================================================================
   12. PLATFORM + GUARD RAIL
   ========================================================================== */

function Platform() {
  return (
    <mesh position={[0, PLATFORM_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow dispose={null} material={matDeck}>
      <ringGeometry args={[SILO_RADIUS + 0.03, SILO_RADIUS + PLATFORM_WIDTH, 48]} />
    </mesh>
  );
}

function GuardRail() {
  const postCount = 16;
  const railRadius = SILO_RADIUS + PLATFORM_WIDTH - 0.05;
  const angles = Array.from({ length: postCount }, (_, i) => (i / postCount) * Math.PI * 2);

  return (
    <group>
      {angles.map((a, i) => {
        const base = polar(railRadius, a, PLATFORM_Y);
        const top: V3 = [base[0], PLATFORM_Y + RAIL_HEIGHT, base[2]];
        return <Strut key={i} start={base} end={top} radius={0.03} material={matRailYellow} />;
      })}
      {[0.5, 1.0].map((h, i) => (
        <mesh key={i} position={[0, PLATFORM_Y + RAIL_HEIGHT * h, 0]} rotation={[Math.PI / 2, 0, 0]} dispose={null} material={matRailYellow}>
          <torusGeometry args={[railRadius, 0.025, 8, 48]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   13. LADDER — caged rails + rungs from the cylinder base up to the platform
   ========================================================================== */

function Ladder() {
  const x = SILO_RADIUS + 0.18;
  const railGap = 0.22;
  const bottomY = CYL_BOTTOM_Y + 0.1;
  const topY = PLATFORM_Y;
  const rungSpacing = 0.4;
  const rungCount = Math.floor((topY - bottomY) / rungSpacing);
  const rungs = Array.from({ length: rungCount }, (_, i) => bottomY + i * rungSpacing);

  return (
    <group>
      <Strut start={[x, bottomY, -railGap]} end={[x, topY, -railGap]} radius={0.03} material={matStructureSteel} />
      <Strut start={[x, bottomY, railGap]} end={[x, topY, railGap]} radius={0.03} material={matStructureSteel} />
      {rungs.map((y, i) => (
        <Strut key={i} start={[x, y, -railGap]} end={[x, y, railGap]} radius={0.025} material={matStructureSteel} />
      ))}
      {/* grounding brace tying the ladder base back to the nearest leg */}
      <Strut start={legTop[0]} end={[x, bottomY, -railGap]} radius={0.04} material={matStructureSteel} />
    </group>
  );
}

/* ==========================================================================
   14. HATCH — interactive roof access hatch, click to open/close on a hinge
   ========================================================================== */

function Hatch() {
  const hingeRef = useRef<THREE.Group>(null!);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const targetAngle = open ? -Math.PI * 0.55 : 0;

  useFrame((_, delta) => {
    if (!hingeRef.current) return;
    hingeRef.current.rotation.z = THREE.MathUtils.damp(hingeRef.current.rotation.z, targetAngle, 6, delta);
  });

  const hatchRadius = 0.5;
  const hingeX = 0.9;
  const y = CYL_TOP_Y + 0.02;

  return (
    <group position={[hingeX, y, 0]} ref={hingeRef}>
      <mesh
        position={[hatchRadius, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered(false);
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <cylinderGeometry args={[hatchRadius, hatchRadius, 0.06, 32]} />
        <meshStandardMaterial
          color={hovered ? COLORS.accentYellow : '#8a9199'}
          metalness={0.7}
          roughness={0.35}
          emissive={hovered ? COLORS.accentYellow : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   15. FILL GAUGE — sight-glass tube showing the animated grain level
   ========================================================================== */

function FillGauge({ fillLevel }: { fillLevel: number }) {
  const tubeHeight = CYL_HEIGHT - 0.6;
  const tubeRadius = 0.16;
  const x = SILO_RADIUS + 0.35;
  const baseY = CYL_BOTTOM_Y + 0.3;
  const grainHeight = Math.max(0.05, tubeHeight * fillLevel);

  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, baseY + tubeHeight / 2, 0]}>
        <cylinderGeometry args={[tubeRadius, tubeRadius, tubeHeight, 20, 1, true]} />
        <meshStandardMaterial
          color={COLORS.glass}
          transparent
          opacity={0.35}
          roughness={0.15}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, baseY + grainHeight / 2, 0]}>
        <cylinderGeometry args={[tubeRadius * 0.9, tubeRadius * 0.9, grainHeight, 20]} />
        <meshStandardMaterial color={COLORS.grain} roughness={0.9} metalness={0} />
      </mesh>
      <Text position={[0, baseY + tubeHeight + 0.35, 0]} fontSize={0.28} color="#222222" anchorX="center" anchorY="bottom">
        {`${Math.round(fillLevel * 100)}%`}
      </Text>
    </group>
  );
}

/* ==========================================================================
   16. WARNING LIGHT — blinking rooftop beacon
   ========================================================================== */

function WarningLight() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.6 + Math.sin(clock.elapsedTime * 4) * 0.6;
  });

  return (
    <mesh ref={ref} position={[0, ROOF_APEX_Y + 0.35, 0]} castShadow>
      <sphereGeometry args={[0.14, 16, 16]} />
      <meshStandardMaterial color={COLORS.accentRed} emissive={COLORS.accentRed} emissiveIntensity={0.6} />
    </mesh>
  );
}

/* ==========================================================================
   17. ROOF VENT TURBINE — continuously spinning ventilator
   ========================================================================== */

function RoofTurbine() {
  const ref = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 2.2;
  });

  const finCount = 8;
  const fins = Array.from({ length: finCount }, (_, i) => (i / finCount) * Math.PI * 2);

  return (
    <group position={[-1.1, CYL_TOP_Y + 0.55, 0.4]}>
      <mesh castShadow dispose={null} material={matSteelDark}>
        <cylinderGeometry args={[0.12, 0.14, 0.35, 12]} />
      </mesh>
      <group ref={ref} position={[0, 0.2, 0]}>
        {fins.map((a, i) => (
          <mesh key={i} position={[Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1]} rotation={[0, -a, Math.PI / 8]} castShadow dispose={null} material={matSteel}>
            <boxGeometry args={[0.22, 0.01, 0.09]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ==========================================================================
   18. LABEL
   ========================================================================== */

function SiloLabel() {
  return (
    <group position={[0, CYL_BOTTOM_Y + CYL_HEIGHT * 0.55, SILO_RADIUS + 0.02]}>
      <Text fontSize={0.42} color="#2b2b2b" anchorX="center" anchorY="middle" maxWidth={4}>
        GRAIN SILO — UNIT A1
      </Text>
    </group>
  );
}

/* ==========================================================================
   19. SCENE COMPOSITION
   ========================================================================== */

function SiloModel() {
  const [bodyHovered, setBodyHovered] = useState(false);
  const [fillLevel, setFillLevel] = useState(0.6);

  useFrame(({ clock }) => {
    setFillLevel(0.6 + Math.sin(clock.elapsedTime * 0.15) * 0.3);
  });

  return (
    <>
      <Hopper />
      <SiloBody hovered={bodyHovered} onHover={setBodyHovered} />
      <Roof />
      <Legs />
      <CrossBraces />
      <Platform />
      <GuardRail />
      <Ladder />
      <Hatch />
      <FillGauge fillLevel={fillLevel} />
      <WarningLight />
      <RoofTurbine />
      <SiloLabel />
    </>
  );
}

/* ==========================================================================
   20. EXPORT — SiloModel as default (no Canvas wrapper; App.tsx provides it)
   ========================================================================== */

export default SiloModel;