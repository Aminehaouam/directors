import { clamp01, lerp } from '../animations/easing.js';
import { setShadow, clearShadow, pattern } from '../components/util.js';

/** The frame leaves as an archival print and the next one arrives: both slide left on aged mats over the dark desk. */
export function archivalSlideTransition(ctx, g, A, B, p, { dim = 0.35 } = {}) {
  const { W, H } = ctx;
  if (p >= 1) { g.drawImage(B.canvas, 0, 0, W, H); return; }
  if (p <= 0) { g.drawImage(A.canvas, 0, 0, W, H); return; }
  g.save(); g.fillStyle = ctx.P.shadow; g.fillRect(0, 0, W, H);
  g.drawImage(ctx.img['wood'], 0, 0, W, H); g.fillStyle = 'rgba(33,24,18,0.6)'; g.fillRect(0, 0, W, H); g.restore();
  const sA = lerp(1, 0.9, clamp01(p * 2.4)), sB = lerp(0.9, 1, clamp01((p - 0.55) * 2.2));
  const gap = W * 1.0;
  const print = (buf, cx, s, shade) => {
    g.save(); g.translate(cx, H / 2); g.scale(s, s);
    const m = 22;
    setShadow(ctx, g, { dx: 14, dy: 20, blur: 36, color: 'rgba(0,0,0,0.5)' });
    g.fillStyle = pattern(ctx, g, 'paper-aged', 0.8, 40, 40); g.fillRect(-W / 2 - m, -H / 2 - m, W + 2 * m, H + 2 * m); clearShadow(g);
    g.drawImage(buf.canvas, -W / 2, -H / 2, W, H);
    if (shade > 0) { g.fillStyle = `rgba(23,24,20,${shade})`; g.fillRect(-W / 2, -H / 2, W, H); }
    g.restore();
  };
  print(B, W / 2 + (1 - p) * gap, sB, 0);
  print(A, W / 2 - p * gap, sA, dim * clamp01(p * 1.6));
}
