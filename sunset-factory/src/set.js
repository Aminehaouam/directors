// The paper set: sky (blank → painted → night), hills, factory, belt, crane, props, foreground machinery.
import { lerp, clamp, prog, E, rng, noise1, TAU } from './lib.js';
import { blob, cutPoly, rrect, rrectPts, edgeShape, star5 } from './paper.js';
import { L, T, farHillY, STARS, star as starAt } from './story.js';
import { shade } from './rig.js';

export const C = {
  sky: '#e8dfcc', guide: '#a39684',
  gold: '#ffd46c', orange: '#f9a04e', coral: '#f47f5d', rose: '#ea6a7c', magenta: '#cf5180', plum: '#a5457a',
  night: ['#1b1f4c', '#222a5d', '#2c336d', '#3f3876', '#5f4278'],
  farHill: '#c48a8c', midHill: '#9c5f72', tree: '#7a4560', nearHill: '#7d4560', house: '#e9d3b4', houseRoof: '#a5463f',
  brick: '#c65b42', brickHi: '#d6704f', roof: '#7b3a49', chimney: '#a84a3a', iron: '#5e4b52', ironHi: '#7d6870',
  wood: '#d39a5e', woodLine: '#b5804a', lip: '#8a4f38', lipHi: '#e0aa70',
  crane: '#e5a93b', craneDark: '#b9802a', concrete: '#a99a8f', steel: '#5a5560',
  belt: '#3f3442', beltFrame: '#a3866f', beltLeg: '#7d6658', brass: '#d8a54a', copper: '#b4643f', teal: '#5d8c86', gearA: '#a8834f', gearB: '#8f5a40',
  room: '#3d2532', roomDark: '#2c1923', pipe: '#8b6455', cream: '#f6ecdc', cloudUnder: '#e7c9bf',
  crate: '#b77942', crateDark: '#8d5631', glass: '#cfe9ef',
};

/* ------------------------------------------------------------------ static shapes */
export function buildSet() {
  const S = {};
  S.sky = cutPoly([[-500, -400], [1580, -400], [1580, 1150], [-500, 1150]], 'sky', 0, 200);
  // painted strips: each covers from the top down to its own hand-cut lower edge
  const strip = (yb, amp, seed) => cutPoly(
    [[-500, -400], [1580, -400], ...Array.from({ length: 55 }, (_, i) => { const x = 1580 - i * 38.5; return [x, yb + amp * Math.sin(x * 0.012 + seed) + amp * 0.5 * Math.sin(x * 0.031 + seed * 2)]; })], 'strip' + seed, 1.6, 20);
  S.orangeStrips = [[C.gold, strip(905, 8, 1)], [C.orange, strip(775, 9, 2)], [C.coral, strip(606, 10, 3)]];
  S.pinkStrips = [[C.rose, strip(456, 9, 4)], [C.magenta, strip(306, 10, 5)], [C.plum, strip(150, 11, 6)]];
  S.nightStrips = [[C.night[4], strip(960, 6, 11)], [C.night[3], strip(770, 8, 12)], [C.night[2], strip(610, 9, 13)], [C.night[1], strip(420, 10, 14)], [C.night[0], strip(215, 11, 15)]];
  // hills
  S.farHill = edgeShape(-500, 1580, farHillY, 1460, 14, 21, 1.2);
  const midY = (x) => 912 - 46 * Math.exp(-(((x - 330) / 190) ** 2)) - 38 * Math.exp(-(((x - 760) / 230) ** 2)) - 30 * Math.exp(-(((x + 150) / 200) ** 2)) + 7 * Math.sin(x * 0.019);
  S.midY = midY;
  S.midHill = edgeShape(-500, 1580, midY, 1460, 14, 22, 1.4);
  const nearY = (x) => 1150 - 40 * Math.exp(-(((x - 120) / 220) ** 2)) - 52 * Math.exp(-(((x - 700) / 260) ** 2)) + 6 * Math.sin(x * 0.023);
  S.nearHill = edgeShape(-500, 1580, nearY, 1460, 14, 23, 1.4);
  S.bushes = new Path2D();
  const bu = rng('bush');
  for (let x = -480; x < 1560; x += 46 + bu() * 50) { const y = nearY(x); S.bushes.addPath(blob(x, y + 4, 18 + bu() * 16, 13 + bu() * 9, 'bush' + x, 0.05, 24)); }
  S.houses = [[455, 0.9], [612, 1.0], [858, 0.85]].map(([x, k]) => {
    const y = midY(x) + 10, w = 46 * k, h = 34 * k;
    return { x, y, w, h, body: cutPoly([[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y + 6], [x - w / 2, y + 6]], 'hb' + x, 0.6, 10),
      roof: cutPoly([[x - w / 2 - 7, y - h + 2], [x, y - h - 26 * k], [x + w / 2 + 7, y - h + 2]], 'hr' + x, 0.6, 8),
      win: rrect(x - 7 * k, y - h * 0.62, 14 * k, 13 * k, 2, 'hw' + x) };
  });
  S.trees = [];
  const tr = rng('trees');
  for (const x of [-210, -120, 395, 450, 610, 690, 840, 1060, 1130]) {
    const y = midY(x) + 6, h = 34 + tr() * 26, kind = tr() < 0.5 ? 'pine' : 'round';
    const p = new Path2D();
    if (kind === 'pine') cutPoly([[x, y - h - 18], [x + h * 0.36, y - 4], [x + 3, y - 4], [x + 3, y + 8], [x - 3, y + 8], [x - 3, y - 4], [x - h * 0.36, y - 4]], 'pine' + x, 0.8, 8, true, p);
    else { p.addPath(blob(x, y - h * 0.62, h * 0.36, h * 0.4, 'tree' + x, 0.05, 28)); p.addPath(rrect(x - 3, y - h * 0.3, 6, h * 0.36, 2, 'trunk' + x)); }
    S.trees.push(p);
  }
  // building
  S.wall = cutPoly([[-330, 1008], [332, 1008], [332, 1422], [-330, 1422]], 'wall', 1.2, 24);
  S.bricks = new Path2D();
  const br = rng('bricks');
  for (let row = 0; row < 18; row++) {
    const y = 1022 + row * 22;
    if (y > 1395) break;
    for (let x = -330 + (row % 2) * 24; x < 330; x += 48) {
      if (br() < 0.45) continue;
      const dx = Math.hypot(x + 18 - L.ovenX, y + 6 - L.ovenY);
      if (dx < 150) continue;
      S.bricks.addPath(rrect(x + 3, y + 3, 38, 14, 3, 'b' + row + '_' + x, 0.5));
    }
  }
  S.wallTrim = cutPoly([[-330, 1396], [332, 1396], [332, 1422], [-330, 1422]], 'trim', 0.8, 20);
  const roof = [[-340, 1012]];
  for (let x = -340; x < 330; x += 130) { roof.push([x, 940], [Math.min(x + 130, 336), 1012]); if (x + 130 < 336) roof.push([x + 130, 1012]); }
  roof.push([336, 1012]);
  S.roof = cutPoly(roof, 'roof', 1.2, 14);
  S.skylights = [];
  for (let x = -340; x < 330; x += 130) S.skylights.push(cutPoly([[x + 5, 950], [x + 14, 952], [x + 14, 1004], [x + 5, 1004]], 'sl' + x, 0.3, 8));
  S.chimney = cutPoly([[28, 846], [92, 846], [92, 1010], [28, 1010]], 'chim', 1, 14);
  S.chimneyTop = rrect(20, 838, 80, 24, 5, 'chimtop');
  S.windows = [-270, -160].map((x) => ({
    frame: cutPoly([...rrectPts(x - 38, 1052, 76, 96, 6)], 'wf' + x, 0.6, 10),
    glass: blob(x, 1100, 30, 40, 'wg' + x, 0.01, 40),
    x,
  }));
  S.plaque = blob(-50, 1236, 46, 46, 'plaque', 0.012, 48);
  S.ovenRing = blob(L.ovenX, L.ovenY, 142, 142, 'ring', 0.008, 90);
  S.ovenHole = blob(L.ovenX, L.ovenY, 122, 122, 'hole', 0.008, 90);
  S.door = blob(0, 0, 124, 124, 'door', 0.008, 90);
  S.porthole = blob(18, -10, 36, 36, 'port', 0.01, 48);
  S.rivets = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * TAU; return [L.ovenX + Math.cos(a) * 132, L.ovenY + Math.sin(a) * 132]; });
  // floor + lip
  S.floor = cutPoly([[-500, 1396], [1580, 1396], [1580, 1480], [-500, 1480]], 'floor', 1, 30);
  S.floorLines = new Path2D();
  for (const [y, w] of [[1416, 2], [1436, 2.4], [1458, 2.8]]) S.floorLines.addPath(cutPoly([[-500, y], [1580, y], [1580, y + w], [-500, y + w]], 'fl' + y, 0.5, 40));
  const fl = rng('seams');
  for (let x = -480; x < 1560; x += 120 + fl() * 80) { const r = Math.floor(fl() * 3), ys = [1398, 1418, 1438, 1460][r], ye = [1416, 1436, 1458, 1478][r]; S.floorLines.addPath(cutPoly([[x, ys], [x + 2, ys], [x + 2, ye], [x, ye]], 'sm' + x, 0.2, 10)); }
  S.lip = cutPoly([[-500, 1476], [1580, 1476], [1580, 1504], [-500, 1504]], 'lip', 0.8, 30);
  S.lipHi = cutPoly([[-500, 1476], [1580, 1476], [1580, 1480], [-500, 1480]], 'liphi', 0.4, 30);
  // machine room
  S.room = cutPoly([[-500, 1500], [1580, 1500], [1580, 2200], [-500, 2200]], 'room', 0, 40);
  S.gears = [
    { x: 120, y: 1715, r: 165, n: 16, col: C.gearA, spokes: 5 },
    { x: 362, y: 1626, r: 100, n: 10, col: C.gearB, spokes: 4 },
    { x: 770, y: 1790, r: 205, n: 20, col: C.gearA, spokes: 6 },
    { x: 1000, y: 1600, r: 92, n: 9, col: C.gearB, spokes: 4 },
  ].map((gd) => ({ ...gd, path: gearPath(gd.r, gd.n, gd.spokes, 'gear' + gd.x) }));
  S.pipe = cutPoly([[-500, 1524], [1580, 1524], [1580, 1548], [-500, 1548]], 'pipe', 0.6, 30);
  S.flanges = new Path2D();
  for (let x = -420; x < 1560; x += 190) S.flanges.addPath(rrect(x, 1518, 16, 36, 3, 'fln' + x));
  S.vpipe = cutPoly([[548, 1546], [572, 1546], [572, 1620], [548, 1620]], 'vpipe', 0.4, 12);
  S.gaugeRing = blob(560, 1662, 48, 48, 'gring', 0.01, 48);
  S.gaugeFace = blob(560, 1662, 39, 39, 'gface', 0.01, 48);
  // belt
  S.beltBody = rrect(L.beltX0 - 12, L.beltTop, L.beltX1 - L.beltX0 + 24, 22, 11, 'belt', 0.5);
  const bt = L.beltTop;
  S.beltFrame = cutPoly([[L.beltX0, bt + 22], [L.beltX1, bt + 22], [L.beltX1, bt + 46], [L.beltX0, bt + 46]], 'bframe', 0.6, 20);
  S.beltLegs = new Path2D();
  for (const x of [190, 420, 640]) { S.beltLegs.addPath(rrect(x - 7, bt + 44, 14, 22, 3, 'leg' + x)); S.beltLegs.addPath(rrect(x - 12, bt + 62, 24, 6, 2, 'foot' + x)); }
  S.rivetsBelt = Array.from({ length: 13 }, (_, i) => [L.beltX0 + 22 + i * 40, bt + 34]);
  S.leverBox = rrect(680, 1370, 36, 72, 5, 'lbox');
  S.bucket = cutPoly([[-22, -40], [22, -40], [17, 0], [-17, 0]], 'bucket', 0.4, 6);
  S.bucketRim = rrect(-24, -44, 48, 7, 3, 'brim');
  S.beltGearA = gearPath(20, 8, 0, 'bgA'); S.beltGearB = gearPath(13, 6, 0, 'bgB');
  // crane
  S.tower = lattice(950, 345, 50, 1080, 'v', 'tower');
  S.jib = lattice(130, 300, 875, 30, 'h', 'jib');
  S.cjib = lattice(1000, 300, 240, 26, 'h', 'cjib');
  S.apex = cutPoly([[952, 302], [998, 302], [975, 200]], 'apex', 0.6, 10);
  S.cab = rrect(898, 350, 54, 50, 6, 'cab');
  S.cabWin = rrect(906, 358, 30, 22, 4, 'cabwin');
  S.cweight = rrect(1150, 326, 74, 62, 4, 'cw');
  S.footing = rrect(925, 1404, 100, 28, 4, 'footing');
  S.trolley = rrect(-24, 330, 48, 18, 4, 'trolley');
  S.hookBlock = rrect(-21, -46, 42, 34, 7, 'hook');
  S.prong = cutPoly([[-5, 0], [5, 0], [58, 4], [84, 22], [76, 47], [67, 45], [72, 27], [54, 15], [6, 12]], 'prong', 0.5, 6);
  // clouds on strings
  S.clouds = [
    { x: 175, y: 400, s: 1.0, seed: 'cA' }, { x: 800, y: 470, s: 0.85, seed: 'cB' }, { x: 640, y: 82, s: 0.72, seed: 'cC' },
  ].map((c) => ({ ...c, front: cloudPath(c.seed, 0), back: cloudPath(c.seed + 'b', 8) }));
  // crate + jar
  S.crate = cutPoly(rrectPts(L.crate.x0, L.crate.top, L.crate.x1 - L.crate.x0, L.crate.base - L.crate.top, 4), 'crate', 0.8, 10);
  S.crateSlats = new Path2D();
  for (const y of [1428, 1452]) S.crateSlats.addPath(rrect(L.crate.x0 + 4, y, 62, 3, 1, 'slat' + y));
  S.crateFrame = new Path2D();
  for (const x of [L.crate.x0 + 4, L.crate.x1 - 12]) S.crateFrame.addPath(rrect(x, L.crate.top + 4, 8, 62, 2, 'cf' + x));
  S.jarBody = cutPoly([[-31, -6], [-31, -64], [-24, -78], [-22, -86], [22, -86], [24, -78], [31, -64], [31, -6], [26, 0], [-26, 0]], 'jar', 0.5, 8);
  S.jarLip = rrect(-25, -94, 50, 10, 4, 'jarlip');
  S.cork = rrect(-18, -110, 36, 18, 5, 'cork');
  S.label = rrect(-21, -58, 42, 30, 3, 'label');
  S.jarStars = Array.from({ length: 16 }, (_, i) => { const r = rng('js' + i); return { x: (r() - 0.5) * 44, y: -8 - r() * 52, r: 6 + r() * 4, a: r() * TAU, path: star5(1, 0.5, i) }; });
  S.starPaths = STARS.map((s) => star5(1, 0.48, 100 + s.i));
  S.starInner = star5(1, 0.5, 777);
  S.dots = Array.from({ length: 90 }, (_, i) => { const r = rng('dot' + i); const x = -20 + r() * 1120, y = 10 + r() * 760; return { x, y, r: 1.2 + r() * 2, ph: r() * TAU, f: 1 + r() * 3 }; }).filter((d) => d.y < farHillY(d.x) - 20);
  // sun
  S.sunOuter = blob(0, 0, 1, 1, 'sunO', 0.006, 96);
  S.sunMid = blob(-0.04, -0.04, 0.86, 0.86, 'sunM', 0.01, 80);
  S.sunIn = blob(-0.1, -0.11, 0.6, 0.6, 'sunI', 0.015, 64);
  S.sunSpots = [[0.45, -0.35, 0.13, 0.08], [-0.52, 0.32, 0.1, 0.07], [0.15, 0.55, 0.12, 0.07], [-0.2, -0.62, 0.08, 0.05]].map(([x, y, rx, ry], i) => blob(x, y, rx, ry, 'spot' + i, 0.05, 20));
  S.rays = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * TAU, w = i % 2 ? 0.09 : 0.13, l = i % 2 ? 1.95 : 2.35; return cutPoly([[Math.cos(a - w) * 1.12, Math.sin(a - w) * 1.12], [Math.cos(a) * l, Math.sin(a) * l], [Math.cos(a + w) * 1.12, Math.sin(a + w) * 1.12]], 'ray' + i, 0.01, 0.2); });
  return S;
}

function gearPath(r, n, spokes, seed) {
  const pts = [], depth = Math.max(6, r * 0.12);
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU, a1 = ((i + 0.5) / n) * TAU, w = (0.5 / n) * TAU * 0.42;
    pts.push([Math.cos(a0 - w) * r, Math.sin(a0 - w) * r], [Math.cos(a0 + w) * r, Math.sin(a0 + w) * r]);
    pts.push([Math.cos(a1 - w * 1.2) * (r - depth), Math.sin(a1 - w * 1.2) * (r - depth)], [Math.cos(a1 + w * 1.2) * (r - depth), Math.sin(a1 + w * 1.2) * (r - depth)]);
  }
  const p = cutPoly(pts, seed, 0.4, 10);
  // cut-out windows between spokes (evenodd holes)
  if (spokes) {
    const ri = r * 0.28, ro = r * 0.72;
    for (let k = 0; k < spokes; k++) {
      const a0 = (k / spokes) * TAU + 0.22, a1 = ((k + 1) / spokes) * TAU - 0.22, hole = [];
      for (let j = 0; j <= 6; j++) { const a = lerp(a0, a1, j / 6); hole.push([Math.cos(a) * ro, Math.sin(a) * ro]); }
      for (let j = 6; j >= 0; j--) { const a = lerp(a0 + 0.08, a1 - 0.08, j / 6); hole.push([Math.cos(a) * ri * 1.4, Math.sin(a) * ri * 1.4]); }
      cutPoly(hole, seed + 'h' + k, 0.3, 8, true, p);
    }
  }
  cutPoly(Array.from({ length: 12 }, (_, i) => [Math.cos(-(i / 12) * TAU) * r * 0.12, Math.sin(-(i / 12) * TAU) * r * 0.12]), seed + 'axle', 0.1, 6, true, p);
  return p;
}

// Lattice girder: solid strip with triangular cut-outs (fill with evenodd).
function lattice(x, y, w, h, dir, seed) {
  const p = cutPoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seed, 0.4, 30);
  const b = 6;
  if (dir === 'h') {
    const n = Math.round(w / (h * 1.1)), step = w / n;
    for (let i = 0; i < n; i++) {
      const x0 = x + i * step;
      cutPoly([[x0 + b, y + h - b], [x0 + step / 2, y + b], [x0 + step - b, y + h - b]], seed + 'a' + i, 0.2, 10, true, p);
      if (i < n - 1) cutPoly([[x0 + step / 2 + b, y + b], [x0 + step + step / 2 - b, y + b], [x0 + step, y + h - b]], seed + 'b' + i, 0.2, 10, true, p);
    }
  } else {
    const n = Math.round(h / (w * 1.1)), step = h / n;
    for (let i = 0; i < n; i++) {
      const y0 = y + i * step;
      cutPoly([[x + b, y0 + b], [x + w - b, y0 + step / 2], [x + b, y0 + step - b]], seed + 'a' + i, 0.2, 10, true, p);
      if (i < n - 1) cutPoly([[x + w - b, y0 + step / 2 + b], [x + w - b, y0 + step + step / 2 - b], [x + b, y0 + step]], seed + 'b' + i, 0.2, 10, true, p);
    }
  }
  return p;
}

function cloudPath(seed, dy) {
  const r = rng(seed), p = new Path2D();
  const bumps = [[-62, 8, 30], [-28, -12, 40], [16, -18, 44], [56, -2, 32], [82, 14, 22], [-86, 18, 20]];
  for (const [x, y, rr] of bumps) p.addPath(blob(x, y + dy, rr * (0.95 + r() * 0.1), rr * (0.9 + r() * 0.1), seed + x, 0.03, 36));
  p.addPath(rrect(-100, 4 + dy, 200, 30, 15, seed + 'base', 0.8));
  return p;
}

/* ------------------------------------------------------------------ drawing */
export function drawSky(P, S, st) {
  P.fill(S.sky, C.sky, 0, 0.9);
}

/** Reveal clip for a paint band. */
function bandClip(r, x0, x1, topF) {
  const p = new Path2D();
  const [y0, y1] = r.band, hb = Math.max(r.y - y0, y1 - r.y);
  const xr = (y) => r.edgeR - r.curve * ((y - r.y) / hb) ** 2 + 5 * Math.sin(y * 0.05 + r.y);
  const xl = (y) => r.edgeL + r.curve * 0.7 * ((y - r.y) / hb) ** 2 + 4 * Math.sin(y * 0.043);
  const ys = [];
  for (let y = y0; y <= y1; y += 18) ys.push(y);
  const top = topF || (() => y0);
  p.moveTo(xl(y0), top(xl(y0)));
  for (let x = xl(y0); x < xr(y0); x += 30) p.lineTo(x, top(x));
  for (const y of ys) p.lineTo(Math.max(xl(y), xr(y)), y);
  for (const y of ys.reverse()) p.lineTo(xl(y), y);
  p.closePath();
  return p;
}

export function drawPaint(P, S, rOrange, rPink) {
  const g = P.g;
  for (const [r, strips, topF] of [[rOrange, S.orangeStrips, (x) => 438 + 7 * Math.sin(x * 0.021) + 4 * Math.sin(x * 0.053)], [rPink, S.pinkStrips, null]]) {
    if (!r.active || r.edgeR <= r.edgeL) continue;
    g.save();
    g.clip(bandClip(r, -500, 1580, topF));
    for (const [col, path] of strips) P.fill(path, col, 3, 0.9);
    // roller streaks
    g.globalCompositeOperation = 'soft-light';
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3;
    for (let k = 0; k < 7; k++) {
      const y = r.y - 52 + k * 17 + (k % 2) * 3;
      g.beginPath(); g.moveTo(-500, y); for (let x = -500; x < 1580; x += 60) g.lineTo(x, y + 2 * Math.sin(x * 0.03 + k)); g.stroke();
    }
    g.restore();
  }
}

export function drawNight(P, S, t, nt) {
  if (t < T.launch[0] + 0.3) return;
  const g = P.g;
  const clip = new Path2D();
  // top-down wash with a cut edge
  if (nt.washY > -100) {
    const pts = [[-500, -500], [1580, -500]];
    for (let x = 1580; x >= -500; x -= 40) pts.push([x, nt.washY + 22 * Math.sin(x * 0.013 + 1) + 12 * Math.sin(x * 0.041)]);
    cutPoly(pts, 'wash', 0, 40, true, clip);
  }
  for (const s of STARS) {
    const k = E.outCubic(prog(t, s.arrive - 0.05, s.arrive + 0.85));
    if (k <= 0) continue;
    const rad = s.bloom * k, n = 40, pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; const w = 1 + 0.07 * Math.sin(a * 5 + s.phase) + 0.04 * Math.sin(a * 9 + s.i); pts.push([s.target[0] + Math.cos(a) * rad * w, s.target[1] + Math.sin(a) * rad * w]); }
    cutPoly(pts, 'bl' + s.i, 0, 400, true, clip);
  }
  g.save();
  g.clip(clip);
  for (const [col, path] of S.nightStrips) P.fill(path, col, 3, 0.7, { raw: true });
  g.restore();
}

export function drawDots(P, S, t, nt) {
  if (nt.n <= 0) return;
  const g = P.g;
  g.save(); g.globalCompositeOperation = 'screen';
  for (const d of S.dots) {
    const a = clamp((nt.n - 0.35) * 2) * (0.55 + 0.45 * Math.sin(t * d.f + d.ph));
    if (a <= 0.01) continue;
    g.fillStyle = `rgba(255,236,190,${a})`;
    g.beginPath(); g.arc(d.x, d.y, d.r, 0, TAU); g.fill();
  }
  g.restore();
}

export function drawTarget(P, t) {
  const a = 0.75 * (1 - prog(t, T.click, T.click + 0.35)) * (0.85 + 0.15 * Math.sin(t * 6) * (t > T.hoist[0] ? 1 : 0));
  if (a <= 0) return;
  const g = P.g, [x, y] = L.target;
  g.save();
  g.strokeStyle = P.grade.c(C.guide, a); g.lineWidth = 4; g.setLineDash([16, 13]); g.lineDashOffset = -t * 8;
  g.beginPath(); g.arc(x, y, L.sunR + 6, 0, TAU); g.stroke();
  g.setLineDash([]); g.lineWidth = 3;
  for (let i = 0; i < 4; i++) { const ang = (i * Math.PI) / 2; g.beginPath(); g.moveTo(x + Math.cos(ang) * (L.sunR + 16), y + Math.sin(ang) * (L.sunR + 16)); g.lineTo(x + Math.cos(ang) * (L.sunR + 36), y + Math.sin(ang) * (L.sunR + 36)); g.stroke(); }
  g.beginPath(); g.moveTo(x - 10, y); g.lineTo(x + 10, y); g.moveTo(x, y - 10); g.lineTo(x, y + 10); g.stroke();
  g.restore();
}

export function drawClouds(P, S, t, warm) {
  const g = P.g;
  for (const c of S.clouds) {
    const sw = Math.sin(t * 0.8 + c.x) * 0.02;
    g.save(); g.translate(c.x, -60); g.rotate(sw); g.translate(0, c.y + 60);
    g.strokeStyle = P.grade.c('#6d5a52', 0.55); g.lineWidth = 1.6;
    for (const sx of [-40, 40]) { g.beginPath(); g.moveTo(sx * c.s, -10 * c.s); g.lineTo(sx * c.s * 0.6, -c.y - 120); g.stroke(); }
    g.scale(c.s, c.s);
    P.fill(c.back, lerpHex(C.cloudUnder, '#f59a95', warm), 2, 0.8);
    P.fill(c.front, C.cream, 2, 0.9);
    g.restore();
  }
}

export function drawHills(P, S, lit = 0) {
  P.fill(S.farHill, C.farHill, 3, 0.9);
  P.fill(S.midHill, C.midHill, 3, 0.9);
  for (const tr of S.trees) P.fill(tr, C.tree, 2, 0.7);
  for (const h of S.houses) {
    P.fill(h.body, C.house, 2, 0.7);
    P.fill(h.roof, C.houseRoof, 2, 0.7);
    P.fill(h.win, mixLit(lit), 0, 0.3, { raw: lit > 0.05 });
    if (lit > 0.05) drawGlow(P.g, h.x, h.y - h.h * 0.55, 30, '255,200,110', 0.5 * lit);
  }
  P.fill(S.nearHill, C.nearHill, 3, 0.9);
  P.fill(S.bushes, shade(C.nearHill, -14), 2, 0.6);
}

export function drawSunBody(P, S, s) {
  const g = P.g, r = s.r * s.depth;
  g.save(); g.translate(s.x, s.y); g.scale(s.sx, s.sy); g.rotate(s.rot);
  g.scale(r, r);
  // emissive: the sun is never darkened by the grade
  P.fill(S.sunOuter, '#ffb22e', 2, 0.7, { raw: true });
  P.fill(S.sunMid, '#ffcd3f', 0, 0.6, { raw: true });
  P.fill(S.sunIn, '#ffe577', 0, 0.5, { raw: true });
  for (const sp of S.sunSpots) P.fill(sp, '#fff1b2', 0, 0.3, { raw: true });
  g.restore();
}

export function drawGlow(g, x, y, r, rgb, a, mode = 'screen') {
  if (a <= 0.003) return;
  g.save(); g.globalCompositeOperation = mode;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(0.35, `rgba(${rgb},${a * 0.45})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}

export function drawRays(P, S, s, t) {
  const k = E.outBack(prog(t, T.click, T.click + 0.7)) * (1 - prog(t, T.sunSink[0], T.sunSink[0] + 0.8));
  if (k <= 0) return;
  const g = P.g;
  g.save(); g.translate(s.x, s.y); g.rotate(t * 0.08); g.scale(s.r * k, s.r * k);
  g.globalAlpha = 0.55;
  for (const ray of S.rays) P.fill(ray, '#ffe7a3', 0, 0.4, { raw: true });
  g.restore();
}

export function drawBuilding(P, S, t, ov, sunSt, nightK) {
  const g = P.g;
  P.fill(S.chimney, C.chimney, 3, 0.9);
  P.fill(S.chimneyTop, C.roof, 1, 0.8);
  P.fill(S.roof, C.roof, 3, 0.9);
  P.fill(S.wall, C.brick, 3, 0.9);
  P.fill(S.bricks, C.brickHi, 0, 0.5);
  P.fill(S.wallTrim, shade(C.brick, -40), 1, 0.6);
  const lit = Math.max(ov.glow, nightK);
  for (const sl of S.skylights) P.fill(sl, mixLit(lit), 0, 0.3, { raw: lit > 0.05 });
  for (const w of S.windows) {
    P.fill(w.frame, C.roof, 2, 0.8);
    P.fill(w.glass, mixLit(lit), 0, 0.4, { raw: true });
    g.save(); g.strokeStyle = P.grade.c(C.roof); g.lineWidth = 6; g.beginPath(); g.moveTo(w.x, 1062); g.lineTo(w.x, 1140); g.moveTo(w.x - 32, 1104); g.lineTo(w.x + 32, 1104); g.stroke(); g.restore();
  }
  // round plaque with a little sunset emblem
  P.fill(S.plaque, '#f1e2c2', 2, 0.8);
  g.save(); g.translate(-50, 1236);
  P.fill(blob(0, 6, 22, 22, 'plq-sun', 0.02, 36), '#f2a23a', 0, 0.4);
  P.fill(rrect(-34, 6, 68, 30, 4, 'plq-cut'), '#f1e2c2', 0, 0);
  P.fill(rrect(-30, 8, 60, 5, 2, 'plq-line'), C.roof, 0, 0.3);
  g.restore();
  for (const a of [-0.75, 0, 0.75]) { g.save(); g.translate(-50, 1242); g.rotate(a); P.fill(rrect(-3, -40, 6, 11, 3, 'plqr' + a), '#f2a23a', 0, 0); g.restore(); }
}

export function lerpHex(a, b, k) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((sh) => Math.round(lerp((x >> sh) & 255, (y >> sh) & 255, clamp(k))));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function mixLit(k) {
  const a = [0x7a, 0x5c, 0x58], b = [0xff, 0xd0, 0x72];
  const c = a.map((v, i) => Math.round(lerp(v, b[i], clamp(k))));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function drawOven(P, S, t, ov, s, drawSunInside) {
  const g = P.g, cx = L.ovenX, cy = L.ovenY;
  P.fill(S.ovenRing, C.iron, 3, 0.9);
  for (const [x, y] of S.rivets) P.fill(blob(x, y, 4, 4, 'rv' + x, 0.05, 12), C.ironHi, 1, 0.3);
  // interior
  P.fill(S.ovenHole, '#3a1f24', 0, 0.6);
  g.save(); g.clip(S.ovenHole);
  const gr = g.createRadialGradient(cx, cy + 30, 10, cx, cy, 130);
  gr.addColorStop(0, `rgba(255,170,70,${0.85 * ov.glow})`); gr.addColorStop(1, 'rgba(120,40,30,0)');
  g.fillStyle = gr; g.fillRect(cx - 130, cy - 130, 260, 260);
  if (drawSunInside) drawSunInside();
  g.restore();
  // door (hinged on the left)
  const ang = ov.door * Math.PI * 0.6, sx = Math.cos(ang);
  g.save(); g.translate(cx - 124, cy); g.scale(sx, 1); g.translate(124, 0);
  P.fill(S.door, sx >= 0 ? '#6e5a62' : '#4d3d44', 3, 0.9);
  if (sx > 0) {
    P.fill(S.porthole, '#4d3d44', 1, 0.5);
    P.fill(blob(18, -10, 27, 27, 'pglass', 0.01, 40), mixLit(ov.glow), 0, 0.3, { raw: true });
    P.fill(rrect(-88, -12, 16, 50, 6, 'handle'), '#b9a3a8', 1, 0.6);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; P.fill(blob(Math.cos(a) * 104, Math.sin(a) * 104, 3.5, 3.5, 'dr' + i, 0.05, 12), C.ironHi, 0, 0.3); }
  }
  g.restore();
  // little bell above the oven
  g.save(); g.translate(cx, L.ovenY - 158);
  P.fill(rrect(-26, -24, 52, 7, 3, 'bracket'), C.iron, 1, 0.5);
  g.rotate(ov.bell);
  P.fill(cutPoly([[-3, -18], [3, -18], [12, -4], [15, 8], [-15, 8], [-12, -4]], 'bell', 0.4, 6), C.brass, 1, 0.6);
  P.fill(blob(0, 10, 4, 4, 'clap', 0.05, 12), shade(C.brass, -50), 0, 0.3);
  g.restore();
  // light spill when the door opens
  drawGlow(g, cx, cy, 360, '255,184,92', 0.45 * ov.door * ov.glow);
}

export function drawSmoke(P, t) {
  const g = P.g;
  for (let i = 0; i < 6; i++) {
    const per = 2.4, u = ((t + i * (per / 6)) % per) / per;
    const x = 60 + u * 70 + Math.sin(u * 5 + i) * 10, y = 836 - u * 230, r = 12 + u * 34;
    const a = Math.min(1, u * 6) * (1 - u);
    if (a < 0.02) continue;
    P.fill(blob(x, y, r, r * 0.86, 'smoke' + i, 0.05, 28), C.cream, 2, 0.6, { alpha: 0.85 * a, shadowK: a });
  }
}

export function drawCraneBack(P, S, t, cr) {
  const g = P.g;
  // tie lines
  g.save(); g.strokeStyle = P.grade.c('#5a4246'); g.lineWidth = 2.6;
  g.beginPath(); g.moveTo(975, 206); g.lineTo(150, 302); g.moveTo(975, 206); g.lineTo(1232, 302); g.stroke(); g.restore();
  P.fill(S.apex, C.crane, 2, 0.8);
  P.fill(S.cjib, C.crane, 2, 0.8, { rule: 'evenodd' });
  P.fill(S.cweight, C.concrete, 2, 0.8);
  P.fill(S.jib, C.crane, 2, 0.8, { rule: 'evenodd' });
}

export function drawCraneTower(P, S) {
  P.fill(S.tower, C.crane, 3, 0.8, { rule: 'evenodd' });
  P.fill(S.cab, C.crane, 2, 0.8);
  P.fill(S.cabWin, '#bfe0e6', 0, 0.4);
  P.fill(S.footing, C.concrete, 2, 0.8);
}

export function drawHook(P, S, t, cr) {
  const g = P.g, x = cr.trolleyX, hub = cr.hub;
  g.save(); g.translate(x, 0); P.fill(S.trolley, C.steel, 2, 0.6);
  for (const wx of [-14, 14]) P.fill(blob(wx, 330, 6, 6, 'tw' + wx, 0.05, 14), '#3a3640', 0, 0.3);
  g.restore();
  // cables
  g.save(); g.strokeStyle = P.grade.c('#3c3438'); g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(x - 6, 346); g.lineTo(x - 6 + Math.sin(cr.sway) * (hub - 346), hub - 44); g.moveTo(x + 6, 346); g.lineTo(x + 6 + Math.sin(cr.sway) * (hub - 346), hub - 44); g.stroke();
  g.restore();
  const hx = x + Math.sin(cr.sway) * (hub - 346);
  g.save(); g.translate(hx, hub);
  P.fill(S.hookBlock, '#f2c232', 2, 0.7);
  g.save(); g.clip(S.hookBlock); g.fillStyle = P.grade.c('#3a3036');
  for (let k = -3; k < 4; k++) { g.beginPath(); g.moveTo(k * 14 - 6, -46); g.lineTo(k * 14 + 2, -46); g.lineTo(k * 14 + 18, -12); g.lineTo(k * 14 + 10, -12); g.closePath(); g.fill(); }
  g.restore();
  for (const sd of [-1, 1]) {
    g.save(); g.scale(sd, 1); g.rotate(-0.62 * cr.open);
    P.fill(S.prong, '#4b4650', 2, 0.6);
    g.restore();
  }
  P.fill(blob(0, 0, 10, 10, 'hub', 0.03, 18), '#5f5a66', 1, 0.5);
  g.restore();
}

export function drawFloor(P, S) {
  P.fill(S.floor, C.wood, 3, 0.9);
  P.fill(S.floorLines, C.woodLine, 0, 0.4);
}

export function drawBelt(P, S, t, bt, lev) {
  const g = P.g;
  P.fill(S.beltLegs, C.beltLeg, 2, 0.7);
  P.fill(S.beltFrame, C.beltFrame, 2, 0.8);
  for (const [x, y] of S.rivetsBelt) P.fill(blob(x, y, 3, 3, 'br' + x, 0.05, 12), shade(C.beltFrame, -40), 0, 0.2);
  // side gears
  for (const [gp, x, y, r, sgn] of [[S.beltGearA, 262, L.beltTop + 38, 20, 1], [S.beltGearB, 293, L.beltTop + 30, 13, -1]]) {
    g.save(); g.translate(x, y); g.rotate(sgn * bt.gear * (20 / r)); P.fill(gp, C.brass, 1, 0.6, { rule: 'evenodd' }); g.restore();
  }
  P.fill(S.beltBody, C.belt, 2, 0.7);
  g.save(); g.clip(S.beltBody);
  g.strokeStyle = P.grade.c('#6c5b6e'); g.lineWidth = 3;
  const off = bt.offset % 26;
  for (let x = L.beltX0 - 30 + off; x < L.beltX1 + 30; x += 26) { g.beginPath(); g.moveTo(x, L.beltTop + 4); g.lineTo(x + 4, L.beltTop + 18); g.stroke(); }
  g.restore();
  for (const x of [L.beltX0 - 1, L.beltX1 + 1]) {
    g.save(); g.translate(x, L.beltTop + 11); g.rotate(bt.offset / 10);
    P.fill(blob(0, 0, 10, 10, 'roll' + x, 0.03, 18), '#9b8a92', 1, 0.5);
    g.strokeStyle = P.grade.c('#5a4e56'); g.lineWidth = 2.4; g.beginPath(); g.moveTo(-7, 0); g.lineTo(7, 0); g.moveTo(0, -7); g.lineTo(0, 7); g.stroke();
    g.restore();
  }
  // lever box
  P.fill(S.leverBox, C.teal, 2, 0.8);
  const run = bt.run > 0.5;
  P.fill(blob(698, 1404, 7, 7, 'lamp', 0.03, 16), run ? '#7ee07a' : '#e2564a', 0, 0.2, { raw: true });
  drawGlow(g, 698, 1404, 26, run ? '126,224,122' : '226,86,74', 0.5);
  const a = lerp(-0.7, 0.75, lev);
  g.save(); g.translate(698, 1372); g.rotate(a);
  P.fill(rrect(-3, -40, 6, 40, 3, 'leverArm'), '#5a5058', 1, 0.5);
  P.fill(blob(0, -42, 8, 8, 'knob', 0.03, 16), '#d6453a', 1, 0.5);
  g.restore();
}

/** Roller: pole from base (hands) to the frame under the head; head is a vertical cylinder. */
export function drawRoller(P, r, col) {
  const g = P.g, [bx, by] = r.base, [hx, hy] = r.head;
  const fx = hx - 30, fy = hy + 62; // frame corner under the head
  const dx = fx - bx, dy = fy - by, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
  // telescoping sections
  const secs = [[0, Math.min(len, 230), 6.5, '#8f7a6a'], [Math.min(len, 220), Math.min(len, 230 + (len - 230) * 0.5), 5, '#a99484'], [Math.min(len, 225 + (len - 230) * 0.5), len, 3.8, '#c0ad9c']];
  for (const [a, b, w, c] of secs) {
    if (b <= a) continue;
    const p = new Path2D(), nx = -uy * w, ny = ux * w;
    p.moveTo(bx + ux * a + nx, by + uy * a + ny); p.lineTo(bx + ux * b + nx, by + uy * b + ny); p.lineTo(bx + ux * b - nx, by + uy * b - ny); p.lineTo(bx + ux * a - nx, by + uy * a - ny); p.closePath();
    P.fill(p, c, 1, 0.4);
  }
  // frame
  g.save(); g.strokeStyle = P.grade.c('#5a5058'); g.lineWidth = 5; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, hy - 64); g.lineTo(hx, hy - 64); g.moveTo(fx, fy); g.lineTo(hx, hy + 64); g.stroke(); g.restore();
  // head
  const head = rrect(hx - 23, hy - 60, 46, 120, 14, 'rhead' + col);
  P.fill(head, col, 2, 0.8, { raw: false });
  g.save(); g.clip(head);
  g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 4;
  for (let k = 0; k < 3; k++) { const u = ((r.spin / 6 + k / 3) % 1 + 1) % 1, x = hx - 23 + 46 * (0.5 - 0.5 * Math.cos(u * Math.PI)); g.beginPath(); g.moveTo(x, hy - 60); g.lineTo(x, hy + 60); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(hx - 14, hy - 56, 7, 112);
  g.restore();
}

export function drawCrate(P, S, j) {
  const g = P.g;
  g.save(); g.translate(j.crateDx, 0);
  P.fill(S.crate, C.crate, 2, 0.9);
  P.fill(S.crateSlats, C.crateDark, 0, 0.5);
  P.fill(S.crateFrame, C.crateDark, 1, 0.6);
  // stencilled star
  g.save(); g.translate((L.crate.x0 + L.crate.x1) / 2, 1444); g.scale(13, 13); P.fill(S.starInner, '#6d3e24', 0, 0.3); g.restore();
  g.restore();
}

export function drawJar(P, S, t, j, remaining) {
  const g = P.g;
  const place = () => { g.translate(j.cx, j.cy); g.rotate(j.rot); g.translate(-j.side * j.w / 2, 0); };
  g.save(); place();
  // stars inside
  const glow = 0.5 + 0.2 * Math.sin(t * 3);
  drawGlow(g, 0, -40, 70, '255,214,110', 0.35 * glow * (remaining / 16));
  for (let i = 0; i < Math.round(remaining); i++) {
    const s = S.jarStars[i];
    g.save(); g.translate(s.x, s.y); g.rotate(s.a + Math.sin(t * 2 + i) * 0.1); g.scale(s.r, s.r);
    P.fill(S.starPaths[i % S.starPaths.length], '#ffd65a', 0, 0.3, { raw: true });
    g.restore();
  }
  // glass
  P.fill(S.jarBody, C.glass, 2, 0.4, { alpha: 0.42, shadowK: 0.5 });
  g.save(); g.strokeStyle = P.grade.c('#93bfc9', 0.8); g.lineWidth = 2.5; g.stroke(S.jarBody); g.restore();
  g.save(); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.roundRect(-24, -70, 7, 54, 4); g.fill(); g.restore();
  P.fill(S.label, '#f3e6c8', 1, 0.7, { alpha: 0.95 });
  g.save(); g.translate(0, -43); g.scale(10, 10); P.fill(S.starInner, '#e9a92e', 0, 0.2); g.restore();
  P.fill(S.jarLip, C.glass, 1, 0.3, { alpha: 0.7 });
  if (j.cork.on) P.fill(S.cork, '#b67a4c', 2, 0.8);
  g.restore();
  if (!j.cork.on) { g.save(); g.translate(j.cork.x, j.cork.y); g.rotate(j.cork.rot); g.translate(0, 101); P.fill(S.cork, '#b67a4c', 2, 0.8); g.restore(); }
}

export function drawBucket(P, S, x, y, col) {
  const g = P.g;
  g.save(); g.translate(x, y);
  P.fill(S.bucket, '#b9b2aa', 2, 0.7);
  P.fill(cutPoly([[-21, -36], [21, -36], [20, -26], [8, -24], [6, -12], [2, -24], [-12, -26], [-14, -18], [-17, -26], [-20.5, -27]], 'drip' + col, 0.3, 5), col, 0, 0.6);
  P.fill(S.bucketRim, '#8f8780', 1, 0.5);
  g.save(); g.strokeStyle = P.grade.c('#5d5650'); g.lineWidth = 2; g.beginPath(); g.arc(0, -40, 20, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.restore();
  g.restore();
}

export function drawStarPiece(P, S, path, x, y, size, rot, a = 1) {
  const g = P.g;
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(size, size);
  g.globalAlpha = a;
  P.fill(path, '#ffd24f', 1, 0.5, { raw: true, shadowK: 0.6 });
  g.scale(0.5, 0.5); P.fill(S.starInner, '#fff0b0', 0, 0.2, { raw: true });
  g.restore();
}

export function sparkle(g, x, y, r, a, rot = 0) {
  if (a <= 0.01) return;
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = Math.min(1, a);
  g.fillStyle = '#fff6d6';
  g.beginPath();
  g.moveTo(0, -r); g.quadraticCurveTo(r * 0.12, -r * 0.12, r, 0); g.quadraticCurveTo(r * 0.12, r * 0.12, 0, r); g.quadraticCurveTo(-r * 0.12, r * 0.12, -r, 0); g.quadraticCurveTo(-r * 0.12, -r * 0.12, 0, -r);
  g.fill();
  g.restore();
}

/** Flying + landed stars. phase 'sky' draws landed ones (behind clouds/hills), 'air' draws the ones in flight. */
export function drawStars(P, S, t, phase) {
  const g = P.g;
  for (const s of STARS) {
    const st = starAt(s, t);
    if (!st) continue;
    if (phase === 'sky' && !st.landed) continue;
    if (phase === 'air' && st.landed) continue;
    const tw = st.landed ? 1 + 0.12 * Math.sin(t * s.tw * 2 + s.phase) : 1;
    if (phase === 'air') {
      // trail
      for (let k = 1; k <= 8; k++) {
        const u = Math.max(0, st.e - k * 0.028);
        const q = starAt(s, s.launch + 0.0001 + (s.arrive - s.launch) * invOut(u));
        if (!q) break;
        sparkle(g, q.x, q.y, s.size * (0.75 - k * 0.07), (1 - k / 9) * 0.8, k);
      }
      drawGlow(g, st.x, st.y, s.size * 3.2, '255,220,130', 0.55);
    } else {
      drawGlow(g, st.x, st.y, s.size * 2.6, '255,226,150', 0.28 * tw);
    }
    drawStarPiece(P, S, S.starPaths[s.i], st.x, st.y, s.size * st.scale * tw, st.rot);
    if (st.landed) {
      const gl = Math.max(0, Math.sin(t * s.tw + s.phase * 3) - 0.75) * 4;
      sparkle(g, st.x, st.y, s.size * 2.2 * gl, gl * 0.8, 0);
    }
  }
  if (phase === 'air') {
    // glitter shed along the paths
    for (const s of STARS) {
      const r = rng('gl' + s.i);
      for (let k = 0; k < 9; k++) {
        const born = s.launch + (k / 9) * (s.arrive - s.launch) + r() * 0.05, life = 0.6 + r() * 0.5, age = t - born;
        const vx = (r() - 0.5) * 60, vy = -20 + r() * 50, ph = r() * TAU;
        if (age < 0 || age > life) continue;
        const q = starAt(s, born);
        if (!q) continue;
        const x = q.x + vx * age, y = q.y + vy * age + 30 * age * age;
        sparkle(g, x, y, 4 + 5 * (1 - age / life), (1 - age / life) * (0.6 + 0.4 * Math.sin(age * 30 + ph)), ph);
      }
    }
  }
}
const invOut = (e) => 1 - Math.cbrt(1 - clamp(e)); // inverse of outCubic

export function drawPopBurst(P, t) {
  const u = prog(t, T.pop, T.pop + 0.6);
  if (u <= 0 || u >= 1) return;
  const g = P.g, [mx, my] = STARS[0].p0;
  drawGlow(g, mx, my, 160 + 120 * u, '255,236,170', 0.9 * (1 - u));
  const r = rng('burst');
  for (let i = 0; i < 22; i++) {
    const a = -Math.PI * 0.95 + r() * Math.PI * 1.1, sp = 120 + r() * 260, d = sp * E.outCubic(u);
    sparkle(g, mx + Math.cos(a) * d, my + Math.sin(a) * d, 5 + r() * 8, (1 - u) * 1.2, a);
  }
}

export function drawMachineRoom(P, S, t, ang, needle) {
  const g = P.g;
  P.fill(S.room, C.room, 0, 0.8);
  const sh = g.createLinearGradient(0, 1500, 0, 1600);
  sh.addColorStop(0, 'rgba(20,8,16,0.55)'); sh.addColorStop(1, 'rgba(20,8,16,0)');
  for (const gd of S.gears) {
    const ratio = 165 / gd.r, sgn = gd.x === 362 || gd.x === 1000 ? -1 : 1;
    g.save(); g.translate(gd.x, gd.y); g.rotate(sgn * ang * ratio + gd.x);
    P.fill(gd.path, gd.col, 3, 0.8, { rule: 'evenodd' });
    g.restore();
    P.fill(blob(gd.x, gd.y, gd.r * 0.16, gd.r * 0.16, 'cap' + gd.x, 0.03, 20), shade(gd.col, -50), 1, 0.5);
  }
  g.save(); g.fillStyle = sh; g.fillRect(-500, 1500, 2080, 100); g.restore();
  P.fill(S.pipe, C.pipe, 3, 0.7);
  P.fill(S.flanges, shade(C.pipe, -24), 1, 0.5);
  P.fill(S.vpipe, C.pipe, 2, 0.6);
  P.fill(S.gaugeRing, C.brass, 2, 0.6);
  P.fill(S.gaugeFace, '#efe3c8', 0, 0.5);
  g.save(); g.translate(560, 1662);
  g.strokeStyle = P.grade.c('#7a3a3a'); g.lineWidth = 2;
  for (let i = 0; i <= 8; i++) { const a = -2.4 + (i / 8) * 4.8; g.beginPath(); g.moveTo(Math.sin(a) * 30, -Math.cos(a) * 30); g.lineTo(Math.sin(a) * 36, -Math.cos(a) * 36); g.stroke(); }
  g.rotate(-2.0 + needle * 3.6);
  P.fill(cutPoly([[-3, 4], [0, -32], [3, 4]], 'needle', 0.1, 4), '#c8402f', 1, 0.2);
  g.restore();
  // steam puffs from a valve
  for (let i = 0; i < 4; i++) {
    const per = 1.6, u = ((t + i * 0.4) % per) / per;
    const x = 905 + u * 40, y = 1512 - u * 70, r = 8 + u * 22, a = Math.min(1, u * 5) * (1 - u) * 0.7;
    if (a > 0.02) P.fill(blob(x, y, r, r * 0.85, 'steam' + i, 0.05, 20), C.cream, 1, 0.4, { alpha: a, shadowK: a });
  }
}
