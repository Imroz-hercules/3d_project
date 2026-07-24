'use client';

/**
 * TwinHud — SCADA overlay: alarms, selected machine tags, sparkline, line control.
 */

import { useEffect, useRef } from 'react';
import { getActiveAlarms, selectMachine, toggleLineActive } from './tags';
import { tickSimulation } from './simulate';
import { useTwinState } from './useTwinState';
import type { MachineId } from './types';
import { MACHINE_ORDER, MACHINE_LABELS } from './types';
import { navigateTo } from '../navigation/navStore';
import { STATUS } from '../theme';

function Sparkline({ data, width = 180, height = 36 }: { data: number[]; width?: number; height?: number }) {
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
    <svg width={width} height={height} style={{ display: 'block', marginTop: 8 }}>
      <polyline fill="none" stroke="var(--hud-accent)" strokeWidth="2" points={pts} />
    </svg>
  );
}

export function TwinHud() {
  const twin = useTwinState();
  const selected = twin.selectedId ? twin.machines[twin.selectedId] : null;
  const alarms = getActiveAlarms();
  const last = useRef(performance.now());

  useEffect(() => {
    let raf = 0;
    let acc = 0;
    const loop = (t: number) => {
      const dt = Math.min(0.1, (t - last.current) / 1000);
      last.current = t;
      acc += dt;
      if (acc >= 0.1) {
        tickSimulation(acc);
        acc = 0;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {alarms.length > 0 && (
        <div className="stwin-alarm-banner">
          {alarms.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`stwin-alarm-chip ${a.level === 'ALARM' ? 'is-alarm' : 'is-warn'}`}
              onClick={() => navigateTo({ kind: 'machine', machineId: a.id as MachineId })}
            >
              {a.level}: {a.label}
            </button>
          ))}
        </div>
      )}

      <div className="stwin-hud-top-right">
        <span className="stwin-badge">{twin.demoMode ? 'DEMO MODE' : 'LIVE'}</span>
        <button type="button" className="stwin-btn" onClick={() => toggleLineActive()}>
          {twin.lineActive ? 'Stop line' : 'Start line'}
        </button>
        <select
          className="stwin-select"
          value={twin.selectedId ?? ''}
          onChange={(e) => {
            const id = (e.target.value || null) as MachineId | null;
            if (id) navigateTo({ kind: 'machine', machineId: id });
            else {
              selectMachine(null);
              navigateTo({ kind: 'overview' });
            }
          }}
        >
          <option value="">Select machine…</option>
          {MACHINE_ORDER.map((id) => (
            <option key={id} value={id}>
              {MACHINE_LABELS[id]}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <aside className="stwin-panel stwin-asset-panel">
          <div className="stwin-asset-panel__header">
            <div>
              <div className="stwin-asset-panel__eyebrow">ASSET</div>
              <div className="stwin-asset-panel__title">{selected.label}</div>
            </div>
            <button type="button" className="stwin-close" onClick={() => selectMachine(null)}>
              ×
            </button>
          </div>

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

          <div className="stwin-section-title">Live tags</div>
          <div className="stwin-tag-grid">
            {Object.entries(selected.values).map(([k, v]) => (
              <div key={k} className="stwin-tag-cell">
                <div className="stwin-tag-key">{k}</div>
                <div className="stwin-tag-val">{String(v)}</div>
              </div>
            ))}
          </div>

          <div className="stwin-section-title">Maintenance</div>
          <div className="stwin-maint-row">
            <span>Hours run</span>
            <strong>{selected.hoursRun.toFixed(1)} h</strong>
          </div>
          <div className="stwin-maint-row">
            <span>Next service</span>
            <strong>{selected.nextServiceH.toFixed(0)} h</strong>
          </div>

          <div className="stwin-section-title">Trend</div>
          <Sparkline data={selected.trend} />

          <p className="stwin-hint">
            Click a machine hotspot in the scene, or pick from the list. Line start/stop drives
            demo simulation.
          </p>
        </aside>
      )}
    </>
  );
}
