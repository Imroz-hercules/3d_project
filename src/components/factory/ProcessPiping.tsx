'use client';

/**
 * Shared process piping primitives for the flour mill digital twin.
 * Elbowed product ducts, flanges, hangers, gravity chutes, and packing belt bridges.
 */

import type { ReactNode } from 'react';
import * as THREE from 'three';

export type V3 = [number, number, number];

const COLORS = {
  steel: '#8a9199',
  steelDark: '#6a7278',
  flangeSteel: '#7a8288',
  belt: '#3a3f45',
  beltFrame: '#5a6268',
  reject: '#5a5550',
} as const;

/* ==========================================================================
   FLANGE / STRAIGHT DUCT
   ========================================================================== */

export function SquareFlange({
  size,
  thickness = 0.04,
  position,
}: {
  size: number;
  thickness?: number;
  position: V3;
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, thickness, size]} />
        <meshStandardMaterial color={COLORS.flangeSteel} metalness={0.75} roughness={0.35} />
      </mesh>
    </group>
  );
}

export function RoundDuct({
  start,
  end,
  radius,
  color = COLORS.steel,
}: {
  start: V3;
  end: V3;
  radius: number;
  color?: string;
}) {
  const startV = new THREE.Vector3(...start);
  const endV = new THREE.Vector3(...end);
  const dir = new THREE.Vector3().subVectors(endV, startV);
  const len = dir.length();
  if (len < 0.001) return null;
  const mid = new THREE.Vector3().addVectors(startV, endV).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );
  return (
    <mesh position={mid.toArray() as V3} quaternion={quat} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, len, 16]} />
      <meshStandardMaterial color={color} metalness={0.65} roughness={0.4} />
    </mesh>
  );
}

/** Soft elbow sphere at a pipe corner so segments read as engineered bends. */
export function PipeElbow({ position, radius }: { position: V3; radius: number }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <sphereGeometry args={[radius * 1.08, 12, 10]} />
      <meshStandardMaterial color={COLORS.steelDark} metalness={0.7} roughness={0.35} />
    </mesh>
  );
}

/** U-hanger / clevis support under a pipe centreline point. */
export function PipeSupport({
  position,
  radius,
  drop = 0.35,
}: {
  position: V3;
  radius: number;
  drop?: number;
}) {
  const clampW = radius * 2.4;
  return (
    <group position={position}>
      <mesh position={[0, -radius - 0.03, 0]} castShadow>
        <boxGeometry args={[clampW, 0.05, clampW * 0.55]} />
        <meshStandardMaterial color={COLORS.flangeSteel} metalness={0.75} roughness={0.4} />
      </mesh>
      <mesh position={[0, -radius - drop / 2, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, drop, 8]} />
        <meshStandardMaterial color={COLORS.steelDark} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, -radius - drop, 0]} castShadow>
        <boxGeometry args={[0.18, 0.06, 0.18]} />
        <meshStandardMaterial color={COLORS.flangeSteel} metalness={0.75} roughness={0.4} />
      </mesh>
    </group>
  );
}

/**
 * Multi-segment product duct: straight runs + elbows at interior corners +
 * hangers every `supportEvery` metres on long spans. Optional end flanges.
 */
export function ElbowedPipe({
  path,
  radius,
  supportEvery = 2.5,
  flangeSize,
  color = COLORS.steel,
}: {
  path: V3[];
  radius: number;
  supportEvery?: number;
  flangeSize?: number;
  color?: string;
}) {
  if (path.length < 2) return null;
  const flange = flangeSize ?? radius * 2.4;
  const segments: ReactNode[] = [];
  const elbows: ReactNode[] = [];
  const supports: ReactNode[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    segments.push(<RoundDuct key={`seg-${i}`} start={a} end={b} radius={radius} color={color} />);

    const ax = a[0];
    const ay = a[1];
    const az = a[2];
    const bx = b[0];
    const by = b[1];
    const bz = b[2];
    const len = Math.hypot(bx - ax, by - ay, bz - az);
    if (len > supportEvery) {
      const n = Math.floor(len / supportEvery);
      for (let s = 1; s <= n; s++) {
        const t = s / (n + 1);
        const p: V3 = [ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t];
        supports.push(<PipeSupport key={`sup-${i}-${s}`} position={p} radius={radius} />);
      }
    }
  }

  for (let i = 1; i < path.length - 1; i++) {
    elbows.push(<PipeElbow key={`elb-${i}`} position={path[i]} radius={radius} />);
  }

  return (
    <group>
      {segments}
      {elbows}
      {supports}
      <SquareFlange size={flange} thickness={0.04} position={path[0]} />
      <SquareFlange size={flange} thickness={0.04} position={path[path.length - 1]} />
    </group>
  );
}

/* ==========================================================================
   GRAVITY CHUTE / REJECT
   ========================================================================== */

/** Tapered rectangular gravity chute between two flanges. */
export function GravityChute({
  start,
  end,
  topSize = 0.35,
  bottomSize = 0.22,
}: {
  start: V3;
  end: V3;
  topSize?: number;
  bottomSize?: number;
}) {
  const startV = new THREE.Vector3(...start);
  const endV = new THREE.Vector3(...end);
  const dir = new THREE.Vector3().subVectors(endV, startV);
  const len = dir.length();
  if (len < 0.01) return null;
  const mid = new THREE.Vector3().addVectors(startV, endV).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );
  return (
    <group>
      <group position={mid.toArray() as V3} quaternion={quat}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[bottomSize / 2, topSize / 2, len, 4]} />
          <meshStandardMaterial color={COLORS.steel} metalness={0.6} roughness={0.45} />
        </mesh>
      </group>
      <SquareFlange size={topSize + 0.08} thickness={0.04} position={start} />
      <SquareFlange size={bottomSize + 0.08} thickness={0.04} position={end} />
    </group>
  );
}

/** Small floor reject / byproduct collection bin under a waste chute. */
export function RejectBin({ position, label }: { position: V3; label?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.7, 0.55]} />
        <meshStandardMaterial color={COLORS.reject} metalness={0.45} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.78, 0.05, 0.62]} />
        <meshStandardMaterial color={COLORS.flangeSteel} metalness={0.7} roughness={0.4} />
      </mesh>
      {label && (
        <mesh position={[0, 0.4, 0.28]}>
          <boxGeometry args={[0.5, 0.12, 0.02]} />
          <meshStandardMaterial color="#c9a227" metalness={0.3} roughness={0.6} />
        </mesh>
      )}
    </group>
  );
}

/* ==========================================================================
   PACKING BELT BRIDGE
   ========================================================================== */

/**
 * Short belt bridge closing an air gap between packing-cell conveyors.
 * Keeps bag path continuous without inventing a full machine.
 */
export function BeltBridge({
  start,
  end,
  width = 0.55,
  thickness = 0.07,
}: {
  start: V3;
  end: V3;
  width?: number;
  thickness?: number;
}) {
  const startV = new THREE.Vector3(...start);
  const endV = new THREE.Vector3(...end);
  const dir = new THREE.Vector3().subVectors(endV, startV);
  const len = dir.length();
  if (len < 0.02) return null;
  const mid = new THREE.Vector3().addVectors(startV, endV).multiplyScalar(0.5);
  const yaw = Math.atan2(dir.x, dir.z);
  // Local +Z along travel when rotation Y = yaw — but packing runs +X, so use X-aligned box
  const alongX = Math.abs(dir.x) >= Math.abs(dir.z);
  return (
    <group position={mid.toArray() as V3} rotation={alongX ? [0, 0, 0] : [0, yaw, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={alongX ? [len, thickness, width] : [width, thickness, len]} />
        <meshStandardMaterial color={COLORS.belt} metalness={0.25} roughness={0.75} />
      </mesh>
      <mesh position={alongX ? [0, -0.06, width / 2 + 0.02] : [width / 2 + 0.02, -0.06, 0]} castShadow>
        <boxGeometry args={alongX ? [len, 0.1, 0.04] : [0.04, 0.1, len]} />
        <meshStandardMaterial color={COLORS.beltFrame} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={alongX ? [0, -0.06, -(width / 2 + 0.02)] : [-(width / 2 + 0.02), -0.06, 0]} castShadow>
        <boxGeometry args={alongX ? [len, 0.1, 0.04] : [0.04, 0.1, len]} />
        <meshStandardMaterial color={COLORS.beltFrame} metalness={0.65} roughness={0.4} />
      </mesh>
      {/* End flanges / skirt plates */}
      <mesh position={alongX ? [-len / 2, 0, 0] : [0, 0, -len / 2]} castShadow>
        <boxGeometry args={alongX ? [0.04, thickness + 0.04, width + 0.06] : [width + 0.06, thickness + 0.04, 0.04]} />
        <meshStandardMaterial color={COLORS.flangeSteel} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={alongX ? [len / 2, 0, 0] : [0, 0, len / 2]} castShadow>
        <boxGeometry args={alongX ? [0.04, thickness + 0.04, width + 0.06] : [width + 0.06, thickness + 0.04, 0.04]} />
        <meshStandardMaterial color={COLORS.flangeSteel} metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}
