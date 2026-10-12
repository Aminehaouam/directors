// Sequence 3 (9.6-14 s): shot 5 = freeze, nine paper strips peel apart over green code; shot 6 = the four-forces diagram.
import { ParallaxCamera } from '../components/ParallaxCamera.js';
import { drawGround, drawPaper } from '../components/PaperLayer.js';
import { codeColumns } from '../components/CodeColumns.js';
import { inkLine } from '../components/InkStroke.js';
import { drawText } from '../typography/text.js';
import { tornPath, setShadow, clearShadow } from '../components/util.js';
import { maskReveal, wipeRect } from '../components/MaskReveal.js';
import { archivalSlideTransition } from '../compositing/ArchivalSlideTransition.js';
import { hash2 } from '../animations/rng.js';
import { clamp01 } from '../animations/easing.js';

const FREEZE_T = 3.4; // last frame of shot 4 (footage B clip time)
const T5 = 9.6, T6 = 11.8, N = 9;

export function needs(t) { return t < 12.2 ? [{ slot: 'B', time: FREEZE_T }] : []; }

function strip(ctx, g, i, t, stripEv) {
  const { W, H } = ctx, w = W / N, x = i * w;
  let start = stripEv.t0;
  for (let k = 0; k < i; k++) start += 0.010 + hash2(k, 5, 31) * 0.030; // 10-40 ms stagger
  const p = ctx.easeFns.paper(clamp01((t - start) / 0.95)), dir = i % 2 === 0 ? -1 : 1;
  const zoom = 1.04 - 0.08 * ParallaxCamera.move(ctx, t, T5, T6, 0, 1);
  if (p >= 1) return;
  g.save();
  g.translate(x + w / 2 + (i - 4) * 16 * p, H / 2 + dir * p * (H * 0.95 + 70 * i)); g.rotate(dir * p * (0.05 + 0.012 * i)); g.translate(-(x + w / 2), -H / 2);
  const { path } = p > 0 ? tornPath(x, 0, w + (i < N - 1 ? 0.6 : 0), H, 40 + i, 7 * Math.min(1, p * 5), 18) : { path: (() => { const q = new Path2D(); q.rect(x, 0, w + 0.6, H); return q; })() };
  if (p > 0) { setShadow(ctx, g, { dx: 10, dy: 16, blur: 22, color: `rgba(23,24,20,${0.5 * Math.min(1, p * 4)})` }); g.fillStyle = ctx.P.aged; g.fill(path); clearShadow(g); }
  g.save(); g.clip(path);
  g.translate(W / 2, H / 2); g.scale(zoom, zoom); g.translate(-W / 2, -H / 2);
  ctx.fx.draw(g, 'B', FREEZE_T, { x: 0, y: 0, w: W, h: H }, { safe: { x: 96, y: 72, w: 1728, h: 936 } });
  g.restore();
  if (p > 0) { g.strokeStyle = `rgba(244,233,210,${Math.min(1, p * 6) * 0.9})`; g.lineWidth = 3.5; g.lineJoin = 'round'; g.stroke(path); }
  g.restore();
}

function drawShot5(ctx, g, t) {
  const P = ctx.P, { W, H } = ctx, code = ctx.ev('code-behind'), lift = ctx.ev('strips-lift');
  drawGround(ctx, g, 'parchment', 1);
  codeColumns(ctx, g, { rect: [0, 0, W, H], color: P.greenDeep, blend: 'multiply', alpha: 0.78 * code.p, seed: 21, t, colW: 40, size: 27, density: 0.62, speed: 1.1 });
  for (let i = 0; i < N; i++) strip(ctx, g, i, t, lift);
}

function drawDiagram(ctx, g, t) {
  const P = ctx.P, { W, H } = ctx;
  const z = 1 + 0.02 * ParallaxCamera.move(ctx, t, T6, 14.0, 0, 1);
  const cam = new ParallaxCamera(ctx).set(z, 0, 0);
  g.save(); cam.apply(g, 'back'); drawGround(ctx, g, 'parchment', 1.1); g.restore();
  codeColumns(ctx, g, { rect: [0, 0, 400, H], color: P.greenDeep, blend: 'multiply', alpha: 0.36, seed: 33, t, colW: 40, size: 24, density: 0.55, speed: 0.8 });
  codeColumns(ctx, g, { rect: [W - 400, 0, 400, H], color: P.greenDeep, blend: 'multiply', alpha: 0.36, seed: 34, t, colW: 40, size: 24, density: 0.55, speed: 0.8 });
  g.save(); cam.apply(g, 'mid');
  const fig = ctx.ev('fig-draw');
  const fx = 858, fy = 290, fw = 203, fh = 500;
  g.save(); g.fillStyle = 'rgba(23,24,20,0.18)'; g.beginPath(); g.ellipse(960, fy + fh + 6, 120, 14, 0, 0, 6.2832); g.fill(); g.restore();
  maskReveal(g, { rect: wipeRect(fx - 30, fy - 10, fw + 60, fh + 30, fig.p, 'down') }, () => g.drawImage(ctx.img.figure, fx, fy, fw, fh));
  const L = [
    { k: 'routine', label: 'ROUTINE', lx: 960, ly: 164, align: 'center', pts: [[960, 190], [960, 280]] },
    { k: 'reward', label: 'REWARD', lx: 1470, ly: 549, align: 'left', pts: [[1450, 540], [1050, 540]] },
    { k: 'rules', label: 'RULES', lx: 960, ly: 950, align: 'center', pts: [[960, 905], [960, 800]] },
    { k: 'expect', label: 'EXPECTATION', lx: 450, ly: 549, align: 'right', pts: [[470, 540], [870, 540]] },
  ];
  for (const e of L) {
    const lab = ctx.ev(`label-${e.k}`), ln = ctx.ev(`line-${e.k}`);
    drawText(ctx, g, `label-${e.k}`, e.label, e.lx, e.ly + 8 * (1 - lab.p), { role: 'analytical', size: 30, align: e.align, color: P.ink, alpha: lab.p });
    inkLine(ctx, g, e.pts, ln.p, { width: 2.2, color: P.ink, tick: 5 });
  }
  g.restore();
}

export function update(t, ctx) {
  const g = ctx.g, slide = ctx.ev('slide-diagram');
  if (t < slide.t0) drawShot5(ctx, g, t);
  else if (t < slide.t1) {
    const A = ctx.buffer('s3a'), B = ctx.buffer('s3b');
    drawShot5(ctx, A.g, t); drawDiagram(ctx, B.g, t);
    archivalSlideTransition(ctx, g, A, B, slide.p, { dim: 0.2 });
  } else drawDiagram(ctx, g, t);
}
