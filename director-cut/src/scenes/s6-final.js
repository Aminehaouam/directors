// Sequence 6 (26.5-30 s): back to the desk. THE COST is assembled from cut paper letters; the green hairline turns to ink; wordmark; fade to walnut.
import { ParallaxCamera } from '../components/ParallaxCamera.js';
import { drawDesk } from '../components/desk.js';
import { drawVignette } from '../components/Vignette.js';
import { cutoutLetters } from '../components/CutoutLetters.js';
import { inkLine } from '../components/InkStroke.js';
import { drawText } from '../typography/text.js';
import { mixHex } from '../components/util.js';

export function update(t, ctx) {
  const g = ctx.g, P = ctx.P, { W, H } = ctx;
  const cam = new ParallaxCamera(ctx).set(ParallaxCamera.move(ctx, t, 26.5, 30.0, 1.03, 1.0), 0, 0);
  const cost = ctx.ev('cost-letters'), ul = ctx.ev('cost-underline'), toInk = ctx.ev('hairline-to-ink'), wm = ctx.ev('wordmark'), fade = ctx.ev('fade-out');
  drawDesk(ctx, g, cam, { t, dim: 0.74, light: 0.5, flickerAmount: 2.4 });
  drawVignette(ctx, g, 0.78);
  const size = 140, baseY = 580;
  if (cost.p > 0) {
    const r = cutoutLetters(ctx, g, 'cost-letters', 'THE COST', 960, baseY, cost.p, { size });
    // registered box for QA (screen space)
    if (!ctx._noReg && cost.p > 0.02) ctx.textBoxes.push({ id: 'cost-letters', x: r.x, y: baseY - size * 0.68, w: r.w, h: size * 0.68, role: 'display', size, color: P.ivory, alpha: cost.p >= 0.999 ? 1 : cost.p, t, text: 'THE COST', plaque: false });
    // the one green hairline: draws under the phrase, then fades into ink (warm ivory on the dark desk)
    const x0 = r.x - 6, x1 = r.x + r.w + 6, y = baseY + 34;
    inkLine(ctx, g, [[x0, y], [x1, y]], ul.p, { width: 1.6, color: mixHex(P.green, P.ivory, toInk.p) });
  }
  if (wm.p > 0) drawText(ctx, g, 'wordmark', "DIRECTOR’S CUT", 1824, 1000, { role: 'display', size: 40, align: 'right', color: P.brass, alpha: wm.p });
  if (fade.p > 0) { g.save(); g.globalAlpha = fade.p; g.fillStyle = P.walnut; g.fillRect(0, 0, W, H); g.restore(); }
}
