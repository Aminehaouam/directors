import { drawGround, drawPaper } from './PaperLayer.js';
import { candleLight } from './CandleLight.js';
import { setShadow, clearShadow } from './util.js';

export const SHEET = { x: 330, y: 140, w: 1260, h: 800, rot: -0.012 };
export const CANDLE = { x: 205, y: 258 };

/**
 * The writer's desk: walnut, parchment sheet, pen (mid), reel, books, candle and smoke (front), candle light.
 * o: {t, sheet:true, objects:true, dim:0, onSheet(g, sheetRect), light:0.4, flickerAmount:1}
 */
export function drawDesk(ctx, g, cam, o = {}) {
  const { t, sheet = true, objects = true, dim = 0, onSheet = null, light = 0.42, flickerAmount = 1 } = o;
  g.save(); cam.apply(g, 'back'); drawGround(ctx, g, 'wood', 1.4); g.restore();

  g.save(); cam.apply(g, 'mid');
  if (sheet) {
    drawPaper(ctx, g, { ...SHEET, tex: 'parchment', seed: 3, rough: 5, shadowAlpha: 0.5, dx: 14, dy: 20, blur: 34 });
    if (onSheet) {
      g.save(); g.translate(SHEET.x + SHEET.w / 2, SHEET.y + SHEET.h / 2); g.rotate(SHEET.rot); g.translate(-SHEET.w / 2, -SHEET.h / 2);
      onSheet(g, { x: 0, y: 0, w: SHEET.w, h: SHEET.h }); g.restore();
    }
    if (objects) { // pen lying across the lower right of the sheet
      g.save(); g.translate(1000, 838); g.rotate(-0.24);
      setShadow(ctx, g, { dx: 8, dy: 12, blur: 12, color: 'rgba(23,24,20,0.5)' });
      g.drawImage(ctx.img.pen, 0, 0, 560, 56); clearShadow(g); g.restore();
    }
  }
  g.restore();
  if (dim > 0) { g.save(); g.fillStyle = `rgba(33,24,18,${dim})`; g.fillRect(0, 0, ctx.W, ctx.H); g.restore(); }

  const [lx, ly] = cam.project(CANDLE.x, CANDLE.y, 'front');
  candleLight(ctx, g, { x: lx, y: ly, r: 820, t, intensity: light, amount: flickerAmount, flame: false, smoke: false });
  if (objects) {
    g.save(); cam.apply(g, 'front');
    setShadow(ctx, g, { dx: 14, dy: 20, blur: 24, color: 'rgba(10,8,6,0.55)' });
    g.drawImage(ctx.img.books, 1470, 70, 440, 316);
    g.drawImage(ctx.img.reel, 10, 600, 620, 425);
    g.drawImage(ctx.img.candle, 105, 150, 200, 440);
    clearShadow(g);
    candleLight(ctx, g, { x: CANDLE.x, y: CANDLE.y, r: 10, t, intensity: 0, amount: flickerAmount, flame: true, smoke: true });
    g.restore();
  }
}
