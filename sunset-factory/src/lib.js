// Math, easing, keyframes and seeded randomness. Shared by the browser renderer and the Node audio script.
// Nothing here may call Math.random or read the clock: every frame is a pure function of t.

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const TAU = Math.PI * 2;

export const E = {
  linear: (x) => x,
  inQuad: (x) => x * x,
  outQuad: (x) => 1 - (1 - x) * (1 - x),
  inOutQuad: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
  inCubic: (x) => x * x * x,
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  outSine: (x) => Math.sin((x * Math.PI) / 2),
  inSine: (x) => 1 - Math.cos((x * Math.PI) / 2),
  outBack: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  outBackSoft: (x) => { const c1 = 0.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  inBack: (x) => { const c1 = 1.70158; return (c1 + 1) * x * x * x - c1 * x * x; },
  outElastic: (x) => (x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (TAU / 3)) + 1),
  outBounce: (x) => {
    const n1 = 7.5625, d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  },
  step: (x) => (x < 1 ? 0 : 1),
};

/**
 * Keyframe track. keys: [[time, value, easeName?], ...] sorted by time; the ease of a key
 * shapes the segment that starts at it (default inOutSine). Values may be numbers or arrays.
 */
export function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  const last = keys[keys.length - 1];
  if (t >= last[0]) return last[1];
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
  const [t0, v0, en] = keys[i], [t1, v1] = keys[i + 1];
  const u = (E[en || 'inOutSine'])((t - t0) / (t1 - t0));
  if (Array.isArray(v0)) return v0.map((a, k) => a + (v1[k] - a) * u);
  return v0 + (v1 - v0) * u;
}

/** Smooth 0→1→0 pulse inside [a, b] with ramps of length r. */
export function window01(t, a, b, r = 0.15) {
  return Math.min(E.inOutSine(prog(t, a - r, a)), 1 - E.inOutSine(prog(t, b, b + r)));
}

export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Seeded generator keyed by a string id (stable across frames and workers). */
export const rng = (id) => mulberry32(hashStr(String(id)));

export function hash2(x, y, seed = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const sm = (t) => t * t * (3 - 2 * t);
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  return hash2(i, 0, seed) * (1 - sm(f)) + hash2(i + 1, 0, seed) * sm(f);
}

export function bez(p0, p1, p2, p3, u) {
  const v = 1 - u;
  return [
    v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
    v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
  ];
}

/**
 * Two-bone IK in screen space. Angles use the rig convention: 0 = pointing down,
 * +PI/2 = pointing screen-right. bend = +1/-1 picks the elbow side.
 */
export function ik(sx, sy, tx, ty, l1, l2, bend = 1) {
  let dx = tx - sx, dy = ty - sy;
  let d = Math.hypot(dx, dy);
  const maxD = (l1 + l2) * 0.999, minD = Math.abs(l1 - l2) + 0.01;
  if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
  if (d < minD) d = minD;
  const base = Math.atan2(dx, dy); // rig angle of the shoulder→target line
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const a = Math.acos(cosA);
  const a1 = base + bend * a;
  const ex = sx + l1 * Math.sin(a1), ey = sy + l1 * Math.cos(a1);
  const a2 = Math.atan2(sx + dx - ex, sy + dy - ey);
  return [a1, a2];
}
