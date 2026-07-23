import * as THREE from "three";
import { pin } from "./pin";
import { setMapsRepeat } from "./repeat";
import type { PlantMaterials } from "./types";

export type TexBag = {
  map?: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
  aoMap?: THREE.Texture;
};

export type LoadedTextureGroups = {
  concrete?: TexBag;
  stainless?: TexBag;
  paintedSteel?: TexBag;
  galvanized?: TexBag;
  rubber?: TexBag;
};

function cloneMaps(maps: TexBag | undefined): TexBag | undefined {
  if (!maps) return undefined;
  const out: TexBag = {};
  if (maps.map) out.map = maps.map.clone();
  if (maps.normalMap) out.normalMap = maps.normalMap.clone();
  if (maps.roughnessMap) out.roughnessMap = maps.roughnessMap.clone();
  if (maps.metalnessMap) out.metalnessMap = maps.metalnessMap.clone();
  if (maps.aoMap) out.aoMap = maps.aoMap.clone();
  return out;
}

function std(opts: {
  color: string;
  metalness: number;
  roughness: number;
  envMapIntensity?: number;
  maps?: TexBag;
  repeat?: [number, number];
}): THREE.MeshStandardMaterial {
  const maps = cloneMaps(opts.maps);
  if (maps && opts.repeat) {
    setMapsRepeat(maps as Record<string, THREE.Texture | undefined>, opts.repeat[0], opts.repeat[1]);
  }
  return pin(
    new THREE.MeshStandardMaterial({
      color: opts.color,
      metalness: opts.metalness,
      roughness: opts.roughness,
      envMapIntensity: opts.envMapIntensity ?? 0.6,
      map: maps?.map,
      normalMap: maps?.normalMap,
      roughnessMap: maps?.roughnessMap,
      metalnessMap: maps?.metalnessMap,
      aoMap: maps?.aoMap,
    })
  );
}

/**
 * Sprint 1: call with `{}` → flat mats matching current plant look.
 * Sprint 2+: pass loaded texture groups to enable PBR maps.
 */
export function createPlantMaterials(tex: LoadedTextureGroups = {}): PlantMaterials {
  const hasMaps = Boolean(
    tex.concrete || tex.stainless || tex.paintedSteel || tex.galvanized || tex.rubber
  );

  // Flat mode: low metalness (matches pre-PBR sharedMaterials) so nothing goes black.
  if (!hasMaps) {
    return {
      stainless: std({ color: "#a8aeb4", metalness: 0.12, roughness: 0.62 }),
      stainlessDark: std({ color: "#6a7278", metalness: 0.14, roughness: 0.65 }),
      flange: std({ color: "#949aA0", metalness: 0.15, roughness: 0.58 }),
      paintedSteel: std({ color: "#7a8288", metalness: 0.08, roughness: 0.65 }),
      paintBlue: std({ color: "#3a5f8a", metalness: 0.08, roughness: 0.65 }),
      paintDark: std({ color: "#3a454c", metalness: 0.1, roughness: 0.6 }),
      paintYellow: std({ color: "#c9a227", metalness: 0.08, roughness: 0.6 }),
      paintOrange: std({ color: "#ff6600", metalness: 0.25, roughness: 0.55 }),
      galvanized: std({ color: "#9aa2a6", metalness: 0.12, roughness: 0.6 }),
      rubber: std({ color: "#2a2a2a", metalness: 0.02, roughness: 0.92 }),
      concrete: std({ color: "#b0b0a8", metalness: 0.02, roughness: 0.95 }),
      pneumatic: std({ color: "#c8d0d8", metalness: 0.12, roughness: 0.55 }),
      dustDuct: std({ color: "#6a7278", metalness: 0.12, roughness: 0.6 }),
      deck: std({ color: "#7a8288", metalness: 0.12, roughness: 0.6 }),
      structureSteel: std({ color: "#6a747c", metalness: 0.12, roughness: 0.6 }),
      railYellow: std({ color: "#e0a92c", metalness: 0.08, roughness: 0.55 }),
    };
  }

  return {
    stainless: std({
      color: "#c8ced4",
      metalness: 0.85,
      roughness: 0.35,
      envMapIntensity: 1.1,
      maps: tex.stainless,
      repeat: [2, 2],
    }),
    stainlessDark: std({
      color: "#8a9298",
      metalness: 0.8,
      roughness: 0.42,
      envMapIntensity: 1.0,
      maps: tex.stainless,
      repeat: [2, 2],
    }),
    flange: std({
      color: "#a0a6ac",
      metalness: 0.75,
      roughness: 0.4,
      envMapIntensity: 1.0,
      maps: tex.stainless,
      repeat: [1, 1],
    }),
    paintedSteel: std({
      color: "#7a8288",
      metalness: 0.25,
      roughness: 0.55,
      envMapIntensity: 0.7,
      maps: tex.paintedSteel,
      repeat: [1.5, 1.5],
    }),
    paintBlue: std({
      color: "#3a5f8a",
      metalness: 0.2,
      roughness: 0.55,
      envMapIntensity: 0.7,
      maps: tex.paintedSteel,
      repeat: [1.2, 1.2],
    }),
    paintDark: std({
      color: "#3a454c",
      metalness: 0.22,
      roughness: 0.58,
      envMapIntensity: 0.65,
      maps: tex.paintedSteel,
      repeat: [1.2, 1.2],
    }),
    paintYellow: std({
      color: "#c9a227",
      metalness: 0.18,
      roughness: 0.5,
      envMapIntensity: 0.7,
      maps: tex.paintedSteel,
      repeat: [1.2, 1.2],
    }),
    paintOrange: std({
      color: "#ff6600",
      metalness: 0.22,
      roughness: 0.52,
      envMapIntensity: 0.7,
      maps: tex.paintedSteel,
      repeat: [1.2, 1.2],
    }),
    galvanized: std({
      color: "#b0b6b8",
      metalness: 0.7,
      roughness: 0.45,
      envMapIntensity: 0.9,
      maps: tex.galvanized,
      repeat: [3, 3],
    }),
    rubber: std({
      color: "#2a2a2a",
      metalness: 0.02,
      roughness: 0.92,
      envMapIntensity: 0.3,
      maps: tex.rubber,
      repeat: [2, 2],
    }),
    concrete: std({
      color: "#d0d0c8",
      metalness: 0.02,
      roughness: 0.92,
      envMapIntensity: 0.4,
      maps: tex.concrete,
      repeat: [12, 12],
    }),
    pneumatic: std({
      color: "#c8d0d8",
      metalness: 0.7,
      roughness: 0.38,
      envMapIntensity: 1.0,
      maps: tex.stainless,
      repeat: [1.5, 1.5],
    }),
    dustDuct: std({
      color: "#6a7278",
      metalness: 0.35,
      roughness: 0.55,
      envMapIntensity: 0.7,
      maps: tex.paintedSteel,
      repeat: [1.5, 1.5],
    }),
    deck: std({
      color: "#8a9298",
      metalness: 0.55,
      roughness: 0.5,
      envMapIntensity: 0.85,
      maps: tex.galvanized,
      repeat: [4, 4],
    }),
    structureSteel: std({
      color: "#6a747c",
      metalness: 0.3,
      roughness: 0.55,
      envMapIntensity: 0.7,
      maps: tex.paintedSteel,
      repeat: [2, 2],
    }),
    railYellow: std({
      color: "#e0a92c",
      metalness: 0.2,
      roughness: 0.48,
      envMapIntensity: 0.7,
      maps: tex.paintedSteel,
      repeat: [1, 1],
    }),
  };
}
