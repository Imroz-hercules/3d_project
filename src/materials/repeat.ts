import * as THREE from "three";

export function setRepeat(
  tex: THREE.Texture | null | undefined,
  repeatX: number,
  repeatY: number
): void {
  if (!tex) return;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
}

export function setMapsRepeat(
  maps: Record<string, THREE.Texture | undefined>,
  repeatX: number,
  repeatY: number
): void {
  for (const tex of Object.values(maps)) {
    setRepeat(tex, repeatX, repeatY);
  }
}
