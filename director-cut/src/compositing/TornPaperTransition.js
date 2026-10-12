import { clamp01 } from '../animations/easing.js';
import { setShadow, clearShadow } from '../components/util.js';
import { noise1 } from '../animations/rng.js';

function boundary(ctx, p, seed) {
  const { W, H } = ctx, pts = [];
  const x0 = (W + 320) * (1 - p) - 320 + 0 * p;
  for (let y = -60; y <= H + 60; y += 10) pts.push([x0 - (y - H / 2) * 0.32 + (noise1(y / 38, seed) - 0.5) * 34 + (noise1(y / 9, seed + 4) - 0.5) * 9, y]);
  return pts;
}
/** Torn paper: the outgoing scene tears along a ragged diagonal and the torn-off part falls away, revealing the next scene. p = paper-eased. */
export function tornPaperTransition(ctx, g, A, B, p, { seed = 3 } = {}) {
  const { W, H } = ctx;
  if (p >= 1) { g.drawImage(B.canvas, 0, 0, W, H); return; }
  g.drawImage(B.canvas, 0, 0, W, H);
  if (p <= 0) { g.drawImage(A.canvas, 0, 0, W, H); return; }
  const pts = boundary(ctx, p, seed);
  const left = new Path2D(), right = new Path2D();
  left.moveTo(-100, -100); pts.forEach((q) => left.lineTo(q[0], q[1])); left.lineTo(-100, H + 100); left.closePath();
  right.moveTo(W + 2400, -100); pts.forEach((q) => right.lineTo(q[0], q[1])); right.lineTo(W + 2400, H + 100); right.closePath();
  const edge = new Path2D(); pts.forEach((q, i) => (i ? edge.lineTo(q[0], q[1]) : edge.moveTo(q[0], q[1])));
  // the torn-off part falls away to the right and down
  const e = p * p * (1.4 - 0.4 * p), dx = 2500 * e, dy = 520 * e, rot = 0.16 * e;
  g.save();
  g.translate(W * 0.6 + dx, H * 0.3 + dy); g.rotate(rot); g.translate(-W * 0.6, -H * 0.3);
  setShadow(ctx, g, { dx: 12, dy: 16, blur: 30, color: 'rgba(23,24,20,0.5)' });
  g.fillStyle = ctx.P.aged; g.fill(right); clearShadow(g);
  g.save(); g.clip(right); g.drawImage(A.canvas, 0, 0, W, H);
  g.strokeStyle = 'rgba(244,233,210,0.95)'; g.lineWidth = 14; g.lineJoin = 'round'; g.stroke(edge);
  g.restore(); g.restore();
  // the remaining sheet, with a white fibre edge and a shadow on the layer beneath
  g.save();
  setShadow(ctx, g, { dx: 8, dy: 10, blur: 22, color: 'rgba(23,24,20,0.55)' });
  g.fillStyle = ctx.P.aged; g.fill(left); clearShadow(g);
  g.save(); g.clip(left); g.drawImage(A.canvas, 0, 0, W, H);
  g.strokeStyle = 'rgba(244,233,210,0.95)'; g.lineWidth = 12; g.lineJoin = 'round'; g.stroke(edge);
  g.strokeStyle = 'rgba(201,173,124,0.8)'; g.lineWidth = 3; g.stroke(edge);
  g.restore(); g.restore();
}
