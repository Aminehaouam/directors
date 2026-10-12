// Procedural textures at 2x working resolution, fully seeded (same files every run).
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { noise2, hash2, mulberry32 } from '../../src/animations/rng.js';

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

function fbm(x, y, seed, oct) {
  let v = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { v += a * noise2(x * f, y * f, seed + i * 31); n += a; a *= 0.5; f *= 2; }
  return v / n;
}

function blendPx(data, w, h, x, y, rgb, a) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const i = (y * w + x) * 4;
  data[i] = data[i] * (1 - a) + rgb[0] * a;
  data[i + 1] = data[i + 1] * (1 - a) + rgb[1] * a;
  data[i + 2] = data[i + 2] * (1 - a) + rgb[2] * a;
}

function fibres(data, w, h, seed, count, light, dark, alpha) {
  const r = mulberry32(seed);
  for (let n = 0; n < count; n++) {
    let x = r() * w, y = r() * h, ang = r() * Math.PI * 2;
    const len = 18 + r() * 80, col = r() < 0.55 ? light : dark, curl = (r() - 0.5) * 0.08;
    for (let s = 0; s < len; s++) {
      blendPx(data, w, h, x, y, col, alpha * (0.5 + 0.5 * Math.sin((s / len) * Math.PI)));
      ang += curl; x += Math.cos(ang); y += Math.sin(ang);
    }
  }
}

function save(png, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(png, { colorType: 2, deflateLevel: 4, filterType: 0 }));
}

export function makeWood(file, w, h, baseHex, seed) {
  const png = new PNG({ width: w, height: h, colorType: 2 }), d = png.data, base = hex(baseHex);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const warp = (noise2(x / 1100, y / 800, seed) - 0.5) * 220 + (noise2(x / 260, y / 160, seed + 5) - 0.5) * 40;
      const yy = y + warp;
      const ring = noise2(yy / 14, x / 2600, seed + 1) * 0.5 + noise2(yy / 4, x / 900, seed + 2) * 0.3 + noise2(yy / 90, x / 3000, seed + 3) * 0.6;
      let k = 0.58 + 0.62 * (ring / 1.4);
      k *= 0.94 + 0.12 * hash2(x, y, seed + 9);
      if (hash2(x >> 1, y >> 2, seed + 11) > 0.993) k *= 0.6;
      const i = (y * w + x) * 4;
      d[i] = clamp(base[0] * k); d[i + 1] = clamp(base[1] * k); d[i + 2] = clamp(base[2] * k); d[i + 3] = 255;
    }
  }
  save(png, file);
}

export function makeParchment(file, w, h, baseHex, seed, opts = {}) {
  const { blotch = 0.09, fibreCount = 9000, stains = 7 } = opts;
  const png = new PNG({ width: w, height: h, colorType: 2 }), d = png.data, base = hex(baseHex);
  const r = mulberry32(seed + 77), st = [];
  for (let i = 0; i < stains; i++) st.push({ x: r() * w, y: r() * h, rad: 120 + r() * 340, a: 0.05 + r() * 0.07 });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let k = 1 + (fbm(x / 700, y / 700, seed, 3) - 0.5) * blotch * 2 + (fbm(x / 70, y / 70, seed + 3, 2) - 0.5) * 0.05;
      k *= 0.975 + 0.05 * hash2(x, y, seed + 7);
      let tint = 0;
      for (const s of st) { const dx = x - s.x, dy = y - s.y, q = (dx * dx + dy * dy) / (s.rad * s.rad); if (q < 1) tint += s.a * (1 - q) * (1 - q); }
      const i = (y * w + x) * 4;
      d[i] = clamp(base[0] * k * (1 - tint * 0.5)); d[i + 1] = clamp(base[1] * k * (1 - tint * 0.9)); d[i + 2] = clamp(base[2] * k * (1 - tint * 1.6)); d[i + 3] = 255;
    }
  }
  fibres(d, w, h, seed + 1, fibreCount, [255, 248, 228], [120, 92, 52], 0.16);
  save(png, file);
}

export function buildTextures(outDir, palette) {
  const t = Date.now();
  makeWood(path.join(outDir, 'wood.png'), 3840, 2160, palette.walnut, 11);
  makeParchment(path.join(outDir, 'parchment.png'), 3840, 2160, palette.parchment, 21, { blotch: 0.1, fibreCount: 16000 });
  makeParchment(path.join(outDir, 'paper-ivory.png'), 2048, 2048, palette.ivory, 31, { blotch: 0.05, fibreCount: 5000, stains: 3 });
  makeParchment(path.join(outDir, 'paper-aged.png'), 2048, 2048, palette.aged, 41, { blotch: 0.09, fibreCount: 5000, stains: 5 });
  return Date.now() - t;
}
