import * as THREE from "three";

/**
 * Shared materials tuned for scenes WITHOUT an HDR Environment map.
 * High metalness + no IBL reads as near-black in Three.js — keep metalness modest.
 */

export const matSteel = new THREE.MeshStandardMaterial({
  color: "#9aa0a6",
  metalness: 0.28,
  roughness: 0.55,
});

export const matSteelDark = new THREE.MeshStandardMaterial({
  color: "#5a6068",
  metalness: 0.3,
  roughness: 0.58,
});

export const matFlange = new THREE.MeshStandardMaterial({
  color: "#8a9098",
  metalness: 0.32,
  roughness: 0.5,
});

export const matPaintBlue = new THREE.MeshStandardMaterial({
  color: "#3a5f8a",
  metalness: 0.15,
  roughness: 0.6,
});

export const matPaintYellow = new THREE.MeshStandardMaterial({
  color: "#c9a227",
  metalness: 0.12,
  roughness: 0.55,
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
  color: "#c0c8d0",
  metalness: 0.25,
  roughness: 0.5,
});

export const matDustDuct = new THREE.MeshStandardMaterial({
  color: "#5a6068",
  metalness: 0.28,
  roughness: 0.55,
});

export const matDeck = new THREE.MeshStandardMaterial({
  color: "#6a7278",
  metalness: 0.28,
  roughness: 0.55,
});

export const matStructureSteel = new THREE.MeshStandardMaterial({
  color: "#4a545c",
  metalness: 0.3,
  roughness: 0.55,
});

export const matRailYellow = new THREE.MeshStandardMaterial({
  color: "#e0a92c",
  metalness: 0.15,
  roughness: 0.5,
});
