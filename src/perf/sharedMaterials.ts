import * as THREE from "three";

/** Shared GPU materials — module-level so programs are reused across meshes. */

export const matSteel = new THREE.MeshStandardMaterial({
  color: "#8a9096",
  metalness: 0.65,
  roughness: 0.35,
});

export const matSteelDark = new THREE.MeshStandardMaterial({
  color: "#4a5056",
  metalness: 0.7,
  roughness: 0.4,
});

export const matFlange = new THREE.MeshStandardMaterial({
  color: "#7a8288",
  metalness: 0.75,
  roughness: 0.35,
});

export const matPaintBlue = new THREE.MeshStandardMaterial({
  color: "#3a5f8a",
  metalness: 0.25,
  roughness: 0.55,
});

export const matPaintYellow = new THREE.MeshStandardMaterial({
  color: "#c9a227",
  metalness: 0.2,
  roughness: 0.5,
});

export const matRubber = new THREE.MeshStandardMaterial({
  color: "#2a2a2a",
  metalness: 0.05,
  roughness: 0.9,
});

export const matConcrete = new THREE.MeshStandardMaterial({
  color: "#9a9a92",
  metalness: 0.05,
  roughness: 0.95,
});

export const matPneumatic = new THREE.MeshStandardMaterial({
  color: "#b8c0c8",
  metalness: 0.65,
  roughness: 0.4,
});

export const matDustDuct = new THREE.MeshStandardMaterial({
  color: "#4a5058",
  metalness: 0.65,
  roughness: 0.4,
});

export const matDeck = new THREE.MeshStandardMaterial({
  color: "#5a6268",
  metalness: 0.7,
  roughness: 0.4,
});

export const matStructureSteel = new THREE.MeshStandardMaterial({
  color: "#3a454c",
  metalness: 0.75,
  roughness: 0.35,
});

export const matRailYellow = new THREE.MeshStandardMaterial({
  color: "#e0a92c",
  metalness: 0.35,
  roughness: 0.45,
});
