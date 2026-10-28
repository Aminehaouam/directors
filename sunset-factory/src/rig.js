// Paper-doll worker rig. Pieces are cut once (seeded wobble) and pinned at the joints like split-pin puppets.
import { lerp, clamp, ik } from './lib.js';
import { blob, capsule, rrect, cutPoly, rrectPts } from './paper.js';

export const SPECS = {
  rosie: { leg: [21, 21], torso: [62, 54], head: 32, arm: [27, 25], skin: '#f1b892', hat: '#d9473c', over: '#3f72ad', shirt: '#f5e3c3', hair: '#9a4125', cheek: '#ea7b6c', extra: 'freckles' },
  tam: { leg: [27, 26], torso: [50, 66], head: 30, arm: [29, 27], skin: '#8e5b3c', hat: '#f0b53c', over: '#36679f', shirt: '#f2c3b0', hair: '#2b1d1a', cheek: '#c4614f', extra: 'glasses' },
  gus: { leg: [19, 18], torso: [66, 50], head: 33, arm: [25, 23], skin: '#dc9b6d', hat: '#f2eee2', over: '#2f5a8f', shirt: '#e7c065', hair: '#d9d2c4', cheek: '#e0705e', extra: 'mustache' },
};
const GLOVE = '#7c4a33', BOOT = '#4a2f2a', INK = '#2b1d24', BRASS = '#e2b24f', EYE = '#fffaf0';

export function buildWorker(id) {
  const S = SPECS[id], [tw, th] = S.torso, R = S.head, k = (s) => `${id}-${s}`;
  return {
    id, S,
    thigh: capsule(S.leg[0], 9.5, k('thigh')), shin: capsule(S.leg[1], 8.5, k('shin')),
    upper: capsule(S.arm[0], 8.8, k('upper')), fore: capsule(S.arm[1], 8.2, k('fore')),
    bootR: rrect(-8, -6, 28, 13, 6, k('bootR')), bootL: rrect(-20, -6, 28, 13, 6, k('bootL')),
    shirt: cutPoly(rrectPts(-tw / 2, -th, tw, th * 0.72, 15), k('shirt'), 0.9, 10),
    pants: cutPoly(rrectPts(-tw / 2 + 1, -th * 0.5, tw - 2, th * 0.5 + 8, 10), k('pants'), 0.9, 10),
    bib: cutPoly(rrectPts(-tw * 0.29, -th * 0.86, tw * 0.58, th * 0.5, 5), k('bib'), 0.7, 8),
    pocket: rrect(-tw * 0.13, -th * 0.72, tw * 0.26, th * 0.17, 3, k('pocket'), 0.4),
    head: blob(0, 0, R, R * 1.02, k('head'), 0.012),
    ear: blob(0, 0, 6.5, 8, k('ear'), 0.04, 24),
    dome: cutPoly(Array.from({ length: 17 }, (_, i) => { const a = Math.PI + (i / 16) * Math.PI; return [Math.cos(a) * R * 1.04, -R * 0.22 + Math.sin(a) * R * 0.98]; }), k('dome'), 0.8, 8),
    brim: rrect(-R * 1.22, -R * 0.36, R * 2.44, R * 0.24, R * 0.12, k('brim'), 0.6),
    ridge: rrect(-R * 0.13, -R * 1.2, R * 0.26, R * 0.98, R * 0.1, k('ridge'), 0.5),
    eyeW: blob(0, 0, R * 0.2, R * 0.26, k('eye'), 0.02, 28),
    stache: id === 'gus' ? cutPoly([[-2, -4], [-12, -6], [-22, -2], [-27, 6], [-18, 7], [-8, 4], [0, 6], [8, 4], [18, 7], [27, 6], [22, -2], [12, -6], [2, -4]], k('stache'), 0.8, 5) : null,
  };
}

function capsuleAt(P, path, ax, ay, ang, hex, sh = 1) {
  const g = P.g;
  g.save(); g.translate(ax, ay); g.rotate(-ang); P.fill(path, hex, sh, 0.8); g.restore();
}

// Leg angles for a walk cycle blended with the standing pose.
function legPose(p) {
  const A = 0.5 * p.walk, d = p.dir, s = Math.sin(p.phase), c = Math.cos(p.phase);
  const wl = [d * A * s, d * A * s - d * 0.85 * p.walk * Math.max(0, c)];
  const wr = [-d * A * s, -d * A * s - d * 0.85 * p.walk * Math.max(0, -c)];
  return [p.legL.map((v, i) => lerp(v, wl[i], p.walk)), p.legR.map((v, i) => lerp(v, wr[i], p.walk))];
}

/** Resolve joint positions in world space for pose p. */
export function skeleton(Wk, p) {
  const S = Wk.S, [tw, th] = S.torso, s = p.s;
  const [legL, legR] = legPose(p);
  const reach = (a) => S.leg[0] * Math.cos(a[0]) + S.leg[1] * Math.cos(a[1]);
  const hipH = Math.max(reach(legL), reach(legR));
  const hip = [p.x, p.y - (hipH + p.air) * s];
  const u = [Math.sin(p.lean), -Math.cos(p.lean)], r = [Math.cos(p.lean), Math.sin(p.lean)];
  const tH = th * p.squash * s;
  const shoulderC = [hip[0] + u[0] * (tH - 7 * s + p.shoulder * s), hip[1] + u[1] * (tH - 7 * s + p.shoulder * s)];
  const sw = (tw / 2 - 6) * s;
  const shL = [shoulderC[0] - r[0] * sw, shoulderC[1] - r[1] * sw], shR = [shoulderC[0] + r[0] * sw, shoulderC[1] + r[1] * sw];
  const headC = [hip[0] + u[0] * (tH + S.head * 0.8 * s) + p.headDX * s + Math.sin(p.walk * Math.sin(p.phase * 2)) * 0, hip[1] + u[1] * (tH + S.head * 0.8 * s) + p.headDY * s + p.shoulder * 0.25 * s];
  // arms: blend authored angles with IK towards targets
  const [l1, l2] = S.arm.map((v) => v * s);
  const swing = 0.38 * p.walk * Math.sin(p.phase);
  let aL = [p.armL[0] - p.dir * swing, p.armL[1] - p.dir * swing * 1.2];
  let aR = [p.armR[0] + p.dir * swing, p.armR[1] + p.dir * swing * 1.2];
  if (p.tgtL && p.wL > 0) { const q = ik(shL[0], shL[1], p.tgtL[0], p.tgtL[1], l1, l2, -1); aL = aL.map((v, i) => lerp(v, q[i], p.wL)); }
  if (p.tgtR && p.wR > 0) { const q = ik(shR[0], shR[1], p.tgtR[0], p.tgtR[1], l1, l2, -1); aR = aR.map((v, i) => lerp(v, q[i], p.wR)); }
  const chain = (o, a, L1, L2) => { const e = [o[0] + L1 * Math.sin(a[0]), o[1] + L1 * Math.cos(a[0])]; return [e, [e[0] + L2 * Math.sin(a[1]), e[1] + L2 * Math.cos(a[1])]]; };
  const [elL, haL] = chain(shL, aL, l1, l2), [elR, haR] = chain(shR, aR, l1, l2);
  const hw = tw * 0.21 * s;
  const hipL = [hip[0] - r[0] * hw, hip[1] - r[1] * hw], hipR = [hip[0] + r[0] * hw, hip[1] + r[1] * hw];
  const [knL, anL] = chain(hipL, legL, S.leg[0] * s, S.leg[1] * s), [knR, anR] = chain(hipR, legR, S.leg[0] * s, S.leg[1] * s);
  return { hip, u, r, shL, shR, elL, elR, haL, haR, aL, aR, hipL, hipR, knL, knR, anL, anR, legL, legR, headC, tH };
}

function drawHand(P, x, y, ang, kind, s, side) {
  const g = P.g;
  g.save(); g.translate(x, y); g.scale(s, s);
  if (kind === 'open') {
    // palm up, fingers pointing outward
    g.rotate(side < 0 ? 0.15 : -0.15);
    P.fill(blob(side * 4, 0, 11, 6.5, 'palm' + side, 0.03, 24), GLOVE, 1, 0.6);
    P.fill(blob(side * -3, -5, 3.5, 5, 'thumb' + side, 0.05, 16), GLOVE, 1, 0.6);
  } else if (kind === 'thumb') {
    P.fill(blob(0, 0, 8.5, 8, 'fist', 0.03, 24), GLOVE, 1, 0.6);
    P.fill(blob(0, -10, 3.6, 7, 'thumbup', 0.05, 16), GLOVE, 1, 0.6);
  } else {
    g.rotate(-ang);
    P.fill(blob(0, 3, 8.6, 9.6, 'mitt', 0.03, 24), GLOVE, 1, 0.6);
    P.fill(blob(side * 7, -1, 3.4, 5, 'mthumb' + side, 0.05, 16), GLOVE, 1, 0.6);
  }
  g.restore();
}

function drawArm(P, Wk, sk, side, p) {
  const sh = side < 0 ? sk.shL : sk.shR, el = side < 0 ? sk.elL : sk.elR, ha = side < 0 ? sk.haL : sk.haR, a = side < 0 ? sk.aL : sk.aR;
  const S = Wk.S, s = p.s, g = P.g;
  g.save(); g.translate(sh[0], sh[1]); g.rotate(-a[0]); g.scale(s, s); P.fill(Wk.upper, S.shirt, 1, 0.8); g.restore();
  g.save(); g.translate(el[0], el[1]); g.rotate(-a[1]); g.scale(s, s); P.fill(Wk.fore, S.shirt, 1, 0.8);
  // cuff
  P.fill(rrect(-8.6, S.arm[1] - 6, 17.2, 6, 3, 'cuff'), shade(S.shirt, -18), 0, 0.5);
  g.restore();
  // split-pin at the elbow
  g.save(); g.fillStyle = P.grade.c(BRASS); g.beginPath(); g.arc(el[0], el[1], 1.8 * s, 0, Math.PI * 2); g.fill(); g.restore();
  const kind = side < 0 ? p.handL : p.handR;
  drawHand(P, ha[0], ha[1], a[1], kind, s, side);
  if (side > 0 && p.remote > 0.01) drawRemote(P, ha[0], ha[1], s, p.remote);
}

function drawRemote(P, x, y, s, k) {
  const g = P.g;
  g.save(); g.translate(x - 4 * s, y - 14 * s); g.scale(s * k, s * k);
  g.save(); g.strokeStyle = P.grade.c('#3a3036'); g.lineWidth = 2; g.beginPath(); g.moveTo(-6, -10); g.lineTo(-10, -34); g.stroke(); g.restore();
  P.fill(blob(-10, -35, 3, 3, 'ant', 0.05, 12), '#e04a3c', 0, 0);
  P.fill(rrect(-12, -12, 24, 32, 5, 'remote'), '#f1c232', 1, 0.7);
  P.fill(blob(-4, -2, 4, 4, 'btnA', 0.03, 16), '#d64532', 0, 0.3);
  P.fill(blob(5, 6, 4, 4, 'btnB', 0.03, 16), '#3d8f62', 0, 0.3);
  g.restore();
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => clamp(v + amt, 0, 255) | 0;
  const r = f((n >> 16) & 255), gg = f((n >> 8) & 255), b = f(n & 255);
  return '#' + ((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1);
}

function drawLeg(P, Wk, sk, side, p) {
  const hp = side < 0 ? sk.hipL : sk.hipR, kn = side < 0 ? sk.knL : sk.knR, an = side < 0 ? sk.anL : sk.anR, a = side < 0 ? sk.legL : sk.legR;
  const S = Wk.S, s = p.s, g = P.g;
  g.save(); g.translate(hp[0], hp[1]); g.rotate(-a[0]); g.scale(s, s); P.fill(Wk.thigh, S.over, 1, 0.8); g.restore();
  g.save(); g.translate(kn[0], kn[1]); g.rotate(-a[1]); g.scale(s, s); P.fill(Wk.shin, S.over, 1, 0.8); g.restore();
  // boot points the way the worker faces (outward when facing front)
  const face = Math.abs(p.turn) > 0.22 ? Math.sign(p.turn) : side;
  g.save(); g.translate(an[0], an[1] + 2 * s); g.rotate(-a[1] * 0.35); g.scale(s, s);
  P.fill(face > 0 ? Wk.bootR : Wk.bootL, BOOT, 1, 0.7);
  g.restore();
}

function drawTorso(P, Wk, sk, p) {
  const S = Wk.S, [tw, th] = S.torso, g = P.g, s = p.s;
  g.save(); g.translate(sk.hip[0], sk.hip[1]); g.rotate(p.lean); g.scale(s, s * p.squash);
  P.fill(Wk.shirt, S.shirt, 2, 0.9);
  // collar
  P.fill(cutPoly([[-tw * 0.22, -th + 2], [0, -th + 13], [tw * 0.22, -th + 2], [tw * 0.12, -th - 1], [0, -th + 5], [-tw * 0.12, -th - 1]], Wk.id + 'collar', 0.4, 6), shade(S.shirt, -22), 0, 0.5);
  P.fill(Wk.pants, S.over, 1, 1);
  const bx = p.turn * tw * 0.12;
  g.save(); g.translate(bx, 0);
  P.fill(Wk.bib, S.over, 1, 1);
  // straps up to the shoulders
  for (const sd of [-1, 1]) {
    P.fill(cutPoly([[sd * tw * 0.27, -th * 0.84], [sd * tw * 0.17, -th * 0.84], [sd * tw * 0.3, -th + 1], [sd * tw * 0.41, -th + 3]], Wk.id + 'strap' + sd, 0.4, 6), S.over, 1, 0.8);
    P.fill(blob(sd * tw * 0.22, -th * 0.82, 3.2, 3.2, 'btn' + sd, 0.03, 14), BRASS, 0, 0.4);
  }
  P.fill(Wk.pocket, shade(S.over, -16), 0, 0.6);
  if (Wk.id === 'gus') { P.fill(rrect(tw * 0.04, -th * 0.86, 4, 16, 2, 'pencil'), '#e8b23a', 0, 0.3); P.fill(rrect(tw * 0.04, -th * 0.88, 4, 4, 1, 'pencilT'), '#f08a8a', 0, 0); }
  // little sun badge on the bib
  P.fill(blob(-tw * 0.12, -th * 0.6, 4.2, 4.2, 'badge', 0.03, 16), '#ffc93c', 0, 0.3);
  g.restore();
  g.restore();
}

function drawFace(P, Wk, p) {
  const S = Wk.S, R = S.head, g = P.g, fx = p.turn * R * 0.32;
  const lx = clamp(p.look[0], -1, 1), ly = clamp(p.look[1], -1, 1);
  const eyeY = -R * 0.02, wide = p.eyes === 'wide' ? 1.18 : 1;
  for (const sd of [-1, 1]) {
    const far = (sd > 0 && p.turn < 0) || (sd < 0 && p.turn > 0) ? 0 : 1;
    const sq = 1 - 0.28 * Math.abs(p.turn) * (1 - far);
    const ex = fx + sd * R * 0.34 * (1 - 0.12 * Math.abs(p.turn)), ey = eyeY;
    g.save(); g.translate(ex, ey);
    if (p.eyes === 'happy' || p.eyes === 'closed') {
      g.strokeStyle = P.grade.c(INK); g.lineWidth = 3.4; g.lineCap = 'round';
      g.beginPath();
      if (p.eyes === 'happy') g.arc(0, R * 0.08, R * 0.16, Math.PI * 1.1, Math.PI * 1.9);
      else g.arc(0, -R * 0.04, R * 0.15, Math.PI * 0.15, Math.PI * 0.85);
      g.stroke();
    } else {
      const open = clamp(1 - p.blink, 0.05, 1);
      g.scale(sq * wide, open * wide);
      P.fill(Wk.eyeW, EYE, 0, 0.2);
      if (open > 0.25) {
        const pr = R * (p.eyes === 'wide' ? 0.1 : 0.125);
        g.fillStyle = P.grade.c(INK);
        g.beginPath(); g.arc(lx * R * 0.08, ly * R * 0.1 + R * 0.03, pr, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.9)';
        g.beginPath(); g.arc(lx * R * 0.08 - pr * 0.35, ly * R * 0.1 + R * 0.03 - pr * 0.4, pr * 0.32, 0, Math.PI * 2); g.fill();
      }
      if (p.eyes === 'half') { // heavy lids
        g.fillStyle = P.grade.c(S.skin);
        g.beginPath(); g.ellipse(0, -R * 0.13, R * 0.24, R * 0.2, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = P.grade.c(shade(S.skin, -60)); g.lineWidth = 2; g.beginPath(); g.moveTo(-R * 0.2, R * 0.05); g.lineTo(R * 0.2, R * 0.05); g.stroke();
      }
      if (open < 0.3) { g.strokeStyle = P.grade.c(INK); g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(-R * 0.18, 0); g.lineTo(R * 0.18, 0); g.stroke(); }
    }
    g.restore();
    // brows
    const by = ey - R * 0.37 - p.brow * R * 0.13 - (p.eyes === 'wide' ? R * 0.06 : 0);
    g.save(); g.translate(ex, by); g.rotate(sd * p.browTilt * 0.35);
    P.fill(rrect(-R * 0.17, -2.6, R * 0.34, Wk.id === 'gus' ? 6.5 : 4.8, 2.4, Wk.id + 'brow' + sd, 0.3), Wk.id === 'gus' ? S.hair : shade(S.hair, -10), 0, 0.3);
    g.restore();
  }
  // glasses
  if (S.extra === 'glasses') {
    g.save(); g.strokeStyle = P.grade.c('#2a2226'); g.lineWidth = 2.4;
    for (const sd of [-1, 1]) { g.beginPath(); g.arc(fx + sd * R * 0.34 * (1 - 0.12 * Math.abs(p.turn)), eyeY, R * 0.3, 0, Math.PI * 2); g.stroke(); }
    g.beginPath(); g.moveTo(fx - R * 0.06, eyeY - 2); g.lineTo(fx + R * 0.06, eyeY - 2); g.stroke(); g.restore();
  }
  // cheeks + freckles
  g.save(); g.globalAlpha = 0.42; g.fillStyle = P.grade.c(S.cheek);
  for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(fx + sd * R * 0.55, R * 0.3, R * 0.15, R * 0.1, 0, 0, Math.PI * 2); g.fill(); }
  g.restore();
  if (S.extra === 'freckles') {
    g.save(); g.fillStyle = P.grade.c('#b8673f', 0.7);
    for (const [a, b] of [[-0.6, 0.22], [-0.5, 0.3], [-0.42, 0.22], [0.42, 0.22], [0.5, 0.3], [0.6, 0.22]]) { g.beginPath(); g.arc(fx + a * R, b * R, 1.4, 0, Math.PI * 2); g.fill(); }
    g.restore();
  }
  // nose
  P.fill(blob(fx * 1.25, R * 0.17, R * (Wk.id === 'gus' ? 0.16 : 0.11), R * (Wk.id === 'gus' ? 0.13 : 0.1), Wk.id + 'nose', 0.04, 20), shade(S.skin, -24), 1, 0.4);
  // mouth
  const mx = fx * 1.1, my = R * 0.47;
  g.save(); g.translate(mx, my);
  const ink = P.grade.c('#5a2232');
  g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 3.2; g.lineCap = 'round'; g.lineJoin = 'round';
  const m = p.mouth;
  if (m === 'smile') { g.beginPath(); g.arc(0, -R * 0.12, R * 0.2, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
  else if (m === 'frown') { g.beginPath(); g.arc(0, R * 0.16, R * 0.16, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
  else if (m === 'flat') { g.beginPath(); g.moveTo(-R * 0.14, 0); g.lineTo(R * 0.14, 0); g.stroke(); }
  else if (m === 'wavy') { g.beginPath(); g.moveTo(-R * 0.18, 0); g.bezierCurveTo(-R * 0.08, -R * 0.08, -R * 0.02, R * 0.08, R * 0.05, 0); g.bezierCurveTo(R * 0.1, -R * 0.07, R * 0.15, R * 0.04, R * 0.19, -R * 0.02); g.stroke(); }
  else if (m === 'o') { g.beginPath(); g.ellipse(0, R * 0.02, R * 0.1, R * 0.14, 0, 0, Math.PI * 2); g.fill(); }
  else { // grin / open
    const hh = m === 'open' ? R * 0.3 : R * 0.2, ww = m === 'open' ? R * 0.26 : R * 0.28;
    g.beginPath(); g.moveTo(-ww, -R * 0.04); g.lineTo(ww, -R * 0.04); g.quadraticCurveTo(ww * 0.95, hh, 0, hh); g.quadraticCurveTo(-ww * 0.95, hh, -ww, -R * 0.04); g.fill();
    g.fillStyle = P.grade.c('#e46f7a'); g.beginPath(); g.ellipse(0, hh * 0.72, ww * 0.5, hh * 0.28, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore();
  if (Wk.stache) { g.save(); g.translate(fx * 1.2, R * 0.33); P.fill(Wk.stache, S.hair, 1, 0.6); g.restore(); }
}

function drawHead(P, Wk, sk, p) {
  const S = Wk.S, R = S.head, g = P.g, s = p.s;
  g.save(); g.translate(sk.headC[0], sk.headC[1]); g.rotate(p.lean * 0.6 + p.headTilt); g.scale(s, s);
  // neck
  P.fill(rrect(-7, R * 0.6, 14, 14, 4, Wk.id + 'neck'), shade(S.skin, -14), 0, 0.5);
  // ears (the far one tucks behind when turned)
  for (const sd of [-1, 1]) {
    const far = (sd > 0 && p.turn < -0.2) || (sd < 0 && p.turn > 0.2);
    if (far && Math.abs(p.turn) > 0.5) continue;
    g.save(); g.translate(sd * R * (0.98 - 0.15 * Math.abs(p.turn) * (far ? 1 : -0.3)) + p.turn * R * 0.08, R * 0.08); P.fill(Wk.ear, S.skin, 1, 0.6); g.restore();
  }
  P.fill(Wk.head, S.skin, 2, 0.9);
  // hair peeking under the hat
  if (Wk.id === 'rosie') for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) P.fill(blob(sd * (R * 0.82 - i * 4) - p.turn * 4, -R * 0.28 + i * 7, 6, 6, 'curl' + sd + i, 0.06, 16), S.hair, 1, 0.5);
  if (Wk.id === 'gus') for (const sd of [-1, 1]) P.fill(blob(sd * R * 0.86, -R * 0.1, 7, 11, 'side' + sd, 0.06, 16), S.hair, 1, 0.5);
  if (Wk.id === 'tam') for (const sd of [-1, 1]) P.fill(rrect(sd * R * 0.9 - 4, -R * 0.36, 8, 15, 4, 'burn' + sd), S.hair, 0, 0.4);
  drawFace(P, Wk, p);
  // hard hat
  g.save(); g.translate(p.turn * R * 0.06, -R * 0.05);
  P.fill(Wk.dome, S.hat, 2, 1);
  g.save(); g.translate(p.turn * R * 0.32, 0); P.fill(Wk.ridge, shade(S.hat, 22), 0, 0.6); g.restore();
  g.save(); g.translate(p.turn * R * 0.18, 0); P.fill(Wk.brim, shade(S.hat, -14), 1, 0.8); g.restore();
  // company badge: a tiny setting sun
  g.save(); g.translate(p.turn * R * 0.45, -R * 0.62);
  P.fill(blob(0, 0, R * 0.17, R * 0.17, 'hatbadge', 0.03, 18), Wk.id === 'rosie' ? '#ffd55a' : '#e2543f', 0, 0.2);
  g.restore();
  g.restore();
  g.restore();
}

/** Draw a worker. `beforeHead` draws held props between torso and head (e.g. a roller pole). */
export function drawWorker(P, Wk, p, beforeHead) {
  const sk = skeleton(Wk, p), g = P.g;
  // contact shadow on the floor
  g.save(); g.globalAlpha = 0.28 * (1 - Math.min(0.7, p.air / 40));
  g.fillStyle = 'rgba(45,18,30,1)'; g.beginPath(); g.ellipse(p.x, p.y + 3, 34 * p.s * (1 - p.air / 120), 7 * p.s, 0, 0, Math.PI * 2); g.fill(); g.restore();
  const backR = p.turn > 0.25, backL = p.turn < -0.25;
  if (backR) drawArm(P, Wk, sk, 1, p);
  if (backL) drawArm(P, Wk, sk, -1, p);
  drawLeg(P, Wk, sk, -1, p); drawLeg(P, Wk, sk, 1, p);
  drawTorso(P, Wk, sk, p);
  if (beforeHead) beforeHead(sk);
  const front = () => { if (!backL) drawArm(P, Wk, sk, -1, p); if (!backR) drawArm(P, Wk, sk, 1, p); };
  if (p.armsFirst) front();
  drawHead(P, Wk, sk, p);
  if (!p.armsFirst) front();
  return sk;
}
