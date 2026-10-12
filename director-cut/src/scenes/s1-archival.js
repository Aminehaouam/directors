// Sequence 1 (0-3 s): the archival desk. Title inks on at ~1.8 s; faint code surfaces under the paper.
import { ParallaxCamera } from '../components/ParallaxCamera.js';
import { drawDesk } from '../components/desk.js';
import { drawVignette } from '../components/Vignette.js';
import { codeColumns } from '../components/CodeColumns.js';
import { inkText, inkLine } from '../components/InkStroke.js';
import { measure } from '../typography/text.js';

export const camS1 = (ctx, t) => new ParallaxCamera(ctx).set(ParallaxCamera.move(ctx, t, 0, 3.0, 1, 1.1), 0, 0);

export function update(t, ctx) {
  const g = ctx.g, P = ctx.P, cam = camS1(ctx, t);
  const title = ctx.ev('title-ink'), code = ctx.ev('code-surface');
  drawDesk(ctx, g, cam, {
    t,
    onSheet: (g, r) => {
      if (code.p > 0) codeColumns(ctx, g, { rect: [60, 60, r.w - 120, r.h - 120], color: P.greenDeep, blend: 'multiply', alpha: 0.5 * code.p, seed: 11, t, colW: 38, size: 22, density: 0.5, speed: 0.7 });
      const size = 112, mid = r.h / 2 + 22;
      const w = measure(ctx, 'display', "DIRECTOR’S CUT", size).width;
      const rx = Math.min(w / 2 + 40, r.w / 2 - 60);
      inkLine(ctx, g, [[r.w / 2 - rx, mid - 112], [r.w / 2 + rx, mid - 112]], code.p, { width: 1.4, color: P.brass });
      inkLine(ctx, g, [[r.w / 2 - rx, mid + 50], [r.w / 2 + rx, mid + 50]], code.p, { width: 1.4, color: P.brass });
      inkText(ctx, g, 'title', "DIRECTOR’S CUT", r.w / 2, mid, title.p, { role: 'display', size, align: 'center', color: P.ink });
    },
  });
  drawVignette(ctx, g, 0.74);
}
