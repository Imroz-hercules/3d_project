import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { MotionTokens, SceneTokens } from './tokens';

export type SceneFrameValues = {
  environmentIntensity: number;
  contactShadowOpacity: number;
};

export type ThemeSceneBridgeProps = {
  scene: SceneTokens;
  motion: MotionTokens;
  /** Called when lerped rendering values change (for Environment / ContactShadows outside). */
  onFrameValues?: (values: SceneFrameValues) => void;
};

type Snapshot = {
  clear: THREE.Color;
  ambient: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  directional: number;
  environment: number;
  exposure: number;
  contactShadow: number;
  fogColor: THREE.Color | null;
  fogNear: number;
  fogFar: number;
};

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function snapshotFrom(scene: SceneTokens): Snapshot {
  const env = scene.environment;
  const ren = scene.rendering;
  return {
    clear: new THREE.Color(env.clearColor),
    ambient: env.ambient,
    hemiSky: new THREE.Color(env.hemiSky),
    hemiGround: new THREE.Color(env.hemiGround),
    hemiIntensity: env.hemiIntensity,
    directional: env.directionalIntensity,
    environment: env.environmentIntensity,
    exposure: ren.exposure,
    contactShadow: ren.contactShadowOpacity,
    fogColor: env.fogColor ? new THREE.Color(env.fogColor) : null,
    fogNear: env.fogNear,
    fogFar: env.fogFar,
  };
}

/**
 * Scene environment + rendering only (clear, lights, fog, exposure).
 * Must not touch materials, geometry, or machine status colors.
 */
export function ThemeSceneBridge({ scene, motion, onFrameValues }: ThemeSceneBridgeProps) {
  const { gl, scene: threeScene } = useThree();
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);

  const fromRef = useRef<Snapshot>(snapshotFrom(scene));
  const toRef = useRef<Snapshot>(snapshotFrom(scene));
  const progressRef = useRef(1);
  const durationRef = useRef(motion.normal / 1000);
  const onFrameValuesRef = useRef(onFrameValues);
  onFrameValuesRef.current = onFrameValues;

  const themeKey = useMemo(
    () =>
      [
        scene.environment.clearColor,
        scene.environment.ambient,
        scene.environment.hemiIntensity,
        scene.environment.directionalIntensity,
        scene.environment.environmentIntensity,
        scene.environment.fogColor,
        scene.rendering.exposure,
        scene.rendering.contactShadowOpacity,
      ].join('|'),
    [scene]
  );

  const tmpClear = useMemo(() => new THREE.Color(), []);
  const tmpHemiSky = useMemo(() => new THREE.Color(), []);
  const tmpHemiGround = useMemo(() => new THREE.Color(), []);
  const tmpFog = useMemo(() => new THREE.Color(), []);
  const initialized = useRef(false);

  function mix(from: Snapshot, to: Snapshot, t: number) {
    tmpClear.copy(from.clear).lerp(to.clear, t);
    gl.setClearColor(tmpClear);

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(from.ambient, to.ambient, t);
    }
    if (hemiRef.current) {
      tmpHemiSky.copy(from.hemiSky).lerp(to.hemiSky, t);
      tmpHemiGround.copy(from.hemiGround).lerp(to.hemiGround, t);
      hemiRef.current.color.copy(tmpHemiSky);
      hemiRef.current.groundColor.copy(tmpHemiGround);
      hemiRef.current.intensity = THREE.MathUtils.lerp(from.hemiIntensity, to.hemiIntensity, t);
    }
    if (dirRef.current) {
      dirRef.current.intensity = THREE.MathUtils.lerp(from.directional, to.directional, t);
    }

    gl.toneMappingExposure = THREE.MathUtils.lerp(from.exposure, to.exposure, t);

    const fogNear = THREE.MathUtils.lerp(from.fogNear, to.fogNear, t);
    const fogFar = THREE.MathUtils.lerp(from.fogFar, to.fogFar, t);
    if (from.fogColor && to.fogColor) {
      tmpFog.copy(from.fogColor).lerp(to.fogColor, t);
      if (!(threeScene.fog instanceof THREE.Fog)) {
        threeScene.fog = new THREE.Fog(tmpFog.getHex(), fogNear, fogFar);
      } else {
        threeScene.fog.color.copy(tmpFog);
        threeScene.fog.near = fogNear;
        threeScene.fog.far = fogFar;
      }
    } else if (!to.fogColor) {
      threeScene.fog = null;
    }

    onFrameValuesRef.current?.({
      environmentIntensity: THREE.MathUtils.lerp(from.environment, to.environment, t),
      contactShadowOpacity: THREE.MathUtils.lerp(from.contactShadow, to.contactShadow, t),
    });
  }

  function sampleMixed(t: number): Snapshot {
    const from = fromRef.current;
    const to = toRef.current;
    const fogColor =
      from.fogColor && to.fogColor
        ? new THREE.Color().copy(from.fogColor).lerp(to.fogColor, t)
        : to.fogColor
          ? to.fogColor.clone()
          : null;
    return {
      clear: new THREE.Color().copy(from.clear).lerp(to.clear, t),
      ambient: THREE.MathUtils.lerp(from.ambient, to.ambient, t),
      hemiSky: new THREE.Color().copy(from.hemiSky).lerp(to.hemiSky, t),
      hemiGround: new THREE.Color().copy(from.hemiGround).lerp(to.hemiGround, t),
      hemiIntensity: THREE.MathUtils.lerp(from.hemiIntensity, to.hemiIntensity, t),
      directional: THREE.MathUtils.lerp(from.directional, to.directional, t),
      environment: THREE.MathUtils.lerp(from.environment, to.environment, t),
      exposure: THREE.MathUtils.lerp(from.exposure, to.exposure, t),
      contactShadow: THREE.MathUtils.lerp(from.contactShadow, to.contactShadow, t),
      fogColor,
      fogNear: THREE.MathUtils.lerp(from.fogNear, to.fogNear, t),
      fogFar: THREE.MathUtils.lerp(from.fogFar, to.fogFar, t),
    };
  }

  useEffect(() => {
    const next = snapshotFrom(scene);
    if (!initialized.current) {
      initialized.current = true;
      fromRef.current = next;
      toRef.current = next;
      progressRef.current = 1;
      mix(next, next, 1);
      return;
    }

    fromRef.current = sampleMixed(progressRef.current);
    toRef.current = next;
    durationRef.current = motion.normal / 1000;

    if (prefersReducedMotion() || durationRef.current <= 0) {
      progressRef.current = 1;
      mix(fromRef.current, next, 1);
    } else {
      progressRef.current = 0;
    }
  }, [themeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, dt) => {
    if (progressRef.current >= 1) return;
    const dur = Math.max(0.001, durationRef.current);
    progressRef.current = Math.min(1, progressRef.current + dt / dur);
    mix(fromRef.current, toRef.current, progressRef.current);
  });

  const env = scene.environment;

  return (
    <>
      <ambientLight ref={ambientRef} intensity={env.ambient} />
      <hemisphereLight ref={hemiRef} args={[env.hemiSky, env.hemiGround, env.hemiIntensity]} />
      <directionalLight ref={dirRef} position={[30, 50, 20]} intensity={env.directionalIntensity} />
    </>
  );
}
