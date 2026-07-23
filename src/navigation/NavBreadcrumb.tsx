import type { CSSProperties } from 'react';
import { useNavState } from './useNavState';
import { ZONE_LABELS } from './zoneRegistry';
import { getMachine } from './MachineRegistry';
import { navigateTo } from './navStore';
import { selectMachine } from '../twin/tags';

const wrap: CSSProperties = {
  position: 'absolute',
  top: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 12px',
  background: 'rgba(30, 36, 42, 0.88)',
  border: '1px solid #6a7278',
  borderRadius: 6,
  color: '#e8e4d4',
  fontSize: 13,
  fontFamily: 'system-ui, sans-serif',
  maxWidth: '70vw',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const link: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#7ec8e3',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'inherit',
  padding: 0,
  textDecoration: 'underline',
};

export function NavBreadcrumb() {
  const { focus } = useNavState();

  const crumbs: { label: string; onClick?: () => void }[] = [
    {
      label: 'Factory',
      onClick: () => {
        selectMachine(null);
        navigateTo({ kind: 'overview' });
      },
    },
  ];

  if (focus.kind === 'zone' || focus.kind === 'machine') {
    const zone = focus.kind === 'zone' ? focus.zone : getMachine(focus.machineId)?.zone;
    if (zone) {
      crumbs.push({
        label: ZONE_LABELS[zone],
        onClick: () => {
          selectMachine(null);
          navigateTo({ kind: 'zone', zone });
        },
      });
    }
  }

  if (focus.kind === 'machine') {
    crumbs.push({ label: getMachine(focus.machineId)?.name ?? focus.machineId });
  }

  return (
    <div style={wrap}>
      {crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`}>
          {i > 0 && <span style={{ opacity: 0.5 }}> › </span>}
          {c.onClick ? (
            <button type="button" style={link} onClick={c.onClick}>
              {c.label}
            </button>
          ) : (
            <strong>{c.label}</strong>
          )}
        </span>
      ))}
    </div>
  );
}
