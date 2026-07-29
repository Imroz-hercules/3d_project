'use client';

/**
 * MaterialHandlingLine — hybrid flour mill plant:
 * Raw (Z=0) → Cleaning/Conditioning (+Z aisle) → Milling (−Z decks) → Storage → Packing
 * Silo → Hopper → Valve → Screw → Elevator
 * → Vibro → Destoner → Magnet → Scourer → Dampener → Conditioning Bin
 * → Roller Mill → Plansifter → Purifier → Bran Finisher
 * → Flour Bins A/B/C → Packing Machine → Bag Conveyor → Bag Sewing → Check Weigher → Metal Detector → Palletizer
 */

import { useMemo } from 'react';
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
import { PalletizerComponent } from './Palletizer';
import { WarehouseStaging } from './WarehouseStaging';
import { MaterialFlow, DustMotes } from './MaterialFlow';
import { SelectableMachine } from '../twin/SelectableMachine';
import { useLineActive, useTwinState } from '../twin/useTwinState';
import { buildMachineRegistry } from '../navigation/MachineRegistry';
import { useNavFocus } from '../navigation/useNavState';
import { FocusableGroup } from '../navigation/FocusOpacity';
import { MachineLOD } from '../navigation/MachineLOD';
import { MezzanineBay, Walkway, AccessLadder, SafetyRailing, SteelFrameBay, SteelPlatform } from './factory/PlantStructure';
import {
  BeltBridge,
  ElbowedPipe,
  GravityChute,
  PneumaticPipe,
  PneumaticTee,
  PneumaticValve,
  PipeReducer,
  RejectBin,
  SquareFlange,
  type V3,
} from './factory/ProcessPiping';
import { DustCollection } from './factory/DustCollection';
import { Electrical } from './factory/Electrical';
import { FloorMarkings } from './factory/FloorMarkings';
import { SafetyProps } from './factory/SafetyProps';
import { EnvironmentalWear } from './factory/EnvironmentalWear';
import { EquipmentIds } from './factory/EquipmentIds';
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
  plansifterOversizeOutletWorldPos,
  purifierPosition,
  purifierInletWorldPos,
  purifierBranOutletWorldPos,
  purifierSemolinaOutletWorldPos,
  branFinisherPosition,
  branFinisherInletWorldPos,
  branFinisherFlourOutletWorldPos,
  branFinisherBranOutletWorldPos,
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
  palletizerPosition,
  palletizerInletWorldPos,
  palletizerOutletWorldPos,
  dustTakeoffWorldPos,
  bagFilterPosition,
  screwDischargeX,
  screwDischargeY,
  screwFloorY,
  screwInletTopY,
  screwInletX,
  valveCenterY,
  valveOutletY,
  warehouseStagingPosition,
  plantCenter,
  rawAisleZ,
  siloPosition,
} from './layoutConstants';
import { useCameraNear } from '../perf/useCameraNear';

const COLORS = {
  steel: '#8a9199',
  steelLight: '#a8b0b8',
  flangeSteel: '#7a8288',
  gatePlate: '#4a5058',
} as const;

const RAW_Z = rawAisleZ();
const SILO_POS = siloPosition();
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
const PALLETIZER_POS = palletizerPosition();

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

function ValveToScrewPipe() {
  const valveOut = valveOutletY();
  const screwIn = screwInletTopY();
  const midY = (valveOut + screwIn) / 2;
  const len = screwIn - valveOut;
  if (len < 0.02) return null;
  const r = REF.hopper.outletSize * 0.38;
  return (
    <group>
      <mesh position={[SCREW_X, midY, 0]} castShadow>
        <cylinderGeometry args={[r, r, len, 16]} />
        <meshStandardMaterial color={COLORS.steel} metalness={0.7} roughness={0.35} />
      </mesh>
      <SquareFlange size={r * 2.4} thickness={0.04} position={[SCREW_X, valveOut, 0]} />
      <SquareFlange size={r * 2.4} thickness={0.04} position={[SCREW_X, screwIn, 0]} />
    </group>
  );
}

/** Angled spout: screw discharge → bucket elevator boot inlet. */
function ScrewToElevatorSpout() {
  const start: V3 = [screwDischargeX(), screwDischargeY(), RAW_Z];
  const end = elevatorBootInlet();
  return <ElbowedPipe path={[start, end]} radius={REF.screw.width * 1.1} supportEvery={99} />;
}

/** Angled chute: elevator head discharge → vibro separator feed inlet. */
function ElevatorToSeparatorDuct() {
  return (
    <ElbowedPipe
      path={[elevatorHeadOutlet(), separatorInletWorldPos()]}
      radius={0.28}
      supportEvery={99}
    />
  );
}

/** Vibro clean outlet → destoner feed inlet. */
function SeparatorToDestonerDuct() {
  return (
    <ElbowedPipe
      path={[separatorCleanOutletPos(), destonerInletWorldPos()]}
      radius={0.22}
      supportEvery={99}
    />
  );
}

/** Destoner clean outlet → magnetic separator top inlet (horizontal then drop). */
function DestonerToMagneticDuct() {
  const start = destonerCleanOutletPos();
  const end = magneticInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return <ElbowedPipe path={[start, mid, end]} radius={0.18} />;
}

/** Magnetic bottom outlet → scourer top inlet (horizontal then rise). */
function MagneticToScourerDuct() {
  const start = magneticOutletWorldPos();
  const end = scourerInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return <ElbowedPipe path={[start, mid, end]} radius={0.16} />;
}

/** Scourer bottom outlet → dampener (Z-drop into conditioning aisle, then rise). */
function ScourerToDampenerDuct() {
  const start = scourerOutletWorldPos();
  const end = dampenerInletWorldPos();
  const midZ: V3 = [start[0], start[1], end[2]];
  const midX: V3 = [end[0], start[1], end[2]];
  return <ElbowedPipe path={[start, midZ, midX, end]} radius={0.16} />;
}

/** Dampener outlet → conditioning bin side inlet (horizontal then rise). */
function DampenerToConditioningBinDuct() {
  const start = dampenerOutletWorldPos();
  const end = conditioningBinInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return <ElbowedPipe path={[start, mid, end]} radius={0.2} />;
}

/** Conditioning bin outlet → roller mill (cross-aisle X then Z, then rise). */
function ConditioningBinToRollerMillDuct() {
  const start = conditioningBinOutletWorldPos();
  const end = rollerMillInletWorldPos();
  const midX: V3 = [end[0], start[1], start[2]];
  const midZ: V3 = [end[0], start[1], end[2]];
  return <ElbowedPipe path={[start, midX, midZ, end]} radius={0.22} supportEvery={2.5} />;
}

/** Roller mill outlet → plansifter top feed (horizontal then rise). */
function RollerMillToPlansifterDuct() {
  const start = rollerMillOutletWorldPos();
  const end = plansifterInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return <ElbowedPipe path={[start, mid, end]} radius={0.22} />;
}

/** Plansifter semolina outlet → purifier feed (horizontal then rise). */
function PlansifterToPurifierDuct() {
  const start = plansifterSemolinaOutletWorldPos();
  const end = purifierInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return <ElbowedPipe path={[start, mid, end]} radius={0.18} />;
}

/** Purifier bran outlet → bran finisher (drop from upper deck to mill deck). */
function PurifierToBranFinisherDuct() {
  const start = purifierBranOutletWorldPos();
  const end = branFinisherInletWorldPos();
  const mid: V3 = [end[0], start[1], end[2]];
  return <ElbowedPipe path={[start, mid, end]} radius={0.16} />;
}

/** Plansifter flour + bran-finisher recovered flour → flour bin fill header (pneumatic). */
function FlourToStorageDucts() {
  const flourOut = plansifterFlourOutletWorldPos();
  const recovered = branFinisherFlourOutletWorldPos();
  const binA = flourBinInletWorldPos('A');
  const binB = flourBinInletWorldPos('B');
  const binC = flourBinInletWorldPos('C');

  // Bins are spaced along −X on storage aisle; header runs parallel on +Z side.
  const headerY = binB[1];
  const headerZ = REF.zones.storage.z + 2.2;
  const headerA: V3 = [binA[0], headerY, headerZ];
  const headerB: V3 = [binB[0], headerY, headerZ];
  const headerC: V3 = [binC[0], headerY, headerZ];

  const flourDrop: V3 = [flourOut[0], headerY, flourOut[2]];
  const flourToHeader: V3 = [flourOut[0], headerY, headerZ];

  const recoveredRise: V3 = [recovered[0], headerY, recovered[2]];
  const recoveredToHeader: V3 = [recovered[0], headerY, headerZ];

  const redA: V3 = [binA[0], binA[1], (binA[2] + headerZ) / 2];
  const redB: V3 = [binB[0], binB[1], (binB[2] + headerZ) / 2];
  const redC: V3 = [binC[0], binC[1], (binC[2] + headerZ) / 2];

  return (
    <>
      <PneumaticPipe path={[flourOut, flourDrop, flourToHeader, headerB]} radius={0.14} />
      <PneumaticValve position={flourToHeader} radius={0.14} />
      <PneumaticPipe path={[recovered, recoveredRise, recoveredToHeader, headerB]} radius={0.12} />
      <PneumaticTee position={headerB} radius={0.14} />

      <PneumaticPipe path={[headerB, headerA]} radius={0.13} supportEvery={99} />
      <PneumaticTee position={headerA} radius={0.12} />
      <PneumaticPipe path={[headerA, redA]} radius={0.13} supportEvery={99} />
      <PipeReducer start={redA} end={binA} startRadius={0.13} endRadius={0.09} />

      <PneumaticPipe path={[headerB, redB]} radius={0.13} supportEvery={99} />
      <PipeReducer start={redB} end={binB} startRadius={0.13} endRadius={0.09} />

      <PneumaticPipe path={[headerB, headerC]} radius={0.13} supportEvery={99} />
      <PneumaticTee position={headerC} radius={0.12} />
      <PneumaticPipe path={[headerC, redC]} radius={0.13} supportEvery={99} />
      <PipeReducer start={redC} end={binC} startRadius={0.13} endRadius={0.09} />
    </>
  );
}

/** Flour Bin A rotary valve → packing machine feed hopper (pneumatic). */
function FlourBinAToPackingDuct() {
  const start = flourBinOutletWorldPos('A');
  const end = packingMachineInletWorldPos();
  // Drop −Z to packing aisle, then to packing X.
  const midZ: V3 = [start[0], start[1], end[2]];
  const midX: V3 = [end[0], start[1], end[2]];
  const valvePos: V3 = [(start[0] + midZ[0]) / 2, start[1], (start[2] + midZ[2]) / 2];
  return (
    <>
      <PneumaticPipe path={[start, midZ, midX, end]} radius={0.16} />
      <PneumaticValve position={valvePos} radius={0.16} />
    </>
  );
}

/** Close packing-cell belt gaps so bags have a continuous mechanical path. */
function PackingCellBridges() {
  return (
    <>
      <BeltBridge start={packingMachineConveyorEndWorldPos()} end={bagConveyorInletWorldPos()} />
      <BeltBridge start={bagSewingOutletWorldPos()} end={checkWeigherInletWorldPos()} />
      <BeltBridge start={checkWeigherOutletWorldPos()} end={metalDetectorInletWorldPos()} />
      <BeltBridge start={metalDetectorOutletWorldPos()} end={palletizerInletWorldPos()} />
    </>
  );
}

/** Byproduct gravity drops to floor reject bins (oversize / clean semolina / bran). */
function ByproductChutes() {
  const oversize = plansifterOversizeOutletWorldPos();
  const semolina = purifierSemolinaOutletWorldPos();
  const bran = branFinisherBranOutletWorldPos();

  const oversizeBin: V3 = [oversize[0] + 0.6, 0, oversize[2] + 1.1];
  const semolinaBin: V3 = [semolina[0] - 0.4, 0, semolina[2] + 1.1];
  const branBin: V3 = [bran[0] + 0.8, 0, bran[2] + 1.0];

  const oversizeDrop: V3 = [oversizeBin[0], 0.72, oversizeBin[2]];
  const semolinaDrop: V3 = [semolinaBin[0], 0.72, semolinaBin[2]];
  const branDrop: V3 = [branBin[0], 0.72, branBin[2]];

  return (
    <>
      <ElbowedPipe
        path={[oversize, [oversize[0], oversize[1], oversizeDrop[2]], oversizeDrop]}
        radius={0.14}
        supportEvery={99}
      />
      <RejectBin position={oversizeBin} label="OVERSIZE" />

      <GravityChute start={semolina} end={semolinaDrop} topSize={0.32} bottomSize={0.2} />
      <RejectBin position={semolinaBin} label="SEMOLINA" />

      <GravityChute start={bran} end={branDrop} topSize={0.3} bottomSize={0.2} />
      <RejectBin position={branBin} label="BRAN" />
    </>
  );
}

/** Steel platforms, walkways, ladders, and frames for hybrid plant zones. */
function PlantInfrastructure() {
  const millDeckY = REF.zones.milling.millDeckY;
  const upperDeckY = REF.zones.milling.upperDeckY;
  const [rmx, , rmz] = ROLLER_MILL_POS;
  const [psx, , psz] = PLANSIFTER_POS;
  const [pux] = PURIFIER_POS;
  const [elevX, , elevZ] = ELEVATOR_POS;
  const [sepX, , sepZ] = SEPARATOR_POS;
  const [binX, , binZ] = CONDITIONING_BIN_POS;
  const [bfx] = BRAN_FINISHER_POS;
  const [pkx, , pkz] = PACKING_POS;
  const [plx, , plz] = PALLETIZER_POS;
  const [filterX, , filterZ] = bagFilterPosition();

  const millBayWidth = REF.rollerMill.width + 3.2;
  const upperBayWidth = Math.max(8, pux - psx + 5);
  const upperBayCenterX = (psx + pux) / 2;
  const cleaningWalkLen = Math.max(6, binX - sepX + 2);
  const packingWalkLen = Math.max(8, plx - pkx + 3);

  const binLadderH = REF.flourBin.legHeight + REF.flourBin.height * 0.55;
  const condLadderH = REF.conditioningBin.legHeight + REF.conditioningBin.height * 0.45;
  const filterLadderH = REF.dustSystem.bagFilterHeight * 0.85;
  const siloLadderH = REF.silo.legHeight + REF.silo.cylHeight * 0.35;

  return (
    <group>
      {/* —— Steel frames under elevated milling decks —— */}
      <SteelFrameBay
        width={millBayWidth}
        depth={5.2}
        height={millDeckY}
        position={[rmx, 0, rmz]}
        brace
      />
      <SteelFrameBay
        width={upperBayWidth}
        depth={5.5}
        height={upperDeckY}
        position={[upperBayCenterX, 0, psz]}
        brace
      />

      {/* Transfer walkway: elevator head area toward cleaning aisle */}
      <Walkway
        length={Math.abs(sepZ - elevZ) * 0.55}
        width={1.1}
        position={[elevX + 1.2, 3.2, (elevZ + sepZ) * 0.35]}
        rotation={[0, Math.PI / 2, 0]}
        railBothSides
      />
      <AccessLadder height={3.2} caged position={[elevX + 1.2, 0, elevZ + 0.8]} />

      {/* Cleaning aisle operator walkway linking machines */}
      <Walkway
        length={cleaningWalkLen}
        width={1.1}
        position={[(sepX + binX) / 2, 0.02, sepZ - REF.separator.depth / 2 - 0.85]}
        railBothSides
      />

      {/* Cross-aisle bridge: conditioning → milling deck */}
      <Walkway
        length={Math.abs(binZ - rmz) + 1.5}
        width={1.2}
        position={[(binX + rmx) / 2, millDeckY, (binZ + rmz) / 2]}
        rotation={[0, Math.PI / 2, 0]}
        railBothSides
      />
      <AccessLadder
        height={millDeckY}
        caged
        position={[binX + 1.8, 0, binZ - 1.2]}
      />

      {/* Milling mezzanine — roller mill service platform */}
      <MezzanineBay
        width={millBayWidth}
        depth={5.2}
        deckY={millDeckY}
        position={[rmx, 0, rmz]}
        ladder
        ladderSide="posZ"
        openSides={['negZ']}
        showColumns={false}
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
        showColumns={false}
      />
      <Walkway
        length={upperBayWidth - 1}
        width={1.3}
        position={[upperBayCenterX, upperDeckY, psz + 2.4]}
        railBothSides
      />

      {/* Packing operator side platform */}
      <SteelPlatform
        width={REF.packingMachine.width + 1.2}
        depth={1.4}
        position={[pkx, 0.05, pkz + REF.packingMachine.depth / 2 + 0.95]}
      />
      <SafetyRailing
        length={REF.packingMachine.width + 1.0}
        position={[pkx, 0.15, pkz + REF.packingMachine.depth / 2 + 1.55]}
      />

      {/* Packing cell side walkway (outside robot fence) */}
      <Walkway
        length={packingWalkLen}
        width={1.15}
        position={[(pkx + plx) / 2, 0.02, plz + REF.palletizer.cellSize / 2 + 1.4]}
        railBothSides
      />

      {/* Bin / tank access ladders */}
      <AccessLadder
        height={condLadderH}
        caged
        position={[binX + REF.conditioningBin.radius + 0.45, 0, binZ]}
      />
      <AccessLadder
        height={binLadderH}
        caged
        position={[FLOUR_BIN_A_POS[0] + REF.flourBin.radius + 0.4, 0, FLOUR_BIN_A_POS[2]]}
      />
      <AccessLadder
        height={binLadderH}
        caged
        position={[FLOUR_BIN_B_POS[0] + REF.flourBin.radius + 0.4, 0, FLOUR_BIN_B_POS[2]]}
      />
      <AccessLadder
        height={binLadderH}
        caged
        position={[FLOUR_BIN_C_POS[0] + REF.flourBin.radius + 0.4, 0, FLOUR_BIN_C_POS[2]]}
      />
      <AccessLadder
        height={filterLadderH}
        caged
        position={[filterX + REF.dustSystem.bagFilterWidth / 2 + 0.4, 0, filterZ]}
      />
      <AccessLadder height={siloLadderH} caged position={[REF.silo.radius + 0.55, 0, RAW_Z]} />

      {/* Bran finisher service pad with toe/rails */}
      <SteelPlatform width={3.2} depth={2.4} position={[bfx, 0.05, psz]} />
      <SafetyRailing length={3.0} position={[bfx, 0.15, psz + 1.1]} />
    </group>
  );
}

/** Elevated destoner mezzanine — deck, columns, rails, ladder. */
function DestonerPlatform() {
  const [dx, dy, dz] = DESTONER_POS;
  const { length, width } = REF.destoner;
  const deckW = length + 0.8;
  const deckD = width + 1.0;

  return (
    <group position={[dx, 0, dz]}>
      <SteelFrameBay width={deckW} depth={deckD} height={dy} brace={dy > 1.2} />
      <SteelPlatform width={deckW} depth={deckD} position={[0, dy, 0]} />
      <SafetyRailing length={deckW} position={[0, dy + 0.1, deckD / 2 - 0.04]} />
      <SafetyRailing length={deckW} position={[0, dy + 0.1, -(deckD / 2 - 0.04)]} />
      <SafetyRailing
        length={deckD}
        position={[deckW / 2 - 0.04, dy + 0.1, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <AccessLadder height={dy} position={[-(deckW / 2 + 0.35), 0, 0]} />
    </group>
  );
}

export function MaterialHandlingLine() {
  const lineActive = useLineActive();
  const twin = useTwinState();
  const navFocus = useNavFocus();
  const [wx, wy, wz] = warehouseStagingPosition();
  const [cx, , cz] = plantCenter();
  // App mounts this line under position={[-cx,0,-cz]} — convert to world for distance checks.
  const warehouseNear = useCameraNear([wx - cx, wy, wz - cz], 55);
  const warehouseFocused =
    twin.selectedId === 'warehouse' ||
    (navFocus.kind === 'machine' && navFocus.machineId === 'warehouse') ||
    (navFocus.kind === 'zone' && navFocus.zone === 'warehouse');
  const showWarehouse = warehouseNear || warehouseFocused;

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
  const palletInlet = palletizerInletWorldPos();
  const palletOutlet = palletizerOutletWorldPos();
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
  const [plx, ply, plz] = PALLETIZER_POS;
  const deckY = destonerDeckY();

  const wheatPath: V3[] = useMemo(() => {
    const h = REF.elevator.height;
    return [
      [0, SILO_OUTLET_Y + 1.5, RAW_Z],
      [0, SILO_OUTLET_Y, RAW_Z],
      [0, bridgeY, RAW_Z],
      [ductStartX(), bridgeY, RAW_Z],
      [HOPPER_X, bridgeY, RAW_Z],
      [HOPPER_X, inletY, RAW_Z],
      [HOPPER_X, hopperTopY() * 0.7, RAW_Z],
      [HOPPER_X, hopperOutletY(), RAW_Z],
      [HOPPER_X, VALVE_Y, RAW_Z],
      [SCREW_X, valveOutletY(), RAW_Z],
      [SCREW_X, screwInletTopY(), RAW_Z],
      [SCREW_X + REF.screw.length * 0.5, screwDischargeY(), RAW_Z],
      [screwDischargeX(), screwDischargeY(), RAW_Z],
      bootInlet,
      [elevX, REF.elevator.bootHeight + 1, RAW_Z],
      [elevX, h * 0.45, RAW_Z],
      [elevX, h * 0.85, RAW_Z],
      headOutlet,
      separatorInlet,
      [sepX, REF.separator.frameHeight / 2, sepZ],
      separatorCleanOut,
      destonerInlet,
      [dx, dy + deckY, dz],
      destonerCleanOut,
      [magneticInlet[0], destonerCleanOut[1], magneticInlet[2]],
      magneticInlet,
      [mx, my, mz],
      magneticOutlet,
      [scourerInlet[0], magneticOutlet[1], scourerInlet[2]],
      scourerInlet,
      [scx, scy, scz],
      scourerOutlet,
      [dampenerInlet[0], scourerOutlet[1], dampenerInlet[2]],
      dampenerInlet,
      [dampX, dampY, dampZ],
      dampenerOutlet,
      [binInlet[0], dampenerOutlet[1], binInlet[2]],
      binInlet,
      [binX, binInlet[1] * 0.55, binZ],
      binOutlet,
      [millInlet[0], binOutlet[1], binOutlet[2]],
      [millInlet[0], binOutlet[1], millInlet[2]],
      millInlet,
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
  ]);

  const flourPath: V3[] = useMemo(() => {
    const headerZ = faz + 2.2;
    const headerY = flourBinAInlet[1];
    return [
      millInlet,
      [rmx, rmy, rmz],
      millOutlet,
      [sifterInlet[0], millOutlet[1], sifterInlet[2]],
      sifterInlet,
      [psx, psy, psz],
      flourOut,
      [flourOut[0], headerY, flourOut[2]],
      [flourOut[0], headerY, headerZ],
      [fax, headerY, headerZ],
      flourBinAInlet,
      [fax, fay + REF.flourBin.legHeight + REF.flourBin.height * 0.5, faz],
      flourBinAOutlet,
      [flourBinAOutlet[0], flourBinAOutlet[1], packingInlet[2]],
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
      palletInlet,
      [plx, ply + 1.2, plz],
      palletOutlet,
    ];
  }, [
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
    palletInlet,
    palletOutlet,
    plx,
    ply,
    plz,
  ]);

  return (
    <group>
      <FloorMarkings />
      <SafetyProps />
      <EnvironmentalWear />
      <EquipmentIds />
      <PlantInfrastructure />
      <DustCollection active={lineActive} />
      <Electrical active={lineActive} />

      {buildMachineRegistry().map((m) => (
        <SelectableMachine key={m.id} id={m.id} position={m.position} size={m.size} />
      ))}

      <FocusableGroup machineId="silo">
        <group position={SILO_POS}>
          <SiloModel />
        </group>
      </FocusableGroup>

      <group position={[0, 0, RAW_Z]}>
        <SlideGate position={[0, SILO_OUTLET_Y, 0]} />
        <ElbowedPipe
          path={[
            [0, SILO_OUTLET_Y, 0],
            [0, bridgeY, 0],
            [HOPPER_X, bridgeY, 0],
            [HOPPER_X, inletY, 0],
          ]}
          radius={spoutR}
          supportEvery={2.5}
          flangeSize={spoutR * 2.4}
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
      </group>

      <ScrewToElevatorSpout />

      <FocusableGroup machineId="elevator">
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
      </FocusableGroup>

      {/* Elevator head discharge → Vibro Separator feed inlet */}
      <ElevatorToSeparatorDuct />

      {/* Vibro Separator (pre-cleaner) */}
      <FocusableGroup machineId="vibro">
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
      </FocusableGroup>
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
      <FocusableGroup machineId="conditioning_bin">
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
      </FocusableGroup>

      {/* Conditioning Bin → Roller Mill */}
      <ConditioningBinToRollerMillDuct />

      <FocusableGroup machineId="roller_mill">
        <RollerMillComponent
          position={ROLLER_MILL_POS}
          width={REF.rollerMill.width}
          height={REF.rollerMill.height}
          depth={REF.rollerMill.depth}
          active={lineActive}
          showDataPanel={false}
          showClickText={false}
        />
      </FocusableGroup>
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

      <FocusableGroup machineId="flour_bin_a">
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
      </FocusableGroup>
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

      <FocusableGroup machineId="packing">
        <PackingMachineComponent
          position={PACKING_POS}
          width={REF.packingMachine.width}
          depth={REF.packingMachine.depth}
          height={REF.packingMachine.height}
          active={lineActive}
          showDataPanel={false}
          showClickText={false}
        />
      </FocusableGroup>

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
      <FocusableGroup machineId="check_weigher">
        <CheckWeigherComponent
          position={CHECK_WEIGHER_POS}
          length={REF.checkWeigher.length}
          width={REF.checkWeigher.width}
          height={REF.checkWeigher.height}
          active={lineActive}
          showDataPanel={false}
          showClickText={false}
        />
      </FocusableGroup>

      {/* Check Weigher → Metal Detector (length along +X toward palletizer) */}
      <FocusableGroup machineId="metal_detector">
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
      </FocusableGroup>

      {/* Metal Detector → Robotic Palletizer (final packing cell) */}
      <FocusableGroup machineId="palletizer">
        <MachineLOD
          position={PALLETIZER_POS}
          distance={32}
          full={
            <PalletizerComponent
              position={[0, 0, 0]}
              cellSize={REF.palletizer.cellSize}
              height={REF.palletizer.height}
              active={lineActive}
              showDataPanel={false}
              showClickText={false}
            />
          }
          simple={
            <mesh position={[0, 1.5, 0]} castShadow={false}>
              <boxGeometry args={[5, 3, 5]} />
              <meshStandardMaterial color="#6a7278" />
            </mesh>
          }
        />
      </FocusableGroup>

      <FocusableGroup machineId="warehouse">
        {showWarehouse && (
          <WarehouseStaging active={lineActive} position={[wx, wy, wz]} />
        )}
      </FocusableGroup>

      {/* Packing cell belt bridges + byproduct gravity chutes */}
      <PackingCellBridges />
      <ByproductChutes />

      <MaterialFlow path={wheatPath} kind="wheat" active={lineActive} speed={0.065} />
      <MaterialFlow path={flourPath} kind="flour" active={lineActive} speed={0.075} />
      <DustMotes position={dustTakeoffWorldPos('vibro')} active={lineActive} />
    </group>
  );
}

export default MaterialHandlingLine;
