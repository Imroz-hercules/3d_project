import { useMemo, useState } from 'react';
import { searchMachines } from './MachineRegistry';
import { navigateTo } from './navStore';
import type { MachineId } from '../twin/types';

export function MachineSearch() {
  const [q, setQ] = useState('');
  const hits = useMemo(() => searchMachines(q).slice(0, 8), [q]);

  function focus(id: MachineId) {
    navigateTo({ kind: 'machine', machineId: id });
    setQ('');
  }

  return (
    <div className="stwin-search">
      <input
        className="stwin-search__input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search machines…"
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
