'use client';

/**
 * Shared process piping primitives for the flour mill digital twin.
 * Elbowed product ducts, flanges, hangers, gravity chutes, and packing belt bridges.
 */

import type { ReactNode } from 'react';
import * as THREE from 'three';
import {
  matDustDuct,
  matFlange,
  matPaintYellow,
  matPneumatic,
  matSteel,
  matSteelDark,
} from '../../perf/sharedMaterials';

export type V3 = [number, number, number];

const COLORS = {
  steel: '#8a9199',
  steelDark: '#6a7278',
  flangeSteel: '#7a8288',
  belt: '#3a3f45',
  beltFrame: '#5a6268',
  reject: '#5a5550',
  /** Flour pneumatic — slightly lighter stainless look. */
  pneumatic: '#b8c0c8',
  /** Dust utilities — darker than product ducts. */
  dust: '#4a5058',
} as const;

export const PIPE_COLORS = {
  product: COLORS.steel,
  pneumatic: COLORS.pneumatic,
  dust: COLORS.dust,
} as const;

const matBelt = new THREE.MeshStandardMaterial({
  color: COLORS.belt,
  metalness: 0.25,
  roughness: 0.75,
});
const matBeltFrame = new THREE.MeshStandardMaterial({
  color: COLORS.beltFrame,
  metalness: 0.65,
  roughness: 0.4,
});
const matReject = new THREE.MeshStandardMaterial({
  color: COLORS.reject,
  metalness: 0.45,
  roughness: 0.55,
});

function ductMat(color: string = COLORS.steel): THREE.MeshStandardMaterial {
  if (color === COLORS.pneumatic) return matPneumatic;
  if (color === COLORS.dust) return matDustDuct;
  if (color === COLORS.steelDark) return matSteelDark;
  return matSteel;
}

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
      <mesh castShadow={false} receiveShadow={false} material={matFlange}>
        <boxGeometry args={[size, thickness, size]} />
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
    <mesh position={mid.toArray() as V3} quaternion={quat} castShadow={false} receiveShadow={false} material={ductMat(color)}>
      <cylinderGeometry args={[radius, radius, len, 8]} />
    </mesh>
  );
}

/** Soft elbow sphere at a pipe corner so segments read as engineered bends. */
export function PipeElbow({ position, radius }: { position: V3; radius: number }) {
  return (
    <mesh position={position} castShadow={false} receiveShadow={false} material={matSteelDark}>
      <sphereGeometry args={[radius * 1.08, 8, 6]} />
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
      <mesh position={[0, -radius - 0.03, 0]} castShadow={false} material={matFlange}>
        <boxGeometry args={[clampW, 0.05, clampW * 0.55]} />
      </mesh>
      <mesh position={[0, -radius - drop / 2, 0]} castShadow={false} material={matSteelDark}>
        <cylinderGeometry args={[0.03, 0.03, drop, 6]} />
      </mesh>
      <mesh position={[0, -radius - drop, 0]} castShadow={false} material={matFlange}>
        <boxGeometry args={[0.18, 0.06, 0.18]} />
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
        <mesh castShadow={false} receiveShadow={false} material={matSteel}>
          <cylinderGeometry args={[bottomSize / 2, topSize / 2, len, 4]} />
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
      <mesh position={[0, 0.35, 0]} castShadow={false} receiveShadow={false} material={matReject}>
        <boxGeometry args={[0.7, 0.7, 0.55]} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow={false} material={matFlange}>
        <boxGeometry args={[0.78, 0.05, 0.62]} />
      </mesh>
      {label && (
        <mesh position={[0, 0.4, 0.28]} material={matPaintYellow}>
          <boxGeometry args={[0.5, 0.12, 0.02]} />
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
      <mesh castShadow={false} receiveShadow={false} material={matBelt}>
        <boxGeometry args={alongX ? [len, thickness, width] : [width, thickness, len]} />
      </mesh>
      <mesh position={alongX ? [0, -0.06, width / 2 + 0.02] : [width / 2 + 0.02, -0.06, 0]} castShadow={false} material={matBeltFrame}>
        <boxGeometry args={alongX ? [len, 0.1, 0.04] : [0.04, 0.1, len]} />
      </mesh>
      <mesh position={alongX ? [0, -0.06, -(width / 2 + 0.02)] : [-(width / 2 + 0.02), -0.06, 0]} castShadow={false} material={matBeltFrame}>
        <boxGeometry args={alongX ? [len, 0.1, 0.04] : [0.04, 0.1, len]} />
      </mesh>
      {/* End flanges / skirt plates */}
      <mesh position={alongX ? [-len / 2, 0, 0] : [0, 0, -len / 2]} castShadow={false} material={matFlange}>
        <boxGeometry args={alongX ? [0.04, thickness + 0.04, width + 0.06] : [width + 0.06, thickness + 0.04, 0.04]} />
      </mesh>
      <mesh position={alongX ? [len / 2, 0, 0] : [0, 0, len / 2]} castShadow={false} material={matFlange}>
        <boxGeometry args={alongX ? [0.04, thickness + 0.04, width + 0.06] : [width + 0.06, thickness + 0.04, 0.04]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   PNEUMATIC FLOUR KIT
   ========================================================================== */

/** 90° pneumatic elbow (torus segment look via sphere + short stubs). */
export function PneumaticElbow({
  position,
  radius,
  color = COLORS.pneumatic,
}: {
  position: V3;
  radius: number;
  color?: string;
}) {
  return (
    <mesh position={position} castShadow={false} receiveShadow={false} material={ductMat(color)}>
      <sphereGeometry args={[radius * 1.15, 10, 8]} />
    </mesh>
  );
}

/** Tee fitting at a branch junction. */
export function PneumaticTee({
  position,
  radius,
  color = COLORS.pneumatic,
}: {
  position: V3;
  radius: number;
  color?: string;
}) {
  const r = radius;
  return (
    <group position={position}>
      <mesh castShadow={false} receiveShadow={false} rotation={[0, 0, Math.PI / 2]} material={ductMat(color)}>
        <cylinderGeometry args={[r * 1.05, r * 1.05, r * 3.2, 8]} />
      </mesh>
      <mesh castShadow={false} receiveShadow={false} material={ductMat(color)}>
        <cylinderGeometry args={[r * 1.05, r * 1.05, r * 2.2, 8]} />
      </mesh>
    </group>
  );
}

/** Concentric reducer between two radii along a short axial length. */
export function PipeReducer({
  start,
  end,
  startRadius,
  endRadius,
  color = COLORS.pneumatic,
}: {
  start: V3;
  end: V3;
  startRadius: number;
  endRadius: number;
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
    <group>
      <mesh position={mid.toArray() as V3} quaternion={quat} castShadow={false} receiveShadow={false} material={ductMat(color)}>
        <cylinderGeometry args={[endRadius, startRadius, len, 10]} />
      </mesh>
      <SquareFlange size={startRadius * 2.4} thickness={0.035} position={start} />
      <SquareFlange size={endRadius * 2.4} thickness={0.035} position={end} />
    </group>
  );
}

/** Inline butterfly / slide valve stub on a pneumatic line. */
export function PneumaticValve({
  position,
  radius,
  color = COLORS.pneumatic,
}: {
  position: V3;
  radius: number;
  color?: string;
}) {
  return (
    <group position={position}>
      <mesh castShadow={false} material={matSteelDark}>
        <boxGeometry args={[radius * 2.6, radius * 2.6, radius * 1.4]} />
      </mesh>
      <mesh position={[0, radius * 1.6, 0]} castShadow={false} material={ductMat(color)}>
        <cylinderGeometry args={[0.04, 0.04, radius * 0.9, 6]} />
      </mesh>
      <mesh position={[0, radius * 2.15, 0]} castShadow={false} material={matPaintYellow}>
        <boxGeometry args={[0.16, 0.08, 0.1]} />
      </mesh>
    </group>
  );
}

/**
 * Flour pneumatic run — ElbowedPipe with stainless color + elbow spheres.
 * Prefer this over raw product ducts for closed flour transfer.
 */
export function PneumaticPipe({
  path,
  radius,
  supportEvery = 2.5,
}: {
  path: V3[];
  radius: number;
  supportEvery?: number;
}) {
  return (
    <ElbowedPipe
      path={path}
      radius={radius}
      supportEvery={supportEvery}
      color={COLORS.pneumatic}
      flangeSize={radius * 2.5}
    />
  );
}
