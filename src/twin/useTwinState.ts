import { useSyncExternalStore } from 'react';
import { getTwinState, subscribeTwin } from './tags';
import type { TwinState } from './types';

export function useTwinState(): TwinState {
  return useSyncExternalStore(subscribeTwin, getTwinState, getTwinState);
}
