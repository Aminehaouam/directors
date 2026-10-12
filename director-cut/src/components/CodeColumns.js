import { hash2 } from '../animations/rng.js';
import { clamp01 } from '../animations/easing.js';

const CHARS = '0123456789:;=+*<>/\\|-_[]{}()#%&?';

function atlas(ctx, color, size) {
  const key = `${color}|${size}`;
  if (!ctx._atlas) ctx._atlas = {};
  if (ctx._atlas[key]) return ctx._atlas[key];
  const cell = Math.ceil(size * 1.1), c = document.createElement('canvas');
  const sc = Math.max(1, ctx.S);
  c.width = cell * CHARS.length * sc; c.height = cell * 1.4 * sc;
  const a = c.getContext('2d'); a.scale(sc, sc);
  a.font = `500 ${size}px "Inter", sans-serif`; a.fillStyle = color; a.textBaseline = 'top';
  [...CHARS].forEach((ch, i) => a.fillText(ch, i * cell + (cell - a.measureText(ch).width) / 2, 2));
  return (ctx._atlas[key] = { c, cell, size, sc });
}

/**
 * Seeded columns of digits and symbols. Deep green + multiply reads as ink on parchment; light green + screen on walnut.
 * o: {rect:[x,y,w,h], color, blend, alpha, seed, t, colW, size, density, speed, clip}
 */
export function codeColumns(ctx, g, o) {
  const [x, y, w, h] = o.rect, size = o.size || 22, colW = o.colW || 34, lineH = size * 1.28, A = atlas(ctx, o.color, size);
  const cols = Math.floor(w / colW), seed = o.seed || 1, t = o.t, density = o.density ?? 0.62, speed = o.speed ?? 1;
  g.save();
  if (o.clip) g.clip(o.clip); else { g.beginPath(); g.rect(x, y, w, h); g.clip(); }
  g.globalCompositeOperation = o.blend || 'multiply';
  const rows = Math.ceil(h / lineH) + 2;
  for (let c = 0; c < cols; c++) {
    if (hash2(c, 1, seed) > density) continue;
    const v = (28 + hash2(c, 2, seed) * 90) * speed, off = hash2(c, 3, seed) * rows * lineH, len = 8 + Math.floor(hash2(c, 4, seed) * 16);
    const cx = x + c * colW + (colW - size * 0.6) / 2;
    const head = (off + t * v) % (rows * lineH);
    for (let r = 0; r < len; r++) {
      const yy = y + ((head - r * lineH) % (rows * lineH) + rows * lineH) % (rows * lineH) - lineH;
      if (yy < y - lineH || yy > y + h) continue;
      const tail = 1 - r / len, ci = Math.floor(hash2(c, r + Math.floor(t * (1.4 + hash2(c, 5, seed))), seed + 7) * CHARS.length);
      g.globalAlpha = clamp01((o.alpha ?? 0.6) * (0.15 + 0.85 * tail * tail));
      g.drawImage(A.c, ci * A.cell * A.sc, 0, A.cell * A.sc, A.c.height, cx, yy, A.cell, A.c.height / A.sc);
    }
  }
  g.restore();
}
