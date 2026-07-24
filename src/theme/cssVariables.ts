import type { HudTokens, MotionTokens } from './tokens';

/** Map HUD (+ transition) tokens to CSS custom properties. Scene/STATUS stay in TS. */
export function applyHudCssVariables(hud: HudTokens, motion: MotionTokens, root: HTMLElement = document.documentElement) {
  const set = (key: string, value: string) => root.style.setProperty(key, value);

  set('--hud-bg', hud.bg);
  set('--hud-glass-weak', hud.glass.weak);
  set('--hud-glass-medium', hud.glass.medium);
  set('--hud-glass-strong', hud.glass.strong);
  set('--hud-border', hud.border);
  set('--hud-border-strong', hud.borderStrong);
  set('--hud-title', hud.title);
  set('--hud-text', hud.text);
  set('--hud-muted', hud.muted);
  set('--hud-accent', hud.accent);
  set('--hud-accent-soft', hud.accentSoft);
  set('--hud-hover-border', hud.hoverBorder);
  set('--hud-hover-text', hud.hoverText);
  set('--hud-selected', hud.selected);
  set('--hud-focus-ring', hud.focusRing);
  set('--hud-disabled', hud.disabled);

  set('--hud-blur-light', hud.blur.light);
  set('--hud-blur-medium', hud.blur.medium);
  set('--hud-blur-heavy', hud.blur.heavy);

  set('--hud-shadow-panel', hud.shadow.panel);
  set('--hud-shadow-popup', hud.shadow.popup);
  set('--hud-shadow-floating', hud.shadow.floating);
  set('--hud-shadow-tooltip', hud.shadow.tooltip);

  set('--hud-nav-active-zone', hud.navigation.activeZone);
  set('--hud-nav-inactive-zone', hud.navigation.inactiveZone);
  set('--hud-nav-active-zone-stroke', hud.navigation.activeZoneStroke);
  set('--hud-nav-inactive-zone-stroke', hud.navigation.inactiveZoneStroke);
  set('--hud-nav-selected-machine', hud.navigation.selectedMachine);
  set('--hud-nav-hover-machine', hud.navigation.hoverMachine);
  set('--hud-nav-machine-dot', hud.navigation.machineDot);
  set('--hud-nav-minimap-camera', hud.navigation.minimapCamera);
  set('--hud-nav-minimap-flow', hud.navigation.minimapFlow);
  set('--hud-nav-minimap-arrow', hud.navigation.minimapArrow);

  set('--hud-font-ui', hud.typography.fontUi);
  set('--hud-font-mono', hud.typography.fontMono);
  set('--hud-size-title', hud.typography.title);
  set('--hud-size-body', hud.typography.body);
  set('--hud-size-caption', hud.typography.caption);

  set('--hud-transition-ms', `${motion.normal}ms`);
  set('--hud-easing', motion.easing);
}
