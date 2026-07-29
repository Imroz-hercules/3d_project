/**
 * Dynamic camera framing from bounding boxes / spheres.
 * Machine/zone views mimic operator “hero” shots (close, oblique) — not top-down map.
 */

import * as THREE from 'three';
import type { MachineRecord } from './types';
import type { ZoneBounds } from './zoneRegistry';
import { plantCenter } from '../components/layoutConstants';

export interface FramedView {
  position: [number, number, number];
  target: [number, number, number];
}

/**
 * Unit offset from look-at → camera for hero shots.
 * Low Y keeps the eye near mid-machine height (Wheat Bank style), not roof-top.
 */
const HERO_DIR = new THREE.Vector3(0.92, 0.18, 0.78).normalize();

/** Slightly higher for wide zone framing only. */
const ZONE_DIR = new THREE.Vector3(0.88, 0.32, 0.82).normalize();

/** Overview stays more isometric. */
const OVERVIEW_DIR = new THREE.Vector3(0.55, 0.62, 0.62).normalize();

function boxToSphere(min: THREE.Vector3, max: THREE.Vector3) {
  const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
  const radius = Math.max(center.distanceTo(max), 0.5);
  return { center, radius };
}

/**
 * Convert plant-local framed view into App camera space
 * (plant group is shifted by -plantCenter).
 */
function toCameraSpace(pos: THREE.Vector3, target: THREE.Vector3): FramedView {
  const [cx, , cz] = plantCenter();
  return {
    position: [pos.x - cx, pos.y, pos.z - cz],
    target: [target.x - cx, target.y, target.z - cz],
  };
}

function placeCamera(
  target: THREE.Vector3,
  dir: THREE.Vector3,
  dist: number,
  eyeYMin: number,
  eyeYMax: number
): THREE.Vector3 {
  const pos = target.clone().addScaledVector(dir, dist);
  pos.y = THREE.MathUtils.clamp(pos.y, eyeYMin, eyeYMax);
  return pos;
}

/** Entire plant — elevated overview. */
export function frameOverview(bounds: ZoneBounds, fovDeg = 50): FramedView {
  const min = new THREE.Vector3(bounds.minX, bounds.minY, bounds.minZ);
  const max = new THREE.Vector3(bounds.maxX, bounds.maxY, bounds.maxZ);
  const { center, radius } = boxToSphere(min, max);
  const fov = THREE.MathUtils.degToRad(fovDeg);
  const dist = (radius * 1.25) / Math.sin(fov / 2);
  const target = new THREE.Vector3(center.x, Math.max(center.y, 2), center.z);
  const pos = placeCamera(target, OVERVIEW_DIR, dist, 8, radius * 1.1);
  return toCameraSpace(pos, target);
}

/**
 * Zone hero shot — close enough to fill the viewport with that area’s equipment
 * (like selecting “Wheat Bank” in the reference UI).
 */
export function frameZone(bounds: ZoneBounds, fovDeg = 42): FramedView {
  const min = new THREE.Vector3(bounds.minX, bounds.minY, bounds.minZ);
  const max = new THREE.Vector3(bounds.maxX, bounds.maxY, bounds.maxZ);
  const { center, radius } = boxToSphere(min, max);
  const height = Math.max(0.5, bounds.maxY - bounds.minY);
  const target = new THREE.Vector3(center.x, bounds.minY + height * 0.45, center.z);
  const fov = THREE.MathUtils.degToRad(fovDeg);
  // Fit zone sphere in ~65% of FOV — much tighter than old map framing
  const dist = (Math.max(radius, height * 0.55) * 0.95) / Math.sin(fov / 2);
  const eyeYMin = bounds.minY + 1.2;
  const eyeYMax = bounds.minY + height * 0.75 + 2;
  const pos = placeCamera(target, ZONE_DIR, dist, eyeYMin, eyeYMax);
  return toCameraSpace(pos, target);
}

/**
 * Single-machine hero shot — equipment fills the screen at an oblique angle
 * matching the Wheat Bank close-up reference (not top-down).
 * `position` is treated as AABB center (same as SelectableMachine).
 */
export function frameMachine(m: MachineRecord, fovDeg = 40): FramedView {
  const [x, y, z] = m.position;
  const [sx, sy, sz] = m.size;
  const halfH = sy / 2;
  const baseY = y - halfH;
  const topY = y + halfH;

  const target = m.cameraTarget
    ? new THREE.Vector3(...m.cameraTarget)
    : new THREE.Vector3(x, y, z);

  const fitSpan = Math.max(sy * 0.92, Math.max(sx, sz) * 1.15);
  const fov = THREE.MathUtils.degToRad(fovDeg);
  // Distance so machine height fills most of the vertical FOV
  const dist = (fitSpan * 0.58) / Math.tan(fov / 2);

  const eyeYMin = Math.max(baseY + 1.2, 1.5);
  const eyeYMax = Math.min(topY - sy * 0.1, target.y + sy * 0.25);
  const pos = placeCamera(
    target,
    HERO_DIR,
    dist,
    eyeYMin,
    Math.max(eyeYMin + 0.5, eyeYMax)
  );

  return toCameraSpace(pos, target);
}
