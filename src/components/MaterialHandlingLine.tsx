'use client';

/**
 * MaterialHandlingLine — full flour mill line:
 * Silo → Hopper → Rotary Valve → Screw Conveyor → Bucket Elevator
 */

import { useMemo, useState } from 'react';
import * as THREE from 'three';
import SiloModel, { SILO_OUTLET_Y, SILO_OUTLET_RADIUS } from './Silo';
import { FeedHopperComponent } from './FeedHopper';
import { RotaryValveComponent } from './RotaryValve';
import { ScrewConveyorComponent } from './ScrewConveyor';
import { BucketElevatorComponent } from './bucketElivter';
import { VibroSeparatorComponent } from './VibroSeparator';
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

export function MaterialHandlingLine() {
  const [lineActive, setLineActive] = useState(true);

  const bridgeY = ductBridgeY();
  const inletY = hopperTopY() + 0.02;
  const spoutR = SILO_OUTLET_RADIUS * 1.6;
  const bootInlet = elevatorBootInlet();
  const headOutlet = elevatorHeadOutlet();
  const separatorInlet = separatorInletWorldPos();
  const separatorCleanOut = separatorCleanOutletPos();
  const [elevX] = ELEVATOR_POS;
  const [sepX, , sepZ] = SEPARATOR_POS;

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
    ];
  }, [bridgeY, inletY, bootInlet, headOutlet, elevX, separatorInlet, separatorCleanOut, sepX, sepZ]);

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

      <MaterialFlow path={flowPath} active={lineActive} speed={0.07} />
    </group>
  );
}

export default MaterialHandlingLine;
