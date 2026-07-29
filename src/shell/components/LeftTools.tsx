import { buildMachineRegistry } from '../../navigation/MachineRegistry';
import { useNavFocus } from '../../navigation/useNavState';
import { ZONE_LABELS, ZONE_FLOW } from '../../navigation/zoneRegistry';
import type { ProcessZoneId } from '../../navigation/types';
import { useTwinState } from '../../twin/useTwinState';
import type { MachineId } from '../../twin/types';
import {
  goMachine,
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

type Health = 'ok' | 'warn' | 'alarm';

function alarmHealth(alarm: string | undefined): Health {
  if (alarm === 'ALARM') return 'alarm';
  if (alarm === 'WARN') return 'warn';
  return 'ok';
}

function ZoneHealthDot({ zone }: { zone: ProcessZoneId }) {
  const twin = useTwinState();
  const machines = buildMachineRegistry().filter((m) => m.zone === zone);
  let h: Health = 'ok';
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

function MachineHealthDot({ id }: { id: MachineId }) {
  const twin = useTwinState();
  const h = alarmHealth(twin.machines[id]?.alarm);
  return <span className={`shell-zone-dot shell-zone-dot--${h}`} aria-hidden />;
}

export function LeftTools() {
  const { leftExpanded, leftPinned } = usePanelChrome();
  const vis = useVisibilityLayers();
  const focus = useNavFocus();
  const twin = useTwinState();
  const open = leftExpanded || leftPinned;
  const zones = ZONE_FLOW;
  const machines = buildMachineRegistry();

  const overviewActive = focus.kind === 'overview';
  const activeZone = focus.kind === 'zone' ? focus.zone : null;
  const activeMachine =
    focus.kind === 'machine'
      ? focus.machineId
      : twin.selectedId;

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

        <nav className="shell-nav-list" aria-label="Plant zones">
          <button
            type="button"
            className={`shell-nav-item${overviewActive ? ' is-active' : ''}`}
            onClick={() => goOverview()}
          >
            <span className="shell-nav-item__label">
              <span className="shell-nav-bullet" aria-hidden />
              Overview
            </span>
          </button>
          {zones.map((z) => (
            <button
              key={z}
              type="button"
              className={`shell-nav-item${activeZone === z ? ' is-active' : ''}`}
              onClick={() => goZone(z)}
            >
              <span className="shell-nav-item__label">
                <span className="shell-nav-bullet" aria-hidden />
                {ZONE_LABELS[z]}
              </span>
              <ZoneHealthDot zone={z} />
            </button>
          ))}
        </nav>

        <div className="shell-section-label">Machines</div>
        <nav className="shell-nav-list" aria-label="Machines">
          {machines.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`shell-nav-item${activeMachine === m.id ? ' is-active' : ''}`}
              onClick={() => goMachine(m.id)}
              title={`Focus ${m.name}`}
            >
              <span className="shell-nav-item__label">
                <span className="shell-nav-bullet" aria-hidden />
                {m.name}
              </span>
              <MachineHealthDot id={m.id} />
            </button>
          ))}
        </nav>

        <div className="shell-section-label">Visibility</div>
        {(
          [
            ['building', 'Building'],
            ['cutaway', 'Walls / Cutaway'],
            ['roof', 'Roof'],
            ['pipes', 'Pipes'],
            ['dust', 'Dust'],
            ['electrical', 'Electrical'],
            ['xray', 'X-Ray'],
            ['measure', 'Measure Tool'],
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
