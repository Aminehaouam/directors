// Sequence 2 (3-9.6 s): shot 3 = footage A in a mounted archival frame; shot 4 = footage B untouched, full bleed.
import { ParallaxCamera } from '../components/ParallaxCamera.js';
import { drawDesk } from '../components/desk.js';
import { drawVignette } from '../components/Vignette.js';
import { mountedFrame } from '../components/MountedFrame.js';
import { camS1 } from './s1-archival.js';

const CUT = 6.2;
export function needs(t, ctx) {
  return t < CUT ? [{ slot: 'A', time: Math.max(0, t - 3.0) }] : [{ slot: 'B', time: t - CUT }];
}

export function update(t, ctx) {
  const g = ctx.g, P = ctx.P;
  if (t < CUT) {
    const lt = Math.max(0, t - 3.0), z = ParallaxCamera.move(ctx, t, 3.0, 6.2, 1, 1.03);
    const cam = new ParallaxCamera(ctx).set(z, 0, 0), deskCam = new ParallaxCamera(ctx).set(1.1 + (z - 1) * 0.6, -2 * (lt / 3.2), 0);
    drawDesk(ctx, g, deskCam, { t, dim: 0.62, objects: true, light: 0.25 });
    const fr = ctx.ev('frame-draw'), lab = ctx.ev('label-ordinary');
    g.save(); cam.apply(g, 'mid');
    mountedFrame(ctx, g, {
      x: 288, y: 162, w: 1344, h: 756, mat: [36, 36, 36, 72], border: fr.p, marks: fr.p, seed: 9,
      content: (g, r) => ctx.fx.draw(g, 'A', lt, r, { zoom: 1 }),
      label: 'ORDINARY', labelP: lab.p, labelPos: [324, 892], labelId: 'label-ordinary',
    });
    g.restore();
    drawVignette(ctx, g, 0.55);
  } else {
    const z = ParallaxCamera.move(ctx, t, CUT, 9.6, 1.0, 1.04);
    g.save(); g.translate(960, 540); g.scale(z, z); g.translate(-960, -540);
    ctx.fx.draw(g, 'B', t - CUT, { x: 0, y: 0, w: 1920, h: 1080 }, { safe: { x: 96, y: 72, w: 1728, h: 936 } });
    g.restore();
    g.save(); g.strokeStyle = P.brass; g.globalAlpha = 0.85; g.lineWidth = 2; g.strokeRect(28, 28, 1864, 1024); g.restore();
  }
}
