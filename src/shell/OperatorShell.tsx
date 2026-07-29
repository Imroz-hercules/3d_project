/**
 * OperatorShell — C+ adaptive hybrid chrome around the 3D twin.
 * Components render; services coordinate.
 */

import { useEffect, useRef } from 'react';
import { tickSimulation } from '../twin/simulate';
import { getActiveAlarms, getTwinState, subscribeTwin } from '../twin/tags';
import { Minimap } from '../navigation/Minimap';
import { CommandBar } from './components/CommandBar';
import { LeftTools } from './components/LeftTools';
import { RightInspector } from './components/RightInspector';
import { TimelineDock } from './components/TimelineDock';
import { ToastStack } from './components/NotificationCenter';
import { seedDemoEvents } from './services/events';
import { publishAlarmEvent, syncToastsFromEvents, dismissToast, useToasts } from './services/notifications';
import { setRightOpen } from './services/panelState';

function SimulationHost() {
  const last = useRef(performance.now());
  const seenAlarms = useRef(new Set<string>());
  const lastSelectedId = useRef(getTwinState().selectedId);

  useEffect(() => {
    seedDemoEvents();
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

  // Bridge twin alarms → FactoryEvent / toasts (once per alarm key)
  useEffect(() => {
    return subscribeTwin(() => {
      for (const a of getActiveAlarms()) {
        const key = `${a.id}:${a.level}`;
        if (seenAlarms.current.has(key)) continue;
        seenAlarms.current.add(key);
        if (a.level === 'WARN' || a.level === 'ALARM') {
          publishAlarmEvent(a.id, a.level, a.label);
        }
      }
      // Clear seen keys when alarm clears
      const active = new Set(getActiveAlarms().map((a) => `${a.id}:${a.level}`));
      for (const k of [...seenAlarms.current]) {
        if (!active.has(k)) seenAlarms.current.delete(k);
      }
    });
  }, []);

  // Auto-dismiss non-sticky toasts
  const toasts = useToasts();
  useEffect(() => {
    const timers = toasts
      .filter((t) => !t.sticky)
      .map((t) =>
        window.setTimeout(() => dismissToast(t.eventId), 6000),
      );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  // Open/close right panel with twin selection
  useEffect(() => {
    return subscribeTwin(() => {
      const { selectedId } = getTwinState();
      if (selectedId !== lastSelectedId.current) {
        setRightOpen(!!selectedId);
        lastSelectedId.current = selectedId;
      }
    });
  }, []);

  useEffect(() => {
    syncToastsFromEvents();
  }, []);

  return null;
}

export function OperatorShell() {
  return (
    <div className="shell-root">
      <SimulationHost />
      <CommandBar />
      <div className="shell-stage">
        <LeftTools />
        <RightInspector />
        <ToastStack />
        <div className="shell-minimap-slot">
          <Minimap />
        </div>
      </div>
      <TimelineDock />
    </div>
  );
}
