import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** True when the camera is within `radius` of a world-space point. */
export function useCameraNear(
  worldPoint: [number, number, number],
  radius: number
): boolean {
  const camera = useThree((s) => s.camera);
  const [near, setNear] = useState(true);
  const tmp = useRef(new THREE.Vector3());

  useFrame(() => {
    tmp.current.set(worldPoint[0], worldPoint[1], worldPoint[2]);
    const d = camera.position.distanceTo(tmp.current);
    const next = d < radius;
    setNear((prev) => (prev === next ? prev : next));
  });

  return near;
}
