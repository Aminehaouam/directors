// Browser compositor. Rive renders every animated element (via the official
// @rive-app/canvas-advanced runtime); this file only:
//   1. steps each artboard's state machine on a fixed 30 fps clock and fires
//      the story cues from src/timeline.js,
//   2. renders each artboard into its own layer with the shared camera,
//   3. applies the per-style "photography": shadows, paper texture, grain,
//      lighting, tilt-shift, or the pixel-art quantise/upscale.
import Rive from '../node_modules/@rive-app/canvas-advanced/canvas_advanced.mjs';

const TL = window.TIMELINE;
const [W, H] = TL.size;
const OFF = 20000; // shadow-only draw offset

// Layer defaults: base elevation (overridden by an artboard's animated 'fx' node).
const LAYER = {
  Desk: { elev: 0, shadow: false, texture: 0.6 },
  Props: { elev: 12, outline: true },
  Journal: { elev: 9 },
  Ticket: { elev: 6, outline: true },
  LondonBack: { elev: 10, outline: true },
  BigBen: { elev: 14, outline: true },
  LondonFront: { elev: 12, outline: true },
  Coco: { elev: 8, outline: true },
};

// ------------------------------------------------------------ utilities --
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const ease = {
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  linear: (t) => t,
};
function cameraAt(t) {
  const K = TL.camera;
  if (t <= K[0][0]) return K[0];
  for (let i = 1; i < K.length; i++) {
    if (t <= K[i][0]) {
      const a = K[i - 1], b = K[i]; const u = (ease[b[4] || 'inOut'])((t - a[0]) / (b[0] - a[0]));
      return [t, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u];
    }
  }
  return K[K.length - 1];
}
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

// Paper fibre / grain textures, generated once (deterministic).
function makeNoise(w, h, seed, { fibers = 0, dark = 0.5, amount = 1, blotch = 0 } = {}) {
  const c = canvas(w, h); const x = c.getContext('2d'); const r = rng(seed);
  const img = x.createImageData(w, h); const d = img.data;
  for (let i = 0; i < w * h; i++) {
    const v = r();
    const isDark = r() < dark;
    const a = Math.pow(v, 3) * 255 * amount;
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = isDark ? 20 : 255; d[i * 4 + 3] = a;
  }
  x.putImageData(img, 0, 0);
  // Soft low-frequency mottling (cardstock isn't perfectly even).
  for (let i = 0; i < blotch; i++) {
    const bx = r() * w, by = r() * h, br = 40 + r() * 160;
    const g = x.createRadialGradient(bx, by, 0, bx, by, br);
    const col = r() < 0.5 ? '0,0,0' : '255,255,255'; const a = 0.025 + r() * 0.03;
    g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
    x.fillStyle = g; x.fillRect(bx - br, by - br, br * 2, br * 2);
  }
  // Fibres: short curved strands, light and dark.
  x.lineCap = 'round';
  for (let i = 0; i < fibers; i++) {
    const fx = r() * w, fy = r() * h, len = 6 + r() * 26, ang = r() * Math.PI * 2, bend = (r() - 0.5) * 0.9;
    x.strokeStyle = r() < 0.55 ? `rgba(255,255,255,${0.10 + r() * 0.16})` : `rgba(60,40,20,${0.05 + r() * 0.09})`;
    x.lineWidth = 0.6 + r() * 0.9;
    x.beginPath(); x.moveTo(fx, fy);
    x.quadraticCurveTo(fx + Math.cos(ang + bend) * len * 0.5, fy + Math.sin(ang + bend) * len * 0.5, fx + Math.cos(ang) * len, fy + Math.sin(ang) * len);
    x.stroke();
  }
  return c;
}

// ------------------------------------------------------------- compositor --
export async function createCompositor(styleId, opts = {}) {
  const styles = await (await fetch('../rive/styles.json')).json();
  const S = styles[styleId];
  const rive = await Rive({ locateFile: () => '../node_modules/@rive-app/canvas-advanced/rive.wasm' });
  const bytes = new Uint8Array(await (await fetch(`../rive/${S.slug}.riv?v=${Date.now()}`)).arrayBuffer());
  const file = await rive.load(bytes);

  const px = S.pixel || 0;
  const LW = px ? W / px : W, LH = px ? H / px : H; // layer resolution
  const out = opts.canvas || canvas(W, H);
  out.width = W; out.height = H;
  const octx = out.getContext('2d');
  const frame = canvas(LW, LH); const fctx = frame.getContext('2d', { willReadFrequently: !!px });

  const layers = [];
  const only = opts.only ? opts.only.split(',') : null;
  for (const name of TL.layers) {
    if (only && !only.includes(name) && name !== 'Desk') continue;
    let ab;
    try { ab = file.artboardByName(name); } catch (e) { ab = null; }
    if (!ab) continue;
    const c = canvas(LW, LH);
    const renderer = rive.makeRenderer(c);
    const sm = ab.stateMachineCount() > 0 ? new rive.StateMachineInstance(ab.stateMachineByIndex(0), ab) : null;
    const inputs = {};
    if (sm) for (let i = 0; i < sm.inputCount(); i++) { const inp = sm.input(i); inputs[inp.name] = inp; }
    let fx = null; try { fx = ab.node('fx'); } catch (e) { fx = null; }
    layers.push({ name, ab, c, ctx: c.getContext('2d', { willReadFrequently: !!px }), renderer, sm, inputs, fx, cfg: LAYER[name] || {} });
  }
  const byName = Object.fromEntries(layers.map((l) => [l.name, l]));

  // Textures.
  const tex = {
    grain: makeNoise(512, 512, 11, { dark: 0.6, amount: S.post.mode === 'paper' ? 0.55 : 0.4 }),
    fiber: S.post.mode === 'paper' ? makeNoise(1024, 1024, 23, { fibers: 9000, dark: 0.5, amount: 0.35, blotch: 260 }) : null,
    paper: makeNoise(1024, 1024, 5, { fibers: S.post.mode === 'editorial' ? 2500 : 0, dark: 0.45, amount: 0.25, blotch: 120 }),
  };
  const tmp = canvas(LW, LH); const tctx = tmp.getContext('2d');
  const tmp2 = canvas(LW, LH); const t2ctx = tmp2.getContext('2d');

  // Pixel palette lookup (cached nearest colour).
  let pal = null, palCache = null;
  if (px) { pal = S.palette.map(hexToRgb); palCache = new Map(); }
  const nearest = (r, g, b) => {
    const key = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
    let v = palCache.get(key); if (v !== undefined) return v;
    let best = 0, bd = 1e9;
    for (let i = 0; i < pal.length; i++) {
      const p = pal[i]; const dr = r - p[0], dg = g - p[1], db = b - p[2];
      const rm = (r + p[0]) / 2; // "redmean" perceptual weighting
      const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
      if (d < bd) { bd = d; best = i; }
    }
    palCache.set(key, best); return best;
  };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v / 16 - 0.5));
  const DITHER = 7;

  let frameIndex = -1, time = 0;
  const cues = TL.cues.map((c) => ({ t: c[0], layer: c[1], input: c[2], fired: false }));

  function advanceTo(t) {
    // Step in sub-intervals so triggers land exactly on their cue time.
    while (time < t - 1e-9) {
      const next = cues.filter((c) => !c.fired && c.t > time - 1e-9 && c.t <= t + 1e-9).sort((a, b) => a.t - b.t)[0];
      const target = next ? Math.max(next.t, time) : t;
      const dt = target - time;
      if (dt > 0) for (const l of layers) { if (l.sm) l.sm.advanceAndApply(dt); l.ab.advance(dt); }
      time = target;
      if (next) {
        next.fired = true;
        const l = byName[next.layer];
        if (l && l.inputs[next.input]) l.inputs[next.input].asTrigger().fire();
        else console.warn('missing cue target', next.layer, next.input);
        for (const l2 of layers) { if (l2.sm) l2.sm.advanceAndApply(0); l2.ab.advance(0); }
      }
    }
  }
  function init() {
    for (const l of layers) { if (l.sm) l.sm.advanceAndApply(0); l.ab.advance(0); }
  }
  init();

  function renderLayer(l, cam) {
    const [, cx, cy, z] = cam; const k = px ? 1 / px : 1;
    const ox = LW / 2, oy = LH / 2;
    const fr = { minX: (0 - cx) * z * k + ox, minY: (0 - cy) * z * k + oy, maxX: (W - cx) * z * k + ox, maxY: (H - cy) * z * k + oy };
    l.renderer.beginFrame();
    l.renderer.save();
    l.renderer.align(rive.Fit.fill, rive.Alignment.topLeft, fr, l.ab.bounds);
    l.ab.draw(l.renderer);
    l.renderer.restore();
    l.renderer.flush();
    rive.resolveAnimationFrame(); // the canvas backend paints queued draws here
  }

  function elevation(l) { return l.fx ? l.fx.y : (l.cfg.elev || 0); }

  // Shadow only: draw the layer far off-canvas and let canvas shadows land on-canvas.
  function shadow(ctx, src, blur, dx, dy, color) {
    ctx.save();
    ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.shadowOffsetX = OFF + dx; ctx.shadowOffsetY = dy;
    ctx.drawImage(src, -OFF, 0);
    ctx.restore();
  }

  function textureLayer(l, img, alpha, op = 'source-atop', ox = 0, oy = 0) {
    const ctx = l.ctx; ctx.save(); ctx.globalCompositeOperation = op; ctx.globalAlpha = alpha;
    const pat = ctx.createPattern(img, 'repeat'); pat.setTransform(new DOMMatrix().translate(ox, oy));
    ctx.fillStyle = pat; ctx.fillRect(0, 0, LW, LH); ctx.restore();
  }

  // Cut-edge rim for paper: thin light edge top-left, dark edge bottom-right.
  function paperRim(l, w, lightA, darkA) {
    const draw = (dx, dy, color, a) => {
      tctx.globalCompositeOperation = 'copy'; tctx.drawImage(l.c, 0, 0);
      tctx.globalCompositeOperation = 'source-in'; tctx.fillStyle = color; tctx.fillRect(0, 0, LW, LH);
      tctx.globalCompositeOperation = 'destination-out'; tctx.drawImage(l.c, dx, dy);
      tctx.globalCompositeOperation = 'source-over';
      l.ctx.save(); l.ctx.globalAlpha = a; l.ctx.globalCompositeOperation = 'source-atop'; l.ctx.drawImage(tmp, 0, 0); l.ctx.restore();
    };
    draw(w, w, '#FFFFFF', lightA);
    draw(-w, -w, '#2A1E12', darkA);
  }

  function composeEditorial(cam) {
    const ctx = fctx; ctx.clearRect(0, 0, LW, LH);
    const z = cam[3];
    for (const l of layers) {
      renderLayer(l, cam);
      if (l.name !== 'Desk') textureLayer(l, tex.grain, 0.11, 'source-atop', (l.name.length * 37) % 512, 0);
      else textureLayer(l, tex.paper, 0.5);
      const e = elevation(l) * z;
      if (l.cfg.shadow !== false && e > 0) {
        shadow(ctx, l.c, 2 + e * 0.12, e * 0.18, e * 0.32, 'rgba(14,24,28,0.30)');
        shadow(ctx, l.c, 8 + e * 0.9, e * 0.5, e * 0.95, 'rgba(14,24,28,0.20)');
      }
      ctx.drawImage(l.c, 0, 0);
    }
    // Vignette + warm paper tone.
    const g = ctx.createRadialGradient(W * 0.42, H * 0.38, H * 0.25, W * 0.5, H * 0.5, H * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(8,16,20,0.38)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.35;
    ctx.fillStyle = ctx.createPattern(tex.paper, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
    octx.drawImage(frame, 0, 0);
  }

  function composePaper(cam, f) {
    const ctx = fctx; ctx.clearRect(0, 0, LW, LH);
    const z = cam[3];
    for (const l of layers) {
      renderLayer(l, cam);
      // Fibre texture tied to the camera so the paper doesn't "swim" over objects.
      const ox = (-cam[1] * z) % 1024 + (l.name.length * 131) % 1024, oy = (-cam[2] * z) % 1024;
      textureLayer(l, tex.fiber, l.name === 'Desk' ? 0.8 : 1.0, 'source-atop', ox, oy);
      if (l.name !== 'Desk') paperRim(l, 2.4 * z, 0.7, 0.35);
      const e = elevation(l) * z * 1.7;
      if (l.cfg.shadow !== false && e > 0) {
        // Contact shadow + ambient occlusion + long soft key-light shadow.
        shadow(ctx, l.c, 1.5 + e * 0.12, e * 0.1, e * 0.18, 'rgba(36,20,6,0.55)');
        shadow(ctx, l.c, 6 + e * 0.5, e * 0.25, e * 0.5, 'rgba(36,20,6,0.32)');
        shadow(ctx, l.c, 16 + e * 1.3, e * 0.8, e * 1.4, 'rgba(36,20,6,0.24)');
      }
      ctx.drawImage(l.c, 0, 0);
    }
    // Key light from the upper left, cooler falloff to the lower right.
    ctx.save();
    let g = ctx.createRadialGradient(W * 0.12, H * 0.05, 0, W * 0.12, H * 0.05, H * 1.05);
    g.addColorStop(0, 'rgba(255,236,200,0.55)'); g.addColorStop(0.5, 'rgba(255,236,200,0.12)'); g.addColorStop(1, 'rgba(255,236,200,0)');
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    g = ctx.createRadialGradient(W * 0.45, H * 0.42, H * 0.3, W * 0.5, H * 0.55, H * 0.85);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,22,40,0.45)');
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // Shallow depth of field: soften the top and bottom of frame (miniature lens look).
    t2ctx.globalCompositeOperation = 'copy'; t2ctx.filter = 'blur(5px)'; t2ctx.drawImage(frame, 0, 0); t2ctx.filter = 'none';
    t2ctx.globalCompositeOperation = 'destination-in';
    g = t2ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.16, 'rgba(0,0,0,0)'); g.addColorStop(0.84, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    t2ctx.fillStyle = g; t2ctx.fillRect(0, 0, W, H); t2ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(tmp2, 0, 0);
    // Fine photographic grain (changes every frame, very low).
    ctx.save(); ctx.globalAlpha = 0.16; ctx.globalCompositeOperation = 'overlay';
    const pat = ctx.createPattern(tex.grain, 'repeat'); // static grain: reads as paper tooth, encodes cleanly
    ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); ctx.restore();
    octx.drawImage(frame, 0, 0);
  }

  // Pixel art: hard alpha, selective outline, hard drop shadow, palette quantise, x4 upscale.
  const outlineRGB = hexToRgb('#1B1A24');
  function hardenAndOutline(l, outline) {
    const img = l.ctx.getImageData(0, 0, LW, LH); const d = img.data;
    for (let i = 3; i < d.length; i += 4) {
      if (d[i] >= 110) { const a = d[i] / 255; d[i - 3] = Math.min(255, d[i - 3] / a); d[i - 2] = Math.min(255, d[i - 2] / a); d[i - 1] = Math.min(255, d[i - 1] / a); d[i] = 255; }
      else d[i] = 0;
    }
    if (outline) {
      const solid = new Uint8Array(LW * LH);
      for (let i = 0; i < LW * LH; i++) solid[i] = d[i * 4 + 3] ? 1 : 0;
      for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
        const i = y * LW + x; if (solid[i]) continue;
        if ((x > 0 && solid[i - 1]) || (x < LW - 1 && solid[i + 1]) || (y > 0 && solid[i - LW]) || (y < LH - 1 && solid[i + LW])) {
          d[i * 4] = outlineRGB[0]; d[i * 4 + 1] = outlineRGB[1]; d[i * 4 + 2] = outlineRGB[2]; d[i * 4 + 3] = 255;
        }
      }
    }
    l.ctx.putImageData(img, 0, 0);
  }
  function composePixel(cam) {
    const ctx = fctx; ctx.clearRect(0, 0, LW, LH);
    const z = cam[3];
    for (const l of layers) {
      renderLayer(l, cam);
      hardenAndOutline(l, !!l.cfg.outline);
      const e = elevation(l) * z;
      if (l.cfg.shadow !== false && e > 0) {
        const dx = Math.max(1, Math.round(e * 0.06)), dy = Math.max(1, Math.round(e * 0.12));
        // Shadow silhouette in one flat tone.
        tctx.globalCompositeOperation = 'copy'; tctx.drawImage(l.c, 0, 0);
        tctx.globalCompositeOperation = 'source-in'; tctx.fillStyle = 'rgba(12,8,20,0.42)'; tctx.fillRect(0, 0, LW, LH);
        tctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(tmp, dx, dy);
      }
      ctx.drawImage(l.c, 0, 0);
    }
    // No gradient lighting here: smooth ramps dither into contour bands at this
    // resolution. Light is carried by the art's own colour ramps instead.
    // Quantise to the palette with a light ordered dither.
    const img = ctx.getImageData(0, 0, LW, LH); const d = img.data;
    for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) {
      const i = (y * LW + x) * 4; const th = BAYER[(y & 3) * 4 + (x & 3)] * DITHER;
      const p = pal[nearest(Math.max(0, Math.min(255, d[i] + th)), Math.max(0, Math.min(255, d[i + 1] + th)), Math.max(0, Math.min(255, d[i + 2] + th)))];
      d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2]; d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    octx.imageSmoothingEnabled = false;
    octx.drawImage(frame, 0, 0, W, H);
  }

  function renderFrame(f) {
    const t = f / TL.fps;
    if (f < frameIndex) throw new Error('frames must be rendered in order');
    advanceTo(t); frameIndex = f;
    const cam = cameraAt(t);
    if (S.post.mode === 'pixel') composePixel(cam);
    else if (S.post.mode === 'paper') composePaper(cam, f);
    else composeEditorial(cam);
    rive.resolveAnimationFrame();
    return out;
  }
  return { renderFrame, canvas: out, style: S, layers: layers.map((l) => l.name), frames: Math.round(TL.duration * TL.fps) };
}
