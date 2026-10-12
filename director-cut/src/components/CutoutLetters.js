import { setShadow, clearShadow, pattern } from './util.js';
import { fontCss, measure, defaultTracking } from '../typography/text.js';
import { rngFor } from '../animations/rng.js';
import { clamp01 } from '../animations/easing.js';

/** Letters cut from paper: ivory fibre fill, aged cut border, shadow. Pieces slide in from seeded offsets and settle (p 0..1). */
export function cutoutLetters(ctx, g, id, str, cx, baseY, p, o = {}) {
  const size = o.size || 140, tr = defaultTracking(ctx, 'display'), r = rngFor(id);
  const total = measure(ctx, 'display', str, size, { tracking: tr }).width - tr * size;
  g.save();
  g.font = fontCss(ctx, 'display', size); g.letterSpacing = `${tr * size}px`; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  let x = cx - total / 2;
  const n = str.length, boxes = [];
  for (let i = 0; i < n; i++) {
    const ch = str[i], adv = g.measureText(str.slice(0, i + 1)).width - g.measureText(str.slice(0, i)).width;
    const jitter = [r() - 0.5, r() - 0.5, r() - 0.5, r() - 0.5];
    const start = (i / n) * 0.55, lp = clamp01((p - start) / 0.45);
    const e = lp; // already paper-eased by the event
    if (ch.trim() && lp > 0) {
      const fromX = (jitter[0] > 0 ? 1 : -1) * (160 + jitter[0] * 260), fromY = -(180 + Math.abs(jitter[1]) * 320);
      const rot = (jitter[2] * 0.06) * (1) + (1 - e) * jitter[3] * 0.5;
      const w = adv - tr * size;
      g.save();
      g.translate(x + w / 2 + fromX * (1 - e), baseY + fromY * (1 - e)); g.rotate(rot); g.translate(-w / 2, 0);
      g.globalAlpha *= clamp01(lp * 5);
      if (!ctx.noText) {
        g.lineWidth = size * 0.07; g.strokeStyle = ctx.P.aged;
        setShadow(ctx, g, { dx: 6 + 6 * e, dy: 9 + 8 * e, blur: 10, color: 'rgba(10,8,6,0.55)' });
        g.strokeText(ch, 0, 0); clearShadow(g);
        g.fillStyle = pattern(ctx, g, 'paper-ivory', 0.8, i * 53, i * 31); g.fillText(ch, 0, 0);
        g.lineWidth = 1.2; g.strokeStyle = 'rgba(23,24,20,0.35)'; g.strokeText(ch, 0, 0);
      }
      g.restore();
      if (e > 0.98) boxes.push([x, w]);
    }
    x += adv;
  }
  g.restore();
  return { x: cx - total / 2, w: total, size, done: p >= 0.999 };
}
