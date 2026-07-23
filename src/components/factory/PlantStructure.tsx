'use client';

/**
 * Shared low-poly plant structure primitives for the flour mill digital twin.
 * Platforms, railings, ladders, walkways, and mezzanine bays — assembled in
 * MaterialHandlingLine rather than duplicated inside each machine.
 */

import type { ReactNode } from 'react';
import * as THREE from 'three';
import { Instances, Instance } from '@react-three/drei';
import {
  matDeck,
  matRailYellow,
  matStructureSteel,
} from '../../perf/sharedMaterials';

type V3 = [number, number, number];

const COLORS = {
  steel: '#3a454c',
  steelLight: '#4a555c',
  deck: '#5a6268',
  rail: '#e0a92c',
  kick: '#4a5058',
} as const;

const matSteelLight = new THREE.MeshStandardMaterial({
  color: COLORS.steelLight,
  metalness: 0.8,
  roughness: 0.3,
});
const matKick = new THREE.MeshStandardMaterial({
  color: COLORS.kick,
  metalness: 0.7,
  roughness: 0.4,
});

/* ==========================================================================
   STEEL PLATFORM
   ========================================================================== */

export function SteelPlatform({
  width,
  depth,
  thickness = 0.1,
  position = [0, 0, 0],
  showBeams = true,
}: {
  width: number;
  depth: number;
  thickness?: number;
  position?: V3;
  showBeams?: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, thickness / 2, 0]} receiveShadow castShadow={false} material={matDeck}>
        <boxGeometry args={[width, thickness, depth]} />
      </mesh>
      {showBeams && (
        <>
          <mesh position={[0, -0.06, depth / 2 - 0.06]} castShadow={false} material={matStructureSteel}>
            <boxGeometry args={[width, 0.12, 0.12]} />
          </mesh>
          <mesh position={[0, -0.06, -(depth / 2 - 0.06)]} castShadow={false} material={matStructureSteel}>
            <boxGeometry args={[width, 0.12, 0.12]} />
          </mesh>
          <mesh position={[width / 2 - 0.06, -0.06, 0]} castShadow={false} material={matStructureSteel}>
            <boxGeometry args={[0.12, 0.12, depth]} />
          </mesh>
          <mesh position={[-(width / 2 - 0.06), -0.06, 0]} castShadow={false} material={matStructureSteel}>
            <boxGeometry args={[0.12, 0.12, depth]} />
          </mesh>
        </>
      )}
    </group>
  );
}

/* ==========================================================================
   SAFETY RAILING
   ========================================================================== */

export function SafetyRailing({
  length,
  height = 1.1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  postSpacing = 1.2,
}: {
  length: number;
  height?: number;
  position?: V3;
  rotation?: V3;
  postSpacing?: number;
}) {
  const postCount = Math.max(2, Math.ceil(length / postSpacing) + 1);
  const posts = Array.from({ length: postCount }, (_, i) => {
    const t = postCount === 1 ? 0.5 : i / (postCount - 1);
    return -length / 2 + t * length;
  });

  return (
    <group position={position} rotation={rotation}>
      <Instances limit={postCount} range={postCount} castShadow={false}>
        <boxGeometry args={[0.05, height, 0.05]} />
        <primitive object={matSteelLight} attach="material" />
        {posts.map((x, i) => (
          <Instance key={i} position={[x, height / 2, 0]} />
        ))}
      </Instances>
      {/* Top rail */}
      <mesh position={[0, height, 0]} castShadow={false} material={matRailYellow}>
        <boxGeometry args={[length, 0.04, 0.04]} />
      </mesh>
      {/* Mid rail */}
      <mesh position={[0, height * 0.55, 0]} castShadow={false} material={matRailYellow}>
        <boxGeometry args={[length, 0.03, 0.03]} />
      </mesh>
      {/* Kick plate */}
      <mesh position={[0, 0.08, 0]} castShadow={false} material={matKick}>
        <boxGeometry args={[length, 0.12, 0.03]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   ACCESS LADDER
   ========================================================================== */

export function AccessLadder({
  height,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 0.55,
  caged = false,
}: {
  height: number;
  position?: V3;
  rotation?: V3;
  width?: number;
  caged?: boolean;
}) {
  const rungCount = Math.max(3, Math.floor(height / 0.32));
  const half = width / 2;

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[-half, height / 2, 0]} castShadow={false} material={matStructureSteel}>
        <boxGeometry args={[0.05, height, 0.05]} />
      </mesh>
      <mesh position={[half, height / 2, 0]} castShadow={false} material={matStructureSteel}>
        <boxGeometry args={[0.05, height, 0.05]} />
      </mesh>
      <Instances limit={rungCount} range={rungCount} castShadow={false}>
        <boxGeometry args={[width - 0.05, 0.035, 0.04]} />
        <primitive object={matSteelLight} attach="material" />
        {Array.from({ length: rungCount }, (_, i) => {
          const y = 0.15 + (i / (rungCount - 1)) * (height - 0.3);
          return <Instance key={i} position={[0, y, 0.02]} />;
        })}
      </Instances>
      {caged && height > 2.5 && (
        <>
          {[0.25, 0.5, 0.75].map((t, i) => (
            <mesh
              key={i}
              position={[0, height * t, 0.28]}
              rotation={[Math.PI / 2, 0, 0]}
              material={matSteelLight}
            >
              <torusGeometry args={[0.38, 0.025, 6, 12]} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

/* ==========================================================================
   SUPPORT COLUMNS (internal to mezzanine)
   ========================================================================== */

function SupportColumns({
  width,
  depth,
  height,
  inset = 0.25,
}: {
  width: number;
  depth: number;
  height: number;
  inset?: number;
}) {
  if (height <= 0.05) return null;
  const corners: V3[] = [
    [width / 2 - inset, height / 2, depth / 2 - inset],
    [-(width / 2 - inset), height / 2, depth / 2 - inset],
    [width / 2 - inset, height / 2, -(depth / 2 - inset)],
    [-(width / 2 - inset), height / 2, -(depth / 2 - inset)],
  ];
  return (
    <>
      {corners.map((pos, i) => (
        <mesh key={i} position={pos} castShadow={false} receiveShadow={false} material={matStructureSteel}>
          <boxGeometry args={[0.18, height, 0.18]} />
        </mesh>
      ))}
    </>
  );
}

/* ==========================================================================
   STEEL FRAME PRIMITIVES
   ========================================================================== */

export function BasePlate({
  size = 0.4,
  thickness = 0.04,
  position = [0, 0, 0] as V3,
}: {
  size?: number;
  thickness?: number;
  position?: V3;
}) {
  return (
    <mesh
      position={[position[0], position[1] + thickness / 2, position[2]]}
      receiveShadow
      castShadow={false}
      material={matSteelLight}
    >
      <boxGeometry args={[size, thickness, size]} />
    </mesh>
  );
}

export function SteelColumn({
  height,
  size = 0.2,
  position = [0, 0, 0] as V3,
  basePlate = true,
}: {
  height: number;
  size?: number;
  position?: V3;
  basePlate?: boolean;
}) {
  return (
    <group position={position}>
      {basePlate && <BasePlate size={size * 2.2} />}
      <mesh position={[0, height / 2, 0]} castShadow={false} receiveShadow={false} material={matStructureSteel}>
        <boxGeometry args={[size, height, size]} />
      </mesh>
    </group>
  );
}

/** Beam along local +X by default; rotate group for other axes. */
export function SteelBeam({
  length,
  size = 0.18,
  position = [0, 0, 0] as V3,
  rotation = [0, 0, 0] as V3,
}: {
  length: number;
  size?: number;
  position?: V3;
  rotation?: V3;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow={false} receiveShadow={false} material={matSteelLight}>
        <boxGeometry args={[length, size, size * 0.7]} />
      </mesh>
    </group>
  );
}

/** X-brace in the XZ plane of a rectangular bay face (width × height). */
export function BraceX({
  width,
  height,
  position = [0, 0, 0] as V3,
  rotation = [0, 0, 0] as V3,
  thickness = 0.06,
}: {
  width: number;
  height: number;
  position?: V3;
  rotation?: V3;
  thickness?: number;
}) {
  const len = Math.hypot(width, height);
  const angle = Math.atan2(height, width);
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, angle]} castShadow={false} material={matStructureSteel}>
        <boxGeometry args={[len, thickness, thickness]} />
      </mesh>
      <mesh rotation={[0, 0, -angle]} castShadow={false} material={matStructureSteel}>
        <boxGeometry args={[len, thickness, thickness]} />
      </mesh>
    </group>
  );
}

/**
 * Rectangular steel bay: 4 columns + perimeter beams + optional X braces on two faces.
 * Places structure under elevated decks so machines do not appear to float.
 */
export function SteelFrameBay({
  width,
  depth,
  height,
  position = [0, 0, 0] as V3,
  brace = true,
}: {
  width: number;
  depth: number;
  height: number;
  position?: V3;
  brace?: boolean;
}) {
  const hx = width / 2 - 0.12;
  const hz = depth / 2 - 0.12;
  const corners: V3[] = [
    [hx, 0, hz],
    [-hx, 0, hz],
    [hx, 0, -hz],
    [-hx, 0, -hz],
  ];
  return (
    <group position={position}>
      {corners.map((c, i) => (
        <SteelColumn key={i} height={height} position={c} />
      ))}
      {/* Primary beams at top */}
      <SteelBeam length={width - 0.2} position={[0, height, hz]} />
      <SteelBeam length={width - 0.2} position={[0, height, -hz]} />
      <SteelBeam
        length={depth - 0.2}
        position={[hx, height, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <SteelBeam
        length={depth - 0.2}
        position={[-hx, height, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      {brace && height > 2 && (
        <>
          <BraceX width={width - 0.4} height={height - 0.3} position={[0, height / 2, hz]} />
          <BraceX width={width - 0.4} height={height - 0.3} position={[0, height / 2, -hz]} />
        </>
      )}
    </group>
  );
}

/* ==========================================================================
   WALKWAY — platform + side railings
   ========================================================================== */

export function Walkway({
  length,
  width = 1.2,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  railBothSides = true,
}: {
  length: number;
  width?: number;
  position?: V3;
  rotation?: V3;
  railBothSides?: boolean;
}) {
  return (
    <group position={position} rotation={rotation}>
      <SteelPlatform width={length} depth={width} />
      <SafetyRailing length={length} position={[0, 0.1, width / 2 - 0.04]} />
      {railBothSides && (
        <SafetyRailing length={length} position={[0, 0.1, -(width / 2 - 0.04)]} />
      )}
    </group>
  );
}

/* ==========================================================================
   MEZZANINE BAY — deck + columns + perimeter rails + ladder
   ========================================================================== */

export function MezzanineBay({
  width,
  depth,
  deckY,
  position = [0, 0, 0],
  ladder = true,
  ladderSide = 'negX' as 'negX' | 'posX' | 'negZ' | 'posZ',
  openSides = [] as Array<'negX' | 'posX' | 'negZ' | 'posZ'>,
  showColumns = true,
  children,
}: {
  width: number;
  depth: number;
  deckY: number;
  position?: V3;
  ladder?: boolean;
  ladderSide?: 'negX' | 'posX' | 'negZ' | 'posZ';
  openSides?: Array<'negX' | 'posX' | 'negZ' | 'posZ'>;
  /** Set false when a SteelFrameBay already provides columns under this deck. */
  showColumns?: boolean;
  children?: ReactNode;
}) {
  const open = new Set(openSides);
  const railY = deckY + 0.1;

  return (
    <group position={position}>
      {showColumns && <SupportColumns width={width} depth={depth} height={deckY} />}
      <SteelPlatform width={width} depth={depth} position={[0, deckY, 0]} />

      {!open.has('posZ') && (
        <SafetyRailing length={width} position={[0, railY, depth / 2 - 0.04]} />
      )}
      {!open.has('negZ') && (
        <SafetyRailing length={width} position={[0, railY, -(depth / 2 - 0.04)]} />
      )}
      {!open.has('posX') && (
        <SafetyRailing
          length={depth}
          position={[width / 2 - 0.04, railY, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
      )}
      {!open.has('negX') && (
        <SafetyRailing
          length={depth}
          position={[-(width / 2 - 0.04), railY, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />
      )}

      {ladder && (
        <AccessLadder
          height={deckY}
          caged={deckY > 3}
          position={
            ladderSide === 'negX'
              ? [-(width / 2 + 0.35), 0, 0]
              : ladderSide === 'posX'
                ? [width / 2 + 0.35, 0, 0]
                : ladderSide === 'negZ'
                  ? [0, 0, -(depth / 2 + 0.35)]
                  : [0, 0, depth / 2 + 0.35]
          }
          rotation={
            ladderSide === 'negZ' || ladderSide === 'posZ' ? [0, Math.PI / 2, 0] : [0, 0, 0]
          }
        />
      )}

      {children}
    </group>
  );
}
