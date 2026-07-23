import fs from 'fs';
import path from 'path';

const root = path.resolve('src/components');
const importBlock = `import {
  matPaintBlue,
  matPaintDark,
  matPaintedSteel,
  matRubber,
  matSteel,
  matSteelDark,
  matStructureSteel,
  matRailYellow,
} from '../materials';`;

function addImport(content) {
  if (content.includes("from '../materials'")) return content;
  return content.replace(
    /import \* as THREE from 'three';/,
    `import * as THREE from 'three';\n${importBlock}`
  );
}

/** Replace mesh block: mesh opening attrs + geometry + meshStandardMaterial -> shared material */
function mesh(content, attrs, geometry, material) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const attrsClean = attrs.trim();
  const hasCast = attrsClean.includes('castShadow');
  const extra = hasCast ? ' castShadow' : '';
  const receive = attrsClean.includes('receiveShadow') ? ' receiveShadow' : '';
  const ref = attrsClean.match(/ref=\{([^}]+)\}/)?.[0] ?? '';
  const pos = attrsClean.match(/position=\{[^}]+\}/)?.[0] ?? '';
  const rot = attrsClean.match(/rotation=\{[^}]+\}/)?.[0] ?? '';
  const key = attrsClean.match(/key=\{[^}]+\}/)?.[0] ?? '';
  const parts = [key, ref, pos, rot].filter(Boolean).join(' ');
  const open = `<mesh${parts ? ' ' + parts : ''}${extra}${receive} dispose={null} material={${material}}>`;

  const oldPatterns = [
    new RegExp(
      `<mesh\\s+${esc(attrsClean)}\\s*>\\s*\\n\\s*<${esc(geometry)}\\s*/>\\s*\\n\\s*<meshStandardMaterial[\\s\\S]*?/>\\s*\\n\\s*</mesh>`,
      'g'
    ),
    new RegExp(
      `<mesh\\s+${esc(attrsClean)}\\s*>\\s*\\n\\s*<${esc(geometry)}>\\s*\\n\\s*<meshStandardMaterial[\\s\\S]*?/>\\s*\\n\\s*</mesh>`,
      'g'
    ),
  ];

  const replacement = `${open}\n        <${geometry} />\n      </mesh>`;
  let out = content;
  for (const re of oldPatterns) {
    if (re.test(out)) {
      out = out.replace(re, replacement);
      return out;
    }
  }
  return content;
}

function applyBucketElevator(c) {
  c = addImport(c);
  const pairs = [
    ['castShadow receiveShadow', 'boxGeometry args={[width, height, depth]}', 'matSteel'],
    ['position={[width / 2 + 0.01, 0, 0]}', 'boxGeometry args={[0.05, height * 0.6, depth * 0.7]}', 'matSteelDark'],
    ['position={[width / 2 + 0.05, 0, 0]}', 'boxGeometry args={[0.08, height * 0.65, depth * 0.75]}', 'matPaintedSteel'],
    ['position={[0, -height / 2 + 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow', 'cylinderGeometry args={[width * 0.35, width * 0.35, depth * 0.85, 24]}', 'matSteel'],
    ['position={[0, -height / 2 + 0.02, depth / 2 + 0.01]}', 'boxGeometry args={[width * 0.6, height * 0.4, 0.04]}', 'matSteelDark'],
    ['position={[width * 0.25, -height / 2 + 0.02, depth / 2 + 0.04]}', 'boxGeometry args={[0.08, 0.15, 0.03]}', 'matStructureSteel'],
    ['position={pos} castShadow', 'boxGeometry args={[0.12, 0.6, 0.12]}', 'matPaintedSteel'],
    ['castShadow receiveShadow', 'boxGeometry args={[width, height, depth]}', 'matSteel'],
    ['position={[0, 0, 0]}', 'boxGeometry args={[width * 0.7, height, 0.05]}', 'matRubber'],
    ['castShadow', 'boxGeometry args={[width * 0.6, 0.15, depth * 0.7]}', 'matSteel'],
    ['position={[0, 0, depth * 0.35]}', 'boxGeometry args={[width * 0.62, 0.17, 0.03]}', 'matStructureSteel'],
    ['ref={pulleyRef}\n        position={[0, 0, 0]}\n        rotation={[Math.PI / 2, 0, 0]}\n        castShadow', 'cylinderGeometry args={[width * 0.4, width * 0.4, depth * 0.85, 24]}', 'matSteel'],
    ['position={[0, height / 2 - 0.1, depth / 2 + 0.3]}', 'boxGeometry args={[width * 0.8, 0.4, 0.6]}', 'matSteelDark'],
    ['position={[0, height / 2 - 0.1, depth / 2 + 0.6]}', 'boxGeometry args={[width * 0.85, 0.45, 0.08]}', 'matPaintedSteel'],
    ['position={[-width / 2 - 0.05, 0, 0]}', 'boxGeometry args={[0.1, height * 0.6, depth * 0.7]}', 'matStructureSteel'],
    ['rotation={[0, 0, Math.PI / 2]} castShadow', 'cylinderGeometry args={[0.25, 0.25, 0.6, 24]}', 'matPaintBlue'],
    ['position={[0, 0, -0.35]} castShadow', 'boxGeometry args={[0.35, 0.35, 0.3]}', 'matPaintDark'],
    ['position={[0, 0, -0.5]} rotation={[0, 0, Math.PI / 2]}', 'cylinderGeometry args={[0.06, 0.06, 0.2, 16]}', 'matSteel'],
    ['castShadow receiveShadow', 'boxGeometry args={[width, 0.08, depth]}', 'matPaintedSteel'],
  ];
  for (const [attrs, geo, mat] of pairs) {
    c = mesh(c, attrs, geo, mat);
  }
  // bulk regex replacements for repeated patterns
  c = c.replace(
    /<mesh position=\{\[0, y, depth \/ 2 \+ 0\.01\]\}>\s*<boxGeometry args=\{\[width \* 0\.95, 0\.08, 0\.02\]\} \/>\s*<meshStandardMaterial[\s\S]*?\/>\s*<\/mesh>/g,
    '<mesh position={[0, y, depth / 2 + 0.01]} dispose={null} material={matSteelDark}>\n              <boxGeometry args={[width * 0.95, 0.08, 0.02]} />\n            </mesh>'
  );
  return c;
}

console.log('Migration helper - use manual edits for reliability');
