import { useTwinState } from '../../twin/useTwinState';
import { MACHINE_LABELS } from '../../twin/types';
import { buildMachineRegistry } from '../../navigation/MachineRegistry';
import { ZONE_LABELS } from '../../navigation/zoneRegistry';
import { STATUS } from '../../theme';
import { useFactoryHealth, usePlantKpis } from '../services/kpi';
import {
  setInspectorTab,
  setRightOpen,
  toggleRightPin,
  usePanelChrome,
} from '../services/panelState';
import { clearSelection } from '../services/selection';
import { useTimelineEvents } from '../services/timeline';
import type { InspectorTab } from '../services/types';

const TABS: { id: InspectorTab; label: string }[] = [
  { id: 'machine', label: 'Machine' },
  { id: 'tags', label: 'Live Tags' },
  { id: 'charts', label: 'Charts' },
  { id: 'maint', label: 'Maint.' },
  { id: 'history', label: 'History' },
];

function Sparkline({ data, width = 200, height = 40 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 0.01);
  const min = Math.min(...data, 0);
  const range = Math.max(0.01, max - min);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} className="shell-sparkline">
      <polyline fill="none" stroke="var(--hud-accent)" strokeWidth="2" points={pts} />
    </svg>
  );
}

function FactoryOverview() {
  const health = useFactoryHealth();
  const kpis = usePlantKpis();
  return (
    <div className="shell-inspector__body">
      <h2 className="shell-inspector__title">Factory Overview</h2>
      <div className="stwin-tag-grid">
        <div className="stwin-tag-cell">
          <div className="stwin-tag-key">Production</div>
          <div className="stwin-tag-val">{kpis.productionTph} T/H</div>
        </div>
        <div className="stwin-tag-cell">
          <div className="stwin-tag-key">Efficiency (OEE)</div>
          <div className="stwin-tag-val">{kpis.oeePct}%</div>
        </div>
        <div className="stwin-tag-cell">
          <div className="stwin-tag-key">Running</div>
          <div className="stwin-tag-val">
            {health.running} / {health.total}
          </div>
        </div>
        <div className="stwin-tag-cell">
          <div className="stwin-tag-key">Energy</div>
          <div className="stwin-tag-val">{kpis.powerKw} kW</div>
        </div>
        <div className="stwin-tag-cell">
          <div className="stwin-tag-key">Today&apos;s output</div>
          <div className="stwin-tag-val">{kpis.todayOutputT} T</div>
        </div>
        <div className="stwin-tag-cell">
          <div className="stwin-tag-key">Current batch</div>
          <div className="stwin-tag-val">DEMO-241</div>
        </div>
      </div>
    </div>
  );
}

export function RightInspector() {
  const twin = useTwinState();
  const { rightOpen, rightPinned, inspectorTab } = usePanelChrome();
  const selected = twin.selectedId ? twin.machines[twin.selectedId] : null;
  const events = useTimelineEvents();
  const open = rightOpen || rightPinned || !!selected;

  const reg = selected ? buildMachineRegistry().find((m) => m.id === selected.id) : null;
  const zoneLabel = reg ? ZONE_LABELS[reg.zone] : null;

  if (!open) return null;

  return (
    <aside className="shell-right stwin-panel">
      <div className="shell-panel-head">
        <nav className="shell-breadcrumb" aria-label="Asset hierarchy">
          <button type="button" className="stwin-breadcrumb__link" onClick={() => clearSelection()}>
            Factory
          </button>
          {zoneLabel && (
            <>
              <span className="stwin-breadcrumb__sep">›</span>
              <span>{zoneLabel}</span>
            </>
          )}
          {selected && (
            <>
              <span className="stwin-breadcrumb__sep">›</span>
              <span>{selected.label}</span>
            </>
          )}
        </nav>
        <div className="shell-panel-head__actions">
          <button type="button" className="stwin-btn shell-pin-btn" onClick={() => toggleRightPin()}>
            {rightPinned ? 'Pinned' : 'Pin'}
          </button>
          <button
            type="button"
            className="stwin-close"
            onClick={() => {
              clearSelection();
              setRightOpen(false);
            }}
          >
            ×
          </button>
        </div>
      </div>

      {!selected ? (
        <FactoryOverview />
      ) : (
        <>
          <div className="shell-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`shell-tab ${inspectorTab === t.id ? 'is-active' : ''}`}
                onClick={() => setInspectorTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {inspectorTab === 'machine' && (
            <div className="shell-inspector__body">
              <h2 className="shell-inspector__title">{selected.label}</h2>
              <div className="stwin-status-row">
                <span
                  className="stwin-pill"
                  style={{ background: selected.running ? STATUS.running : STATUS.stopped }}
                >
                  {selected.running ? 'RUNNING' : 'STOPPED'}
                </span>
                <span
                  className="stwin-pill"
                  style={{
                    background:
                      selected.alarm === 'ALARM'
                        ? STATUS.alarm
                        : selected.alarm === 'WARN'
                          ? STATUS.warning
                          : STATUS.stopped,
                  }}
                >
                  Alarm: {selected.alarm}
                </span>
              </div>
              <p className="shell-muted">Open Live Tags for full PLC values.</p>
            </div>
          )}

          {inspectorTab === 'tags' && (
            <div className="shell-inspector__body">
              <div className="stwin-section-title">Live tags</div>
              <div className="stwin-tag-grid">
                {Object.entries(selected.values).map(([k, v]) => (
                  <div key={k} className="stwin-tag-cell">
                    <div className="stwin-tag-key">{k}</div>
                    <div className="stwin-tag-val">{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inspectorTab === 'charts' && (
            <div className="shell-inspector__body">
              <div className="stwin-section-title">Trend</div>
              <Sparkline data={selected.trend} />
            </div>
          )}

          {inspectorTab === 'maint' && (
            <div className="shell-inspector__body">
              <div className="stwin-maint-row">
                <span>Hours run</span>
                <strong>{selected.hoursRun.toFixed(1)} h</strong>
              </div>
              <div className="stwin-maint-row">
                <span>Next service</span>
                <strong>{selected.nextServiceH.toFixed(0)} h</strong>
              </div>
            </div>
          )}

          {inspectorTab === 'history' && (
            <div className="shell-inspector__body">
              <ul className="shell-history-list">
                {events
                  .filter((e) => e.machineId === selected.id)
                  .slice(0, 12)
                  .map((e) => (
                    <li key={e.id}>
                      {MACHINE_LABELS[selected.id]} — {e.message}
                    </li>
                  ))}
                {events.filter((e) => e.machineId === selected.id).length === 0 && (
                  <li className="shell-muted">No events for this asset yet.</li>
                )}
              </ul>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
