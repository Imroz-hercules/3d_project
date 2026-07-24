/** Shared factory event model for timeline + notifications. */

import type { MachineId } from '../../twin/types';

export type EventSeverity = 'info' | 'warning' | 'alarm' | 'maintenance' | 'operator';
export type EventCategory = 'process' | 'alarm' | 'maintenance' | 'operator';

export interface FactoryEvent {
  id: string;
  timestamp: number;
  severity: EventSeverity;
  category: EventCategory;
  machineId?: MachineId;
  zoneId?: string;
  message: string;
  acknowledged?: boolean;
}

export type InspectorTab = 'machine' | 'tags' | 'charts' | 'maint' | 'history';

export interface VisibilityLayers {
  building: boolean;
  cutaway: boolean;
  roof: boolean;
  pipes: boolean;
  dust: boolean;
  electrical: boolean;
}

export interface PanelChrome {
  leftExpanded: boolean;
  leftPinned: boolean;
  rightOpen: boolean;
  rightPinned: boolean;
  inspectorTab: InspectorTab;
  notifyPopoverOpen: boolean;
}

export interface PlantKpis {
  productionTph: number;
  todayOutputT: number;
  powerKw: number;
  oeePct: number;
}

export interface FactoryHealth {
  status: 'healthy' | 'warning' | 'alarm';
  running: number;
  total: number;
  alarms: number;
}
