import { drawPaper } from './PaperLayer.js';
import { setShadow, clearShadow } from './util.js';
import { drawText, measure } from '../typography/text.js';
import { clamp01 } from '../animations/easing.js';

/** An inked word on a paper strip, stamped: scale 0.94 -> 1.02 -> 1.0 over 220 ms with a 4 px shadow thump. p = stamp-eased progress. */
export function stampText(ctx, g, id, str, cx, cy, p, o = {}) {
  if (p <= 0) return null;
  const size = o.size || 150, rot = o.rot ?? -0.03;
  const scale = p < 0.55 ? 0.94 + (1.02 - 0.94) * (p / 0.55) : 1.02 - 0.02 * ((p - 0.55) / 0.45);
  const thump = 4 * (1 - clamp01((p - 0.55) / 0.45) * 0.5) * clamp01(p * 3);
  const m = measure(ctx, 'display', str, size, {});
  const w = m.width + 110, h = size * 1.12;
  g.save();
  g.translate(cx, cy); g.rotate(rot); g.scale(scale, scale);
  g.globalAlpha *= clamp01(p * 6);
  drawPaper(ctx, g, { x: -w / 2, y: -h / 2, w, h, tex: 'ivory', rough: 3, seed: o.seed || 7, shadow: true, dx: thump, dy: thump, blur: 6, shadowAlpha: 0.5 });
  if (!ctx.noText) {
    g.strokeStyle = ctx.P.ink; g.lineWidth = 2.2; g.globalAlpha *= 0.9;
    g.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24); g.lineWidth = 1; g.strokeRect(-w / 2 + 19, -h / 2 + 19, w - 38, h - 38);
  }
  const box = drawText(ctx, g, id, str, 0, size * 0.32, { role: 'display', size, align: 'center', color: ctx.P.ink, alpha: 0.96, plaque: true });
  g.restore();
  return box;
}
