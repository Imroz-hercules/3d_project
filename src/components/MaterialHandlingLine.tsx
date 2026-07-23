'use client';

/**
 * MaterialHandlingLine — hybrid flour mill plant:
 * Raw (Z=0) → Cleaning/Conditioning (+Z aisle) → Milling (−Z decks) → Storage → Packing
 * Silo → Hopper → Valve → Screw → Elevator
 * → Vibro → Destoner → Magnet → Scourer → Dampener → Conditioning Bin
 * → Roller Mill → Plansifter → Purifier → Bran Finisher
 * → Flour Bins A/B/C → Packing Machine → Bag Conveyor → Bag Sewing → Check Weigher → Metal Detector
 */

import { useMemo, useState } from 'react';
import * as THREE from 'three';
import SiloModel, { SILO_OUTLET_Y, SILO_OUTLET_RADIUS } from './Silo';
import { FeedHopperComponent } from './FeedHopper';
import { RotaryValveComponent } from './RotaryValve';
import { ScrewConveyorComponent } from './ScrewConveyor';
import { BucketElevatorComponent } from './bucketElivter';
import { VibroSeparatorComponent } from './VibroSeparator';
import { DestonerComponent } from './Destoner';
import { MagneticSeparatorComponent } from './MagneticSeparator';
import { ScourerComponent } from './scourer';
import { DampenerComponent } from './damping';
import { ConditioningBinComponent } from './conditoningbin';
import { RollerMillComponent } from './rollermill';
import { PlansifterComponent } from './plansifter';
import { PurifierComponent } from './purifier';
import { BranFinisherComponent } from './branFinsiher';
import { FlourBinComponent } from './flourBin';
import { PackingMachineComponent } from './packingMachine';
import { BagConveyorComponent } from './bagconveyr';
import { BagSewingMachineComponent } from './BagSewingMachine';
import { CheckWeigherComponent } from './CheckWeigher';
import { MetalDetectorComponent } from './MetalDetector';
import { MaterialFlow } from './MaterialFlow';
import { MezzanineBay, Walkway, AccessLadder } from './factory/PlantStructure';
import {
  REF,
  ductBridgeY,
  ductStartX,
  elevatorBootInlet,
  elevatorHeadOutlet,
  elevatorPosition,
  hopperCenterX,
  hopperOutletY,
  hopperTopY,
  separatorCleanOutletPos,
  separatorInletWorldPos,
  separatorPosition,
  destonerPosition,
  destonerInletWorldPos,
  destonerCleanOutletPos,
  destonerDeckY,
  magneticPosition,
  magneticInletWorldPos,
  magneticOutletWorldPos,
  scourerPosition,
  scourerInletWorldPos,
  scourerOutletWorldPos,
  dampenerPosition,
  dampenerInletWorldPos,
  dampenerOutletWorldPos,
  conditioningBinPosition,
  conditioningBinInletWorldPos,
  conditioningBinOutletWorldPos,
  rollerMillPosition,
  rollerMillInletWorldPos,
  rollerMillOutletWorldPos,
  plansifterPosition,
  plansifterInletWorldPos,
  plansifterSemolinaOutletWorldPos,
  plansifterFlourOutletWorldPos,
  purifierPosition,
  purifierInletWorldPos,
  purifierBranOutletWorldPos,
  branFinisherPosition,
  branFinisherInletWorldPos,
  branFinisherFlourOutletWorldPos,
  flourBinPosition,
  flourBinInletWorldPos,
  flourBinOutletWorldPos,
  packingMachinePosition,
  packingMachineInletWorldPos,
  packingMachineConveyorEndWorldPos,
  bagConveyorPosition,
  bagConveyorInletWorldPos,
  bagConveyorOutletWorldPos,
  bagSewingMachinePosition,
  bagSewingInletWorldPos,
  bagSewingOutletWorldPos,
  checkWeigherPosition,
  checkWeigherInletWorldPos,
  checkWeigherOutletWorldPos,
  metalDetectorPosition,
  metalDetectorInletWorldPos,
  metalDetectorOutletWorldPos,
  screwDischargeX,
  screwDischargeY,
  screwFloorY,
  screwInletTopY,
  screwInletX,
  valveCenterY,
  valveOutletY,
} from './layoutConstants';

type V3 = [number, number, number];

const COLORS = {
  steel: '#8a9199',
  steelLight: '#a8b0b8',
  flangeSteel: '#7a8288',
  gatePlate: '#4a5058',
} as const;

const HOPPER_X = hopperCenterX();
const VALVE_Y = valveCenterY();
const SCREW_X = screwInletX();
const ELEVATOR_POS = elevatorPosition();
const SEPARATOR_POS = separatorPosition();
const DESTONER_POS = destonerPosition();
const MAGNETIC_POS = magneticPosition();
const SCOURER_POS = scourerPosition();
const DAMPENER_POS = dampenerPosition();
const CONDITIONING_BIN_POS = conditioningBinPosition();
const ROLLER_MILL_POS = rollerMillPosition();
const PLANSIFTER_POS = plansifterPosition();
const PURIFIER_POS = purifierPosition();
const BRAN_FINISHER_POS = branFinisherPosition();
const FLOUR_BIN_A_POS = flourBinPosition('A');
const FLOUR_BIN_B_POS = flourBinPosition('B');
const FLOUR_BIN_C_POS = flourBinPosition('C');
const PACKING_POS = packingMachinePosition();
const BAG_CONVEYOR_POS = bagConveyorPosition();
const BAG_SEWING_POS = bagSewingMachinePosition();
const CHECK_WEIGHER_POS = checkWeigherPosition();
const METAL_DETECTOR_POS = metalDetectorPosition();

function SquareFlange({ size, thickness, position }: { size: number; thickness: number; position: V3 }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, thickness, size]} />
        <meshStandardMaterial color={COLORS.flangeSteel} metalness={0.75} roughness={0.35} />
      </mesh>
    </group>
  );
}

function SlideGate({ position }: { position: V3 }) {
  const s = SILO_OUTLET_RADIUS * 2.4;
  return (
    <group position={position}>
      <SquareFlange size={s + 0.1} thickness={0.04} position={[0, 0.02, 0]} />
      <mesh position={[0, 0.055, 0]} castShadow>
        <boxGeometry args={[s, 0.04, s]} />
        <meshStandardMaterial color={COLORS.gatePlate} metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  );
}

function RoundDuct({ start, end, radius }: { start: V3; end: V3; radius: number }) {
  const startV = new THREE.Vector3(...start);
  const endV = new THREE.Vector3(...end);
  const dir = new THREE.Vector3().subVectors(endV, startV);
  const len = dir.length();
  if (len < 0.001) return null;
  const mid = new THREE.Vector3().addVectors(startV, endV).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );
  return (
    <mesh position={mid.toArray() as V3} quaternion={quat} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, len, 16]} />
      <meshStandardMaterial color={COLORS.steel} metalness={0.65} roughness={0.4} />
    </mesh>
  );
}

function ValveToScrewPipe() {
  const valveOut = valveOutletY();
  const screwIn = screwInletTopY();
  const midY = (valveOut + screwIn) / 2;
  const len = screwIn - valveOut;
  if (len < 0.02) return null;
  const r = REF.hopper.outletSize * 0.38;
  return (
    <mesh position={[SCREW_X, midY, 0]} castShadow>
      <cylinderGeometry args={[r, r, len, 16]} />
      <meshStandardMaterial color={COLORS.steel} metalness={0.7} roughness={0.35} />
    </mesh>
  );
}

/** Angled spout: screw discharge → bucket elevator boot inlet. */
function ScrewToElevatorSpout() {
  const start: V3 = [screwDischargeX(), screwDischargeY(), 0];
  const end = elevatorBootInlet();
  const startV = new THREE.Vector3(...start);
  const endV = new THREE.Vector3(...end);
  const dir = new THREE.Vector3().subVectors(endV, startV);
  const len = dir.length();
  const mid = new THREE.Vector3().addVectors(startV, endV).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );
  const r = REF.screw.width * 1.1;
  return (
    <group position={mid.toArray() as V3} quaternion={quat}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 1.05, len, 16]} />
        <meshStandardMaterial color={COLORS.steel} metalness={0.65} roughness={0.4} />
      </mesh>
      <SquareFlange size={r * 2.2} thickness={0.04} position={[0, len / 2 + 0.02, 0]} />
      <SquareFlange size={r * 2.3} thickness={0.04} position={[0, -(len / 2 + 0.02), 0]} />
    </group>
  );
}

/** Angled chute: elevator head discharge → vibro separator feed inlet. */
function ElevatorToSeparatorDuct() {
  const start = elevatorHeadOutlet();
  const end = separatorInletWorldPos();
  const startV = new THREE.Vector3(...start);
  const endV = new THREE.Vector3(...end);
  const dir = new THREE.Vector3().subVectors(endV, startV);
  const len = dir.length();
  if (len < 0.01) return null;
  const mid = new THREE.Vector3().addVectors(startV, endV).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );
  const r = 0.28;
  return (
    <group position={mid.toArray() as V3} quaternion={quat}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[r, r * 1.1, len, 16]} />
        <meshStandardMaterial color={COLORS.steel} metalness={0.65} roughness={0.4} />
      </mesh>
      <SquareFlange size={r * 2.2} thickness={0.04} position={[0, len / 2 + 0.02, 0]} />
      <SquareFlange size={r * 2.4} thickness={0.04} position={[0, -(len / 2 + 0.02), 0]} />
    </group>
  );
}

/** Vibro clean outlet → destoner feed inlet. */
function SeparatorToDestonerDuct() {
  const start = separatorCleanOutletPos();
  const end = destonerInletWorldPos();
  return (
    <>
      <RoundDuct start={start} end={end} radius={0.22} />
      <SquareFlange size={0.5} thickness={0.04} position={start} />
      <SquareFlange size={0.5} thickness={0.04} position={end} />
    </>
  );
}

/** Destoner clean outlet → magnetic separator top inlet (horizontal then drop). */
function DestonerToMagneticDuct() {
  const start = destonerCleanOutletPos();
  const end = magneticInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return (
    <>
      <RoundDuct start={start} end={mid} radius={0.18} />
      <RoundDuct start={mid} end={end} radius={0.18} />
      <SquareFlange size={0.42} thickness={0.04} position={start} />
      <SquareFlange size={0.42} thickness={0.04} position={end} />
    </>
  );
}

/** Magnetic bottom outlet → scourer top inlet (horizontal then rise). */
function MagneticToScourerDuct() {
  const start = magneticOutletWorldPos();
  const end = scourerInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return (
    <>
      <RoundDuct start={start} end={mid} radius={0.16} />
      <RoundDuct start={mid} end={end} radius={0.16} />
      <SquareFlange size={0.38} thickness={0.04} position={start} />
      <SquareFlange size={0.38} thickness={0.04} position={end} />
    </>
  );
}

/** Scourer bottom outlet → dampener top inlet (horizontal then rise). */
function ScourerToDampenerDuct() {
  const start = scourerOutletWorldPos();
  const end = dampenerInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return (
    <>
      <RoundDuct start={start} end={mid} radius={0.16} />
      <RoundDuct start={mid} end={end} radius={0.16} />
      <SquareFlange size={0.38} thickness={0.04} position={start} />
      <SquareFlange size={0.38} thickness={0.04} position={end} />
    </>
  );
}

/** Dampener outlet → conditioning bin side inlet (horizontal then rise). */
function DampenerToConditioningBinDuct() {
  const start = dampenerOutletWorldPos();
  const end = conditioningBinInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return (
    <>
      <RoundDuct start={start} end={mid} radius={0.2} />
      <RoundDuct start={mid} end={end} radius={0.2} />
      <SquareFlange size={0.48} thickness={0.04} position={start} />
      <SquareFlange size={0.48} thickness={0.04} position={end} />
    </>
  );
}

/** Conditioning bin outlet → roller mill (cross-aisle X then Z, then rise). */
function ConditioningBinToRollerMillDuct() {
  const start = conditioningBinOutletWorldPos();
  const end = rollerMillInletWorldPos();
  const midX: V3 = [end[0], start[1], start[2]];
  const midZ: V3 = [end[0], start[1], end[2]];
  return (
    <>
      <RoundDuct start={start} end={midX} radius={0.22} />
      <RoundDuct start={midX} end={midZ} radius={0.22} />
      <RoundDuct start={midZ} end={end} radius={0.22} />
      <SquareFlange size={0.5} thickness={0.04} position={start} />
      <SquareFlange size={0.5} thickness={0.04} position={end} />
    </>
  );
}

/** Roller mill outlet → plansifter top feed (horizontal then rise). */
function RollerMillToPlansifterDuct() {
  const start = rollerMillOutletWorldPos();
  const end = plansifterInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return (
    <>
      <RoundDuct start={start} end={mid} radius={0.22} />
      <RoundDuct start={mid} end={end} radius={0.22} />
      <SquareFlange size={0.5} thickness={0.04} position={start} />
      <SquareFlange size={0.5} thickness={0.04} position={end} />
    </>
  );
}

/** Plansifter semolina outlet → purifier feed (horizontal then rise). */
function PlansifterToPurifierDuct() {
  const start = plansifterSemolinaOutletWorldPos();
  const end = purifierInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return (
    <>
      <RoundDuct start={start} end={mid} radius={0.18} />
      <RoundDuct start={mid} end={end} radius={0.18} />
      <SquareFlange size={0.42} thickness={0.04} position={start} />
      <SquareFlange size={0.42} thickness={0.04} position={end} />
    </>
  );
}

/** Purifier bran outlet → bran finisher (drop from upper deck to mill deck). */
function PurifierToBranFinisherDuct() {
  const start = purifierBranOutletWorldPos();
  const end = branFinisherInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return (
    <>
      <RoundDuct start={start} end={mid} radius={0.16} />
      <RoundDuct start={mid} end={end} radius={0.16} />
      <SquareFlange size={0.4} thickness={0.04} position={start} />
      <SquareFlange size={0.4} thickness={0.04} position={end} />
    </>
  );
}

/** Plansifter flour + bran-finisher recovered flour → flour bin fill header. */
function FlourToStorageDucts() {
  const flourOut = plansifterFlourOutletWorldPos();
  const recovered = branFinisherFlourOutletWorldPos();
  const binA = flourBinInletWorldPos('A');
  const binB = flourBinInletWorldPos('B');
  const binC = flourBinInletWorldPos('C');

  // Shared header above storage aisle at bin fill height
  const headerY = binB[1];
  const headerX = binB[0] - REF.flourBin.radius - 1.4;
  const header: V3 = [headerX, headerY, binB[2]];
  const headerA: V3 = [headerX, headerY, binA[2]];
  const headerC: V3 = [headerX, headerY, binC[2]];

  // Plansifter flour drop then run to header
  const flourDrop: V3 = [flourOut[0], headerY, flourOut[2]];
  const flourToHeader: V3 = [headerX, headerY, flourOut[2]];

  // Recovered flour rises/runs to header
  const recoveredRise: V3 = [recovered[0], headerY, recovered[2]];
  const recoveredToHeader: V3 = [headerX, headerY, recovered[2]];

  return (
    <>
      {/* Primary flour from plansifter */}
      <RoundDuct start={flourOut} end={flourDrop} radius={0.14} />
      <RoundDuct start={flourDrop} end={flourToHeader} radius={0.14} />
      <RoundDuct start={flourToHeader} end={header} radius={0.14} />

      {/* Recovered flour from bran finisher */}
      <RoundDuct start={recovered} end={recoveredRise} radius={0.12} />
      <RoundDuct start={recoveredRise} end={recoveredToHeader} radius={0.12} />
      <RoundDuct start={recoveredToHeader} end={header} radius={0.12} />

      {/* Header manifold → bins A / B / C */}
      <RoundDuct start={header} end={headerA} radius={0.13} />
      <RoundDuct start={header} end={headerC} radius={0.13} />
      <RoundDuct start={headerA} end={binA} radius={0.13} />
      <RoundDuct start={header} end={binB} radius={0.13} />
      <RoundDuct start={headerC} end={binC} radius={0.13} />

      <SquareFlange size={0.36} thickness={0.04} position={flourOut} />
      <SquareFlange size={0.32} thickness={0.04} position={recovered} />
      <SquareFlange size={0.34} thickness={0.04} position={binA} />
      <SquareFlange size={0.34} thickness={0.04} position={binB} />
      <SquareFlange size={0.34} thickness={0.04} position={binC} />
    </>
  );
}

/** Flour Bin A rotary valve → packing machine feed hopper. */
function FlourBinAToPackingDuct() {
  const start = flourBinOutletWorldPos('A');
  const end = packingMachineInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return (
    <>
      <RoundDuct start={start} end={mid} radius={0.18} />
      <RoundDuct start={mid} end={end} radius={0.18} />
      <SquareFlange size={0.42} thickness={0.04} position={start} />
      <SquareFlange size={0.42} thickness={0.04} position={end} />
    </>
  );
}

/** Steel platforms, walkways, and mezzanines for hybrid plant zones. */
function PlantInfrastructure() {
  const millDeckY = REF.zones.milling.millDeckY;
  const upperDeckY = REF.zones.milling.upperDeckY;
  const [rmx, , rmz] = ROLLER_MILL_POS;
  const [psx, , psz] = PLANSIFTER_POS;
  const [pux] = PURIFIER_POS;
  const [elevX, , elevZ] = ELEVATOR_POS;
  const [sepX, , sepZ] = SEPARATOR_POS;

  const millBayWidth = REF.rollerMill.width + 3.2;
  const upperBayWidth = Math.max(8, pux - psx + 5);
  const upperBayCenterX = (psx + pux) / 2;

  return (
    <group>
      {/* Transfer walkway: elevator head area toward cleaning aisle */}
      <Walkway
        length={Math.abs(sepZ - elevZ) * 0.55}
        width={1.1}
        position={[elevX + 1.2, 3.2, (elevZ + sepZ) * 0.35]}
        rotation={[0, Math.PI / 2, 0]}
        railBothSides
      />
      <AccessLadder height={3.2} caged position={[elevX + 1.2, 0, elevZ + 0.8]} />

      {/* Cleaning aisle short operator walk beside vibro */}
      <Walkway
        length={4}
        width={1.0}
        position={[sepX, 0.02, sepZ - REF.separator.depth / 2 - 0.7]}
        railBothSides={false}
      />

      {/* Milling mezzanine — roller mill deck */}
      <MezzanineBay
        width={millBayWidth}
        depth={5.2}
        deckY={millDeckY}
        position={[rmx, 0, rmz]}
        ladder
        ladderSide="posZ"
        openSides={['negZ']}
      />

      {/* Inter-deck ladder mill → upper gallery */}
      <AccessLadder
        height={upperDeckY - millDeckY}
        caged
        position={[psx - 2.2, millDeckY, psz + 2.0]}
      />

      {/* Upper gallery — plansifter + purifier */}
      <MezzanineBay
        width={upperBayWidth}
        depth={5.5}
        deckY={upperDeckY}
        position={[upperBayCenterX, 0, psz]}
        ladder={false}
        openSides={['posZ', 'negZ']}
      />
      <Walkway
        length={upperBayWidth - 1}
        width={1.3}
        position={[upperBayCenterX, upperDeckY, psz + 2.4]}
        railBothSides
      />
    </group>
  );
}

/** Steel platform under elevated destoner. */
function DestonerPlatform() {
  const [dx, dy, dz] = DESTONER_POS;
  const { length, width } = REF.destoner;
  const legH = dy;
  const legs: V3[] = [
    [length / 2 - 0.25, legH / 2, width / 2 - 0.25],
    [-length / 2 + 0.25, legH / 2, width / 2 - 0.25],
    [length / 2 - 0.25, legH / 2, -width / 2 + 0.25],
    [-length / 2 + 0.25, legH / 2, -width / 2 + 0.25],
  ];
  return (
    <group position={[dx, 0, dz]}>
      <mesh position={[0, dy - 0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[length + 0.3, 0.12, width + 0.3]} />
        <meshStandardMaterial color={COLORS.flangeSteel} metalness={0.7} roughness={0.4} />
      </mesh>
      {legs.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={[0.18, legH, 0.18]} />
          <meshStandardMaterial color={COLORS.steel} metalness={0.75} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

export function MaterialHandlingLine() {
  const [lineActive, setLineActive] = useState(true);

  const bridgeY = ductBridgeY();
  const inletY = hopperTopY() + 0.02;
  const spoutR = SILO_OUTLET_RADIUS * 1.6;
  const bootInlet = elevatorBootInlet();
  const headOutlet = elevatorHeadOutlet();
  const separatorInlet = separatorInletWorldPos();
  const separatorCleanOut = separatorCleanOutletPos();
  const destonerInlet = destonerInletWorldPos();
  const destonerCleanOut = destonerCleanOutletPos();
  const magneticInlet = magneticInletWorldPos();
  const magneticOutlet = magneticOutletWorldPos();
  const scourerInlet = scourerInletWorldPos();
  const scourerOutlet = scourerOutletWorldPos();
  const dampenerInlet = dampenerInletWorldPos();
  const dampenerOutlet = dampenerOutletWorldPos();
  const binInlet = conditioningBinInletWorldPos();
  const binOutlet = conditioningBinOutletWorldPos();
  const millInlet = rollerMillInletWorldPos();
  const millOutlet = rollerMillOutletWorldPos();
  const sifterInlet = plansifterInletWorldPos();
  const flourOut = plansifterFlourOutletWorldPos();
  const flourBinAInlet = flourBinInletWorldPos('A');
  const flourBinAOutlet = flourBinOutletWorldPos('A');
  const packingInlet = packingMachineInletWorldPos();
  const packingConveyorEnd = packingMachineConveyorEndWorldPos();
  const bagConvInlet = bagConveyorInletWorldPos();
  const bagConvOutlet = bagConveyorOutletWorldPos();
  const sewingInlet = bagSewingInletWorldPos();
  const sewingOutlet = bagSewingOutletWorldPos();
  const checkInlet = checkWeigherInletWorldPos();
  const checkOutlet = checkWeigherOutletWorldPos();
  const metalInlet = metalDetectorInletWorldPos();
  const metalOutlet = metalDetectorOutletWorldPos();
  const [elevX] = ELEVATOR_POS;
  const [sepX, , sepZ] = SEPARATOR_POS;
  const [dx, dy, dz] = DESTONER_POS;
  const [mx, my, mz] = MAGNETIC_POS;
  const [scx, scy, scz] = SCOURER_POS;
  const [dampX, dampY, dampZ] = DAMPENER_POS;
  const [binX, , binZ] = CONDITIONING_BIN_POS;
  const [rmx, rmy, rmz] = ROLLER_MILL_POS;
  const [psx, psy, psz] = PLANSIFTER_POS;
  const [fax, fay, faz] = FLOUR_BIN_A_POS;
  const [pkx, pky, pkz] = PACKING_POS;
  const [bcx, bcy, bcz] = BAG_CONVEYOR_POS;
  const [swx, swy, swz] = BAG_SEWING_POS;
  const [cwx, cwy, cwz] = CHECK_WEIGHER_POS;
  const [mdx, mdy, mdz] = METAL_DETECTOR_POS;
  const deckY = destonerDeckY();

  const flowPath: V3[] = useMemo(() => {
    const h = REF.elevator.height;
    const headerX = flourBinAInlet[0] - REF.flourBin.radius - 1.4;
    return [
      [0, SILO_OUTLET_Y + 1.5, 0],
      [0, SILO_OUTLET_Y, 0],
      [0, bridgeY, 0],
      [ductStartX(), bridgeY, 0],
      [HOPPER_X, bridgeY, 0],
      [HOPPER_X, inletY, 0],
      [HOPPER_X, hopperTopY() * 0.7, 0],
      [HOPPER_X, hopperOutletY(), 0],
      [HOPPER_X, VALVE_Y, 0],
      [SCREW_X, valveOutletY(), 0],
      [SCREW_X, screwInletTopY(), 0],
      [SCREW_X + REF.screw.length * 0.5, screwDischargeY(), 0],
      [screwDischargeX(), screwDischargeY(), 0],
      bootInlet,
      [elevX, REF.elevator.bootHeight + 1, 0],
      [elevX, h * 0.45, 0],
      [elevX, h * 0.85, 0],
      headOutlet,
      // → Vibro separator
      separatorInlet,
      [sepX, REF.separator.frameHeight / 2, sepZ],
      separatorCleanOut,
      // → Destoner
      destonerInlet,
      [dx, dy + deckY, dz],
      destonerCleanOut,
      // → Magnetic separator
      [magneticInlet[0], destonerCleanOut[1], magneticInlet[2]],
      magneticInlet,
      [mx, my, mz],
      magneticOutlet,
      // → Scourer
      [scourerInlet[0], magneticOutlet[1], scourerInlet[2]],
      scourerInlet,
      [scx, scy, scz],
      scourerOutlet,
      // → Dampener
      [dampenerInlet[0], scourerOutlet[1], dampenerInlet[2]],
      dampenerInlet,
      [dampX, dampY, dampZ],
      dampenerOutlet,
      // → Conditioning bin
      [binInlet[0], dampenerOutlet[1], binInlet[2]],
      binInlet,
      [binX, binInlet[1] * 0.55, binZ],
      binOutlet,
      // → Roller mill (cross-aisle)
      [millInlet[0], binOutlet[1], binOutlet[2]],
      [millInlet[0], binOutlet[1], millInlet[2]],
      millInlet,
      [rmx, rmy, rmz],
      millOutlet,
      // → Plansifter → flour stream → Bin A → Packing
      [sifterInlet[0], millOutlet[1], sifterInlet[2]],
      sifterInlet,
      [psx, psy, psz],
      flourOut,
      [flourOut[0], flourBinAInlet[1], flourOut[2]],
      [headerX, flourBinAInlet[1], flourOut[2]],
      [headerX, flourBinAInlet[1], flourBinAInlet[2]],
      flourBinAInlet,
      [fax, fay + REF.flourBin.legHeight + REF.flourBin.height * 0.5, faz],
      flourBinAOutlet,
      [packingInlet[0], flourBinAOutlet[1], packingInlet[2]],
      packingInlet,
      [pkx, pky + 1.5, pkz],
      packingConveyorEnd,
      bagConvInlet,
      [bcx, bcy + REF.bagConveyor.height, bcz],
      bagConvOutlet,
      sewingInlet,
      [swx, swy + 1.0, swz],
      sewingOutlet,
      checkInlet,
      [cwx, cwy + REF.checkWeigher.height, cwz],
      checkOutlet,
      metalInlet,
      [mdx, mdy + REF.metalDetector.height, mdz],
      metalOutlet,
    ];
  }, [
    bridgeY,
    inletY,
    bootInlet,
    headOutlet,
    elevX,
    separatorInlet,
    separatorCleanOut,
    sepX,
    sepZ,
    destonerInlet,
    destonerCleanOut,
    dx,
    dy,
    dz,
    deckY,
    magneticInlet,
    magneticOutlet,
    mx,
    my,
    mz,
    scourerInlet,
    scourerOutlet,
    scx,
    scy,
    scz,
    dampenerInlet,
    dampenerOutlet,
    dampX,
    dampY,
    dampZ,
    binInlet,
    binOutlet,
    binX,
    binZ,
    millInlet,
    millOutlet,
    rmx,
    rmy,
    rmz,
    sifterInlet,
    flourOut,
    psx,
    psy,
    psz,
    flourBinAInlet,
    flourBinAOutlet,
    fax,
    fay,
    faz,
    packingInlet,
    packingConveyorEnd,
    pkx,
    pky,
    pkz,
    bagConvInlet,
    bagConvOutlet,
    bcx,
    bcy,
    bcz,
    sewingInlet,
    sewingOutlet,
    swx,
    swy,
    swz,
    checkInlet,
    checkOutlet,
    cwx,
    cwy,
    cwz,
    metalInlet,
    metalOutlet,
    mdx,
    mdy,
    mdz,
  ]);

  return (
    <group onClick={() => setLineActive((v) => !v)}>
      <PlantInfrastructure />

      <SiloModel />

      <SlideGate position={[0, SILO_OUTLET_Y, 0]} />

      <RoundDuct start={[0, SILO_OUTLET_Y, 0]} end={[0, bridgeY, 0]} radius={spoutR} />
      <RoundDuct start={[0, bridgeY, 0]} end={[ductStartX(), bridgeY, 0]} radius={spoutR} />
      <RoundDuct
        start={[ductStartX(), bridgeY, 0]}
        end={[HOPPER_X, bridgeY, 0]}
        radius={spoutR * 1.05}
      />
      <RoundDuct
        start={[HOPPER_X, bridgeY, 0]}
        end={[HOPPER_X, inletY, 0]}
        radius={REF.hopper.width * 0.22}
      />

      <FeedHopperComponent position={[HOPPER_X, 0, 0]} showFlourFill flourFillLevel={0.45} />

      <RotaryValveComponent
        position={[HOPPER_X, VALVE_Y, 0]}
        scale={REF.valve.scale}
        width={REF.valve.width}
        height={REF.valve.height}
        depth={REF.valve.depth}
        active={lineActive}
        showDataPanel={false}
        showLegs={false}
        showGuard={false}
      />

      <ValveToScrewPipe />

      <ScrewConveyorComponent
        position={[SCREW_X, screwFloorY(), 0]}
        length={REF.screw.length}
        width={REF.screw.width * 2}
        troughHeight={REF.screw.troughHeight}
        inletDropHeight={REF.screw.inletDropHeight}
        active={lineActive}
        showLabel={false}
        axis="x"
      />

      <ScrewToElevatorSpout />

      <BucketElevatorComponent
        position={ELEVATOR_POS}
        width={REF.elevator.width}
        depth={REF.elevator.depth}
        height={REF.elevator.height}
        rpm={REF.elevator.rpm}
        beltSpeed={REF.elevator.beltSpeed}
        active={lineActive}
        label="ELEVATOR-01"
        showDataPanel={false}
        showClickText={false}
        showPlatform
      />

      {/* Elevator head discharge → Vibro Separator feed inlet */}
      <ElevatorToSeparatorDuct />

      {/* Vibro Separator (pre-cleaner) */}
      <VibroSeparatorComponent
        position={SEPARATOR_POS}
        width={REF.separator.width}
        depth={REF.separator.depth}
        height={REF.separator.height}
        rpm={REF.separator.rpm}
        amplitude={REF.separator.amplitude}
        active={lineActive}
        label="VIBRO-01"
        showDataPanel={false}
        showClickText={false}
      />

      {/* Vibro → Destoner */}
      <SeparatorToDestonerDuct />
      <DestonerPlatform />

      <DestonerComponent
        position={DESTONER_POS}
        length={REF.destoner.length}
        width={REF.destoner.width}
        depth={REF.destoner.depth}
        rpm={REF.destoner.rpm}
        airflow={REF.destoner.airflow}
        active={lineActive}
        label="DESTONER-01"
        showDataPanel={false}
        showClickText={false}
      />

      {/* Destoner → Magnetic Separator */}
      <DestonerToMagneticDuct />

      <MagneticSeparatorComponent
        position={MAGNETIC_POS}
        length={REF.magnetic.length}
        width={REF.magnetic.width}
        height={REF.magnetic.height}
        active={lineActive}
        showDataPanel={false}
        showClickText={false}
      />

      {/* Magnetic Separator → Scourer */}
      <MagneticToScourerDuct />

      <ScourerComponent
        position={SCOURER_POS}
        length={REF.scourer.length}
        radius={REF.scourer.radius}
        active={lineActive}
        showDataPanel={false}
        showClickText={false}
      />

      {/* Scourer → Dampener */}
      <ScourerToDampenerDuct />

      <DampenerComponent
        position={DAMPENER_POS}
        length={REF.dampener.length}
        radius={REF.dampener.radius}
        active={lineActive}
        showDataPanel={false}
        showClickText={false}
      />

      {/* Dampener → Conditioning Bin */}
      <DampenerToConditioningBinDuct />

      {/* Rotated so side inlet faces −X toward the dampener */}
      <group position={CONDITIONING_BIN_POS} rotation={[0, Math.PI, 0]}>
        <ConditioningBinComponent
          radius={REF.conditioningBin.radius}
          height={REF.conditioningBin.height}
          coneHeight={REF.conditioningBin.coneHeight}
          legHeight={REF.conditioningBin.legHeight}
          capacity={REF.conditioningBin.capacity}
          fillPercent={62}
          autoDemo={false}
          showDataPanel={false}
        />
      </group>

      {/* Conditioning Bin → Roller Mill */}
      <ConditioningBinToRollerMillDuct />

      <RollerMillComponent
        position={ROLLER_MILL_POS}
        width={REF.rollerMill.width}
        height={REF.rollerMill.height}
        depth={REF.rollerMill.depth}
        active={lineActive}
        showDataPanel={false}
        showClickText={false}
      />

      {/* Roller Mill → Plansifter */}
      <RollerMillToPlansifterDuct />

      <PlansifterComponent
        position={PLANSIFTER_POS}
        width={REF.plansifter.width}
        height={REF.plansifter.height}
        depth={REF.plansifter.depth}
        frameHeight={REF.plansifter.frameHeight}
        active={lineActive}
        showDataPanel={false}
        showClickText={false}
        showAccessLadder={false}
      />

      {/* Plansifter semolina → Purifier */}
      <PlansifterToPurifierDuct />

      <PurifierComponent
        position={PURIFIER_POS}
        width={REF.purifier.width}
        height={REF.purifier.height}
        depth={REF.purifier.depth}
        active={lineActive}
        showDataPanel={false}
        showClickText={false}
        showAccessLadder={false}
      />

      {/* Purifier bran → Bran Finisher */}
      <PurifierToBranFinisherDuct />

      <BranFinisherComponent
        position={BRAN_FINISHER_POS}
        length={REF.branFinisher.length}
        radius={REF.branFinisher.radius}
        active={lineActive}
        showDataPanel={false}
        showClickText={false}
      />

      {/* Flour streams → finished-product storage */}
      <FlourToStorageDucts />

      <FlourBinComponent
        position={FLOUR_BIN_A_POS}
        label="FLOUR BIN A"
        radius={REF.flourBin.radius}
        height={REF.flourBin.height}
        coneHeight={REF.flourBin.coneHeight}
        legHeight={REF.flourBin.legHeight}
        capacity={REF.flourBin.capacity}
        fillPercent={85}
        active={lineActive}
        showDataPanel={false}
      />
      <FlourBinComponent
        position={FLOUR_BIN_B_POS}
        label="FLOUR BIN B"
        radius={REF.flourBin.radius}
        height={REF.flourBin.height}
        coneHeight={REF.flourBin.coneHeight}
        legHeight={REF.flourBin.legHeight}
        capacity={REF.flourBin.capacity}
        fillPercent={62}
        active={lineActive}
        showDataPanel={false}
      />
      <FlourBinComponent
        position={FLOUR_BIN_C_POS}
        label="FLOUR BIN C"
        radius={REF.flourBin.radius}
        height={REF.flourBin.height}
        coneHeight={REF.flourBin.coneHeight}
        legHeight={REF.flourBin.legHeight}
        capacity={REF.flourBin.capacity}
        fillPercent={28}
        active={lineActive}
        showDataPanel={false}
      />

      {/* Flour Bin A → Packing Machine (packing cell start) */}
      <FlourBinAToPackingDuct />

      <PackingMachineComponent
        position={PACKING_POS}
        width={REF.packingMachine.width}
        depth={REF.packingMachine.depth}
        height={REF.packingMachine.height}
        active={lineActive}
        showDataPanel={false}
        showClickText={false}
      />

      {/* Packing takeaway → Bag Conveyor (length along +X, away from flour bins) */}
      <group position={BAG_CONVEYOR_POS}>
        <BagConveyorComponent
          position={[0, 0, 0]}
          length={REF.bagConveyor.length}
          width={REF.bagConveyor.width}
          height={REF.bagConveyor.height}
          active={lineActive}
          showDataPanel={false}
          showClickText={false}
        />
      </group>

      {/* Bag Conveyor → Bag Sewing Machine (local +Z rotated −90° → world +X) */}
      <group position={BAG_SEWING_POS} rotation={[0, -Math.PI / 2, 0]}>
        <BagSewingMachineComponent
          position={[0, 0, 0]}
          width={REF.bagSewing.width}
          depth={REF.bagSewing.depth}
          height={REF.bagSewing.height}
          active={lineActive}
          showDataPanel={false}
          showClickText={false}
        />
      </group>

      {/* Bag Sewing → Check Weigher (length along +X) */}
      <CheckWeigherComponent
        position={CHECK_WEIGHER_POS}
        length={REF.checkWeigher.length}
        width={REF.checkWeigher.width}
        height={REF.checkWeigher.height}
        active={lineActive}
        showDataPanel={false}
        showClickText={false}
      />

      {/* Check Weigher → Metal Detector (length along +X toward palletizer) */}
      <MetalDetectorComponent
        position={METAL_DETECTOR_POS}
        length={REF.metalDetector.length}
        width={REF.metalDetector.width}
        height={REF.metalDetector.height}
        tunnelHeight={REF.metalDetector.tunnelHeight}
        tunnelDepth={REF.metalDetector.tunnelDepth}
        active={lineActive}
        showDataPanel={false}
        showClickText={false}
      />

      <MaterialFlow path={flowPath} active={lineActive} speed={0.07} />
    </group>
  );
}

export default MaterialHandlingLine;
