import { useSyncExternalStore } from 'react';
import { getEvents, subscribeEvents } from './events';
import type { FactoryEvent } from './types';

export function getTimelineEvents(): FactoryEvent[] {
  return getEvents();
}

export function useTimelineEvents(): FactoryEvent[] {
  return useSyncExternalStore(subscribeEvents, getTimelineEvents, getTimelineEvents);
}

export function formatEventTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
