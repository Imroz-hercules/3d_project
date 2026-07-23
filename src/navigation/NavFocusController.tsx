import { useEffect, useRef } from 'react';
import { useNavState } from './useNavState';
import { frameZone, frameMachine } from './framing';
import { overviewBoundsFromPlant, zoneBoundsFromRegistry } from './zoneRegistry';
import { getMachine } from './MachineRegistry';
import { flyToView } from './CameraRig';
import { selectMachine } from '../twin/tags';

/**
 * Re-fly whenever nav focus changes (including Back/Forward).
 * Zone/machine UI should call navigateTo once; this controller only flies.
 */
export function NavFocusController() {
  const { focus, historyIndex } = useNavState();
  const mounted = useRef(false);

  useEffect(() => {
    const smooth = mounted.current;
    mounted.current = true;

    if (focus.kind === 'overview') {
      selectMachine(null);
      void flyToView(frameZone(overviewBoundsFromPlant()), smooth);
      return;
    }
    if (focus.kind === 'zone') {
      selectMachine(null);
      const z = zoneBoundsFromRegistry().find((b) => b.id === focus.zone);
      if (z) void flyToView(frameZone(z), smooth);
      return;
    }
    const m = getMachine(focus.machineId);
    if (m) {
      selectMachine(focus.machineId);
      void flyToView(frameMachine(m), smooth);
    }
  }, [focus, historyIndex]);

  return null;
}
