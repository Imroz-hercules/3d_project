import { useMemo, useState } from 'react';
import { searchMachines } from '../../navigation/MachineRegistry';
import { ThemeToggle } from '../../theme/ThemeToggle';
import { NavHistoryButtons } from '../../navigation/NavHistoryButtons';
import { toggleDebugOrbit } from '../../navigation/navStore';
import { useDebugOrbit } from '../../navigation/useNavState';
import { getTwinState, toggleLineActive } from '../../twin/tags';
import { useTwinState } from '../../twin/useTwinState';
import type { MachineId } from '../../twin/types';
import type { ProcessZoneId } from '../../navigation/types';
import { ZONE_LABELS } from '../../navigation/zoneRegistry';
import { inspectMachine } from '../services/selection';
import { useFactoryHealth, usePlantKpis } from '../services/kpi';
import { cameraPresetOverview, cameraPresetZone, startLine, stopLine } from '../services/navigation';
import { publishEvent } from '../services/events';
import { syncToastsFromEvents } from '../services/notifications';
import { NotificationBadge } from './NotificationCenter';

const ZONE_PRESETS: ProcessZoneId[] = [
  'raw',
  'cleaning',
  'conditioning',
  'milling',
  'storage',
  'packing',
  'warehouse',
];

function FactoryHealthWidget() {
  const h = useFactoryHealth();
  const label = h.status === 'healthy' ? 'Healthy' : h.status === 'warning' ? 'Warning' : 'Alarm';
  return (
    <div className={`shell-health shell-health--${h.status}`} title="Factory operational state">
      <span className="shell-health__dot" aria-hidden />
      <div>
        <div className="shell-health__title">{label}</div>
        <div className="shell-health__meta">
          {h.running} / {h.total} · Alm {h.alarms}
        </div>
      </div>
    </div>
  );
}

function KpiStrip() {
  const k = usePlantKpis();
  return (
    <div className="shell-kpi-strip" aria-label="Production KPIs">
      <div className="shell-kpi">
        <div className="shell-kpi__label">Prod</div>
        <div className="shell-kpi__value">{k.productionTph} T/H</div>
      </div>
      <div className="shell-kpi">
        <div className="shell-kpi__label">Today</div>
        <div className="shell-kpi__value">{k.todayOutputT} T</div>
      </div>
      <div className="shell-kpi">
        <div className="shell-kpi__label">Power</div>
        <div className="shell-kpi__value">{k.powerKw} kW</div>
      </div>
      <div className="shell-kpi">
        <div className="shell-kpi__label">OEE</div>
        <div className="shell-kpi__value">{k.oeePct}%</div>
      </div>
    </div>
  );
}

function MachineSearchField() {
  const [q, setQ] = useState('');
  const hits = useMemo(() => searchMachines(q).slice(0, 8), [q]);

  function focus(id: MachineId) {
    inspectMachine(id);
    setQ('');
  }

  return (
    <div className="stwin-search shell-search">
      <input
        className="stwin-search__input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search machine…"
        aria-label="Search machine"
      />
      {q && hits.length > 0 && (
        <ul className="stwin-search__list">
          {hits.map((m) => (
            <li key={m.id}>
              <button type="button" className="stwin-search__item" onClick={() => focus(m.id)}>
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CameraMenu() {
  const debugOrbit = useDebugOrbit();
  const [open, setOpen] = useState(false);

  return (
    <div className="shell-menu">
      <button type="button" className="stwin-btn" onClick={() => setOpen((v) => !v)}>
        Camera ▾
      </button>
      {open && (
        <div className="shell-menu__panel">
          <button
            type="button"
            className="shell-menu__item"
            onClick={() => {
              cameraPresetOverview();
              setOpen(false);
            }}
          >
            Entire Factory
          </button>
          {ZONE_PRESETS.map((z) => (
            <button
              key={z}
              type="button"
              className="shell-menu__item"
              onClick={() => {
                cameraPresetZone(z);
                setOpen(false);
              }}
            >
              {ZONE_LABELS[z]}
            </button>
          ))}
          <hr className="shell-menu__hr" />
          <button
            type="button"
            className="shell-menu__item"
            onClick={() => {
              toggleDebugOrbit();
              setOpen(false);
            }}
          >
            Mode: {debugOrbit ? 'Orbit' : 'Fly camera'}
          </button>
        </div>
      )}
    </div>
  );
}

function SimMenu() {
  const twin = useTwinState();
  const [open, setOpen] = useState(false);

  return (
    <div className="shell-menu">
      <button type="button" className="stwin-btn" onClick={() => setOpen((v) => !v)}>
        Sim ▾
      </button>
      {open && (
        <div className="shell-menu__panel">
          <div className="shell-menu__hint">{twin.demoMode ? 'DEMO MODE' : 'LIVE'}</div>
          <button
            type="button"
            className="shell-menu__item"
            onClick={() => {
              if (twin.lineActive) stopLine();
              else startLine();
              setOpen(false);
            }}
          >
            {twin.lineActive ? 'Stop line' : 'Start line'}
          </button>
          <button
            type="button"
            className="shell-menu__item"
            onClick={() => {
              toggleLineActive();
              publishEvent({
                severity: 'info',
                category: 'process',
                message: getTwinState().lineActive ? 'Line toggled on' : 'Line toggled off',
              });
              syncToastsFromEvents();
              setOpen(false);
            }}
          >
            Toggle line
          </button>
        </div>
      )}
    </div>
  );
}

export function CommandBar() {
  return (
    <header className="shell-command-bar">
      <div className="shell-command-bar__brand">SABIL</div>
      <span className="shell-command-bar__sep" aria-hidden>
        |
      </span>
      <button type="button" className="stwin-btn shell-factory-btn">
        Factory ▾
      </button>
      <MachineSearchField />
      <FactoryHealthWidget />
      <KpiStrip />
      <div className="shell-command-bar__spacer" />
      <NotificationBadge />
      <ThemeToggle />
      <CameraMenu />
      <SimMenu />
      <NavHistoryButtons />
      <span className="shell-user" title="User">
        User
      </span>
    </header>
  );
}
