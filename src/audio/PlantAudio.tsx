import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  elevatorPosition,
  packingMachinePosition,
  rollerMillPosition,
  REF,
} from '../components/layoutConstants';
import { useLineActive } from '../twin/useTwinState';

type V3 = [number, number, number];

/**
 * Spatial audio scaffold — MUTED BY DEFAULT.
 * Enable with ?audio=1 (persists) or localStorage.setItem('twin.audio','1');
 * disable with ?audio=0. No asset files needed: machine hum is synthesized
 * into a seamless loop buffer (low harmonics), played via PositionalAudio
 * so volume falls off with camera distance.
 */
export function useAudioEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const param = new URLSearchParams(window.location.search).get('audio');
  if (param === '1') {
    window.localStorage.setItem('twin.audio', '1');
    return true;
  }
  if (param === '0') {
    window.localStorage.removeItem('twin.audio');
    return false;
  }
  return window.localStorage.getItem('twin.audio') === '1';
}

/** Seamless 2s hum loop: integer-cycle harmonics so the loop point is silent-free. */
function createHumBuffer(ctx: AudioContext, baseHz: number): AudioBuffer {
  const seconds = 2;
  const rate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, rate * seconds, rate);
  const data = buffer.getChannelData(0);
  // Snap frequencies to whole cycles over the loop so it repeats cleanly.
  const f1 = Math.round(baseHz * seconds) / seconds;
  const f2 = f1 * 2;
  const f3 = Math.round(f1 * 3.5 * seconds) / seconds; // slight inharmonic growl
  for (let i = 0; i < data.length; i++) {
    const t = i / rate;
    data[i] =
      0.5 * Math.sin(2 * Math.PI * f1 * t) +
      0.28 * Math.sin(2 * Math.PI * f2 * t) +
      0.12 * Math.sin(2 * Math.PI * f3 * t) +
      0.08 * Math.sin(2 * Math.PI * (f1 * 0.5) * t);
  }
  return buffer;
}

function MachineHum({
  listener,
  position,
  baseHz,
  volume,
  playing,
}: {
  listener: THREE.AudioListener;
  position: V3;
  baseHz: number;
  volume: number;
  playing: boolean;
}) {
  const soundRef = useRef<THREE.PositionalAudio>(null!);

  const buffer = useMemo(() => {
    const ctx = listener.context as AudioContext;
    return createHumBuffer(ctx, baseHz);
  }, [listener, baseHz]);

  useEffect(() => {
    const sound = soundRef.current;
    if (!sound) return;
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setRefDistance(4);
    sound.setMaxDistance(30);
    sound.setRolloffFactor(1.6);
    sound.setVolume(volume);
    return () => {
      if (sound.isPlaying) sound.stop();
    };
  }, [buffer, volume]);

  useEffect(() => {
    const sound = soundRef.current;
    if (!sound || !sound.buffer) return;
    if (playing && !sound.isPlaying) sound.play();
    if (!playing && sound.isPlaying) sound.stop();
  }, [playing]);

  return (
    <group position={position}>
      <positionalAudio ref={soundRef} args={[listener]} />
    </group>
  );
}

/** Mount inside the plant group. Renders nothing unless audio flag is on. */
export function PlantAudio() {
  const enabled = useAudioEnabled();
  const lineActive = useLineActive();
  const camera = useThree((s) => s.camera);

  const listener = useMemo(() => (enabled ? new THREE.AudioListener() : null), [enabled]);

  useEffect(() => {
    if (!listener) return;
    camera.add(listener);
    // Browsers gate audio behind a user gesture: resume on first interaction.
    const resume = () => {
      const ctx = listener.context as AudioContext;
      if (ctx.state === 'suspended') void ctx.resume();
    };
    window.addEventListener('pointerdown', resume);
    return () => {
      window.removeEventListener('pointerdown', resume);
      camera.remove(listener);
    };
  }, [listener, camera]);

  if (!enabled || !listener) return null;

  const [rmx, rmy, rmz] = rollerMillPosition();
  const [pkx, , pkz] = packingMachinePosition();
  const [elx, , elz] = elevatorPosition();

  return (
    <group>
      {/* Roller mill: dominant low grind */}
      <MachineHum
        listener={listener}
        position={[rmx, rmy, rmz]}
        baseHz={72}
        volume={0.5}
        playing={lineActive}
      />
      {/* Bucket elevator: lighter belt whirr */}
      <MachineHum
        listener={listener}
        position={[elx, REF.elevator.height * 0.6, elz]}
        baseHz={110}
        volume={0.32}
        playing={lineActive}
      />
      {/* Packing cell: mid pulse */}
      <MachineHum
        listener={listener}
        position={[pkx, 1.4, pkz]}
        baseHz={92}
        volume={0.35}
        playing={lineActive}
      />
    </group>
  );
}
