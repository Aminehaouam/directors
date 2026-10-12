import { noise1, hash2 } from '../animations/rng.js';
import { clamp01 } from '../animations/easing.js';

// Canvas shadow offsets and blur are in device pixels and ignore the transform, so they are scaled by ctx.S here.
// Light always comes from the top-left: shadows fall down and to the right.
export function setShadow(ctx, g, { dx = 10, dy = 14, blur = 24, color = 'rgba(23,24,20,0.35)' } = {}) {
  const S = ctx.S;
  g.shadowColor = color; g.shadowOffsetX = dx * S; g.shadowOffsetY = dy * S; g.shadowBlur = blur * S;
}
export function clearShadow(g) { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0; }
export const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
export function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = (s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

/** Rectangle whose edges are displaced by seeded noise: the torn-paper silhouette. Returns {path, pts}. */
export function tornPath(x, y, w, h, seed = 1, rough = 5, step = 16) {
  const pts = [];
  const edge = (x0, y0, x1, y1, s) => {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(len / step)), nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
    for (let i = 0; i < n; i++) {
      const t = i / n, d = (noise1((t * len) / 46, seed + s * 13) - 0.5) * 2 * rough + (hash2(i, s, seed) - 0.5) * rough * 0.7;
      pts.push([x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d]);
    }
  };
  edge(x, y, x + w, y, 1); edge(x + w, y, x + w, y + h, 2); edge(x + w, y + h, x, y + h, 3); edge(x, y + h, x, y, 4);
  const path = new Path2D();
  pts.forEach((p, i) => (i ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1])));
  path.closePath();
  return { path, pts };
}

/** Polyline helpers for ink draw-on. */
export function polyLen(pts) { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; }
export function polyHead(pts, p) {
  p = clamp01(p);
  const total = polyLen(pts), want = total * p, out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg >= want) { const k = seg ? (want - acc) / seg : 0; out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]); return out; }
    out.push(pts[i]); acc += seg;
  }
  return out;
}

/** Cached repeating texture pattern. */
export function pattern(ctx, g, tex, scale, ox = 0, oy = 0) {
  const key = tex;
  if (!ctx._pat) ctx._pat = {};
  if (!ctx._pat[key]) ctx._pat[key] = g.createPattern(ctx.img[tex], 'repeat');
  const p = ctx._pat[key];
  p.setTransform(new DOMMatrix().translate(ox, oy).scale(scale, scale));
  return p;
}
export const ease01 = (v) => clamp01(v);
