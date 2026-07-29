import { useMemo } from 'react';
import * as THREE from 'three';
import { matPaintedSteel, matStructureSteel } from '../../materials';
import { Nameplate, WarningLabel } from '../machineParts/Nameplate';
import {
  REF,
  mccPosition,
  packingMachinePosition,
  palletizerPosition,
  rollerMillPosition,
  elevatorPosition,
  warehouseStagingPosition,
  separatorPosition,
} from '../layoutConstants';

type V3 = [number, number, number];

/**
 * Plant safety & compliance props (ISO/OSHA color coding):
 * red = fire / E-stop, yellow/black = hazard, blue = mandatory PPE, green = first aid.
 * Mounted once in plant coordinates; all shared shapes use memoized local materials.
 */

const SAFETY_RED = '#c0392b';
const SAFETY_YELLOW = '#e0a92c';
const SAFETY_GREEN = '#1e8449';
const SAFETY_BLUE = '#1f5fa8';

function useSafetyMaterials() {
  return useMemo(
    () => ({
      red: new THREE.MeshStandardMaterial({ color: SAFETY_RED, roughness: 0.5, metalness: 0.15 }),
      redButton: new THREE.MeshStandardMaterial({
        color: '#e01e1e',
        roughness: 0.35,
        metalness: 0.1,
      }),
      yellow: new THREE.MeshStandardMaterial({
        color: SAFETY_YELLOW,
        roughness: 0.55,
        metalness: 0.1,
      }),
      green: new THREE.MeshStandardMaterial({ color: SAFETY_GREEN, roughness: 0.6, metalness: 0.1 }),
      black: new THREE.MeshStandardMaterial({ color: '#1c1c1c', roughness: 0.7, metalness: 0.05 }),
    }),
    []
  );
}

type SafetyMats = ReturnType<typeof useSafetyMaterials>;

/** Red cylinder extinguisher with bracket on a short painted post. */
function FireExtinguisher({ position, mats }: { position: V3; mats: SafetyMats }) {
  return (
    <group position={position}>
      {/* Mounting post */}
      <mesh position={[0, 0.7, 0]} material={matStructureSteel} dispose={null}>
        <boxGeometry args={[0.08, 1.4, 0.08]} />
      </mesh>
      {/* Backing plate */}
      <mesh position={[0, 1.05, 0.06]} material={mats.red} dispose={null}>
        <boxGeometry args={[0.24, 0.42, 0.02]} />
      </mesh>
      {/* Bottle */}
      <mesh position={[0, 1.02, 0.16]} material={mats.red} dispose={null}>
        <cylinderGeometry args={[0.075, 0.075, 0.46, 12]} />
      </mesh>
      {/* Valve / handle */}
      <mesh position={[0, 1.29, 0.16]} material={mats.black} dispose={null}>
        <cylinderGeometry args={[0.028, 0.028, 0.09, 8]} />
      </mesh>
      <mesh position={[0.05, 1.32, 0.16]} material={mats.black} dispose={null}>
        <boxGeometry args={[0.12, 0.025, 0.03]} />
      </mesh>
    </group>
  );
}

/** Yellow backplate + red mushroom E-stop on a post. */
function EStopStation({ position, rotation = [0, 0, 0] as V3, mats }: { position: V3; rotation?: V3; mats: SafetyMats }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.55, 0]} material={matStructureSteel} dispose={null}>
        <boxGeometry args={[0.07, 1.1, 0.07]} />
      </mesh>
      {/* Yellow backing plate */}
      <mesh position={[0, 1.12, 0.05]} material={mats.yellow} dispose={null}>
        <boxGeometry args={[0.26, 0.3, 0.03]} />
      </mesh>
      {/* Switch body */}
      <mesh position={[0, 1.12, 0.09]} material={mats.black} dispose={null}>
        <boxGeometry args={[0.14, 0.17, 0.06]} />
      </mesh>
      {/* Red mushroom head */}
      <mesh position={[0, 1.14, 0.14]} rotation={[Math.PI / 2, 0, 0]} material={mats.redButton} dispose={null}>
        <cylinderGeometry args={[0.045, 0.055, 0.04, 12]} />
      </mesh>
      <Nameplate
        position={[0, 0.9, 0.075]}
        width={0.24}
        height={0.07}
        title="EMERGENCY STOP"
        bg={SAFETY_YELLOW}
      />
    </group>
  );
}

/** Green eye-wash / first-aid station: post, basin, green sign. */
function EyeWashStation({ position, mats }: { position: V3; mats: SafetyMats }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} material={matStructureSteel} dispose={null}>
        <boxGeometry args={[0.08, 1.2, 0.08]} />
      </mesh>
      {/* Basin */}
      <mesh position={[0, 1.0, 0.16]} material={mats.green} dispose={null}>
        <cylinderGeometry args={[0.17, 0.12, 0.1, 12]} />
      </mesh>
      {/* Twin nozzles */}
      <mesh position={[-0.05, 1.08, 0.16]} material={matPaintedSteel} dispose={null}>
        <cylinderGeometry args={[0.018, 0.018, 0.07, 8]} />
      </mesh>
      <mesh position={[0.05, 1.08, 0.16]} material={matPaintedSteel} dispose={null}>
        <cylinderGeometry args={[0.018, 0.018, 0.07, 8]} />
      </mesh>
      <Nameplate
        position={[0, 1.45, 0.05]}
        width={0.3}
        height={0.12}
        title="EYE WASH"
        subtitle="FIRST AID"
        bg={SAFETY_GREEN}
        fg="#ffffff"
      />
    </group>
  );
}

/** Free-standing sign on a post (color per ISO class). */
function SafetySign({
  position,
  rotation = [0, 0, 0] as V3,
  title,
  subtitle,
  bg,
  fg = '#ffffff',
}: {
  position: V3;
  rotation?: V3;
  title: string;
  subtitle?: string;
  bg: string;
  fg?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.75, 0]} material={matStructureSteel} dispose={null}>
        <boxGeometry args={[0.06, 1.5, 0.06]} />
      </mesh>
      <Nameplate
        position={[0, 1.55, 0.04]}
        width={0.55}
        height={0.24}
        title={title}
        subtitle={subtitle}
        bg={bg}
        fg={fg}
      />
    </group>
  );
}

export function SafetyProps() {
  const mats = useSafetyMaterials();

  const [rmx, , rmz] = rollerMillPosition();
  const [pkx, , pkz] = packingMachinePosition();
  const [plx, , plz] = palletizerPosition();
  const [elx, , elz] = elevatorPosition();
  const [mccx, , mccz] = mccPosition();
  const [whx, , whz] = warehouseStagingPosition();
  const [sepx, , sepz] = separatorPosition();
  const millDeckY = REF.zones.milling.millDeckY;
  const cell = REF.palletizer.cellSize;

  return (
    <group>
      {/* —— Fire extinguishers (red) —— */}
      <FireExtinguisher position={[elx - 1.6, 0, elz + 1.6]} mats={mats} />
      <FireExtinguisher position={[rmx + REF.rollerMill.width / 2 + 1.6, millDeckY, rmz + 1.8]} mats={mats} />
      <FireExtinguisher position={[pkx - 2.2, 0, pkz + 2.2]} mats={mats} />
      <FireExtinguisher position={[plx + cell / 2 + 1.4, 0, plz - cell / 2 - 1.0]} mats={mats} />
      <FireExtinguisher position={[mccx - 3.2, 0, mccz]} mats={mats} />

      {/* —— E-stop stations —— */}
      <EStopStation position={[rmx - REF.rollerMill.width / 2 - 1.2, millDeckY, rmz + 1.4]} mats={mats} />
      <EStopStation
        position={[plx - cell / 2 - 0.6, 0, plz + cell / 2 + 0.6]}
        rotation={[0, Math.PI / 4, 0]}
        mats={mats}
      />
      <EStopStation position={[pkx + 1.8, 0, pkz + 1.8]} mats={mats} />

      {/* —— First aid / eye wash near packing cell —— */}
      <EyeWashStation position={[pkx - 3.4, 0, pkz + 2.6]} mats={mats} />

      {/* —— Compliance signage —— */}
      <SafetySign
        position={[mccx, 0, mccz + 1.4]}
        rotation={[0, Math.PI, 0]}
        title="DANGER"
        subtitle="HIGH VOLTAGE"
        bg="#c0392b"
      />
      <SafetySign
        position={[rmx + 2.6, millDeckY, rmz - 2.0]}
        title="HEARING PROTECTION"
        subtitle="REQUIRED IN THIS AREA"
        bg={SAFETY_BLUE}
      />
      <SafetySign
        position={[sepx - 2.5, 0, sepz + 2.4]}
        rotation={[0, Math.PI, 0]}
        title="WEAR PPE"
        subtitle="DUST MASK REQUIRED"
        bg={SAFETY_BLUE}
      />
      <SafetySign
        position={[whx - 2.0, 0, whz + 3.0]}
        rotation={[0, Math.PI, 0]}
        title="MAX CAPACITY"
        subtitle="20 TONS"
        bg={SAFETY_YELLOW}
        fg="#1a1a1a"
      />

      {/* Robot cell warning on the hazard boundary */}
      <WarningLabel
        position={[plx - cell / 2 - 0.05, 1.5, plz]}
        rotation={[0, -Math.PI / 2, 0]}
        title="ROBOT CELL"
        subtitle="NO ENTRY WHEN RUNNING"
      />
    </group>
  );
}
