// Thin art-direction layer over the .riv writer: one call per painted piece,
// with per-style rules applied consistently (pixel grid snapping, minimum
// line weights, paper-cut edge pieces).
'use strict';
const G = require('./geo');
const { text } = require('./fonts');

function makeArt(ab, S) {
  const P = S.pal;
  const px = S.pixel || 0;
  const snap = (d) => (px ? G.snapPath(d, px) : d);
  const lw = (w) => (px ? Math.max(px, Math.round(w / px) * px) : w);

  // A filled (and optionally stroked) shape from path data.
  const api = { flat: false };
  function piece(parent, name, d, fill, o = {}) {
    // Paper style: every cut piece casts its own small shadow onto whatever
    // lies beneath it inside the same artboard (thickness edge + soft falloff).
    const solid = typeof fill === 'string' && (P[fill] || /^#/.test(fill));
    if (S.paperDepth && solid && !o.flat && !api.flat && (o.opacity === undefined || o.opacity === 1) && !o.stroke) {
      const dd = o.noSnap ? d : snap(d); const k = o.depth ?? 1;
      for (const [dx, dy, a] of [[1.2 * k, 2.4 * k, 0.26], [3 * k, 6 * k, 0.1]]) {
        const u = ab.shape(name + 'Lift', parent, { x: o.x, y: o.y, rotation: o.rotation, scaleX: o.scaleX, scaleY: o.scaleY });
        ab.path(u, G.translate(dd, dx, dy));
        ab.fill(u, { hex: '#2A1A0C', a });
      }
    }
    const s = ab.shape(name, parent, { x: o.x, y: o.y, rotation: o.rotation, scaleX: o.scaleX, scaleY: o.scaleY, opacity: o.opacity });
    const paths = ab.path(s, o.noSnap ? d : snap(d));
    if (fill) s.fillPaint = ab.fill(s, typeof fill === 'string' && P[fill] ? P[fill] : fill, { evenOdd: o.evenOdd });
    if (o.stroke) s.strokePaint = ab.stroke(s, P[o.stroke] || o.stroke, lw(o.strokeW || 2), { cap: o.cap, join: o.join, trim: o.trim, dash: o.dash });
    s.paths = paths;
    return s;
  }
  // Stroke-only line.
  function line(parent, name, d, color, w, o = {}) {
    return piece(parent, name, d, null, { ...o, stroke: color, strokeW: w, flat: true });
  }
  // Text rendered to outlines. role: 'title' | 'label' | 'hand'.
  function label(parent, name, str, x, y, size, color, o = {}) {
    const fontName = o.font || S.fonts[o.role || 'label'];
    let sz = size;
    if (px && /pixel/.test(fontName)) sz = Math.max(32, Math.round(size / 32) * 32); // Silkscreen: 1 font pixel = size/8 = one art pixel at 32
    const t = text(fontName, o.upper === false ? str : (o.role === 'hand' ? str : str), x, y, sz, { anchor: o.anchor, tracking: o.tracking ?? 0 });
    const s = piece(parent, name, t.d, P[color] || color, { opacity: o.opacity, noSnap: !px, flat: true });
    s.width = t.width;
    return s;
  }
  // Colour by key with alpha.
  const c = (key, a = 1) => ({ hex: P[key] || key, a });

  return Object.assign(api, { piece, line, label, c, P, px, lw, snap, S });
}

module.exports = { makeArt };
