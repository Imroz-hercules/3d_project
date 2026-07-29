'use client';

/**
 * WarehouseStaging.tsx — HIGH-FIDELITY WAREHOUSE & LOGISTICS
 * ------------------------------------------------------------------------
 * Upgraded for zoom-level realism. Features PBR clearcoat stretch wrap, 
 * realistic industrial pallet racking, a detailed rotary stretch wrapper 
 * with a safety cage, a realistic semi-truck at the dock with a functional 
 * leveler, an upgraded forklift with a proper mast and overhead guard, 
 * and a detailed concrete floor with safety markings.
 * ------------------------------------------------------------------------
 */

import { useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

type V3 = [number, number, number];

/* ==========================================================================
   1. HIGH-FIDELITY PBR MATERIALS
   ========================================================================== */

const matConcrete = new THREE.MeshStandardMaterial({ color: '#8a8a82', roughness: 0.92, metalness: 0.05 });
const matConcreteDark = new THREE.MeshStandardMaterial({ color: '#6a6a62', roughness: 0.95, metalness: 0.05 });

const matWood = new THREE.MeshStandardMaterial({ color: '#8b6914', roughness: 0.95, metalness: 0.0 });
const matWoodDark = new THREE.MeshStandardMaterial({ color: '#6b5235', roughness: 0.95, metalness: 0.0 });

const matWrap = new THREE.MeshPhysicalMaterial({
  color: '#e8eef2', metalness: 0.1, roughness: 0.2, transmission: 0.6, thickness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.1, side: THREE.DoubleSide
});

const matTruck = new THREE.MeshPhysicalMaterial({ color: '#2a5080', metalness: 0.6, roughness: 0.3, clearcoat: 0.5 });
const matTruckDark = new THREE.MeshStandardMaterial({ color: '#1a3050', metalness: 0.5, roughness: 0.4 });

const matForkliftYellow = new THREE.MeshPhysicalMaterial({ color: '#f5a623', metalness: 0.4, roughness: 0.4, clearcoat: 0.3 });
const matForkliftBlack = new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.5, roughness: 0.6 });

const matRackUpright = new THREE.MeshStandardMaterial({ color: '#4a555c', metalness: 0.7, roughness: 0.5 });
const matRackBeam = new THREE.MeshStandardMaterial({ color: '#e0a92c', metalness: 0.5, roughness: 0.5 });

const matSteel = new THREE.MeshStandardMaterial({ color: '#8a9199', metalness: 0.8, roughness: 0.3 });
const matSteelDark = new THREE.MeshStandardMaterial({ color: '#4a5058', metalness: 0.85, roughness: 0.45 });
const matRubber = new THREE.MeshStandardMaterial({ color: '#1a1a1a', metalness: 0.1, roughness: 0.95 });
const matSafetyYellow = new THREE.MeshStandardMaterial({ color: '#e0a92c', metalness: 0.5, roughness: 0.6 });

const COLORS = {
  floorMark: '#e0a92c',
  hazardRed: '#a4222c',
  textYellow: '#e0a92c',
} as const;

/* ==========================================================================
   2. STAGED PALLET (Realistic wood & stretch wrap)
   ========================================================================== */

function StagedPallet({ position, wrapped = true }: { position: V3; wrapped?: boolean }) {
  return (
    <group position={position}>
      {/* Pallet Base */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow material={matWood}>
        <boxGeometry args={[1.2, 0.15, 1.0]} />
      </mesh>
      {/* Top Deck Boards */}
      {[-0.4, -0.13, 0.13, 0.4].map((x, i) => (
        <mesh key={i} position={[x, 0.16, 0]} castShadow material={matWoodDark}>
          <boxGeometry args={[0.12, 0.04, 0.9]} />
        </mesh>
      ))}
      {/* Load */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.15, 1.1, 0.95]} />
        <meshStandardMaterial color="#d4c4a0" roughness={0.85} />
      </mesh>
      {/* Stretch Wrap */}
      {wrapped && (
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[1.22, 1.2, 1.02]} />
          <meshPhysicalMaterial
            color={matWrap.color}
            metalness={matWrap.metalness}
            roughness={matWrap.roughness}
            transmission={matWrap.transmission}
            thickness={matWrap.thickness}
            clearcoat={matWrap.clearcoat}
            clearcoatRoughness={matWrap.clearcoatRoughness}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

/* ==========================================================================
   3. INDUSTRIAL PALLET RACKING
   ========================================================================== */

function PalletRack({ position, bayCount, levels = 2 }: { position: V3; bayCount: number; levels?: number }) {
  const baySpacingX = 1.4;
  const rackHeight = 3.5;
  const length = bayCount * baySpacingX;

  return (
    <group position={position}>
      {/* Uprights (Simulated perforated steel) */}
      {Array.from({ length: bayCount + 1 }, (_, i) => {
        const x = -length / 2 + i * baySpacingX;
        return (
          <group key={i}>
            {/* Front Upright */}
            <mesh position={[x, rackHeight / 2, 0.55]} castShadow material={matRackUpright}>
              <boxGeometry args={[0.1, rackHeight, 0.1]} />
            </mesh>
            {/* Rear Upright */}
            <mesh position={[x, rackHeight / 2, -0.55]} castShadow material={matRackUpright}>
              <boxGeometry args={[0.1, rackHeight, 0.1]} />
            </mesh>
            {/* Diagonal Bracing (Visual) */}
            <mesh position={[x, rackHeight * 0.3, 0]} rotation={[0, 0, Math.PI / 4]} material={matRackUpright}>
              <boxGeometry args={[0.04, 0.8, 0.04]} />
            </mesh>
            <mesh position={[x, rackHeight * 0.7, 0]} rotation={[0, 0, -Math.PI / 4]} material={matRackUpright}>
              <boxGeometry args={[0.04, 0.8, 0.04]} />
            </mesh>
          </group>
        );
      })}

      {/* Beams + Staged Pallets */}
      {Array.from({ length: levels }, (_, lvl) => {
        const y = 0.35 + lvl * (rackHeight / levels) * 0.85;
        return (
          <group key={lvl}>
            {/* Front Beam */}
            <mesh position={[0, y, 0.55]} castShadow material={matRackBeam}>
              <boxGeometry args={[length, 0.08, 0.08]} />
            </mesh>
            {/* Rear Beam */}
            <mesh position={[0, y, -0.55]} castShadow material={matRackBeam}>
              <boxGeometry args={[length, 0.08, 0.08]} />
            </mesh>
            {/* Pallets in bays */}
            {Array.from({ length: bayCount }, (_, b) => {
              const x = -length / 2 + baySpacingX / 2 + b * baySpacingX;
              if ((lvl + b) % 3 === 0) return null; // Visual variety
              return <StagedPallet key={b} position={[x, y + 0.08, 0]} wrapped={lvl > 0 || b % 2 === 0} />;
            })}
          </group>
        );
      })}
      
      {/* Floor protectors */}
      {[-length / 2, length / 2].map((x, i) => (
        <mesh key={i} position={[x, 0.15, 0.55]} material={matSafetyYellow}>
          <boxGeometry args={[0.15, 0.3, 0.15]} />
        </mesh>
      ))}
    </group>
  );
}

/* ==========================================================================
   4. ROTARY STRETCH WRAPPER (Detailed with safety cage)
   ========================================================================== */

function StretchWrapperStub({ position }: { position: V3 }) {
  const turntableRef = useRef<THREE.Mesh>(null!);
  
  useFrame((_, delta) => {
    if (turntableRef.current) {
      turntableRef.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <group position={position}>
      {/* Main Housing */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow material={matSteelDark}>
        <boxGeometry args={[1.6, 2.2, 1.6]} />
      </mesh>
      
      {/* Turntable */}
      <mesh ref={turntableRef} position={[0, 0.12, 0]} castShadow material={matSteel}>
        <cylinderGeometry args={[0.75, 0.75, 0.12, 24]} />
      </mesh>
      
      {/* Film Roll Mast */}
      <mesh position={[0.7, 1.4, 0]} castShadow material={matSteelDark}>
        <boxGeometry args={[0.12, 2.4, 0.12]} />
      </mesh>
      
      {/* Film Carriage */}
      <mesh position={[0.7, 1.6, 0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.5, 16]} />
        <meshStandardMaterial color="#e8eef2" roughness={0.4} />
      </mesh>

      {/* Safety Cage (Yellow Wireframe) */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.8, 1.2, 1.8]} />
        <meshStandardMaterial color={COLORS.textYellow} metalness={0.6} roughness={0.4} wireframe />
      </mesh>
      
      <Text position={[0, 2.5, 0.85]} fontSize={0.12} color={COLORS.textYellow} anchorX="center" fontWeight="bold">
        STRETCH WRAP
      </Text>
    </group>
  );
}

/* ==========================================================================
   5. TRUCK DOCK (With leveler, bumpers, and semi-truck)
   ========================================================================== */

function TruckDock({ position }: { position: V3 }) {
  return (
    <group position={position}>
      {/* Dock Pit / Pad */}
      <mesh position={[0, 0.05, 0]} receiveShadow material={matConcreteDark}>
        <boxGeometry args={[4.5, 0.1, 3.5]} />
      </mesh>
      
      {/* Dock Bumpers */}
      <mesh position={[-2.0, 0.6, 1.2]} castShadow material={matRubber}>
        <boxGeometry args={[0.3, 0.4, 0.4]} />
      </mesh>
      <mesh position={[-2.0, 0.6, -1.2]} castShadow material={matRubber}>
        <boxGeometry args={[0.3, 0.4, 0.4]} />
      </mesh>

      {/* Dock Leveler Plate (Slightly angled down to truck) */}
      <mesh position={[-1.8, 0.55, 0]} rotation={[0.1, 0, 0]} castShadow material={matSteel}>
        <boxGeometry args={[0.9, 1.1, 2.4]} />
      </mesh>
      <mesh position={[-1.8, 0.55, 0]} rotation={[0.1, 0, 0]} material={matSteelDark}>
        <boxGeometry args={[0.92, 0.05, 2.42]} />
      </mesh>

      {/* Semi-Truck Silhouette */}
      <group position={[1.2, 0, 0]}>
        {/* Trailer */}
        <mesh position={[0, 1.1, 0]} castShadow material={matTruck}>
          <boxGeometry args={[3.5, 2.0, 2.4]} />
        </mesh>
        {/* Trailer Undercarriage */}
        <mesh position={[-0.5, 0.4, 0]} castShadow material={matSteelDark}>
          <boxGeometry args={[2.0, 0.2, 1.8]} />
        </mesh>
        {/* Cab */}
        <mesh position={[-2.2, 0.95, 0]} castShadow material={matTruckDark}>
          <boxGeometry args={[1.0, 1.5, 2.2]} />
        </mesh>
        {/* Cab Window */}
        <mesh position={[-2.7, 1.3, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.3, 0.8]} />
          <meshStandardMaterial color="#111111" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Wheels */}
        {[[-1.2, 0.35, 1.1], [-1.2, 0.35, -1.1], [0.8, 0.35, 1.1], [0.8, 0.35, -1.1], [-2.4, 0.35, 1.1], [-2.4, 0.35, -1.1]].map((pos, i) => (
          <mesh key={i} position={pos as V3} rotation={[0, 0, Math.PI / 2]} castShadow material={matRubber}>
            <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
          </mesh>
        ))}
        {/* Wheel Hubs */}
        {[[-1.2, 0.35, 1.26], [-1.2, 0.35, -1.26], [0.8, 0.35, 1.26], [0.8, 0.35, -1.26], [-2.4, 0.35, 1.26], [-2.4, 0.35, -1.26]].map((pos, i) => (
          <mesh key={`hub-${i}`} position={pos as V3} rotation={[0, 0, Math.PI / 2]} material={matSteel}>
            <cylinderGeometry args={[0.15, 0.15, 0.32, 16]} />
          </mesh>
        ))}
      </group>
      
      <Text position={[0, 0.12, 1.9]} fontSize={0.12} color={COLORS.textYellow} anchorX="center" fontWeight="bold">
        TRUCK DOCK 01
      </Text>
    </group>
  );
}

/* ==========================================================================
   6. ANIMATED FORKLIFT (Upgraded with mast, overhead guard, counterweight)
   ========================================================================== */

function AnimatedForklift({ active = true }: { active?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  // Note: In a real app, these would come from layoutConstants
  const wx = 0, wz = 0; 
  const dx = 8, dz = 0;
  const bayX = -3.5;
  const bayZ = 0.9;

  useFrame(({ clock }) => {
    if (!groupRef.current || !active) return;
    const t = (clock.elapsedTime * 0.08) % 1;

    let x = wx, z = wz, yaw = 0, fy = 0.35;

    if (t < 0.25) {
      const u = t / 0.25;
      x = THREE.MathUtils.lerp(wx, bayX, u);
      z = THREE.MathUtils.lerp(wz, bayZ, u);
      yaw = Math.atan2(bayX - wx, bayZ - wz);
    } else if (t < 0.35) {
      const u = (t - 0.25) / 0.1;
      x = bayX; z = bayZ; yaw = Math.PI;
      fy = THREE.MathUtils.lerp(0.35, 0.9, u);
    } else if (t < 0.6) {
      const u = (t - 0.35) / 0.25;
      x = THREE.MathUtils.lerp(bayX, dx - 1.5, u);
      z = THREE.MathUtils.lerp(bayZ, dz, u);
      yaw = Math.atan2(dx - bayX, dz - bayZ);
      fy = 0.9;
    } else if (t < 0.7) {
      const u = (t - 0.6) / 0.1;
      x = dx - 1.5; z = dz; yaw = 0;
      fy = THREE.MathUtils.lerp(0.9, 0.35, u);
    } else {
      const u = (t - 0.7) / 0.3;
      x = THREE.MathUtils.lerp(dx - 1.5, wx, u);
      z = THREE.MathUtils.lerp(dz, wz, u);
      yaw = Math.atan2(wx - (dx - 1.5), wz - dz);
    }

    groupRef.current.position.set(x, 0, z);
    groupRef.current.rotation.y = yaw;
    
    const forks = groupRef.current.getObjectByName('forks');
    if (forks) forks.position.y = fy;
    const load = groupRef.current.getObjectByName('load');
    if (load) load.visible = fy > 0.55;
  });

  return (
    <group ref={groupRef}>
      {/* Main Chassis */}
      <mesh position={[0.2, 0.55, 0]} castShadow material={matForkliftYellow}>
        <boxGeometry args={[1.4, 1.0, 0.9]} />
      </mesh>
      {/* Counterweight */}
      <mesh position={[0.7, 0.6, 0]} castShadow material={matForkliftBlack}>
        <boxGeometry args={[0.5, 0.8, 0.85]} />
      </mesh>
      {/* Cab / Overhead Guard */}
      <mesh position={[-0.2, 1.3, 0]} castShadow material={matForkliftBlack}>
        <boxGeometry args={[0.12, 0.12, 0.9]} />
      </mesh>
      <mesh position={[-0.2, 1.0, 0.4]} castShadow material={matForkliftBlack}>
        <boxGeometry args={[0.12, 0.7, 0.12]} />
      </mesh>
      <mesh position={[-0.2, 1.0, -0.4]} castShadow material={matForkliftBlack}>
        <boxGeometry args={[0.12, 0.7, 0.12]} />
      </mesh>
      <mesh position={[-0.2, 1.35, 0]} castShadow material={matForkliftBlack}>
        <boxGeometry args={[0.8, 0.1, 0.9]} />
      </mesh>
      
      {/* Mast Assembly */}
      <group position={[-0.6, 0.8, 0]}>
        <mesh castShadow material={matSteelDark}>
          <boxGeometry args={[0.15, 1.6, 0.15]} />
        </mesh>
        {/* Fork Carriage */}
        <group name="forks" position={[0, -0.45, 0]}>
          <mesh position={[-0.4, 0, 0.22]} castShadow material={matSteel}>
            <boxGeometry args={[0.1, 0.8, 0.12]} />
          </mesh>
          <mesh position={[-0.4, 0, -0.22]} castShadow material={matSteel}>
            <boxGeometry args={[0.1, 0.8, 0.12]} />
          </mesh>
          <mesh name="load" position={[-0.6, 0.55, 0]} castShadow>
            <boxGeometry args={[1.15, 1.0, 0.9]} />
            <meshStandardMaterial color="#d4c4a0" roughness={0.85} />
          </mesh>
        </group>
      </group>

      {/* Wheels */}
      {[
        [0.4, 0.22, 0.5], [0.4, 0.22, -0.5], 
        [-0.35, 0.22, 0.5], [-0.35, 0.22, -0.5]
      ].map((pos, i) => (
        <group key={i} position={pos as V3}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow material={matRubber}>
            <cylinderGeometry args={[0.22, 0.22, 0.18, 16]} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} material={matSteel}>
            <cylinderGeometry args={[0.1, 0.1, 0.2, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ==========================================================================
   7. FLOOR LANES & SAFETY MARKINGS
   ========================================================================== */

function FloorLanes({ length }: { length: number }) {
  return (
    <group>
      {/* Main Concrete Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length / 2 - 1, 0.01, 0]} receiveShadow material={matConcrete}>
        <planeGeometry args={[length, 6.0]} />
      </mesh>
      
      {/* Expansion Joints */}
      {Array.from({ length: Math.floor(length / 4) }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[i * 4, 0.015, 0]} material={matConcreteDark}>
          <planeGeometry args={[0.05, 6.0]} />
        </mesh>
      ))}

      {/* Pedestrian Walkway Stripes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length / 2 - 1, 0.015, 2.2]}>
        <planeGeometry args={[length, 0.15]} />
        <meshStandardMaterial color={COLORS.floorMark} roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length / 2 - 1, 0.015, -2.2]}>
        <planeGeometry args={[length, 0.15]} />
        <meshStandardMaterial color={COLORS.floorMark} roughness={0.8} />
      </mesh>

      {/* Dock Hazard Stripes (Simplified as solid yellow for performance) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[length - 1, 0.015, 0]}>
        <planeGeometry args={[2.0, 3.5]} />
        <meshStandardMaterial color={COLORS.hazardRed} roughness={0.8} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

/* ==========================================================================
   8. MAIN WAREHOUSE STAGING COMPONENT
   ========================================================================== */

export function WarehouseStaging({ active = true }: { active?: boolean }) {
  // Mock positions for standalone preview
  const wx = 0, wz = 0;
  const dx = 8, dz = 0;
  const wrapX = -2, wrapZ = 0;
  const bayCount = 4;
  const aisleSpacingZ = 3.0;
  const baySpacingX = 1.4;
  const rackLen = bayCount * baySpacingX;

  return (
    <group>
      <StretchWrapperStub position={[wrapX, 0, wrapZ]} />

      <group position={[wx, 0, wz]}>
        <FloorLanes length={rackLen + 12} />
        
        {/* Racking Aisles */}
        <PalletRack position={[rackLen / 2, 0, aisleSpacingZ / 2]} bayCount={bayCount} />
        <PalletRack position={[rackLen / 2, 0, -aisleSpacingZ / 2]} bayCount={bayCount} />
        
        {/* Ground Staging Positions */}
        {[0, 1, 2].map((i) => (
          <StagedPallet key={i} position={[1.5 + i * 2.0, 0, 0]} wrapped={i !== 1} />
        ))}
        
        <Text position={[rackLen / 2, 0.05, aisleSpacingZ + 1.5]} fontSize={0.16} color={COLORS.textYellow} anchorX="center" fontWeight="bold">
          WAREHOUSE STAGING
        </Text>
      </group>

      <TruckDock position={[dx, 0, dz]} />
      <AnimatedForklift active={active} />
    </group>
  );
}

export default WarehouseStaging;