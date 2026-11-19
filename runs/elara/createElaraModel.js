// Code-only procedural reconstruction of "Elara" (front view of the character sheet).
// Units: metres, feet at y=0, facing +z. +x = character's left (image right).
import * as THREE from 'three';

const C = {
  skin: 0xf2dfd4, hair: 0xf3eee2, hairShade: 0xd9d1bf, robe: 0x2a2826, robeLining: 0x1e5a34,
  sweater: 0x2a5e3a, shirt: 0xf4f1ea, skirt: 0x5a5b5e, tights: 0x1c1a1b, shoe: 0x0e0e10,
  tieGreen: 0x1f6a3a, tieStripe: 0xb8c2b4, wand: 0x5a3a24, eye: 0x7f8a8e, lip: 0xc99a92, brow: 0xb9ae9c,
};
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
const M = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, mat(v)]));
M.shoe = mat(C.shoe, { roughness: 0.25, metalness: 0.1 });
M.robe.side = THREE.DoubleSide; M.robeLining.side = THREE.DoubleSide;
M.hair.roughness = 0.55;

function mesh(geo, m, name, pos = [0, 0, 0], scale) {
  const o = new THREE.Mesh(geo, m); o.name = name; o.position.set(...pos);
  if (scale) o.scale.set(...scale); o.castShadow = true; return o;
}
// Lathe from [radius, y] profile; gap in front (around +z) for an open robe.
function lathe(profile, m, name, gap = 0) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  return mesh(new THREE.LatheGeometry(pts, 48, gap, Math.PI * 2 - 2 * gap), m, name);
}

function braid(name, start, end, r0, r1, n) {
  const g = new THREE.Group(); g.name = name;
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), p = a.clone().lerp(b, t);
    const r = THREE.MathUtils.lerp(r0, r1, t), side = i % 2 ? 1 : -1;
    const lobe = mesh(new THREE.SphereGeometry(r, 14, 10), i % 2 ? M.hair : M.hairShade, `${name}_lobe${i}`,
      [p.x + side * r * 0.45, p.y, p.z], [1.0, 1.25, 0.8]);
    lobe.rotation.z = side * 0.6; g.add(lobe);
  }
  const tieY = b.y - 0.01;
  g.add(mesh(new THREE.TorusGeometry(r1 * 0.9, 0.004, 6, 16), M.hairShade, `${name}_tie`, [b.x, tieY, b.z], [1, 1, 1]));
  g.children.at(-1).rotation.x = Math.PI / 2;
  g.add(mesh(new THREE.ConeGeometry(r1 * 1.1, 0.07, 12), M.hair, `${name}_tail`, [b.x, tieY - 0.04, b.z])).children.at(-1).rotation.x = Math.PI;
  return g;
}

export function createElaraModel() {
  const root = new THREE.Group(); root.name = 'Elara';
  const pivots = {};
  const pivot = (name, parent, pos) => { const p = new THREE.Group(); p.name = name; p.position.set(...pos); parent.add(p); pivots[name] = p; return p; };

  // ---- Legs & shoes
  for (const [side, x] of [['R', -0.03], ['L', 0.075]]) {
    const hip = pivot(`hip_${side}`, root, [x, 0.62, 0]);
    hip.add(lathe([[0.0, -0.58], [0.032, -0.57], [0.03, -0.5], [0.038, -0.36], [0.046, -0.3], [0.05, -0.12], [0.06, 0], [0, 0.02]], M.tights, `leg_${side}`));
    hip.add(mesh(new THREE.BoxGeometry(0.08, 0.05, 0.17, 2, 2, 2), M.shoe, `shoe_${side}`, [x > 0 ? 0.01 : -0.01, -0.585, 0.035]));
    const toe = mesh(new THREE.SphereGeometry(0.042, 16, 10), M.shoe, `shoeToe_${side}`, [x > 0 ? 0.01 : -0.01, -0.59, 0.1], [1, 0.6, 1]);
    hip.add(toe);
  }
  // ---- Skirt (grey, pleated via many segments)
  const skirt = lathe([[0.1, 0.97], [0.105, 0.92], [0.125, 0.8], [0.15, 0.61], [0.0, 0.61]], M.skirt, 'skirt');
  skirt.geometry = new THREE.LatheGeometry([[0.1, 0.97], [0.105, 0.92], [0.125, 0.8], [0.15, 0.61]].map(([r, y]) => new THREE.Vector2(r, y)), 24);
  root.add(skirt);
  // ---- Torso: sweater + shirt collar
  const spine = pivot('spine', root, [0, 0.97, 0]);
  spine.add(lathe([[0.0, 0.0], [0.105, 0.0], [0.11, 0.03], [0.1, 0.1], [0.11, 0.2], [0.13, 0.27], [0.09, 0.33], [0.04, 0.35], [0, 0.35]], M.sweater, 'sweater'));
  spine.add(mesh(new THREE.TorusGeometry(0.104, 0.01, 6, 32), M.sweater, 'sweaterBand', [0, 0.015, 0], [1, 1, 0.85])).children.at(-1).rotation.x = Math.PI / 2;
  spine.add(mesh(new THREE.ConeGeometry(0.06, 0.08, 3, 1, true), M.shirt, 'shirtV', [0, 0.3, 0.075])).children.at(-1).rotation.set(0.25, Math.PI, Math.PI);
  spine.add(mesh(new THREE.BoxGeometry(0.03, 0.12, 0.01), M.tieGreen, 'tie', [0, 0.27, 0.105])).children.at(-1).rotation.x = -0.2;
  for (let i = 0; i < 4; i++) spine.add(mesh(new THREE.BoxGeometry(0.031, 0.006, 0.011), M.tieStripe, `tieStripe${i}`, [0, 0.31 - i * 0.03, 0.108 - i * 0.006]));
  for (const s of [-1, 1]) spine.add(mesh(new THREE.BoxGeometry(0.05, 0.03, 0.012), M.shirt, `collar_${s}`, [s * 0.03, 0.345, 0.075])).children.at(-1).rotation.set(-0.4, 0, s * 0.5);

  // ---- Robe: open-front lathe, lining shows at the gap
  const robeProfile = [[0.07, 0.37], [0.13, 0.3], [0.135, 0.2], [0.15, 0.0], [0.175, -0.3], [0.21, -0.6], [0.24, -0.8]];
  spine.add(lathe(robeProfile, M.robe, 'robe', 0.38));
  spine.add(lathe(robeProfile.map(([r, y]) => [r - 0.006, y]), M.robeLining, 'robeLining', 0.38));
  // green lapel trims along the opening
  for (const s of [-1, 1]) {
    const pts = robeProfile.map(([r, y]) => new THREE.Vector3(s * r * Math.sin(0.38), y, r * Math.cos(0.38) + 0.002));
    spine.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.006, 6), M.robeLining, `robeTrim_${s}`));
  }
  // hood (rolled back over shoulders)
  spine.add(mesh(new THREE.TorusGeometry(0.1, 0.03, 8, 24, Math.PI * 1.3), M.robe, 'hood', [0, 0.36, -0.02])).children.at(-1).rotation.set(Math.PI / 2 + 0.2, 0, Math.PI * 0.85);
  // generic house-style badge (simple shield, not a reproduced crest)
  const badge = mesh(new THREE.CylinderGeometry(0.028, 0.02, 0.006, 6), M.robeLining, 'badge', [0.095, 0.22, 0.16]);
  badge.rotation.x = Math.PI / 2; spine.add(badge);
  spine.add(mesh(new THREE.SphereGeometry(0.009, 8, 6), M.robe, 'claspKnot', [-0.04, 0.29, 0.15]));

  // ---- Arms with bell sleeves
  for (const [side, s] of [['R', -1], ['L', 1]]) {
    const sh = pivot(`shoulder_${side}`, spine, [s * 0.13, 0.28, 0]);
    sh.rotation.z = s * 0.08;
    const sleeve = lathe([[0.04, 0.0], [0.05, -0.12], [0.07, -0.3], [0.09, -0.44], [0.085, -0.45]], M.robe, `sleeve_${side}`);
    sh.add(sleeve);
    sh.add(lathe([[0.096, -0.445], [0.1, -0.45]], M.robeLining, `sleeveCuff_${side}`));
    sh.add(mesh(new THREE.CylinderGeometry(0.03, 0.028, 0.06, 12), M.shirt, `shirtCuff_${side}`, [0, -0.44, 0]));
    const wrist = pivot(`wrist_${side}`, sh, [0, -0.48, 0]);
    wrist.add(mesh(new THREE.SphereGeometry(0.03, 12, 10), M.skin, `hand_${side}`, [0, -0.04, 0.005], [0.75, 1.5, 0.55]));
    if (side === 'L') {
      const wand = mesh(new THREE.CylinderGeometry(0.004, 0.007, 0.27, 8), M.wand, 'wand', [-0.03, -0.12, 0.02]);
      wand.rotation.z = -0.5; wrist.add(wand); pivots.wandSocket = wand;
    }
  }

  // ---- Neck & head
  const neck = pivot('neck', spine, [0, 0.35, 0]);
  neck.add(mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.08, 12), M.skin, 'neck', [0, 0.03, 0]));
  const head = pivot('head', neck, [0.012, 0.15, 0.005]);
  head.add(mesh(new THREE.SphereGeometry(0.07, 32, 24), M.skin, 'face', [0, 0, 0], [0.93, 1.18, 1.0]));
  head.add(mesh(new THREE.SphereGeometry(0.035, 16, 12), M.skin, 'jaw', [0, -0.045, 0.02], [1.15, 1, 1]));
  for (const s of [-1, 1]) {
    head.add(mesh(new THREE.SphereGeometry(0.012, 12, 8), M.shirt, `eyeWhite_${s}`, [s * 0.026, 0.0, 0.058], [1.2, 0.7, 0.5]));
    head.add(mesh(new THREE.SphereGeometry(0.0065, 10, 8), M.eye, `iris_${s}`, [s * 0.026, 0.0, 0.064]));
    head.add(mesh(new THREE.BoxGeometry(0.03, 0.004, 0.004), M.brow, `brow_${s}`, [s * 0.027, 0.02, 0.064])).children.at(-1).rotation.z = -s * 0.15;
    head.add(mesh(new THREE.SphereGeometry(0.003, 6, 4), M.hairShade, `earring_${s}`, [s * 0.064, -0.025, 0.0]));
  }
  head.add(mesh(new THREE.BoxGeometry(0.02, 0.004, 0.004), M.lip, 'mouth', [0, -0.05, 0.062]));
  head.add(mesh(new THREE.ConeGeometry(0.006, 0.018, 6), M.skin, 'nose', [0, -0.022, 0.068])).children.at(-1).rotation.x = 0.3;
  // hair cap + crown braid + side braid (character's right, over the shoulder)
  head.add(mesh(new THREE.SphereGeometry(0.075, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), M.hair, 'hairCap', [0, 0.012, -0.004], [0.97, 1.2, 1.05]));
  head.add(mesh(new THREE.SphereGeometry(0.07, 24, 16), M.hair, 'hairBack', [0, -0.01, -0.025], [0.98, 1.15, 0.9]));
  const crown = new THREE.Group(); crown.name = 'crownBraid';
  for (let i = 0; i < 11; i++) {
    const t = Math.PI * (0.15 + 0.7 * i / 10);
    crown.add(mesh(new THREE.SphereGeometry(0.016, 10, 8), i % 2 ? M.hair : M.hairShade, `crown${i}`, [Math.cos(t) * 0.07, 0.03 + Math.sin(t) * 0.055, 0.02]));
  }
  head.add(crown);
  head.add(mesh(new THREE.BoxGeometry(0.018, 0.006, 0.004), M.hairShade, 'hairClip', [0.04, 0.07, 0.05])).children.at(-1).rotation.z = 0.6;
  // side braid in root space so it can drape across the robe
  root.add(braid('sideBraid', [-0.075, 1.40, 0.05], [-0.11, 0.9, 0.205], 0.021, 0.013, 16));

  root.userData = { pivots, sockets: { wand: 'wand' }, approximations: ['back of head inferred from back-view panel', 'crest replaced by a plain green shield'] };
  return root;
}
