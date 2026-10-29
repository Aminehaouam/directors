// The travel journal. Closed at first (only the right half exists), then the
// front cover swings over the spine. Rive is 2D, so the turn is a split
// scaleX hinge: the cover face collapses to the spine, then the inside
// spread unfolds to the left, with light/shade overlays selling the rotation.
'use strict';
const G = require('../geo');
const { makeArt } = require('../art');

const PAGE_W = 466, PAGE_H = 638, COVER_W = 492, COVER_H = 670;
const ORIGIN = { x: 540, y: 700, rotation: -0.052 };

function pageContent(A, parent, side, S) {
  const P = A.P; const px = A.px;
  const sgn = side === 'left' ? -1 : 1;
  const x0 = side === 'left' ? -PAGE_W : 0;
  // Dot grid (A/B) or ruled lines (pixel).
  if (px) {
    for (let i = 0; i < 17; i++) A.piece(parent, `${side}Rule${i}`, G.rrect(x0 + 32, -272 + i * 36, PAGE_W - 64, 4, 0), 'pageShade');
  } else {
    let d = '';
    for (let gx = 0; gx < 15; gx++) for (let gy = 0; gy < 21; gy++) d += G.circle(x0 + 44 + gx * 27.5, -282 + gy * 28, 1.5) + ' ';
    A.piece(parent, `${side}Dots`, d, A.c('inkSoft', S.id === 'B' ? 0.22 : 0.28));
  }
  return { x0, sgn };
}

// Little coastal postcard taped on the left page.
function postcard(A, parent, S) {
  const P = A.P; const px = A.px;
  const card = A.S && parent; // keep linter quiet
  const g = parent;
  A.piece(g, 'pcBorder', G.rrect(-150, -102, 300, 204, px ? 0 : 3), 'white');
  const img = { x: -138, y: -90, w: 276, h: 150 };
  A.piece(g, 'pcSky', G.rrect(img.x, img.y, img.w, img.h, 0), S.id === 'C' ? 'thamesLight' : 'thamesLight');
  A.piece(g, 'pcSun', G.circle(70, -40, 22), 'gilt');
  A.piece(g, 'pcSea', G.rrect(img.x, -12, img.w, 72, 0), 'thames');
  A.piece(g, 'pcGlint', G.rrect(40, -4, 60, 4, 0), 'thamesLight', { opacity: 0.9 });
  A.piece(g, 'pcGlint2', G.rrect(56, 8, 34, 4, 0), 'thamesLight', { opacity: 0.7 });
  A.piece(g, 'pcCliffFar', G.poly([[img.x, -30], [-90, -44], [-40, -30], [-10, -12], [img.x, -12]]), 'stoneShade');
  A.piece(g, 'pcCliff', G.poly([[img.x, -8], [-112, -22], [-70, -16], [-40, 6], [-30, 60], [img.x, 60]]), 'stone');
  A.piece(g, 'pcCliffShade', G.poly([[-70, -16], [-40, 6], [-30, 60], [-58, 60], [-62, 10]]), 'stoneShade');
  A.piece(g, 'pcGrass', G.poly([[img.x, -8], [-112, -22], [-70, -16], [-72, -10], [-112, -15], [img.x, -2]]), 'tree');
  // Lighthouse.
  A.piece(g, 'pcLH', G.poly([[-98, -20], [-94, -64], [-82, -64], [-78, -20]]), 'white');
  A.piece(g, 'pcLHStripe', G.poly([[-96, -44], [-95, -52], [-81, -52], [-80, -44]]), 'accent');
  A.piece(g, 'pcLHTop', G.rrect(-96, -76, 16, 12, px ? 0 : 3), 'navy');
  A.piece(g, 'pcLHLight', G.rrect(-92, -73, 8, 6, 0), 'gilt');
  A.label(g, 'pcCaption', S.id === 'C' ? 'COAST' : 'first light, Dover', S.id === 'C' ? -130 : -132, 90, S.id === 'C' ? 16 : 22, 'ink', { role: 'hand' });
  // Washi tape.
  A.piece(g, 'tape1', G.rotatePath(G.rrect(-182, -118, 76, 26, 0), -0.6, -144, -105), A.c('accentSoft', 0.85));
  A.piece(g, 'tape2', G.rotatePath(G.rrect(106, -118, 76, 26, 0), 0.55, 144, -105), A.c('accentSoft', 0.85));
}

function handLines(A, parent, name, lines, x, y, size, gap, S) {
  lines.forEach((t, i) => {
    if (S.pixel) {
      // Pixel scribbles: word-length dashes read as handwriting at this scale.
      const rnd = G.rng(31 + i * 7 + name.length);
      let cx = x; const cy = y + i * gap - 8;
      const words = t.split(' ');
      words.forEach((w, k) => { const wl = Math.max(8, Math.round((w.length * 9) / 4) * 4); A.piece(parent, `${name}${i}_${k}`, G.rrect(cx, cy, wl, 4, 0), 'ink'); cx += wl + 12; });
      return;
    }
    A.label(parent, `${name}${i}`, t, x, y + i * gap, size, 'ink', { role: 'hand', opacity: 0.88 });
  });
}

function buildJournal(file, S) {
  const ab = file.artboard('Journal', { width: 1080, height: 1920, clip: false });
  const A = makeArt(ab, S); const P = A.P; const px = A.px;
  ab.node('fx', null, { x: 0, y: 9 });
  const root = ab.node('journal', null, ORIGIN);

  // ---- Back board + right page block (static) --------------------------
  A.piece(root, 'backR', G.rrect(-4, -COVER_H / 2, COVER_W + 4, COVER_H, [0, 18, 18, 0]), 'coverDark');
  A.piece(root, 'blockR', G.rrect(0, -PAGE_H / 2 - 2, PAGE_W + 8, PAGE_H + 6, [0, 6, 6, 0]), 'pageEdge');
  for (let i = 1; i <= 3; i++) {
    A.piece(root, `leafR${i}`, G.rrect(PAGE_W + 8 - i * 2.6, -PAGE_H / 2 + 4, px ? 4 : 1.2, PAGE_H - 4, 0), 'pageShade', { opacity: 0.9 });
  }
  const pageR = A.piece(root, 'pageR', G.rrect(0, -PAGE_H / 2, PAGE_W, PAGE_H, [0, 4, 4, 0]), 'page');
  const right = ab.node('rightContent', root, {});
  pageContent(A, right, 'right', S);
  // Gutter shade.
  if (px) {
    A.piece(right, 'gutterR1', G.rrect(0, -PAGE_H / 2, 16, PAGE_H, 0), 'pageEdge');
    A.piece(right, 'gutterR2', G.rrect(16, -PAGE_H / 2, 16, PAGE_H, 0), 'pageShade');
  } else {
    A.piece(right, 'gutterR', G.rrect(0, -PAGE_H / 2, 80, PAGE_H, 0), { linear: [0, 0, 80, 0], stops: [[0, P.pageEdge, 0.95], [0.35, P.pageShade, 0.6], [1, P.pageShade, 0]] });
  }
  // Right page writing.
  if (px) {
    A.label(right, 'title', 'LONDON', 52, -232, 32, 'ink', { role: 'title' });
  } else {
    A.label(right, 'title', 'Day one — London', 52, -222, 46, 'ink', { role: 'hand' });
  }
  handLines(A, right, 'noteR', ['Kept my old ticket tucked', 'between these pages, for luck.', 'Tea, rain, a red bus, and', 'the bells at noon.'], 52, -158, 30, 38, S);
  // Postmark stamp.
  const stamp = ab.node('stamp', right, { x: 318, y: 150, rotation: -0.2, opacity: px ? 1 : 0.62 });
  A.piece(stamp, 'stampRing', G.ring(0, 0, 54, 62), 'accent', { evenOdd: true });
  A.piece(stamp, 'stampRing2', G.ring(0, 0, 44, 47), 'accent', { evenOdd: true });
  A.label(stamp, 'stampText', px ? 'LDN' : 'LONDON', 0, px ? 10 : 7, 16, 'accent', { role: 'label', anchor: 'middle', tracking: px ? 0 : 140 });
  for (let i = 0; i < 3; i++) A.piece(stamp, `cancel${i}`, G.rrect(72, -22 + i * 18, 110, px ? 4 : 5, 2), 'accent');
  // Small sketched compass in the lower-left of the page.
  const sk = ab.node('sketch', right, { x: 130, y: 205 });
  A.piece(sk, 'skRing', G.ring(0, 0, 40, px ? 44 : 42), 'ink', { evenOdd: true, opacity: 0.7 });
  A.piece(sk, 'skStar', G.poly([[0, -54], [9, -9], [54, 0], [9, 9], [0, 54], [-9, 9], [-54, 0], [-9, -9]]), 'ink', { opacity: 0.75 });
  A.piece(sk, 'skStarN', G.poly([[0, -54], [9, -9], [0, 0], [-9, -9]]), 'accent');
  A.label(sk, 'skN', 'N', 0, -62, px ? 16 : 22, 'ink', { role: 'label', anchor: 'middle' });

  // Shadow of the lifting cover falling across the right page.
  const liftShadow = A.piece(root, 'liftShadow', G.rrect(0, -PAGE_H / 2, PAGE_W, PAGE_H, 0), '#000000', { opacity: 0 });

  // Ribbon bookmark (also peeks below the closed book).
  A.piece(root, 'ribbon', G.smooth([[34, -PAGE_H / 2 - 6], [36, -100], [32, 120], [38, 300]], false) + ' L 52 300 L 48 120 L 50 -100 L 48 -325 Z', 'ribbon');
  A.piece(root, 'ribbonTail', G.poly([[38, 296], [52, 296], [54, 368], [45, 352], [36, 370]]), 'ribbon');

  // ---- Left spread: inside of front cover + left pages ------------------
  const left = ab.node('leftSpread', root, { scaleX: 0.001 });
  A.piece(left, 'insideCover', G.rrect(-COVER_W, -COVER_H / 2, COVER_W + 4, COVER_H, [18, 0, 0, 18]), 'coverInside');
  A.piece(left, 'blockL', G.rrect(-PAGE_W - 8, -PAGE_H / 2 - 2, PAGE_W + 8, PAGE_H + 6, [6, 0, 0, 6]), 'pageEdge');
  for (let i = 1; i <= 3; i++) A.piece(left, `leafL${i}`, G.rrect(-PAGE_W - 8 + i * 2.6, -PAGE_H / 2 + 4, px ? 4 : 1.2, PAGE_H - 4, 0), 'pageShade', { opacity: 0.9 });
  A.piece(left, 'pageL', G.rrect(-PAGE_W, -PAGE_H / 2, PAGE_W, PAGE_H, [4, 0, 0, 4]), 'page');
  const lc = ab.node('leftContent', left, {});
  pageContent(A, lc, 'left', S);
  if (px) {
    A.piece(lc, 'gutterL1', G.rrect(-16, -PAGE_H / 2, 16, PAGE_H, 0), 'pageEdge');
    A.piece(lc, 'gutterL2', G.rrect(-32, -PAGE_H / 2, 16, PAGE_H, 0), 'pageShade');
  } else {
    A.piece(lc, 'gutterL', G.rrect(-80, -PAGE_H / 2, 80, PAGE_H, 0), { linear: [0, 0, -80, 0], stops: [[0, P.pageEdge, 0.95], [0.35, P.pageShade, 0.6], [1, P.pageShade, 0]] });
  }
  const pc = ab.node('postcard', lc, { x: -236, y: -118, rotation: 0.06 });
  postcard(A, pc, S);
  handLines(A, lc, 'noteL', ['Packed: map, pencil,', 'and a little courage.'], -410, 64, 30, 40, S);
  // Doodled flight path with a tiny plane.
  if (px) {
    for (let i = 0; i < 7; i++) A.piece(lc, `doodle${i}`, G.rrect(-400 + i * 36, 196 - Math.round(Math.sin(i * 0.6) * 5) * 4, 16, 4, 0), 'ink');
  } else {
    A.line(lc, 'doodle', G.smooth([[-404, 214], [-330, 176], [-250, 206], [-170, 168]], false), 'ink', 2.5, { opacity: 0.6, dash: [10, 9], cap: 1 });
  }
  A.piece(lc, 'plane', G.rotatePath('M-150 160 L-110 170 L-150 180 L-144 170 Z M-140 170 L-132 150 L-126 151 L-128 170 Z M-140 170 L-132 190 L-126 189 L-128 170 Z', -0.35, -140, 170), 'navy');
  const leftShade = A.piece(left, 'leftShade', G.rrect(-COVER_W, -COVER_H / 2, COVER_W + 4, COVER_H, 0), '#000000', { opacity: 0.32 });

  // ---- Front cover ------------------------------------------------------
  const cover = ab.node('coverFront', root, {});
  A.piece(cover, 'coverFace', G.rrect(0, -COVER_H / 2, COVER_W, COVER_H, [0, 18, 18, 0]), 'cover');
  A.piece(cover, 'spine', G.rrect(0, -COVER_H / 2, 22, COVER_H, 0), 'coverDark');
  if (!px) A.piece(cover, 'spineHi', G.rrect(22, -COVER_H / 2, 3, COVER_H, 0), 'coverLight', { opacity: 0.8 });
  A.piece(cover, 'deboss', G.rrect(52, -COVER_H / 2 + 30, COVER_W - 82, COVER_H - 60, px ? 0 : 10), null, { stroke: 'coverDark', strokeW: 3 });
  if (S.id === 'B') A.piece(cover, 'coverPanel', G.rrect(70, -COVER_H / 2 + 48, COVER_W - 118, COVER_H - 96, 8), 'coverLight');
  // Emblem: compass rose in gold.
  const em = ab.node('emblem', cover, { x: 260, y: -70 });
  A.piece(em, 'emRing', G.ring(0, 0, 58, px ? 64 : 62), 'gold', { evenOdd: true });
  A.piece(em, 'emStar', G.poly([[0, -50], [11, -11], [50, 0], [11, 11], [0, 50], [-11, 11], [-50, 0], [-11, -11]]), 'gold');
  A.piece(em, 'emStarShade', G.poly([[0, -50], [11, -11], [0, 0]]), 'coverDark', { opacity: 0.35 });
  A.piece(em, 'emStarShade2', G.poly([[50, 0], [11, 11], [0, 0]]), 'coverDark', { opacity: 0.35 });
  A.piece(em, 'emStarShade3', G.poly([[0, 50], [-11, 11], [0, 0]]), 'coverDark', { opacity: 0.35 });
  A.piece(em, 'emStarShade4', G.poly([[-50, 0], [-11, -11], [0, 0]]), 'coverDark', { opacity: 0.35 });
  A.label(cover, 'coverTitle', 'VOYAGES', 260, 66, px ? 32 : 46, 'gold', { role: 'title', anchor: 'middle', tracking: px ? 60 : 140 });
  A.label(cover, 'coverSub', px ? 'JOURNAL' : 'TRAVEL JOURNAL', 260, px ? 104 : 102, 15, 'gold', { role: 'label', anchor: 'middle', tracking: px ? 0 : 340 });
  A.piece(cover, 'band', G.rrect(424, -COVER_H / 2, 18, COVER_H, 0), 'band');
  if (!px) A.piece(cover, 'bandHi', G.rrect(427, -COVER_H / 2, 3, COVER_H, 0), '#FFFFFF', { opacity: 0.12 });
  const coverShade = A.piece(cover, 'coverShade', G.rrect(0, -COVER_H / 2, COVER_W, COVER_H, [0, 18, 18, 0]), '#000000', { opacity: 0 });

  // ---- Animation ----------------------------------------------------------
  const open = ab.animation('open', { duration: 1.3 });
  const T = 0.6; // cover passes vertical
  open.key(cover, 'scaleX', [[0, 1, 'in'], [T, 0.001, 'hold']]);
  open.key(cover, 'scaleY', [[0, 1, 'outSoft'], [T, 1.035, 'hold']]);
  open.key(cover, 'opacity', [[0, 1, 'hold'], [T, 0, 'hold']]);
  open.key(coverShade, 'opacity', [[0, 0, 'in'], [T, 0.4, 'hold']]);
  open.key(left, 'scaleX', [[0, 0.001, 'hold'], [T, 0.001, 'out'], [1.3, 1]]);
  open.key(left, 'scaleY', [[0, 1.035, 'hold'], [T, 1.035, 'out'], [1.3, 1]]);
  open.key(leftShade, 'opacity', [[0, 0.4, 'hold'], [T, 0.4, 'out'], [1.25, 0]]);
  open.key(liftShadow, 'opacity', [[0, 0, 'outSoft'], [0.35, 0.16, 'inOut'], [0.9, 0]]);

  const sm = ab.stateMachine('JournalSM');
  const go = sm.trigger('open');
  const L = sm.layer('main');
  const sOpen = L.anim(open);
  L.transition(L.entry, sOpen, { trigger: go });
  return ab;
}

module.exports = { buildJournal, ORIGIN, PAGE_W, PAGE_H };
