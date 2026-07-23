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

function disposeMats(mats: THREE.Material | THREE.Material[]) {
  const list = Array.isArray(mats) ? mats : [mats];
  for (const m of list) m.dispose();
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
        const clones = Array.isArray(orig) ? orig.map((m) => m.clone()) : orig.clone();
        mesh.material = clones;
        data = { orig, clones };
        mesh.userData._focus = data;
      }

      if (!data) return;

      const mats = Array.isArray(data.clones) ? data.clones : [data.clones];
      for (const mat of mats) {
        if (!('opacity' in mat)) continue;
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
