/**
 * Dynamic camera framing from bounding boxes / spheres.
 * Never hardcode eye positions — adding a machine to a zone updates framing automatically.
 */

import * as THREE from 'three';
import type { MachineRecord } from './types';
import type { ZoneBounds } from './zoneRegistry';
import { plantCenter } from '../components/layoutConstants';

export interface FramedView {
  position: [number, number, number];
  target: [number, number, number];
}

/** Isometric-ish offset on the view sphere (~40° yaw feel). */
const ISO = { x: 0.55, y: 0.72, z: 0.62 };

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

export function frameZone(bounds: ZoneBounds, fovDeg = 48): FramedView {
  const min = new THREE.Vector3(bounds.minX, bounds.minY, bounds.minZ);
  const max = new THREE.Vector3(bounds.maxX, bounds.maxY, bounds.maxZ);
  const { center, radius } = boxToSphere(min, max);
  const fov = THREE.MathUtils.degToRad(fovDeg);
  const dist = (radius * 1.35) / Math.sin(fov / 2);
  const pos = new THREE.Vector3(
    center.x + dist * ISO.x,
    center.y + dist * ISO.y,
    center.z + dist * ISO.z
  );
  return toCameraSpace(pos, center);
}

/** Tight framing so the selected machine fills most of the viewport. */
export function frameMachine(m: MachineRecord, fovDeg = 40): FramedView {
  const [x, y, z] = m.position;
  const [sx, sy, sz] = m.size;
  const min = new THREE.Vector3(x - sx / 2, y - sy / 2, z - sz / 2);
  const max = new THREE.Vector3(x + sx / 2, y + sy / 2, z + sz / 2);
  const { radius } = boxToSphere(min, max);
  const target = m.cameraTarget
    ? new THREE.Vector3(...m.cameraTarget)
    : new THREE.Vector3(x, y + sy * 0.35, z);
  const fov = THREE.MathUtils.degToRad(fovDeg);
  const dist = (Math.max(radius, 1.2) * 1.2) / Math.sin(fov / 2);
  const pos = new THREE.Vector3(
    target.x + dist * ISO.x,
    target.y + dist * ISO.y,
    target.z + dist * ISO.z
  );
  return toCameraSpace(pos, target);
}
