'use client';

/**
 * FeedHopper — reference surge hopper (bottom → top):
 * base pad → funnel (outlet down) → box → lid + vent
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { matPaintedSteel, matSteel } from '../materials';
import { FlourFill } from './MaterialFlow';
import { REF, hopperFunnelTopY, hopperOutletY, hopperTopY } from './layoutConstants';

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

  const funnelGeo = useMemo(
    () => taperedGeo(width * 0.92, depth * 0.92, outletSize, outletSize, funnelHeight),
    [width, depth, outletSize, funnelHeight]
  );

  return (
    <group position={position}>
      {/* Base pad */}
      <mesh position={[0, baseHeight / 2, 0]} castShadow receiveShadow dispose={null} material={matPaintedSteel}>
        <boxGeometry args={[width + 0.2, baseHeight, depth + 0.2]} />
      </mesh>

      {/* Funnel — wide top connects to box, narrow outlet at bottom */}
      <group position={[0, outletY, 0]}>
        <mesh geometry={funnelGeo} castShadow receiveShadow dispose={null} material={matSteel}>
        </mesh>
        <mesh position={[0, -0.025, 0]} dispose={null} material={matSteel}>
          <boxGeometry args={[outletSize + 0.14, 0.05, outletSize + 0.14]} />
        </mesh>
      </group>

      {/* Box body on top of funnel */}
      <mesh position={[0, funnelTopY + boxHeight / 2, 0]} castShadow receiveShadow dispose={null} material={matSteel}>
        <boxGeometry args={[width, boxHeight, depth]} />
      </mesh>

      {/* Inlet collar on lid (receives vertical duct from above) */}
      <mesh position={[0, funnelTopY + boxHeight + 0.04, 0]} castShadow dispose={null} material={matSteel}>
        <boxGeometry args={[width * 0.45, 0.08, depth * 0.45]} />
      </mesh>

      {/* Lid */}
      <mesh position={[0, lidTopY - lidHeight / 2, 0]} castShadow dispose={null} material={matSteel}>
        <boxGeometry args={[width + 0.06, lidHeight, depth + 0.06]} />
      </mesh>

      {/* Vent */}
      <mesh position={[width * 0.28, lidTopY + 0.1, 0]} castShadow dispose={null} material={matSteel}>
        <cylinderGeometry args={[0.035, 0.035, 0.18, 10]} />
      </mesh>

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
