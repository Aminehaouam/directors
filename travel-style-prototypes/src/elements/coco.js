// Coco, the minimalist African Grey. No eyes, no face: emotion lives in
// posture, head angle, wings, tail and how she lands.
// Rig (feet at the origin, facing left):
//   cocoPath > facing > flyScale > hop > squash > { feet, bodyTilt > { tail, wingFar, body, head, wingFront } }
// Two state-machine layers: 'path' moves her through the scene, 'pose'
// plays fly / land / idle / nudge / cheer on top.
'use strict';
const G = require('../geo');
const { makeArt } = require('../art');

const LAND = { x: 262, y: 1546 };
const BASE_SCALE = 1.2;

function buildCoco(file, S) {
  const ab = file.artboard('Coco', { width: 1080, height: 1920, clip: false });
  const A = makeArt(ab, S); const px = A.px;
  const fx = ab.node('fx', null, { x: 0, y: 150 });

  const path = ab.node('cocoPath', null, { x: 1400, y: 420 });
  const facing = ab.node('facing', path, { scaleX: 1 });
  const flyScale = ab.node('flyScale', facing, { scale: BASE_SCALE * 1.16 });
  const hop = ab.node('hop', flyScale, {});
  const squash = ab.node('squash', hop, {});
  // Art is authored around pivots; each node sits on its pivot.
  const at = (d, px0, py0) => G.translate(d, -px0, -py0);

  const feet = ab.node('feet', squash, { opacity: 0 });
  A.piece(feet, 'footL', G.rrect(-14, -8, 12, 8, px ? 0 : 4), 'feet');
  A.piece(feet, 'footR', G.rrect(6, -8, 12, 8, px ? 0 : 4), 'feet');

  const tilt = ab.node('bodyTilt', squash, { rotation: -0.85 });

  // Short red tail, peeking out low behind the body.
  const tail = ab.node('tail', tilt, { x: 30, y: -26, rotation: -0.35 });
  A.piece(tail, 'tailShape', at('M22 -34 C40 -26 58 -14 70 0 C72 6 66 10 60 6 C46 -2 30 -10 16 -18 Z', 30, -26), 'tail');
  A.piece(tail, 'tailStripe', at('M30 -22 C44 -14 56 -6 66 4 C56 4 44 -2 28 -12 Z', 30, -26), 'tailShade');

  const wingFar = ab.node('wingFar', tilt, { x: 4, y: -100, rotation: -1.6, opacity: 1, scale: 1.15 });
  A.piece(wingFar, 'wingFarShape', at('M-4 -104 C18 -112 46 -86 54 -48 C57 -34 55 -24 50 -18 C34 -32 12 -56 2 -78 C-3 -88 -8 -98 -4 -104 Z', 4, -100), 'wingFar');

  // Body: an upright egg, leaning forward, with a round head on top.
  const bodyD = G.rotatePath(G.ellipse(4, -62, 50, 64), -0.32, 4, -62);
  A.piece(tilt, 'body', bodyD, 'body');
  if (!px) A.piece(tilt, 'bodyShade', G.rotatePath('M52 -86 C60 -54 52 -22 24 -4 C6 4 -16 2 -30 -8 C2 -10 34 -26 44 -60 C47 -70 49 -80 52 -86 Z', -0.32, 4, -62), 'bodyShade', { opacity: 0.85 });
  else A.piece(tilt, 'bodyShade', 'M40 -84 L52 -56 L44 -28 L24 -8 L-12 -4 L-12 -12 L20 -20 L36 -44 Z', 'bodyShade');
  if (S.id === 'B') A.piece(tilt, 'chestPaper', G.rotatePath('M-44 -76 C-46 -48 -32 -22 -6 -10 C-24 -30 -30 -52 -28 -80 Z', -0.32, 4, -62), 'bodyLight');

  const head = ab.node('head', tilt, { x: -10, y: -112, rotation: 0.45 });
  A.piece(head, 'headShape', at(G.circle(-22, -128, 35), -10, -112), 'body');
  if (!px) A.piece(head, 'headLight', at('M-46 -146 C-34 -162 -10 -164 4 -150 C-12 -155 -30 -152 -46 -140 Z', -10, -112), 'bodyLight', { opacity: 0.9 });
  // Bold hooked beak.
  A.piece(head, 'beakLower', at('M-52 -112 C-60 -110 -64 -102 -62 -94 C-56 -96 -52 -102 -48 -108 Z', -10, -112), 'beak');
  A.piece(head, 'beakUpper', at('M-46 -146 C-66 -148 -84 -132 -82 -108 C-81 -98 -76 -92 -72 -98 C-71 -110 -64 -118 -50 -114 C-46 -122 -44 -136 -46 -146 Z', -10, -112), 'beak');
  if (!px) A.piece(head, 'beakHi', at('M-50 -142 C-62 -142 -72 -134 -76 -124 C-68 -132 -60 -136 -50 -136 Z', -10, -112), 'bodyLight', { opacity: 0.6 });

  // Folded wing lying along the back.
  const wing = ab.node('wingFront', tilt, { x: -2, y: -102, rotation: -1.9, scale: 1.3 });
  A.piece(wing, 'wingShape', at('M-8 -106 C14 -114 44 -90 52 -52 C55 -36 54 -24 50 -14 C34 -26 12 -50 0 -74 C-6 -86 -12 -100 -8 -106 Z', -2, -102), 'wing');
  if (!px) {
    A.line(wing, 'feather1', at('M10 -76 C24 -64 36 -48 44 -30', -2, -102), 'wingShade', 2.2, { cap: 1 });
    A.line(wing, 'feather2', at('M2 -92 C20 -84 34 -70 46 -50', -2, -102), 'wingShade', 2.2, { cap: 1 });
  } else A.piece(wing, 'feather1', at('M8 -80 L44 -36 L40 -32 L4 -76 Z', -2, -102), 'wingShade');

  // ------------------------------------------------------------ flight path --
  const FL = 2.6, TOUCH = 1.9;
  const pts = [[1240, 420], [860, 520], [560, 700], [330, 980], [236, 1330], [LAND.x, LAND.y]];
  // Catmull-Rom spline, sampled densely, then re-timed by arc length so she
  // decelerates smoothly into the landing.
  const spline = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < 40; k++) {
      const t = k / 40, t2 = t * t, t3 = t2 * t;
      spline.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  spline.push([LAND.x, LAND.y]);
  const cum = [0]; for (let i = 1; i < spline.length; i++) cum.push(cum[i - 1] + Math.hypot(spline[i][0] - spline[i - 1][0], spline[i][1] - spline[i - 1][1]));
  const total = cum[cum.length - 1];
  const at_s = (s) => { let i = cum.findIndex((c) => c >= s); if (i <= 0) return spline[Math.max(0, i)]; const u = (s - cum[i - 1]) / (cum[i] - cum[i - 1]); return [spline[i - 1][0] + (spline[i][0] - spline[i - 1][0]) * u, spline[i - 1][1] + (spline[i][1] - spline[i - 1][1]) * u]; };
  const prog = (u) => 1 - Math.pow(1 - u, 2.1);
  const xs = [], ys = [], rot = [];
  const STEP = 1 / 30;
  for (let t = 0; t <= TOUCH + 1e-6; t += STEP) {
    const u = Math.min(1, t / TOUCH);
    const [x, y] = at_s(prog(u) * total);
    const [x2, y2] = at_s(Math.min(total, prog(Math.min(1, u + 0.02)) * total));
    xs.push([t, x, null]); ys.push([t, y, null]);
    const ang = Math.atan2(y2 - y, x - x2); // heading, measured for a left-facing bird
    rot.push([t, Math.max(-0.45, Math.min(0.3, -ang * 0.45)) * (1 - Math.pow(u, 6)), null]);
  }
  const flight = ab.animation('flight', { duration: FL });
  // After touchdown: a small hop-turn to face the ticket.
  xs.push([2.05, LAND.x, 'inOut'], [2.35, LAND.x + 6, null]);
  ys.push([2.05, LAND.y, 'out'], [2.19, LAND.y - 26, 'in'], [2.35, LAND.y, null]);
  flight.key(path, 'x', xs).key(path, 'y', ys).key(path, 'rotation', rot.concat([[2.4, 0, null]]));
  flight.key(facing, 'scaleX', [[0, 1, 'hold'], [2.06, 1, 'inOut'], [2.32, -1]]);
  flight.key(flyScale, 'scaleX', [[0, BASE_SCALE * 1.16, 'hold'], [1.45, BASE_SCALE * 1.16, 'inOut'], [TOUCH, BASE_SCALE]]);
  flight.key(flyScale, 'scaleY', [[0, BASE_SCALE * 1.16, 'hold'], [1.45, BASE_SCALE * 1.16, 'inOut'], [TOUCH, BASE_SCALE]]);
  flight.key(fx, 'y', [[0, 150, 'inOut'], [1.3, 120, 'in'], [TOUCH, 5, 'hold'], [2.05, 5, 'out'], [2.19, 22, 'in'], [2.35, 5]]);

  // -------------------------------------------------------------------- poses --
  const fly = ab.animation('fly', { duration: 0.42, loop: 'loop' });
  fly.key(wing, 'rotation', [[0, -1.9, 'inOut'], [0.2, 0.35, 'inOut'], [0.42, -1.9]]);
  fly.key(wing, 'scaleY', [[0, 1.3, 'inOut'], [0.1, 1.05, 'inOut'], [0.2, 1.3, 'inOut'], [0.31, 1.05, 'inOut'], [0.42, 1.3]]);
  fly.key(wingFar, 'rotation', [[0, -1.55, 'inOut'], [0.22, 0.2, 'inOut'], [0.42, -1.55]]);
  fly.key(hop, 'y', [[0, 0, 'inOut'], [0.22, -7, 'inOut'], [0.42, 0]]);
  fly.key(tilt, 'rotation', [[0, -0.85, 'inOut'], [0.22, -0.8, 'inOut'], [0.42, -0.85]]);
  fly.key(head, 'rotation', [[0, 0.45, 'inOut'], [0.22, 0.5, 'inOut'], [0.42, 0.45]]);

  const land = ab.animation('land', { duration: 0.62 });
  land.key(wing, 'rotation', [[0, -1.9, 'out'], [0.12, -2.15, 'inOut'], [0.42, 0.05, 'inOut'], [0.62, 0]]);
  land.key(wing, 'scaleX', [[0, 1.3, 'hold'], [0.14, 1.3, 'inOut'], [0.45, 1]]);
  land.key(wing, 'scaleY', [[0, 1.3, 'hold'], [0.14, 1.3, 'inOut'], [0.45, 1]]);
  land.key(wingFar, 'rotation', [[0, -1.55, 'out'], [0.12, -1.9, 'inOut'], [0.4, -0.2]]);
  land.key(wingFar, 'opacity', [[0, 1, 'hold'], [0.22, 1, 'linear'], [0.36, 0]]);
  land.key(tilt, 'rotation', [[0, -0.85, 'out'], [0.14, 0.16, 'inOut'], [0.34, -0.08, 'inOut'], [0.55, 0]]);
  land.key(tail, 'rotation', [[0, -0.35, 'out'], [0.16, 0.3, 'inOut'], [0.4, -0.1, 'inOut'], [0.6, 0]]);
  land.key(feet, 'opacity', [[0, 0, 'linear'], [0.06, 1]]);
  land.key(hop, 'y', [[0, 0, 'hold'], [0.62, 0]]);
  land.key(squash, 'scaleY', [[0, 1, 'hold'], [0.13, 1, 'out'], [0.21, 0.8, 'inOut'], [0.36, 1.06, 'inOut'], [0.52, 1]]);
  land.key(squash, 'scaleX', [[0, 1, 'hold'], [0.13, 1, 'out'], [0.21, 1.15, 'inOut'], [0.36, 0.96, 'inOut'], [0.52, 1]]);
  land.key(head, 'rotation', [[0, 0.45, 'inOut'], [0.2, -0.12, 'inOut'], [0.5, 0]]);

  const idle = ab.animation('idle', { duration: 2.4, loop: 'loop' });
  idle.key(squash, 'scaleY', [[0, 1, 'inOut'], [1.2, 1.025, 'inOut'], [2.4, 1]]);
  idle.key(squash, 'scaleX', [[0, 1, 'inOut'], [1.2, 0.99, 'inOut'], [2.4, 1]]);
  idle.key(head, 'rotation', [[0, 0, 'inOut'], [0.5, -0.2, 'hold'], [1.5, -0.2, 'inOut'], [1.9, 0.06, 'inOut'], [2.4, 0]]);
  idle.key(tail, 'rotation', [[0, 0, 'hold'], [1.6, 0, 'out'], [1.7, -0.22, 'inOut'], [1.95, 0]]);
  idle.key(wing, 'rotation', [[0, 0, 'inOut'], [1.2, -0.04, 'inOut'], [2.4, 0]]);
  idle.key(tilt, 'rotation', [[0, 0, 'inOut'], [1.2, 0.02, 'inOut'], [2.4, 0]]);
  idle.key(tilt, 'x', [[0, 0, 'hold'], [2.4, 0]]);

  // Two pushes with the head; the second one does it.
  const nudge = ab.animation('nudge', { duration: 0.9 });
  nudge.key(tilt, 'rotation', [[0, 0, 'inOut'], [0.18, -0.36, 'out'], [0.3, -0.12, 'inOut'], [0.47, -0.48, 'out'], [0.66, 0.06, 'inOut'], [0.9, 0]]);
  nudge.key(tilt, 'x', [[0, 0, 'inOut'], [0.18, -10, 'out'], [0.3, -3, 'inOut'], [0.47, -16, 'out'], [0.7, 0]]);
  nudge.key(head, 'rotation', [[0, -0.2, 'inOut'], [0.18, -0.34, 'out'], [0.3, -0.18, 'inOut'], [0.47, -0.4, 'out'], [0.7, 0.1, 'inOut'], [0.9, 0]]);
  nudge.key(wing, 'rotation', [[0, 0, 'inOut'], [0.16, -0.3, 'inOut'], [0.32, -0.1, 'inOut'], [0.47, -0.42, 'inOut'], [0.75, 0]]);
  nudge.key(tail, 'rotation', [[0, 0, 'inOut'], [0.18, 0.2, 'inOut'], [0.47, 0.28, 'inOut'], [0.8, 0]]);
  nudge.key(squash, 'scaleY', [[0, 1, 'inOut'], [0.47, 0.95, 'out'], [0.62, 1.04, 'inOut'], [0.85, 1]]);
  nudge.key(squash, 'scaleX', [[0, 1, 'inOut'], [0.47, 1.04, 'out'], [0.62, 0.98, 'inOut'], [0.85, 1]]);

  const cheer = ab.animation('cheer', { duration: 1.05 });
  cheer.key(squash, 'scaleY', [[0, 1, 'inOut'], [0.12, 0.86, 'out'], [0.24, 1.1, 'inOut'], [0.44, 1, 'in'], [0.52, 0.86, 'out'], [0.7, 1.04, 'inOut'], [0.9, 1]]);
  cheer.key(squash, 'scaleX', [[0, 1, 'inOut'], [0.12, 1.1, 'out'], [0.24, 0.94, 'inOut'], [0.44, 1, 'in'], [0.52, 1.1, 'out'], [0.7, 0.98, 'inOut'], [0.9, 1]]);
  cheer.key(hop, 'y', [[0, 0, 'hold'], [0.12, 0, 'out'], [0.3, -46, 'in'], [0.5, 0, 'hold'], [1.05, 0]]);
  cheer.key(wing, 'rotation', [[0, 0, 'inOut'], [0.14, -1.6, 'inOut'], [0.22, 0.1, 'inOut'], [0.3, -1.6, 'inOut'], [0.38, 0.1, 'inOut'], [0.46, -1.3, 'inOut'], [0.7, 0]]);
  cheer.key(tail, 'rotation', [[0, 0, 'inOut'], [0.2, -0.35, 'inOut'], [0.6, 0.15, 'inOut'], [0.9, 0]]);
  cheer.key(head, 'rotation', [[0, 0, 'inOut'], [0.25, 0.22, 'inOut'], [0.7, 0.1, 'inOut'], [1.0, 0]]);
  cheer.key(tilt, 'rotation', [[0, 0, 'inOut'], [0.25, 0.1, 'inOut'], [0.7, 0, 'hold'], [1.05, 0]]);
  cheer.key(fx, 'y', [[0, 5, 'hold'], [0.12, 5, 'out'], [0.3, 30, 'in'], [0.5, 5]]);

  // ------------------------------------------------------------ state machine --
  const sm = ab.stateMachine('CocoSM');
  const tFly = sm.trigger('flyIn'), tLand = sm.trigger('land'), tNudge = sm.trigger('nudge'), tCheer = sm.trigger('cheer');
  const Lp = sm.layer('path');
  const sFlight = Lp.anim(flight);
  Lp.transition(Lp.entry, sFlight, { trigger: tFly });
  const L = sm.layer('pose');
  const sFly = L.anim(fly), sLand = L.anim(land), sIdle = L.anim(idle), sNudge = L.anim(nudge), sCheer = L.anim(cheer);
  L.transition(L.entry, sFly);
  L.transition(sFly, sLand, { trigger: tLand, mix: 90 });
  L.transition(sLand, sIdle, { exitTime: 1, mix: 120 });
  L.transition(sIdle, sNudge, { trigger: tNudge, mix: 120 });
  L.transition(sNudge, sIdle, { exitTime: 1, mix: 150 });
  L.transition(sIdle, sCheer, { trigger: tCheer, mix: 100 });
  L.transition(sCheer, sIdle, { exitTime: 1, mix: 150 });
  return ab;
}

module.exports = { buildCoco };
