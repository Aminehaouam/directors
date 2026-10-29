// The ticket: tucked under the right page -> slides out -> unfolds -> grows
// into the base of a miniature London -> opens into a map of the next leg.
// Local units: unfolded ticket is 520 x 150, centred on its root node.
'use strict';
const G = require('../geo');
const { makeArt } = require('../art');
const { ORIGIN: J } = require('./journal');

const TW = 520, TH = 150, HW = TW / 2, HH = TH / 2;
const STAGE = { x: 540, y: 1290, scale: 1.5 };
const MAP_TOP = -225, MAP_BOTTOM = 175; // map extents in ticket-local units
const START = { x: 905, y: 958, rotation: -0.052 };
const FOLDED = { x: 690, y: 1300 };
// Map geography (ticket-local coordinates).
const LONDON = [-14, -122], PARIS = [62, 140];

// Ticket outline with perforation notches at x = 130 (top and bottom).
function outline(x0 = -HW, x1 = HW, notch = true) {
  const r = 10, nr = 11, nx = 130;
  const pts = [];
  pts.push([x0 + r, -HH]);
  if (notch && nx > x0 && nx < x1) { pts.push([nx - nr, -HH]); G.arcPts(nx, -HH, nr, Math.PI, 0, 10).slice(1, -1).forEach((p) => pts.push(p)); pts.push([nx + nr, -HH]); }
  pts.push([x1 - r, -HH]); G.arcPts(x1 - r, -HH + r, r, -Math.PI / 2, 0, 5).slice(1).forEach((p) => pts.push(p));
  pts.push([x1, HH - r]); G.arcPts(x1 - r, HH - r, r, 0, Math.PI / 2, 5).slice(1).forEach((p) => pts.push(p));
  if (notch && nx > x0 && nx < x1) { pts.push([nx + nr, HH]); G.arcPts(nx, HH, nr, 0, -Math.PI, 10).slice(1, -1).forEach((p) => pts.push(p)); pts.push([nx - nr, HH]); }
  pts.push([x0 + r, HH]); G.arcPts(x0 + r, HH - r, r, Math.PI / 2, Math.PI, 5).slice(1).forEach((p) => pts.push(p));
  pts.push([x0, -HH + r]); G.arcPts(x0 + r, -HH + r, r, Math.PI, Math.PI * 1.5, 5).slice(1).forEach((p) => pts.push(p));
  return G.poly(pts);
}
const mirror = (d) => G.mapPath(d, (x, y) => [-x, y]);

// Small Big Ben pictogram (used on the stub and as the London map marker).
function benIcon(A, parent, name, x, base, h, color) {
  const w = h * 0.22;
  const d = G.poly([[x - w / 2, base], [x - w / 2, base - h * 0.62], [x - w * 0.62, base - h * 0.62], [x - w * 0.62, base - h * 0.78],
    [x - w / 2, base - h * 0.78], [x, base - h], [x + w / 2, base - h * 0.78], [x + w * 0.62, base - h * 0.78], [x + w * 0.62, base - h * 0.62], [x + w / 2, base - h * 0.62], [x + w / 2, base]]);
  A.piece(parent, name, d, color);
  A.piece(parent, name + 'Face', G.circle(x, base - h * 0.7, w * 0.3), 'ticket');
}

// Everything printed on the inside of the map, in ticket-local coords,
// shifted by -oy so it can sit inside a panel node placed at y = oy.
function mapArt(A, parent, oy, S, tag) {
  const P = A.P; const px = A.px;
  const T = (d) => G.translate(d, 0, -oy);
  A.piece(parent, `${tag}Paper`, T(G.rrect(-HW, MAP_TOP, TW, MAP_BOTTOM - MAP_TOP, 0)), 'sea');
  // Latitude / longitude grid.
  if (!px) for (let i = -3; i <= 3; i++) {
    A.line(parent, `${tag}Lon${i}`, T(`M${i * 80} ${MAP_TOP} L${i * 80 + 24} ${MAP_BOTTOM}`), 'seaLine', 1.4, { opacity: 0.7 });
    if (i > -3 && i < 3) A.line(parent, `${tag}Lat${i}`, T(`M${-HW} ${i * 70 - 20} L${HW} ${i * 70 - 28}`), 'seaLine', 1.4, { opacity: 0.7 });
  }
  // Southern England.
  const eng = G.smooth([[-300, MAP_TOP - 20], [300, MAP_TOP - 20], [300, -78], [248, -64], [214, -36], [176, -22], [124, -28], [72, -22], [22, -30], [-28, -22], [-80, -32], [-128, -24], [-170, -8], [-214, 8], [-250, 18], [-300, 14]], true, 0.6);
  A.piece(parent, `${tag}Eng`, T(eng), 'land', { stroke: px ? null : 'landEdge', strokeW: 2.2 });
  // Thames estuary cutting in towards London.
  A.piece(parent, `${tag}Estuary`, T(G.smooth([[300, -92], [240, -84], [160, -104], [80, -114], [LONDON[0] + 10, LONDON[1] + 2], [80, -108], [160, -96], [240, -74], [300, -70]], true, 0.7)), 'sea');
  // Northern France.
  const fra = G.smooth([[-300, MAP_BOTTOM + 30], [-300, 96], [-236, 84], [-204, 92], [-172, 82], [-138, 94], [-104, 86], [-92, 56], [-70, 48], [-60, 78], [-28, 90], [12, 82], [44, 70], [84, 60], [124, 50], [164, 38], [204, 26], [236, 16], [300, 10], [300, MAP_BOTTOM + 30]], true, 0.6);
  A.piece(parent, `${tag}Fra`, T(fra), 'land', { stroke: px ? null : 'landEdge', strokeW: 2.2 });
  // The Seine.
  A.line(parent, `${tag}Seine`, T(G.smooth([[12, 84], [28, 104], [20, 120], [44, 132], [PARIS[0], PARIS[1]], [96, 150], [120, 170], [150, 182]], false)), 'sea', px ? 4 : 3.2, { cap: 1 });
  // Wave marks in the Channel.
  const waves = [[-170, 40], [-40, 30], [120, 6], [210, -150], [-220, -150]];
  waves.forEach(([wx, wy], i) => A.line(parent, `${tag}Wave${i}`, T(px ? `M${wx} ${wy} L${wx + 24} ${wy}` : `M${wx} ${wy} q8 -6 16 0 t16 0 t16 0`), 'seaLine', px ? 4 : 2, { cap: 1 }));
  // Compass rose.
  const cr = [206, -176];
  A.piece(parent, `${tag}Rose`, T(G.poly([[cr[0], cr[1] - 26], [cr[0] + 6, cr[1] - 6], [cr[0] + 26, cr[1]], [cr[0] + 6, cr[1] + 6], [cr[0], cr[1] + 26], [cr[0] - 6, cr[1] + 6], [cr[0] - 26, cr[1]], [cr[0] - 6, cr[1] - 6]])), 'navy');
  A.piece(parent, `${tag}RoseN`, T(G.poly([[cr[0], cr[1] - 26], [cr[0] + 6, cr[1] - 6], [cr[0] - 6, cr[1] - 6]])), 'accent');
  // Place names, set like an old chart.
  A.label(parent, `${tag}Channel`, px ? 'SEA' : 'LA MANCHE', -150, 62 - oy, px ? 32 : 13, 'seaLine', { role: 'label', tracking: 400 });
  A.label(parent, `${tag}London`, px ? 'LDN' : 'London', LONDON[0] + 16, LONDON[1] - 10 - oy, px ? 32 : 26, 'ink', { role: px ? 'label' : 'hand' });
}

function buildTicket(file, S) {
  const ab = file.artboard('Ticket', { width: 1080, height: 1920, clip: false });
  const A = makeArt(ab, S); const P = A.P; const px = A.px;
  const fx = ab.node('fx', null, { x: 0, y: 4 });

  // Clip: only the part of the ticket that has left the page is visible.
  const clipFrame = ab.node('clipFrame', null, J);
  const clipRect = ab.shape('clipRect', clipFrame, {});
  ab.path(clipRect, G.rrect(-3000, 323, 6000, 9000, 0));
  const group = ab.node('ticketGroup', null, {});
  ab.clip(group, clipRect);

  const root = ab.node('ticketRoot', group, { ...START, scale: 1 });

  // ---- Map flaps (folded away under the ticket at first) ----------------
  const panels = [];
  for (const [name, y0, y1, hingeY] of [['mapTop', MAP_TOP, -HH, -HH], ['mapBottom', HH, MAP_BOTTOM, HH]]) {
    const node = ab.node(name, root, { y: hingeY, scaleY: 0.001, opacity: 0 });
    const rr = name === 'mapTop' ? [10, 10, 0, 0] : [0, 0, 10, 10];
    const panelD = G.translate(G.rrect(-HW, y0, TW, y1 - y0, rr), 0, -hingeY);
    const clipShape = ab.shape(name + 'Clip', node, {}); ab.path(clipShape, panelD);
    const content = ab.node(name + 'Content', node, {});
    ab.clip(content, clipShape);
    mapArt(A, content, hingeY, S, name);
    const shade = A.piece(node, name + 'Shade', panelD, '#1A1208', { opacity: 0.45 });
    panels.push({ node, shade });
  }

  // ---- Ticket, left half ----------------------------------------------------
  A.piece(root, 'baseL', outline(-HW, 0.5, false), 'ticket');
  const bandL = ab.node('bandL', root, {});
  A.piece(bandL, 'bandLShape', G.rrect(-HW, -HH, HW + 0.5, 30, [10, 0, 0, 0]), 'accent');
  const typeL = ab.node('typeL', root, {});
  A.label(typeL, 'tPass', 'TRAVEL PASS', -238, -54, 13, 'ticket', { role: 'label', tracking: px ? 0 : 320 });
  A.label(typeL, 'tCity', 'LONDON', -240, px ? 22 : 18, px ? 32 : 54, 'navy', { role: 'title', tracking: px ? 0 : 20 });
  if (!px) {
    A.label(typeL, 'tFromL', 'DATE', -240, 46, 10, 'inkSoft', { role: 'label', tracking: 200 });
    A.label(typeL, 'tFromV', '12 MAY', -240, 66, 15, 'navy', { role: 'label', tracking: 60 });
    A.label(typeL, 'tClassL', 'CLASS', -150, 46, 10, 'inkSoft', { role: 'label', tracking: 200 });
    A.label(typeL, 'tClassV', 'FIRST', -150, 66, 15, 'navy', { role: 'label', tracking: 60 });
    A.label(typeL, 'tGateL', 'PLATFORM', -70, 46, 10, 'inkSoft', { role: 'label', tracking: 200 });
    A.label(typeL, 'tGateV', '7', -70, 66, 15, 'navy', { role: 'label', tracking: 60 });
  } else {
    A.piece(typeL, 'tRule', G.rrect(-240, 44, 200, 4, 0), 'ticketShade');
    A.piece(typeL, 'tRule2', G.rrect(-240, 56, 120, 4, 0), 'ticketShade');
  }

  // ---- Flap: right half, folded over the left half at first -----------------
  const flap = ab.node('flap', root, { scaleX: -1 });
  const front = ab.node('frontFlap', flap, { opacity: 0 });
  const flapD = outline(-0.5, HW, true);
  const flapClip = ab.shape('flapClip', front, {}); ab.path(flapClip, flapD);
  const flapBody = ab.node('flapBody', front, {});
  ab.clip(flapBody, flapClip);
  A.piece(flapBody, 'baseF', G.rrect(-1, -HH - 2, HW + 2, TH + 4, 0), 'ticket');
  const bandF = ab.node('bandF', flapBody, {});
  A.piece(bandF, 'bandFShape', G.rrect(-1, -HH - 2, HW + 2, 32, 0), 'accent');
  // Perforation.
  let perf = '';
  for (let y = -58; y <= 60; y += px ? 12 : 9) perf += (px ? G.rrect(128, y - 2, 4, 4, 0) : G.circle(130, y, 2.3)) + ' ';
  A.piece(flapBody, 'perf', perf, 'ticketShade');
  const typeF = ab.node('typeF', flapBody, {});
  A.label(typeF, 'tNo', px ? '0427' : 'No. 0427', 14, -54, 12, 'ticket', { role: 'label', tracking: px ? 0 : 200 });
  if (!px) A.label(typeF, 'tSeatL', 'SEAT', 14, 4, 10, 'inkSoft', { role: 'label', tracking: 200 });
  A.label(typeF, 'tSeatV', '4A', 14, px ? 36 : 44, px ? 32 : 40, 'accent', { role: 'title' });
  const stub = ab.node('stub', flapBody, {});
  benIcon(A, stub, 'stubBen', 200, 30, 68, 'navy');
  let bars = ''; const r = G.rng(5); let bx = 152;
  while (bx < 248) { const w = px ? 4 : 1.5 + Math.floor(r() * 3) * 1.4; bars += G.rrect(bx, 42, w, 20, 0) + ' '; bx += w + (px ? 4 : 2 + r() * 2.5); }
  A.piece(stub, 'barcode', bars, 'navy');

  const back = ab.node('backFace', flap, { scaleX: -1, opacity: 1 });
  A.piece(back, 'baseB', mirror(flapD), 'ticketBack');
  const backPat = ab.node('backPattern', back, {});
  for (let k = 0; k < 10; k++) {
    const y = -60 + k * 13.3; const pts = [];
    for (let i = 0; i <= 26; i++) pts.push([-252 + i * 9.6, y + Math.sin(i * 0.7 + k * 0.9) * 3.5]);
    if (px) { if (k % 2 === 0) A.piece(backPat, `guil${k}`, G.rrect(-244, Math.round(y / 4) * 4, 232, 4, 0), 'accentSoft'); }
    else A.line(backPat, `guil${k}`, G.smooth(pts, false), 'accentSoft', 1.2, { opacity: 0.8 });
  }
  A.piece(back, 'admitOval', G.rrect(-206, -22, 152, 44, 22), 'ticketBack', { stroke: 'accent', strokeW: 2 });
  A.label(back, 'admit', 'ADMIT ONE', -130, 6, 13, 'accent', { role: 'label', anchor: 'middle', tracking: px ? 0 : 300 });
  const flapShade = A.piece(flap, 'flapShade', flapD, '#1A1208', { opacity: 0 });

  // ---- London face: the ticket becomes the ground of the city ---------------
  const faceL = ab.node('faceLondon', root, { opacity: 0 });
  const wipe = ab.shape('wipe', faceL, {});
  const wipeRect = ab.add('Rectangle', wipe, { x: -HW - 4, y: 0, width: 0.01, height: TH + 8, originX: 0, originY: 0.5 });
  const faceBody = ab.node('faceLondonBody', faceL, {});
  ab.clip(faceBody, wipe);
  const tY = (x) => 6 + Math.sin(x / 70) * 6; // Thames centre-line
  const top = [], bot = [];
  for (let x = -HW; x <= HW; x += 26) { top.push([x, tY(x) - 14]); bot.unshift([x, tY(x) + 16]); }
  A.piece(faceBody, 'thames', G.smooth(top.concat(bot), true, 0.8), 'thames');
  A.line(faceBody, 'bankN', G.smooth(top, false, 0.8), 'ticketShade', px ? 4 : 3);
  A.line(faceBody, 'bankS', G.smooth([...bot].reverse(), false, 0.8), 'ticketShade', px ? 4 : 3);
  [[-190, 6], [-40, 10], [120, 2], [210, 8]].forEach(([x, dy], i) => A.line(faceBody, `ripple${i}`, `M${x} ${tY(x) + dy - 4} L${x + 34} ${tY(x + 34) + dy - 4}`, 'thamesLight', px ? 4 : 2.4, { cap: 1 }));
  // Streets and parks, drawn lightly like a printed plan.
  const streets = ['M-250 -22 L250 -30', 'M-250 52 L250 46', 'M-150 -44 L-130 -8', 'M40 -44 L70 -14', 'M-60 30 L-90 75', 'M170 30 L200 75'];
  streets.forEach((d, i) => A.line(faceBody, `street${i}`, d, 'ticketShade', px ? 4 : 2.2));
  A.piece(faceBody, 'park1', G.ellipse(-205, -12, 34, 9), 'park');
  A.piece(faceBody, 'park2', G.ellipse(70, 60, 44, 9), 'park');

  // ---- Map, centre panel (replaces the ticket face when it opens) -----------
  const faceM = ab.node('faceMap', root, { opacity: 0 });
  const mClip = ab.shape('mapClip', faceM, {}); ab.path(mClip, outline(-HW, HW, true));
  const mBody = ab.node('faceMapBody', faceM, {});
  ab.clip(mBody, mClip);
  mapArt(A, mBody, 0, S, 'mapMid');
  // Fold creases.
  const creases = ab.node('creases', root, { opacity: 0 });
  A.piece(creases, 'creaseT', G.rrect(-HW, -HH - 1.5, TW, 3, 0), '#000000', { opacity: 0.12 });
  A.piece(creases, 'creaseB', G.rrect(-HW, HH - 1.5, TW, 3, 0), '#000000', { opacity: 0.12 });
  A.piece(creases, 'creaseV', G.rrect(-1, MAP_TOP, 2, MAP_BOTTOM - MAP_TOP, 0), '#000000', { opacity: 0.08 });
  if (!px) A.piece(creases, 'creaseHi', G.rrect(-HW, HH + 1.5, TW, 2, 0), '#FFFFFF', { opacity: 0.35 });

  // ---- Map overlay: London marker, route, Paris pin, tower, label ----------
  const overlay = ab.node('mapOverlay', root, {});
  const lm = ab.node('londonMark', overlay, { x: LONDON[0], y: LONDON[1], scale: 0.001 });
  A.piece(lm, 'londonDot', G.circle(0, 0, 9), 'navy');
  A.piece(lm, 'londonDotIn', G.circle(0, 0, 4), 'ticket');
  const dots = [];
  const bz = (t) => { const p0 = [LONDON[0] + 6, LONDON[1] + 12], c1 = [110, -60], c2 = [-36, 56], p3 = [PARIS[0] - 4, PARIS[1] - 30]; const u = 1 - t; return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * p3[k]); };
  const N = 15;
  for (let i = 0; i < N; i++) {
    const [x, y] = bz((i + 0.5) / N);
    const d = ab.node(`dotN${i}`, overlay, { x, y, scale: 0.001 });
    A.piece(d, `dot${i}`, px ? G.rrect(-4, -4, 8, 8, 0) : G.circle(0, 0, 4.2), 'route');
    dots.push(d);
  }
  // Eiffel Tower, popping up beside Paris.
  const eif = ab.node('eiffel', overlay, { x: PARIS[0] - 62, y: PARIS[1] + 24, scaleY: 0.001, opacity: 0 });
  const eh = 92;
  A.piece(eif, 'eifLegs', `M-26 0 C-18 -18 -10 -40 -6 -${eh * 0.62} L6 -${eh * 0.62} C10 -40 18 -18 26 0 L16 0 C10 -10 4 -14 0 -14 C-4 -14 -10 -10 -16 0 Z`, 'navy');
  A.piece(eif, 'eifTop', G.poly([[-6, -eh * 0.62], [-3, -eh * 0.94], [0, -eh], [3, -eh * 0.94], [6, -eh * 0.62]]), 'navy');
  A.piece(eif, 'eifDeck1', G.rrect(-17, -eh * 0.3, 34, px ? 4 : 4, 0), 'navy');
  A.piece(eif, 'eifDeck2', G.rrect(-10, -eh * 0.62 - 3, 20, 4, 0), 'navy');
  // Pin.
  const pin = ab.node('parisPin', overlay, { x: PARIS[0], y: PARIS[1], opacity: 0 });
  const pinNode = ab.node('parisPinDrop', pin, { y: -40 });
  A.piece(pinNode, 'pinShape', 'M0 0 C-6 -12 -16 -20 -16 -32 C-16 -42 -9 -49 0 -49 C9 -49 16 -42 16 -32 C16 -20 6 -12 0 0 Z', 'pin');
  A.piece(pinNode, 'pinDot', G.circle(0, -32, 6), 'ticket');
  // Destination label.
  const tag = ab.node('parisTag', overlay, { x: PARIS[0] + 22, y: PARIS[1] - 30, scale: 0.6, opacity: 0, rotation: -0.08 });
  A.piece(tag, 'tagShape', G.poly([[0, 0], [14, -18], [128, -18], [128, 18], [14, 18]]), 'label');
  A.piece(tag, 'tagHole', G.circle(16, 0, 4), 'map');
  A.label(tag, 'tagText', 'PARIS', 72, px ? 12 : 9, px ? 32 : 26, 'ticket', { role: 'title', anchor: 'middle', tracking: px ? 0 : 120 });

  // ---------------------------------------------------------------- motion --
  // Slide out of the journal (baked bezier path so it leaves along the page's
  // own "down" before curving to centre).
  const slide = ab.animation('slide', { duration: 1.15 });
  const p0 = [START.x, START.y], c1 = [START.x - 8, START.y + 150], c2 = [FOLDED.x + 30, FOLDED.y - 90], p3 = [FOLDED.x, FOLDED.y];
  const xs = [], ys = [];
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeSlide = (t) => 1 - Math.pow(1 - easeIO(Math.min(1, t * 1.0)), 1.6);
  for (let i = 0; i <= 34; i++) {
    const t = i / 34; const u = easeSlide(t); const v = 1 - u;
    xs.push([t * 1.15, v * v * v * p0[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p3[0], null]);
    ys.push([t * 1.15, v * v * v * p0[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p3[1], null]);
  }
  slide.key(root, 'x', xs).key(root, 'y', ys);
  slide.key(root, 'rotation', [[0, START.rotation, 'inOut'], [0.62, 0.07, 'inOut'], [1.15, 0]]);
  slide.key(root, 'scaleX', [[0, 1, 'outSoft'], [0.45, 1.07, 'inOut'], [1.15, 1]]);
  slide.key(root, 'scaleY', [[0, 1, 'outSoft'], [0.45, 1.07, 'inOut'], [1.15, 1]]);
  slide.key(fx, 'y', [[0, 4, 'outSoft'], [0.4, 30, 'inOut'], [1.1, 6]]);
  slide.key(clipFrame, 'y', [[0, J.y, 'hold'], [0.95, J.y - 4000, 'hold']]);

  // Unfold, then grow into the city.
  const unfold = ab.animation('unfold', { duration: 1.3 });
  const X = 0.275; // flap edge-on
  unfold.key(flap, 'scaleX', [[0, -1, 'inOut'], [0.55, 1]]);
  unfold.key(flap, 'scaleY', [[0, 1, 'inOut'], [X, 1.06, 'inOut'], [0.55, 1]]);
  unfold.key(back, 'opacity', [[0, 1, 'hold'], [X, 0, 'hold']]);
  unfold.key(front, 'opacity', [[0, 0, 'hold'], [X, 1, 'hold']]);
  unfold.key(flapShade, 'opacity', [[0, 0, 'in'], [X, 0.32, 'out'], [0.55, 0]]);
  unfold.key(root, 'x', [[0, FOLDED.x, 'inOut'], [0.55, STAGE.x]]);
  unfold.key(root, 'y', [[0, FOLDED.y, 'hold'], [0.55, FOLDED.y, 'inOut'], [1.2, STAGE.y]]);
  unfold.key(root, 'scaleX', [[0, 1, 'hold'], [0.55, 1, 'outBackSmall'], [1.2, STAGE.scale]]);
  unfold.key(root, 'scaleY', [[0, 1, 'hold'], [0.55, 1, 'outBackSmall'], [1.2, STAGE.scale]]);
  unfold.key(fx, 'y', [[0, 6, 'inOut'], [X, 16, 'inOut'], [0.55, 8, 'inOut'], [0.85, 18, 'inOut'], [1.3, 6]]);
  unfold.key(typeL, 'opacity', [[0, 1, 'hold'], [0.6, 1, 'inOut'], [0.85, 0]]);
  unfold.key(typeF, 'opacity', [[0, 1, 'hold'], [0.6, 1, 'inOut'], [0.85, 0]]);
  // The printed band and stub step back so the city reads cleanly; the
  // notches and perforation stay, so it is still recognisably the ticket.
  for (const n of [bandL, bandF, stub]) unfold.key(n, 'opacity', [[0, 1, 'hold'], [0.62, 1, 'inOut'], [0.95, 0]]);
  unfold.key(faceL, 'opacity', [[0, 0, 'hold'], [0.68, 0, 'linear'], [0.75, 1]]);
  unfold.key(wipeRect, 'width', [[0, 0.01, 'hold'], [0.68, 0.01, 'outSoft'], [1.3, TW + 8]]);

  // Open into the map.
  const map = ab.animation('map', { duration: 1.7 });
  map.key(faceL, 'opacity', [[0, 1, 'inOut'], [0.35, 0]]);
  map.key(faceM, 'opacity', [[0, 0, 'inOut'], [0.35, 1]]);
  map.key(panels[0].node, 'scaleY', [[0, 0.001, 'hold'], [0.12, 0.001, 'outBackSmall'], [0.72, 1]]);
  map.key(panels[0].node, 'opacity', [[0, 0, 'hold'], [0.12, 1, 'hold']]);
  map.key(panels[1].node, 'opacity', [[0, 0, 'hold'], [0.28, 1, 'hold']]);
  map.key(panels[0].shade, 'opacity', [[0, 0.45, 'hold'], [0.12, 0.45, 'outSoft'], [0.7, 0]]);
  map.key(panels[1].node, 'scaleY', [[0, 0.001, 'hold'], [0.28, 0.001, 'outBackSmall'], [0.85, 1]]);
  map.key(panels[1].shade, 'opacity', [[0, 0.45, 'hold'], [0.28, 0.45, 'outSoft'], [0.85, 0]]);
  map.key(creases, 'opacity', [[0, 0, 'hold'], [0.6, 0, 'inOut'], [0.9, 1]]);
  map.key(fx, 'y', [[0, 6, 'inOut'], [0.4, 14, 'inOut'], [0.95, 6]]);
  map.key(lm, 'scaleX', [[0, 0.001, 'hold'], [0.72, 0.001, 'outBack'], [0.92, 1]]);
  map.key(lm, 'scaleY', [[0, 0.001, 'hold'], [0.72, 0.001, 'outBack'], [0.92, 1]]);
  dots.forEach((d, i) => {
    const t0 = 0.8 + i * 0.03;
    d && map.key(d, 'scaleX', [[0, 0.001, 'hold'], [t0, 0.001, 'outBack'], [t0 + 0.12, 1]]);
    d && map.key(d, 'scaleY', [[0, 0.001, 'hold'], [t0, 0.001, 'outBack'], [t0 + 0.12, 1]]);
  });
  map.key(pin, 'opacity', [[0, 0, 'hold'], [1.22, 0, 'linear'], [1.28, 1]]);
  map.key(pinNode, 'y', [[0, -40, 'hold'], [1.22, -40, 'in'], [1.36, 0, 'out'], [1.43, -7, 'in'], [1.5, 0]]);
  map.key(eif, 'opacity', [[0, 0, 'hold'], [1.3, 1, 'hold']]);
  map.key(eif, 'scaleY', [[0, 0.001, 'hold'], [1.3, 0.001, 'outBack'], [1.56, 1]]);
  map.key(tag, 'opacity', [[0, 0, 'hold'], [1.36, 0, 'linear'], [1.44, 1]]);
  map.key(tag, 'scaleX', [[0, 0.6, 'hold'], [1.36, 0.6, 'outBack'], [1.62, 1]]);
  map.key(tag, 'scaleY', [[0, 0.6, 'hold'], [1.36, 0.6, 'outBack'], [1.62, 1]]);
  map.key(tag, 'rotation', [[0, -0.08, 'hold'], [1.36, -0.08, 'outBack'], [1.66, 0]]);

  const sm = ab.stateMachine('TicketSM');
  const tSlide = sm.trigger('slide'), tUnfold = sm.trigger('unfold'), tMap = sm.trigger('map');
  const L = sm.layer('main');
  const sS = L.anim(slide), sU = L.anim(unfold), sM = L.anim(map);
  L.transition(L.entry, sS, { trigger: tSlide });
  L.transition(sS, sU, { trigger: tUnfold });
  L.transition(sU, sM, { trigger: tMap });
  return ab;
}

module.exports = { buildTicket, STAGE, TW, TH, LONDON, PARIS };
