import type { CSSProperties } from 'react';
import { zoneBoundsFromRegistry, ZONE_LABELS } from './zoneRegistry';
import { navigateTo } from './navStore';
import type { ProcessZoneId } from './types';

const ICONS: Record<string, string> = {
  overview: '🏭',
  raw: '🌾',
  cleaning: '🧹',
  conditioning: '💧',
  milling: '⚙️',
  storage: '🛢',
  packing: '📦',
  warehouse: '🚚',
};

const btn: CSSProperties = {
  background: 'rgba(30, 36, 42, 0.92)',
  color: '#e8e4d4',
  border: '1px solid #6a7278',
  borderRadius: 6,
  padding: '8px 10px',
  fontSize: 12,
  fontFamily: 'system-ui, sans-serif',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const bar: CSSProperties = {
  position: 'absolute',
  bottom: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  maxWidth: '96vw',
  justifyContent: 'center',
};

export function ZonePresetBar() {
  const zones = zoneBoundsFromRegistry();
  return (
    <div style={bar}>
      <button type="button" style={btn} onClick={() => navigateTo({ kind: 'overview' })}>
        {ICONS.overview} Entire Factory
      </button>
      {zones.map((z) => (
        <button
          key={z.id}
          type="button"
          style={btn}
          onClick={() => navigateTo({ kind: 'zone', zone: z.id })}
        >
          {ICONS[z.id]} {ZONE_LABELS[z.id as ProcessZoneId]}
        </button>
      ))}
    </div>
  );
}
