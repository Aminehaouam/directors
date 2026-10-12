/** Draw `draw()` only inside a mask. mask: {rect:[x,y,w,h]} | {circle:[cx,cy,r]} | {path:Path2D}. */
export function maskReveal(g, mask, draw) {
  g.save();
  g.beginPath();
  if (mask.rect) g.rect(...mask.rect); else if (mask.circle) g.arc(mask.circle[0], mask.circle[1], Math.max(0, mask.circle[2]), 0, 6.2832);
  else if (mask.path) { g.clip(mask.path); draw(); g.restore(); return; }
  g.clip();
  draw();
  g.restore();
}
/** Wipe reveal along an axis with a seeded ragged edge (ink creeping across paper). */
export function wipeRect(x, y, w, h, p, dir = 'down') {
  if (dir === 'down') return [x, y, w, h * p];
  if (dir === 'right') return [x, y, w * p, h];
  if (dir === 'up') return [x, y + h * (1 - p), w, h * p];
  return [x + w * (1 - p), y, w * p, h];
}
