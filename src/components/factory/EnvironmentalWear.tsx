import { useMemo } from 'react';
import * as THREE from 'three';
import {
  REF,
  elevatorPosition,
  packingMachinePosition,
  palletizerPosition,
  rollerMillPosition,
  truckDockPosition,
  warehouseStagingPosition,
  flourBinPosition,
} from '../layoutConstants';

type V3 = [number, number, number];

/**
 * Subtle lived-in wear: oil stains under drives, forklift tire marks, and
 * darker concrete patches on the logistics path. All flat transparent planes,
 * opacity ≤ 0.35, no procedural shaders.
 */

function useWearMaterials() {
  return useMemo(
    () => ({
      oil: new THREE.MeshStandardMaterial({
        color: '#14100c',
        roughness: 0.35,
        metalness: 0.05,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
      tire: new THREE.MeshStandardMaterial({
        color: '#1a1a18',
        roughness: 0.9,
        metalness: 0,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
      wear: new THREE.MeshStandardMaterial({
        color: '#6e6a60',
        roughness: 0.95,
        metalness: 0,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    }),
    []
  );
}

function StainPlane({
  position,
  size,
  material,
  segments = 10,
  irregular = true,
}: {
  position: V3;
  size: [number, number];
  material: THREE.Material;
  segments?: number;
  irregular?: boolean;
}) {
  // Circle geometry with mild per-vertex radius noise reads as a spill, not a disk.
  const geometry = useMemo(() => {
    if (!irregular) return new THREE.PlaneGeometry(size[0], size[1]);
    const g = new THREE.CircleGeometry(0.5, segments);
    const pos = g.attributes.position;
    for (let i = 1; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const noise = 0.75 + Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.5;
      pos.setXY(i, x * noise, y * noise);
    }
    g.computeVertexNormals();
    return g;
  }, [irregular, segments, size]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={position}
      scale={irregular ? [size[0], size[1], 1] : undefined}
      dispose={null}
    />
  );
}

export function EnvironmentalWear() {
  const mats = useWearMaterials();

  const [rmx, , rmz] = rollerMillPosition();
  const [pkx, , pkz] = packingMachinePosition();
  const [plx, , plz] = palletizerPosition();
  const [elx, , elz] = elevatorPosition();
  const [whx, , whz] = warehouseStagingPosition();
  const [dockX] = truckDockPosition();
  const [binCX] = flourBinPosition('C');
  const millDeckY = REF.zones.milling.millDeckY;
  const laneZ = (REF.zones.milling.z + REF.zones.packing.z) / 2;

  return (
    <group>
      {/* —— Oil stains under drive ends —— */}
      {/* Roller mill drive (on the mezzanine deck) */}
      <StainPlane
        position={[rmx + REF.rollerMill.width * 0.35, millDeckY + 0.015, rmz + 0.4]}
        size={[0.7, 0.5]}
        material={mats.oil}
      />
      {/* Elevator boot gearbox */}
      <StainPlane position={[elx + 0.7, 0.015, elz - 0.5]} size={[0.55, 0.45]} material={mats.oil} />
      {/* Packing machine drive side */}
      <StainPlane position={[pkx + 1.0, 0.015, pkz - 0.6]} size={[0.6, 0.5]} material={mats.oil} />
      {/* Palletizer robot base */}
      <StainPlane position={[plx - 0.6, 0.015, plz + 0.5]} size={[0.5, 0.45]} material={mats.oil} />

      {/* —— Forklift tire marks along the logistics lane —— */}
      <StainPlane
        position={[(whx + dockX) / 2 - 2, 0.014, whz + 0.55]}
        size={[Math.max(6, dockX - whx), 0.28]}
        material={mats.tire}
        irregular={false}
      />
      <StainPlane
        position={[(whx + dockX) / 2 - 2, 0.014, whz - 0.55]}
        size={[Math.max(6, dockX - whx), 0.28]}
        material={mats.tire}
        irregular={false}
      />
      {/* Turn arc marks where the lane meets the palletizer bay */}
      <StainPlane
        position={[plx + REF.palletizer.cellSize / 2 + 3.4, 0.014, (plz + laneZ) / 2]}
        size={[1.6, 2.8]}
        material={mats.tire}
      />

      {/* —— Concrete wear patches on the forklift path —— */}
      <StainPlane position={[binCX + 2, 0.013, laneZ]} size={[4.5, 2.6]} material={mats.wear} />
      <StainPlane
        position={[(binCX + whx) / 2, 0.013, laneZ + 0.6]}
        size={[5.5, 2.2]}
        material={mats.wear}
      />
      <StainPlane position={[whx - 3, 0.013, whz + 1.5]} size={[3.5, 2.4]} material={mats.wear} />
    </group>
  );
}
