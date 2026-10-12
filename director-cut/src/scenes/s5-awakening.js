// Sequence 5 (22.7-26.5 s): three paper layers with an eye-shaped tear open onto a silhouette and green code; they separate on "truth".
import { ParallaxCamera } from '../components/ParallaxCamera.js';
import { drawGround } from '../components/PaperLayer.js';
import { codeColumns } from '../components/CodeColumns.js';
import { mountedFrame } from '../components/MountedFrame.js';
import { setShadow, clearShadow, tornPath, pattern } from '../components/util.js';
import { maskReveal } from '../components/MaskReveal.js';
import { drawVignette } from '../components/Vignette.js';
import { hash2, noise1 } from '../animations/rng.js';
import { clamp01, smooth } from '../animations/easing.js';

const T0 = 22.7, T1 = 26.5;
export const needs = (t) => (t >= 23.9 && t <= 25.4 ? [{ slot: 'D', time: Math.max(0, t - 24.0) }] : []);

/** An almond (eye) shaped tear: jagged seeded edge, half-width a, half-height b. */
function almond(cx, cy, a, b, seed) {
  const path = new Path2D(), N = 56, pts = [];
  for (let i = 0; i <= N; i++) { const u = -1 + (2 * i) / N; pts.push([cx + u * a, cy - b * Math.pow(Math.max(0, 1 - u * u), 0.85) + (noise1(i * 0.7, seed) - 0.5) * 16 + (hash2(i, seed, 2) - 0.5) * 6]); }
  for (let i = N; i >= 0; i--) { const u = -1 + (2 * i) / N; pts.push([cx + u * a, cy + b * Math.pow(Math.max(0, 1 - u * u), 0.85) + (noise1(i * 0.7, seed + 8) - 0.5) * 16 + (hash2(i, seed, 3) - 0.5) * 6]); }
  pts.forEach((q, i) => (i ? path.lineTo(q[0], q[1]) : path.moveTo(q[0], q[1])));
  path.closePath();
  return { path, pts };
}

const LAYERS = [
  { tex: 'parchment', a: 560, b: 270, seed: 3, rot: -0.025, off: [-120, -80], z: 'front' },
  { tex: 'ivory', a: 470, b: 226, seed: 5, rot: 0.03, off: [140, 40], z: 'front' },
  { tex: 'aged', a: 390, b: 188, seed: 7, rot: -0.015, off: [-30, 110], z: 'front' },
];

export function update(t, ctx) {
  const g = ctx.g, P = ctx.P, { W, H } = ctx;
  const cam = new ParallaxCamera(ctx).set(ParallaxCamera.move(ctx, t, T0, T1, 1.06, 1.0), 0, 0);
  const open = ctx.ev('tear-open').p, sep = ctx.ev('layers-separate').p, fd = ctx.ev('frame-d');

  g.save(); cam.apply(g, 'back'); drawGround(ctx, g, 'wood', 1.5); g.fillStyle = 'rgba(33,24,18,0.55)'; g.fillRect(-400, -300, W + 800, H + 600); g.restore();

  // mid: the dark sheet with code, silhouette and the hidden eye
  g.save(); cam.apply(g, 'mid');
  const pw = 1620, ph = 940, { path: panel } = tornPath(960 - pw / 2, 540 - ph / 2, pw, ph, 77, 7, 18);
  setShadow(ctx, g, { dx: 10, dy: 16, blur: 30, color: 'rgba(0,0,0,0.55)' });
  g.fillStyle = P.shadow; g.fill(panel); clearShadow(g);
  g.save(); g.clip(panel);
  const glow = 0.22 + 0.5 * open * (0.45 + 0.55 * sep), gl = g.createRadialGradient(960, 520, 20, 960, 520, 760); gl.addColorStop(0, `rgba(120,200,138,${glow})`); gl.addColorStop(0.6, `rgba(120,200,138,${glow * 0.55})`); gl.addColorStop(1, 'rgba(120,200,138,0)');
  g.fillStyle = gl; g.fillRect(0, 0, W, H);
  codeColumns(ctx, g, { rect: [160, 70, pw - 20, ph - 20], color: P.green, blend: 'screen', alpha: 1, seed: 55, t, colW: 36, size: 36, density: 1, speed: 1.5 });
  g.drawImage(ctx.img.silhouette, 735, 262, 450, 600);
  maskReveal(g, { rect: [0, 0, W, H] }, () => {
    const e = smooth((open - 0.55) / 0.45);
    g.globalAlpha = e; g.drawImage(ctx.img.eye, 836, 372, 248, 136);
  });
  g.restore();
  g.restore();

  // front: three paper layers, each with an eye-shaped tear, separating on "truth"
  for (let k = LAYERS.length - 1; k >= 0; k--) {
    const L = LAYERS[k], s = sep, ax = L.a * open, bx = L.b * open;
    g.save(); cam.apply(g, L.z);
    g.translate(960 + L.off[0] * s, 540 + L.off[1] * s); g.rotate(L.rot * s); g.translate(-960, -540);
    const sheet = tornPath(960 - 1180, 540 - 700, 2360, 1400, L.seed, 8, 22).path;
    const full = new Path2D(); full.addPath(sheet);
    if (open > 0.02) full.addPath(almond(960, 540, Math.max(8, ax), Math.max(4, bx), L.seed).path);
    setShadow(ctx, g, { dx: 12 + 10 * s, dy: 18 + 12 * s, blur: 30, color: 'rgba(0,0,0,0.5)' });
    g.fillStyle = '#C9AD7C'; g.fill(full, 'evenodd'); clearShadow(g);
    const im = ctx.img[L.tex === 'ivory' ? 'paper-ivory' : L.tex === 'aged' ? 'paper-aged' : 'parchment'];
    g.fillStyle = pattern(ctx, g, L.tex === 'ivory' ? 'paper-ivory' : L.tex === 'aged' ? 'paper-aged' : 'parchment', L.tex === 'parchment' ? 0.5 : 0.8, 960 - 1180, 540 - 700);
    g.fill(full, 'evenodd');
    if (open > 0.02) { // fibrous torn rim
      const hole = almond(960, 540, Math.max(8, ax), Math.max(4, bx), L.seed).path;
      g.strokeStyle = 'rgba(244,233,210,0.95)'; g.lineWidth = 9; g.lineJoin = 'round'; g.stroke(hole);
      g.strokeStyle = 'rgba(120,90,52,0.5)'; g.lineWidth = 2; g.stroke(hole);
    }
    if (k === 0 && open < 1) { // a trace of the cage's ghost grid on the top sheet fades as the tear opens
      g.save(); g.globalAlpha = 0.2 * (1 - open); g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath();
      for (let x = 12; x < 1920; x += 24) { g.moveTo(x, 0); g.lineTo(x, 1080); } g.stroke(); g.restore();
    }
    g.restore();
  }

  // optional footage D in a small mounted frame, visible for ~1.2 s
  const vis = smooth(fd.raw / 0.2) * (1 - smooth((fd.raw - 0.82) / 0.18));
  if (vis > 0.01) {
    g.save(); cam.apply(g, 'front'); g.globalAlpha = vis;
    mountedFrame(ctx, g, { x: 1330, y: 690, w: 400, h: 246, mat: [14, 14, 14, 30], border: 1, marks: 1, rot: 0.03, seed: 31, content: (g, r) => ctx.fx.draw(g, 'D', Math.max(0, t - 24.0), r, { safe: { x: 0, y: 0, w: 9999, h: 9999 } }) });
    g.restore();
  }
  drawVignette(ctx, g, 0.5);
}
