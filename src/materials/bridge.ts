import * as THREE from "three";
import { createPlantMaterials } from "./createPlantMaterials";
import type { PlantMaterials } from "./types";

const initial = createPlantMaterials({});

/** Stainless — style guide "covers / pipes / shafts" */
export const matSteel = initial.stainless;
export const matSteelDark = initial.stainlessDark;
export const matFlange = initial.flange;
export const matPaintedSteel = initial.paintedSteel;
export const matPaintBlue = initial.paintBlue;
export const matPaintDark = initial.paintDark;
export const matPaintYellow = initial.paintYellow;
export const matGalvanized = initial.galvanized;
export const matRubber = initial.rubber;
export const matConcrete = initial.concrete;
export const matPneumatic = initial.pneumatic;
export const matDustDuct = initial.dustDuct;
export const matDeck = initial.deck;
export const matStructureSteel = initial.structureSteel;
export const matRailYellow = initial.railYellow;

/** Copy PBR / updated settings onto existing pinned placeholders (same object refs). */
export function hydrateBridge(m: PlantMaterials): void {
  const pairs: [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial][] = [
    [matSteel, m.stainless],
    [matSteelDark, m.stainlessDark],
    [matFlange, m.flange],
    [matPaintedSteel, m.paintedSteel],
    [matPaintBlue, m.paintBlue],
    [matPaintDark, m.paintDark],
    [matPaintYellow, m.paintYellow],
    [matGalvanized, m.galvanized],
    [matRubber, m.rubber],
    [matConcrete, m.concrete],
    [matPneumatic, m.pneumatic],
    [matDustDuct, m.dustDuct],
    [matDeck, m.deck],
    [matStructureSteel, m.structureSteel],
    [matRailYellow, m.railYellow],
  ];
  for (const [dst, src] of pairs) {
    dst.color.copy(src.color);
    dst.metalness = src.metalness;
    dst.roughness = src.roughness;
    dst.envMapIntensity = src.envMapIntensity;
    dst.map = src.map;
    dst.normalMap = src.normalMap;
    dst.roughnessMap = src.roughnessMap;
    dst.metalnessMap = src.metalnessMap;
    dst.aoMap = src.aoMap;
    dst.needsUpdate = true;
  }
}
