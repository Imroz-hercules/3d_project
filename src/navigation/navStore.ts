import type { CameraPose, NavFocus, NavState } from './types';

type Listener = () => void;

const state: NavState = {
  focus: { kind: 'overview' },
  history: [{ kind: 'overview' }],
  historyIndex: 0,
  debugOrbit: false,
  cameraPose: { x: 0, z: 0, dirX: 0, dirZ: 1 },
};

/** Immutable snapshot for useSyncExternalStore (must change reference on updates). */
let snapshot: NavState = { ...state, history: state.history.slice(), cameraPose: { ...state.cameraPose } };

const listeners = new Set<Listener>();
const poseListeners = new Set<Listener>();

function refreshSnapshot() {
  snapshot = {
    focus: state.focus,
    history: state.history.slice(),
    historyIndex: state.historyIndex,
    debugOrbit: state.debugOrbit,
    cameraPose: { ...state.cameraPose },
  };
}

function emit() {
  refreshSnapshot();
  listeners.forEach((l) => l());
}

function emitPose() {
  // Pose updates often — keep nav snapshot in sync for consumers of full state
  snapshot = { ...snapshot, cameraPose: { ...state.cameraPose } };
  poseListeners.forEach((l) => l());
}

export function getNavState(): NavState {
  return snapshot;
}

export function subscribeNav(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function subscribeCameraPose(listener: Listener): () => void {
  poseListeners.add(listener);
  return () => poseListeners.delete(listener);
}

export function getCameraPose(): CameraPose {
  return snapshot.cameraPose;
}

export function setDebugOrbit(on: boolean) {
  state.debugOrbit = on;
  emit();
}

export function toggleDebugOrbit() {
  setDebugOrbit(!state.debugOrbit);
}

export function setCameraPose(pose: CameraPose) {
  const prev = state.cameraPose;
  if (
    Math.abs(prev.x - pose.x) < 0.05 &&
    Math.abs(prev.z - pose.z) < 0.05 &&
    Math.abs(prev.dirX - pose.dirX) < 0.02 &&
    Math.abs(prev.dirZ - pose.dirZ) < 0.02
  ) {
    return;
  }
  state.cameraPose = pose;
  emitPose();
}

/** Push a new focus (truncates forward stack). */
export function navigateTo(focus: NavFocus) {
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(focus);
  state.historyIndex = state.history.length - 1;
  state.focus = focus;
  emit();
}

export function navBack() {
  if (state.historyIndex <= 0) return;
  state.historyIndex -= 1;
  state.focus = state.history[state.historyIndex]!;
  emit();
}

export function navForward() {
  if (state.historyIndex >= state.history.length - 1) return;
  state.historyIndex += 1;
  state.focus = state.history[state.historyIndex]!;
  emit();
}
