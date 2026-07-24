import { sentinelDay } from './sentinelDay';
import { sentinelNight } from './sentinelNight';
import type { ThemeName, ThemeTokens } from './types';

export type { ThemeName, ThemeTokens, HudTokens, SceneTokens, MotionTokens } from './types';
export { STATUS } from './status';

export const THEME_REGISTRY: Record<ThemeName, ThemeTokens> = {
  'sentinel-night': sentinelNight,
  'sentinel-day': sentinelDay,
};

export const DEFAULT_THEME: ThemeName = 'sentinel-night';

export function resolveTheme(name: ThemeName): ThemeTokens {
  return THEME_REGISTRY[name] ?? THEME_REGISTRY[DEFAULT_THEME];
}
