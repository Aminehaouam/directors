// Sequence 4 (14-22.7 s): shot 7 footage becomes engraving and then a cage; shot 8 the bars become architecture; shot 9 footage C under a ghost grid.
import { ParallaxCamera } from '../components/ParallaxCamera.js';
import { drawGround, drawPaper } from '../components/PaperLayer.js';
import { mountedFrame } from '../components/MountedFrame.js';
import { engraveImage, hatchRect } from '../components/EngravingHatch.js';
import { inkLine, inkText, arrowPts } from '../components/InkStroke.js';
import { stampText } from '../components/StampText.js';
import { drawVignette } from '../components/Vignette.js';
import { setShadow, clearShadow, rgba } from '../components/util.js';
import { measure } from '../typography/text.js';
import { clamp01, lerp } from '../animations/easing.js';

const T8 = 17.2, T9 = 20.1;
const PH = { x: 222, y: 138, w: 1476, h: 804 };           // photo area in the mounted frame (world coords)
const SP = 24, PIER = 6, FLOOR = 134, BX = PH.x + 12;     // bar spacing, a pier every 6th bar, floor height
const LIT = { m: 4, row: 3 };                              // the one lit window: between pier 4 and 5, floor row 3
const litCell = () => ({ x0: BX + LIT.m * PIER * SP, x1: BX + (LIT.m + 1) * PIER * SP, y0: PH.y + LIT.row * FLOOR, y1: PH.y + (LIT.row + 1) * FLOOR });

export function needs(t) {
  if (t < T8 + 0.01) return [{ slot: 'B', time: 1.2 }];
  if (t >= T9) return [{ slot: 'C', time: t - T9 }];
  return [];
}

function cameraFor(ctx, t) {
  const c = litCell(), cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2;
  const cam = new ParallaxCamera(ctx);
  if (t < T8) return cam.set(ParallaxCamera.move(ctx, t, 14.0, T8, 1.0, 1.04), 0, 0);
  const cp = ctx.easeFns.camera(clamp01((t - T8) / (T9 - T8)));
  return cam.set(lerp(1.04, 2.7, cp), (960 - cx) * cp, (540 - cy) * cp);
}

function retreated(ctx, g, r, t) {
  const hatch = ctx.ev('cage-hatch').p, grid = ctx.ev('cage-grid').p;
  g.fillStyle = ctx.P.ivory; g.fillRect(r.x, r.y, r.w, r.h);
  const imgA = 1 - 0.88 * hatch;
  g.save(); g.globalAlpha = imgA; g.filter = `grayscale(1) sepia(0.6) contrast(1.1) blur(${0.5 * ctx.S}px)`;
  g.drawImage(ctx.fx.snapshot('B', 1.2, r.w, r.h), r.x, r.y, r.w, r.h);
  g.restore();
  if (hatch > 0) { // crosshatch engraving sweeps in diagonally with a ragged edge
    const eng = engraveImage(ctx, 'B1.2', ctx.fx.snapshot('B', 1.2, r.w, r.h), r.w, r.h, { spacing: 9 });
    g.save(); g.beginPath();
    const sweep = hatch * 1.25 * (r.w + r.h);
    g.moveTo(r.x, r.y);
    for (let k = 0; k <= 24; k++) { const yy = (k / 24) * r.h, edge = sweep - yy * 1.0 + Math.sin(k * 1.9) * 26; g.lineTo(r.x + Math.max(0, Math.min(r.w, edge)), r.y + yy); }
    g.lineTo(r.x, r.y + r.h); g.closePath(); g.clip();
    g.drawImage(eng, r.x, r.y, r.w, r.h);
    g.restore();
  }
  drawBars(ctx, g, grid, 0);
}

/** The cage: fine vertical ink bars (+ rails) over the photograph; bars draw top-to-bottom, left-to-right, completing as p reaches 1. */
function drawBars(ctx, g, grid, walls) {
  if (grid <= 0) return;
  const n = Math.floor((PH.w - 24) / SP), P = ctx.P;
  g.save(); g.strokeStyle = P.ink; g.lineCap = 'butt';
  for (let i = 0; i < n; i++) {
    const p = clamp01(grid * 1.6 - (i / n) * 0.6);
    if (p <= 0) continue;
    const x = BX + i * SP, pier = i % PIER === 0, w = pier ? 3.4 + 30 * walls : 3.2 + 0.8 * walls;
    if (pier && walls > 0) continue; // piers are drawn as walls
    g.lineWidth = w; g.globalAlpha = 0.92;
    g.beginPath(); g.moveTo(x, PH.y + 8); g.lineTo(x, PH.y + 8 + (PH.h - 16) * p); g.stroke();
  }
  const rp = clamp01((grid - 0.5) * 2);
  g.globalAlpha = 1; g.lineWidth = 6 + 6 * walls;
  inkLine(ctx, g, [[PH.x + 4, PH.y + 8], [PH.x + PH.w - 4, PH.y + 8]], rp, { width: 6, color: P.ink });
  inkLine(ctx, g, [[PH.x + 4, PH.y + PH.h - 8], [PH.x + PH.w - 4, PH.y + PH.h - 8]], rp, { width: 6, color: P.ink });
  g.restore();
}

/** Piers, floor slabs and windows: the bars thickened into walls. */
function drawArchitecture(ctx, g, cam, walls) {
  const P = ctx.P, c = litCell();
  const pierW = 3.4 + 30 * walls, slabH = 4 + 14 * walls;
  const nBars = Math.floor((PH.w - 24) / SP);
  // visible world bounds under the current camera
  const [sx0] = cam.project(0, 0), z = 1 + (cam.zoom - 1);
  const vis = (x0, y0, x1, y1) => { const a = cam.project(x0, y0), b = cam.project(x1, y1); return b[0] > -50 && a[0] < ctx.W + 50 && b[1] > -50 && a[1] < ctx.H + 50; };
  // windows (dark glass) between piers and slabs
  const rows = Math.floor(PH.h / FLOOR);
  for (let m = 0; m * PIER < nBars; m++) {
    const x0 = BX + m * PIER * SP + pierW / 2, x1 = BX + (m + 1) * PIER * SP - pierW / 2;
    for (let r = 0; r < rows; r++) {
      const y0 = PH.y + r * FLOOR + slabH / 2, y1 = PH.y + (r + 1) * FLOOR - slabH / 2;
      if (!vis(x0, y0, x1, y1)) continue;
      const lit = m === LIT.m && r === LIT.row;
      g.save();
      g.fillStyle = lit ? P.ivory : P.shadow; g.globalAlpha = lit ? clamp01(walls * 3) : 0.9 * clamp01(walls * 2.2);
      g.fillRect(x0, y0, x1 - x0, y1 - y0);
      if (lit) { // warm glow + mullions
        const gr = g.createRadialGradient((x0 + x1) / 2, (y0 + y1) / 2, 4, (x0 + x1) / 2, (y0 + y1) / 2, 150);
        gr.addColorStop(0, rgba(P.brass, 0.55)); gr.addColorStop(1, rgba(P.brass, 0));
        g.globalAlpha = clamp01(walls * 3); g.fillStyle = gr; g.fillRect(x0 - 150, y0 - 150, x1 - x0 + 300, y1 - y0 + 300);
      }
      g.restore();
      // mullions
      g.save(); g.strokeStyle = P.ink; g.lineWidth = 3 + walls; g.globalAlpha = 0.9;
      g.beginPath(); for (let k = 1; k < PIER; k++) { const x = BX + (m * PIER + k) * SP; g.moveTo(x, y0); g.lineTo(x, y1); } g.stroke(); g.restore();
    }
  }
  // piers
  if (walls > 0) {
    for (let m = 0; m * PIER <= nBars; m++) {
      const x = BX + m * PIER * SP - pierW / 2;
      if (!vis(x, PH.y, x + pierW, PH.y + PH.h)) continue;
      const path = new Path2D(); path.rect(x, PH.y + 8, pierW, PH.h - 16);
      g.save(); setShadow(ctx, g, { dx: 6, dy: 4, blur: 8, color: 'rgba(23,24,20,0.45)' });
      g.fillStyle = P.aged; g.fill(path); clearShadow(g);
      hatchRect(ctx, g, { rect: [x + pierW * 0.45, PH.y + 8, pierW * 0.55, PH.h - 16], angle: 68, spacing: 5, width: 1, color: P.ink, alpha: 0.4, seed: m + 3, clip: path });
      g.strokeStyle = P.ink; g.lineWidth = 2.4; g.stroke(path); g.restore();
    }
    // floor slabs
    for (let r = 0; r <= rows; r++) {
      const y = PH.y + r * FLOOR - slabH / 2;
      if (!vis(PH.x, y, PH.x + PH.w, y + slabH)) continue;
      const path = new Path2D(); path.rect(PH.x + 4, y, PH.w - 8, slabH);
      g.save(); setShadow(ctx, g, { dx: 4, dy: 8, blur: 10, color: 'rgba(23,24,20,0.5)' });
      g.fillStyle = P.aged; g.fill(path); clearShadow(g);
      hatchRect(ctx, g, { rect: [PH.x, y + slabH * 0.5, PH.w, slabH * 0.5], angle: 0, spacing: 4, width: 0.9, color: P.ink, alpha: 0.4, seed: r + 50, clip: path });
      g.strokeStyle = P.ink; g.lineWidth = 2.4; g.stroke(path); g.restore();
    }
  }
}

function worldFrame(ctx, g, t, cam) {
  const P = ctx.P, walls = ctx.ev('walls-grow').p;
  g.save(); cam.apply(g, 'back'); drawGround(ctx, g, 'parchment', 1.3); g.restore();
  // engraved backplate: faint hatching at the edges of the page
  hatchRect(ctx, g, { rect: [0, 0, 150, ctx.H], angle: 60, spacing: 8, width: 1, color: P.olive, alpha: 0.25, seed: 4 });
  hatchRect(ctx, g, { rect: [ctx.W - 150, 0, 150, ctx.H], angle: 120, spacing: 8, width: 1, color: P.olive, alpha: 0.25, seed: 5 });
  g.save(); cam.apply(g, 'mid');
  const fr = { x: 192, y: 108, w: 1536, h: 864 };
  mountedFrame(ctx, g, { ...fr, mat: [30, 30, 30, 30], border: 1, marks: 1, seed: 12, content: (g) => {
    // the frame's local origin is its top-left corner; everything below is authored in world (screen) coordinates
    g.translate(-fr.x, -fr.y);
    const r = PH;
    if (t < T8 + 0.3) retreated(ctx, g, r, t);
    else { g.fillStyle = P.ivory; g.fillRect(r.x, r.y, r.w, r.h); drawBars(ctx, g, 1, walls); }
    if (walls > 0 || t >= T8 + 0.3) drawArchitecture(ctx, g, cam, walls);
  } });
  g.restore();
}

function shot9(ctx, g, t) {
  const gh = ctx.ev('ghost-grid'), st = ctx.ev('stamp-obedience'), P = ctx.P;
  ctx.fx.draw(g, 'C', t - T9, { x: 0, y: 0, w: 1920, h: 1080 }, { safe: { x: 96, y: 72, w: 1728, h: 936 } });
  g.save(); g.globalAlpha = 0.2 * gh.p; g.strokeStyle = P.ink; g.lineWidth = 3;
  g.beginPath(); for (let x = 12; x < 1920; x += SP) { g.moveTo(x, 0); g.lineTo(x, 1080); } g.stroke();
  g.lineWidth = 8; g.beginPath(); g.moveTo(0, 6); g.lineTo(1920, 6); g.moveTo(0, 1074); g.lineTo(1920, 1074); g.stroke(); g.restore();
  if (st.p > 0) stampText(ctx, g, 'obedience', 'OBEDIENCE', 960, 560, st.p, { size: 150, rot: -0.03, seed: 17 });
}

function note(ctx, g, t, cam) {
  const n = ctx.ev('note-yourlife'), P = ctx.P;
  if (n.p <= 0) return;
  const c = litCell(), [wx, wy] = cam.project(c.x0 + 6, (c.y0 + c.y1) / 2 + 24), [ax, ay] = cam.project(c.x0 - 150, c.y0 - 28);
  const tw = measure(ctx, 'annotation', 'your life', 56).width, w = tw + 70, h = 92;
  g.save();
  g.translate(ax - 40, ay); g.rotate(-0.045);
  drawPaper(ctx, g, { x: -w, y: -h / 2, w, h, tex: 'ivory', rough: 2.5, seed: 21, shadow: true, dx: 6, dy: 9, blur: 10, shadowAlpha: 0.5, alpha: clamp01(n.p * 3) });
  inkText(ctx, g, 'note-yourlife', 'your life', -w + 35, 20, n.p, { role: 'annotation', size: 56, color: P.ink });
  g.restore();
  inkLine(ctx, g, arrowPts(ax - 36, ay + 20, wx - 14, wy, 0.22), clamp01((n.p - 0.35) / 0.65), { width: 3, color: P.ink, alpha: 0.85 });
}

export function update(t, ctx) {
  const g = ctx.g;
  if (t >= T9) { shot9(ctx, g, t); return; }
  const cam = cameraFor(ctx, t);
  worldFrame(ctx, g, t, cam);
  drawVignette(ctx, g, 0.4);
  note(ctx, g, t, cam);
}
