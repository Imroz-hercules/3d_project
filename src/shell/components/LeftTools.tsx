import { buildMachineRegistry } from '../../navigation/MachineRegistry';
import { ZONE_LABELS } from '../../navigation/zoneRegistry';
import type { ProcessZoneId } from '../../navigation/types';
import { useTwinState } from '../../twin/useTwinState';
import {
  goOverview,
  goZone,
  pauseLine,
  resetCamera,
  startLine,
  stopLine,
} from '../services/navigation';
import {
  setLeftExpanded,
  toggleLeftPin,
  usePanelChrome,
} from '../services/panelState';
import { toggleVisibilityLayer, useVisibilityLayers } from '../services/visibility';

const NAV_ICONS: Record<string, string> = {
  overview: '🏭',
  raw: '🌾',
  cleaning: '🧹',
  conditioning: '💧',
  milling: '⚙',
  storage: '🛢',
  packing: '📦',
  warehouse: '🚚',
};

type ZoneHealth = 'ok' | 'warn' | 'alarm';

function ZoneHealthDot({ zone }: { zone: ProcessZoneId }) {
  const twin = useTwinState();
  const machines = buildMachineRegistry().filter((m) => m.zone === zone);
  let h: ZoneHealth = 'ok';
  for (const m of machines) {
    const tags = twin.machines[m.id];
    if (!tags) continue;
    if (tags.alarm === 'ALARM') {
      h = 'alarm';
      break;
    }
    if (tags.alarm === 'WARN') h = 'warn';
  }
  return <span className={`shell-zone-dot shell-zone-dot--${h}`} aria-hidden />;
}

export function LeftTools() {
  const { leftExpanded, leftPinned } = usePanelChrome();
  const vis = useVisibilityLayers();
  const open = leftExpanded || leftPinned;
  const zones = Object.keys(ZONE_LABELS) as ProcessZoneId[];

  return (
    <div
      className={`shell-left ${open ? 'is-open' : ''}`}
      onMouseEnter={() => setLeftExpanded(true)}
      onMouseLeave={() => {
        if (!leftPinned) setLeftExpanded(false);
      }}
    >
      {!open && (
        <button
          type="button"
          className="shell-left__tab"
          aria-label="Open navigation"
          onClick={() => setLeftExpanded(true)}
        >
          ▶
        </button>
      )}

      <aside className="shell-left__panel stwin-panel">
        <div className="shell-panel-head">
          <span className="shell-section-label">Navigation</span>
          <button type="button" className="stwin-btn shell-pin-btn" onClick={() => toggleLeftPin()}>
            {leftPinned ? 'Pinned' : 'Pin'}
          </button>
        </div>

        <button type="button" className="shell-nav-item" onClick={() => goOverview()}>
          <span>{NAV_ICONS.overview} Entire Factory</span>
        </button>
        {zones.map((z) => (
          <button key={z} type="button" className="shell-nav-item" onClick={() => goZone(z)}>
            <span>
              {NAV_ICONS[z]} {ZONE_LABELS[z]}
            </span>
            <ZoneHealthDot zone={z} />
          </button>
        ))}

        <div className="shell-section-label">Visibility</div>
        {(
          [
            ['building', 'Building'],
            ['cutaway', 'Walls / Cutaway'],
            ['roof', 'Roof'],
            ['pipes', 'Pipes'],
            ['dust', 'Dust'],
            ['electrical', 'Electrical'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="shell-check">
            <input
              type="checkbox"
              checked={vis[key]}
              onChange={() => toggleVisibilityLayer(key)}
            />
            {label}
          </label>
        ))}

        <div className="shell-section-label">Quick Actions</div>
        <div className="shell-quick-actions">
          <button type="button" className="stwin-btn" onClick={() => startLine()}>
            ▶ Start
          </button>
          <button type="button" className="stwin-btn" onClick={() => pauseLine()}>
            ⏸ Pause
          </button>
          <button type="button" className="stwin-btn" onClick={() => stopLine()}>
            ⏹ Stop
          </button>
          <button type="button" className="stwin-btn" onClick={() => resetCamera()}>
            ↺ Reset Cam
          </button>
        </div>
      </aside>
    </div>
  );
}
