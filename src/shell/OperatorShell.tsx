/**
 * OperatorShell — C+ adaptive hybrid chrome around the 3D twin.
 * Components render; services coordinate.
 */

import { useEffect, useRef } from 'react';
import { tickSimulation } from '../twin/simulate';
import { startLiveBridge } from '../twin/liveBridge';
import { getTwinState, subscribeTwin } from '../twin/tags';
import { Minimap } from '../navigation/Minimap';
import { CommandBar } from './components/CommandBar';
import { LeftTools } from './components/LeftTools';
import { RightInspector } from './components/RightInspector';
import { TimelineDock } from './components/TimelineDock';
import { seedDemoEvents } from './services/events';
import { setRightOpen } from './services/panelState';

function SimulationHost() {
  const last = useRef(performance.now());
  const lastSelectedId = useRef(getTwinState().selectedId);

  useEffect(() => {
    seedDemoEvents();
    // Connects to a live PLC WebSocket when configured (?ws=…); otherwise
    // the demo simulator below keeps driving the tags.
    startLiveBridge();
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

  // Open right panel only when selection actually changes (not every twin tick)
  useEffect(() => {
    return subscribeTwin(() => {
      const { selectedId } = getTwinState();
      if (selectedId !== lastSelectedId.current) {
        setRightOpen(!!selectedId);
        lastSelectedId.current = selectedId;
      }
    });
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
        <div className="shell-minimap-slot">
          <Minimap />
        </div>
      </div>
      <TimelineDock />
    </div>
  );
}
