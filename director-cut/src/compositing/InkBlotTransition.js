import { clamp01 } from '../animations/easing.js';

function blob(ctx, cx, cy, R, seed) {
  const p = new Path2D(), N = 120;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = R * (1 + 0.13 * Math.sin(3 * a + seed) + 0.09 * Math.sin(5 * a + seed * 2.1) + 0.06 * Math.sin(9 * a + seed * 3.3) + 0.03 * Math.sin(17 * a + seed * 4.7));
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i ? p.lineTo(x, y) : p.moveTo(x, y);
  }
  p.closePath();
  return p;
}
/** Ink blot reveal: the incoming scene is revealed through an organic blot whose edge is a rim of wet ink. p = ink-eased progress. */
export function inkBlotTransition(ctx, g, A, B, p, { cx = ctx.W / 2, cy = ctx.H / 2, seed = 1.3 } = {}) {
  if (p >= 1) { g.drawImage(B.canvas, 0, 0, ctx.W, ctx.H); return; }
  g.drawImage(A.canvas, 0, 0, ctx.W, ctx.H);
  if (p <= 0) return;
  const R = 1560 * p, rim = 54 * (1 - p) + 4;
  g.save();
  g.fillStyle = ctx.P.ink; g.fill(blob(ctx, cx, cy, R + rim, seed));
  // a few ink satellites ahead of the edge
  for (let i = 0; i < 5; i++) { const a = seed * 3 + i * 1.7, d = (R + rim) * (1.04 + 0.04 * Math.sin(i * 3.1)); g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 5 + 9 * (1 - p) * (0.5 + 0.5 * Math.sin(i * 2.3)), 0, 6.2832); g.fill(); }
  g.clip(blob(ctx, cx, cy, R, seed));
  g.drawImage(B.canvas, 0, 0, ctx.W, ctx.H);
  g.restore();
}
