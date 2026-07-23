'use client';

/**
 * TwinHud — SCADA overlay: alarms, selected machine tags, sparkline, line control.
 */

import { useEffect, useRef, type CSSProperties } from 'react';
import { getActiveAlarms, selectMachine, toggleLineActive } from './tags';
import { tickSimulation } from './simulate';
import { useTwinState } from './useTwinState';
import type { MachineId } from './types';
import { MACHINE_ORDER, MACHINE_LABELS } from './types';

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
      <polyline fill="none" stroke="#3ecf8e" strokeWidth="2" points={pts} />
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
      // Demo PLC tags at ~10 Hz — not every paint frame (avoids re-rendering the HUD/3D tree at 60Hz)
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
      {/* Alarm banner */}
      {alarms.length > 0 && (
        <div style={alarmBanner}>
          {alarms.map((a) => (
            <button
              key={a.id}
              type="button"
              style={alarmChip(a.level)}
              onClick={() => selectMachine(a.id as MachineId)}
            >
              {a.level}: {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Top-right SCADA controls */}
      <div style={topRight}>
        <span style={badge}>{twin.demoMode ? 'DEMO MODE' : 'LIVE'}</span>
        <button type="button" style={btn} onClick={() => toggleLineActive()}>
          {twin.lineActive ? 'Stop line' : 'Start line'}
        </button>
        <select
          style={selectStyle}
          value={twin.selectedId ?? ''}
          onChange={(e) => selectMachine((e.target.value || null) as MachineId | null)}
        >
          <option value="">Select machine…</option>
          {MACHINE_ORDER.map((id) => (
            <option key={id} value={id}>
              {MACHINE_LABELS[id]}
            </option>
          ))}
        </select>
      </div>

      {/* Side panel */}
      {selected && (
        <aside style={panel}>
          <div style={panelHeader}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 0.06 }}>ASSET</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{selected.label}</div>
            </div>
            <button type="button" style={closeBtn} onClick={() => selectMachine(null)}>
              ×
            </button>
          </div>

          <div style={statusRow}>
            <span style={pill(selected.running ? '#2e7d32' : '#6a7278')}>
              {selected.running ? 'RUNNING' : 'STOPPED'}
            </span>
            <span
              style={pill(
                selected.alarm === 'ALARM' ? '#c62828' : selected.alarm === 'WARN' ? '#ef6c00' : '#455a64'
              )}
            >
              Alarm: {selected.alarm}
            </span>
          </div>

          <div style={sectionTitle}>Live tags</div>
          <div style={tagGrid}>
            {Object.entries(selected.values).map(([k, v]) => (
              <div key={k} style={tagCell}>
                <div style={tagKey}>{k}</div>
                <div style={tagVal}>{String(v)}</div>
              </div>
            ))}
          </div>

          <div style={sectionTitle}>Maintenance</div>
          <div style={maintRow}>
            <span>Hours run</span>
            <strong>{selected.hoursRun.toFixed(1)} h</strong>
          </div>
          <div style={maintRow}>
            <span>Next service</span>
            <strong>{selected.nextServiceH.toFixed(0)} h</strong>
          </div>

          <div style={sectionTitle}>Trend</div>
          <Sparkline data={selected.trend} />

          <p style={{ fontSize: 11, opacity: 0.55, marginTop: 12, lineHeight: 1.4 }}>
            Click a machine hotspot in the scene, or pick from the list. Line start/stop drives
            demo simulation.
          </p>
        </aside>
      )}
    </>
  );
}

const btn: CSSProperties = {
  background: 'rgba(30, 36, 42, 0.92)',
  color: '#e8e4d4',
  border: '1px solid #6a7278',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: 'system-ui, sans-serif',
  cursor: 'pointer',
};

const topRight: CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  zIndex: 12,
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const badge: CSSProperties = {
  background: '#1e3a4a',
  color: '#7eb8d4',
  border: '1px solid #3a6a80',
  borderRadius: 4,
  padding: '6px 10px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.08,
  fontFamily: 'system-ui, sans-serif',
};

const selectStyle: CSSProperties = {
  ...btn,
  minWidth: 160,
};

const alarmBanner: CSSProperties = {
  position: 'absolute',
  top: 56,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 14,
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  justifyContent: 'center',
  maxWidth: '90vw',
};

function alarmChip(level: string): CSSProperties {
  return {
    background: level === 'ALARM' ? 'rgba(198,40,40,0.92)' : 'rgba(239,108,0,0.92)',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'system-ui, sans-serif',
    cursor: 'pointer',
  };
}

const panel: CSSProperties = {
  position: 'absolute',
  top: 56,
  left: 12,
  width: 300,
  maxHeight: 'calc(100vh - 80px)',
  overflowY: 'auto',
  zIndex: 13,
  background: 'rgba(22, 26, 30, 0.94)',
  color: '#e8e4d4',
  border: '1px solid #4a555c',
  borderRadius: 10,
  padding: 16,
  fontFamily: 'system-ui, sans-serif',
  boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
};

const panelHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 12,
};

const closeBtn: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#a8b0b8',
  fontSize: 22,
  cursor: 'pointer',
  lineHeight: 1,
};

const statusRow: CSSProperties = { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' };

function pill(bg: string): CSSProperties {
  return {
    background: bg,
    color: '#fff',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 700,
  };
}

const sectionTitle: CSSProperties = {
  fontSize: 11,
  letterSpacing: 0.08,
  opacity: 0.65,
  margin: '12px 0 8px',
  textTransform: 'uppercase',
};

const tagGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
};

const tagCell: CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  borderRadius: 6,
  padding: '8px 10px',
};

const tagKey: CSSProperties = { fontSize: 10, opacity: 0.55, marginBottom: 2 };
const tagVal: CSSProperties = { fontSize: 15, fontWeight: 600 };

const maintRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 13,
  padding: '4px 0',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};
