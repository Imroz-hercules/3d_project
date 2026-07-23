'use client';

/**
 * Factory building envelope sized from plantBounds() + margin.
 * Walls are slightly translucent for process visibility; toggle via App showBuilding.
 */

import {
  buildingEnvelopeBounds,
  mccPosition,
  truckDockPosition,
} from '../layoutConstants';

type V3 = [number, number, number];

const COLORS = {
  wall: '#9aa2a8',
  wallInner: '#7a8288',
  trim: '#6a7278',
  roof: '#5a6268',
  skylight: '#a8c8e0',
  window: '#7eb8d4',
  column: '#7a848c',
  shutter: '#5a626a',
  dock: '#6a6560',
  office: '#6a737c',
  light: '#e8e4d4',
} as const;

const WALL_OPACITY = 0.42;

function WallPanel({
  width,
  height,
  position,
  rotation = [0, 0, 0],
  opacity = WALL_OPACITY,
  color = COLORS.wall,
}: {
  width: number;
  height: number;
  position: V3;
  rotation?: V3;
  opacity?: number;
  color?: string;
}) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <boxGeometry args={[width, height, 0.18]} />
      <meshStandardMaterial
        color={color}
        metalness={0.25}
        roughness={0.7}
        transparent
        opacity={opacity}
        side={2}
      />
    </mesh>
  );
}

function WindowStrip({
  width,
  height = 1.4,
  position,
  rotation = [0, 0, 0],
}: {
  width: number;
  height?: number;
  position: V3;
  rotation?: V3;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[width, height, 0.08]} />
      <meshStandardMaterial
        color={COLORS.window}
        emissive={COLORS.window}
        emissiveIntensity={0.15}
        transparent
        opacity={0.35}
        metalness={0.1}
        roughness={0.2}
        side={2}
      />
    </mesh>
  );
}

function RollingShutter({
  width,
  height,
  position,
  rotation = [0, 0, 0],
}: {
  width: number;
  height: number;
  position: V3;
  rotation?: V3;
}) {
  const slats = Math.max(6, Math.floor(height / 0.22));
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width + 0.3, height, 0.12]} />
        <meshStandardMaterial color={COLORS.shutter} metalness={0.08} roughness={0.7} />
      </mesh>
      {Array.from({ length: slats }, (_, i) => {
        const y = 0.15 + (i / (slats - 1)) * (height - 0.3);
        return (
          <mesh key={i} position={[0, y, 0.07]}>
            <boxGeometry args={[width, 0.06, 0.02]} />
            <meshStandardMaterial color={COLORS.trim} metalness={0.08} roughness={0.7} />
          </mesh>
        );
      })}
      {/* Drum housing */}
      <mesh position={[0, height + 0.2, 0]} castShadow>
        <boxGeometry args={[width + 0.4, 0.35, 0.35]} />
        <meshStandardMaterial color={COLORS.trim} metalness={0.08} roughness={0.7} />
      </mesh>
    </group>
  );
}

function RoofTruss({ length, position }: { length: number; position: V3 }) {
  const peak = 1.4;
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.12, 0.12, length]} />
        <meshStandardMaterial color={COLORS.column} metalness={0.08} roughness={0.7} />
      </mesh>
      <mesh position={[0, peak / 2, length / 4]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, length / 2 + 0.3]} />
        <meshStandardMaterial color={COLORS.column} metalness={0.08} roughness={0.7} />
      </mesh>
      <mesh position={[0, peak / 2, -length / 4]} rotation={[-0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 0.1, length / 2 + 0.3]} />
        <meshStandardMaterial color={COLORS.column} metalness={0.08} roughness={0.7} />
      </mesh>
    </group>
  );
}

function HighBayLight({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.35, 0.45, 0.25, 12]} />
        <meshStandardMaterial color={COLORS.trim} metalness={0.08} roughness={0.7} />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.06, 12]} />
        <meshStandardMaterial
          color={COLORS.light}
          emissive={COLORS.light}
          emissiveIntensity={0.65}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

function DockBay({ position, width = 3.2, height = 3.6 }: { position: V3; width?: number; height?: number }) {
  return (
    <group position={position}>
      <RollingShutter width={width} height={height} position={[0, 0, 0]} />
      {/* Dock leveler plate */}
      <mesh position={[0, 0.6, -1.2]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.9, 0.15, 2.0]} />
        <meshStandardMaterial color={COLORS.dock} metalness={0.08} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.15, -2.0]} castShadow>
        <boxGeometry args={[width + 0.4, 2.3, 0.4]} />
        <meshStandardMaterial color={COLORS.trim} metalness={0.08} roughness={0.7} />
      </mesh>
    </group>
  );
}

export function BuildingEnvelope({
  cutaway = false,
  showLights = true,
}: {
  /** Hide +Z and +X walls for an open overview cutaway. */
  cutaway?: boolean;
  showLights?: boolean;
}) {
  const env = buildingEnvelopeBounds();
  const { width, depth, height, centerX, centerZ, minX, maxX, minZ, maxZ } = env;
  const wallH = height;
  const eaveY = wallH;
  const [dockX, , dockZ] = truckDockPosition();
  const [mccX, , mccZ] = mccPosition();

  // Column grid spacing
  const colSpacingX = 8;
  const colSpacingZ = 7;
  const colsX = Math.max(2, Math.floor(width / colSpacingX));
  const colsZ = Math.max(2, Math.floor(depth / colSpacingZ));

  const roofY = eaveY + 0.15;
  const lightY = eaveY - 0.8;

  return (
    <group name="building-envelope">
      {/* â€”â€” Perimeter columns â€”â€” */}
      {Array.from({ length: colsX + 1 }, (_, i) => {
        const x = minX + (i / colsX) * width;
        return [minZ + 0.4, maxZ - 0.4].map((z, j) => (
          <mesh key={`cx-${i}-${j}`} position={[x, wallH / 2, z]} castShadow>
            <boxGeometry args={[0.35, wallH, 0.35]} />
            <meshStandardMaterial color={COLORS.column} metalness={0.08} roughness={0.7} />
          </mesh>
        ));
      })}
      {Array.from({ length: colsZ + 1 }, (_, i) => {
        const z = minZ + (i / colsZ) * depth;
        return [minX + 0.4, maxX - 0.4].map((x, j) => (
          <mesh key={`cz-${i}-${j}`} position={[x, wallH / 2, z]} castShadow>
            <boxGeometry args={[0.35, wallH, 0.35]} />
            <meshStandardMaterial color={COLORS.column} metalness={0.08} roughness={0.7} />
          </mesh>
        ));
      })}

      {/* â€”â€” Walls (omit cutaway faces) â€”â€” */}
      {/* âˆ’Z wall */}
      <WallPanel
        width={width}
        height={wallH}
        position={[centerX, wallH / 2, minZ]}
        opacity={cutaway ? 0.2 : WALL_OPACITY}
      />
      <WindowStrip width={width * 0.7} position={[centerX, wallH * 0.55, minZ - 0.05]} />

      {/* +Z wall */}
      {!cutaway && (
        <>
          <WallPanel width={width} height={wallH} position={[centerX, wallH / 2, maxZ]} />
          <WindowStrip width={width * 0.55} position={[centerX, wallH * 0.55, maxZ + 0.05]} />
        </>
      )}

      {/* âˆ’X wall (silo end) â€” personnel door opening via shorter panel split */}
      <WallPanel
        width={depth * 0.35}
        height={wallH}
        position={[minX, wallH / 2, minZ + depth * 0.2]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <WallPanel
        width={depth * 0.35}
        height={wallH}
        position={[minX, wallH / 2, maxZ - depth * 0.2]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <WallPanel
        width={depth * 0.25}
        height={wallH - 3.2}
        position={[minX, 3.2 + (wallH - 3.2) / 2, centerZ]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <RollingShutter
        width={3.0}
        height={3.2}
        position={[minX, 0, centerZ]}
        rotation={[0, Math.PI / 2, 0]}
      />

      {/* +X wall with dock cutout */}
      {!cutaway && (
        <>
          <WallPanel
            width={Math.max(2, dockZ - minZ - 2.2)}
            height={wallH}
            position={[maxX, wallH / 2, (minZ + dockZ - 2) / 2]}
            rotation={[0, Math.PI / 2, 0]}
          />
          <WallPanel
            width={Math.max(2, maxZ - dockZ - 2.2)}
            height={wallH}
            position={[maxX, wallH / 2, (maxZ + dockZ + 2) / 2]}
            rotation={[0, Math.PI / 2, 0]}
          />
          <WallPanel
            width={depth * 0.15}
            height={wallH - 4}
            position={[maxX, 4 + (wallH - 4) / 2, dockZ]}
            rotation={[0, Math.PI / 2, 0]}
          />
        </>
      )}

      {/* Loading dock opening on +X */}
      <DockBay position={[maxX, 0, dockZ]} width={3.4} height={3.8} />

      {/* â€”â€” Roof â€”â€” */}
      <mesh position={[centerX, roofY, centerZ]} receiveShadow>
        <boxGeometry args={[width + 0.8, 0.2, depth + 0.8]} />
        <meshStandardMaterial
          color={COLORS.roof}
          metalness={0.45}
          roughness={0.55}
          transparent
          opacity={cutaway ? 0.25 : 0.55}
          side={2}
        />
      </mesh>

      {/* Skylights */}
      {Array.from({ length: Math.max(2, Math.floor(width / 12)) }, (_, i) => {
        const x = minX + 6 + i * 12;
        if (x > maxX - 4) return null;
        return (
          <mesh key={i} position={[x, roofY + 0.12, centerZ]}>
            <boxGeometry args={[3.5, 0.08, depth * 0.35]} />
            <meshStandardMaterial
              color={COLORS.skylight}
              emissive={COLORS.skylight}
              emissiveIntensity={0.2}
              transparent
              opacity={0.45}
              roughness={0.15}
            />
          </mesh>
        );
      })}

      {/* Roof trusses along X */}
      {Array.from({ length: colsX }, (_, i) => {
        const x = minX + ((i + 0.5) / colsX) * width;
        return <RoofTruss key={i} length={depth - 1.5} position={[x, eaveY - 0.4, centerZ]} />;
      })}

      {/* â€”â€” MCC / office partition stub â€”â€” */}
      <group position={[mccX, 0, mccZ + 2.2]}>
        <WallPanel width={6.5} height={3.2} position={[0, 1.6, 0]} opacity={0.7} color={COLORS.office} />
        <WallPanel
          width={3.5}
          height={3.2}
          position={[3.0, 1.6, -1.5]}
          rotation={[0, Math.PI / 2, 0]}
          opacity={0.7}
          color={COLORS.office}
        />
        <mesh position={[0, 3.3, -0.8]}>
          <boxGeometry args={[6.5, 0.12, 3.2]} />
          <meshStandardMaterial color={COLORS.trim} metalness={0.4} roughness={0.5} />
        </mesh>
      </group>

      {/* â€”â€” High-bay lights along aisles â€”â€” */}
      {showLights &&
        Array.from({ length: Math.max(3, Math.floor(width / 10)) }, (_, i) => {
          const x = minX + 5 + i * 10;
          if (x > maxX - 3) return null;
          return (
            <group key={i}>
              <HighBayLight position={[x, lightY, centerZ - depth * 0.22]} />
              <HighBayLight position={[x, lightY, centerZ + depth * 0.18]} />
            </group>
          );
        })}
    </group>
  );
}

export default BuildingEnvelope;


