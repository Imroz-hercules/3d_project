import { useSyncExternalStore } from 'react';
import { getTwinState, subscribeTwin } from '../../twin/tags';
import { MACHINE_ORDER } from '../../twin/types';
import type { FactoryHealth, PlantKpis } from './types';

export function computeFactoryHealth(): FactoryHealth {
  const { machines } = getTwinState();
  const total = MACHINE_ORDER.length;
  let running = 0;
  let alarms = 0;
  let warnings = 0;
  for (const id of MACHINE_ORDER) {
    const m = machines[id];
    if (m.running) running += 1;
    if (m.alarm === 'ALARM') alarms += 1;
    else if (m.alarm === 'WARN') warnings += 1;
  }
  const status = alarms > 0 ? 'alarm' : warnings > 0 ? 'warning' : 'healthy';
  return { status, running, total, alarms };
}

export function computePlantKpis(): PlantKpis {
  const { machines, lineActive } = getTwinState();
  const packing = machines.packing;
  const mill = machines.roller_mill;
  const bagCount = Number(packing.values.bag_count ?? 0);
  const cycle = Number(packing.values.cycle_s ?? 4.2);
  const productionTph = lineActive ? Math.max(8, (3600 / Math.max(1, cycle)) * 0.025) : 0;
  const todayOutputT = bagCount * 0.025;
  const powerKw =
    (mill.running ? Number(mill.values.amp ?? 50) * 0.4 : 0) +
    MACHINE_ORDER.filter((id) => machines[id].running).length * 8.5;
  const health = computeFactoryHealth();
  const availability = health.total ? health.running / health.total : 0;
  const oeePct = lineActive ? availability * 0.92 * 0.97 * 100 : 0;
  return {
    productionTph: Number(productionTph.toFixed(1)),
    todayOutputT: Number(todayOutputT.toFixed(1)),
    powerKw: Number(powerKw.toFixed(0)),
    oeePct: Number(oeePct.toFixed(1)),
  };
}

export function useFactoryHealth(): FactoryHealth {
  return useSyncExternalStore(subscribeTwin, computeFactoryHealth, computeFactoryHealth);
}

export function usePlantKpis(): PlantKpis {
  return useSyncExternalStore(subscribeTwin, computePlantKpis, computePlantKpis);
}
