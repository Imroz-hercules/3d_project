'use client';

/**
 * Plant electrical infrastructure for the flour mill digital twin.
 * MCC lineup, PLC cabinet, overhead cable trays, drops, and local operator panels.
 */

import {
  REF,
  cableTrayY,
  cleaningCableTraySpan,
  elevatorPosition,
  localPanelWorldPos,
  mccPosition,
  millingCableTraySpan,
  packingMachinePosition,
  palletizerPosition,
  plcCabinetPosition,
  rollerMillPosition,
  separatorPosition,
  destonerPosition,
  scourerPosition,
  dampenerPosition,
  conditioningBinPosition,
  plansifterPosition,
  branFinisherPosition,
  flourBinPosition,
  bagConveyorPosition,
  checkWeigherPosition,
  metalDetectorPosition,
} from '../layoutConstants';

type V3 = [number, number, number];

const COLORS = {
  tray: '#9aa3ab',
  trayDark: '#7a848c',
  cabinet: '#2a3036',
  cabinetDoor: '#3a424a',
  accent: '#c9a227',
  hmiBezel: '#1a1e22',
  hmiScreen: '#1e3a4a',
  hmiGlow: '#3ecf8e',
  estop: '#c62828',
  start: '#2e7d32',
  stop: '#ef6c00',
  conduit: '#6a7278',
  label: '#d4d8dc',
} as const;

/* ==========================================================================
   PRIMITIVES
   ========================================================================== */

function CableTraySegment({
  start,
  end,
  width = REF.electrical.trayWidth,
  depth = REF.electrical.trayDepth,
}: {
  start: V3;
  end: V3;
  width?: number;
  depth?: number;
}) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];
  const len = Math.hypot(dx, dy, dz);
  if (len < 0.05) return null;
  const mid: V3 = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2];
  const yaw = Math.atan2(dx, dz);
  const pitch = Math.atan2(dy, Math.hypot(dx, dz));
  return (
    <group position={mid} rotation={[pitch, yaw, 0]}>
      {/* Tray bottom */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, depth * 0.35, len]} />
        <meshStandardMaterial color={COLORS.tray} metalness={0.55} roughness={0.4} />
      </mesh>
      {/* Side rails */}
      <mesh position={[width / 2 - 0.02, depth * 0.35, 0]} castShadow>
        <boxGeometry args={[0.04, depth, len]} />
        <meshStandardMaterial color={COLORS.trayDark} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-(width / 2 - 0.02), depth * 0.35, 0]} castShadow>
        <boxGeometry args={[0.04, depth, len]} />
        <meshStandardMaterial color={COLORS.trayDark} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Rung hints */}
      {Array.from({ length: Math.max(1, Math.floor(len / 0.8)) }, (_, i) => {
        const t = (i + 1) / (Math.floor(len / 0.8) + 1);
        const z = -len / 2 + t * len;
        return (
          <mesh key={i} position={[0, depth * 0.15, z]}>
            <boxGeometry args={[width - 0.06, 0.02, 0.04]} />
            <meshStandardMaterial color={COLORS.trayDark} metalness={0.5} roughness={0.45} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Vertical conduit drop from tray height to a machine junction box. */
function CableDrop({
  trayPoint,
  target,
}: {
  trayPoint: V3;
  target: V3;
}) {
  const dropH = Math.abs(trayPoint[1] - target[1]);
  const midY = (trayPoint[1] + target[1]) / 2;
  const elbow: V3 = [target[0], trayPoint[1], trayPoint[2]];
  return (
    <group>
      <CableTraySegment start={trayPoint} end={elbow} width={0.12} depth={0.08} />
      <mesh position={[target[0], midY, trayPoint[2]]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, dropH, 8]} />
        <meshStandardMaterial color={COLORS.conduit} metalness={0.65} roughness={0.4} />
      </mesh>
      {/* Short run from tray Z to machine Z at target height */}
      <mesh
        position={[target[0], target[1], (trayPoint[2] + target[2]) / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[0.03, 0.03, Math.max(0.05, Math.abs(trayPoint[2] - target[2])), 8]}
        />
        <meshStandardMaterial color={COLORS.conduit} metalness={0.65} roughness={0.4} />
      </mesh>
      <mesh position={target} castShadow>
        <boxGeometry args={[0.18, 0.14, 0.12]} />
        <meshStandardMaterial color={COLORS.cabinet} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

function LocalControlPanel({
  position,
  label,
  active = true,
  rotationY = 0,
}: {
  position: V3;
  label: string;
  active?: boolean;
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Pedestal / stand */}
      <mesh position={[0, -0.55, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.1, 10]} />
        <meshStandardMaterial color={COLORS.trayDark} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -1.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 16]} />
        <meshStandardMaterial color={COLORS.cabinet} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Enclosure */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.7, 0.22]} />
        <meshStandardMaterial color={COLORS.cabinet} metalness={0.45} roughness={0.5} />
      </mesh>
      {/* HMI screen */}
      <mesh position={[0, 0.12, 0.12]} castShadow>
        <boxGeometry args={[0.38, 0.28, 0.03]} />
        <meshStandardMaterial color={COLORS.hmiBezel} metalness={0.4} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.12, 0.14]}>
        <boxGeometry args={[0.32, 0.22, 0.01]} />
        <meshStandardMaterial
          color={COLORS.hmiScreen}
          emissive={active ? COLORS.hmiGlow : '#1a2024'}
          emissiveIntensity={active ? 0.45 : 0.05}
          roughness={0.3}
        />
      </mesh>
      {/* Start / Stop / E-stop */}
      <mesh position={[-0.14, -0.2, 0.12]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 12]} />
        <meshStandardMaterial color={COLORS.start} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.2, 0.12]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 12]} />
        <meshStandardMaterial color={COLORS.stop} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0.14, -0.2, 0.12]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.05, 12]} />
        <meshStandardMaterial color={COLORS.estop} metalness={0.25} roughness={0.45} />
      </mesh>
      {/* Label plate */}
      <mesh position={[0, 0.32, 0.12]}>
        <boxGeometry args={[0.42, 0.08, 0.015]} />
        <meshStandardMaterial color={COLORS.accent} metalness={0.35} roughness={0.55} />
      </mesh>
    </group>
  );
}

function MccLineup({ active = true }: { active?: boolean }) {
  const [mx, , mz] = mccPosition();
  const { mccWidth: w, mccDepth: d, mccHeight: h } = REF.electrical;
  const sections = 6;
  const sectionW = w / sections;

  return (
    <group position={[mx, 0, mz]}>
      {/* Base plinth */}
      <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
        <boxGeometry args={[w + 0.15, 0.16, d + 0.15]} />
        <meshStandardMaterial color="#3a4046" metalness={0.5} roughness={0.55} />
      </mesh>
      {Array.from({ length: sections }, (_, i) => {
        const x = -w / 2 + sectionW / 2 + i * sectionW;
        return (
          <group key={i} position={[x, h / 2 + 0.16, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[sectionW - 0.04, h, d]} />
              <meshStandardMaterial color={COLORS.cabinet} metalness={0.5} roughness={0.45} />
            </mesh>
            {/* Door seam */}
            <mesh position={[0, 0, d / 2 + 0.01]}>
              <boxGeometry args={[sectionW - 0.1, h - 0.15, 0.02]} />
              <meshStandardMaterial color={COLORS.cabinetDoor} metalness={0.45} roughness={0.5} />
            </mesh>
            {/* Handle */}
            <mesh position={[sectionW * 0.28, 0, d / 2 + 0.04]} castShadow>
              <boxGeometry args={[0.04, 0.22, 0.04]} />
              <meshStandardMaterial color={COLORS.tray} metalness={0.7} roughness={0.35} />
            </mesh>
            {/* Status lamp */}
            <mesh position={[0, h * 0.35, d / 2 + 0.03]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial
                color={active ? COLORS.hmiGlow : COLORS.estop}
                emissive={active ? COLORS.hmiGlow : COLORS.estop}
                emissiveIntensity={0.8}
              />
            </mesh>
            {/* Vent louvers */}
            {[-0.25, 0, 0.25].map((vy) => (
              <mesh key={vy} position={[0, vy - 0.15, d / 2 + 0.02]}>
                <boxGeometry args={[sectionW * 0.55, 0.03, 0.01]} />
                <meshStandardMaterial color="#1a1e22" metalness={0.4} roughness={0.6} />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* Nameplate */}
      <mesh position={[0, h + 0.28, d / 2 + 0.02]}>
        <boxGeometry args={[1.4, 0.2, 0.03]} />
        <meshStandardMaterial color={COLORS.accent} metalness={0.35} roughness={0.55} />
      </mesh>
    </group>
  );
}

function PlcCabinet({ active = true }: { active?: boolean }) {
  const [px, , pz] = plcCabinetPosition();
  const { plcWidth: w, plcDepth: d, plcHeight: h } = REF.electrical;
  return (
    <group position={[px, 0, pz]}>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + 0.1, 0.12, d + 0.1]} />
        <meshStandardMaterial color="#3a4046" metalness={0.5} roughness={0.55} />
      </mesh>
      <mesh position={[0, h / 2 + 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={COLORS.cabinet} metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[0, h * 0.55, d / 2 + 0.02]}>
        <boxGeometry args={[w * 0.7, h * 0.35, 0.02]} />
        <meshStandardMaterial
          color={COLORS.hmiScreen}
          emissive={active ? '#2a6a8a' : '#1a2024'}
          emissiveIntensity={active ? 0.35 : 0.05}
        />
      </mesh>
      <mesh position={[0, h * 0.15, d / 2 + 0.03]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
        <meshStandardMaterial color={COLORS.estop} metalness={0.25} roughness={0.45} />
      </mesh>
      <mesh position={[0, h + 0.22, d / 2]}>
        <boxGeometry args={[0.55, 0.12, 0.02]} />
        <meshStandardMaterial color={COLORS.accent} metalness={0.35} roughness={0.55} />
      </mesh>
    </group>
  );
}

function TraySpines() {
  const clean = cleaningCableTraySpan();
  const mill = millingCableTraySpan();
  // Cross-aisle bridge near conditioning → milling transfer
  const bridgeStart: V3 = [clean.endX - 1.5, clean.y, clean.z];
  const bridgeEnd: V3 = [mill.startX + 2, mill.y, mill.z];

  return (
    <group>
      <CableTraySegment
        start={[clean.startX, clean.y, clean.z]}
        end={[clean.endX, clean.y, clean.z]}
      />
      <CableTraySegment
        start={[mill.startX, mill.y, mill.z]}
        end={[mill.endX, mill.y, mill.z]}
      />
      <CableTraySegment start={bridgeStart} end={bridgeEnd} width={0.35} />
    </group>
  );
}

function CableDrops() {
  const clean = cleaningCableTraySpan();
  const mill = millingCableTraySpan();
  const y = cableTrayY();

  const cleaningTargets: V3[] = [
    elevatorPosition(),
    separatorPosition(),
    destonerPosition(),
    scourerPosition(),
    dampenerPosition(),
    conditioningBinPosition(),
  ].map(([x, , z]) => [x, 1.8, z] as V3);

  const millingTargets: V3[] = [
    rollerMillPosition(),
    plansifterPosition(),
    branFinisherPosition(),
    flourBinPosition('A'),
    packingMachinePosition(),
    bagConveyorPosition(),
    checkWeigherPosition(),
    metalDetectorPosition(),
    palletizerPosition(),
  ].map(([x, , z]) => [x, 1.6, z] as V3);

  return (
    <group>
      {cleaningTargets.map((t, i) => (
        <CableDrop
          key={`c-${i}`}
          trayPoint={[t[0], y, clean.z]}
          target={t}
        />
      ))}
      {millingTargets.map((t, i) => (
        <CableDrop
          key={`m-${i}`}
          trayPoint={[t[0], y, mill.z]}
          target={t}
        />
      ))}
    </group>
  );
}

function LocalPanels({ active }: { active: boolean }) {
  return (
    <group>
      <LocalControlPanel
        position={localPanelWorldPos('elevator')}
        label="ELEVATOR"
        active={active}
        rotationY={Math.PI}
      />
      <LocalControlPanel
        position={localPanelWorldPos('mill')}
        label="MILL"
        active={active}
      />
      <LocalControlPanel
        position={localPanelWorldPos('packing')}
        label="PACKING"
        active={active}
      />
      <LocalControlPanel
        position={localPanelWorldPos('palletizer')}
        label="PALLETIZER"
        active={active}
        rotationY={-Math.PI / 2}
      />
    </group>
  );
}

/* ==========================================================================
   ASSEMBLY
   ========================================================================== */

export function Electrical({ active = true }: { active?: boolean }) {
  return (
    <group name="electrical">
      <MccLineup active={active} />
      <PlcCabinet active={active} />
      <TraySpines />
      <CableDrops />
      <LocalPanels active={active} />
    </group>
  );
}

export default Electrical;
