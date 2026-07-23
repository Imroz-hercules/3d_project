'use client';

/**
 * Shared dust-collection utility for the flour mill digital twin.
 * Header along cleaning aisle → bag filter → centrifugal fan → exhaust stack.
 * Branch takeoffs from vibro, destoner, scourer, purifier, packing hood.
 */

import {
  REF,
  bagFilterFanWorldPos,
  bagFilterInletWorldPos,
  bagFilterPosition,
  dustHeaderPointAtX,
  dustHeaderSpan,
  dustStackBaseWorldPos,
  dustTakeoffWorldPos,
} from '../layoutConstants';
import {
  ElbowedPipe,
  PIPE_COLORS,
  PneumaticTee,
  RoundDuct,
  SquareFlange,
  type V3,
} from './ProcessPiping';

const DUST = PIPE_COLORS.dust;

function BagFilterHouse() {
  const [bx, by, bz] = bagFilterPosition();
  const { bagFilterWidth: w, bagFilterDepth: d, bagFilterHeight: h } = REF.dustSystem;
  return (
    <group position={[bx, by, bz]}>
      {/* Legs */}
      {[
        [w / 2 - 0.15, h / 2 - 0.15],
        [-(w / 2 - 0.15), h / 2 - 0.15],
        [w / 2 - 0.15, -(d / 2 - 0.15)],
        [-(w / 2 - 0.15), -(d / 2 - 0.15)],
      ].map(([lx, lz], i) => (
        <mesh key={i} position={[lx as number, h * 0.08, lz as number]} castShadow>
          <boxGeometry args={[0.14, h * 0.16, 0.14]} />
          <meshStandardMaterial color="#3a4046" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {/* Main housing */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#4a525a" metalness={0.55} roughness={0.45} />
      </mesh>
      {/* Hopper bottom */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.35, w * 0.35, 0.9, 4]} />
        <meshStandardMaterial color="#3a4248" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Access door panel */}
      <mesh position={[0, h * 0.45, d / 2 + 0.02]} castShadow>
        <boxGeometry args={[w * 0.55, h * 0.35, 0.04]} />
        <meshStandardMaterial color="#5a636c" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Pulse valves row on roof */}
      {[-0.6, 0, 0.6].map((ox) => (
        <mesh key={ox} position={[ox, h + 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.24, 10]} />
          <meshStandardMaterial color="#6a7278" metalness={0.65} roughness={0.35} />
        </mesh>
      ))}
      {/* Nameplate */}
      <mesh position={[0, h * 0.72, d / 2 + 0.03]}>
        <boxGeometry args={[0.9, 0.22, 0.02]} />
        <meshStandardMaterial color="#c9a227" metalness={0.35} roughness={0.55} />
      </mesh>
    </group>
  );
}

/** Centrifugal fan (O) at filter clean-air outlet. */
function CentrifugalFan() {
  const [fx, fy, fz] = bagFilterFanWorldPos();
  const r = REF.dustSystem.fanRadius;
  return (
    <group position={[fx, fy, fz]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, 0.35, 20]} />
        <meshStandardMaterial color="#3a4048" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r * 0.35, r * 0.35, 0.5, 12]} />
        <meshStandardMaterial color="#5a6268" metalness={0.65} roughness={0.4} />
      </mesh>
      {/* Motor */}
      <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.4, 12]} />
        <meshStandardMaterial color="#2a3036" metalness={0.6} roughness={0.45} />
      </mesh>
      <SquareFlange size={r * 2.1} thickness={0.05} position={[-0.22, 0, 0]} />
    </group>
  );
}

function ExhaustStack() {
  const [sx, sy, sz] = dustStackBaseWorldPos();
  const { stackHeight, stackRadius } = REF.dustSystem;
  const top: V3 = [sx, sy + stackHeight, sz];
  return (
    <group>
      <ElbowedPipe
        path={[
          [sx - 0.55, sy, sz],
          [sx, sy, sz],
          top,
        ]}
        radius={stackRadius}
        supportEvery={2.2}
        color={DUST}
      />
      {/* Rain cap */}
      <mesh position={[sx, sy + stackHeight + 0.15, sz]} castShadow>
        <cylinderGeometry args={[stackRadius * 1.6, stackRadius * 0.4, 0.2, 12]} />
        <meshStandardMaterial color="#3a4046" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Rise from machine hood → header elevation → tee on dust header. */
function DustTakeoff({
  machine,
}: {
  machine: 'vibro' | 'destoner' | 'scourer' | 'purifier' | 'packing';
}) {
  const hood = dustTakeoffWorldPos(machine);
  const headerY = dustHeaderSpan().y;
  const headerZ = dustHeaderSpan().z;
  const rise: V3 = [hood[0], headerY, hood[2]];
  const join: V3 = [hood[0], headerY, headerZ];
  const r = REF.dustSystem.branchRadius;

  // Packing is on milling Z — route X then Z to header before joining at bag-filter end
  if (machine === 'packing') {
    const { endX } = dustHeaderSpan();
    const midZ: V3 = [hood[0], headerY, headerZ];
    const alongHeader: V3 = [endX - 0.5, headerY, headerZ];
    return (
      <group>
        <ElbowedPipe
          path={[hood, rise, midZ, alongHeader]}
          radius={r}
          supportEvery={2.5}
          color={DUST}
        />
        <PneumaticTee position={alongHeader} radius={r} color={DUST} />
        {/* Simple packing dust hood canopy */}
        <mesh position={[hood[0], hood[1] - 0.15, hood[2]]} castShadow>
          <boxGeometry args={[1.6, 0.08, 1.2]} />
          <meshStandardMaterial color="#3a4046" metalness={0.55} roughness={0.45} />
        </mesh>
      </group>
    );
  }

  // Purifier is on milling aisle (−Z) — rise then cross to cleaning header Z
  if (machine === 'purifier') {
    const cross: V3 = [hood[0], headerY, headerZ];
    return (
      <group>
        <ElbowedPipe path={[hood, rise, cross]} radius={r} supportEvery={2.5} color={DUST} />
        <PneumaticTee position={cross} radius={r} color={DUST} />
      </group>
    );
  }

  return (
    <group>
      <ElbowedPipe path={[hood, rise, join]} radius={r} supportEvery={99} color={DUST} />
      <PneumaticTee position={join} radius={r} color={DUST} />
    </group>
  );
}

function DustHeader() {
  const span = dustHeaderSpan();
  const start: V3 = [span.startX, span.y, span.z];
  const end: V3 = [span.endX, span.y, span.z];
  const inlet = bagFilterInletWorldPos();
  const riserTop: V3 = [span.endX, span.y, span.z];
  const riserDrop: V3 = [span.endX, inlet[1], span.z];
  const toInlet: V3 = [inlet[0], inlet[1], inlet[2]];

  return (
    <group>
      <ElbowedPipe
        path={[start, end]}
        radius={REF.dustSystem.headerRadius}
        supportEvery={2.5}
        color={DUST}
      />
      {/* Cap dead end */}
      <mesh position={start} castShadow>
        <sphereGeometry args={[REF.dustSystem.headerRadius * 1.1, 10, 8]} />
        <meshStandardMaterial color={DUST} metalness={0.55} roughness={0.4} />
      </mesh>
      {/* Header → bag filter inlet */}
      <ElbowedPipe
        path={[riserTop, riserDrop, toInlet]}
        radius={REF.dustSystem.headerRadius}
        supportEvery={99}
        color={DUST}
      />
    </group>
  );
}

export function DustCollection() {
  return (
    <group name="dust-collection">
      <DustHeader />
      <DustTakeoff machine="vibro" />
      <DustTakeoff machine="destoner" />
      <DustTakeoff machine="scourer" />
      <DustTakeoff machine="purifier" />
      <DustTakeoff machine="packing" />
      <BagFilterHouse />
      <CentrifugalFan />
      <ExhaustStack />
      {/* Short dirty-air nipple into filter — visual continuity */}
      <RoundDuct
        start={dustHeaderPointAtX(dustHeaderSpan().endX)}
        end={[
          bagFilterInletWorldPos()[0],
          dustHeaderSpan().y,
          dustHeaderSpan().z,
        ]}
        radius={REF.dustSystem.headerRadius * 0.95}
        color={DUST}
      />
    </group>
  );
}

export default DustCollection;
