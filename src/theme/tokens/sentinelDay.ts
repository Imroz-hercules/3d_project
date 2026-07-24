import type { ThemeTokens } from './types';

const FONT_UI = "'SF Pro Display', -apple-system, 'Inter', system-ui, sans-serif";
const FONT_MONO = "'SF Mono', ui-monospace, Menlo, monospace";

/** Sentinel Day — same design language, bright control-room surfaces. */
export const sentinelDay: ThemeTokens = {
  name: 'sentinel-day',
  label: 'Day',
  hud: {
    bg: '#F5F7FA',
    glass: {
      weak: 'rgba(255, 255, 255, 0.72)',
      medium: 'rgba(255, 255, 255, 0.78)',
      strong: 'rgba(255, 255, 255, 0.92)',
    },
    border: 'rgba(40, 60, 80, 0.12)',
    borderStrong: 'rgba(40, 60, 80, 0.22)',
    title: '#18222D',
    text: '#18222D',
    muted: '#64707A',
    accent: '#2FBF9A',
    accentSoft: '#66E8C2',
    hoverBorder: 'rgba(40, 60, 80, 0.28)',
    hoverText: '#0F161C',
    selected: 'rgba(47, 191, 154, 0.18)',
    focusRing: 'rgba(47, 191, 154, 0.5)',
    disabled: 'rgba(100, 112, 122, 0.4)',
    blur: {
      light: '6px',
      medium: '12px',
      heavy: '18px',
    },
    shadow: {
      panel: 'inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 8px 24px rgba(24, 34, 45, 0.08)',
      popup: '0 12px 40px rgba(24, 34, 45, 0.12)',
      floating: '0 6px 20px rgba(24, 34, 45, 0.1)',
      tooltip: '0 4px 14px rgba(24, 34, 45, 0.1)',
    },
    navigation: {
      activeZone: 'rgba(47, 191, 154, 0.32)',
      inactiveZone: 'rgba(53, 192, 214, 0.16)',
      activeZoneStroke: '#18222D',
      inactiveZoneStroke: '#35C0D6',
      selectedMachine: '#2FBF9A',
      hoverMachine: '#66E8C2',
      machineDot: '#7C8B96',
      minimapCamera: '#18222D',
      minimapFlow: 'rgba(24, 34, 45, 0.28)',
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
      clearColor: '#EEF2F5',
      ambient: 0.55,
      hemiSky: '#e8f0f8',
      hemiGround: '#9a9a90',
      hemiIntensity: 0.55,
      directionalIntensity: 2.15,
      environmentIntensity: 0.75,
      fogColor: '#EEF2F5',
      fogNear: 160,
      fogFar: 420,
    },
    rendering: {
      exposure: 1.2,
      contactShadowOpacity: 0.22,
    },
  },
  motion: {
    fast: 150,
    normal: 250,
    slow: 400,
    easing: 'cubic-bezier(0.2, 0.78, 0.2, 1)',
  },
};
