// Every on-screen word goes through here: font system, tracking, bounding-box registry for QA.
export function fontCss(ctx, role, size, o = {}) {
  const fam = ctx.cfg.typography.families[role];
  const weight = o.weight || (role === 'display' ? 600 : role === 'analytical' ? 600 : 400);
  const stack = role === 'annotation' ? `"${fam.family}", "${fam.fallback}", cursive` : role === 'display' ? `"${fam.family}", serif` : `"${fam.family}", sans-serif`;
  return `${o.italic ? 'italic ' : ''}${weight} ${size}px ${stack}`;
}

/** Measure a string with the given style. Returns width in logical px. */
export function measure(ctx, role, str, size, o = {}) {
  const g = ctx.measureG;
  g.font = fontCss(ctx, role, size, o);
  g.letterSpacing = `${(o.tracking ?? defaultTracking(ctx, role, o)) * size}px`;
  const m = g.measureText(str);
  return { width: m.width, ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent };
}
export function defaultTracking(ctx, role, o = {}) {
  const fam = ctx.cfg.typography.families[role];
  if (role === 'display') return fam.tracking;
  if (role === 'analytical') return o.upper === false ? 0 : fam.labelTracking;
  return 0;
}

/** Axis-aligned screen-space (logical px) bounds of a local box under the current transform. */
export function toScreen(ctx, g, b) {
  const m = g.getTransform(), S = ctx.S;
  const pts = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h]].map(([x, y]) => [(m.a * x + m.c * y + m.e) / S, (m.b * x + m.d * y + m.f) / S]);
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
  return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };
}

/**
 * Draw (and register) a line of text. o: {size, weight, italic, tracking, color, alpha, align, upper, blend, draw}
 * The registered box is in screen space. With o.draw === false the box is registered but nothing is painted;
 * ctx.noText does the same for the whole frame (QA samples the background behind each box).
 */
export function drawText(ctx, g, id, str, x, y, o = {}) {
  const role = o.role || 'display', size = o.size || 96, alpha = o.alpha ?? 1;
  const text = o.upper ? str.toUpperCase() : str;
  const tr = o.tracking ?? defaultTracking(ctx, role, o);
  const m = measure(ctx, role, text, size, { ...o, tracking: tr });
  const w = m.width - tr * size;
  const align = o.align || 'left';
  const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  const box = { x: left, y: y - m.ascent, w, h: m.ascent + m.descent };
  const eff = alpha * g.globalAlpha;
  if (eff > 0.02 && !ctx._noReg) ctx.textBoxes.push({ id, ...toScreen(ctx, g, box), role, size: size * Math.sqrt(Math.abs(g.getTransform().a * g.getTransform().d - g.getTransform().b * g.getTransform().c)) / ctx.S, color: o.color || ctx.P.ink, alpha: eff, t: ctx.t, text, plaque: !!o.plaque });
  if (ctx.noText || o.draw === false || alpha <= 0.001) return box;
  g.save();
  g.font = fontCss(ctx, role, size, o);
  g.letterSpacing = `${tr * size}px`;
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.globalAlpha *= alpha;
  if (o.blend) g.globalCompositeOperation = o.blend;
  g.fillStyle = o.color || ctx.P.ink;
  g.fillText(text, left, y);
  g.restore();
  return box;
}
