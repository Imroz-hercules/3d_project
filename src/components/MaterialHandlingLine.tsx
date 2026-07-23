'use client';

/**
 * MaterialHandlingLine — full flour mill line:
 * Silo → Hopper → Rotary Valve → Screw Conveyor → Bucket Elevator
 * → Vibro Separator → Destoner → Magnetic Separator → Scourer
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
import { MaterialFlow } from './MaterialFlow';
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
  const [elevX] = ELEVATOR_POS;
  const [sepX, , sepZ] = SEPARATOR_POS;
  const [dx, dy, dz] = DESTONER_POS;
  const [mx, my, mz] = MAGNETIC_POS;
  const [scx, scy, scz] = SCOURER_POS;
  const deckY = destonerDeckY();

  const flowPath: V3[] = useMemo(() => {
    const h = REF.elevator.height;
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
  ]);

  return (
    <group onClick={() => setLineActive((v) => !v)}>
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

      <MaterialFlow path={flowPath} active={lineActive} speed={0.07} />
    </group>
  );
}

export default MaterialHandlingLine;
