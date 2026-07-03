/**
 * Reference dimensions from Silo Hopper Feeding System UI (metres).
 * Geometry order (bottom → top): base pad → funnel → box → lid.
 */

export const REF = {
  silo: {
    radius: 1.2,
    cylHeight: 3.6,
    roofHeight: 0.9,
    coneHeight: 1.2,
    coneBottomRadius: 0.18,
    legHeight: 2.8,
    legCount: 4,
    legBaseRadius: 1.2 * 1.05,
  },
  hopper: {
    width: 1.6,
    depth: 1.6,
    baseHeight: 0.5,
    funnelHeight: 0.42,
    boxHeight: 0.82,
    outletSize: 0.5,
    lidHeight: 0.06,
  },
  valve: {
    width: 0.6,
    height: 0.45,
    depth: 0.6,
    scale: 1,
  },
  screw: {
    length: 3.0,
    troughHeight: 0.35,
    width: 0.32,
    inletDropHeight: 0.22,
  },
  layout: {
    siloToHopperGap: 0.65,
  },
  elevator: {
    width: 1.0,
    depth: 0.9,
    height: 6.5,
    bootHeight: 1.5,
    headHeight: 1.8,
    rpm: 45,
    beltSpeed: 1.2,
  },
} as const;

export function hopperCenterX() {
  return REF.silo.radius + REF.layout.siloToHopperGap + REF.hopper.width / 2;
}

/** Funnel outlet flange centre Y (world, hopper at y=0). */
export function hopperOutletY() {
  return REF.hopper.baseHeight;
}

/** Funnel top / box bottom Y. */
export function hopperFunnelTopY() {
  return REF.hopper.baseHeight + REF.hopper.funnelHeight;
}

/** Lid top Y. */
export function hopperTopY() {
  return (
    REF.hopper.baseHeight +
    REF.hopper.funnelHeight +
    REF.hopper.boxHeight +
    REF.hopper.lidHeight
  );
}

export function valveInletOffset() {
  return (REF.valve.height / 2 + 0.03) * REF.valve.scale;
}

export function valveCenterY() {
  return hopperOutletY() - valveInletOffset();
}

/** Valve outlet flange bottom Y. */
export function valveOutletY() {
  return valveCenterY() - valveInletOffset();
}

/** Screw conveyor floor position Y (trough sits on ground). */
export function screwFloorY() {
  return 0;
}

/** Screw inlet X — aligned with valve / hopper column. */
export function screwInletX() {
  return hopperCenterX();
}

/** Top of screw inlet collar (mates with valve outlet). */
export function screwInletTopY() {
  return REF.screw.troughHeight + REF.screw.inletDropHeight;
}

/** Horizontal duct Y — above hopper, below silo outlet. */
export function ductBridgeY() {
  return REF.silo.legHeight - 0.55;
}

/** X where horizontal duct clears silo leg cage. */
export function ductStartX() {
  return REF.silo.legBaseRadius + 0.15;
}

/** Screw discharge end X. */
export function screwDischargeX() {
  return screwInletX() + REF.screw.length;
}

/** Screw discharge centre Y (floor trough). */
export function screwDischargeY() {
  return REF.screw.troughHeight / 2 + 0.04;
}

/** Bucket elevator group origin [x, y, z] — boot inlet mates with screw discharge. */
export function elevatorPosition(): [number, number, number] {
  const dischargeX = screwDischargeX();
  const w = REF.elevator.width;
  // Boot inlet is on +X face at width/2 + 0.05
  const x = dischargeX - w / 2 - 0.05;
  return [x, 0, 0];
}

/** Boot inlet flange world position (screw → elevator connection point). */
export function elevatorBootInlet(): [number, number, number] {
  const [ex] = elevatorPosition();
  return [ex + REF.elevator.width / 2 + 0.05, REF.elevator.bootHeight / 2, 0];
}

/** Head discharge outlet world position. */
export function elevatorHeadOutlet(): [number, number, number] {
  const [ex, , ez] = elevatorPosition();
  const { height, depth } = REF.elevator;
  return [ex, height - 0.3, ez + depth / 2 + 0.55];
}
