import { EffectComposer, Bloom, SMAA, Vignette } from '@react-three/postprocessing';

/**
 * Optional post-processing stack (SMAA + subtle Bloom + Vignette).
 *
 * Off by default to protect the 50+ FPS budget. Enable with either:
 *   - URL query:      ?fx=1   (persists for the session)
 *   - localStorage:   localStorage.setItem('twin.postfx', '1')
 * Disable again with ?fx=0 or removing the localStorage key.
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
  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom intensity={0.22} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
      <Vignette eskil={false} offset={0.18} darkness={0.5} />
    </EffectComposer>
  );
}
