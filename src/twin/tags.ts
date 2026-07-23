import {
  MACHINE_LABELS,
  MACHINE_ORDER,
  type MachineId,
  type MachineTags,
  type TwinState,
} from './types';

type Listener = () => void;

function makeMachine(id: MachineId, values: Record<string, number | string | boolean>): MachineTags {
  return {
    id,
    label: MACHINE_LABELS[id],
    running: true,
    alarm: 'OFF',
    hoursRun: 1200 + Math.floor(Math.random() * 800),
    nextServiceH: 80 + Math.floor(Math.random() * 120),
    values,
    trend: Array.from({ length: 24 }, () => 0.4 + Math.random() * 0.2),
  };
}

function initialMachines(): Record<MachineId, MachineTags> {
  return {
    silo: makeMachine('silo', { HL: false, ML: true, LL: false, weight_t: 42.5 }),
    elevator: makeMachine('elevator', { running: true, rpm: 45, amp: 18.2 }),
    vibro: makeMachine('vibro', { running: true, rpm: 960, amplitude_mm: 4.5 }),
    roller_mill: makeMachine('roller_mill', { rpm: 520, load_pct: 68, temp_C: 42, amp: 62 }),
    flour_bin_a: makeMachine('flour_bin_a', { fill_pct: 74, weight_t: 14.8, HL: false }),
    packing: makeMachine('packing', { bag_count: 1284, target_kg: 25, cycle_s: 4.2 }),
    check_weigher: makeMachine('check_weigher', { actual_kg: 25.02, accept: true, reject: false }),
    metal_detector: makeMachine('metal_detector', { metal_detect: false, reject_count: 3 }),
    palletizer: makeMachine('palletizer', { layer: 2, bag_on_pallet: 14, pallet_no: 47, mode: 'AUTO' }),
  };
}

let state: TwinState = {
  lineActive: true,
  demoMode: true,
  selectedId: null,
  machines: initialMachines(),
};

const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function getTwinState(): TwinState {
  return state;
}

export function subscribeTwin(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function patchTwinState(partial: Partial<TwinState>) {
  state = { ...state, ...partial };
  emit();
}

export function setMachines(machines: Record<MachineId, MachineTags>) {
  state = { ...state, machines };
  emit();
}

export function setLineActive(active: boolean) {
  const machines = { ...state.machines };
  for (const id of MACHINE_ORDER) {
    machines[id] = { ...machines[id], running: active };
  }
  state = { ...state, lineActive: active, machines };
  emit();
}

export function toggleLineActive() {
  setLineActive(!state.lineActive);
}

export function selectMachine(id: MachineId | null) {
  state = { ...state, selectedId: id };
  emit();
}

export function getSelectedMachine(): MachineTags | null {
  if (!state.selectedId) return null;
  return state.machines[state.selectedId] ?? null;
}

export function getActiveAlarms(): { id: MachineId; label: string; level: string }[] {
  return MACHINE_ORDER.filter((id) => state.machines[id].alarm !== 'OFF').map((id) => ({
    id,
    label: state.machines[id].label,
    level: state.machines[id].alarm,
  }));
}
