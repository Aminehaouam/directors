import { resolveTimeline } from './animations/timeline.js';
import { makeEasings, clamp01 } from './animations/easing.js';
import { rngFor } from './animations/rng.js';
import { loadFonts, glyphsPresent } from './typography/fonts.js';
import { buildGrain, drawGrain } from './components/Grain.js';
import { makeBuffers } from './compositing/buffers.js';
import { initFootage } from './compositing/footage.js';
import { inkBlotTransition } from './compositing/InkBlotTransition.js';
import { tornPaperTransition } from './compositing/TornPaperTransition.js';
import { archivalSlideTransition } from './compositing/ArchivalSlideTransition.js';

const loadImg = async (src) => {
  const im = new Image(); im.src = src;
  try { await im.decode(); } catch { throw new Error(`Image failed to load: ${src}. Run "npm run assets" first.`); }
  return im;
};

export async function boot({ scale = 1 } = {}) {
  const cfg = await (await fetch('/config/episode.json', { cache: 'no-store' })).json();
  const P = await (await fetch(`/${cfg.palette}`, { cache: 'no-store' })).json();
  const tl = resolveTimeline(cfg);
  const canvas = document.getElementById('c');
  const W = cfg.canvas.width, H = cfg.canvas.height;
  canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
  const g0 = canvas.getContext('2d');
  const ctx = {
    cfg, P, tl, W, H, S: scale, fps: cfg.fps, t: 0, frame: 0, g: g0, noText: false, textBoxes: [],
    easeFns: makeEasings(cfg.easing), img: {}, rng: rngFor,
    measureG: document.createElement('canvas').getContext('2d'),
  };
  ctx.ev = (id) => {
    const e = tl.events[id];
    if (!e) throw new Error(`Unknown event "${id}" (add it to config/episode.json events)`);
    const raw = clamp01((ctx.t - e.t0) / e.duration);
    return { p: ctx.easeFns[e.easing](raw), raw, t0: e.t0, t1: e.t1, active: ctx.t >= e.t0 && ctx.t <= e.t1 };
  };
  ctx.local = () => ctx.t - ctx.scene.start;

  const fonts = await loadFonts();
  const glyphs = '0123456789:;=+*<>/\\|-_[]{}()#%&?';
  const present = glyphsPresent('500 22px "Inter"', glyphs), missing = [...glyphs].filter((c) => !present.includes(c));
  if (missing.length) throw new Error(`Code-glyph font "Inter" lacks glyphs: ${missing.join(' ')}`);

  const names = { wood: 'textures/wood.png', parchment: 'textures/parchment.png', 'paper-ivory': 'textures/paper-ivory.png', 'paper-aged': 'textures/paper-aged.png',
    candle: 'illustrations/candle.svg', pen: 'illustrations/pen.svg', reel: 'illustrations/reel.svg', books: 'illustrations/books.svg', silhouette: 'illustrations/silhouette.svg', eye: 'illustrations/eye.svg', figure: 'illustrations/figure.svg' };
  await Promise.all(Object.entries(names).map(async ([k, f]) => { ctx.img[k] = await loadImg(`/public/${f}`); }));

  buildGrain(ctx); makeBuffers(ctx); await initFootage(ctx);
  const sceneById = {};
  for (const sc of cfg.scenes) {
    sc.mod = await import(`/src/scenes/${sc.module}.js`);
    sceneById[sc.id] = sc;
    if (sc.mod.build) await sc.mod.build(ctx);
  }

  const sceneAt = (t) => cfg.scenes.find((s) => t >= s.start && t < s.end) || cfg.scenes[cfg.scenes.length - 1];
  const drawScene = (sc, g) => { ctx.g = g; ctx.scene = sc; g.save(); sc.mod.update(ctx.t, ctx); g.restore(); };
  const TRANS = { inkBlot: ['ink', inkBlotTransition], tornPaper: ['paper', tornPaperTransition], archivalSlide: ['paper', archivalSlideTransition] };

  async function renderFrame(i, { noText = false } = {}) {
    ctx.frame = i; ctx.t = i / cfg.fps; ctx.noText = noText; ctx.textBoxes = [];
    const t = ctx.t;
    const tr = tl.transitions.find((x) => x.type !== 'cut' && t >= x.t0 && t < x.t1);
    const scenes = tr ? [sceneById[tr.from], sceneById[tr.to]] : [sceneAt(t)];
    for (const sc of scenes) if (sc.mod.needs) for (const n of sc.mod.needs(t, ctx)) await ctx.fx.load(n.slot, n.time);
    g0.setTransform(1, 0, 0, 1, 0, 0); g0.globalAlpha = 1; g0.globalCompositeOperation = 'source-over'; g0.clearRect(0, 0, canvas.width, canvas.height);
    g0.setTransform(scale, 0, 0, scale, 0, 0);
    if (tr) {
      const A = ctx.buffer('tA'), B = ctx.buffer('tB');
      drawScene(sceneById[tr.from], A.g); drawScene(sceneById[tr.to], B.g);
      ctx.g = g0;
      const [ease, fn] = TRANS[tr.type];
      fn(ctx, g0, A, B, ctx.easeFns[ease](clamp01((t - tr.t0) / tr.duration)));
    } else drawScene(scenes[0], g0);
    drawGrain(ctx, g0);
  }

  const api = {
    info: { fonts, frames: Math.round(cfg.duration * cfg.fps), scale },
    renderFrame,
    grab: () => canvas.toDataURL('image/png'),
    textBoxes: () => ctx.textBoxes,
    footageInfo: () => ctx.fx.info,
    async frameHash() {
      const d = g0.getImageData(0, 0, canvas.width, canvas.height).data;
      const h = await crypto.subtle.digest('SHA-256', d);
      return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
    },
    /** Fraction of pixels whose hue is clearly green (used for the green-cap QA). */
    greenFraction() {
      const d = g0.getImageData(0, 0, canvas.width, canvas.height).data;
      let n = 0, tot = 0;
      for (let i = 0; i < d.length; i += 16) { tot++; if (d[i + 1] > d[i] + 10 && d[i + 1] > d[i + 2] + 10) n++; }
      return n / tot;
    },
    /** Mean relative luminance (0..1) of a logical-pixel box. */
    sampleLuminance(x, y, w, h) {
      const s = scale, px = Math.max(0, Math.floor(x * s)), py = Math.max(0, Math.floor(y * s)), pw = Math.max(1, Math.min(canvas.width - px, Math.ceil(w * s))), ph = Math.max(1, Math.min(canvas.height - py, Math.ceil(h * s)));
      const d = g0.getImageData(px, py, pw, ph).data, lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      let sum = 0, n = 0, mn = 1, mx = 0;
      for (let i = 0; i < d.length; i += 4) { const L = 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]); sum += L; n++; if (L < mn) mn = L; if (L > mx) mx = L; }
      return { mean: sum / n, min: mn, max: mx };
    },
  };
  return api;
}
