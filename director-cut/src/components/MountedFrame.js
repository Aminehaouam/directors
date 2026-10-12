import { drawPaper } from './PaperLayer.js';
import { inkLine } from './InkStroke.js';
import { drawText } from '../typography/text.js';
import { setShadow, clearShadow } from './util.js';

/**
 * An archival photograph: aged mat, picture, brass border that draws on (p), corner marks and a label.
 * o: {x,y,w,h, mat:[l,t,r,b], border:p, marks:p, label, labelAlpha, rot, drawContent(g, rect)}
 */
export function mountedFrame(ctx, g, o) {
  const { x, y, w, h, mat = [36, 36, 36, 72], border = 1, marks = 1, label = null, labelP = 1, rot = 0, seed = 5, content, shadow = true, labelId = 'label' } = o;
  const P = ctx.P;
  g.save();
  g.translate(x + w / 2, y + h / 2); g.rotate(rot); g.translate(-w / 2, -h / 2);
  drawPaper(ctx, g, { x: 0, y: 0, w, h, tex: 'aged', rough: 1.6, seed, shadow, dx: 12, dy: 18, blur: 30, shadowAlpha: 0.45 });
  const px = mat[0], py = mat[1], pw = w - mat[0] - mat[2], ph = h - mat[1] - mat[3];
  g.save(); g.beginPath(); g.rect(px, py, pw, ph); g.clip();
  if (content) content(g, { x: px, y: py, w: pw, h: ph });
  // inner edge shadow so the print sits below the mat
  g.shadowColor = 'rgba(23,24,20,0.55)'; g.shadowBlur = 14 * ctx.S; g.shadowOffsetX = 3 * ctx.S; g.shadowOffsetY = 4 * ctx.S;
  g.strokeStyle = 'rgba(0,0,0,0.0001)'; g.lineWidth = 30; g.strokeRect(px - 15, py - 15, pw + 30, ph + 30);
  g.restore(); clearShadow(g);
  g.strokeStyle = 'rgba(23,24,20,0.5)'; g.lineWidth = 1.2; g.strokeRect(px, py, pw, ph);
  // brass border draws on around the picture
  const i = 10, bx = px - i, by = py - i, bw = pw + 2 * i, bh = ph + 2 * i;
  if (border > 0) {
    const perim = [[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh], [bx, by]];
    inkLine(ctx, g, perim, border, { width: 3.6, color: P.brass });
    const j = 2 * i + 4, perim2 = [[px - j, py - j], [px + pw + j, py - j], [px + pw + j, py + ph + j], [px - j, py + ph + j], [px - j, py - j]];
    inkLine(ctx, g, perim2, border, { width: 1.2, color: P.brass, alpha: 0.9 });
  }
  if (marks > 0) { // two thin ink corner marks, top-left and bottom-right of the mat
    const m = 26, d = 12;
    inkLine(ctx, g, [[d, d + m], [d, d], [d + m, d]], marks, { width: 1.6, color: P.ink, alpha: 0.85 });
    inkLine(ctx, g, [[w - d - m, h - d], [w - d, h - d], [w - d, h - d - m]], marks, { width: 1.6, color: P.ink, alpha: 0.85 });
  }
  g.restore();
  // label (screen-space transform handled by caller giving absolute coords through o.labelPos)
  if (label && o.labelPos) drawText(ctx, g, labelId, label, o.labelPos[0], o.labelPos[1], { role: 'analytical', size: 28, color: P.ink, alpha: labelP * 0.9 });
  return { photo: { x: x + px, y: y + py, w: pw, h: ph } };
}
