/** Digital twin machine IDs and tag shapes. */

export type MachineId =
  | 'silo'
  | 'elevator'
  | 'vibro'
  | 'roller_mill'
  | 'flour_bin_a'
  | 'packing'
  | 'check_weigher'
  | 'metal_detector'
  | 'palletizer';

export type AlarmLevel = 'OFF' | 'WARN' | 'ALARM';

export interface MachineTags {
  id: MachineId;
  label: string;
  running: boolean;
  alarm: AlarmLevel;
  hoursRun: number;
  nextServiceH: number;
  /** Live numeric tags shown in the HUD */
  values: Record<string, number | string | boolean>;
  /** Short history for sparkline (0–1 normalized samples) */
  trend: number[];
}

export interface TwinState {
  lineActive: boolean;
  demoMode: boolean;
  selectedId: MachineId | null;
  machines: Record<MachineId, MachineTags>;
}

export const MACHINE_ORDER: MachineId[] = [
  'silo',
  'elevator',
  'vibro',
  'roller_mill',
  'flour_bin_a',
  'packing',
  'check_weigher',
  'metal_detector',
  'palletizer',
];

export const MACHINE_LABELS: Record<MachineId, string> = {
  silo: 'Grain Silo',
  elevator: 'Bucket Elevator',
  vibro: 'Vibro Separator',
  roller_mill: 'Roller Mill',
  flour_bin_a: 'Flour Bin A',
  packing: 'Packing Machine',
  check_weigher: 'Check Weigher',
  metal_detector: 'Metal Detector',
  palletizer: 'Robotic Palletizer',
};
