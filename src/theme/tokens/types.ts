export type ThemeName = 'sentinel-night' | 'sentinel-day';

export type HudGlass = {
  weak: string;
  medium: string;
  strong: string;
};

export type HudBlur = {
  light: string;
  medium: string;
  heavy: string;
};

export type HudShadow = {
  panel: string;
  popup: string;
  floating: string;
  tooltip: string;
};

export type HudNavigation = {
  activeZone: string;
  inactiveZone: string;
  activeZoneStroke: string;
  inactiveZoneStroke: string;
  selectedMachine: string;
  hoverMachine: string;
  machineDot: string;
  minimapCamera: string;
  minimapFlow: string;
  minimapArrow: string;
};

export type HudTypography = {
  fontUi: string;
  fontMono: string;
  title: string;
  body: string;
  caption: string;
  numeric: string;
};

export type HudTokens = {
  bg: string;
  glass: HudGlass;
  border: string;
  borderStrong: string;
  title: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  hoverBorder: string;
  hoverText: string;
  selected: string;
  focusRing: string;
  disabled: string;
  blur: HudBlur;
  shadow: HudShadow;
  navigation: HudNavigation;
  typography: HudTypography;
};

export type SceneEnvironment = {
  clearColor: string;
  ambient: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  directionalIntensity: number;
  environmentIntensity: number;
  fogColor: string | null;
  fogNear: number;
  fogFar: number;
};

export type SceneRendering = {
  exposure: number;
  contactShadowOpacity: number;
};

export type SceneTokens = {
  environment: SceneEnvironment;
  rendering: SceneRendering;
};

export type MotionTokens = {
  fast: number;
  normal: number;
  slow: number;
  easing: string;
};

export type ThemeTokens = {
  name: ThemeName;
  label: string;
  hud: HudTokens;
  scene: SceneTokens;
  motion: MotionTokens;
};
