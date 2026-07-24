import type { ThemeTokens } from './types';

const FONT_UI = "'SF Pro Display', -apple-system, 'Inter', system-ui, sans-serif";
const FONT_MONO = "'SF Mono', ui-monospace, Menlo, monospace";

/** Canonical Sentinel Night (holographic dark HUD). */
export const sentinelNight: ThemeTokens = {
  name: 'sentinel-night',
  label: 'Night',
  hud: {
    bg: '#03070B',
    glass: {
      weak: 'rgba(4, 10, 17, 0.72)',
      medium: 'rgba(4, 10, 17, 0.82)',
      strong: 'rgba(5, 12, 18, 0.9)',
    },
    border: 'rgba(160, 190, 208, 0.16)',
    borderStrong: 'rgba(160, 190, 208, 0.28)',
    title: '#F4F7F8',
    text: '#EEF3F5',
    muted: '#83929D',
    accent: '#66E8C2',
    accentSoft: '#9DF3DA',
    hoverBorder: 'rgba(160, 190, 208, 0.4)',
    hoverText: '#EEF3F5',
    selected: 'rgba(102, 232, 194, 0.22)',
    focusRing: 'rgba(102, 232, 194, 0.55)',
    disabled: 'rgba(131, 146, 157, 0.45)',
    blur: {
      light: '6px',
      medium: '14px',
      heavy: '20px',
    },
    shadow: {
      panel: 'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 8px 24px rgba(0, 0, 0, 0.45)',
      popup: '0 12px 40px rgba(0, 0, 0, 0.5)',
      floating: '0 6px 24px rgba(0, 0, 0, 0.45)',
      tooltip: '0 4px 16px rgba(0, 0, 0, 0.4)',
    },
    navigation: {
      activeZone: 'rgba(102, 232, 194, 0.35)',
      inactiveZone: 'rgba(53, 192, 214, 0.18)',
      activeZoneStroke: '#F4F7F8',
      inactiveZoneStroke: '#35C0D6',
      selectedMachine: '#66E8C2',
      hoverMachine: '#9DF3DA',
      machineDot: '#8B99A4',
      minimapCamera: '#F4F7F8',
      minimapFlow: 'rgba(244, 247, 248, 0.35)',
      minimapArrow: '#F2B45B',
    },
    typography: {
      fontUi: FONT_UI,
      fontMono: FONT_MONO,
      title: '18px',
      body: '13px',
      caption: '11px',
      numeric: 'tabular-nums',
    },
  },
  scene: {
    environment: {
      clearColor: '#03070B',
      ambient: 0.28,
      hemiSky: '#dfe7f2',
      hemiGround: '#6a6a5e',
      hemiIntensity: 0.35,
      directionalIntensity: 1.85,
      environmentIntensity: 0.55,
      fogColor: '#03070B',
      fogNear: 120,
      fogFar: 380,
    },
    rendering: {
      exposure: 1.05,
      contactShadowOpacity: 0.35,
    },
  },
  motion: {
    fast: 150,
    normal: 250,
    slow: 400,
    easing: 'cubic-bezier(0.2, 0.78, 0.2, 1)',
  },
};
