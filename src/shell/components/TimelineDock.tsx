import { formatEventTime, useTimelineEvents } from '../services/timeline';
import { inspectMachine } from '../services/selection';
import type { FactoryEvent } from '../services/types';

function severityMeta(s: FactoryEvent['severity']): { label: string; cls: string } {
  switch (s) {
    case 'alarm':
      return { label: 'Alarm', cls: 'is-alarm' };
    case 'warning':
      return { label: 'Warning', cls: 'is-warn' };
    case 'maintenance':
      return { label: 'Maint', cls: 'is-maint' };
    case 'operator':
      return { label: 'Operator', cls: 'is-operator' };
    default:
      return { label: 'Process', cls: 'is-process' };
  }
}

export function TimelineDock() {
  const events = useTimelineEvents().slice(0, 8);

  return (
    <footer className="shell-timeline-dock">
      <div className="shell-section-label">Timeline</div>
      <div className="shell-timeline-row">
        {events.length === 0 && <span className="shell-muted">No events yet</span>}
        {events.map((e) => {
          const meta = severityMeta(e.severity);
          return (
            <button
              key={e.id}
              type="button"
              className={`shell-timeline-item ${meta.cls}`}
              onClick={() => e.machineId && inspectMachine(e.machineId)}
            >
              <span className="shell-timeline-item__sev">{meta.label}</span>
              <span className="shell-timeline-item__msg">{e.message}</span>
              <span className="shell-timeline-item__time">{formatEventTime(e.timestamp)}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}
