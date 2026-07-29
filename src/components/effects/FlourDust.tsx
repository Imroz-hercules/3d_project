import { Sparkles } from '@react-three/drei';
import { plantCenter } from '../layoutConstants';
import { useCameraNear } from '../../perf/useCameraNear';

type V3 = [number, number, number];

/**
 * Shared LOD-gated dust/vapor emitter. Mounts drei Sparkles only when the
 * camera is within `nearRadius` of the emitter (world space), so overview
 * orbiting pays nothing. Positions are plant coordinates (the parent plant
 * group is offset by -plantCenter in App).
 *
 * Budget guidance (per plan): ≤40 per machine zone, near-only.
 */
export function FlourDust({
  position,
  count = 30,
  scale = [1, 1, 1] as V3,
  color = '#f5f0e0',
  size = 2,
  speed = 1.2,
  active = true,
  nearRadius = 28,
}: {
  position: V3;
  count?: number;
  scale?: V3;
  color?: string;
  size?: number;
  speed?: number;
  active?: boolean;
  nearRadius?: number;
}) {
  const [cx, , cz] = plantCenter();
  const isNear = useCameraNear([position[0] - cx, position[1], position[2] - cz], nearRadius);
  if (!active || !isNear) return null;
  return (
    <group position={position}>
      <Sparkles count={count} scale={scale} size={size} speed={speed} color={color} />
    </group>
  );
}

/** Cool, slow vapor for the dampener / conditioning moisture zone. */
export function MoistureVapor({
  position,
  active = true,
  nearRadius = 24,
}: {
  position: V3;
  active?: boolean;
  nearRadius?: number;
}) {
  return (
    <FlourDust
      position={position}
      count={22}
      scale={[1.4, 1.0, 1.0]}
      color="#dfeef5"
      size={3}
      speed={0.55}
      active={active}
      nearRadius={nearRadius}
    />
  );
}
