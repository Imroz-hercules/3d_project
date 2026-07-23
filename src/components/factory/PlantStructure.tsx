'use client';

/**
 * Shared low-poly plant structure primitives for the flour mill digital twin.
 * Platforms, railings, ladders, walkways, and mezzanine bays — assembled in
 * MaterialHandlingLine rather than duplicated inside each machine.
 */

import type { ReactNode } from 'react';

type V3 = [number, number, number];

const COLORS = {
  steel: '#3a454c',
  steelLight: '#4a555c',
  deck: '#5a6268',
  rail: '#e0a92c',
  kick: '#4a5058',
} as const;

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
      <mesh position={[0, thickness / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <meshStandardMaterial color={COLORS.deck} metalness={0.7} roughness={0.4} />
      </mesh>
      {showBeams && (
        <>
          <mesh position={[0, -0.06, depth / 2 - 0.06]} castShadow>
            <boxGeometry args={[width, 0.12, 0.12]} />
            <meshStandardMaterial color={COLORS.steel} metalness={0.75} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.06, -(depth / 2 - 0.06)]} castShadow>
            <boxGeometry args={[width, 0.12, 0.12]} />
            <meshStandardMaterial color={COLORS.steel} metalness={0.75} roughness={0.35} />
          </mesh>
          <mesh position={[width / 2 - 0.06, -0.06, 0]} castShadow>
            <boxGeometry args={[0.12, 0.12, depth]} />
            <meshStandardMaterial color={COLORS.steel} metalness={0.75} roughness={0.35} />
          </mesh>
          <mesh position={[-(width / 2 - 0.06), -0.06, 0]} castShadow>
            <boxGeometry args={[0.12, 0.12, depth]} />
            <meshStandardMaterial color={COLORS.steel} metalness={0.75} roughness={0.35} />
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
      {posts.map((x, i) => (
        <mesh key={i} position={[x, height / 2, 0]} castShadow>
          <boxGeometry args={[0.05, height, 0.05]} />
          <meshStandardMaterial color={COLORS.steelLight} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Top rail */}
      <mesh position={[0, height, 0]} castShadow>
        <boxGeometry args={[length, 0.04, 0.04]} />
        <meshStandardMaterial color={COLORS.rail} metalness={0.65} roughness={0.35} />
      </mesh>
      {/* Mid rail */}
      <mesh position={[0, height * 0.55, 0]} castShadow>
        <boxGeometry args={[length, 0.03, 0.03]} />
        <meshStandardMaterial color={COLORS.rail} metalness={0.65} roughness={0.35} />
      </mesh>
      {/* Kick plate */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[length, 0.12, 0.03]} />
        <meshStandardMaterial color={COLORS.kick} metalness={0.7} roughness={0.4} />
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
      <mesh position={[-half, height / 2, 0]} castShadow>
        <boxGeometry args={[0.05, height, 0.05]} />
        <meshStandardMaterial color={COLORS.steel} metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[half, height / 2, 0]} castShadow>
        <boxGeometry args={[0.05, height, 0.05]} />
        <meshStandardMaterial color={COLORS.steel} metalness={0.75} roughness={0.35} />
      </mesh>
      {Array.from({ length: rungCount }, (_, i) => {
        const y = 0.15 + (i / (rungCount - 1)) * (height - 0.3);
        return (
          <mesh key={i} position={[0, y, 0.02]} castShadow>
            <boxGeometry args={[width - 0.05, 0.035, 0.04]} />
            <meshStandardMaterial color={COLORS.steelLight} metalness={0.8} roughness={0.3} />
          </mesh>
        );
      })}
      {caged && height > 2.5 && (
        <>
          {[0.25, 0.5, 0.75].map((t, i) => (
            <mesh key={i} position={[0, height * t, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.38, 0.025, 6, 16]} />
              <meshStandardMaterial color={COLORS.steelLight} metalness={0.75} roughness={0.35} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

/* ==========================================================================
   SUPPORT COLUMNS
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
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={[0.18, height, 0.18]} />
          <meshStandardMaterial color={COLORS.steel} metalness={0.75} roughness={0.35} />
        </mesh>
      ))}
    </>
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
  children,
}: {
  width: number;
  depth: number;
  deckY: number;
  position?: V3;
  ladder?: boolean;
  ladderSide?: 'negX' | 'posX' | 'negZ' | 'posZ';
  openSides?: Array<'negX' | 'posX' | 'negZ' | 'posZ'>;
  children?: ReactNode;
}) {
  const open = new Set(openSides);
  const railY = deckY + 0.1;

  return (
    <group position={position}>
      <SupportColumns width={width} depth={depth} height={deckY} />
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
