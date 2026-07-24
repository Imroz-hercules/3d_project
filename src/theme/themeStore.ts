import {
  DEFAULT_THEME,
  resolveTheme,
  type ThemeName,
  type ThemeTokens,
} from './tokens';

type Listener = () => void;
type ThemeChangeListener = (prev: ThemeName, next: ThemeName) => void;

const STORAGE_KEY = 'stwin.theme';

type ThemeState = {
  name: ThemeName;
};

function readStored(): ThemeName {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'sentinel-night' || raw === 'sentinel-day') return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

const state: ThemeState = {
  name: typeof window !== 'undefined' ? readStored() : DEFAULT_THEME,
};

const listeners = new Set<Listener>();
const changeListeners = new Set<ThemeChangeListener>();

function emit() {
  listeners.forEach((l) => l());
}

function persist(name: ThemeName) {
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    /* ignore */
  }
}

export function getThemeName(): ThemeName {
  return state.name;
}

export function getTheme(): { name: ThemeName; tokens: ThemeTokens } {
  return { name: state.name, tokens: resolveTheme(state.name) };
}

export function isNight(): boolean {
  return state.name === 'sentinel-night';
}

export function isDay(): boolean {
  return state.name === 'sentinel-day';
}

export function subscribeTheme(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Plugin / analytics hook — fires after a successful mode change. */
export function onThemeChanged(listener: ThemeChangeListener): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

export function setTheme(name: ThemeName) {
  if (name !== 'sentinel-night' && name !== 'sentinel-day') return;
  if (name === state.name) return;
  const prev = state.name;
  state.name = name;
  persist(name);
  emit();
  changeListeners.forEach((l) => l(prev, name));
}

export function toggleTheme() {
  setTheme(state.name === 'sentinel-night' ? 'sentinel-day' : 'sentinel-night');
}
