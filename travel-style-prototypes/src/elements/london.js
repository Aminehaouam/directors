// Miniature London standing on the expanded ticket. Three artboards = three
// depth planes (so the compositor can light and shadow them separately):
//   LondonBack  - St Paul's, the Shard, a receding skyline
//   BigBen      - Elizabeth Tower + Palace of Westminster (the hero)
//   LondonFront - Tower Bridge, the London Eye, townhouses, trees, a bus
// Every building is a pop-up hinged at its base (scaleY 0 -> 1).
'use strict';
const G = require('../geo');
const { makeArt } = require('../art');

const BACK_BASE = 1236, BEN = { x: 330, y: 1252 }, RIVER_BASE = 1318, FRONT_BASE = 1388;

function popupSM(ab, groups, { stagger = 0.07, dur = 0.55, order } = {}) {
  const popup = ab.animation('popup', { duration: stagger * groups.length + dur + 0.1 });
  const fold = ab.animation('fold', { duration: 0.36 + 0.025 * groups.length });
  (order || groups).forEach((g, i) => {
    const t0 = i * stagger;
    popup.key(g, 'scaleY', [[0, 0.001, 'hold'], [t0, 0.001, 'out'], [t0 + dur * 0.62, 1.08, 'inOut'], [t0 + dur * 0.82, 0.97, 'inOut'], [t0 + dur, 1]]);
    popup.key(g, 'scaleX', [[0, 0.94, 'hold'], [t0, 0.94, 'outSoft'], [t0 + dur, 1]]);
    // Collapsed strokes keep their width, so hidden pop-ups are also transparent.
    popup.key(g, 'opacity', [[0, 0, 'hold'], [t0, 1, 'hold']]);
    const f0 = (groups.length - 1 - i) * 0.025;
    fold.key(g, 'scaleY', [[0, 1, 'hold'], [f0, 1, 'outSoft'], [f0 + 0.08, 1.04, 'in'], [f0 + 0.34, 0.001]]);
    fold.key(g, 'opacity', [[0, 1, 'hold'], [f0 + 0.34, 0, 'hold']]);
  });
  const sm = ab.stateMachine(ab.name + 'SM');
  const tp = sm.trigger('popup'), tf = sm.trigger('fold');
  const L = sm.layer('main');
  const sp = L.anim(popup), sf = L.anim(fold);
  L.transition(L.entry, sp, { trigger: tp });
  L.transition(sp, sf, { trigger: tf });
  return { sm, popup, fold };
}

// A simple block with lit face, shaded right face and window rows.
function block(A, parent, name, x, w, h, o = {}) {
  const P = A.P;
  A.piece(parent, name, G.rrect(x, -h, w, h, 0), o.fill || 'back2');
  if (o.shade !== false) A.piece(parent, name + 'S', G.rrect(x + w * 0.7, -h, w * 0.3, h, 0), o.shadeFill || 'back1Shade');
  if (o.windows) {
    let d = '';
    const ww = A.px ? 4 : 5, wh = A.px ? 8 : 7;
    for (let y = -h + 10; y < -12; y += 14) for (let wx = x + 7; wx < x + w * 0.68 - ww; wx += 11) d += G.rrect(wx, y, ww, wh, 0) + ' ';
    if (d) A.piece(parent, name + 'W', d, o.windows, { opacity: o.winOpacity ?? 0.9 });
  }
}

function buildBack(file, S) {
  const ab = file.artboard('LondonBack', { width: 1080, height: 1920, clip: false });
  const A = makeArt(ab, S);
  ab.node('fx', null, { x: 0, y: 9 });
  const groups = [];
  const g = (name, x) => { const n = ab.node(name, null, { x, y: BACK_BASE, scaleY: 0.001, opacity: 0 }); groups.push(n); return n; };

  // Receding skyline fill.
  const sky = g('skyline', 0);
  [[176, 46, 58], [222, 40, 44], [392, 54, 62], [448, 42, 50], [606, 40, 74], [770, 52, 56], [826, 44, 86], [872, 52, 52]].forEach(([x, w, h], i) => block(A, sky, `blk${i}`, x, w, h, { windows: 'backWin', winOpacity: 0.7 }));

  // St Paul's Cathedral.
  const sp = g('stPauls', 540);
  A.piece(sp, 'spBase', G.rrect(-74, -44, 148, 44, 0), 'back1');
  A.piece(sp, 'spBaseS', G.rrect(30, -44, 44, 44, 0), 'back1Shade');
  A.piece(sp, 'spPortico', G.poly([[-30, -44], [0, -62], [30, -44]]), 'back1');
  let cols = ''; for (let i = -3; i <= 3; i++) cols += G.rrect(i * 9 - 1.5, -40, A.px ? 4 : 3, 34, 0) + ' ';
  A.piece(sp, 'spCols', cols, 'back1Shade');
  A.piece(sp, 'spTowerL', G.rrect(-70, -86, 22, 42, 0), 'back1');
  A.piece(sp, 'spTowerR', G.rrect(48, -86, 22, 42, 0), 'back1Shade');
  A.piece(sp, 'spTowerLc', G.poly([[-70, -86], [-59, -100], [-48, -86]]), 'back1');
  A.piece(sp, 'spTowerRc', G.poly([[48, -86], [59, -100], [70, -86]]), 'back1Shade');
  A.piece(sp, 'spDrum', G.rrect(-36, -98, 72, 36, 0), 'back1');
  let drumCols = ''; for (let i = -3; i <= 3; i++) drumCols += G.rrect(i * 10 - 1.5, -94, A.px ? 4 : 3, 28, 0) + ' ';
  A.piece(sp, 'spDrumCols', drumCols, 'back1Shade');
  A.piece(sp, 'spDome', 'M-38 -98 C-38 -126 -20 -144 0 -144 C20 -144 38 -126 38 -98 Z', 'back1');
  A.piece(sp, 'spDomeS', 'M8 -143 C26 -138 38 -122 38 -98 L14 -98 C16 -116 14 -132 8 -143 Z', 'back1Shade');
  if (!A.px) for (let i = -2; i <= 2; i++) A.line(sp, `spRib${i}`, `M${i * 13} -98 C${i * 12} -116 ${i * 7} -134 0 -144`, 'back1Shade', 1.2, { opacity: 0.8 });
  A.piece(sp, 'spLantern', G.rrect(-6, -164, 12, 22, 0), 'back1');
  A.piece(sp, 'spLanternTop', G.circle(0, -167, 5), 'back1');
  A.piece(sp, 'spCross', G.rrect(-1.5, -184, 3, 16, 0), 'back1Shade');

  // The Shard.
  const sh = g('shard', 702);
  A.piece(sh, 'shBody', G.poly([[-46, 0], [-5, -322], [0, -338], [4, -318], [12, -332], [46, 0]]), 'back1');
  A.piece(sh, 'shFacet', G.poly([[4, -318], [12, -332], [46, 0], [10, 0]]), 'back1Shade');
  if (!A.px) for (let i = 1; i < 9; i++) { const y = -i * 34; const hw = 46 * (1 - (i * 34) / 330); A.line(sh, `shLine${i}`, `M${-hw + 4} ${y} L${hw * 0.15} ${y - 3}`, 'backWin', 1.3, { opacity: 0.7 }); }
  else for (let i = 1; i < 8; i++) { const y = -i * 36; const hw = 46 * (1 - (i * 36) / 330); A.piece(sh, `shLine${i}`, G.rrect(-hw + 8, y, Math.max(4, hw * 0.8), 4, 0), 'backWin'); }

  popupSM(ab, groups, { stagger: 0.08, order: [sky, sp, sh] });
  return ab;
}

function buildBigBen(file, S) {
  const ab = file.artboard('BigBen', { width: 1080, height: 1920, clip: false });
  const A = makeArt(ab, S); const px = A.px;
  const fx = ab.node('fx', null, { x: 0, y: 14 });

  // Palace of Westminster, behind and to the right of the tower.
  const pal = ab.node('parliament', null, { x: 0, y: BEN.y + 10, scaleY: 0.001, opacity: 0 });
  A.piece(pal, 'palBody', G.rrect(352, -66, 156, 66, 0), 'stoneShade');
  let pin = ''; for (let x = 356; x <= 504; x += 16) pin += G.poly([[x - 3, -66], [x, -84], [x + 3, -66]]) + ' ';
  A.piece(pal, 'palPinnacles', pin, 'stoneShade');
  let slits = ''; for (let x = 362; x < 504; x += 10) slits += G.rrect(x, -54, px ? 4 : 4, 30, 0) + ' ';
  A.piece(pal, 'palWin', slits, 'stoneDark', { opacity: 0.6 });
  A.piece(pal, 'palLobby', G.rrect(430, -104, 22, 40, 0), 'stoneShade');
  A.piece(pal, 'palLobbySpire', G.poly([[428, -104], [441, -138], [454, -104]]), 'slate');
  A.piece(pal, 'palRoof', G.rrect(350, -70, 160, 6, 0), 'slate');

  // Elizabeth Tower.
  const ben = ab.node('ben', null, { x: BEN.x, y: BEN.y, scaleY: 0.001, opacity: 0 });
  A.piece(ben, 'plinth', G.rrect(-42, -16, 84, 16, 0), 'stoneDark');
  // Shaft with string courses and gothic lancets.
  A.piece(ben, 'shaft', G.rrect(-32, -332, 64, 316, 0), 'stone');
  A.piece(ben, 'shaftShade', G.rrect(14, -332, 18, 316, 0), 'stoneShade');
  let lancets = '', lancetsS = '', courses = '';
  for (let y = -16; y > -320; y -= 52) {
    courses += G.rrect(-34, y - 4, 68, 4, 0) + ' ';
    for (const lx of [-22, -6, 10]) {
      const d = G.poly([[lx, y - 8], [lx, y - 38], [lx + 4, y - 44], [lx + 8, y - 38], [lx + 8, y - 8]]);
      if (lx > 8) lancetsS += d + ' '; else lancets += d + ' ';
    }
  }
  A.piece(ben, 'courses', courses, 'stoneDark', { opacity: 0.55 });
  A.piece(ben, 'lancets', lancets, 'stoneShade');
  A.piece(ben, 'lancetsS', lancetsS, 'stoneDark', { opacity: 0.8 });
  if (!px) A.piece(ben, 'shaftLight', G.rrect(-32, -332, 4, 316, 0), 'stoneLight', { opacity: 0.8 });
  // Clock stage.
  A.piece(ben, 'clockStage', G.rrect(-41, -424, 82, 92, 0), 'stone');
  A.piece(ben, 'clockStageS', G.rrect(19, -424, 22, 92, 0), 'stoneShade');
  A.piece(ben, 'clockLedge', G.rrect(-44, -336, 88, 6, 0), 'stoneLight');
  A.piece(ben, 'clockSurround', G.rrect(-35, -413, 70, 70, px ? 0 : 3), 'gilt');
  const clockY = -378;
  A.piece(ben, 'clockFace', G.circle(0, clockY, 30), 'clock');
  A.piece(ben, 'clockRing', G.ring(0, clockY, 26.5, 30), 'slate', { evenOdd: true });
  let ticks = '';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ticks += G.rotatePath(G.rrect(-1.6, clockY - 25, 3.2, i % 3 ? 4 : 7, 0), a, 0, clockY) + ' '; }
  if (!px) A.piece(ben, 'clockTicks', ticks, 'slate');
  A.piece(ben, 'hourHand', G.rotatePath(G.rrect(-2, clockY - 15, 4, 17, 2), -Math.PI / 3, 0, clockY), 'slate');
  A.piece(ben, 'minuteHand', G.rotatePath(G.rrect(-1.5, clockY - 23, 3, 25, 1.5), Math.PI / 3, 0, clockY), 'slate');
  A.piece(ben, 'clockHub', G.circle(0, clockY, 3), 'gilt');
  const glint = A.piece(ben, 'clockGlint', G.circle(-9, clockY - 10, 10), 'white', { opacity: 0 });
  // Corner turrets of the clock stage.
  for (const sx of [-1, 1]) A.piece(ben, `turret${sx}`, G.poly([[sx * 41 - 5, -424], [sx * 41, -446], [sx * 41 + 5, -424]]), sx > 0 ? 'stoneShade' : 'stone');
  // Belfry.
  A.piece(ben, 'belfry', G.rrect(-36, -470, 72, 46, 0), 'stone');
  A.piece(ben, 'belfryS', G.rrect(16, -470, 20, 46, 0), 'stoneShade');
  let arches = '';
  for (const ax of [-26, -7, 12]) arches += G.poly([[ax, -430], [ax, -456], [ax + 7, -464], [ax + 14, -456], [ax + 14, -430]]) + ' ';
  A.piece(ben, 'arches', arches, 'slate');
  A.piece(ben, 'cornice', G.rrect(-40, -476, 80, 6, 0), 'stoneLight');
  // Spire.
  A.piece(ben, 'spire', G.poly([[-38, -476], [0, -590], [38, -476]]), 'slateLight');
  A.piece(ben, 'spireS', G.poly([[0, -590], [38, -476], [0, -476]]), 'slate');
  let bands = '';
  for (const f of [0.18, 0.42, 0.66]) { const y = -476 - 114 * f; const hw = 38 * (1 - f); bands += G.rrect(-hw, y - 2, hw * 2, px ? 4 : 3, 0) + ' '; }
  A.piece(ben, 'spireBands', bands, 'gilt');
  for (const sx of [-1, 1]) A.piece(ben, `pinnacle${sx}`, G.poly([[sx * 36 - 4, -476], [sx * 36, -528], [sx * 36 + 4, -476]]), sx > 0 ? 'stoneShade' : 'stone');
  A.piece(ben, 'dormers', G.rrect(-14, -510, 6, 8, 0) + ' ' + G.rrect(8, -510, 6, 8, 0), 'gilt');
  A.piece(ben, 'finial', G.rrect(-2, -614, 4, 26, 0), 'gilt');
  A.piece(ben, 'orb', G.circle(0, -594, 4.5), 'gilt');

  const rise = ab.animation('rise', { duration: 1.4 });
  rise.key(pal, 'scaleY', [[0, 0.001, 'out'], [0.45, 1.06, 'inOut'], [0.65, 1]]);
  rise.key(ben, 'scaleY', [[0, 0.001, 'hold'], [0.12, 0.001, 'out'], [0.78, 1.07, 'inOut'], [1.0, 0.985, 'inOut'], [1.2, 1]]);
  rise.key(ben, 'scaleX', [[0, 0.86, 'hold'], [0.12, 0.86, 'outSoft'], [0.9, 1]]);
  rise.key(pal, 'opacity', [[0, 1, 'hold']]);
  rise.key(ben, 'opacity', [[0, 0, 'hold'], [0.12, 1, 'hold']]);
  rise.key(glint, 'opacity', [[0, 0, 'hold'], [0.95, 0, 'outSoft'], [1.1, 0.75, 'inOut'], [1.4, 0]]);
  rise.key(fx, 'y', [[0, 6, 'outSoft'], [0.8, 18, 'inOut'], [1.3, 14]]);
  const fold = ab.animation('fold', { duration: 0.42 });
  fold.key(ben, 'scaleY', [[0, 1, 'outSoft'], [0.08, 1.04, 'in'], [0.38, 0.001]]);
  fold.key(pal, 'scaleY', [[0, 1, 'hold'], [0.06, 1, 'in'], [0.34, 0.001]]);
  fold.key(fx, 'y', [[0, 14, 'in'], [0.4, 6]]);
  fold.key(ben, 'opacity', [[0, 1, 'hold'], [0.38, 0, 'hold']]);
  fold.key(pal, 'opacity', [[0, 1, 'hold'], [0.34, 0, 'hold']]);
  const sm = ab.stateMachine('BigBenSM');
  const tr = sm.trigger('rise'), tf = sm.trigger('fold');
  const L = sm.layer('main');
  const sr = L.anim(rise), sf = L.anim(fold);
  L.transition(L.entry, sr, { trigger: tr });
  L.transition(sr, sf, { trigger: tf });
  return ab;
}

function buildFront(file, S) {
  const ab = file.artboard('LondonFront', { width: 1080, height: 1920, clip: false });
  const A = makeArt(ab, S); const px = A.px;
  ab.node('fx', null, { x: 0, y: 12 });
  const groups = [];
  const g = (name, x, y) => { const n = ab.node(name, null, { x, y, scaleY: 0.001, opacity: 0 }); groups.push(n); return n; };

  // Tower Bridge, standing in the river.
  const tb = g('towerBridge', 600, RIVER_BASE);
  A.line(tb, 'tbChainL', 'M-152 -22 C-120 -40 -90 -64 -58 -96', 'steelLight', px ? 4 : 4, { cap: 1 });
  A.line(tb, 'tbChainR', 'M152 -22 C120 -40 90 -64 58 -96', 'steelLight', px ? 4 : 4, { cap: 1 });
  A.piece(tb, 'tbDeck', G.rrect(-74, -44, 148, 9, 0), 'steel');
  A.piece(tb, 'tbWalk1', G.rrect(-44, -116, 88, 6, 0), 'steel');
  A.piece(tb, 'tbWalk2', G.rrect(-44, -104, 88, 4, 0), 'steelLight');
  for (const sx of [-1, 1]) {
    const tx = sx * 58;
    A.piece(tb, `tbPier${sx}`, G.rrect(tx - 22, -10, 44, 10, 0), 'stoneDark');
    A.piece(tb, `tbTower${sx}`, G.rrect(tx - 17, -134, 34, 124, 0), 'stone');
    A.piece(tb, `tbTowerS${sx}`, G.rrect(tx + 6, -134, 11, 124, 0), 'stoneShade');
    A.piece(tb, `tbArch${sx}`, G.poly([[tx - 9, -10], [tx - 9, -40], [tx, -50], [tx + 9, -40], [tx + 9, -10]]), 'slate');
    A.piece(tb, `tbWin${sx}`, G.rrect(tx - 5, -96, px ? 4 : 4, 18, 0) + ' ' + G.rrect(tx + 2, -96, px ? 4 : 4, 18, 0), 'slate');
    A.piece(tb, `tbRoof${sx}`, G.poly([[tx - 19, -134], [tx, -162], [tx + 19, -134]]), 'slateLight');
    A.piece(tb, `tbRoofS${sx}`, G.poly([[tx, -162], [tx + 19, -134], [tx, -134]]), 'slate');
    for (const cx of [-17, 17]) A.piece(tb, `tbPin${sx}${cx}`, G.poly([[tx + cx - 3, -134], [tx + cx, -150], [tx + cx + 3, -134]]), 'stoneShade');
  }

  // Townhouses on the south bank.
  const th = g('townhouses', 0, FRONT_BASE);
  const houses = [[148, 42, 86, 'brick'], [190, 40, 100, 'white'], [230, 42, 80, 'brick'], [272, 44, 94, 'brickShade']];
  houses.forEach(([x, w, h, col], i) => {
    A.piece(th, `house${i}`, G.rrect(x, -h, w, h, 0), col);
    A.piece(th, `houseRoof${i}`, G.rrect(x - 2, -h - 6, w + 4, 8, 0), 'roof');
    A.piece(th, `chim${i}`, G.rrect(x + w - 14, -h - 18, 9, 14, 0), col === 'white' ? 'brick' : col);
    let win = '';
    for (let y = -h + 12; y < -24; y += 22) for (const wx of [x + 7, x + w - 17]) win += G.rrect(wx, y, px ? 8 : 10, 14, 0) + ' ';
    A.piece(th, `houseWin${i}`, win, col === 'white' ? 'steel' : 'window');
    A.piece(th, `door${i}`, G.rrect(x + w / 2 - 5, -22, 10, 22, [5, 5, 0, 0]), 'navy');
  });

  // Trees.
  const trees = g('trees', 0, FRONT_BASE);
  for (const [x, r] of [[346, 24], [722, 20]]) {
    A.piece(trees, `trunk${x}`, G.rrect(x - 3, -18, 6, 18, 0), 'stoneDark');
    A.piece(trees, `canopy${x}`, G.circle(x, -18 - r, r), 'tree');
    A.piece(trees, `canopyS${x}`, `M${x + r * 0.15} ${-18 - r * 1.98} C${x + r * 0.9} ${-18 - r * 1.8} ${x + r} ${-18 - r * 1.2} ${x + r} ${-18 - r} C${x + r} ${-18 - r * 0.4} ${x + r * 0.5} ${-18} ${x} ${-18} C${x + r * 0.5} ${-18 - r * 0.6} ${x + r * 0.55} ${-18 - r * 1.5} ${x + r * 0.15} ${-18 - r * 1.98} Z`, 'treeDark');
  }

  // Red double-decker bus.
  const bus = g('bus', 432, FRONT_BASE);
  A.piece(bus, 'busBody', G.rrect(-46, -56, 92, 50, px ? 4 : 9), 'bus');
  A.piece(bus, 'busBand', G.rrect(-46, -30, 92, 6, 0), 'busShade');
  let bw = ''; for (let i = 0; i < 4; i++) { bw += G.rrect(-38 + i * 20, -50, 14, 11, 2) + ' ' + G.rrect(-38 + i * 20, -22, 14, 9, 2) + ' '; }
  A.piece(bus, 'busWin', bw, 'window');
  A.piece(bus, 'busWheels', G.circle(-26, -6, 8) + ' ' + G.circle(26, -6, 8), 'navy');
  A.piece(bus, 'busHubs', G.circle(-26, -6, 3) + ' ' + G.circle(26, -6, 3), 'steelLight');

  // London Eye, slowly turning.
  const eye = g('londonEye', 818, FRONT_BASE);
  const hubY = -138, R = 112;
  A.line(eye, 'eyeLegL', `M-48 0 L0 ${hubY}`, 'steel', px ? 8 : 7, { cap: 1 });
  A.line(eye, 'eyeLegR', `M26 0 L0 ${hubY}`, 'steel', px ? 8 : 6, { cap: 1 });
  const wheel = ab.node('eyeWheel', eye, { y: hubY });
  A.piece(wheel, 'eyeRim', G.ring(0, 0, R - 5, R), 'steel', { evenOdd: true });
  if (!px) A.piece(wheel, 'eyeRim2', G.ring(0, 0, R - 14, R - 12), 'steelLight', { evenOdd: true });
  let spokes = '';
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; spokes += `M0 0 L${(Math.cos(a) * (R - 6)).toFixed(1)} ${(Math.sin(a) * (R - 6)).toFixed(1)} `; }
  A.line(wheel, 'eyeSpokes', spokes, 'steelLight', px ? 4 : 1.4);
  let caps = '';
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + Math.PI / 16; caps += G.ellipse(Math.cos(a) * R, Math.sin(a) * R, px ? 6 : 7, px ? 4 : 5) + ' '; }
  A.piece(wheel, 'eyeCaps', caps, 'white');
  A.piece(wheel, 'eyeHub', G.circle(0, 0, 8), 'steel');

  const { sm } = popupSM(ab, groups, { stagger: 0.075, order: [tb, th, trees, bus, eye] });
  // Second layer: the Eye's slow rotation runs independently of the pop-ups.
  const spin = ab.animation('eyeSpin', { duration: 30, loop: 'loop' });
  spin.key(wheel, 'rotation', [[0, 0, null], [30, Math.PI * 2]]);
  const L2 = sm.layer('eye');
  L2.transition(L2.entry, L2.anim(spin));
  return ab;
}

function buildLondon(file, S) { buildBack(file, S); buildBigBen(file, S); buildFront(file, S); }
module.exports = { buildLondon };
