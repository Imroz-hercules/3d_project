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
  separator: {
    width: 3,
    depth: 1.5,
    height: 0.55,
    frameHeight: 0.9,
    springHeight: 0.45,
    rpm: 960,
    amplitude: 4.5,
  },
  separatorLayout: {
    offsetXFromElevator: 1.5,
    offsetZFromElevator: 2.8,
  },
  destoner: {
    length: 3.5,
    width: 1.8,
    depth: 1.2,
    frameHeight: 1.2,
    rpm: 900,
    airflow: 4500,
  },
  destonerLayout: {
    /** Gap from vibro clean outlet to destoner feed flange (metres). */
    gapFromSeparator: 1.2,
    /** Raise destoner so clean grain drops into magnetic separator inlet. */
    elevateY: 1.5,
  },
  magnetic: {
    length: 1.2,
    width: 0.7,
    height: 0.9,
    legHeight: 1.2,
  },
  magneticLayout: {
    /** Gap from destoner clean outlet to magnet inlet centre X (metres). */
    gapFromDestoner: 1.4,
  },
  scourer: {
    length: 2.0,
    radius: 0.6,
    legHeight: 1.2,
  },
  scourerLayout: {
    /** Gap from magnetic outlet to scourer feed flange (metres). */
    gapFromMagnetic: 1.5,
  },
  dampener: {
    length: 2.2,
    radius: 0.65,
    legHeight: 1.3,
  },
  dampenerLayout: {
    /** Gap from scourer outlet to dampener feed flange (metres). */
    gapFromScourer: 1.5,
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

/* ==========================================================================
   VIBRO SEPARATOR LAYOUT HELPERS
   ========================================================================== */

/** Vibro separator group origin — placed on +Z side of elevator, base on the ground (y = 0). */
export function separatorPosition(): [number, number, number] {
  const [ex, , ez] = elevatorPosition();
  return [
    ex + REF.separatorLayout.offsetXFromElevator,
    0,
    ez + REF.elevator.depth / 2 + REF.separatorLayout.offsetZFromElevator,
  ];
}

/** Separator top feed inlet flange — world position (where elevator chute connects). */
export function separatorInletWorldPos(): [number, number, number] {
  const [sx, , sz] = separatorPosition();
  const { height, frameHeight, springHeight } = REF.separator;
  // Inlet flange top: frame + springs + deck + inlet riser
  const y = frameHeight + springHeight + height + 0.4;
  return [sx, y, sz];
}

/** Separator clean grain outlet — world position (front +Z, main product stream). */
export function separatorCleanOutletPos(): [number, number, number] {
  const [sx, , sz] = separatorPosition();
  const { height, depth, frameHeight, springHeight } = REF.separator;
  const deckMid = frameHeight + springHeight + height * 0.45;
  return [sx, deckMid, sz + depth / 2 + 0.38];
}

/* ==========================================================================
   DESTONER LAYOUT HELPERS
   ========================================================================== */

/** Deck centre Y relative to destoner group origin (sits on rubber mounts). */
export function destonerDeckY() {
  const { frameHeight } = REF.destoner;
  const springY = frameHeight / 2 + 0.25;
  return springY + 0.45;
}

/**
 * Destoner group origin — downstream of vibro along +X, Z aligned with vibro clean outlet.
 * Feed inlet faces −X toward the vibro discharge. Elevated for gravity feed to magnet.
 */
export function destonerPosition(): [number, number, number] {
  const [sx, , sz] = separatorPosition();
  const { length } = REF.destoner;
  const { depth } = REF.separator;
  const gap = REF.destonerLayout.gapFromSeparator;
  // Inlet flange local X = −length/2 − 0.6
  const x = sx + gap + length / 2 + 0.6;
  const z = sz + depth / 2 + 0.38;
  return [x, REF.destonerLayout.elevateY, z];
}

/** Destoner feed inlet flange — world position. */
export function destonerInletWorldPos(): [number, number, number] {
  const [dx, dy, dz] = destonerPosition();
  const { length } = REF.destoner;
  return [dx - length / 2 - 0.6, dy + destonerDeckY() + 0.5, dz];
}

/** Destoner clean grain outlet flange — world position. */
export function destonerCleanOutletPos(): [number, number, number] {
  const [dx, dy, dz] = destonerPosition();
  const { length } = REF.destoner;
  return [dx + length / 2 + 0.45, dy + destonerDeckY() - 0.3, dz];
}

/* ==========================================================================
   MAGNETIC SEPARATOR LAYOUT HELPERS
   ========================================================================== */

/**
 * Magnetic separator group origin — housing centre.
 * Legs extend to y = −legHeight; place so feet sit on the ground.
 */
export function magneticPosition(): [number, number, number] {
  const [ox, , oz] = destonerCleanOutletPos();
  const { length, legHeight } = REF.magnetic;
  const gap = REF.magneticLayout.gapFromDestoner;
  return [ox + gap + length / 2, legHeight, oz];
}

/** Magnetic separator top feed inlet flange — world position. */
export function magneticInletWorldPos(): [number, number, number] {
  const [mx, my, mz] = magneticPosition();
  const { height } = REF.magnetic;
  return [mx, my + height / 2 + 0.52, mz];
}

/** Magnetic separator bottom outlet flange — world position. */
export function magneticOutletWorldPos(): [number, number, number] {
  const [mx, my, mz] = magneticPosition();
  const { height } = REF.magnetic;
  return [mx, my - height / 2 - 0.52, mz];
}

/* ==========================================================================
   SCOURER LAYOUT HELPERS
   ========================================================================== */

/**
 * Scourer group origin — housing centre on X axis cylinder.
 * Legs extend to y = −legHeight; place so feet sit on the ground.
 */
export function scourerPosition(): [number, number, number] {
  const [ox, , oz] = magneticOutletWorldPos();
  const { length, legHeight } = REF.scourer;
  const gap = REF.scourerLayout.gapFromMagnetic;
  // Feed inlet local X = −length/3
  const x = ox + gap + length / 3;
  return [x, legHeight, oz];
}

/** Scourer top feed inlet flange — world position. */
export function scourerInletWorldPos(): [number, number, number] {
  const [sx, sy, sz] = scourerPosition();
  const { length, radius } = REF.scourer;
  return [sx - length / 3, sy + radius + 0.62, sz];
}

/** Scourer clean grain outlet flange — world position. */
export function scourerOutletWorldPos(): [number, number, number] {
  const [sx, sy, sz] = scourerPosition();
  const { length, radius } = REF.scourer;
  return [sx + length / 3, sy - radius - 0.62, sz];
}

/* ==========================================================================
   DAMPENER LAYOUT HELPERS
   ========================================================================== */

/**
 * Dampener group origin — housing centre on X axis cylinder.
 * Legs extend to y = −legHeight; place so feet sit on the ground.
 */
export function dampenerPosition(): [number, number, number] {
  const [ox, , oz] = scourerOutletWorldPos();
  const { length, legHeight } = REF.dampener;
  const gap = REF.dampenerLayout.gapFromScourer;
  // Feed inlet local X = −length/3
  const x = ox + gap + length / 3;
  return [x, legHeight, oz];
}

/** Dampener top feed inlet flange — world position. */
export function dampenerInletWorldPos(): [number, number, number] {
  const [dx, dy, dz] = dampenerPosition();
  const { length, radius } = REF.dampener;
  return [dx - length / 3, dy + radius + 0.72, dz];
}

/** Dampener conditioned grain outlet flange — world position. */
export function dampenerOutletWorldPos(): [number, number, number] {
  const [dx, dy, dz] = dampenerPosition();
  const { length, radius } = REF.dampener;
  return [dx + length / 3, dy - radius - 0.72, dz];
}
