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
  /**
   * Hybrid plant zones — raw on Z=0, cleaning/conditioning on +Z aisle,
   * milling on −Z aisle with stepped decks (gravity / multi-level cue).
   */
  zones: {
    raw: { z: 0, floorY: 0 },
    cleaning: { z: 3.0, floorY: 0 },
    conditioning: { z: 3.0, floorY: 0 },
    milling: {
      z: -2.0,
      /** Steel mezzanine under roller mill + bran finisher. */
      millDeckY: 2.8,
      /** Upper gallery deck under plansifter + purifier. */
      upperDeckY: 5.5,
    },
    /** Finished-product flour bins — same aisle as milling for a readable twin. */
    storage: { z: -2.0, floorY: 0 },
    /** Packing cell — slightly toward +Z so it stays in the default overview. */
    packing: { z: -2.0, floorY: 0 },
    gaps: {
      /** Extra X gap at cleaning → conditioning boundary (metres). */
      cleaningToConditioning: 3.5,
      /** X run from conditioning bin outlet toward milling aisle (metres). */
      conditioningToMillingX: 4.5,
    },
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
    /** Intra-zone clearance; section gap added from REF.zones.gaps. */
    gapFromScourer: 1.5,
  },
  conditioningBin: {
    radius: 1.5,
    height: 6,
    coneHeight: 1.5,
    legHeight: 2.5,
    capacity: 12,
  },
  conditioningBinLayout: {
    /** Gap from dampener outlet to bin feed flange (metres). */
    gapFromDampener: 2.0,
  },
  rollerMill: {
    width: 2.5,
    height: 2.2,
    depth: 1.8,
    legHeight: 1.5,
  },
  rollerMillLayout: {
    /** Extra clearance past zone X transfer (metres). */
    gapFromBin: 2.5,
  },
  plansifter: {
    width: 2.5,
    height: 3.5,
    depth: 2.0,
    frameHeight: 6.0,
  },
  plansifterLayout: {
    /**
     * Gap from roller mill outlet to plansifter centre X (metres).
     * Extra space left for multiple discharge chutes underneath.
     */
    gapFromMill: 3.2,
  },
  purifier: {
    width: 3.5,
    height: 2.0,
    depth: 2.2,
    legHeight: 1.2,
  },
  purifierLayout: {
    /** Gap from plansifter centre to purifier centre X (metres). */
    gapFromPlansifter: 3.5,
  },
  branFinisher: {
    length: 2.5,
    radius: 0.65,
    legHeight: 1.2,
  },
  branFinisherLayout: {
    /** Gap from purifier centre to bran finisher centre X (metres). */
    gapFromPurifier: 4.0,
  },
  flourBin: {
    radius: 1.2,
    height: 5,
    coneHeight: 1.8,
    legHeight: 2.5,
    capacity: 20,
  },
  flourBinLayout: {
    /** Gap from bran finisher centre to flour-bin row centre X (metres). */
    gapFromBranFinisher: 4.5,
    /** Centre-to-centre spacing along +Z for bins A/B/C (metres). */
    spacingZ: 2.8,
  },
  packingMachine: {
    width: 2.4,
    depth: 1.8,
    height: 2.0,
  },
  packingLayout: {
    /** Gap from flour bin A centre to packing machine centre X (metres). */
    gapFromFlourBin: 3.5,
  },
  bagConveyor: {
    length: 3.5,
    width: 0.7,
    height: 0.85,
  },
  bagConveyorLayout: {
    /** Clearance from packing takeaway end to conveyor inlet (metres). */
    gapFromPacking: 0.25,
  },
  bagSewing: {
    width: 1.0,
    depth: 0.8,
    height: 2.2,
  },
  bagSewingLayout: {
    /** Gap from bag conveyor outlet to sewing gantry centre (metres). */
    gapFromConveyor: 0.15,
  },
} as const;

export type ZoneId = 'raw' | 'cleaning' | 'conditioning' | 'milling' | 'storage' | 'packing';

/** World-space origin hint for a plant zone (aisle Z + floor/deck Y). */
export function zoneOrigin(zone: ZoneId): [number, number, number] {
  if (zone === 'milling') {
    return [0, REF.zones.milling.millDeckY, REF.zones.milling.z];
  }
  if (zone === 'cleaning') {
    return [0, REF.zones.cleaning.floorY, REF.zones.cleaning.z];
  }
  if (zone === 'conditioning') {
    return [0, REF.zones.conditioning.floorY, REF.zones.conditioning.z];
  }
  if (zone === 'storage') {
    return [0, REF.zones.storage.floorY, REF.zones.storage.z];
  }
  if (zone === 'packing') {
    return [0, REF.zones.packing.floorY, REF.zones.packing.z];
  }
  return [0, REF.zones.raw.floorY, REF.zones.raw.z];
}

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

/** Vibro separator group origin — cleaning aisle (+Z), base on the ground (y = 0). */
export function separatorPosition(): [number, number, number] {
  const [ex] = elevatorPosition();
  return [
    ex + REF.separatorLayout.offsetXFromElevator,
    REF.zones.cleaning.floorY,
    REF.zones.cleaning.z,
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
  const gap =
    REF.dampenerLayout.gapFromScourer + REF.zones.gaps.cleaningToConditioning;
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

/* ==========================================================================
   CONDITIONING BIN LAYOUT HELPERS
   ========================================================================== */

/** Lift so cone tip / outlet clear the floor (matches ConditioningBinComponent). */
export function conditioningBinBodyLift() {
  return REF.conditioningBin.coneHeight / 2 + 0.7;
}

/**
 * Conditioning bin group origin — base on ground (y = 0).
 * Component is rotated 180° in the line so the side inlet faces −X (toward dampener).
 */
export function conditioningBinPosition(): [number, number, number] {
  const [ox, , oz] = dampenerOutletWorldPos();
  const { radius } = REF.conditioningBin;
  const gap = REF.conditioningBinLayout.gapFromDampener;
  // After Y=π rotation, inlet flange is at local −(radius + 0.15)
  const x = ox + gap + radius + 0.15;
  return [x, 0, oz];
}

/** Conditioning bin feed inlet flange — world position (faces −X). */
export function conditioningBinInletWorldPos(): [number, number, number] {
  const [bx, by, bz] = conditioningBinPosition();
  const { radius, height, coneHeight } = REF.conditioningBin;
  const totalHeight = height + coneHeight;
  const lift = conditioningBinBodyLift();
  return [bx - radius - 0.15, by + lift + totalHeight - 0.15, bz];
}

/** Conditioning bin bottom outlet flange — world position. */
export function conditioningBinOutletWorldPos(): [number, number, number] {
  const [bx, by, bz] = conditioningBinPosition();
  const { coneHeight } = REF.conditioningBin;
  const lift = conditioningBinBodyLift();
  return [bx, by + lift - coneHeight / 2 - 0.65, bz];
}

/* ==========================================================================
   ROLLER MILL LAYOUT HELPERS
   ========================================================================== */

/**
 * Roller mill group origin — milling aisle (−Z) on mill mezzanine deck.
 * Legs extend to y = −legHeight; feet sit on millDeckY.
 */
export function rollerMillPosition(): [number, number, number] {
  const [ox] = conditioningBinOutletWorldPos();
  const { legHeight } = REF.rollerMill;
  const gap = REF.zones.gaps.conditioningToMillingX + REF.rollerMillLayout.gapFromBin;
  const deckY = REF.zones.milling.millDeckY;
  return [ox + gap, deckY + legHeight, REF.zones.milling.z];
}

/** Roller mill feed hopper top flange — world position. */
export function rollerMillInletWorldPos(): [number, number, number] {
  const [mx, my, mz] = rollerMillPosition();
  const { height } = REF.rollerMill;
  // Hopper centre at height/2 + 0.4, top flange +0.42
  return [mx, my + height / 2 + 0.82, mz];
}

/** Roller mill outlet chute bottom flange — world position. */
export function rollerMillOutletWorldPos(): [number, number, number] {
  const [mx, my, mz] = rollerMillPosition();
  const { height } = REF.rollerMill;
  // Outlet centre at −height/2 − 0.4, bottom flange −0.42
  return [mx, my - height / 2 - 0.82, mz];
}

/* ==========================================================================
   PLANSIFTER LAYOUT HELPERS
   ========================================================================== */

/**
 * Plansifter group origin — milling aisle, feet on upper gallery deck.
 * Frame bases sit on upperDeckY; cabinet hangs within the 6 m frame.
 */
export function plansifterPosition(): [number, number, number] {
  const [ox] = rollerMillOutletWorldPos();
  const { frameHeight } = REF.plansifter;
  const gap = REF.plansifterLayout.gapFromMill;
  const deckY = REF.zones.milling.upperDeckY;
  return [ox + gap, deckY + frameHeight / 2, REF.zones.milling.z];
}

/** Plansifter top feed inlet flange — world position. */
export function plansifterInletWorldPos(): [number, number, number] {
  const [px, py, pz] = plansifterPosition();
  const { height } = REF.plansifter;
  // Feed inlet centre at height/2 + 0.8, top flange +0.42
  return [px, py + height / 2 + 1.22, pz];
}

/** Plansifter flour outlet flange (primary product stream) — world position. */
export function plansifterFlourOutletWorldPos(): [number, number, number] {
  const [px, py, pz] = plansifterPosition();
  const { width, height } = REF.plansifter;
  const spacing = width * 0.25;
  // Flour is leftmost chute; outlet group at −height/2 − 0.4, flange −0.42
  return [px - spacing * 1.5, py - height / 2 - 0.82, pz];
}

/** Plansifter semolina outlet flange — feeds the purifier. */
export function plansifterSemolinaOutletWorldPos(): [number, number, number] {
  const [px, py, pz] = plansifterPosition();
  const { width, height } = REF.plansifter;
  const spacing = width * 0.25;
  return [px - spacing * 0.5, py - height / 2 - 0.82, pz];
}

/** Plansifter oversize / return outlet flange — world position. */
export function plansifterOversizeOutletWorldPos(): [number, number, number] {
  const [px, py, pz] = plansifterPosition();
  const { width, height } = REF.plansifter;
  const spacing = width * 0.25;
  return [px + spacing * 1.5, py - height / 2 - 0.82, pz];
}

/* ==========================================================================
   PURIFIER LAYOUT HELPERS
   ========================================================================== */

/**
 * Purifier group origin — milling aisle, feet on upper gallery deck.
 */
export function purifierPosition(): [number, number, number] {
  const [px] = plansifterPosition();
  const { legHeight } = REF.purifier;
  const gap = REF.purifierLayout.gapFromPlansifter;
  const deckY = REF.zones.milling.upperDeckY;
  return [px + gap, deckY + legHeight, REF.zones.milling.z];
}

/** Purifier top feed inlet flange — world position. */
export function purifierInletWorldPos(): [number, number, number] {
  const [ux, uy, uz] = purifierPosition();
  const { height } = REF.purifier;
  return [ux, uy + height / 2 + 0.82, uz];
}

/** Purifier clean semolina outlet flange — world position. */
export function purifierSemolinaOutletWorldPos(): [number, number, number] {
  const [ux, uy, uz] = purifierPosition();
  const { width, height } = REF.purifier;
  const spacing = width * 0.3;
  return [ux - spacing, uy - height / 2 - 0.82, uz];
}

/** Purifier bran outlet flange — feeds the bran finisher. */
export function purifierBranOutletWorldPos(): [number, number, number] {
  const [ux, uy, uz] = purifierPosition();
  const { width, height } = REF.purifier;
  const spacing = width * 0.3;
  return [ux + spacing, uy - height / 2 - 0.82, uz];
}

/* ==========================================================================
   BRAN FINISHER LAYOUT HELPERS
   ========================================================================== */

/**
 * Bran finisher group origin — milling aisle at grade (below purifier for gravity drop).
 */
export function branFinisherPosition(): [number, number, number] {
  const [px] = purifierPosition();
  const { legHeight } = REF.branFinisher;
  const gap = REF.branFinisherLayout.gapFromPurifier;
  return [px + gap, legHeight, REF.zones.milling.z];
}

/** Bran finisher top feed inlet flange — world position. */
export function branFinisherInletWorldPos(): [number, number, number] {
  const [bx, by, bz] = branFinisherPosition();
  const { radius } = REF.branFinisher;
  return [bx, by + radius + 0.82, bz];
}

/** Recovered flour outlet flange (bottom collection) — world position. */
export function branFinisherFlourOutletWorldPos(): [number, number, number] {
  const [bx, by, bz] = branFinisherPosition();
  const { radius } = REF.branFinisher;
  return [bx, by - radius - 0.82, bz];
}

/** Final bran outlet flange (end discharge) — world position. */
export function branFinisherBranOutletWorldPos(): [number, number, number] {
  const [bx, by, bz] = branFinisherPosition();
  const { length } = REF.branFinisher;
  return [bx + length / 2 + 0.85, by - 0.1, bz];
}

/* ==========================================================================
   FLOUR BIN (FINISHED PRODUCT STORAGE) LAYOUT HELPERS
   ========================================================================== */

export type FlourBinId = 'A' | 'B' | 'C';

const FLOUR_BIN_Z_OFFSET: Record<FlourBinId, number> = {
  /** Spread toward +Z so storage stays near the milling aisle overview. */
  A: 0,
  B: 1,
  C: 2,
};

/**
 * Flour bin group origin — storage aisle, feet on grade.
 * Three bins (A/B/C) spaced along +Z from the milling centreline.
 */
export function flourBinPosition(id: FlourBinId = 'B'): [number, number, number] {
  const [fx] = branFinisherPosition();
  const gap = REF.flourBinLayout.gapFromBranFinisher;
  const spacing = REF.flourBinLayout.spacingZ;
  const z = REF.zones.storage.z + FLOUR_BIN_Z_OFFSET[id] * spacing;
  return [fx + gap, REF.zones.storage.floorY, z];
}

/** Side fill-pipe flange near top of bin — world position. */
export function flourBinInletWorldPos(id: FlourBinId = 'B'): [number, number, number] {
  const [bx, by, bz] = flourBinPosition(id);
  const { radius, height, coneHeight, legHeight } = REF.flourBin;
  const totalHeight = height + coneHeight;
  // Body lifted so cone tip sits at legHeight; fill pipe near top on +X side
  return [bx + radius + 0.9, by + legHeight + totalHeight - 0.45, bz];
}

/** Rotary-valve discharge flange under bin — world position. */
export function flourBinOutletWorldPos(id: FlourBinId = 'B'): [number, number, number] {
  const [bx, by, bz] = flourBinPosition(id);
  const { legHeight } = REF.flourBin;
  return [bx, by + legHeight - 0.7, bz];
}

/* ==========================================================================
   PACKING MACHINE LAYOUT HELPERS
   ========================================================================== */

/**
 * Packing machine group origin — packing cell, fed from Flour Bin A rotary valve.
 * Kept on Bin A X/Z so the takeaway (+Z) stays in the overview frustum.
 */
export function packingMachinePosition(): [number, number, number] {
  const [ax, , az] = flourBinPosition('A');
  const gap = REF.packingLayout.gapFromFlourBin;
  return [ax + gap, REF.zones.packing.floorY, az];
}

/** Feed-hopper top flange — mates with bin A discharge duct. */
export function packingMachineInletWorldPos(): [number, number, number] {
  const [px, py, pz] = packingMachinePosition();
  const { height } = REF.packingMachine;
  // Hoppers group at y=1.2; flange at height*0.9+0.15 within that group
  return [px, py + 1.2 + height * 0.9 + 0.15, pz];
}

/** Takeaway conveyor discharge end — start of bag conveyor cell. */
export function packingMachineConveyorEndWorldPos(): [number, number, number] {
  const [px, py, pz] = packingMachinePosition();
  const { depth } = REF.packingMachine;
  const legHeight = 0.8;
  return [px, py + legHeight - 0.02, pz + depth / 2 + 1.2];
}

/* ==========================================================================
   BAG CONVEYOR LAYOUT HELPERS
   ========================================================================== */

/**
 * Bag conveyor group origin — packing cell, length runs along +Z (rotated −90° in line).
 * Inlet mates with packing machine takeaway; outlet feeds sewing station.
 */
export function bagConveyorPosition(): [number, number, number] {
  const [ex, , ez] = packingMachineConveyorEndWorldPos();
  const { length } = REF.bagConveyor;
  const gap = REF.bagConveyorLayout.gapFromPacking;
  return [ex, REF.zones.packing.floorY, ez + gap + length / 2];
}

/** Belt inlet flange — receives bags from packing takeaway. */
export function bagConveyorInletWorldPos(): [number, number, number] {
  const [cx, cy, cz] = bagConveyorPosition();
  const { length, height } = REF.bagConveyor;
  return [cx, cy + height, cz - length / 2];
}

/** Belt outlet flange — discharges toward sewing machine. */
export function bagConveyorOutletWorldPos(): [number, number, number] {
  const [cx, cy, cz] = bagConveyorPosition();
  const { length, height } = REF.bagConveyor;
  return [cx, cy + height, cz + length / 2];
}

/* ==========================================================================
   BAG SEWING MACHINE LAYOUT HELPERS
   ========================================================================== */

/**
 * Bag sewing gantry origin — straddles packing-cell centreline after bag conveyor.
 * Bags travel through along +Z (same as conveyor discharge).
 */
export function bagSewingMachinePosition(): [number, number, number] {
  const [ox, , oz] = bagConveyorOutletWorldPos();
  const { depth } = REF.bagSewing;
  const gap = REF.bagSewingLayout.gapFromConveyor;
  return [ox, REF.zones.packing.floorY, oz + gap + depth / 2];
}

/** Sewing zone inlet — bag enters under the head from −Z. */
export function bagSewingInletWorldPos(): [number, number, number] {
  const [sx, sy, sz] = bagSewingMachinePosition();
  const { depth } = REF.bagSewing;
  return [sx, sy + REF.bagConveyor.height, sz - depth / 2 - 0.2];
}

/** Sewing zone outlet — closed bag exits toward check weigher. */
export function bagSewingOutletWorldPos(): [number, number, number] {
  const [sx, sy, sz] = bagSewingMachinePosition();
  const { depth } = REF.bagSewing;
  return [sx, sy + REF.bagConveyor.height, sz + depth / 2 + 0.2];
}
