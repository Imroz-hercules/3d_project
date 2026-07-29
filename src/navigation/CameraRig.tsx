import { useEffect, useRef } from 'react';
import { CameraControls, OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
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
  ) => Promise<void>;
  getPosition: (out: THREE.Vector3) => THREE.Vector3;
  getTarget: (out: THREE.Vector3) => THREE.Vector3;
};

let flyToImpl: FlyToFn | null = null;
let pendingFly: { view: FramedView; smooth: boolean } | null = null;

export function flyToView(view: FramedView, smooth = true) {
  if (flyToImpl) return flyToImpl(view, smooth);
  pendingFly = { view, smooth };
  return Promise.resolve();
}

function applyLookAt(ctrl: ControlsApi, view: FramedView, smooth: boolean) {
  return ctrl.setLookAt(
    view.position[0],
    view.position[1],
    view.position[2],
    view.target[0],
    view.target[1],
    view.target[2],
    smooth
  );
}

/**
 * Drives the main factory Canvas camera (CameraControls).
 * Nav list / minimap both call flyToView — this is the 3D camera, not the 2D map.
 */
export function CameraRig({ maxDistance }: { maxDistance: number }) {
  const controlsRef = useRef<ControlsApi | null>(null);
  const debugOrbit = useDebugOrbit();
  const poseAcc = useRef(0);
  const posScratch = useRef(new THREE.Vector3());
  const tgtScratch = useRef(new THREE.Vector3());

  useEffect(() => {
    flyToImpl = async (view, smooth = true) => {
      if (debugOrbit) {
        // Queue until Fly camera mode is restored
        pendingFly = { view, smooth };
        return;
      }
      const ctrl = controlsRef.current;
      if (!ctrl) {
        pendingFly = { view, smooth };
        return;
      }
      pendingFly = null;
      await applyLookAt(ctrl, view, smooth);
    };
    return () => {
      flyToImpl = null;
    };
  }, [debugOrbit]);

  useFrame((_, delta) => {
    // Flush queued nav when CameraControls is ready (fixes mount / Orbit→Fly races)
    if (!debugOrbit && pendingFly && controlsRef.current) {
      const { view, smooth } = pendingFly;
      pendingFly = null;
      void applyLookAt(controlsRef.current, view, smooth);
    }

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
      smoothTime={0.4}
    />
  );
}
