// Paper-cut toolkit: procedural paper texture, hand-cut (slightly irregular) shapes,
// stacked-paper drop shadows and a colour grade that every paper colour passes through.
import { mulberry32, hashStr, noise1, lerp, clamp } from './lib.js';

/** Fibrous paper grain centred on mid-grey, used with an 'overlay' blend on every piece. */
export function makePaperTexture(size = 512, seed = 7) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size), d = img.data, r = mulberry32(seed);
  // multi-octave value noise, tileable via wrapping lattice
  const lat = (n) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = r(); return a; };
  const octs = [[8, 0.5], [32, 0.28], [128, 0.22]].map(([n, w]) => ({ n, w, a: lat(n) }));
  const s3 = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0;
    for (const o of octs) {
      const fx = (x / size) * o.n, fy = (y / size) * o.n, ix = Math.floor(fx), iy = Math.floor(fy), tx = s3(fx - ix), ty = s3(fy - iy);
      const at = (i, j) => o.a[((j % o.n) * o.n) + (i % o.n)];
      v += o.w * lerp(lerp(at(ix, iy), at(ix + 1, iy), tx), lerp(at(ix, iy + 1), at(ix + 1, iy + 1), tx), ty);
    }
    const speck = r() < 0.004 ? (r() - 0.5) * 70 : 0;
    const val = clamp(128 + (v - 0.5) * 34 + (r() - 0.5) * 16 + speck, 0, 255);
    const i = (y * size + x) * 4; d[i] = d[i + 1] = d[i + 2] = val; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // fibres
  g.lineCap = 'round';
  for (let k = 0; k < 900; k++) {
    const x = r() * size, y = r() * size, a = r() * Math.PI, l = 6 + r() * 26, bend = (r() - 0.5) * 8;
    g.strokeStyle = r() < 0.6 ? `rgba(255,255,255,${0.10 + r() * 0.16})` : `rgba(0,0,0,${0.06 + r() * 0.1})`;
    g.lineWidth = 0.6 + r() * 1.1;
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      g.beginPath(); g.moveTo(x + ox, y + oy);
      g.quadraticCurveTo(x + ox + Math.cos(a) * l * 0.5 - Math.sin(a) * bend, y + oy + Math.sin(a) * l * 0.5 + Math.cos(a) * bend, x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l);
      g.stroke();
    }
  }
  return c;
}

/* ------------------------------------------------------------- hand-cut shapes */
// Low-frequency edge jitter so nothing is a perfect vector shape.
const jit = (seed, u, amp) => (noise1(u, seed) - 0.5) * 2 * amp + (noise1(u * 3.1, seed + 9) - 0.5) * amp * 0.6;

/** Closed wobbly ellipse. */
export function blob(cx, cy, rx, ry, seed, amp = 0.018, n = 72) {
  const p = new Path2D(), s = typeof seed === 'string' ? hashStr(seed) % 9973 : seed;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + jit(s, (i % n) * 0.35, amp) * (i === n ? 0 : 1);
    const kk = i === n ? 1 + jit(s, 0, amp) : k;
    const x = cx + Math.cos(a) * rx * kk, y = cy + Math.sin(a) * ry * kk;
    i ? p.lineTo(x, y) : p.moveTo(x, y);
  }
  p.closePath();
  return p;
}

/** Subdivide a polygon's edges and jitter them perpendicular to the edge. pts: [[x,y],...] */
export function cutPoly(pts, seed, amp = 1.4, step = 16, closed = true, path = new Path2D()) {
  const s = typeof seed === 'string' ? hashStr(seed) % 9973 : seed;
  let u = 0, first = true;
  const m = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    const k = Math.max(1, Math.round(len / step));
    for (let j = 0; j < k; j++) {
      const t = j / k, e = j === 0 ? 0 : jit(s, u + t * len * 0.05, amp);
      const x = a[0] + dx * t + nx * e, y = a[1] + dy * t + ny * e;
      if (first) { path.moveTo(x, y); first = false; } else path.lineTo(x, y);
    }
    u += len * 0.05;
  }
  if (!closed) path.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); else path.closePath();
  return path;
}

/** Rounded rectangle as points (for cutPoly) */
export function rrectPts(x, y, w, h, r, seg = 4) {
  r = Math.min(r, w / 2, h / 2);
  const out = [];
  const arc = (cx, cy, a0) => { for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * (Math.PI / 2); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
  return out;
}
export const rrect = (x, y, w, h, r, seed, amp = 0.8) => cutPoly(rrectPts(x, y, w, h, r), seed, amp, 12);

/** Capsule along +y from (0,0) to (0,len), radius r (cut-out limb). */
export function capsule(len, r, seed, amp = 0.6) {
  const pts = [];
  const n = 8;
  for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI; pts.push([Math.cos(a) * r, len + Math.sin(a) * r]); }
  return cutPoly(pts, seed, amp, 8);
}

/** Polygon from points along a function: top edge f(x) for x in [x0,x1] then down to yb. */
export function edgeShape(x0, x1, f, yb, step = 12, seed = 1, amp = 1.5) {
  const pts = [];
  for (let x = x0; x <= x1 + 0.01; x += step) pts.push([x, f(x)]);
  pts.push([x1, yb], [x0, yb]);
  return cutPoly(pts, seed, amp, step * 2);
}

export function star5(r, inner = 0.48, seed = 1, round = 0.18) {
  const p = new Path2D(), s = seed;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = (i % 2 ? r * inner : r) * (1 + (noise1(i * 1.3, s) - 0.5) * 0.08);
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  // soften the tips a touch (paper star cut with scissors)
  for (let i = 0; i < 10; i++) {
    const a = pts[(i + 9) % 10], b = pts[i], c = pts[(i + 1) % 10];
    const p1 = [lerp(b[0], a[0], round), lerp(b[1], a[1], round)], p2 = [lerp(b[0], c[0], round), lerp(b[1], c[1], round)];
    i ? p.lineTo(...p1) : p.moveTo(...p1);
    p.quadraticCurveTo(b[0], b[1], p2[0], p2[1]);
  }
  p.closePath();
  return p;
}

/* ------------------------------------------------------------- colour + grade */
export const hex2rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const rgbStr = (c, a = 1) => (a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`);
export const mixHex = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return rgbStr(x.map((v, i) => lerp(v, y[i], t))); };

export class Grade {
  constructor() { this.cache = new Map(); this.m = [1, 1, 1]; this.a = [0, 0, 0]; }
  set(warm, night) {
    const W = [1.0, 0.9, 0.8], Wa = [10, 0, 6];
    const N = [0.36, 0.42, 0.72], Na = [6, 8, 26];
    this.m = [0, 1, 2].map((i) => lerp(1, W[i], warm) * lerp(1, N[i], night));
    this.a = [0, 1, 2].map((i) => lerp(0, Wa[i], warm) * (1 - night) + Na[i] * night);
    this.cache.clear();
  }
  /** graded css colour for a paper hex */
  c(hex, alpha = 1) {
    const key = hex + alpha;
    let v = this.cache.get(key);
    if (!v) { const c = hex2rgb(hex); v = rgbStr(c.map((x, i) => clamp(x * this.m[i] + this.a[i], 0, 255)), alpha); this.cache.set(key, v); }
    return v;
  }
}

/** Paper painter bound to a 2D context. Shadows are in world units, converted to device pixels. */
export class Paper {
  constructor(g, tex) { this.g = g; this.pat = g.createPattern(tex, 'repeat'); this.z = 1; this.grade = new Grade(); this.texAlpha = 0.55; }
  shadowFor(level) {
    return [null, [3.2, 1.2, 2.6, 0.30], [9, 2, 5, 0.30], [18, 0, 10, 0.32], [30, 0, 16, 0.30]][level];
  }
  /** Fill a path with a paper colour (graded), stacked-paper shadow, and grain. */
  fill(path, hex, sh = 1, tex = 1, opts = {}) {
    const g = this.g;
    const col = opts.raw ? hex : this.grade.c(hex, opts.alpha ?? 1);
    g.save();
    if (sh && !opts.noShadow) {
      const [b, dx, dy, a] = this.shadowFor(sh);
      g.shadowColor = `rgba(38,14,30,${a * (opts.shadowK ?? 1)})`; g.shadowBlur = b * this.z; g.shadowOffsetX = dx * this.z; g.shadowOffsetY = dy * this.z;
    }
    g.fillStyle = col;
    g.fill(path, opts.rule || 'nonzero');
    g.restore();
    if (tex) this.grain(path, tex, opts.rule);
  }
  grain(path, k = 1, rule) {
    const g = this.g;
    g.save();
    g.globalCompositeOperation = 'overlay';
    g.globalAlpha = this.texAlpha * k;
    g.fillStyle = this.pat;
    g.fill(path, rule || 'nonzero');
    g.restore();
  }
}
