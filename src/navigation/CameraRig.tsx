import { useEffect, useRef } from 'react';
import { CameraControls, OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FramedView } from './framing';
import { setCameraPose } from './navStore';
import { useDebugOrbit } from './useNavState';
import { plantCenter } from '../components/layoutConstants';

export type FlyToFn = (view: FramedView, smooth?: boolean) => Promise<void>;

let flyToImpl: FlyToFn | null = null;

export function flyToView(view: FramedView, smooth = true) {
  return flyToImpl?.(view, smooth) ?? Promise.resolve();
}

type ControlsApi = {
  setLookAt: (
    x: number,
    y: number,
    z: number,
    tx: number,
    ty: number,
    tz: number,
    enableTransition?: boolean
  ) => Promise<void>;
  getPosition: (out: THREE.Vector3) => THREE.Vector3;
  getTarget: (out: THREE.Vector3) => THREE.Vector3;
};

export function CameraRig({ maxDistance }: { maxDistance: number }) {
  const controlsRef = useRef<ControlsApi | null>(null);
  const debugOrbit = useDebugOrbit();
  const poseAcc = useRef(0);
  const posScratch = useRef(new THREE.Vector3());
  const tgtScratch = useRef(new THREE.Vector3());

  useEffect(() => {
    flyToImpl = async (view, smooth = true) => {
      const ctrl = controlsRef.current;
      if (!ctrl || debugOrbit) return;
      await ctrl.setLookAt(
        view.position[0],
        view.position[1],
        view.position[2],
        view.target[0],
        view.target[1],
        view.target[2],
        smooth
      );
    };
    return () => {
      flyToImpl = null;
    };
  }, [debugOrbit]);

  useFrame((_, delta) => {
    if (debugOrbit) return;
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    poseAcc.current += delta;
    if (poseAcc.current < 0.1) return;
    poseAcc.current = 0;

    const [cx, , cz] = plantCenter();
    ctrl.getPosition(posScratch.current);
    ctrl.getTarget(tgtScratch.current);
    const pos = posScratch.current;
    const tgt = tgtScratch.current;
    const dx = tgt.x - pos.x;
    const dz = tgt.z - pos.z;
    const len = Math.hypot(dx, dz) || 1;
    setCameraPose({
      x: pos.x + cx,
      z: pos.z + cz,
      dirX: dx / len,
      dirZ: dz / len,
    });
  });

  if (debugOrbit) {
    return (
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.8}
        zoomSpeed={1}
        panSpeed={1}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 2, 0]}
        minDistance={8}
        maxDistance={maxDistance}
      />
    );
  }

  return (
    <CameraControls
      ref={controlsRef as never}
      makeDefault
      minDistance={8}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI / 2.05}
    />
  );
}
