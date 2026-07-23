import { useSyncExternalStore } from 'react';
import { getCameraPose, getNavState, subscribeCameraPose, subscribeNav } from './navStore';
import type { NavState } from './types';

export function useNavState(): NavState {
  return useSyncExternalStore(subscribeNav, getNavState, getNavState);
}

export function useDebugOrbit(): boolean {
  return useSyncExternalStore(
    subscribeNav,
    () => getNavState().debugOrbit,
    () => getNavState().debugOrbit
  );
}

export function useNavFocus() {
  return useSyncExternalStore(
    subscribeNav,
    () => getNavState().focus,
    () => getNavState().focus
  );
}

export function useCameraPose() {
  return useSyncExternalStore(subscribeCameraPose, getCameraPose, getCameraPose);
}
