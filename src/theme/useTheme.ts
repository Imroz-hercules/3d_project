import { useSyncExternalStore } from 'react';
import { getTheme, getThemeName, subscribeTheme } from './themeStore';
import type { ThemeName, ThemeTokens } from './tokens';

export function useTheme(): { name: ThemeName; tokens: ThemeTokens } {
  return useSyncExternalStore(subscribeTheme, getTheme, getTheme);
}

export function useThemeName(): ThemeName {
  return useSyncExternalStore(subscribeTheme, getThemeName, getThemeName);
}
