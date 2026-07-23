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
   * U / serpentine plant (axis-aligned):
   *  top (+Z): raw → cleaning (+X)
   *  right: conditioning (−Z drop)
   *  bottom (−Z): milling → storage (−X fold)
   *  south: packing → warehouse (+X)
   */
  zones: {
    raw: { z: 6.0, floorY: 0 },
    cleaning: { z: 6.0, floorY: 0 },
    conditioning: { z: 0.0, floorY: 0 },
    milling: {
      z: -6.0,
      /** Steel mezzanine under roller mill + bran finisher. */
      millDeckY: 2.8,
      /** Upper gallery deck under plansifter + purifier. */
      upperDeckY: 5.5,
    },
    storage: { z: -6.0, floorY: 0 },
    packing: { z: -16.0, floorY: 0 },
    warehouse: { z: -16.0, floorY: 0 },
    gaps: {
      /** Small +X clearance when dropping cleaning → conditioning (−Z). */
      cleaningToConditioning: 1.2,
      /** Clearance when dropping conditioning → milling aisle (−Z). */
      conditioningToMillingX: 1.5,
      /** Extra Z used when framing storage → packing drop. */
      storageToPackingZ: 4.0,
      packingToWarehouseX: 2.5,
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
  checkWeigher: {
    length: 2.2,
    width: 0.9,
    /** Belt / deck height — matches bag conveyor for continuous bag line. */
    height: 0.85,
  },
  checkWeigherLayout: {
    /** Gap from sewing outlet to check-weigher inlet (metres). */
    gapFromSewing: 0.2,
  },
  metalDetector: {
    length: 2.5,
    width: 0.9,
    /** Belt / deck height — matches bag conveyor / check weigher. */
    height: 0.85,
    tunnelHeight: 1.0,
    tunnelDepth: 0.8,
  },
  metalDetectorLayout: {
    /** Gap from check-weigher outlet to metal-detector inlet (metres). */
    gapFromCheckWeigher: 0.25,
  },
  palletizer: {
    cellSize: 5,
    /** Local X of pick-conveyor centre (bags enter from −X). */
    pickOffsetX: 1.5,
    pickLength: 1.5,
    /** Belt height — matches packing-cell conveyors. */
    height: 0.85,
  },
  palletizerLayout: {
    /** Gap from metal-detector outlet to palletizer pick inlet (metres). */
    gapFromMetalDetector: 0.35,
  },
  /** Shared dust-collection utility (darker steel than product ducts). */
  dustSystem: {
    headerHeight: 3.6,
    headerRadius: 0.22,
    branchRadius: 0.12,
    /** Offset +Z from cleaning aisle centreline so header clears machines. */
    headerOffsetZ: 2.2,
    bagFilterWidth: 2.4,
    bagFilterDepth: 2.0,
    bagFilterHeight: 5.5,
    fanRadius: 0.55,
    stackHeight: 4.5,
    stackRadius: 0.28,
  },
  /** Electrical spine — MCC / trays / local panels. */
  electrical: {
    trayHeight: 4.2,
    trayWidth: 0.45,
    trayDepth: 0.12,
    /** Offset −Z from milling/packing aisle for tray clear of machines. */
    millingTrayOffsetZ: -1.8,
    /** Offset +Z from cleaning aisle for tray clear of machines. */
    cleaningTrayOffsetZ: 1.6,
    mccWidth: 4.8,
    mccDepth: 0.7,
    mccHeight: 2.2,
    plcWidth: 0.8,
    plcDepth: 0.5,
    plcHeight: 1.8,
  },
  /** Warehouse staging past palletizer forklift zone (+X). */
  warehouse: {
    bayCount: 3,
    aisleCount: 2,
    baySpacingX: 1.8,
    aisleSpacingZ: 2.6,
    rackHeight: 3.2,
    /** Gap from palletizer cell centre to warehouse origin (metres). */
    gapFromPalletizer: 9.5,
  },
} as const;

export type ZoneId =
  | 'raw'
  | 'cleaning'
  | 'conditioning'
  | 'milling'
  | 'storage'
  | 'packing'
  | 'warehouse';

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
  if (zone === 'warehouse') {
    return [0, REF.zones.warehouse.floorY, REF.zones.warehouse.z];
  }
  return [0, REF.zones.raw.floorY, REF.zones.raw.z];
}

/** Raw-aisle Z (silo → elevator). */
export function rawAisleZ() {
  return REF.zones.raw.z;
}

/** Silo group origin — start of raw aisle. */
export function siloPosition(): [number, number, number] {
  return [0, 0, rawAisleZ()];
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
  return [x, 0, rawAisleZ()];
}

/** Boot inlet flange world position (screw → elevator connection point). */
export function elevatorBootInlet(): [number, number, number] {
  const [ex, , ez] = elevatorPosition();
  return [ex + REF.elevator.width / 2 + 0.05, REF.elevator.bootHeight / 2, ez];
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
 * Dampener group origin — conditioning aisle (−Z from cleaning).
 * Keeps a small +X step from scourer; main transfer is the Z drop.
 */
export function dampenerPosition(): [number, number, number] {
  const [ox] = scourerOutletWorldPos();
  const { length, legHeight } = REF.dampener;
  const gap = REF.dampenerLayout.gapFromScourer + REF.zones.gaps.cleaningToConditioning;
  const x = ox + gap + length / 3;
  return [x, legHeight, REF.zones.conditioning.z];
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
 * Conditioning bin group origin — conditioning aisle.
 * Component is rotated 180° in the line so the side inlet faces −X (toward dampener).
 */
export function conditioningBinPosition(): [number, number, number] {
  const [ox] = dampenerOutletWorldPos();
  const { radius } = REF.conditioningBin;
  const gap = REF.conditioningBinLayout.gapFromDampener;
  const x = ox + gap + radius + 0.15;
  return [x, 0, REF.zones.conditioning.z];
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
 * Roller mill — east end of milling aisle (−Z from conditioning), then process folds −X.
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
 * Plansifter — west of roller mill (−X fold on milling aisle).
 */
export function plansifterPosition(): [number, number, number] {
  const [ox] = rollerMillPosition();
  const { frameHeight } = REF.plansifter;
  const gap = REF.plansifterLayout.gapFromMill;
  const deckY = REF.zones.milling.upperDeckY;
  return [ox - gap, deckY + frameHeight / 2, REF.zones.milling.z];
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
 * Purifier — further −X on milling upper deck.
 */
export function purifierPosition(): [number, number, number] {
  const [px] = plansifterPosition();
  const { legHeight } = REF.purifier;
  const gap = REF.purifierLayout.gapFromPlansifter;
  const deckY = REF.zones.milling.upperDeckY;
  return [px - gap, deckY + legHeight, REF.zones.milling.z];
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
 * Bran finisher — further −X at grade on milling aisle.
 */
export function branFinisherPosition(): [number, number, number] {
  const [px] = purifierPosition();
  const { legHeight } = REF.branFinisher;
  const gap = REF.branFinisherLayout.gapFromPurifier;
  return [px - gap, legHeight, REF.zones.milling.z];
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

const FLOUR_BIN_X_OFFSET: Record<FlourBinId, number> = {
  /** Spaced west (−X) from bran finisher; A is packing feed (closest to bran). */
  A: 0,
  B: 1,
  C: 2,
};

/**
 * Flour bin group origin — storage aisle, spaced along −X (U fold).
 */
export function flourBinPosition(id: FlourBinId = 'B'): [number, number, number] {
  const [fx] = branFinisherPosition();
  const gap = REF.flourBinLayout.gapFromBranFinisher;
  const spacing = REF.flourBinLayout.spacingZ;
  const x = fx - gap - FLOUR_BIN_X_OFFSET[id] * spacing;
  return [x, REF.zones.storage.floorY, REF.zones.storage.z];
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
 * Packing machine — packing aisle (−Z from storage), then bag line continues +X.
 */
export function packingMachinePosition(): [number, number, number] {
  const [ax] = flourBinPosition('A');
  const gap = REF.packingLayout.gapFromFlourBin;
  return [ax + gap, REF.zones.packing.floorY, REF.zones.packing.z];
}

/** Feed-hopper top flange — mates with bin A discharge duct. */
export function packingMachineInletWorldPos(): [number, number, number] {
  const [px, py, pz] = packingMachinePosition();
  const { height } = REF.packingMachine;
  // Hoppers group at y=1.2; flange at height*0.9+0.15 within that group
  return [px, py + 1.2 + height * 0.9 + 0.15, pz];
}

/** Takeaway conveyor discharge end — start of bag conveyor cell (+X). */
export function packingMachineConveyorEndWorldPos(): [number, number, number] {
  const [px, py, pz] = packingMachinePosition();
  const { width } = REF.packingMachine;
  const legHeight = 0.8;
  return [px + width / 2 + 1.2, py + legHeight - 0.02, pz];
}

/* ==========================================================================
   BAG CONVEYOR LAYOUT HELPERS
   ========================================================================== */

/**
 * Bag conveyor group origin — packing cell, length runs along +X (no rotation).
 * Inlet mates with packing machine takeaway; outlet feeds sewing station.
 */
export function bagConveyorPosition(): [number, number, number] {
  const [ex, , ez] = packingMachineConveyorEndWorldPos();
  const { length } = REF.bagConveyor;
  const gap = REF.bagConveyorLayout.gapFromPacking;
  return [ex + gap + length / 2, REF.zones.packing.floorY, ez];
}

/** Belt inlet flange — receives bags from packing takeaway. */
export function bagConveyorInletWorldPos(): [number, number, number] {
  const [cx, cy, cz] = bagConveyorPosition();
  const { length, height } = REF.bagConveyor;
  return [cx - length / 2, cy + height, cz];
}

/** Belt outlet flange — discharges toward sewing machine. */
export function bagConveyorOutletWorldPos(): [number, number, number] {
  const [cx, cy, cz] = bagConveyorPosition();
  const { length, height } = REF.bagConveyor;
  return [cx + length / 2, cy + height, cz];
}

/* ==========================================================================
   BAG SEWING MACHINE LAYOUT HELPERS
   ========================================================================== */

/**
 * Bag sewing gantry origin — after bag conveyor on packing +X centreline.
 * Local travel is +Z; in the line the group is rotated −90° so travel is +X.
 */
export function bagSewingMachinePosition(): [number, number, number] {
  const [ox, , oz] = bagConveyorOutletWorldPos();
  const { depth } = REF.bagSewing;
  const gap = REF.bagSewingLayout.gapFromConveyor;
  return [ox + gap + depth / 2, REF.zones.packing.floorY, oz];
}

/** Sewing zone inlet — bag enters under the head from −X (after −90° rotation). */
export function bagSewingInletWorldPos(): [number, number, number] {
  const [sx, sy, sz] = bagSewingMachinePosition();
  const { depth } = REF.bagSewing;
  return [sx - depth / 2 - 0.2, sy + REF.bagConveyor.height, sz];
}

/** Sewing zone outlet — closed bag exits toward check weigher. */
export function bagSewingOutletWorldPos(): [number, number, number] {
  const [sx, sy, sz] = bagSewingMachinePosition();
  const { depth } = REF.bagSewing;
  return [sx + depth / 2 + 0.2, sy + REF.bagConveyor.height, sz];
}

/* ==========================================================================
   CHECK WEIGHER LAYOUT HELPERS
   ========================================================================== */

/**
 * Check weigher group origin — packing cell after bag sewing.
 * Local length runs along +X (same as world packing flow — no rotation).
 */
export function checkWeigherPosition(): [number, number, number] {
  const [ox, , oz] = bagSewingOutletWorldPos();
  const { length } = REF.checkWeigher;
  const gap = REF.checkWeigherLayout.gapFromSewing;
  return [ox + gap + length / 2, REF.zones.packing.floorY, oz];
}

/** Infeed flange — receives sewn bags from −X. */
export function checkWeigherInletWorldPos(): [number, number, number] {
  const [cx, cy, cz] = checkWeigherPosition();
  const { length, height } = REF.checkWeigher;
  return [cx - length / 2, cy + height, cz];
}

/** Outfeed flange — accepted bags continue toward metal detector. */
export function checkWeigherOutletWorldPos(): [number, number, number] {
  const [cx, cy, cz] = checkWeigherPosition();
  const { length, height } = REF.checkWeigher;
  return [cx + length / 2, cy + height, cz];
}

/* ==========================================================================
   METAL DETECTOR LAYOUT HELPERS
   ========================================================================== */

/**
 * Metal detector group origin — packing cell after check weigher.
 * Local length runs along +X (same as world packing flow — no rotation).
 */
export function metalDetectorPosition(): [number, number, number] {
  const [ox, , oz] = checkWeigherOutletWorldPos();
  const { length } = REF.metalDetector;
  const gap = REF.metalDetectorLayout.gapFromCheckWeigher;
  return [ox + gap + length / 2, REF.zones.packing.floorY, oz];
}

/** Infeed flange — receives accepted bags from −X. */
export function metalDetectorInletWorldPos(): [number, number, number] {
  const [mx, my, mz] = metalDetectorPosition();
  const { length, height } = REF.metalDetector;
  return [mx - length / 2, my + height, mz];
}

/** Outfeed flange — clean bags continue toward palletizer. */
export function metalDetectorOutletWorldPos(): [number, number, number] {
  const [mx, my, mz] = metalDetectorPosition();
  const { length, height } = REF.metalDetector;
  return [mx + length / 2, my + height, mz];
}

/* ==========================================================================
   PALLETIZER LAYOUT HELPERS
   ========================================================================== */

/**
 * Robotic palletizer cell origin — packing cell after metal detector.
 * Pick conveyor faces −X (receives bags); pallets sit on +X side of the robot.
 */
export function palletizerPosition(): [number, number, number] {
  const [ox, , oz] = metalDetectorOutletWorldPos();
  const { pickOffsetX, pickLength } = REF.palletizer;
  const gap = REF.palletizerLayout.gapFromMetalDetector;
  const inletToCenter = pickOffsetX + pickLength / 2;
  return [ox + gap + inletToCenter, REF.zones.packing.floorY, oz];
}

/** Pick-conveyor inlet — mates with metal detector outfeed. */
export function palletizerInletWorldPos(): [number, number, number] {
  const [px, py, pz] = palletizerPosition();
  const { pickOffsetX, pickLength, height } = REF.palletizer;
  return [px - pickOffsetX - pickLength / 2, py + height, pz];
}

/** Cell far edge — finished pallets / forklift bay toward warehouse. */
export function palletizerOutletWorldPos(): [number, number, number] {
  const [px, py, pz] = palletizerPosition();
  const { cellSize, height } = REF.palletizer;
  // Includes outfeed conveyor + forklift loading bay beyond the fence
  return [px + cellSize / 2 + 5.2, py + height, pz];
}

/**
 * Warehouse staging origin — packing centreline, +X past forklift bay.
 */
export function warehouseStagingPosition(): [number, number, number] {
  const [px] = palletizerPosition();
  return [
    px + REF.warehouse.gapFromPalletizer + REF.zones.gaps.packingToWarehouseX,
    REF.zones.warehouse.floorY,
    REF.zones.warehouse.z,
  ];
}

/** Stretch-wrapper stub between palletizer outfeed and forklift bay (world). */
export function stretchWrapperPosition(): [number, number, number] {
  const [px, , pz] = palletizerPosition();
  const { cellSize } = REF.palletizer;
  return [px + cellSize / 2 + 2.4, 0, pz + 0.9];
}

/** Truck dock stub at far +X end of warehouse. */
export function truckDockPosition(): [number, number, number] {
  const [wx, , wz] = warehouseStagingPosition();
  const { bayCount, baySpacingX } = REF.warehouse;
  return [wx + bayCount * baySpacingX + 4.5, 0, wz];
}

/* ==========================================================================
   DUST COLLECTION LAYOUT HELPERS
   ========================================================================== */

/** Dust header centreline Z — offset from cleaning aisle to clear machines. */
export function dustHeaderZ(): number {
  return REF.zones.cleaning.z + REF.dustSystem.headerOffsetZ;
}

/** Dust header Y (metres above grade). */
export function dustHeaderY(): number {
  return REF.dustSystem.headerHeight;
}

/**
 * Horizontal dust header start/end along cleaning aisle (+X).
 * Runs from vibro through conditioning toward the bag filter.
 */
export function dustHeaderSpan(): { startX: number; endX: number; y: number; z: number } {
  const [sx] = separatorPosition();
  const [cx] = conditioningBinPosition();
  const y = dustHeaderY();
  const z = dustHeaderZ();
  return { startX: sx - 0.5, endX: cx + 3.5, y, z };
}

/** Point on the dust header at a given world X. */
export function dustHeaderPointAtX(x: number): [number, number, number] {
  return [x, dustHeaderY(), dustHeaderZ()];
}

/**
 * Bag filter house origin — end of cleaning dust header (+X), clear of milling decks.
 */
export function bagFilterPosition(): [number, number, number] {
  const { endX, z } = dustHeaderSpan();
  const { bagFilterWidth, bagFilterDepth } = REF.dustSystem;
  return [endX + bagFilterWidth / 2 + 0.8, 0, z];
}

/** Dirty-air inlet flange on the bag filter (faces −X toward header). */
export function bagFilterInletWorldPos(): [number, number, number] {
  const [bx, , bz] = bagFilterPosition();
  const { bagFilterWidth, bagFilterHeight } = REF.dustSystem;
  return [bx - bagFilterWidth / 2, bagFilterHeight * 0.55, bz];
}

/** Clean-air fan outlet on +X face of bag filter. */
export function bagFilterFanWorldPos(): [number, number, number] {
  const [bx, , bz] = bagFilterPosition();
  const { bagFilterWidth, bagFilterHeight } = REF.dustSystem;
  return [bx + bagFilterWidth / 2 + 0.15, bagFilterHeight * 0.35, bz];
}

/** Exhaust stack base above the centrifugal fan. */
export function dustStackBaseWorldPos(): [number, number, number] {
  const [fx, fy, fz] = bagFilterFanWorldPos();
  return [fx + 0.9, fy, fz];
}

/** Machine dust takeoff flanges (hood stubs above each asset). */
export function dustTakeoffWorldPos(
  machine: 'vibro' | 'destoner' | 'scourer' | 'purifier' | 'packing'
): [number, number, number] {
  if (machine === 'vibro') {
    const [x, , z] = separatorPosition();
    return [x, 2.4, z];
  }
  if (machine === 'destoner') {
    const [x, y, z] = destonerPosition();
    return [x, y + destonerDeckY() + 0.85, z];
  }
  if (machine === 'scourer') {
    const [x, , z] = scourerPosition();
    return [x, REF.scourer.legHeight + REF.scourer.radius + 0.9, z];
  }
  if (machine === 'purifier') {
    const [x, y, z] = purifierPosition();
    return [x, y + REF.purifier.height / 2 + 0.5, z];
  }
  const [px, , pz] = packingMachinePosition();
  return [px, REF.packingMachine.height + 1.6, pz];
}

/** Alias used by roadmap naming. */
export function dustHeaderPosition(): [number, number, number] {
  const span = dustHeaderSpan();
  return [(span.startX + span.endX) / 2, span.y, span.z];
}

/* ==========================================================================
   ELECTRICAL LAYOUT HELPERS
   ========================================================================== */

/** Overhead cable tray height (metres). */
export function cableTrayY(): number {
  return REF.electrical.trayHeight;
}

/**
 * Cleaning-aisle tray spine span (+X along machines, offset +Z).
 * From elevator through conditioning.
 */
export function cleaningCableTraySpan(): {
  startX: number;
  endX: number;
  y: number;
  z: number;
} {
  const [ex] = elevatorPosition();
  const [cx] = conditioningBinPosition();
  return {
    startX: ex - 1,
    endX: cx + 2,
    y: cableTrayY(),
    z: REF.zones.cleaning.z + REF.electrical.cleaningTrayOffsetZ,
  };
}

/**
 * Milling / packing tray spine — from roller mill through palletizer.
 */
export function millingCableTraySpan(): {
  startX: number;
  endX: number;
  y: number;
  z: number;
} {
  const [rx] = rollerMillPosition();
  const [px] = palletizerPosition();
  return {
    startX: rx - 2,
    endX: px + REF.palletizer.cellSize / 2 + 1,
    y: cableTrayY(),
    z: REF.zones.milling.z + REF.electrical.millingTrayOffsetZ,
  };
}

/**
 * MCC lineup — between conditioning and milling on +Z side of packing start,
 * clear of process machines (near flour bins / packing feed).
 */
export function mccPosition(): [number, number, number] {
  const [ax, , az] = flourBinPosition('A');
  const { mccWidth, mccDepth } = REF.electrical;
  return [ax - 1.5, 0, az + mccDepth / 2 + 2.8];
}

/** PLC cabinet beside the MCC lineup. */
export function plcCabinetPosition(): [number, number, number] {
  const [mx, , mz] = mccPosition();
  const { mccWidth, plcWidth } = REF.electrical;
  return [mx + mccWidth / 2 + plcWidth / 2 + 0.4, 0, mz];
}

/** Local panel stub beside a major machine (operator side). */
export function localPanelWorldPos(
  machine: 'elevator' | 'mill' | 'packing' | 'palletizer'
): [number, number, number] {
  if (machine === 'elevator') {
    const [x, , z] = elevatorPosition();
    return [x + 1.1, 1.2, z + 0.9];
  }
  if (machine === 'mill') {
    const [x, y, z] = rollerMillPosition();
    return [x - REF.rollerMill.width / 2 - 0.55, y - 0.2, z + 1.1];
  }
  if (machine === 'packing') {
    const [x, , z] = packingMachinePosition();
    return [x - 1.4, 1.15, z + 1.15];
  }
  const [x, , z] = palletizerPosition();
  return [x - REF.palletizer.cellSize / 2 - 0.4, 1.2, z + 2.2];
}

/* ==========================================================================
   PLANT EXTENTS (for ground / camera framing)
   ========================================================================== */

/** Axis-aligned plant footprint including packing cell (metres). */
export function plantBounds(): { minX: number; maxX: number; minZ: number; maxZ: number } {
  const samples: [number, number, number][] = [
    siloPosition(),
    elevatorPosition(),
    separatorPosition(),
    scourerPosition(),
    conditioningBinPosition(),
    rollerMillPosition(),
    plansifterPosition(),
    branFinisherPosition(),
    flourBinPosition('A'),
    flourBinPosition('C'),
    packingMachinePosition(),
    metalDetectorOutletWorldPos(),
    palletizerOutletWorldPos(),
    bagFilterPosition(),
    dustHeaderPointAtX(dustHeaderSpan().startX),
    dustHeaderPointAtX(dustHeaderSpan().endX),
    mccPosition(),
    plcCabinetPosition(),
    warehouseStagingPosition(),
    truckDockPosition(),
  ];
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [x, , z] of samples) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  // Margin for machine footprints / reject bins
  const pad = 4;
  return { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad };
}

/**
 * Building envelope extents — plant footprint plus hall clearance.
 * Used by BuildingEnvelope so walls are never hard-coded once.
 */
export function buildingEnvelopeBounds(): {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  width: number;
  depth: number;
  height: number;
  centerX: number;
  centerZ: number;
} {
  const b = plantBounds();
  const margin = 3.5;
  const minX = b.minX - margin;
  const maxX = b.maxX + margin;
  const minZ = b.minZ - margin;
  const maxZ = b.maxZ + margin;
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
    height: 12,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
  };
}

/** World-space centre of the full plant footprint (Y unused / 0). */
export function plantCenter(): [number, number, number] {
  const b = plantBounds();
  return [(b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2];
}

/** Ground radius that covers the plant with comfortable apron. */
export function plantGroundRadius(): number {
  const b = plantBounds();
  const [cx, , cz] = plantCenter();
  const hx = Math.max(Math.abs(b.minX - cx), Math.abs(b.maxX - cx));
  const hz = Math.max(Math.abs(b.minZ - cz), Math.abs(b.maxZ - cz));
  return Math.ceil(Math.hypot(hx, hz) + 8);
}

/** Footprint aspect (width/depth). Target ~0.8–2.0 after U-layout. */
export function plantAspectXZ(): number {
  const b = plantBounds();
  const w = b.maxX - b.minX;
  const d = b.maxZ - b.minZ;
  return w / Math.max(0.01, d);
}
