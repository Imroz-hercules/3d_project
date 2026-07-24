import type { FactoryEvent } from './types';

type Listener = () => void;

let events: FactoryEvent[] = [];
let seq = 0;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEvents(): FactoryEvent[] {
  return events;
}

export function getEventsSnapshot(): FactoryEvent[] {
  return events;
}

/** Newest first, capped. */
export function publishEvent(
  partial: Omit<FactoryEvent, 'id' | 'timestamp'> & { timestamp?: number; id?: string },
): FactoryEvent {
  const ev: FactoryEvent = {
    id: partial.id ?? `evt-${Date.now()}-${++seq}`,
    timestamp: partial.timestamp ?? Date.now(),
    severity: partial.severity,
    category: partial.category,
    machineId: partial.machineId,
    zoneId: partial.zoneId,
    message: partial.message,
    acknowledged: partial.acknowledged ?? false,
  };
  events = [ev, ...events].slice(0, 200);
  emit();
  return ev;
}

export function acknowledgeEvent(id: string) {
  events = events.map((e) => (e.id === id ? { ...e, acknowledged: true } : e));
  emit();
}

export function acknowledgeAllActionable() {
  events = events.map((e) =>
    e.severity === 'info' || e.acknowledged ? e : { ...e, acknowledged: true },
  );
  emit();
}

/** Seed a few demo process events once. */
export function seedDemoEvents() {
  if (events.length > 0) return;
  const now = Date.now();
  publishEvent({
    timestamp: now - 600_000,
    severity: 'info',
    category: 'process',
    message: 'Packing Started',
    machineId: 'packing',
    zoneId: 'packing',
  });
  publishEvent({
    timestamp: now - 420_000,
    severity: 'info',
    category: 'process',
    message: 'Conditioning Completed',
    machineId: 'conditioning_bin',
    zoneId: 'conditioning',
  });
  publishEvent({
    timestamp: now - 180_000,
    severity: 'operator',
    category: 'operator',
    message: 'Changed Recipe',
    zoneId: 'milling',
  });
}
