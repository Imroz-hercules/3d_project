import type { ProcessZoneId } from './types';
import { zoneBoundsFromRegistry, ZONE_LABELS } from './zoneRegistry';
import { navigateTo } from './navStore';

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

export function ZonePresetBar() {
  const zones = zoneBoundsFromRegistry();
  return (
    <div className="stwin-zone-bar">
      <button type="button" className="stwin-btn" onClick={() => navigateTo({ kind: 'overview' })}>
        {ICONS.overview} Entire Factory
      </button>
      {zones.map((z) => (
        <button
          key={z.id}
          type="button"
          className="stwin-btn"
          onClick={() => navigateTo({ kind: 'zone', zone: z.id })}
        >
          {ICONS[z.id]} {ZONE_LABELS[z.id as ProcessZoneId]}
        </button>
      ))}
    </div>
  );
}
