import type * as THREE from "three";

/** Shared materials must survive R3F mesh unmount / StrictMode remount. */
export function pin<T extends THREE.Material>(mat: T): T {
  mat.userData.shared = true;
  mat.dispose = () => {
    /* shared — keep alive */
  };
  return mat;
}
