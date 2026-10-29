// Desk surface and two quiet props framing the composition.
'use strict';
const G = require('../geo');
const { makeArt } = require('../art');

const W = 1080, H = 1920, BLEED = 320;

function buildDesk(file, S) {
  const ab = file.artboard('Desk', { width: W, height: H, clip: false });
  const A = makeArt(ab, S); const P = A.P;
  A.flat = true; // the desk is the ground plane
  const root = ab.node('root', null, {});
  const rnd = G.rng(7);

  // Planks run vertically; four boards across the frame.
  const plankW = 270;
  const x0 = -BLEED, x1 = W + BLEED, y0 = -BLEED, y1 = H + BLEED;
  A.piece(root, 'surface', G.rrect(x0, y0, x1 - x0, y1 - y0, 0), 'desk');
  const tones = S.id === 'A' ? ['desk', 'desk', 'deskGrain', 'desk'] : ['desk', 'deskGrain', 'desk', 'deskLight'];
  for (let i = -2; i < 6; i++) {
    const px0 = i * plankW;
    const tone = tones[(i + 8) % 4];
    if (tone !== 'desk') A.piece(root, `plank${i}`, G.rrect(px0, y0, plankW, y1 - y0, 0), tone, { opacity: S.id === 'A' ? 0.55 : 1 });
    // Seams between boards.
    A.piece(root, `seam${i}`, G.rrect(px0 - (S.pixel ? 4 : 2), y0, S.pixel ? 4 : 4, y1 - y0, 0), 'deskSeam', { opacity: S.id === 'B' ? 0.8 : 0.9 });
    if (S.id === 'B') A.piece(root, `seamLight${i}`, G.rrect(px0 + 2, y0, 3, y1 - y0, 0), 'deskLight', { opacity: 0.7 });
  }

  // Grain: long, gently wandering strokes. Sparse on purpose.
  const grainCount = S.pixel ? 22 : 34;
  for (let g = 0; g < grainCount; g++) {
    const plank = Math.floor(rnd() * 6) - 1;
    const gx = plank * plankW + 24 + rnd() * (plankW - 48);
    const gy = y0 + rnd() * (y1 - y0);
    const len = 260 + rnd() * 620;
    const amp = 4 + rnd() * 7, ph = rnd() * 6;
    if (S.pixel) {
      // Pixel grain: short broken dashes along a column, like a hand-placed cluster.
      const segs = 3 + Math.floor(rnd() * 3);
      let yy = gy;
      for (let k = 0; k < segs; k++) {
        const segLen = 24 + Math.floor(rnd() * 6) * 8;
        const xx = Math.round((gx + Math.sin(ph + k) * 4) / 4) * 4;
        A.piece(root, `grain${g}_${k}`, G.rrect(xx, yy, 4, segLen, 0), k % 2 ? 'deskSeam' : 'deskGrain');
        yy += segLen + 16 + Math.floor(rnd() * 4) * 8;
      }
      continue;
    }
    const pts = [];
    for (let k = 0; k <= 10; k++) pts.push([gx + Math.sin(ph + k * 0.7) * amp, gy + (len * k) / 10]);
    A.line(root, `grain${g}`, G.smooth(pts, false), S.id === 'A' ? 'deskLight' : 'deskSeam', S.id === 'A' ? 2 : 1.6, { opacity: S.id === 'A' ? 0.5 : 0.35, cap: 1 });
    if (rnd() < 0.18) { // a knot
      const kx = gx + 10, ky = gy + len * 0.5;
      A.piece(root, `knot${g}`, G.ellipse(kx, ky, 9, 22), null, { stroke: S.id === 'A' ? 'deskLight' : 'deskSeam', strokeW: 1.6, opacity: 0.45 });
    }
  }
  // Soft pool of window light, top-left. Pixel style gets stepped bands instead.
  if (!S.pixel) {
    A.piece(root, 'light', G.rrect(x0, y0, x1 - x0, y1 - y0, 0), {
      radial: [180, 260, 1500], stops: [[0, '#FFF6E0', S.id === 'A' ? 0.16 : 0.22], [0.55, '#FFF6E0', 0.05], [1, '#FFF6E0', 0]],
    });
  }
  return ab;
}

function buildProps(file, S) {
  const ab = file.artboard('Props', { width: W, height: H, clip: false });
  const A = makeArt(ab, S); const P = A.P;
  const fx = ab.node('fx', null, { x: 0, y: 10 }); // fx.y = elevation read by the compositor

  // Coffee cup, top-right, partly out of frame.
  const cup = ab.node('cup', null, { x: 952, y: 214 });
  A.piece(cup, 'saucer', G.circle(0, 0, 158), 'cup');
  A.piece(cup, 'saucerRim', G.ring(0, 0, 124, 132), 'cupShade', { evenOdd: true });
  A.piece(cup, 'cupBody', G.circle(-6, 6, 106), 'cup');
  const hAng = 2.35; // handle towards lower-left
  A.piece(cup, 'handle', G.rotatePath(G.rrect(96, -20, 74, 40, 20), hAng, 0, 0), 'cup');
  A.piece(cup, 'handleHole', G.rotatePath(G.rrect(118, -8, 34, 16, 8), hAng, 0, 0), 'cupShade');
  A.piece(cup, 'rimShade', G.ring(-6, 6, 88, 106), 'cupShade', { evenOdd: true, opacity: 0.55 });
  A.piece(cup, 'coffee', G.circle(-6, 6, 88), 'coffee');
  A.piece(cup, 'crema', G.circle(-6, 6, 74), 'coffeeLight', { opacity: S.pixel ? 1 : 0.55 });
  // Latte heart.
  const heart = 'M-6 -26 C-6 -46 -40 -46 -40 -18 C-40 6 -16 22 -6 36 C4 22 28 6 28 -18 C28 -46 -6 -46 -6 -26 Z';
  A.piece(cup, 'heart', heart, 'cup', { opacity: 0.92 });
  if (!S.pixel) A.piece(cup, 'gloss', 'M-70 -30 C-62 -60 -40 -76 -14 -80 C-40 -66 -56 -50 -62 -24 Z', 'white', { opacity: 0.35 });

  // Pencil, bottom-left, angled into the frame.
  const pen = ab.node('pencil', null, { x: 840, y: 1770, rotation: Math.PI - 0.24 });
  const L = 300, Wd = 34;
  A.piece(pen, 'eraser', G.rrect(-L - 74, -Wd / 2, 44, Wd, [12, 0, 0, 12]), 'eraser');
  A.piece(pen, 'ferrule', G.rrect(-L - 34, -Wd / 2 - 1, 40, Wd + 2, 2), 'metal');
  for (let i = 0; i < 3; i++) A.piece(pen, `ridge${i}`, G.rrect(-L - 28 + i * 12, -Wd / 2 - 1, 4, Wd + 2, 0), 'cupShade', { opacity: 0.8 });
  A.piece(pen, 'body', G.rrect(-L + 6, -Wd / 2, 2 * L - 6, Wd, 0), 'pencil');
  A.piece(pen, 'facetDark', G.rrect(-L + 6, Wd / 6, 2 * L - 6, Wd / 3, 0), 'pencilShade');
  if (!S.pixel) A.piece(pen, 'facetLight', G.rrect(-L + 6, -Wd / 2 + 3, 2 * L - 6, 5, 0), 'white', { opacity: 0.35 });
  A.piece(pen, 'wood', G.poly([[L, -Wd / 2], [L + 74, -5], [L + 74, 5], [L, Wd / 2]]), 'wood');
  A.piece(pen, 'tip', G.poly([[L + 58, -7], [L + 92, 0], [L + 58, 7]]), 'graphite');
  return ab;
}

module.exports = { buildDesk, buildProps };
