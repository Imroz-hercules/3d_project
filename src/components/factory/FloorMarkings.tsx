import { useMemo } from 'react';
import * as THREE from 'three';
import {
  REF,
  palletizerPosition,
  plantBounds,
  truckDockPosition,
  flourBinPosition,
} from '../layoutConstants';

/**
 * Painted floor markings in plant coordinates (mounted inside the plant group):
 * - Yellow pedestrian walkway between cleaning and conditioning aisles
 * - Yellow forklift lane between milling and packing aisles with flow arrows
 * - Red restricted-entry hazard zone around the palletizer robot cell
 */

const MARK_Y = 0.012;
const FILL_Y = 0.008;

const SAFETY_YELLOW = '#e0a92c';
const HAZARD_RED = '#b3312b';

function useMarkingMaterials() {
  return useMemo(() => {
    const yellow = new THREE.MeshStandardMaterial({
      color: SAFETY_YELLOW,
      roughness: 0.8,
      metalness: 0,
    });
    const red = new THREE.MeshStandardMaterial({
      color: HAZARD_RED,
      roughness: 0.8,
      metalness: 0,
    });
    const redFill = new THREE.MeshStandardMaterial({
      color: HAZARD_RED,
      roughness: 0.9,
      metalness: 0,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    return { yellow, red, redFill };
  }, []);
}

/** Flat triangle pointing +X, for lane direction arrows. */
function useArrowGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.55, 0);
    shape.lineTo(-0.35, 0.4);
    shape.lineTo(-0.35, -0.4);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);
}

function LaneLine({
  from,
  to,
  z,
  width = 0.12,
  material,
}: {
  from: number;
  to: number;
  z: number;
  width?: number;
  material: THREE.Material;
}) {
  const len = Math.abs(to - from);
  const cx = (from + to) / 2;
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[cx, MARK_Y, z]}
      material={material}
      dispose={null}
    >
      <planeGeometry args={[len, width]} />
    </mesh>
  );
}

export function FloorMarkings() {
  const { yellow, red, redFill } = useMarkingMaterials();
  const arrowGeo = useArrowGeometry();

  const bounds = plantBounds();
  const [plx, , plz] = palletizerPosition();
  const [dockX] = truckDockPosition();
  const [binCX] = flourBinPosition('C');

  // Pedestrian walkway between cleaning (z=+6) and conditioning (z=0) aisles.
  const walkZ = (REF.zones.cleaning.z + REF.zones.conditioning.z) / 2;
  const walkHalf = 0.7;
  const walkFrom = bounds.minX + 3;
  const walkTo = bounds.maxX - 8;

  // Forklift lane between milling (z=-6) and packing (z=-16), toward warehouse/dock.
  const laneZ = (REF.zones.milling.z + REF.zones.packing.z) / 2;
  const laneHalf = 1.3;
  const laneFrom = binCX - 4;
  const laneTo = dockX - 1;

  // Restricted zone around palletizer robot cell (outside the fence).
  const cell = REF.palletizer.cellSize + 1.8;
  const border = 0.14;

  const arrowXs = useMemo(() => {
    const xs: number[] = [];
    const span = laneTo - laneFrom;
    const count = Math.max(2, Math.min(4, Math.floor(span / 8)));
    for (let i = 1; i <= count; i++) {
      xs.push(laneFrom + (span * i) / (count + 1));
    }
    return xs;
  }, [laneFrom, laneTo]);

  return (
    <group>
      {/* Pedestrian walkway — twin yellow lines */}
      <LaneLine from={walkFrom} to={walkTo} z={walkZ - walkHalf} material={yellow} />
      <LaneLine from={walkFrom} to={walkTo} z={walkZ + walkHalf} material={yellow} />

      {/* Forklift lane — twin yellow lines, wider gauge */}
      <LaneLine from={laneFrom} to={laneTo} z={laneZ - laneHalf} width={0.15} material={yellow} />
      <LaneLine from={laneFrom} to={laneTo} z={laneZ + laneHalf} width={0.15} material={yellow} />

      {/* Lane direction arrows (+X toward warehouse / truck dock) */}
      {arrowXs.map((x, i) => (
        <mesh
          key={`arrow-${i}`}
          geometry={arrowGeo}
          material={yellow}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, MARK_Y, laneZ]}
          dispose={null}
        />
      ))}

      {/* Palletizer robot cell — red hazard fill + border frame */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[plx, FILL_Y, plz]}
        material={redFill}
        dispose={null}
      >
        <planeGeometry args={[cell, cell]} />
      </mesh>
      {/* Border strips: N / S / E / W */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[plx, MARK_Y, plz - cell / 2]}
        material={red}
        dispose={null}
      >
        <planeGeometry args={[cell + border, border]} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[plx, MARK_Y, plz + cell / 2]}
        material={red}
        dispose={null}
      >
        <planeGeometry args={[cell + border, border]} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[plx - cell / 2, MARK_Y, plz]}
        material={red}
        dispose={null}
      >
        <planeGeometry args={[border, cell + border]} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[plx + cell / 2, MARK_Y, plz]}
        material={red}
        dispose={null}
      >
        <planeGeometry args={[border, cell + border]} />
      </mesh>
    </group>
  );
}
