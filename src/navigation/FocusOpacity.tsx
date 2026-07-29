/**
 * Dim non-selected machines when a twin selection is active.
 * Clones materials before changing opacity so shared plant materials stay intact.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { useTwinState } from '../twin/useTwinState';
import type { MachineId } from '../twin/types';

type MeshFocusData = {
  orig: THREE.Material | THREE.Material[];
  clones: THREE.Material | THREE.Material[];
};

function isCloneableMaterial(m: unknown): m is THREE.Material {
  return (
    !!m &&
    typeof m === 'object' &&
    (m as THREE.Material).isMaterial === true &&
    typeof (m as THREE.Material).clone === 'function'
  );
}

function cloneMaterials(
  orig: THREE.Material | THREE.Material[]
): THREE.Material | THREE.Material[] | null {
  if (Array.isArray(orig)) {
    const clones = orig.filter(isCloneableMaterial).map((m) => m.clone());
    return clones.length > 0 ? clones : null;
  }
  if (!isCloneableMaterial(orig)) return null;
  return orig.clone();
}

function disposeMats(mats: THREE.Material | THREE.Material[]) {
  const list = Array.isArray(mats) ? mats : [mats];
  for (const m of list) {
    if (typeof m.dispose === 'function') m.dispose();
  }
}

export function FocusableGroup({
  machineId,
  children,
}: {
  machineId: MachineId;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null!);
  const { selectedId } = useTwinState();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const dimming = selectedId != null && selectedId !== machineId;
    const selected = selectedId === machineId;

    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;

      let data = mesh.userData._focus as MeshFocusData | undefined;

      if ((dimming || selected) && !data) {
        const orig = mesh.material;
        const clones = cloneMaterials(orig);
        if (!clones) return;
        mesh.material = clones;
        data = { orig, clones };
        mesh.userData._focus = data;
      }

      if (!data) return;

      const mats = Array.isArray(data.clones) ? data.clones : [data.clones];
      for (const mat of mats) {
        if (!mat || !('opacity' in mat)) continue;
        const m = mat as THREE.Material & { opacity: number; transparent: boolean };
        m.transparent = true;
        m.opacity = dimming ? 0.35 : 1;
        m.needsUpdate = true;
      }

      if (!dimming && !selected && data) {
        mesh.material = data.orig;
        disposeMats(data.clones);
        delete mesh.userData._focus;
      }
    });
  }, [selectedId, machineId]);

  return <group ref={ref}>{children}</group>;
}
