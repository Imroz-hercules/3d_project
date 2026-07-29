'use client';

/**
 * FeedHopper — HIGH-FIDELITY INDUSTRIAL SURGE HOPPER
 * ------------------------------------------------------------------------
 * NVIDIA Omniverse-style realism: beveled edges, panel seams, bolt rows,
 * gusset plates, weld lines, inspection hatches, PBR clearcoat materials.
 * Every surface shows construction detail visible at zoom.
 *
 * Structure (bottom → top):
 *   4 legs + base plates → funnel with stiffeners → box with panel seams
 *   → bolted lid with hinges/handle → vent with mesh screen
 *
 * Keeps same interface & layout constants as original.
 */

import { useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { FlourFill } from './MaterialFlow';
import { REF, hopperFunnelTopY, hopperOutletY, hopperTopY } from './layoutConstants';

/* ==========================================================================
   1. ENHANCED PBR MATERIALS (Omniverse-style)
   ========================================================================== */

/** Painted steel with clearcoat — main body finish */
const matPaintedSteel = new THREE.MeshPhysicalMaterial({
  color: '#b8c0c8',
  metalness: 0.55,
  roughness: 0.42,
  clearcoat: 0.35,
  clearcoatRoughness: 0.4,
  reflectivity: 0.6,
});

/** Raw steel — darker, higher metalness for structural parts */
const matSteel = new THREE.MeshPhysicalMaterial({
  color: '#8a9199',
  metalness: 0.78,
  roughness: 0.48,
  clearcoat: 0.15,
  clearcoatRoughness: 0.5,
});

/** Dark structural steel — legs, gussets, brackets */
const matStructure = new THREE.MeshStandardMaterial({
  color: '#4a5058',
  metalness: 0.82,
  roughness: 0.52,
});

/** Bolt material — high metalness, low roughness */
const matBolt = new THREE.MeshStandardMaterial({
  color: '#2a2e32',
  metalness: 0.92,
  roughness: 0.28,
});

/** Yellow safety/warning material */
const matSafetyYellow = new THREE.MeshStandardMaterial({
  color: '#e0a92c',
  metalness: 0.5,
  roughness: 0.55,
});

/** Glass for inspection window */
const matGlass = new THREE.MeshPhysicalMaterial({
  color: '#dfe9ee',
  transparent: true,
  opacity: 0.35,
  roughness: 0.05,
  transmission: 0.6,
  thickness: 0.05,
  side: THREE.DoubleSide,
});

/** Rubber gasket material */
const matGasket = new THREE.MeshStandardMaterial({
  color: '#1a1a1a',
  metalness: 0.0,
  roughness: 0.95,
});

/* ==========================================================================
   2. CONFIG / LAYOUT
   ========================================================================== */

type V3 = [number, number, number];

function taperedGeo(topW: number, topD: number, botW: number, botD: number, h: number) {
  const geo = new THREE.BufferGeometry();
  const hw = topW / 2, hd = topD / 2, bw = botW / 2, bd = botD / 2;
  const v = new Float32Array([
    -hw, h, -hd, hw, h, -hd, hw, h, hd, -hw, h, hd,
    -bw, 0, -bd, bw, 0, -bd, bw, 0, bd, -bw, 0, bd,
  ]);
  geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
  geo.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,4,5,0,5,1,2,6,7,2,7,3,0,3,7,0,7,4,1,5,6,1,6,2]);
  geo.computeVertexNormals();
  return geo;
}

/* ==========================================================================
   3. DETAIL HELPERS
   ========================================================================== */

/** Single hex bolt (head + shank) */
function Bolt({ position, rotation = [0, 0, 0] as V3, size = 0.022 }: { position: V3; rotation?: V3; size?: number }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Shank */}
      <mesh material={matBolt}>
        <cylinderGeometry args={[size * 0.6, size * 0.6, size * 1.5, 12]} />
      </mesh>
      {/* Hex head */}
      <mesh position={[0, size * 0.8, 0]} material={matBolt}>
        <cylinderGeometry args={[size, size, size * 0.5, 6]} />
      </mesh>
      {/* Head top highlight */}
      <mesh position={[0, size * 1.05, 0]} material={matSteel}>
        <cylinderGeometry args={[size * 0.7, size * 0.7, size * 0.05, 6]} />
      </mesh>
    </group>
  );
}

/** Bolt circle on a flange */
function BoltCircle({ radius, count, y = 0, size = 0.02 }: { radius: number; count: number; y?: number; size?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <Bolt
            key={i}
            position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}
            rotation={[Math.PI / 2, 0, -a]}
            size={size}
          />
        );
      })}
    </>
  );
}

/** Gusset plate (triangular reinforcement) */
function Gusset({ position, rotation, width, height, thickness = 0.04 }: {
  position: V3; rotation: V3; width: number; height: number; thickness?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow material={matStructure}>
      <boxGeometry args={[width, height, thickness]} />
    </mesh>
  );
}

/** Weld seam line (raised strip) */
function WeldSeam({ position, rotation, length, width = 0.015, height = 0.008 }: {
  position: V3; rotation: V3; length: number; width?: number; height?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} material={matSteel}>
      <boxGeometry args={[width, length, height]} />
    </mesh>
  );
}

/* ==========================================================================
   4. SUPPORT LEGS WITH BASE PLATES & GUSSETS
   ========================================================================== */

function SupportLegs({ width, depth, baseHeight, funnelHeight }: {
  width: number; depth: number; baseHeight: number; funnelHeight: number;
}) {
  const legCount = 4;
  const legHeight = baseHeight + funnelHeight * 0.3;
  const legPositions: V3[] = [
    [width / 2 - 0.15, legHeight / 2, depth / 2 - 0.15],
    [-width / 2 + 0.15, legHeight / 2, depth / 2 - 0.15],
    [width / 2 - 0.15, legHeight / 2, -depth / 2 + 0.15],
    [-width / 2 + 0.15, legHeight / 2, -depth / 2 + 0.15],
  ];

  return (
    <group>
      {legPositions.map((pos, i) => {
        // Gusset angles (from leg to box corner)
        const boxCornerX = pos[0] * (width / 2) / (width / 2 - 0.15);
        const boxCornerZ = pos[2] * (depth / 2) / (depth / 2 - 0.15);
        return (
          <group key={i}>
            {/* Main leg (I-beam simulation) */}
            <mesh position={pos} castShadow receiveShadow material={matStructure}>
              <boxGeometry args={[0.12, legHeight, 0.12]} />
            </mesh>
            {/* I-beam flanges */}
            <mesh position={[pos[0], pos[1], pos[2]]} material={matStructure}>
              <boxGeometry args={[0.14, legHeight, 0.04]} />
            </mesh>
            <mesh position={[pos[0], pos[1], pos[2]]} material={matStructure}>
              <boxGeometry args={[0.04, legHeight, 0.14]} />
            </mesh>

            {/* Base plate */}
            <mesh position={[pos[0], 0.04, pos[2]]} castShadow material={matStructure}>
              <boxGeometry args={[0.35, 0.08, 0.35]} />
            </mesh>

            {/* Anchor bolts (4 per base plate) */}
            {[-0.12, 0.12].map((dx) =>
              [-0.12, 0.12].map((dz) => (
                <Bolt key={`${dx}-${dz}`} position={[pos[0] + dx, 0.09, pos[2] + dz]} size={0.018} />
              ))
            )}

            {/* Top gusset plate (leg to box) */}
            <Gusset
              position={[pos[0] * 0.85, legHeight - 0.15, pos[2] * 0.85]}
              rotation={[0, Math.atan2(pos[2], pos[0]), 0.3]}
              width={0.25}
              height={0.35}
            />
          </group>
        );
      })}

      {/* Cross bracing between legs */}
      {[
        { start: legPositions[0], end: legPositions[1] },
        { start: legPositions[1], end: legPositions[3] },
        { start: legPositions[3], end: legPositions[2] },
        { start: legPositions[2], end: legPositions[0] },
      ].map((brace, i) => {
        const mid: V3 = [
          (brace.start[0] + brace.end[0]) / 2,
          (brace.start[1] + brace.end[1]) / 2,
          (brace.start[2] + brace.end[2]) / 2,
        ];
        const dx = brace.end[0] - brace.start[0];
        const dz = brace.end[2] - brace.start[2];
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dz, dx);
        return (
          <mesh key={i} position={mid} rotation={[0, -angle, 0]} material={matStructure}>
            <boxGeometry args={[length, 0.06, 0.06]} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ==========================================================================
   5. FUNNEL WITH STIFFENER RINGS & GUSSETS
   ========================================================================== */

function FunnelDetail({ width, depth, funnelHeight, outletSize, outletY }: {
  width: number; depth: number; funnelHeight: number; outletSize: number; outletY: number;
}) {
  const funnelGeo = useMemo(
    () => taperedGeo(width * 0.92, depth * 0.92, outletSize, outletSize, funnelHeight),
    [width, depth, outletSize, funnelHeight]
  );

  const stiffenerCount = 3;
  const stiffeners = Array.from(
    { length: stiffenerCount },
    (_, i) => outletY + (i + 1) * (funnelHeight / (stiffenerCount + 1))
  );

  return (
    <group position={[0, outletY, 0]}>
      {/* Main funnel body */}
      <mesh geometry={funnelGeo} castShadow receiveShadow material={matSteel} />

      {/* Vertical weld seams on funnel faces */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, i) => {
        const x = Math.cos(a) * (width * 0.46);
        const z = Math.sin(a) * (depth * 0.46);
        return (
          <mesh key={i} position={[x, funnelHeight / 2, z]} rotation={[0, -a, Math.atan2(width * 0.46, funnelHeight)]}>
            <boxGeometry args={[0.02, funnelHeight * 1.1, 0.025]} />
            <meshStandardMaterial color="#6b7278" metalness={0.75} roughness={0.45} />
          </mesh>
        );
      })}

      {/* Stiffener rings */}
      {stiffeners.map((y, i) => {
        const t = (y - outletY) / funnelHeight;
        const r = (1 - t) * (Math.max(width, depth) * 0.46) + t * (outletSize / 2);
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
            <boxGeometry args={[r * 2 + 0.08, 0.06, 0.04]} />
          </mesh>
        );
      })}

      {/* Top flange (connects to box) with bolts */}
      <mesh position={[0, funnelHeight, 0]} material={matStructure}>
        <boxGeometry args={[width * 0.95 + 0.08, 0.06, depth * 0.95 + 0.08]} />
      </mesh>
      {/* Bolts on top flange */}
      {[-width * 0.4, width * 0.4].map((x) =>
        [-depth * 0.4, depth * 0.4].map((z) => (
          <Bolt key={`tf-${x}-${z}`} position={[x, funnelHeight + 0.04, z]} size={0.02} />
        ))
      )}

      {/* Outlet pipe stub */}
      <mesh position={[0, -0.15, 0]} castShadow material={matSteel}>
        <cylinderGeometry args={[outletSize / 2, outletSize / 2, 0.3, 24]} />
      </mesh>

      {/* Outlet flange with bolt circle */}
      <mesh position={[0, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <torusGeometry args={[outletSize / 2 + 0.06, 0.035, 8, 24]} />
      </mesh>
      <BoltCircle radius={outletSize / 2 + 0.06} count={8} y={-0.32} size={0.018} />

      {/* Gusset plates at funnel-to-box transition (4 corners) */}
      {[
        [width * 0.42, funnelHeight, depth * 0.42],
        [-width * 0.42, funnelHeight, depth * 0.42],
        [width * 0.42, funnelHeight, -depth * 0.42],
        [-width * 0.42, funnelHeight, -depth * 0.42],
      ].map((pos, i) => (
        <mesh key={i} position={[pos[0], pos[1] - 0.1, pos[2]]} castShadow material={matStructure}>
          <boxGeometry args={[0.15, 0.25, 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   6. BOX BODY WITH PANEL SEAMS, RIBS & BOLTS
   ========================================================================== */

function BoxBody({ width, depth, boxHeight, funnelTopY }: {
  width: number; depth: number; boxHeight: number; funnelTopY: number;
}) {
  const panelCount = 3; // vertical panels per face
  const ribCount = 4;
  const ribs = Array.from(
    { length: ribCount },
    (_, i) => funnelTopY + (i + 1) * (boxHeight / (ribCount + 1))
  );

  return (
    <group>
      {/* Main box */}
      <mesh position={[0, funnelTopY + boxHeight / 2, 0]} castShadow receiveShadow material={matPaintedSteel}>
        <boxGeometry args={[width, boxHeight, depth]} />
      </mesh>

      {/* Vertical panel seams (front & back faces) */}
      {[-1, 1].map((side) =>
        Array.from({ length: panelCount - 1 }, (_, i) => {
          const x = -width / 2 + ((i + 1) / panelCount) * width;
          const z = side * (depth / 2 + 0.005);
          return (
            <mesh key={`vseam-${side}-${i}`} position={[x, funnelTopY + boxHeight / 2, z]}>
              <boxGeometry args={[0.018, boxHeight - 0.1, 0.03]} />
              <meshStandardMaterial color="#6b7278" metalness={0.75} roughness={0.45} />
            </mesh>
          );
        })
      )}

      {/* Vertical panel seams (side faces) */}
      {[-1, 1].map((side) =>
        Array.from({ length: panelCount - 1 }, (_, i) => {
          const z = -depth / 2 + ((i + 1) / panelCount) * depth;
          const x = side * (width / 2 + 0.005);
          return (
            <mesh key={`vseam-side-${side}-${i}`} position={[x, funnelTopY + boxHeight / 2, z]}>
              <boxGeometry args={[0.03, boxHeight - 0.1, 0.018]} />
              <meshStandardMaterial color="#6b7278" metalness={0.75} roughness={0.45} />
            </mesh>
          );
        })
      )}

      {/* Horizontal stiffener ribs with bolt rows */}
      {ribs.map((y, i) => (
        <group key={`rib-${i}`}>
          {/* Rib strip on all 4 faces */}
          {[
            { pos: [0, y, depth / 2 + 0.015] as V3, size: [width + 0.04, 0.06, 0.03] as V3 },
            { pos: [0, y, -depth / 2 - 0.015] as V3, size: [width + 0.04, 0.06, 0.03] as V3 },
            { pos: [width / 2 + 0.015, y, 0] as V3, size: [0.03, 0.06, depth + 0.04] as V3 },
            { pos: [-width / 2 - 0.015, y, 0] as V3, size: [0.03, 0.06, depth + 0.04] as V3 },
          ].map((face, j) => (
            <mesh key={j} position={face.pos} material={matStructure}>
              <boxGeometry args={face.size} />
            </mesh>
          ))}
          {/* Bolts on each rib */}
          {[-width / 2 + 0.15, 0, width / 2 - 0.15].map((x) =>
            [-depth / 2 + 0.15, depth / 2 - 0.15].map((z) => (
              <Bolt key={`bolt-${i}-${x}-${z}`} position={[x, y, z]} size={0.018} />
            ))
          )}
        </group>
      ))}

      {/* Corner reinforcement angles (L-brackets) */}
      {[
        [width / 2, depth / 2],
        [-width / 2, depth / 2],
        [width / 2, -depth / 2],
        [-width / 2, -depth / 2],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, funnelTopY + boxHeight / 2, z]} material={matStructure}>
          <boxGeometry args={[0.08, boxHeight, 0.08]} />
        </mesh>
      ))}

      {/* Top flange ring */}
      <mesh position={[0, funnelTopY + boxHeight - 0.02, 0]} material={matStructure}>
        <boxGeometry args={[width + 0.08, 0.05, depth + 0.08]} />
      </mesh>
      {/* Bottom flange ring */}
      <mesh position={[0, funnelTopY + 0.02, 0]} material={matStructure}>
        <boxGeometry args={[width + 0.08, 0.05, depth + 0.08]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   7. INSPECTION HATCH (interactive)
   ========================================================================== */

function InspectionHatch({ position, rotation }: { position: V3; rotation: V3 }) {
  const doorRef = useRef<THREE.Group>(null!);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const targetAngle = open ? -Math.PI * 0.65 : 0;

  useFrame((_, delta) => {
    if (doorRef.current) {
      doorRef.current.rotation.y = THREE.MathUtils.damp(doorRef.current.rotation.y, targetAngle, 5, delta);
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh material={matStructure}>
        <boxGeometry args={[0.5, 0.65, 0.05]} />
      </mesh>
      {/* Gasket */}
      <mesh position={[0, 0, 0.03]} material={matGasket}>
        <boxGeometry args={[0.46, 0.61, 0.01]} />
      </mesh>
      {/* Door (hinged on left) */}
      <group ref={doorRef} position={[-0.22, 0, 0.04]}>
        <mesh
          position={[0.22, 0, 0]}
          castShadow
          material={hovered ? matSafetyYellow : matPaintedSteel}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(false); }}
          onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); setOpen((o) => !o); }}
        >
          <boxGeometry args={[0.44, 0.59, 0.035]} />
        </mesh>
        {/* Handle */}
        <mesh position={[0.35, 0, 0.03]} material={matStructure}>
          <boxGeometry args={[0.03, 0.18, 0.05]} />
        </mesh>
        <mesh position={[0.35, 0, 0.06]} material={matStructure}>
          <cylinderGeometry args={[0.02, 0.02, 0.08, 12]} />
        </mesh>
        {/* Hinges */}
        {[-0.2, 0.2].map((y, i) => (
          <mesh key={i} position={[0, y, 0.02]} rotation={[0, Math.PI / 2, 0]} material={matStructure}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 12]} />
          </mesh>
        ))}
      </group>
      {/* Frame bolts */}
      {[-0.2, 0.2].map((x) =>
        [-0.28, 0.28].map((y) => (
          <Bolt key={`${x}-${y}`} position={[x, y, 0.03]} size={0.016} />
        ))
      )}
    </group>
  );
}

/* ==========================================================================
   8. BOLTED LID WITH HINGES & HANDLE
   ========================================================================== */

function BoltedLid({ width, depth, lidHeight, lidTopY }: {
  width: number; depth: number; lidHeight: number; lidTopY: number;
}) {
  return (
    <group position={[0, lidTopY - lidHeight / 2, 0]}>
      {/* Main lid plate */}
      <mesh castShadow material={matPaintedSteel}>
        <boxGeometry args={[width + 0.08, lidHeight, depth + 0.08]} />
      </mesh>

      {/* Lid edge bevel (top) */}
      <mesh position={[0, lidHeight / 2 - 0.02, 0]} material={matStructure}>
        <boxGeometry args={[width + 0.1, 0.04, depth + 0.1]} />
      </mesh>

      {/* Gasket line around perimeter */}
      <mesh position={[0, -lidHeight / 2 + 0.01, 0]} material={matGasket}>
        <boxGeometry args={[width + 0.04, 0.015, depth + 0.04]} />
      </mesh>

      {/* Lid bolts (around perimeter) */}
      {[-width / 2, -width / 3, -width / 6, 0, width / 6, width / 3, width / 2].map((x) =>
        [-depth / 2, depth / 2].map((z) => (
          <Bolt key={`lb-${x}-${z}`} position={[x, lidHeight / 2 + 0.01, z]} size={0.02} />
        ))
      )}
      {[-depth / 2 + 0.1, depth / 2 - 0.1].map((z) =>
        [-width / 2 + 0.1, width / 2 - 0.1].map((x) => (
          <Bolt key={`lb2-${x}-${z}`} position={[x, lidHeight / 2 + 0.01, z]} size={0.02} />
        ))
      )}

      {/* Hinges on one side */}
      {[-depth * 0.3, depth * 0.3].map((z, i) => (
        <group key={i} position={[-width / 2 - 0.05, 0, z]}>
          <mesh material={matStructure}>
            <boxGeometry args={[0.08, 0.12, 0.06]} />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={matStructure}>
            <cylinderGeometry args={[0.025, 0.025, 0.1, 12]} />
          </mesh>
        </group>
      ))}

      {/* Handle on opposite side */}
      <group position={[width / 2 + 0.08, 0, 0]}>
        <mesh material={matStructure}>
          <boxGeometry args={[0.06, 0.06, 0.25]} />
        </mesh>
        <mesh position={[0.04, 0, 0]} material={matStructure}>
          <cylinderGeometry args={[0.025, 0.025, 0.12, 12]} />
        </mesh>
      </group>

      {/* Lifting lugs (2 on top) */}
      {[-width * 0.3, width * 0.3].map((x, i) => (
        <mesh key={i} position={[x, lidHeight / 2 + 0.04, 0]} material={matStructure}>
          <boxGeometry args={[0.12, 0.06, 0.08]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   9. VENT WITH MESH SCREEN
   ========================================================================== */

function VentWithScreen({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {/* Vent collar */}
      <mesh castShadow material={matSteel}>
        <cylinderGeometry args={[0.05, 0.05, 0.22, 16]} />
      </mesh>
      {/* Collar flange */}
      <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <torusGeometry args={[0.06, 0.015, 8, 16]} />
      </mesh>
      {/* Mesh screen (wireframe cylinder) */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.12, 12, 1, true]} />
        <meshStandardMaterial color="#4a5058" metalness={0.7} roughness={0.4} wireframe />
      </mesh>
      {/* Rain cap (cone on top) */}
      <mesh position={[0, 0.15, 0]} material={matStructure}>
        <coneGeometry args={[0.07, 0.06, 16]} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   10. LEVEL SENSOR PORTS
   ========================================================================== */

function LevelSensorPorts({ boxHeight, funnelTopY, depth }: {
  boxHeight: number; funnelTopY: number; depth: number;
}) {
  const ports = [0.25, 0.55, 0.85];
  return (
    <>
      {ports.map((t, i) => {
        const y = funnelTopY + t * boxHeight;
        return (
          <group key={i} position={[0.51, y, depth * 0.3]}>
            <mesh material={matStructure}>
              <cylinderGeometry args={[0.045, 0.045, 0.1, 12]} />
            </mesh>
            <mesh position={[0, 0, 0.06]} material={matSteel}>
              <cylinderGeometry args={[0.055, 0.055, 0.02, 12]} />
            </mesh>
            {/* Status LED */}
            <mesh position={[0, 0, 0.08]}>
              <sphereGeometry args={[0.02, 12, 12]} />
              <meshStandardMaterial
                color={i === 1 ? '#3fae56' : '#555555'}
                emissive={i === 1 ? '#3fae56' : '#000000'}
                emissiveIntensity={i === 1 ? 0.8 : 0}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

/* ==========================================================================
   11. NAMEPLATE
   ========================================================================== */

function Nameplate({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh material={matSteel}>
        <boxGeometry args={[0.9, 0.28, 0.012]} />
      </mesh>
      <Text position={[0, 0.04, 0.007]} fontSize={0.09} color="#1a1a1a" anchorX="center" anchorY="middle" fontWeight="bold">
        FEED HOPPER — FH-01
      </Text>
      <Text position={[0, -0.06, 0.007]} fontSize={0.065} color="#3a3a3a" anchorX="center" anchorY="middle">
        CAP: 2.5 T | ID: HOP-001
      </Text>
      {/* Plate screws */}
      {[[-0.4, 0.11], [0.4, 0.11], [-0.4, -0.11], [0.4, -0.11]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.008]} material={matBolt}>
          <cylinderGeometry args={[0.012, 0.012, 0.01, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   12. CABLE CONDUIT BRACKET
   ========================================================================== */

function CableConduit({ boxHeight, funnelTopY }: { boxHeight: number; funnelTopY: number }) {
  return (
    <group position={[-0.52, funnelTopY + boxHeight * 0.5, 0]}>
      {/* Bracket arm */}
      <mesh material={matStructure}>
        <boxGeometry args={[0.04, 0.04, 0.15]} />
      </mesh>
      {/* Conduit pipe */}
      <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={matStructure}>
        <cylinderGeometry args={[0.025, 0.025, boxHeight * 0.8, 12]} />
      </mesh>
      {/* Conduit clamps */}
      {[0.2, 0.5, 0.8].map((t, i) => (
        <mesh key={i} position={[0, 0, 0.1 + (t - 0.5) * boxHeight * 0.8]} rotation={[Math.PI / 2, 0, 0]} material={matBolt}>
          <torusGeometry args={[0.03, 0.008, 8, 16]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   13. MAIN FEED HOPPER COMPONENT
   ========================================================================== */

export interface FeedHopperProps {
  position?: V3;
  showFlourFill?: boolean;
  flourFillLevel?: number;
}

export function FeedHopperComponent({
  position = [0, 0, 0],
  showFlourFill = true,
  flourFillLevel = 0.5,
}: FeedHopperProps) {
  const { width, depth, baseHeight, funnelHeight, boxHeight, outletSize, lidHeight } = REF.hopper;

  const outletY = hopperOutletY();
  const funnelTopY = hopperFunnelTopY();
  const lidTopY = hopperTopY();

  return (
    <group position={position}>
      {/* Support legs with base plates & gussets */}
      <SupportLegs width={width} depth={depth} baseHeight={baseHeight} funnelHeight={funnelHeight} />

      {/* Funnel with stiffeners, outlet flange & gussets */}
      <FunnelDetail width={width} depth={depth} funnelHeight={funnelHeight} outletSize={outletSize} outletY={outletY} />

      {/* Box body with panel seams, ribs & bolts */}
      <BoxBody width={width} depth={depth} boxHeight={boxHeight} funnelTopY={funnelTopY} />

      {/* Inspection hatch (front face) */}
      <InspectionHatch
        position={[0, funnelTopY + boxHeight * 0.5, depth / 2 + 0.03]}
        rotation={[0, 0, 0]}
      />

      {/* Inlet collar on lid */}
      <mesh position={[0, funnelTopY + boxHeight + 0.04, 0]} castShadow material={matSteel}>
        <boxGeometry args={[width * 0.45, 0.08, depth * 0.45]} />
      </mesh>
      {/* Inlet collar bolts */}
      {[-width * 0.18, width * 0.18].map((x) =>
        [-depth * 0.18, depth * 0.18].map((z) => (
          <Bolt key={`ic-${x}-${z}`} position={[x, funnelTopY + boxHeight + 0.08, z]} size={0.018} />
        ))
      )}

      {/* Bolted lid with hinges, handle & lifting lugs */}
      <BoltedLid width={width} depth={depth} lidHeight={lidHeight} lidTopY={lidTopY} />

      {/* Vent with mesh screen & rain cap */}
      <VentWithScreen position={[width * 0.28, lidTopY + 0.12, 0]} />

      {/* Level sensor ports (3 heights) */}
      <LevelSensorPorts boxHeight={boxHeight} funnelTopY={funnelTopY} depth={depth} />

      {/* Cable conduit bracket */}
      <CableConduit boxHeight={boxHeight} funnelTopY={funnelTopY} />

      {/* Nameplate */}
      <Nameplate position={[0, funnelTopY + boxHeight * 0.5, depth / 2 + 0.025]} />

      {/* Warning stripe at base */}
      <mesh position={[0, baseHeight + 0.01, 0]}>
        <boxGeometry args={[width + 0.22, 0.02, depth + 0.22]} />
        <meshStandardMaterial color="#e0a92c" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Flour fill visualization */}
      {showFlourFill && (
        <FlourFill
          topWidth={width * 0.88}
          topDepth={depth * 0.88}
          bottomWidth={width * 0.88}
          bottomDepth={depth * 0.88}
          height={boxHeight * flourFillLevel}
          baseY={funnelTopY + boxHeight * (1 - flourFillLevel)}
          fillLevel={1}
        />
      )}
    </group>
  );
}

export default FeedHopperComponent;