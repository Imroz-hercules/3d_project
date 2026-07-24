import { useNavState } from './useNavState';
import { ZONE_LABELS } from './zoneRegistry';
import { getMachine } from './MachineRegistry';
import { navigateTo } from './navStore';
import { selectMachine } from '../twin/tags';

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
    <div className="stwin-glass stwin-breadcrumb">
      {crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`}>
          {i > 0 && <span className="stwin-breadcrumb__sep"> › </span>}
          {c.onClick ? (
            <button type="button" className="stwin-breadcrumb__link" onClick={c.onClick}>
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
