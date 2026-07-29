import { useEffect, useRef } from 'react';
import { useDebugOrbit, useNavFocus, useNavState } from './useNavState';
import { frameOverview, frameZone, frameMachine } from './framing';
import { overviewBoundsFromPlant, zoneBoundsFromRegistry } from './zoneRegistry';
import { getMachine } from './MachineRegistry';
import { flyToView } from './CameraRig';
import { selectMachine } from '../twin/tags';

/**
 * Re-fly the factory 3D camera whenever nav focus changes (including Back/Forward).
 * Zone/machine UI should call navigateTo once; this controller only flies.
 */
export function NavFocusController() {
  const focus = useNavFocus();
  const { historyIndex } = useNavState();
  const debugOrbit = useDebugOrbit();
  const mounted = useRef(false);

  useEffect(() => {
    // Orbit mode disables CameraControls — skip until Fly camera is active
    if (debugOrbit) return;

    const smooth = mounted.current;
    mounted.current = true;

    if (focus.kind === 'overview') {
      selectMachine(null);
      void flyToView(frameOverview(overviewBoundsFromPlant()), smooth);
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
  }, [focus, historyIndex, debugOrbit]);

  return null;
}
