import { tornPath, setShadow, clearShadow, pattern } from './util.js';
import { hash2 } from '../animations/rng.js';

const SCALE = { parchment: 0.5, wood: 0.5, ivory: 0.8, aged: 0.8 };
const TEX = { parchment: 'parchment', ivory: 'paper-ivory', aged: 'paper-aged', wood: 'wood' };

/** A sheet of fibrous paper with a torn silhouette, a fibre edge and a layered top-left-lit shadow. */
export function drawPaper(ctx, g, o) {
  const { x, y, w, h, rot = 0, seed = 1, tex = 'parchment', rough = 5, shadow = true, alpha = 1, dx = 10, dy = 14, blur = 24, shadowAlpha = 0.38, clip = false, draw = null } = o;
  g.save();
  g.translate(x + w / 2, y + h / 2); g.rotate(rot); g.translate(-w / 2, -h / 2);
  const { path } = tornPath(0, 0, w, h, seed, rough);
  g.globalAlpha *= alpha;
  if (shadow) {
    setShadow(ctx, g, { dx, dy, blur, color: `rgba(23,24,20,${shadowAlpha})` });
    g.fillStyle = '#C9AD7C'; g.fill(path); clearShadow(g);
    setShadow(ctx, g, { dx: dx * 0.25, dy: dy * 0.25, blur: blur * 0.2, color: `rgba(23,24,20,${shadowAlpha * 0.8})` });
    g.fill(path); clearShadow(g);
  }
  const im = ctx.img[TEX[tex]], slackX = Math.max(0, im.width * SCALE[tex] - w), slackY = Math.max(0, im.height * SCALE[tex] - h);
  g.fillStyle = pattern(ctx, g, TEX[tex], SCALE[tex], -hash2(seed, 1, 5) * slackX, -hash2(seed, 2, 5) * slackY); // seam stays outside the sheet
  g.fill(path);
  g.save(); g.clip(path);
  g.lineJoin = 'round';
  g.strokeStyle = 'rgba(120,90,52,0.10)'; g.lineWidth = 22; g.stroke(path);
  g.strokeStyle = 'rgba(120,90,52,0.13)'; g.lineWidth = 8; g.stroke(path);
  if (draw) draw(g, { w, h });
  g.restore();
  g.strokeStyle = 'rgba(255,248,230,0.55)'; g.lineWidth = 1.6; g.stroke(path);
  g.restore();
  return path;
}

/** Fill the whole canvas with a texture (desk, parchment ground). `cover` scales the texture past the frame for parallax. */
export function drawGround(ctx, g, tex, cover = 1, ox = 0, oy = 0) {
  const img = ctx.img[TEX[tex]], w = ctx.W * cover, h = ctx.H * cover;
  g.drawImage(img, (ctx.W - w) / 2 + ox, (ctx.H - h) / 2 + oy, w, h);
}
