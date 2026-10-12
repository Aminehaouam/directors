// Original engraved placeholder art for missing footage slots. Never a copy of any film frame.
import { hatchRect, stippleRect } from '../components/EngravingHatch.js';
import { hash2 } from '../animations/rng.js';
import { drawText } from '../typography/text.js';

const person = (g, x, y, h, color) => { // seated/standing bust silhouette, feet at y
  const w = h * 0.34;
  g.fillStyle = color; g.beginPath(); g.arc(x, y - h * 0.86, h * 0.1, 0, 6.2832); g.fill();
  g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x - w / 2, y - h * 0.62, x - w * 0.18, y - h * 0.7); g.lineTo(x + w * 0.18, y - h * 0.7); g.quadraticCurveTo(x + w / 2, y - h * 0.62, x + w / 2, y); g.closePath(); g.fill();
};

const STYLES = {
  monitor(ctx, g, w, h, t) {
    const P = ctx.P;
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2a1d14'); bg.addColorStop(1, P.shadow); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = P.walnut; g.fillRect(0, h * 0.78, w, h * 0.22);
    hatchRect(ctx, g, { rect: [0, h * 0.78, w, h * 0.22], angle: 3, spacing: 7, width: 1, color: P.ink, alpha: 0.5, seed: 4 });
    // monitor
    const mx = w * 0.3, my = h * 0.16, mw = w * 0.4, mh = h * 0.5;
    g.fillStyle = P.ink; g.fillRect(mx - 12, my - 12, mw + 24, mh + 24);
    g.fillStyle = P.greenDeep; g.fillRect(mx, my, mw, mh);
    g.save(); g.beginPath(); g.rect(mx, my, mw, mh); g.clip();
    g.fillStyle = P.green; g.globalAlpha = 0.75;
    const rowH = 15, off = (t * 46) % rowH;
    for (let r = -1; r < mh / rowH + 1; r++) { const k = Math.floor(r + t * 46 / rowH); const n = 2 + Math.floor(hash2(k, 1, 5) * 6); let xx = mx + 14 + (hash2(k, 2, 5) > 0.7 ? 28 : 0); for (let i = 0; i < n; i++) { const L = 14 + hash2(k, i + 3, 5) * 70; g.fillRect(xx, my + r * rowH - off + 4, L, 5); xx += L + 10; if (xx > mx + mw - 30) break; } }
    g.restore();
    const gl = g.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.42, w * 0.34); gl.addColorStop(0, 'rgba(120,200,138,0.16)'); gl.addColorStop(1, 'rgba(120,200,138,0)');
    g.fillStyle = gl; g.fillRect(0, 0, w, h);
    g.fillStyle = P.ink; g.fillRect(w * 0.47, my + mh + 12, w * 0.06, h * 0.1); g.fillRect(w * 0.38, my + mh + h * 0.1 + 6, w * 0.24, 12);
    person(g, w * 0.22, h * 0.9, h * 0.82, P.ink);
    hatchRect(ctx, g, { rect: [0, 0, w, h], angle: 50, spacing: 9, width: 1, color: P.ink, alpha: 0.18, seed: 2 });
  },
  corridor(ctx, g, w, h, t) {
    const P = ctx.P, vx = w * 0.5, vy = h * 0.46;
    g.fillStyle = P.aged; g.fillRect(0, 0, w, h);
    const walls = [[0, 0, vx - w * 0.07, vy - h * 0.05, 0, h, vx - w * 0.07, vy + h * 0.05], [w, 0, vx + w * 0.07, vy - h * 0.05, w, h, vx + w * 0.07, vy + h * 0.05]];
    g.strokeStyle = P.ink; g.lineWidth = 2;
    for (const [x0, y0, x1, y1, x2, y2, x3, y3] of walls) {
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x3, y3); g.lineTo(x2, y2); g.closePath(); g.fillStyle = 'rgba(119,117,87,0.35)'; g.fill(); g.stroke();
    }
    g.fillStyle = 'rgba(75,48,35,0.35)'; g.beginPath(); g.moveTo(0, h); g.lineTo(vx - w * 0.07, vy + h * 0.05); g.lineTo(vx + w * 0.07, vy + h * 0.05); g.lineTo(w, h); g.fill();
    for (let i = 0; i < 9; i++) { // floor lines and ceiling beams
      const u = ((i + (t * 0.35) % 1) / 9), s = Math.pow(u, 1.8), yy = vy + h * 0.05 + (h - vy - h * 0.05) * s;
      g.beginPath(); g.moveTo(vx - w * 0.07 - (w * 0.43) * s, yy); g.lineTo(vx + w * 0.07 + (w * 0.43) * s, yy); g.lineWidth = 1 + 2 * s; g.stroke();
      const cy = vy - h * 0.05 - (vy - h * 0.05) * s; g.beginPath(); g.moveTo(vx - w * 0.07 - (w * 0.43) * s, cy); g.lineTo(vx + w * 0.07 + (w * 0.43) * s, cy); g.stroke();
      for (const sd of [-1, 1]) { const dx = vx + sd * (w * 0.07 + w * 0.43 * s * 0.78), dw = w * 0.05 * (0.4 + s * 2), dh = h * 0.2 * (0.3 + s * 2.2); g.fillStyle = 'rgba(23,24,20,0.55)'; g.fillRect(dx - dw / 2, yy - dh, dw, dh); }
    }
    const u = 0.3 + 0.06 * t, fh = h * (0.16 + 0.14 * u), fy = vy + h * 0.12 + h * 0.2 * u;
    person(g, vx, fy, fh * 2.4, P.ink);
    hatchRect(ctx, g, { rect: [0, 0, w, h], angle: 45, spacing: 8, width: 1, color: P.ink, alpha: 0.16, seed: 6 });
  },
  office(ctx, g, w, h, t) {
    const P = ctx.P;
    g.fillStyle = P.aged; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 6; r++) {
      const s = 0.32 + r * 0.2, yy = h * 0.3 + r * h * 0.13 * (0.8 + r * 0.1), n = Math.round(9 / (0.5 + s * 0.8)), gap = w / (n + 0.4);
      for (let i = 0; i < n; i++) {
        const x = gap * (i + 0.7) + (r % 2) * gap * 0.25;
        g.fillStyle = P.ink; g.fillRect(x - 38 * s, yy - 20 * s, 76 * s, 46 * s * 0.6);
        g.fillStyle = P.greenDeep; g.fillRect(x - 33 * s, yy - 16 * s, 66 * s, 24 * s * 0.8);
        if (hash2(i, r, 3) > 0.12) person(g, x + (hash2(i, r, 4) - 0.5) * 8, yy + 74 * s, 150 * s, P.shadow);
        g.fillStyle = P.walnut; g.fillRect(x - 56 * s, yy + 24 * s, 112 * s, 8 * s);
      }
    }
    hatchRect(ctx, g, { rect: [0, 0, w, h], angle: 135, spacing: 8, width: 1, color: P.ink, alpha: 0.2, seed: 9 });
    stippleRect(ctx, g, { rect: [0, 0, w, h], count: 500, alpha: 0.35, seed: 12 });
  },
  pills(ctx, g, w, h, t) {
    const P = ctx.P;
    const bg = g.createRadialGradient(w / 2, h * 0.5, 10, w / 2, h * 0.5, w * 0.6); bg.addColorStop(0, '#3a2a1e'); bg.addColorStop(1, P.shadow); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h * 0.62);
    g.fillStyle = P.parchment; g.strokeStyle = P.ink; g.lineWidth = 3;
    g.beginPath(); g.ellipse(0, 0, w * 0.26, h * 0.26, 0, 0, 6.2832); g.fill(); g.stroke();
    for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(-w * 0.22 + i * w * 0.115, -h * 0.5, w * 0.085, h * 0.34, 14); g.fill(); g.stroke(); }
    g.beginPath(); g.roundRect(-w * 0.34, -h * 0.12, w * 0.15, h * 0.09, 14); g.fill(); g.stroke();
    hatchRect(ctx, g, { rect: [-w * 0.3, -h * 0.5, w * 0.6, h * 0.8], angle: 60, spacing: 7, width: 1, color: P.ink, alpha: 0.2, seed: 5 });
    for (const [px, col] of [[-w * 0.08, P.olive], [w * 0.08, P.ivory]]) { g.save(); g.translate(px, h * 0.02); g.rotate(-0.4); g.fillStyle = col; g.beginPath(); g.roundRect(-w * 0.05, -h * 0.045, w * 0.1, h * 0.09, h * 0.045); g.fill(); g.stroke(); g.beginPath(); g.moveTo(0, -h * 0.045); g.lineTo(0, h * 0.045); g.stroke(); g.restore(); }
    g.restore();
  },
};

/** Draw the stand-in art in a w x h box at the origin, then the SOURCE SHOT REQUIRED stamp (placed inside the safe area). */
export function drawStandIn(ctx, g, slot, rect, time, safe) {
  const style = ctx.cfg.footageSlots[slot].standInStyle;
  g.save();
  g.beginPath(); g.rect(rect.x, rect.y, rect.w, rect.h); g.clip();
  g.translate(rect.x, rect.y);
  STYLES[style](ctx, g, rect.w, rect.h, time);
  g.restore();
  // stamp
  const label = `SOURCE SHOT REQUIRED: ${slot}`;
  const sx = Math.max(rect.x + 26, safe ? safe.x : 0), sy = Math.min(rect.y + rect.h - 26, safe ? safe.y + safe.h : 1e9);
  g.save();
  g.font = `600 26px "Inter", sans-serif`; g.letterSpacing = `${0.08 * 26}px`;
  const tw = g.measureText(label).width;
  g.fillStyle = 'rgba(244,233,210,0.94)'; g.fillRect(sx - 12, sy - 34, tw + 18, 46);
  g.strokeStyle = ctx.P.ink; g.lineWidth = 2; g.strokeRect(sx - 12, sy - 34, tw + 18, 46);
  g.restore();
  drawText(ctx, g, `standin-${slot}`, label, sx - 3, sy - 2, { role: 'analytical', size: 26, upper: false, color: ctx.P.ink });
}
