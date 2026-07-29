import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type V3 = [number, number, number];

/**
 * Shared mechanical animation kit.
 * All hooks gate per-frame work on `active` so stopped machines cost nothing.
 */

/** Continuous rotation around one axis while active (fans, rollers, shafts). */
export function useSpin(
  ref: MutableRefObject<THREE.Object3D | null>,
  speed: number,
  active: boolean,
  axis: 'x' | 'y' | 'z' = 'z'
) {
  useFrame((_, delta) => {
    if (!active || !ref.current) return;
    ref.current.rotation[axis] += delta * speed;
  });
}

/** Procedural belt texture: dark rubber with subtle transverse cleats. */
let beltTextureCache: THREE.Texture | null = null;
function getBeltTexture(): THREE.Texture {
  if (beltTextureCache) return beltTextureCache;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#242628';
  ctx.fillRect(0, 0, size, size);
  // Transverse cleat lines (scroll direction = u/x)
  ctx.fillStyle = '#2e3134';
  for (let x = 0; x < size; x += 16) {
    ctx.fillRect(x, 0, 3, size);
  }
  // Faint longitudinal wear streak
  ctx.fillStyle = 'rgba(70, 72, 74, 0.35)';
  ctx.fillRect(0, size * 0.42, size, size * 0.16);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  beltTextureCache = tex;
  return tex;
}

/**
 * Conveyor belt surface whose texture scrolls along local X while active.
 * Drop-in replacement for a static rubber box.
 */
export function ScrollingBelt({
  length,
  width,
  thickness = 0.04,
  position = [0, 0, 0],
  active,
  speed = 0.35,
  castShadow = false,
}: {
  length: number;
  width: number;
  thickness?: number;
  position?: V3;
  active: boolean;
  speed?: number;
  castShadow?: boolean;
}) {
  const texture = useMemo(() => {
    const t = getBeltTexture().clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, Math.round(length * 2.5)), 1);
    return t;
  }, [length]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        color: '#cfcfcf',
        roughness: 0.92,
        metalness: 0.04,
      }),
    [texture]
  );

  useFrame((_, delta) => {
    if (!active) return;
    texture.offset.x -= delta * speed;
  });

  return (
    <mesh position={position} castShadow={castShadow} receiveShadow={false} material={material}>
      <boxGeometry args={[length, thickness, width]} />
    </mesh>
  );
}

/**
 * Damped pneumatic stroke helper: eases a value toward extended/retracted
 * targets with air-cushion feel. Call inside useFrame consumers via ref.
 */
export function usePneumaticStroke(
  extended: boolean,
  retractedValue: number,
  extendedValue: number,
  lambda = 8
) {
  const value = useRef(retractedValue);
  useFrame((_, delta) => {
    const target = extended ? extendedValue : retractedValue;
    value.current = THREE.MathUtils.damp(value.current, target, lambda, delta);
  });
  return value;
}
