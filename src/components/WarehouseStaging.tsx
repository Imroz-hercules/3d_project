'use client';

/**
 * Warehouse staging & logistics past the palletizer:
 * stretch-wrapper stub, pallet racking, truck dock, looped forklift demo.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import {
  REF,
  stretchWrapperPosition,
  truckDockPosition,
  warehouseStagingPosition,
} from './layoutConstants';

type V3 = [number, number, number];

const COLORS = {
  steel: '#4a555c',
  steelLight: '#6a7278',
  wood: '#8b6914',
  woodDark: '#5c4010',
  wrap: '#e8eef2',
  yellow: '#e0a92c',
  forklift: '#c9a227',
  forkliftDark: '#5a6268',
  floor: '#5a5a52',
  dock: '#3a4046',
  truck: '#2a5080',
} as const;

function StagedPallet({ position, wrapped = true }: { position: V3; wrapped?: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.15, 1.0]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.15, 1.1, 0.95]} />
        <meshStandardMaterial color="#d4c4a0" roughness={0.85} />
      </mesh>
      {wrapped && (
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[1.22, 1.2, 1.02]} />
          <meshStandardMaterial
            color={COLORS.wrap}
            transparent
            opacity={0.35}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      )}
    </group>
  );
}

function PalletRack({
  position,
  bayCount,
  levels = 2,
}: {
  position: V3;
  bayCount: number;
  levels?: number;
}) {
  const { baySpacingX, rackHeight } = REF.warehouse;
  const length = bayCount * baySpacingX;
  return (
    <group position={position}>
      {/* Uprights */}
      {Array.from({ length: bayCount + 1 }, (_, i) => {
        const x = -length / 2 + i * baySpacingX;
        return (
          <group key={i}>
            <mesh position={[x, rackHeight / 2, 0.55]} castShadow>
              <boxGeometry args={[0.1, rackHeight, 0.1]} />
              <meshStandardMaterial color={COLORS.steel} metalness={0.7} roughness={0.4} />
            </mesh>
            <mesh position={[x, rackHeight / 2, -0.55]} castShadow>
              <boxGeometry args={[0.1, rackHeight, 0.1]} />
              <meshStandardMaterial color={COLORS.steel} metalness={0.7} roughness={0.4} />
            </mesh>
          </group>
        );
      })}
      {/* Beams + staged pallets */}
      {Array.from({ length: levels }, (_, lvl) => {
        const y = 0.35 + lvl * (rackHeight / levels) * 0.85;
        return (
          <group key={lvl}>
            <mesh position={[0, y, 0.55]} castShadow>
              <boxGeometry args={[length, 0.08, 0.08]} />
              <meshStandardMaterial color={COLORS.yellow} metalness={0.5} roughness={0.45} />
            </mesh>
            <mesh position={[0, y, -0.55]} castShadow>
              <boxGeometry args={[length, 0.08, 0.08]} />
              <meshStandardMaterial color={COLORS.yellow} metalness={0.5} roughness={0.45} />
            </mesh>
            {Array.from({ length: bayCount }, (_, b) => {
              const x = -length / 2 + baySpacingX / 2 + b * baySpacingX;
              // Leave some bays empty for visual variety
              if ((lvl + b) % 3 === 0) return null;
              return <StagedPallet key={b} position={[x, y + 0.08, 0]} />;
            })}
          </group>
        );
      })}
    </group>
  );
}

function StretchWrapperStub({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 2.2, 1.6]} />
        <meshStandardMaterial color={COLORS.steelLight} metalness={0.55} roughness={0.45} />
      </mesh>
      {/* Turntable */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.75, 0.12, 20]} />
        <meshStandardMaterial color={COLORS.steel} metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Film roll mast */}
      <mesh position={[0.7, 1.4, 0]} castShadow>
        <boxGeometry args={[0.12, 2.4, 0.12]} />
        <meshStandardMaterial color={COLORS.steel} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0.7, 1.6, 0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.5, 12]} />
        <meshStandardMaterial color={COLORS.wrap} roughness={0.4} />
      </mesh>
      <Text position={[0, 2.4, 0.85]} fontSize={0.1} color={COLORS.yellow} anchorX="center">
        STRETCH WRAP
      </Text>
    </group>
  );
}

function TruckDock({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {/* Dock pad */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[4.5, 0.1, 3.5]} />
        <meshStandardMaterial color={COLORS.dock} metalness={0.4} roughness={0.6} />
      </mesh>
      {/* Leveler plate */}
      <mesh position={[-1.8, 0.55, 0]} castShadow>
        <boxGeometry args={[0.8, 1.0, 2.4]} />
        <meshStandardMaterial color={COLORS.steel} metalness={0.65} roughness={0.4} />
      </mesh>
      {/* Simple truck silhouette at dock */}
      <group position={[1.2, 0, 0]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[3.2, 1.8, 2.2]} />
          <meshStandardMaterial color={COLORS.truck} metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[-1.9, 0.85, 0]} castShadow>
          <boxGeometry args={[0.9, 1.3, 2.0]} />
          <meshStandardMaterial color="#1a3050" metalness={0.35} roughness={0.55} />
        </mesh>
        {[[-1.2, 0.35, 1.0], [-1.2, 0.35, -1.0], [1.0, 0.35, 1.0], [1.0, 0.35, -1.0]].map(
          (pos, i) => (
            <mesh key={i} position={pos as V3} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.35, 0.35, 0.25, 14]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
          )
        )}
      </group>
      <Text position={[0, 0.12, 1.9]} fontSize={0.12} color={COLORS.yellow} anchorX="center">
        TRUCK DOCK
      </Text>
    </group>
  );
}

/** Looped forklift: warehouse → palletizer bay → dock → return. */
function AnimatedForklift({ active = true }: { active?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const forkY = useRef(0.35);
  const [wx, , wz] = warehouseStagingPosition();
  const [dx, , dz] = truckDockPosition();
  // Approximate forklift bay world X (palletizer outlet zone)
  const bayX = wx - 3.5;
  const bayZ = wz + 0.9;

  // Waypoints in world space — converted to local (relative to warehouse origin group)
  // This component is placed in world via parent at warehouse position, so use world coords
  // and put forklift in a world-space group instead.

  useFrame(({ clock }) => {
    if (!groupRef.current || !active) return;
    const t = (clock.elapsedTime * 0.08) % 1; // full loop ~12.5s

    // Path phases: 0-0.25 bay, 0.25-0.35 lift, 0.35-0.6 dock, 0.6-0.7 lower, 0.7-1 return
    let x = wx;
    let z = wz;
    let yaw = 0;
    let fy = 0.35;

    if (t < 0.25) {
      const u = t / 0.25;
      x = THREE.MathUtils.lerp(wx, bayX, u);
      z = THREE.MathUtils.lerp(wz, bayZ, u);
      yaw = Math.atan2(bayX - wx, bayZ - wz);
      fy = 0.35;
    } else if (t < 0.35) {
      const u = (t - 0.25) / 0.1;
      x = bayX;
      z = bayZ;
      yaw = Math.PI;
      fy = THREE.MathUtils.lerp(0.35, 0.9, u);
    } else if (t < 0.6) {
      const u = (t - 0.35) / 0.25;
      x = THREE.MathUtils.lerp(bayX, dx - 1.5, u);
      z = THREE.MathUtils.lerp(bayZ, dz, u);
      yaw = Math.atan2(dx - bayX, dz - bayZ);
      fy = 0.9;
    } else if (t < 0.7) {
      const u = (t - 0.6) / 0.1;
      x = dx - 1.5;
      z = dz;
      yaw = 0;
      fy = THREE.MathUtils.lerp(0.9, 0.35, u);
    } else {
      const u = (t - 0.7) / 0.3;
      x = THREE.MathUtils.lerp(dx - 1.5, wx, u);
      z = THREE.MathUtils.lerp(dz, wz, u);
      yaw = Math.atan2(wx - (dx - 1.5), wz - dz);
      fy = 0.35;
    }

    forkY.current = fy;
    groupRef.current.position.set(x, 0, z);
    groupRef.current.rotation.y = yaw;
    const forks = groupRef.current.getObjectByName('forks');
    if (forks) forks.position.y = fy;
    const load = groupRef.current.getObjectByName('load');
    if (load) load.visible = fy > 0.55;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.4, 1.0, 0.9]} />
        <meshStandardMaterial color={COLORS.forklift} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0.55, 0.85, 0]} castShadow>
        <boxGeometry args={[0.5, 0.55, 0.85]} />
        <meshStandardMaterial color="#2a3038" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[-0.55, 1.2, 0]} castShadow>
        <boxGeometry args={[0.12, 2.0, 0.55]} />
        <meshStandardMaterial color={COLORS.forkliftDark} metalness={0.7} roughness={0.35} />
      </mesh>
      <group name="forks" position={[0, 0.35, 0]}>
        <mesh position={[-1.15, 0, 0.22]} castShadow>
          <boxGeometry args={[1.0, 0.06, 0.12]} />
          <meshStandardMaterial color="#a8b0b8" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[-1.15, 0, -0.22]} castShadow>
          <boxGeometry args={[1.0, 0.06, 0.12]} />
          <meshStandardMaterial color="#a8b0b8" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh name="load" position={[-1.3, 0.55, 0]} castShadow visible={false}>
          <boxGeometry args={[1.15, 1.0, 0.9]} />
          <meshStandardMaterial color="#d4c4a0" roughness={0.85} />
        </mesh>
      </group>
      {[[0.4, 0.22, 0.5], [0.4, 0.22, -0.5], [-0.35, 0.22, 0.5], [-0.35, 0.22, -0.5]].map(
        (pos, i) => (
          <mesh key={i} position={pos as V3} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.16, 16]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
          </mesh>
        )
      )}
    </group>
  );
}

function FloorLanes({ length }: { length: number }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length / 2 - 1, 0.012, 0]} receiveShadow>
        <planeGeometry args={[length, 3.2]} />
        <meshStandardMaterial color={COLORS.floor} roughness={0.95} />
      </mesh>
      {/* Pedestrian stripe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length / 2 - 1, 0.015, 1.7]}>
        <planeGeometry args={[length, 0.15]} />
        <meshStandardMaterial color={COLORS.yellow} roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length / 2 - 1, 0.015, -1.7]}>
        <planeGeometry args={[length, 0.15]} />
        <meshStandardMaterial color={COLORS.yellow} roughness={0.8} />
      </mesh>
    </group>
  );
}

export function WarehouseStaging({ active = true }: { active?: boolean }) {
  const [wx, , wz] = warehouseStagingPosition();
  const { bayCount, aisleSpacingZ, baySpacingX } = REF.warehouse;
  const rackLen = bayCount * baySpacingX;
  const dock = truckDockPosition();
  const wrap = stretchWrapperPosition();

  return (
    <group>
      <StretchWrapperStub position={wrap} />

      <group position={[wx, 0, wz]}>
        <FloorLanes length={rackLen + 8} />
        <PalletRack position={[rackLen / 2, 0, aisleSpacingZ / 2]} bayCount={bayCount} />
        <PalletRack position={[rackLen / 2, 0, -aisleSpacingZ / 2]} bayCount={bayCount} />
        {/* Ground staging positions */}
        {[0, 1, 2].map((i) => (
          <StagedPallet
            key={i}
            position={[1.5 + i * 2.0, 0, 0]}
            wrapped={i !== 1}
          />
        ))}
        <Text position={[rackLen / 2, 0.05, aisleSpacingZ + 1.2]} fontSize={0.14} color={COLORS.yellow} anchorX="center">
          WAREHOUSE STAGING
        </Text>
      </group>

      <TruckDock position={dock} />
      <AnimatedForklift active={active} />
    </group>
  );
}

export default WarehouseStaging;
