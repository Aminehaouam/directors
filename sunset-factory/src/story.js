// The whole film as pure functions of time t (seconds). No drawing here: the renderer turns these
// states into paper cut-outs and scripts/audio.mjs reads the same states to place sound effects.
import { clamp, lerp, prog, kf, E, rng, bez, window01, TAU } from './lib.js';

export const W = 1080, H = 1920, FPS = 30, DURATION = 20;

// Beat sheet. Every animation and sound cue hangs off these times.
export const T = {
  bell: 0.25, doorOpen: [0.45, 0.85], sunOut: [0.72, 1.15], hop: [0.98, 1.22], doorClose: [2.35, 2.75],
  beltRun: [1.2, 3.5], roll: [1.3, 3.5], stopHand: [2.95, 3.55], lever: 3.42, beltStop: 3.5,
  grab: [3.72, 4.12], telescope: [4.15, 4.5], paint: [4.5, 6.9], retract: [6.95, 7.25], lean: [7.25, 7.5],
  remote: 7.2, trolley: [7.3, 7.85], hookDown: [7.55, 8.25], clawClose: [8.25, 8.42], hoist: [8.55, 9.75],
  lower: [9.95, 10.45], click: 10.45, clawOpen: [10.6, 10.8], hookUp: [10.85, 11.5],
  admire: [11.15, 13.5], stepBack: [13.5, 13.98], bump: 13.98, wobble: [13.98, 14.65],
  relief: [14.65, 14.85], tip: [14.85, 15.15], pop: 15.15, launch: [15.15, 15.9], night: [15.5, 17.55],
  sunSink: [16.0, 17.45], look: [17.6, 18.62], shrug: [18.7, 19.2],
};

export const L = {
  sunR: 115, beltTop: 1384, beltX0: 140, beltX1: 680, sunBeltY: 1384 - 115, ovenX: 200, ovenY: 1269, s: 1.12,
  target: [540, 720], jibY: 330, trolleyY: 346, towerX: 975,
  lane: { rosie: 1466, tam: 1452, gus: 1440 },
  crate: { x0: 790, x1: 860, top: 1408, base: 1478 },
  floorBack: 1400, floorFront: 1478,
  pinkY: 228, orangeY: 640, pinkBand: [-40, 452], orangeBand: [430, 900],
};

// Far-hill crest height at x (the sun sits a little behind it).
export function farHillY(x) {
  const b = (c, w) => Math.exp(-(((x - c) / w) ** 2));
  return 806 - 78 * b(110, 250) - 60 * b(920, 230) - 34 * b(-260, 260) - 30 * b(1300, 250) + 8 * Math.sin(x * 0.011);
}

/* ------------------------------------------------------------------ camera */
const CAM = [
  [0.0, [205, 1205, 1.62]], [1.15, [235, 1205, 1.62]], [3.35, [515, 1195, 1.5], 'inOutSine'],
  [4.55, [540, 960, 1.0]], [7.25, [540, 955, 1.0]], [8.3, [540, 930, 1.07]], [10.35, [540, 915, 1.08]],
  [11.45, [548, 1085, 1.3]], [13.4, [560, 1090, 1.34]], [14.15, [700, 1262, 1.72]], [15.2, [702, 1262, 1.76]],
  [16.35, [540, 960, 1.0], 'inOutCubic'], [17.45, [540, 960, 1.0]], [18.5, [545, 1212, 1.56], 'inOutCubic'], [20, [545, 1222, 1.63]],
];
export function camera(t) {
  const [cx, cy, z] = kf(t, CAM);
  const shake = (t0, amp, dur) => (t >= t0 && t < t0 + dur ? amp * (1 - (t - t0) / dur) : 0);
  const s = shake(T.click, 4, 0.3) + shake(T.bump, 1.5, 0.2) + shake(T.pop, 4, 0.3) + shake(T.beltStop, 2, 0.2);
  return { cx: cx + s * Math.sin(t * 91), cy: cy + s * Math.cos(t * 77), z };
}

/* ------------------------------------------------------------------ machinery */
export function sunX(t) {
  const x = kf(t, [[0, L.ovenX], [T.roll[0], L.ovenX, 'inOutSine'], [T.roll[1], 540]]);
  const settle = t > T.roll[1] ? 7 * Math.exp(-(t - T.roll[1]) * 7) * Math.sin((t - T.roll[1]) * 22) : 0;
  return x + settle;
}

export function sun(t) {
  const r = L.sunR;
  let x = sunX(t), y = L.sunBeltY, rot = (x - L.ovenX) / r, sx = 1, sy = 1, layer = 'stage', depth = 1;
  // Pops forward out of the oven and lands on the belt.
  const o = prog(t, ...T.sunOut);
  if (t < T.sunOut[1]) {
    depth = lerp(0.86, 1, E.outCubic(o));
    y = L.sunBeltY - 26 * Math.sin(Math.PI * Math.min(1, o * 1.1));
    layer = o < 0.35 ? 'oven' : 'stage';
  }
  const land = prog(t, T.sunOut[1], T.sunOut[1] + 0.35);
  if (land > 0 && land < 1) { const q = Math.sin(land * Math.PI * 2.2) * (1 - land); sy = 1 - 0.07 * q; sx = 1 + 0.05 * q; }
  // Crane lift.
  if (t >= T.hoist[0]) {
    const h = E.inOutCubic(prog(t, ...T.hoist));
    y = lerp(L.sunBeltY, 600, h);
    y = lerp(y, L.target[1], E.inOutSine(prog(t, ...T.lower)));
    const swing = window01(t, T.hoist[0] + 0.1, T.lower[1] - 0.1, 0.25);
    rot += 0.06 * swing * Math.sin((t - T.hoist[0]) * 4.2);
    x += 5 * swing * Math.sin((t - T.hoist[0]) * 4.2 - 0.6);
    if (y < 660 || t > T.lower[0]) layer = 'sky';
    const c = prog(t, T.click, T.click + 0.45);
    if (c > 0 && c < 1) { const q = Math.sin(c * Math.PI * 3) * (1 - c); sx = 1 + 0.05 * q; sy = 1 - 0.05 * q; }
  }
  y += 270 * E.inOutCubic(prog(t, ...T.sunSink));
  const glow = kf(t, [[0, 0.55], [T.hoist[0], 0.6], [T.click, 0.85], [T.click + 0.25, 1.25], [T.click + 1.2, 1], [T.sunSink[0], 1], [T.sunSink[1], 0]]);
  return { x, y, r, rot, sx, sy, layer, depth, glow, visible: y < 1000 || layer !== 'sky' };
}

export function belt(t) {
  const run = clamp(prog(t, T.beltRun[0], T.beltRun[0] + 0.3) - prog(t, T.beltRun[1] - 0.05, T.beltRun[1] + 0.25));
  // Tread offset follows the sun while it rolls, then coasts.
  const travel = sunX(Math.min(t, T.roll[1])) - L.ovenX + 60 * E.outCubic(prog(t, T.beltRun[0], T.roll[0])) + 30 * E.outCubic(prog(t, T.roll[1], T.roll[1] + 0.3));
  return { run, offset: travel, gear: travel / 22 };
}

export function oven(t) {
  const door = E.outBack(prog(t, ...T.doorOpen)) - E.outBounce(prog(t, ...T.doorClose));
  const bell = Math.exp(-Math.max(0, t - T.bell) * 4) * Math.sin(Math.max(0, t - T.bell) * 30) * (t > T.bell ? 0.4 : 0);
  const glow = kf(t, [[0, 0.55], [T.doorOpen[0], 0.7], [T.sunOut[1], 1], [T.roll[0] + 0.6, 0.45], [4.5, 0.3]]);
  return { door, bell, glow };
}

export function lever(t) { return E.outBack(prog(t, T.lever - 0.1, T.lever + 0.05)); } // 0 = run, 1 = stop

export function crane(t) {
  const trolleyX = kf(t, [[0, 640], [T.trolley[0], 640], [T.trolley[1], 540], [T.hookUp[0] + 0.1, 540], [T.hookUp[1] + 0.3, 640]]);
  const s = sun(t);
  const hubAtSun = s.y - L.sunR - 18;
  let hub = 430 + 6 * Math.sin(t * 1.3);
  if (t >= T.hookDown[0]) hub = lerp(hub, hubAtSun, E.inOutCubic(prog(t, ...T.hookDown)));
  if (t >= T.clawOpen[1]) hub = lerp(hubAtSun, 430, E.inOutCubic(prog(t, ...T.hookUp)));
  const open = 1 - E.outBack(prog(t, ...T.clawClose)) + E.outCubic(prog(t, ...T.clawOpen));
  const sway = t < T.hookDown[0] ? 0.03 * Math.sin(t * 1.7) : 0;
  return { trolleyX, hub, open: clamp(open, 0, 1.1), sway, motor: craneMotor(t) };
}
// 0..1 how hard the crane winch is working (drives gears, gauge and the motor sound).
export function craneMotor(t) {
  return Math.max(window01(t, T.trolley[0], T.trolley[1], 0.1), window01(t, ...T.hookDown, 0.1), window01(t, ...T.hoist, 0.12),
    window01(t, ...T.lower, 0.08), window01(t, ...T.hookUp, 0.1));
}

/* ------------------------------------------------------------------ paint rollers */
// Each roller: resting against the belt, grabbed, telescoped up, swept across the sky, retracted, leaned on the crane.
const ROLLERS = {
  orange: { who: 'rosie', y: L.orangeY, band: L.orangeBand, rest: [392, 1440], lean: [926, 1446], reach: [-230, 200] },
  pink: { who: 'tam', y: L.pinkY, band: L.pinkBand, rest: [345, 1436], lean: [900, 1444], reach: [-200, 240] },
};
export function roller(t, key) {
  const R = ROLLERS[key];
  const holdAt = (tt) => [kf(tt, TRACK[R.who]) + 18, L.lane[R.who] - 72];
  const hold = holdAt(t);
  const grab = E.inOutSine(prog(t, T.grab[1] - 0.12, T.grab[1]));
  const release = E.inOutSine(prog(t, T.lean[0] + 0.05, T.lean[1]));
  let base = [lerp(R.rest[0], hold[0], grab), lerp(R.rest[1], hold[1], grab)];
  if (t > T.lean[0]) base = [lerp(hold[0], R.lean[0], release), lerp(hold[1], R.lean[1], release)];
  const ext = E.inOutCubic(prog(t, ...T.telescope)) - E.inOutCubic(prog(t, ...T.retract));
  const reachAt = (tt) => lerp(R.reach[0], R.reach[1], E.inOutSine(prog(tt, ...T.paint)));
  const fold = 1 - E.inOutSine(prog(t, T.paint[1], T.retract[1]));
  const up = [base[0] + reachAt(t) * fold, R.y];
  const restHead = [base[0] + 26, base[1] - 300];
  const head = [lerp(restHead[0], up[0], ext), lerp(restHead[1], up[1], ext)];
  // Paint reveal: right edge follows the roller, left edge floods out to the frame edge, then the paint settles.
  const strokeX = (tt) => holdAt(tt)[0] + reachAt(tt);
  const relax = E.outCubic(prog(t, T.paint[1], T.paint[1] + 0.45));
  const edgeR = t < T.paint[1] ? strokeX(t) + 4 : lerp(strokeX(T.paint[1]) + 4, 1500, relax);
  const x0 = strokeX(T.paint[0]);
  const edgeL = lerp(x0 + 8, -140, E.outCubic(prog(t, T.paint[0] + 0.05, T.paint[0] + 0.6)));
  return {
    key, head, base, ext, active: t >= T.paint[0], edgeR, edgeL, curve: 150 * (1 - relax), band: R.band, y: R.y,
    spin: head[0] / 24, painting: window01(t, T.paint[0], T.paint[1], 0.08),
  };
}

/* ------------------------------------------------------------------ jar + stars */
export function jar(t) {
  const C = L.crate, w = 62, h = 86, cx0 = (C.x0 + C.x1) / 2;
  // pose = pivot corner in world space + rotation. side -1: bottom-left corner, +1: bottom-right, 0: bottom centre.
  let side = 0, cx = cx0, cy = C.top, rot = 0;
  const crateDx = t > T.bump ? 5 * Math.exp(-(t - T.bump) * 9) * Math.sin((t - T.bump) * 30) : 0;
  if (t > T.bump && t < T.relief[0]) {
    const u = t - T.bump;
    rot = 0.24 * Math.exp(-u * 3.0) * Math.sin(u * TAU * 2.4) * Math.min(1, u * 14);
    side = rot > 0 ? 1 : -1; cx = cx0 + side * w / 2 + crateDx;
  }
  if (t >= T.tip[0]) {
    side = -1;
    const u = prog(t, ...T.tip), fall = E.inQuad(prog(t, T.tip[0] + 0.1, T.tip[1]));
    rot = -(Math.PI / 2) * E.inQuad(u);
    cx = lerp(cx0 - w / 2, C.x0 - 6, fall); cy = lerp(C.top, C.base, fall);
    const b = prog(t, T.tip[1], T.tip[1] + 0.4);
    if (b > 0) { rot = -Math.PI / 2 - 0.1 * Math.sin(b * Math.PI * 2) * (1 - b); cy -= 9 * Math.sin(b * Math.PI) * (1 - b); }
  }
  const toWorld = (lx, ly) => { const c = Math.cos(rot), s = Math.sin(rot), x = lx - side * w / 2; return [cx + x * c - ly * s, cy + x * s + ly * c]; };
  const mouth = toWorld(0, -h - 10);
  const up = [Math.sin(rot), -Math.cos(rot)];
  let cork = { x: mouth[0], y: mouth[1], rot, on: true };
  const cu = t - T.pop;
  if (cu > 0) {
    const tt = Math.min(cu, 1.2), vx = up[0] * 420 - 60, vy = up[1] * 420 - 520;
    cork = { x: mouth[0] + vx * tt, y: mouth[1] + vy * tt + 0.5 * 1500 * tt * tt, rot: rot - cu * 13, on: false };
  }
  return { cx, cy, side, rot, w, h, crateDx, cork, mouth, up, open: cu > 0 };
}

export const STAR_N = 46;
export const STARS = (() => {
  const r = rng('stars-v3');
  const M = jar(T.tip[1] + 1).mouth;
  const pts = [];
  // Poisson-ish targets across the sky, avoiding the clouds and the crane.
  const blocked = (x, y) => (Math.hypot(x - 175, y - 400) < 110) || (Math.hypot(x - 800, y - 470) < 100) || (Math.hypot(x - 640, y - 80) < 90) || (y > 280 && y < 360);
  let guard = 0;
  while (pts.length < STAR_N && guard++ < 20000) {
    const x = 40 + r() * 1000, y = 50 + r() * 700;
    if (blocked(x, y)) continue;
    if (y > farHillY(x) - 40) continue;
    if (pts.every((p) => Math.hypot(p[0] - x, p[1] - y) > 92)) pts.push([x, y]);
  }
  const out = pts.map((p, i) => {
    const launch = T.launch[0] + (i / STAR_N) * (T.launch[1] - T.launch[0]) + r() * 0.08;
    const dur = 0.85 + r() * 0.65;
    const big = r();
    return {
      i, target: p, launch, dur, arrive: launch + dur,
      size: big > 0.85 ? 24 + r() * 6 : big > 0.45 ? 15 + r() * 6 : 9 + r() * 5,
      p0: M, p1: [M[0] - 60 - r() * 170, M[1] - 140 - r() * 280],
      p2: [p[0] + (r() - 0.3) * 260, p[1] + 260 + r() * 300],
      spin: (r() - 0.5) * 7, phase: r() * TAU, bloom: 210 + r() * 140, tw: 1.5 + r() * 2.5, hue: r(),
    };
  });
  // nearer targets first so the night spreads outward from the jar side
  return out;
})();
export const JAR_MOUTH = STARS[0].p0;

export function star(s, t) {
  if (t < s.launch) return null;
  const u = prog(t, s.launch, s.arrive);
  const e = E.outCubic(u);
  const p = bez(s.p0, s.p1, s.p2, s.target, e);
  const landed = u >= 1;
  const pop = landed ? 1 + 0.35 * Math.exp(-(t - s.arrive) * 9) * Math.sin((t - s.arrive) * 26) : 0.5 + 0.5 * e;
  return { x: p[0], y: p[1], u, e, landed, scale: pop, rot: s.spin * (1 - e) + 0.2 * Math.sin(t * 0.7 + s.phase) };
}

export function night(t) {
  const n = E.inOutSine(prog(t, ...T.night));
  const washY = kf(t, [[15.75, -120], [17.55, 1180, 'inOutSine']]);
  const warm = kf(t, [[0, 0], [4.6, 0], [6.9, 0.42], [T.click - 0.05, 0.5], [T.click + 0.6, 1], [15.6, 1], [17.3, 0.12]]);
  return { n, washY, warm };
}

/* ------------------------------------------------------------------ workers */
const lanes = L.lane;

function travel(t, keys) {
  // cumulative |dx| along a keyframed path (monotonic per segment)
  let d = 0;
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t0) break;
    if (t >= t1) { d += Math.abs(v1 - v0); continue; }
    d += Math.abs(kf(t, [keys[i], keys[i + 1]]) - v0);
  }
  return d;
}
function walkInfo(t, keys, stride = 62) {
  const x = kf(t, keys);
  const v = (kf(t + 0.02, keys) - kf(t - 0.02, keys)) / 0.04;
  return { x, v, amt: clamp(Math.abs(v) / 90), phase: (travel(t, keys) / stride) * Math.PI, dir: v >= 0 ? 1 : -1 };
}

// x tracks for each worker (sun-relative while pushing)
export const TRACK = {
  rosie: [[0, L.ovenX - 146], [T.roll[0], L.ovenX - 146, 'inOutSine'], [T.roll[1], 394], [3.74, 394], [4.06, 374],
    [T.paint[0], 374, 'inOutSine'], [T.paint[1], 905], [7.45, 905], [8.45, 600], [10.75, 600], [11.2, 550]],
  tam: [[0, L.ovenX - 178], [T.roll[0], L.ovenX - 178, 'inOutSine'], [T.roll[1], 362], [3.7, 362], [4.06, 327],
    [T.paint[0], 327, 'inOutSine'], [T.paint[1], 860], [7.6, 860], [8.6, 400], [11.0, 400], [11.3, 392]],
  gus: [[0, 745], [10.7, 745], [11.15, 706], [T.stepBack[0], 706, 'inOutQuad'], [T.stepBack[1], 752], [15.3, 752, 'outCubic'], [15.62, 712]],
};

const base = (x, y) => ({
  x, y, s: L.s, walk: 0, phase: 0, dir: 1, turn: 0, lean: 0, air: 0, squash: 1, headTilt: 0, headDX: 0, headDY: 0,
  look: [0, 0], eyes: 'open', blink: 0, brow: 0, browTilt: 0, mouth: 'smile', shoulder: 0,
  armL: [-0.16, -0.08], armR: [0.16, 0.08], tgtL: null, tgtR: null, wL: 0, wR: 0, handL: 'mitt', handR: 'mitt',
  legL: [-0.07, -0.03], legR: [0.07, 0.03], hold: null, remote: 0, armsFirst: false,
});

// Blend a set of numeric/array fields of b into a with weight w.
function mix(a, b, w) {
  if (w <= 0) return a;
  for (const k of Object.keys(b)) {
    const v = b[k];
    if (typeof v === 'number' && typeof a[k] === 'number') a[k] = lerp(a[k], v, w);
    else if (Array.isArray(v) && Array.isArray(a[k])) a[k] = a[k].map((x, i) => lerp(x, v[i], w));
    else if (w >= 0.5) a[k] = v;
  }
  return a;
}
const blinkAt = (t, times) => times.reduce((m, b) => Math.max(m, window01(t, b, b + 0.06, 0.05)), 0);

// Contact points on the sun's lower-left for pushing.
const onSun = (t, ang) => { const s = sun(t); return [s.x - s.r * Math.sin(ang), s.y + s.r * Math.cos(ang)]; };

function walking(p, wi, t) {
  p.walk = wi.amt; p.phase = wi.phase; p.dir = wi.dir;
  return p;
}

export function rosie(t) {
  const wi = walkInfo(t, TRACK.rosie);
  const p = walking(base(wi.x, lanes.rosie), wi, t);
  const win = (a, b, r) => window01(t, a, b, r);
  p.turn = 0.45;
  p.blink = blinkAt(t, [0.9, 2.6, 5.2, 9.0, 12.4, 16.9, 18.45]);
  p.armsFirst = t < T.roll[1] + 0.3;
  // waiting at the oven: bouncy ready stance, looks at the oven
  const wait = 1 - E.inOutSine(prog(t, T.roll[0] - 0.3, T.roll[0] + 0.05));
  if (wait > 0) {
    mix(p, { turn: 0.55, look: [0.8, -0.2], armL: [0.5, 1.5], armR: [0.9, 1.7], lean: 0.08 }, wait);
    p.air = 5 * Math.max(0, Math.sin(t * 9)) * (1 - prog(t, 0.3, 0.45));
    mix(p, { eyes: 'happy', lean: -0.08 }, win(T.doorOpen[0] + 0.08, T.sunOut[0] + 0.1, 0.16));
    p.air += 22 * Math.max(0, Math.sin(prog(t, ...T.hop) * Math.PI));
    mix(p, { armL: [-2.2, -2.6], armR: [2.2, 2.6], mouth: 'open', eyes: 'happy' }, win(...T.hop, 0.16));
  }
  // pushing the sun
  const push = win(T.roll[0] - 0.05, T.roll[1], 0.22);
  if (push > 0) {
    mix(p, { lean: 0.2, look: [1, -0.5], mouth: 'grin', turn: 0.65 }, push);
    p.tgtL = onSun(t, 0.92); p.tgtR = onSun(t, 0.66); p.wL = p.wR = push;
  }
  // done pushing: dusts hands
  mix(p, { armL: [0.6, 1.4], armR: [-0.4, -1.3], turn: 0.1, mouth: 'smile' }, win(3.6, 3.82, 0.16));
  // painting
  if (t >= T.grab[0] - 0.3 && t < T.lean[1] + 0.3) {
    const r = roller(t, 'orange');
    const w = win(T.grab[1] - 0.05, T.lean[0] + 0.1, 0.2);
    p.hold = { key: 'orange', w };
    p.turn = lerp(p.turn, 0.5, w);
    mix(p, { look: [0.6, -1], headTilt: -0.12, mouth: 'grin' }, win(T.telescope[0], T.retract[1], 0.2));
    p.tgtL = [r.base[0] + 2, r.base[1] - 6]; p.tgtR = poleAt(r, 46); p.wL = p.wR = w;
  }
  // crane signals
  const cw = win(8.5, 10.95, 0.28);
  if (cw > 0) {
    mix(p, { turn: 0.15, look: [0.5, -1], headTilt: -0.1, mouth: 'open' }, cw);
    const pump = Math.sin((t - T.hoist[0]) * 12), pat = Math.sin((t - T.lower[0]) * 14);
    mix(p, { armL: [-2.5, -3.0 + 0.35 * pump], armR: [2.5, 3.0 - 0.35 * pump], mouth: 'open' }, cw * win(...T.hoist, 0.2));
    mix(p, { armL: [-1.4, -1.6], armR: [1.4, 1.6], mouth: 'flat' }, cw * win(T.hoist[1] - 0.05, T.lower[0] + 0.05, 0.16));
    mix(p, { armL: [-0.9, -1.75 + 0.25 * pat], armR: [0.9, 1.75 - 0.25 * pat], mouth: 'o', brow: 0.4 }, cw * win(...T.lower, 0.16));
    p.air += 24 * Math.max(0, Math.sin(prog(t, T.click + 0.05, T.click + 0.4) * Math.PI));
    mix(p, { armL: [-2.6, -2.9], armR: [2.6, 2.9], eyes: 'happy', mouth: 'open' }, cw * win(T.click + 0.1, 10.85, 0.15));
  }
  admireCommon(p, t, 'rosie');
  accidentWatch(p, t, 'rosie');
  lookAndShrug(p, t, 'rosie');
  return p;
}

export function tam(t) {
  const wi = walkInfo(t, TRACK.tam);
  const p = walking(base(wi.x, lanes.tam), wi, t);
  const win = (a, b, r) => window01(t, a, b, r);
  p.turn = 0.4;
  p.blink = blinkAt(t, [1.6, 3.9, 6.1, 8.3, 12.9, 16.6, 18.3]);
  p.armsFirst = t < T.roll[1] + 0.3;
  const wait = 1 - E.inOutSine(prog(t, T.roll[0] - 0.3, T.roll[0] + 0.05));
  if (wait > 0) {
    mix(p, { turn: 0.55, look: [0.8, 0], armL: [0.4, 1.2], armR: [0.7, 1.4] }, wait);
    // shades eyes from the glow
    mix(p, { armR: [2.2, -1.4], lean: -0.1, eyes: 'half', look: [0.9, 0] }, win(T.doorOpen[0] + 0.12, T.sunOut[1] - 0.15, 0.2));
    p.air += 18 * Math.max(0, Math.sin(prog(t, T.hop[0] + 0.05, T.hop[1] + 0.05) * Math.PI));
    mix(p, { armL: [-2.3, -2.7], armR: [2.3, 2.7], mouth: 'open', eyes: 'happy' }, win(T.hop[0] + 0.05, T.hop[1] + 0.05, 0.16));
  }
  const push = win(T.roll[0] - 0.05, T.roll[1], 0.22);
  if (push > 0) {
    mix(p, { lean: 0.16, look: [1, -0.6], mouth: 'flat', turn: 0.65 }, push);
    p.tgtL = onSun(t, 1.45); p.tgtR = onSun(t, 1.2); p.wL = p.wR = push;
  }
  // wipes brow after the push
  mix(p, { armR: [2.5, -1.4 + 0.5 * Math.sin(t * 25)], eyes: 'closed', mouth: 'smile', turn: 0.1 }, win(3.6, 3.86, 0.16));
  if (t >= T.grab[0] - 0.3 && t < T.lean[1] + 0.3) {
    const r = roller(t, 'pink');
    const w = win(T.grab[1] - 0.05, T.lean[0] + 0.1, 0.2);
    p.hold = { key: 'pink', w };
    p.turn = lerp(p.turn, 0.5, w);
    mix(p, { look: [0.5, -1], headTilt: -0.14, mouth: 'smile' }, win(T.telescope[0], T.retract[1], 0.2));
    p.tgtL = [r.base[0] + 2, r.base[1] - 6]; p.tgtR = poleAt(r, 50); p.wL = p.wR = w;
  }
  const cw = win(8.55, 11.05, 0.28);
  if (cw > 0) {
    mix(p, { turn: -0.1, look: [-0.2, -1], headTilt: -0.12 }, cw);
    mix(p, { armL: [0.9, 2.0], armR: [-0.9, -2.0], mouth: 'o' }, cw * win(8.6, T.click, 0.2)); // hands clasped
    const c = Math.abs(Math.sin((t - T.click) * 16));
    mix(p, { armL: [0.5 + 0.3 * c, 2.2], armR: [-0.5 - 0.3 * c, -2.2], eyes: 'happy', mouth: 'open' }, cw * win(T.click + 0.1, 10.95, 0.15));
  }
  admireCommon(p, t, 'tam');
  accidentWatch(p, t, 'tam');
  lookAndShrug(p, t, 'tam');
  return p;
}

export function gus(t) {
  const wi = walkInfo(t, TRACK.gus);
  const p = walking(base(wi.x, lanes.gus), wi, t);
  const win = (a, b, r) => window01(t, a, b, r);
  p.turn = -0.5; p.look = [-0.8, 0];
  p.blink = blinkAt(t, [1.1, 3.0, 5.6, 7.9, 12.1, 14.42, 17.0, 18.6]);
  // stop signal + lever
  mix(p, { armR: [2.4, 2.9], mouth: 'o', brow: 0.3, look: [-1, -0.2] }, win(T.stopHand[0] + 0.1, T.stopHand[1], 0.22));
  const lev = win(T.lever - 0.2, T.lever + 0.12, 0.16);
  if (lev > 0) { p.tgtL = leverKnob(t); p.wL = lev; }
  mix(p, { armR: [1.2, 2.6], handR: 'thumb', mouth: 'grin', turn: -0.2 }, win(3.66, 4.05, 0.18));
  // watches the painters go past, head follows the rollers
  const ww = win(4.35, 7.15, 0.25);
  if (ww > 0) {
    const dx = clamp((roller(t, 'pink').head[0] - p.x) / 400, -1, 1);
    mix(p, { turn: lerp(-0.4, 0.4, (dx + 1) / 2), look: [dx, -1], headTilt: -0.1, mouth: 'o', armL: [0.6, 1.9], armR: [-0.6, -1.9] }, ww);
  }
  // remote control
  const rem = win(T.remote + 0.12, 10.62, 0.22);
  if (rem > 0) {
    p.remote = rem;
    const press = 0.15 * Math.max(0, Math.sin(t * 9)) * craneMotor(t);
    mix(p, { turn: -0.25, look: [-0.6, -1], headTilt: -0.08, armL: [0.55, 1.35 + press], armR: [-0.35, -1.2], mouth: 'flat' }, rem);
  }
  mix(p, { armR: [2.4, 3.0], mouth: 'grin', eyes: 'happy' }, win(T.click + 0.12, 10.9, 0.18));
  admireCommon(p, t, 'gus');
  // ---- the accident
  if (t >= T.stepBack[0] - 0.3 && t < 17.8) {
    mix(p, { turn: 0, armL: [-1.9, 0.9], armR: [1.9, -0.9], handL: 'open', handR: 'open', look: [-0.4, -1], headTilt: -0.1, mouth: 'smile', eyes: 'open' }, win(T.stepBack[0], T.bump, 0.25));
    mix(p, { squash: 0.93, eyes: 'wide', brow: 1, mouth: 'o', lean: -0.06 }, win(T.bump, T.bump + 0.16, 0.05)); // jolt
    mix(p, { turn: 0.75, look: [1, 0.4], eyes: 'wide', brow: 1, mouth: 'o', armL: [-0.7, 0.4], armR: [0.7, -0.4], handL: 'open', handR: 'open', lean: -0.05 }, win(T.bump + 0.32, T.relief[0], 0.24));
    mix(p, { turn: 0.5, look: [0.9, 0.3], eyes: 'half', brow: -0.2, mouth: 'smile', armR: [2.6, -1.5 + 0.4 * Math.sin(t * 30)], squash: 0.97 }, win(T.relief[0] + 0.06, T.tip[0] - 0.02, 0.1));
    mix(p, { turn: 0.6, look: [1, 0.6], eyes: 'wide', brow: 1, mouth: 'o', armL: [-2.5, -2.0], armR: [2.5, 2.0], handL: 'open', handR: 'open' }, win(T.tip[0] + 0.06, 15.6, 0.14)); // panic
    p.air += 26 * Math.max(0, Math.sin(prog(t, 15.22, 15.56) * Math.PI));
    mix(p, { turn: -0.1, look: [-0.4, -1], headTilt: -0.14, eyes: 'wide', brow: 0.7, mouth: 'o', armL: [-0.25, -0.1], armR: [0.25, 0.1] }, win(15.65, T.look[0], 0.3));
  }
  lookAndShrug(p, t, 'gus');
  return p;
}

// Rosie and Tam during the accident.
function accidentWatch(p, t, who) {
  if (t < T.relief[0] - 0.3 || t >= 17.8) return;
  mix(p, { turn: 0.6, look: [1, 0.5], eyes: 'wide', brow: 0.9, mouth: 'o', headTilt: 0 }, window01(t, T.tip[0] + 0.02, 15.55, 0.18));
  const sway = Math.sin(t * 2 + (who === 'tam' ? 1 : 0));
  mix(p, { turn: who === 'tam' ? 0.2 : 0.35, look: [0.3 * sway, -1], headTilt: -0.16, eyes: 'wide', brow: 0.6, mouth: 'o', armL: [-0.3, -0.15], armR: [0.3, 0.15] }, window01(t, 15.65, T.look[0], 0.3));
}

function admireCommon(p, t, who) {
  const [a0] = T.admire;
  if (t < a0 - 0.35 || t > 17.5) return;
  const w = window01(t, a0, who === 'gus' ? T.stepBack[0] : 17.5, 0.3);
  if (w <= 0) return;
  const nod = Math.sin((t - a0) * 5) * window01(t, 12.0, 12.8, 0.2);
  const sigh = window01(t, 12.05, 12.6, 0.18);
  const pose = { turn: 0, look: [who === 'rosie' ? 0.4 : who === 'gus' ? -0.5 : 0, -1], headTilt: -0.12, headDY: 2 * nod, mouth: 'smile', eyes: 'open', walk: p.walk };
  if (who === 'rosie') Object.assign(pose, { armL: [-0.75, 0.9], armR: [0.75, -0.9] }); // hands on hips
  if (who === 'tam') Object.assign(pose, { armL: [-0.6, 0.8], armR: [0.6, -0.8] });
  if (who === 'gus') Object.assign(pose, { armL: [0.5, 1.7], armR: [-0.5, -1.7] }); // arms folded
  mix(p, pose, w);
  if (who === 'tam') mix(p, { armR: [2.5, -1.4 + 0.5 * Math.sin(t * 22)], eyes: 'closed' }, w * window01(t, 11.5, 11.95, 0.16));
  if (who === 'rosie') mix(p, { armL: [-1.0, 1.9], armR: [1.0, -1.9], eyes: 'happy' }, w * window01(t, 11.65, 12.2, 0.18)); // clasps hands
  mix(p, { eyes: 'happy', shoulder: 5, squash: 1.02 }, sigh * w);
}

// Look at each other, then shrug.
function lookAndShrug(p, t, who) {
  const [l0, l1] = T.look;
  if (t < l0 - 0.3) return;
  const face = window01(t, l0, l1 + 0.1, 0.22);
  const [g0, d0, g1, d1] = { gus: [17.68, -1, 18.1, -1], tam: [17.8, 1, 18.18, -1], rosie: [17.92, 1, 18.24, 1] }[who];
  const glance = E.inOutSine(prog(t, g0, g0 + 0.12));
  const dir = lerp(d0, d1, E.inOutSine(prog(t, g1, g1 + 0.14)));
  mix(p, { turn: 0.45 * dir * glance, look: [dir * glance, 0.1], headTilt: 0.06 * dir * glance, eyes: 'open', brow: 0.3, mouth: 'flat', armL: [-0.2, -0.1], armR: [0.2, 0.1] }, face);
  p.headDY -= 2 * (window01(t, g0, g0 + 0.08, 0.05) + window01(t, g1, g1 + 0.08, 0.05));
  const sh = E.outBack(prog(t, T.shrug[0], T.shrug[1]));
  if (sh > 0) {
    const k = sh * (1 - 0.18 * E.inOutSine(prog(t, 19.35, 19.9)));
    mix(p, {
      turn: 0, look: [who === 'gus' ? -0.3 : who === 'rosie' ? 0.3 : 0, -0.1], shoulder: 11, headTilt: who === 'tam' ? -0.1 : who === 'gus' ? 0.08 : 0.1,
      armL: [-0.95, -2.2], armR: [0.95, 2.2], handL: 'open', handR: 'open', brow: 1, browTilt: -0.6, eyes: 'half', mouth: 'wavy', squash: 1.02,
    }, Math.min(1, k));
    if (t > 19.45) p.mouth = 'smile';
  }
}

// Point at distance d along a roller pole from its base.
export function poleAt(r, d) {
  const dx = r.head[0] - r.base[0], dy = r.head[1] - r.base[1], l = Math.hypot(dx, dy) || 1;
  return [r.base[0] + (dx / l) * d, r.base[1] + (dy / l) * d];
}
function leverKnob(t) { const a = lerp(-0.7, 0.75, lever(t)); return [698 + 40 * Math.sin(a), 1372 - 40 * Math.cos(a)]; }
export { leverKnob };

export function workers(t) {
  return [gus(t), tam(t), rosie(t)].map((p, i) => ({ ...p, id: ['gus', 'tam', 'rosie'][i] }));
}
