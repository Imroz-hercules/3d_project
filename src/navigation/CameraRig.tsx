import { useEffect, useRef } from 'react';
import { CameraControls, OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { FramedView } from './framing';
import { setCameraPose } from './navStore';
import { useDebugOrbit } from './useNavState';
import { plantCenter } from '../components/layoutConstants';

export type FlyToFn = (view: FramedView, smooth?: boolean) => Promise<void>;

type ControlsApi = {
  setLookAt: (
    x: number,
    y: number,
    z: number,
    tx: number,
    ty: number,
    tz: number,
    enableTransition?: boolean
  ) => Promise<unknown>;
  getPosition: (out: THREE.Vector3) => THREE.Vector3;
  getTarget: (out: THREE.Vector3) => THREE.Vector3;
};

let pendingFly: { view: FramedView; smooth: boolean } | null = null;

export function flyToView(view: FramedView, smooth = true) {
  pendingFly = { view, smooth };
  return Promise.resolve();
}

function isControls(c: unknown): c is ControlsApi {
  return !!c && typeof (c as ControlsApi).setLookAt === 'function';
}

/**
 * Drives the main factory Canvas camera (CameraControls).
 * Nav list / minimap both call flyToView — this is the 3D camera, not the 2D map.
 */
export function CameraRig({ maxDistance }: { maxDistance: number }) {
  const controlsRef = useRef<ControlsApi | null>(null);
  const debugOrbit = useDebugOrbit();
  const invalidate = useThree((s) => s.invalidate);
  const getThree = useThree((s) => s.get);
  const poseAcc = useRef(0);
  const posScratch = useRef(new THREE.Vector3());
  const tgtScratch = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!debugOrbit && pendingFly) {
      const ctrl =
        controlsRef.current ??
        (isControls(getThree().controls) ? (getThree().controls as ControlsApi) : null);
      if (ctrl) {
        const { view, smooth } = pendingFly;
        pendingFly = null;
        void ctrl.setLookAt(
          view.position[0],
          view.position[1],
          view.position[2],
          view.target[0],
          view.target[1],
          view.target[2],
          smooth
        );
        invalidate();
      }
    }

    if (debugOrbit) return;
    const ctrl =
      controlsRef.current ??
      (isControls(getThree().controls) ? (getThree().controls as ControlsApi) : null);
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
        minDistance={3}
        maxDistance={maxDistance}
      />
    );
  }

  return (
    <CameraControls
      ref={controlsRef as never}
      makeDefault
      minDistance={3}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI / 2.05}
      dollyToCursor={false}
      smoothTime={0.45}
    />
  );
}
