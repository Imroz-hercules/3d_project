import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useVisibilityLayers } from '../shell/services/visibility';

interface SavedMaterialState {
  transparent: boolean;
  opacity: number;
  depthWrite: boolean;
}

/**
 * X-ray mode: while enabled, every opaque standard material under the parent
 * group is made semi-transparent so internals, sight glasses, and material
 * flow read through housings. Original settings are restored on toggle-off.
 * Mount once inside the plant group.
 */
export function XRayMode() {
  const { xray } = useVisibilityLayers();
  const anchorRef = useRef<THREE.Group>(null);
  const savedRef = useRef(new Map<THREE.Material, SavedMaterialState>());

  useEffect(() => {
    const root = anchorRef.current?.parent;
    if (!root) return;

    if (xray) {
      const saved = savedRef.current;
      root.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of mats) {
          const std = mat as THREE.MeshStandardMaterial;
          if (!std || !(std as { isMeshStandardMaterial?: boolean }).isMeshStandardMaterial) continue;
          if (saved.has(std)) continue;
          // Skip already-transparent overlays (glass, markings, ghosts)
          if (std.transparent && std.opacity < 0.9) continue;
          saved.set(std, {
            transparent: std.transparent,
            opacity: std.opacity,
            depthWrite: std.depthWrite,
          });
          std.transparent = true;
          std.opacity = 0.22;
          std.depthWrite = false;
          std.needsUpdate = true;
        }
      });
      return () => {
        for (const [mat, prev] of saved) {
          mat.transparent = prev.transparent;
          mat.opacity = prev.opacity;
          mat.depthWrite = prev.depthWrite;
          mat.needsUpdate = true;
        }
        saved.clear();
      };
    }
    return undefined;
  }, [xray]);

  return <group ref={anchorRef} />;
}
