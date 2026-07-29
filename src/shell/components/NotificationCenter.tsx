import { acknowledgeNotification, dismissToast, useActiveNotifications, useToasts } from '../services/notifications';
import { toggleNotifyPopover, setNotifyPopoverOpen, usePanelChrome } from '../services/panelState';
import { inspectMachine } from '../services/selection';
import { formatEventTime } from '../services/timeline';
import type { FactoryEvent } from '../services/types';

function severityClass(s: FactoryEvent['severity']) {
  if (s === 'alarm') return 'is-alarm';
  if (s === 'warning') return 'is-warn';
  if (s === 'maintenance') return 'is-maint';
  if (s === 'operator') return 'is-operator';
  return 'is-info';
}

export function NotificationBadge() {
  const items = useActiveNotifications();
  const { notifyPopoverOpen } = usePanelChrome();
  const count = items.length;

  if (count === 0 && !notifyPopoverOpen) return null;

  return (
    <div className="shell-notify-badge-wrap">
      <button
        type="button"
        className="shell-notify-badge"
        aria-label={`${count} active notifications`}
        onClick={() => toggleNotifyPopover()}
      >
        🔔 {count}
      </button>
      {notifyPopoverOpen && (
        <div className="shell-notify-popover">
          <div className="shell-notify-popover__head">
            <strong>Active Alerts</strong>
            <button type="button" className="stwin-close" onClick={() => setNotifyPopoverOpen(false)}>
              ×
            </button>
          </div>
          {items.length === 0 ? (
            <p className="shell-muted">No actionable items</p>
          ) : (
            <ul className="shell-notify-list">
              {items.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className={`shell-notify-item ${severityClass(e.severity)}`}
                    onClick={() => {
                      if (e.machineId) inspectMachine(e.machineId);
                      setNotifyPopoverOpen(false);
                    }}
                  >
                    <span className="shell-notify-item__msg">{e.message}</span>
                    <span className="shell-notify-item__time">{formatEventTime(e.timestamp)}</span>
                  </button>
                  <button
                    type="button"
                    className="shell-notify-ack"
                    onClick={() => acknowledgeNotification(e.id)}
                  >
                    Ack
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function ToastStack() {
  const toasts = useToasts();

  return (
    <div className="shell-toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.eventId} className={`shell-toast shell-toast--${t.severity}`}>
          <div className="shell-toast__body">
            <strong>{t.message}</strong>
            {t.machineId && <div className="shell-muted">{t.machineId}</div>}
          </div>
          <div className="shell-toast__actions">
            {t.machineId && (
              <button
                type="button"
                className="stwin-btn"
                onClick={() => {
                  inspectMachine(t.machineId!);
                  if (!t.sticky) dismissToast(t.eventId);
                }}
              >
                View
              </button>
            )}
            <button
              type="button"
              className="stwin-btn"
              onClick={() => {
                if (t.sticky) acknowledgeNotification(t.eventId);
                else dismissToast(t.eventId);
              }}
            >
              {t.sticky ? 'Ack' : 'Dismiss'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
