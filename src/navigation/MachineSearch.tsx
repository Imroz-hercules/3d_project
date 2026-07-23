import { useMemo, useState, type CSSProperties } from 'react';
import { searchMachines } from './MachineRegistry';
import { navigateTo } from './navStore';
import type { MachineId } from '../twin/types';

const wrap: CSSProperties = { position: 'relative', minWidth: 200 };
const input: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #6a7278',
  background: 'rgba(30, 36, 42, 0.92)',
  color: '#e8e4d4',
  fontSize: 13,
  fontFamily: 'system-ui, sans-serif',
};
const list: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  margin: 0,
  padding: 4,
  listStyle: 'none',
  background: 'rgba(20, 24, 28, 0.96)',
  border: '1px solid #6a7278',
  borderRadius: 6,
  zIndex: 20,
};
const itemBtn: CSSProperties = {
  width: '100%',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  color: '#e8e4d4',
  padding: '6px 8px',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'system-ui, sans-serif',
};

export function MachineSearch() {
  const [q, setQ] = useState('');
  const hits = useMemo(() => searchMachines(q).slice(0, 8), [q]);

  function focus(id: MachineId) {
    navigateTo({ kind: 'machine', machineId: id });
    setQ('');
  }

  return (
    <div style={wrap}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search machines…"
        style={input}
      />
      {q && hits.length > 0 && (
        <ul style={list}>
          {hits.map((m) => (
            <li key={m.id}>
              <button type="button" style={itemBtn} onClick={() => focus(m.id)}>
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
