import { mulberry32, hash2 } from '../animations/rng.js';

export function buildGrain(ctx) {
  const n = 512, c = document.createElement('canvas'); c.width = c.height = n;
  const a = c.getContext('2d'), im = a.createImageData(n, n), r = mulberry32(0x6A41);
  for (let i = 0; i < n * n; i++) { const v = 128 + (r() + r() + r() - 1.5) * 150; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
  a.putImageData(im, 0, 0);
  ctx.grainTile = c;
}
/** Film grain over everything: overlay-blended seeded noise whose offset is a pure function of the frame index. */
export function drawGrain(ctx, g, amount = ctx.cfg.motion.grain) {
  const f = ctx.frame, ox = Math.floor(hash2(f, 1, 77) * 512), oy = Math.floor(hash2(f, 2, 77) * 512);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'overlay'; g.globalAlpha = Math.min(1, amount * 4.2);
  if (!ctx._grainPat) ctx._grainPat = g.createPattern(ctx.grainTile, 'repeat');
  ctx._grainPat.setTransform(new DOMMatrix().translate(-ox, -oy));
  g.fillStyle = ctx._grainPat; g.fillRect(0, 0, ctx.W * ctx.S, ctx.H * ctx.S);
  g.restore();
}
