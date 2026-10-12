import { polyHead } from './util.js';
import { clamp01, smooth } from '../animations/easing.js';
import { drawText, fontCss, measure, defaultTracking } from '../typography/text.js';

/** Draw the first fraction p of a polyline as an ink line (stroke-dashoffset style draw-on). */
export function inkLine(ctx, g, pts, p, { width = 2, color, alpha = 1, cap = 'round', tick = 0 } = {}) {
  if (p <= 0) return;
  const head = polyHead(pts, p);
  g.save();
  g.strokeStyle = color || ctx.P.ink; g.lineWidth = width; g.lineCap = cap; g.lineJoin = 'round'; g.globalAlpha *= alpha;
  g.beginPath(); head.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke();
  if (tick && p >= 1) { const e = pts[pts.length - 1]; g.fillStyle = g.strokeStyle; g.beginPath(); g.arc(e[0], e[1], tick, 0, 6.2832); g.fill(); }
  g.restore();
}

/** Ink-on-paper text that is traced by a pen then filled, letter by letter. p in 0..1. */
export function inkText(ctx, g, id, str, x, y, p, o = {}) {
  const role = o.role || 'display', size = o.size || 96, tr = o.tracking ?? defaultTracking(ctx, role, o);
  const text = o.upper ? str.toUpperCase() : str;
  const full = measure(ctx, role, text, size, { ...o, tracking: tr });
  const total = full.width - tr * size, align = o.align || 'left';
  const left = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const box = drawText(ctx, g, id, text, left, y, { ...o, upper: false, align: 'left', draw: false, alpha: p >= 0.999 ? 1 : p, role, size, tracking: tr });
  if (p <= 0 || ctx.noText) return box;
  g.save();
  g.font = fontCss(ctx, role, size, o); g.letterSpacing = `${tr * size}px`; g.textBaseline = 'alphabetic';
  g.lineJoin = 'round'; g.lineCap = 'round';
  const n = text.length;
  let cx = left;
  for (let i = 0; i < n; i++) {
    const ch = text[i], adv = g.measureText(text.slice(0, i + 1)).width - g.measureText(text.slice(0, i)).width;
    const start = (i / n) * 0.72, lp = clamp01((p - start) / 0.28);
    if (lp > 0 && ch.trim()) {
      const q = clamp01(lp / 0.62), fillA = smooth((lp - 0.4) / 0.6);
      g.fillStyle = o.color || ctx.P.ink; g.strokeStyle = o.color || ctx.P.ink;
      g.save(); g.globalAlpha *= 0.55 + 0.45 * fillA; g.lineWidth = Math.max(1.2, size * 0.014);
      const L = size * 5; g.setLineDash([L * q, L * 2]); g.strokeText(ch, cx, y); g.restore();
      g.globalAlpha *= 1; g.save(); g.globalAlpha *= fillA; g.fillText(ch, cx, y); g.restore();
    }
    cx += adv;
  }
  g.restore();
  return box;
}

/** A wobbly hand-drawn arrow as polyline points: from (x0,y0) to (x1,y1) with a seeded bend. */
export function arrowPts(x0, y0, x1, y1, bend = 0.18) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, nx = -dy, ny = dx;
  const cx = mx + nx * bend, cy = my + ny * bend, pts = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1]); }
  return pts;
}
