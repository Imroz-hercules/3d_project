import { useSyncExternalStore } from 'react';
import type { VisibilityLayers } from './types';

type Listener = () => void;

let layers: VisibilityLayers = {
  building: true,
  cutaway: true,
  roof: true,
  pipes: true,
  dust: false,
  electrical: false,
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return layers;
}

export function useVisibilityLayers(): VisibilityLayers {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getVisibilityLayers(): VisibilityLayers {
  return layers;
}

export function setVisibilityLayer<K extends keyof VisibilityLayers>(key: K, value: VisibilityLayers[K]) {
  layers = { ...layers, [key]: value };
  emit();
}

export function toggleVisibilityLayer(key: keyof VisibilityLayers) {
  setVisibilityLayer(key, !layers[key] as never);
}
