import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector2 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';

/**
 * Optional post-processing stack (SMAA + subtle Bloom + Vignette).
 *
 * Uses three.js built-in passes (no @react-three/postprocessing).
 * Off by default to protect the FPS budget. Enable with either:
 *   - URL query:      ?fx=1
 *   - localStorage:   localStorage.setItem('twin.postfx', '1')
 * Disable with ?fx=0 or removing the localStorage key.
 */
export function usePostFxEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const param = new URLSearchParams(window.location.search).get('fx');
  if (param === '1') {
    window.localStorage.setItem('twin.postfx', '1');
    return true;
  }
  if (param === '0') {
    window.localStorage.removeItem('twin.postfx');
    return false;
  }
  return window.localStorage.getItem('twin.postfx') === '1';
}

export function PostFX() {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));

    const bloom = new UnrealBloomPass(
      new Vector2(size.width, size.height),
      0.22, // strength
      0.4, // radius
      0.85, // threshold
    );
    c.addPass(bloom);

    const vignette = new ShaderPass(VignetteShader);
    vignette.uniforms['offset'].value = 1.05;
    vignette.uniforms['darkness'].value = 1.05;
    c.addPass(vignette);

    const pixelRatio = gl.getPixelRatio();
    c.addPass(new SMAAPass(size.width * pixelRatio, size.height * pixelRatio));
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera]); // size handled in effect below

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size.width, size.height]);

  useEffect(() => {
    return () => {
      composer.dispose();
    };
  }, [composer]);

  useFrame(() => {
    composer.render();
  }, 1);

  return null;
}
