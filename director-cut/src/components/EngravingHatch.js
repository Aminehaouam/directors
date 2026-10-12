import { hash2 } from '../animations/rng.js';
import { clamp01 } from '../animations/easing.js';

/** Parallel hatch lines over a rectangle, optionally clipped to a path. Lines draw on in order when p < 1. */
export function hatchRect(ctx, g, { rect, angle = 45, spacing = 7, width = 1, color, alpha = 0.5, p = 1, seed = 1, wobble = 0.3, clip = null }) {
  if (p <= 0) return;
  const [x, y, w, h] = rect;
  g.save();
  if (clip) g.clip(clip); else { g.beginPath(); g.rect(x, y, w, h); g.clip(); }
  const cx = x + w / 2, cy = y + h / 2, d = Math.hypot(w, h) / 2 + 4, n = Math.ceil((2 * d) / spacing);
  g.translate(cx, cy); g.rotate((angle * Math.PI) / 180);
  const path = new Path2D();
  for (let i = 0; i < n; i++) {
    const lp = clamp01(p * 1.5 - (i / n) * 0.5);
    if (lp <= 0) continue;
    const j = (hash2(i, seed, 3) - 0.5) * spacing * wobble;
    const yy = -d + i * spacing + j;
    path.moveTo(-d, yy); path.lineTo(-d + 2 * d * lp, yy + (hash2(i, seed, 9) - 0.5) * 1.2);
  }
  g.lineWidth = width; g.lineCap = 'round'; g.strokeStyle = color || ctx.P.ink; g.globalAlpha *= alpha;
  g.stroke(path);
  g.restore();
}

export function stippleRect(ctx, g, { rect, count = 200, color, alpha = 0.6, seed = 1, r = 1, clip = null }) {
  const [x, y, w, h] = rect;
  g.save();
  if (clip) g.clip(clip);
  g.fillStyle = color || ctx.P.ink; g.globalAlpha *= alpha;
  const path = new Path2D();
  for (let i = 0; i < count; i++) { const px = x + hash2(i, seed, 1) * w, py = y + hash2(i, seed, 2) * h, rr = r * (0.5 + hash2(i, seed, 3)); path.moveTo(px + rr, py); path.arc(px, py, rr, 0, 6.2832); }
  g.fill(path);
  g.restore();
}

/**
 * Luminance-driven engraving of an image: three crosshatch passes whose line weight follows the picture.
 * Built once per (key, size) into an offscreen canvas, so it costs nothing per frame.
 */
export function engraveImage(ctx, key, img, w, h, { spacing = 9, color } = {}) {
  if (!ctx._engr) ctx._engr = {};
  const k = `${key}|${w}x${h}|${spacing}`;
  if (ctx._engr[k]) return ctx._engr[k];
  const sw = Math.ceil(w / 4), sh = Math.ceil(h / 4);
  const sm = document.createElement('canvas'); sm.width = sw; sm.height = sh;
  const sg = sm.getContext('2d', { willReadFrequently: true });
  // cover-fit the source into w x h
  const ar = img.width / img.height, tar = w / h;
  let sx = 0, sy = 0, sW = img.width, sH = img.height;
  if (ar > tar) { sW = img.height * tar; sx = (img.width - sW) / 2; } else { sH = img.width / tar; sy = (img.height - sH) / 2; }
  sg.drawImage(img, sx, sy, sW, sH, 0, 0, sw, sh);
  const px = sg.getImageData(0, 0, sw, sh).data;
  const lum = (x, y) => { x = Math.max(0, Math.min(sw - 1, Math.round(x / 4))); y = Math.max(0, Math.min(sh - 1, Math.round(y / 4))); const i = (y * sw + x) * 4; return (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) / 255; };
  const out = document.createElement('canvas'); out.width = Math.round(w * ctx.S); out.height = Math.round(h * ctx.S);
  const og = out.getContext('2d'); og.scale(ctx.S, ctx.S);
  og.strokeStyle = color || ctx.P.ink; og.lineCap = 'butt';
  const passes = [{ ang: 45, thr: 0.78, mul: 1 }, { ang: 135, thr: 0.52, mul: 0.85 }, { ang: 0, thr: 0.3, mul: 0.7 }];
  for (const ps of passes) {
    og.save(); og.translate(w / 2, h / 2); og.rotate((ps.ang * Math.PI) / 180);
    const ca = Math.cos((ps.ang * Math.PI) / 180), sa = Math.sin((ps.ang * Math.PI) / 180), d = Math.hypot(w, h) / 2;
    for (let yy = -d; yy < d; yy += spacing) {
      for (let xx = -d; xx < d; xx += 5) {
        const wx = w / 2 + xx * ca - yy * sa, wy = h / 2 + xx * sa + yy * ca;
        if (wx < 0 || wy < 0 || wx > w || wy > h) continue;
        const l = lum(wx, wy), dark = clamp01((ps.thr - l) / ps.thr);
        if (dark <= 0.03) continue;
        og.lineWidth = Math.max(0.5, dark * spacing * 0.42 * ps.mul);
        og.beginPath(); og.moveTo(xx, yy); og.lineTo(xx + 5.5, yy); og.stroke();
      }
    }
    og.restore();
  }
  ctx._engr[k] = out;
  return out;
}
