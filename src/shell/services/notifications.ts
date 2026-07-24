/**
 * Notifications service — filters FactoryEvents into badge + toast surfaces.
 * Does not mutate twin alarms directly; ack only marks FactoryEvent.acknowledged.
 */

import { useSyncExternalStore } from 'react';
import { acknowledgeEvent, getEvents, publishEvent, subscribeEvents } from './events';
import type { FactoryEvent } from './types';

export type ToastItem = {
  eventId: string;
  message: string;
  severity: FactoryEvent['severity'];
  machineId?: FactoryEvent['machineId'];
  sticky: boolean;
  createdAt: number;
};

type Listener = () => void;

let toasts: ToastItem[] = [];
const toastListeners = new Set<Listener>();
const seenIds = new Set<string>();

function emitToasts() {
  toastListeners.forEach((l) => l());
}

function subscribeToasts(l: Listener) {
  toastListeners.add(l);
  return () => toastListeners.delete(l);
}

function getToasts() {
  return toasts;
}

/** Actionable = warning/alarm/maintenance/operator and not acknowledged. */
export function isActionable(e: FactoryEvent): boolean {
  if (e.acknowledged) return false;
  return e.severity === 'warning' || e.severity === 'alarm' || e.severity === 'maintenance' || e.severity === 'operator';
}

export function getActiveNotifications(): FactoryEvent[] {
  return getEvents().filter(isActionable);
}

export function useActiveNotifications(): FactoryEvent[] {
  return useSyncExternalStore(subscribeEvents, getActiveNotifications, getActiveNotifications);
}

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(subscribeToasts, getToasts, getToasts);
}

function shouldToast(e: FactoryEvent): boolean {
  return e.severity === 'warning' || e.severity === 'alarm' || e.severity === 'operator';
}

function isSticky(e: FactoryEvent): boolean {
  return e.severity === 'alarm';
}

/** Watch event stream and enqueue toasts for new actionable flash events. */
export function syncToastsFromEvents() {
  for (const e of getEvents()) {
    if (seenIds.has(e.id)) continue;
    seenIds.add(e.id);
    if (!shouldToast(e) || e.acknowledged) continue;
    toasts = [
      {
        eventId: e.id,
        message: e.message,
        severity: e.severity,
        machineId: e.machineId,
        sticky: isSticky(e),
        createdAt: Date.now(),
      },
      ...toasts,
    ].slice(0, 5);
    emitToasts();
  }
}

export function dismissToast(eventId: string) {
  toasts = toasts.filter((t) => t.eventId !== eventId);
  emitToasts();
}

export function acknowledgeNotification(id: string) {
  acknowledgeEvent(id);
  dismissToast(id);
}

/** Bridge twin alarm chips into FactoryEvent stream. */
export function publishAlarmEvent(
  machineId: FactoryEvent['machineId'],
  level: 'WARN' | 'ALARM',
  label: string,
) {
  const severity = level === 'ALARM' ? 'alarm' : 'warning';
  const ev = publishEvent({
    severity,
    category: 'alarm',
    machineId,
    message: `${label}: ${level === 'ALARM' ? 'Alarm' : 'Warning'}`,
  });
  syncToastsFromEvents();
  return ev;
}

export function publishMaintenanceEvent(machineId: FactoryEvent['machineId'], message: string) {
  const ev = publishEvent({
    severity: 'maintenance',
    category: 'maintenance',
    machineId,
    message,
  });
  syncToastsFromEvents();
  return ev;
}
