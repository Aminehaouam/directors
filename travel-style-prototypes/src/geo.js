// Geometry helpers. Everything returns SVG-style absolute path strings that
// tools/riv-writer.js converts into Rive PointsPath vertices.
'use strict';

const f = (n) => (Math.round(n * 100) / 100).toString();
const K = 0.5522847498; // circle kappa

function rrect(x, y, w, h, r = 0) {
  const tl = Array.isArray(r) ? r : [r, r, r, r]; // tl, tr, br, bl
  const [a, b, c, d] = tl.map((v) => Math.min(v, w / 2, h / 2));
  const k = 1 - K;
  return [
    `M${f(x + a)} ${f(y)}`, `L${f(x + w - b)} ${f(y)}`,
    b ? `C${f(x + w - b * k)} ${f(y)} ${f(x + w)} ${f(y + b * k)} ${f(x + w)} ${f(y + b)}` : '',
    `L${f(x + w)} ${f(y + h - c)}`,
    c ? `C${f(x + w)} ${f(y + h - c * k)} ${f(x + w - c * k)} ${f(y + h)} ${f(x + w - c)} ${f(y + h)}` : '',
    `L${f(x + d)} ${f(y + h)}`,
    d ? `C${f(x + d * k)} ${f(y + h)} ${f(x)} ${f(y + h - d * k)} ${f(x)} ${f(y + h - d)}` : '',
    `L${f(x)} ${f(y + a)}`,
    a ? `C${f(x)} ${f(y + a * k)} ${f(x + a * k)} ${f(y)} ${f(x + a)} ${f(y)}` : '',
    'Z',
  ].join(' ');
}

function ellipse(cx, cy, rx, ry = rx) {
  const ox = rx * K, oy = ry * K;
  return `M${f(cx - rx)} ${f(cy)} C${f(cx - rx)} ${f(cy - oy)} ${f(cx - ox)} ${f(cy - ry)} ${f(cx)} ${f(cy - ry)} ` +
    `C${f(cx + ox)} ${f(cy - ry)} ${f(cx + rx)} ${f(cy - oy)} ${f(cx + rx)} ${f(cy)} ` +
    `C${f(cx + rx)} ${f(cy + oy)} ${f(cx + ox)} ${f(cy + ry)} ${f(cx)} ${f(cy + ry)} ` +
    `C${f(cx - ox)} ${f(cy + ry)} ${f(cx - rx)} ${f(cy + oy)} ${f(cx - rx)} ${f(cy)} Z`;
}
const circle = (cx, cy, r) => ellipse(cx, cy, r, r);

function poly(pts, closed = true) {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${f(p[1])}`).join(' ') + (closed ? ' Z' : '');
}

// Smooth Catmull-Rom spline through points, converted to cubic beziers.
function smooth(pts, closed = true, tension = 1) {
  const n = pts.length; const out = [`M${f(pts[0][0])} ${f(pts[0][1])}`];
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    out.push(`C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`);
  }
  return out.join(' ') + (closed ? ' Z' : '');
}

// Arc as cubic segments (angles in radians, clockwise positive in y-down space).
function arcPts(cx, cy, r, a0, a1, steps = 24) {
  const pts = [];
  for (let i = 0; i <= steps; i++) { const a = a0 + ((a1 - a0) * i) / steps; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
}

// Ring (annulus) path; fill with evenOdd.
const ring = (cx, cy, r0, r1) => circle(cx, cy, r1) + ' ' + circle(cx, cy, r0);

// Apply a point transform to every coordinate pair in a path string.
function mapPath(d, fn) {
  return d.replace(/(-?\d*\.?\d+(?:e[-+]?\d+)?)[ ,](-?\d*\.?\d+(?:e[-+]?\d+)?)/g, (_, x, y) => {
    const [nx, ny] = fn(parseFloat(x), parseFloat(y)); return `${f(nx)} ${f(ny)}`;
  });
}
const translate = (d, dx, dy) => mapPath(d, (x, y) => [x + dx, y + dy]);
const scalePath = (d, sx, sy = sx, ox = 0, oy = 0) => mapPath(d, (x, y) => [ox + (x - ox) * sx, oy + (y - oy) * sy]);
function rotatePath(d, ang, ox = 0, oy = 0) {
  const c = Math.cos(ang), s = Math.sin(ang);
  return mapPath(d, (x, y) => [ox + (x - ox) * c - (y - oy) * s, oy + (x - ox) * s + (y - oy) * c]);
}
const snapPath = (d, g) => mapPath(d, (x, y) => [Math.round(x / g) * g, Math.round(y / g) * g]);

// Deterministic PRNG.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

module.exports = { rrect, ellipse, circle, poly, smooth, arcPts, ring, mapPath, translate, scalePath, rotatePath, snapPath, rng, f };
