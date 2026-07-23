import * as THREE from "three";

/**
 * Shared materials for the plant.
 *
 * CRITICAL: R3F disposes materials when a mesh unmounts (and StrictMode
 * remounts once on start). Shared module materials must never be disposed,
 * or every consumer goes black.
 */
function pin<T extends THREE.Material>(mat: T): T {
  mat.userData.shared = true;
  mat.dispose = () => {
    /* shared — keep alive */
  };
  return mat;
}

/** Low metalness so materials read correctly without an HDR Environment. */
export const matSteel = pin(
  new THREE.MeshStandardMaterial({
    color: "#a8aeb4",
    metalness: 0.12,
    roughness: 0.62,
  })
);

export const matSteelDark = pin(
  new THREE.MeshStandardMaterial({
    color: "#6a7278",
    metalness: 0.14,
    roughness: 0.65,
  })
);

export const matFlange = pin(
  new THREE.MeshStandardMaterial({
    color: "#949aA0",
    metalness: 0.15,
    roughness: 0.58,
  })
);

export const matPaintBlue = pin(
  new THREE.MeshStandardMaterial({
    color: "#3a5f8a",
    metalness: 0.08,
    roughness: 0.65,
  })
);

export const matPaintYellow = pin(
  new THREE.MeshStandardMaterial({
    color: "#c9a227",
    metalness: 0.08,
    roughness: 0.6,
  })
);

export const matRubber = pin(
  new THREE.MeshStandardMaterial({
    color: "#2a2a2a",
    metalness: 0.02,
    roughness: 0.92,
  })
);

export const matConcrete = pin(
  new THREE.MeshStandardMaterial({
    color: "#b0b0a8",
    metalness: 0.02,
    roughness: 0.95,
  })
);

export const matPneumatic = pin(
  new THREE.MeshStandardMaterial({
    color: "#c8d0d8",
    metalness: 0.12,
    roughness: 0.55,
  })
);

export const matDustDuct = pin(
  new THREE.MeshStandardMaterial({
    color: "#6a7278",
    metalness: 0.12,
    roughness: 0.6,
  })
);

export const matDeck = pin(
  new THREE.MeshStandardMaterial({
    color: "#7a8288",
    metalness: 0.12,
    roughness: 0.6,
  })
);

export const matStructureSteel = pin(
  new THREE.MeshStandardMaterial({
    color: "#6a747c",
    metalness: 0.12,
    roughness: 0.6,
  })
);

export const matRailYellow = pin(
  new THREE.MeshStandardMaterial({
    color: "#e0a92c",
    metalness: 0.08,
    roughness: 0.55,
  })
);
