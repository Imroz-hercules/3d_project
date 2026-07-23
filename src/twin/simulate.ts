import { getTwinState, setMachines } from './tags';
import type { MachineId, MachineTags } from './types';

/** Advance simulated PLC tags (call ~10 Hz from App). */
export function tickSimulation(dtSec: number) {
  const state = getTwinState();
  if (!state.demoMode) return;

  const active = state.lineActive;
  const machines: Record<MachineId, MachineTags> = { ...state.machines };

  const bump = (id: MachineId, key: string, base: number, amp: number, decimals = 1) => {
    const m = machines[id];
    const next = active
      ? base + Math.sin(performance.now() / 1000 + amp) * amp * 0.15 + (Math.random() - 0.5) * amp * 0.05
      : 0;
    const rounded = Number(next.toFixed(decimals));
    const trendVal = active ? Math.min(1, Math.max(0, (rounded - base + amp) / (amp * 2) + 0.5)) : 0.15;
    machines[id] = {
      ...m,
      running: active,
      hoursRun: m.hoursRun + (active ? dtSec / 3600 : 0),
      nextServiceH: Math.max(0, m.nextServiceH - (active ? dtSec / 3600 : 0)),
      values: { ...m.values, [key]: rounded },
      trend: [...m.trend.slice(1), trendVal],
    };
  };

  bump('elevator', 'rpm', 45, 3, 0);
  bump('elevator', 'amp', 18, 2, 1);
  bump('vibro', 'rpm', 960, 20, 0);
  bump('roller_mill', 'rpm', 520, 15, 0);
  bump('roller_mill', 'load_pct', 68, 8, 0);
  bump('roller_mill', 'temp_C', 42, 3, 1);
  bump('roller_mill', 'amp', 62, 5, 1);
  bump('packing', 'cycle_s', 4.2, 0.3, 1);

  const packing = machines.packing;
  const bagCount =
    (packing.values.bag_count as number) + (active && Math.random() < dtSec * 0.4 ? 1 : 0);
  machines.packing = {
    ...packing,
    running: active,
    values: { ...packing.values, bag_count: bagCount },
    trend: [...packing.trend.slice(1), active ? 0.5 + Math.random() * 0.3 : 0.1],
  };

  const silo = machines.silo;
  let weight = silo.values.weight_t as number;
  if (active) weight = Math.max(5, weight - dtSec * 0.02);
  else weight = Math.min(55, weight + dtSec * 0.01);
  machines.silo = {
    ...silo,
    running: active,
    values: {
      ...silo.values,
      weight_t: Number(weight.toFixed(1)),
      HL: weight > 50,
      ML: weight > 20 && weight <= 50,
      LL: weight <= 20,
    },
    trend: [...silo.trend.slice(1), weight / 60],
  };

  const check = machines.check_weigher;
  const actual = active ? 24.9 + Math.random() * 0.25 : 0;
  const reject = active && actual < 24.85;
  machines.check_weigher = {
    ...check,
    running: active,
    values: {
      actual_kg: Number(actual.toFixed(2)),
      accept: !reject && active,
      reject,
    },
    alarm: reject ? 'WARN' : 'OFF',
    trend: [...check.trend.slice(1), active ? (actual - 24.7) / 0.5 : 0.1],
  };

  const metal = machines.metal_detector;
  const detect = active && Math.random() < dtSec * 0.02;
  machines.metal_detector = {
    ...metal,
    running: active,
    values: {
      metal_detect: detect,
      reject_count: (metal.values.reject_count as number) + (detect ? 1 : 0),
    },
    alarm: detect ? 'ALARM' : 'OFF',
    trend: [...metal.trend.slice(1), detect ? 0.95 : 0.2],
  };

  const pal = machines.palletizer;
  let layer = pal.values.layer as number;
  let bags = pal.values.bag_on_pallet as number;
  let palletNo = pal.values.pallet_no as number;
  if (active && Math.random() < dtSec * 0.5) {
    bags += 1;
    if (bags >= 8) {
      bags = 0;
      layer += 1;
      if (layer >= 8) {
        layer = 0;
        palletNo += 1;
      }
    }
  }
  machines.palletizer = {
    ...pal,
    running: active,
    values: {
      ...pal.values,
      layer,
      bag_on_pallet: bags,
      pallet_no: palletNo,
      mode: active ? 'AUTO' : 'STOPPED',
    },
    trend: [...pal.trend.slice(1), active ? 0.4 + layer / 16 : 0.1],
  };

  const mill = machines.roller_mill;
  const temp = mill.values.temp_C as number;
  machines.roller_mill = {
    ...mill,
    alarm: temp > 48 ? 'WARN' : 'OFF',
  };

  const vibro = machines.vibro;
  machines.vibro = { ...vibro, running: active };

  const elev = machines.elevator;
  machines.elevator = { ...elev, running: active };

  const bin = machines.flour_bin_a;
  machines.flour_bin_a = {
    ...bin,
    running: active,
    values: {
      ...bin.values,
      fill_pct: active
        ? Math.max(20, (bin.values.fill_pct as number) - dtSec * 0.05)
        : Math.min(95, (bin.values.fill_pct as number) + dtSec * 0.02),
    },
  };

  setMachines(machines);
}
