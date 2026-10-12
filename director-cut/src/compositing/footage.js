import { drawStandIn } from './standins.js';

/** Footage = pre-extracted still frames (output/cache/footage/<slot>/NNNN.jpg). The browser never decodes video. */
export async function initFootage(ctx) {
  const info = {}, cache = new Map(), snap = {};
  for (const slot of Object.keys(ctx.cfg.footageSlots)) {
    try {
      const r = await fetch(`/${ctx.cfg.output.cache}/footage/${slot}/manifest.json`, { cache: 'no-store' });
      info[slot] = r.ok ? { present: true, count: (await r.json()).count } : { present: false, count: 0 };
    } catch { info[slot] = { present: false, count: 0 }; }
  }
  const idx = (slot, time) => Math.max(0, Math.min(info[slot].count - 1, Math.round(time * ctx.fps)));
  const url = (slot, i) => `/${ctx.cfg.output.cache}/footage/${slot}/${String(i + 1).padStart(4, '0')}.jpg`;
  ctx.fx = {
    info,
    present: (slot) => info[slot].present,
    async load(slot, time) {
      if (!info[slot].present) return;
      const i = idx(slot, time), k = `${slot}:${i}`;
      if (cache.has(k)) return;
      const im = new Image(); im.src = url(slot, i);
      try { await im.decode(); } catch (e) { throw new Error(`Footage frame failed to decode: ${url(slot, i)}`); }
      cache.set(k, im);
      if (cache.size > 14) cache.delete(cache.keys().next().value);
    },
    image(slot, time) { return info[slot].present ? cache.get(`${slot}:${idx(slot, time)}`) || null : null; },
    /** A cover-fitted snapshot canvas (w x h logical px at scale 1) of a footage frame or its stand-in. Cached. */
    snapshot(slot, time, w, h) {
      const k = `${slot}|${idx(slot, time)}|${w}x${h}|${info[slot].present}`;
      if (!snap[k]) {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const sg = c.getContext('2d'), keep = ctx.S;
        ctx.S = 1; ctx._noReg = (ctx._noReg || 0) + 1;
        this.draw(sg, slot, time, { x: 0, y: 0, w, h }, { safe: { x: 0, y: 0, w, h } });
        ctx._noReg--; ctx.S = keep; snap[k] = c;
      }
      return snap[k];
    },
    /** Draw a footage frame cover-fitted into rect (zoom about its centre), or the stand-in. */
    draw(g, slot, time, rect, { zoom = 1, filter = null, safe = null } = {}) {
      const im = this.image(slot, time);
      if (!im) { drawStandIn(ctx, g, slot, rect, time, safe); return false; }
      g.save(); g.beginPath(); g.rect(rect.x, rect.y, rect.w, rect.h); g.clip();
      if (filter) g.filter = filter;
      const ar = im.width / im.height, tar = rect.w / rect.h;
      let dw = rect.w, dh = rect.h;
      if (ar > tar) dw = rect.h * ar; else dh = rect.w / ar;
      dw *= zoom; dh *= zoom;
      g.drawImage(im, rect.x + (rect.w - dw) / 2, rect.y + (rect.h - dh) / 2, dw, dh);
      g.restore();
      return true;
    },
  };
}
