'use strict';
// Illustrated London ad: flat vector scenes on a 1080x1920 canvas. Kurzgesagt-style layered light,
// gradients and glow; a Duolingo-style chunky mascot. Scene timing matches SHOTS in ../build.py so
// the type, word chips and audio from build.py line up. window.renderFrame(i) draws frame i
// (t = i / 30) and returns it as a PNG data URL.
const W = 1080, H = 1920, FPS = 30, DUR = 15, TAU = Math.PI * 2;
window.TOTAL_FRAMES = DUR * FPS;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const C = {
  night0: '#050A24', navy: '#0B1F4B', red: '#E4002B', yellow: '#FFD60A', amber: '#FFB547',
  warm: '#FFC861', cream: '#FFF4E0', neon: '#4FC3FF', pink: '#FF5FA2', window: '#FFD27A', gold: '#E8B23A',
};
const LIT = { body: '#E3AE5C', shade: '#B9843F', hi: '#FFE3A6', belfry: '#FFF0C0' };  // floodlit stone

// ---------------------------------------------------------------- maths
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
const easeInOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const easeBack = (x, s = 1.7) => { x = clamp(x) - 1; return 1 + (s + 1) * x * x * x + s * x * x; };
// damped spring used for squash-and-stretch settles
const settle = (age, amp, freq = 45, decay = 0.07) => (age < 0 ? 0 : amp * Math.exp(-age / decay) * Math.cos(age * freq));

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(a, b = 0) {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul((b | 0) + 0x9e3779b9, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------------------------------------------------------------- paint helpers
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

function linear(x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function fillSky(stops, y0 = 0, y1 = H) {
  ctx.fillStyle = linear(0, y0, 0, y1, stops);
  ctx.fillRect(-W, -H, 3 * W, 3 * H);
}

// additive soft light
function glow(x, y, r, hex, a = 1) {
  if (r <= 0 || a <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp(a);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(hex, 1));
  g.addColorStop(0.3, rgba(hex, 0.42));
  g.addColorStop(1, rgba(hex, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
}

// flattened glow for light pools on the ground
function pool(x, y, r, hex, a) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.22);
  glow(0, 0, r, hex, a);
  ctx.restore();
}

// zoom about a focus point (camera push / punch)
function cam(z, fx = W / 2, fy = H / 2, dx = 0, dy = 0) {
  ctx.translate(fx + dx, fy + dy);
  ctx.scale(z, z);
  ctx.translate(-fx, -fy);
}

function sparkle(x, y, s, color, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(0, 0, s, 0);
  ctx.quadraticCurveTo(0, 0, 0, s);
  ctx.quadraticCurveTo(0, 0, -s, 0);
  ctx.quadraticCurveTo(0, 0, 0, -s);
  ctx.fill();
  ctx.restore();
}

function stars(seed, n, y1, t, a = 1) {
  const r = rng(seed);
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * y1, s = 1 + r() * 2.4, ph = r() * TAU, b = 0.35 + 0.65 * r();
    ctx.globalAlpha = a * b * (0.6 + 0.4 * Math.sin(t * 4 + ph)) * (1 - 0.55 * y / y1);
    ctx.beginPath();
    ctx.arc(x, y, s, 0, TAU);
    ctx.fill();
    if (s > 3.2) sparkle(x, y, s * 3.4, '#FFFFFF', 0);
  }
  ctx.restore();
}

function moon(x, y, r) {
  glow(x, y, r * 5, '#9FB8FF', 0.3);
  ctx.save();
  ctx.fillStyle = '#FFF4D6';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(214,196,160,0.6)';
  for (const [dx, dy, rr] of [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.1, 0.42, 0.12]]) {
    ctx.beginPath();
    ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// flat-bottomed cloud
function cloud(x, y, w, color, a = 1) {
  const h = w * 0.28;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h, w, h, h / 2);
  ctx.moveTo(x - w * 0.12 + w * 0.2, y - h);
  ctx.arc(x - w * 0.12, y - h, w * 0.2, 0, TAU);
  ctx.moveTo(x + w * 0.16 + w * 0.15, y - h * 0.9);
  ctx.arc(x + w * 0.16, y - h * 0.9, w * 0.15, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function bird(x, y, s, flap, col = '#2A1E4A') {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = s * 0.22;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - s, y - s * 0.45 * flap);
  ctx.quadraticCurveTo(x - s * 0.45, y - s * 0.35, x, y + s * 0.1);
  ctx.quadraticCurveTo(x + s * 0.45, y - s * 0.35, x + s, y - s * 0.45 * flap);
  ctx.stroke();
  ctx.restore();
}

function river(y0, y1, stops, t, seed, shimmer = 0.25) {
  ctx.fillStyle = linear(0, y0, 0, y1, stops);
  ctx.fillRect(-W, y0, 3 * W, y1 - y0 + H);
  const r = rng(seed);
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineCap = 'round';
  for (let i = 0; i < 80; i++) {
    const k = Math.pow(r(), 1.3), yy = y0 + k * (y1 - y0), len = 18 + r() * 110 * (k + 0.2);
    const sp = (r() - 0.5) * 50, span = W + 240;
    const x = ((r() * span + t * sp) % span + span) % span - 120;
    ctx.globalAlpha = shimmer * (0.3 + 0.7 * r()) * (0.6 + 0.4 * Math.sin(t * 5 + i));
    ctx.lineWidth = 2 + 4 * k;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + len, yy);
    ctx.stroke();
  }
  ctx.restore();
}

// broken vertical light smear on water under a light source
function reflection(x, y0, y1, w, hex, t, a = 0.6, seed = 9) {
  const r = rng(seed);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = hex;
  for (let yy = y0; yy < y1; yy += 9 + r() * 10) {
    const k = (yy - y0) / (y1 - y0), ww = w * (0.4 + r() * 0.8) * (1 + k);
    const off = Math.sin(t * 3 + yy * 0.05) * 12 * k;
    ctx.globalAlpha = a * (1 - k) * (0.4 + 0.6 * r());
    ctx.fillRect(x - ww / 2 + off, yy, ww, 4 + 5 * k);
  }
  ctx.restore();
}

// window grid; lit is a fraction or fn(x, y, k) -> brightness
function windows(x, y, w, h, seed, lit, o = {}) {
  const cw = o.cw || 10, ch = o.ch || 13, gx = o.gx || 9, gy = o.gy || 12;
  const cols = Math.floor((w + gx) / (cw + gx)), rows = Math.floor((h + gy) / (ch + gy));
  if (cols < 1 || rows < 1) return;
  const ox = x + (w - (cols * (cw + gx) - gx)) / 2;
  ctx.save();
  ctx.fillStyle = o.color || C.window;
  for (let rr = 0; rr < rows; rr++) {
    for (let c = 0; c < cols; c++) {
      const wx = ox + c * (cw + gx), wy = y + rr * (ch + gy), k = hash(seed + rr * 977, c);
      const b = typeof lit === 'function' ? lit(wx, wy, k) : (k < lit ? 1 : 0);
      if (b <= 0) continue;
      ctx.globalAlpha = b * (0.45 + 0.55 * hash(seed + c * 131, rr));
      ctx.fillRect(wx, wy, cw, ch);
    }
  }
  ctx.restore();
}

function skyline(seed, baseY, minH, maxH, color, o = {}) {
  const r = rng(seed), blds = [];
  let x = -40 + r() * 20;
  while (x < W + 40) {
    const w = (o.minW || 60) + r() * (o.varW || 110), h = minH + r() * (maxH - minH);
    blds.push({ x, w, h, roof: r(), seed: Math.floor(r() * 1e6) });
    x += w + r() * 6;
  }
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const b of blds) {
    ctx.rect(b.x, baseY - b.h, b.w, b.h + 2);
    if (b.roof > 0.82) ctx.rect(b.x + b.w * 0.45, baseY - b.h - 46, 5, 46);
    else if (b.roof > 0.62) ctx.rect(b.x + b.w * 0.15, baseY - b.h - 20, b.w * 0.7, 20);
  }
  ctx.fill();
  ctx.restore();
  if (o.windows) for (const b of blds) windows(b.x + 7, baseY - b.h + 12, b.w - 14, b.h - 20, b.seed, o.windows, o.win || {});
}

function litWindow(x, y, w, h, seed, r = 10) {
  ctx.save();
  ctx.fillStyle = '#1A1F45';
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 5, w + 10, h + 10, r + 4);
  ctx.fill();
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  ctx.fillStyle = linear(0, y, 0, y + h, [[0, '#FFE9B0'], [1, '#F0A040']]);
  ctx.fill(p);
  ctx.clip(p);
  if (hash(seed, 3) < 0.75) {
    const px = x + w * (0.25 + 0.5 * hash(seed, 4)), hr = Math.min(w, h) * 0.17;
    ctx.fillStyle = '#5A3A55';
    ctx.beginPath();
    ctx.arc(px, y + h * 0.6, hr, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(px - hr * 1.3, y + h * 0.6 + hr * 0.9, hr * 2.6, h, hr);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, y + h);
  ctx.lineTo(x + w * 0.45, y);
  ctx.lineTo(x + w * 0.6, y);
  ctx.lineTo(x + w * 0.25, y + h);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- landmarks & props
function bigBen(cx, baseY, h, o = {}) {
  const u = h / 100, Y = (p) => baseY - p * u;
  const body = o.body || '#2E2A5E', shade = o.shade || '#211D49', hi = o.hi || '#5A4C91';
  const sw = 10.5 * u, cw = 13 * u, bw = 11.6 * u;
  const p = new Path2D();
  p.rect(cx - sw / 2, Y(60), sw, 60 * u);
  p.rect(cx - cw / 2, Y(71), cw, 11.2 * u);
  p.rect(cx - bw / 2, Y(79.5), bw, 8.7 * u);
  for (const s of [-1, 1]) {
    const px = cx + s * (bw / 2 - 0.9 * u);
    p.rect(px - 0.9 * u, Y(84), 1.8 * u, 4.6 * u);
    p.moveTo(px - 0.9 * u, Y(84));
    p.lineTo(px, Y(87.5));
    p.lineTo(px + 0.9 * u, Y(84));
    p.closePath();
  }
  p.moveTo(cx - bw * 0.4, Y(79.4));
  p.lineTo(cx, Y(95));
  p.lineTo(cx + bw * 0.4, Y(79.4));
  p.closePath();
  p.rect(cx - 0.4 * u, Y(100), 0.8 * u, 6 * u);
  ctx.save();
  ctx.fillStyle = body;
  ctx.fill(p);
  ctx.save();
  ctx.clip(p);
  ctx.fillStyle = shade;
  ctx.fillRect(cx + sw * 0.12, Y(101), cw, 101 * u);
  ctx.fillStyle = hi;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(cx - sw / 2, Y(60), 0.9 * u, 60 * u);
  ctx.fillRect(cx - cw / 2, Y(71), 0.9 * u, 11 * u);
  ctx.globalAlpha = 0.25;
  for (let k = -2; k <= 2; k++) ctx.fillRect(cx + k * sw * 0.19 - 0.2 * u, Y(58), 0.4 * u, 55 * u);
  for (const q of [16, 32, 47, 59.5]) ctx.fillRect(cx - cw, Y(q), 2 * cw, 0.6 * u);
  ctx.restore();
  ctx.fillStyle = o.belfry || C.amber;
  ctx.globalAlpha = o.belfryA ?? 0.75;
  for (const k of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.roundRect(cx + k * 3.3 * u - 1.1 * u, Y(78), 2.2 * u, 5.2 * u, [1.1 * u, 1.1 * u, 0, 0]);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const cy = Y(65.5), cr = 4.4 * u;
  glow(cx, cy, cr * 5, o.glowHex || C.warm, o.glowA ?? 0.75);
  ctx.fillStyle = '#1A1638';
  ctx.beginPath();
  ctx.arc(cx, cy, cr * 1.2, 0, TAU);
  ctx.fill();
  const g = ctx.createRadialGradient(cx - cr * 0.3, cy - cr * 0.3, 0, cx, cy, cr);
  g.addColorStop(0, '#FFF6D8');
  g.addColorStop(1, '#FFC24F');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3A2A45';
  ctx.fillStyle = '#3A2A45';
  ctx.lineCap = 'round';
  const tm = o.time ?? 7.1, ma = (tm % 1) * TAU - Math.PI / 2, ha = ((tm % 12) / 12) * TAU - Math.PI / 2;
  ctx.lineWidth = 0.8 * u;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(ha) * cr * 0.5, cy + Math.sin(ha) * cr * 0.5);
  ctx.stroke();
  ctx.lineWidth = 0.5 * u;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(ma) * cr * 0.8, cy + Math.sin(ma) * cr * 0.8);
  ctx.stroke();
  for (let k = 0; k < 12; k++) {
    const a = k * TAU / 12;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * cr * 0.85, cy + Math.sin(a) * cr * 0.85, 0.25 * u, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  return cy;
}

function parliament(x0, x1, baseY, h, o = {}) {
  const r = rng(o.seed || 3);
  ctx.save();
  ctx.fillStyle = o.color || '#2E2558';
  ctx.fillRect(x0, baseY - h, x1 - x0, h + 2);
  ctx.beginPath();
  for (let x = x0 + 6; x < x1 - 6; x += 18 + r() * 10) {
    const ph = h * (0.1 + r() * 0.12);
    ctx.moveTo(x - 4, baseY - h + 1);
    ctx.lineTo(x, baseY - h - ph);
    ctx.lineTo(x + 4, baseY - h + 1);
  }
  ctx.fill();
  for (const [fx, mul, tw] of o.towers || []) {
    const tx = x0 + fx * (x1 - x0), th = h * mul;
    ctx.fillRect(tx - tw / 2, baseY - th, tw, th);
    ctx.beginPath();
    ctx.moveTo(tx - tw * 0.55, baseY - th + 1);
    ctx.lineTo(tx, baseY - th - tw * 1.3);
    ctx.lineTo(tx + tw * 0.55, baseY - th + 1);
    for (const s of [-1, 1]) {
      ctx.moveTo(tx + s * tw / 2 - 4, baseY - th + 1);
      ctx.lineTo(tx + s * tw / 2, baseY - th - tw * 0.55);
      ctx.lineTo(tx + s * tw / 2 + 4, baseY - th + 1);
    }
    ctx.fill();
  }
  const lit = o.lit ?? 0.5;
  ctx.fillStyle = o.winColor || C.window;
  for (const fy of [0.3, 0.55, 0.8]) {
    for (let x = x0 + 12; x < x1 - 10; x += 16) {
      if (r() > lit) continue;
      ctx.globalAlpha = 0.5 + 0.5 * r();
      ctx.beginPath();
      ctx.roundRect(x, baseY - h * fy - 7, 6, 14, [3, 3, 0, 0]);
      ctx.fill();
    }
  }
  ctx.restore();
}

function archBridge(x0, x1, deckY, archH, col, n, o = {}) {
  ctx.save();
  ctx.fillStyle = col;
  ctx.fillRect(x0, deckY - 14, x1 - x0, 32);
  const p = new Path2D(), span = (x1 - x0) / n, by = deckY + 18 + archH;
  p.rect(x0, deckY + 18, x1 - x0, archH);
  for (let i = 0; i < n; i++) {
    const cx = x0 + span * (i + 0.5);
    p.moveTo(cx - span * 0.42, by);
    p.ellipse(cx, by, span * 0.42, archH * 0.85, 0, Math.PI, TAU);
    p.closePath();
  }
  ctx.fill(p, 'evenodd');
  ctx.restore();
  if (o.lamps) {
    for (let x = x0 + 24; x < x1; x += 70) {
      ctx.fillStyle = col;
      ctx.fillRect(x - 2, deckY - 40, 4, 28);
      glow(x, deckY - 42, 30, o.lampHex || '#FFE7A0', 0.85);
    }
  }
}

function towerBridge(cx, deckY, s, t) {
  const sep = 240 * s, tw = 150 * s, top = deckY - 620 * s, base = deckY + 230 * s;
  ctx.save();
  ctx.strokeStyle = '#3F7FE0';
  ctx.lineWidth = 15 * s;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + side * (sep + tw * 0.3), top + 150 * s);
    ctx.quadraticCurveTo(cx + side * (sep + 260 * s), deckY - 40 * s, cx + side * (sep + 760 * s), deckY - 70 * s);
    ctx.stroke();
  }
  const wy1 = top + 70 * s, wy2 = top + 140 * s;
  ctx.fillStyle = '#2C5FC0';
  ctx.fillRect(cx - sep, wy1, 2 * sep, 18 * s);
  ctx.fillRect(cx - sep, wy2, 2 * sep, 18 * s);
  ctx.strokeStyle = '#5A9BFF';
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  for (let x = cx - sep; x < cx + sep; x += 30 * s) {
    ctx.moveTo(x, wy1 + 18 * s);
    ctx.lineTo(x + 15 * s, wy2);
    ctx.lineTo(x + 30 * s, wy1 + 18 * s);
  }
  ctx.stroke();
  glow(cx, (wy1 + wy2) / 2, sep * 1.1, C.neon, 0.4);
  ctx.fillStyle = '#1C2450';
  ctx.fillRect(cx - sep - 900 * s, deckY - 26 * s, 2 * sep + 1800 * s, 44 * s);
  ctx.fillStyle = '#3F7FE0';
  ctx.fillRect(cx - sep - 900 * s, deckY - 32 * s, 2 * sep + 1800 * s, 7 * s);
  for (const side of [-1, 1]) {
    const x = cx + side * sep;
    ctx.fillStyle = '#8C7752';
    ctx.beginPath();
    ctx.roundRect(x - tw * 0.75, deckY + 60 * s, tw * 1.5, base - deckY - 60 * s, 10 * s);
    ctx.fill();
    ctx.fillStyle = linear(0, top, 0, deckY, [[0, '#FCE8C0'], [1, '#D7A967']]);
    ctx.fillRect(x - tw / 2, top + 40 * s, tw, deckY + 60 * s - top - 40 * s);
    ctx.fillStyle = 'rgba(120,80,40,0.25)';
    ctx.fillRect(x + tw * 0.15, top + 40 * s, tw * 0.35, deckY + 60 * s - top - 40 * s);
    for (const k of [-1, 1]) {
      const tx = x + k * (tw / 2 - 12 * s);
      ctx.fillStyle = '#F3DAA8';
      ctx.fillRect(tx - 13 * s, top - 30 * s, 26 * s, 90 * s);
      ctx.fillStyle = '#2A3566';
      ctx.beginPath();
      ctx.moveTo(tx - 17 * s, top - 28 * s);
      ctx.lineTo(tx, top - 95 * s);
      ctx.lineTo(tx + 17 * s, top - 28 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(tx - 1.5 * s, top - 122 * s, 3 * s, 30 * s);
    }
    ctx.fillStyle = '#2A3566';
    ctx.beginPath();
    ctx.moveTo(x - tw * 0.32, top + 42 * s);
    ctx.lineTo(x, top - 70 * s);
    ctx.lineTo(x + tw * 0.32, top + 42 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3A3F6E';
    for (const wy of [top + 190 * s, top + 290 * s, top + 390 * s]) {
      for (const k of [-1, 1]) {
        ctx.beginPath();
        ctx.roundRect(x + k * 30 * s - 9 * s, wy, 18 * s, 50 * s, [9 * s, 9 * s, 0, 0]);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#141A3A';
    ctx.beginPath();
    ctx.roundRect(x - 40 * s, deckY - 150 * s, 80 * s, 150 * s, [40 * s, 40 * s, 0, 0]);
    ctx.fill();
  }
  ctx.restore();
  for (const side of [-1, 1]) glow(cx + side * sep, top + 250 * s, 260 * s, '#FFD9A0', 0.25);
}

function towerOfLondon(cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = '#C7B48A';
  ctx.beginPath();
  ctx.roundRect(-150, -90, 300, 200, 40);
  ctx.fill();
  ctx.fillStyle = '#1E4434';
  ctx.beginPath();
  ctx.roundRect(-128, -72, 256, 166, 30);
  ctx.fill();
  ctx.fillStyle = '#D9C69A';
  for (const [x, y] of [[-150, -90], [150, -90], [-150, 110], [150, 110], [0, -90], [0, 110]]) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#F6EBD2';
  ctx.fillRect(-62, -60, 124, 100);
  ctx.fillStyle = '#D9CBA8';
  ctx.beginPath();
  ctx.moveTo(-62, -60); ctx.lineTo(-40, -82); ctx.lineTo(84, -82); ctx.lineTo(62, -60);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#CDBE98';
  ctx.beginPath();
  ctx.moveTo(62, -60); ctx.lineTo(84, -82); ctx.lineTo(84, 18); ctx.lineTo(62, 40);
  ctx.closePath();
  ctx.fill();
  for (const [x, y] of [[-58, -66], [58, -66], [-38, -86], [80, -86]]) {
    ctx.fillStyle = '#F6EBD2';
    ctx.fillRect(x - 9, y - 26, 18, 26);
    ctx.fillStyle = '#3A4A6E';
    ctx.beginPath();
    ctx.ellipse(x, y - 26, 10, 12, 0, Math.PI, TAU);
    ctx.fill();
  }
  ctx.fillStyle = C.window;
  for (const x of [-40, -14, 12, 38]) for (const y of [-40, -8]) ctx.fillRect(x - 4, y, 8, 14);
  ctx.restore();
  glow(cx, cy - 20 * s, 230 * s, '#FFE2A8', 0.25);
}

function londonEye(cx, cy, r, rot, o = {}) {
  const rim = o.rim || C.neon;
  ctx.save();
  ctx.lineCap = 'round';
  if (!o.trail) {
    ctx.strokeStyle = o.leg || '#1C2A5E';
    ctx.lineWidth = r * 0.05;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * 0.55, cy + r * 1.35);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * 0.88, cy + r * 1.25);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(207,232,255,0.4)';
    ctx.lineWidth = Math.max(1.5, r * 0.006);
    ctx.beginPath();
    for (let k = 0; k < 64; k++) {
      const a = rot + k * TAU / 64;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.stroke();
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowColor = rim;
  ctx.shadowBlur = r * 0.09;
  ctx.strokeStyle = rim;
  ctx.lineWidth = r * 0.024;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = r * 0.012;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.93, 0, TAU);
  ctx.stroke();
  if (o.trail) {
    ctx.lineWidth = r * 0.01;
    ctx.beginPath();
    for (let k = 0; k < 16; k++) {
      const a = rot + k * TAU / 16;
      ctx.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.stroke();
  }
  ctx.restore();
  if (!o.trail) {
    for (let k = 0; k < 32; k++) {
      const a = rot + k * TAU / 32, x = cx + Math.cos(a) * r * 1.04, y = cy + Math.sin(a) * r * 1.04;
      ctx.fillStyle = '#E8F6FF';
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.042, r * 0.026, 0, 0, TAU);
      ctx.fill();
      glow(x, y, r * 0.06, '#BFE6FF', 0.35);
    }
    ctx.fillStyle = '#2A3A7A';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.05, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  glow(cx, cy, r * 0.25, rim, 0.25);
}

function shard(cx, baseY, h, w, t, o = {}) {
  const top = baseY - h;
  const body = new Path2D();
  body.moveTo(cx - w / 2, baseY);
  body.lineTo(cx - w * 0.07, top + h * 0.05);
  body.lineTo(cx - w * 0.02, top);
  body.lineTo(cx + w * 0.05, top + h * 0.03);
  body.lineTo(cx + w * 0.1, top + h * 0.08);
  body.lineTo(cx + w / 2, baseY);
  body.closePath();
  ctx.save();
  ctx.fillStyle = linear(cx - w / 2, 0, cx + w / 2, 0,
    [[0, '#7E9BDB'], [0.47, '#4664B4'], [0.47, '#283C7E'], [1, '#1A2A5E']]);
  ctx.fill(body);
  ctx.clip(body);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = Math.max(2, w * 0.005);
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.02, top);
  ctx.lineTo(cx - w * 0.03, baseY);
  ctx.moveTo(cx + w * 0.1, top + h * 0.08);
  ctx.lineTo(cx + w * 0.22, baseY);
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,225,255,0.12)';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.5, baseY - h * 0.3);
  ctx.lineTo(cx - w * 0.1, baseY - h * 0.75);
  ctx.lineTo(cx - w * 0.05, baseY - h * 0.7);
  ctx.lineTo(cx - w * 0.45, baseY - h * 0.22);
  ctx.fill();
  const r = rng(o.seed || 17);
  ctx.fillStyle = C.window;
  for (let i = 0; i < (o.windows ?? 260); i++) {
    const y = top + h * (0.1 + 0.9 * r()), hw = ((y - top) / h) * w / 2, x = cx + (r() * 2 - 1) * hw;
    ctx.globalAlpha = (0.25 + 0.6 * r()) * (0.75 + 0.25 * Math.sin(t * 3 + i));
    ctx.fillRect(x, y, Math.max(2, w * 0.008), Math.max(3, w * 0.011));
  }
  ctx.restore();
  ctx.save();
  ctx.fillStyle = '#9DB6EA';
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.045, top + h * 0.03);
  ctx.lineTo(cx - w * 0.035, top - h * 0.025);
  ctx.lineTo(cx - w * 0.01, top + h * 0.01);
  ctx.moveTo(cx + w * 0.03, top + h * 0.025);
  ctx.lineTo(cx + w * 0.065, top - h * 0.015);
  ctx.lineTo(cx + w * 0.075, top + h * 0.045);
  ctx.fill();
  ctx.restore();
  glow(cx, top + h * 0.03, h * 0.12, '#CFE3FF', 0.45);
  const pulse = 0.5 + 0.5 * Math.sin(t * 5);
  glow(cx - w * 0.01, top - h * 0.005, Math.max(30, h * 0.05), '#FF3B4E', 0.45 + 0.4 * pulse);
  ctx.fillStyle = '#FF4D5E';
  ctx.beginPath();
  ctx.arc(cx - w * 0.01, top - h * 0.005, Math.max(3, h * 0.004), 0, TAU);
  ctx.fill();
}

function stPauls(cx, baseY, s, o = {}) {
  const lit = '#FFF0CF', mid = '#E8C98F', dark = '#B48C55';
  ctx.save();
  ctx.fillStyle = mid;
  ctx.fillRect(cx - 260 * s, baseY - 130 * s, 520 * s, 132 * s);
  for (const k of [-1, 1]) {
    const x = cx + k * 200 * s;
    ctx.fillStyle = mid;
    ctx.fillRect(x - 32 * s, baseY - 250 * s, 64 * s, 250 * s);
    ctx.fillStyle = lit;
    ctx.beginPath();
    ctx.ellipse(x, baseY - 250 * s, 30 * s, 34 * s, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillRect(x - 3 * s, baseY - 310 * s, 6 * s, 30 * s);
  }
  ctx.fillStyle = mid;
  ctx.fillRect(cx - 120 * s, baseY - 250 * s, 240 * s, 120 * s);
  ctx.fillStyle = lit;
  for (let k = -5; k <= 5; k++) ctx.fillRect(cx + k * 21 * s - 4 * s, baseY - 245 * s, 8 * s, 105 * s);
  ctx.fillStyle = dark;
  ctx.fillRect(cx - 128 * s, baseY - 262 * s, 256 * s, 16 * s);
  ctx.fillStyle = linear(cx - 130 * s, 0, cx + 130 * s, 0, [[0, lit], [0.6, mid], [1, dark]]);
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 262 * s, 128 * s, 150 * s, 0, Math.PI, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(138,106,58,0.5)';
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  for (const k of [-0.7, -0.35, 0, 0.35, 0.7]) {
    ctx.moveTo(cx, baseY - 410 * s);
    ctx.quadraticCurveTo(cx + k * 150 * s, baseY - 380 * s, cx + k * 128 * s, baseY - 262 * s);
  }
  ctx.stroke();
  ctx.fillStyle = lit;
  ctx.fillRect(cx - 16 * s, baseY - 470 * s, 32 * s, 62 * s);
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 470 * s, 18 * s, 16 * s, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = C.yellow;
  ctx.beginPath();
  ctx.arc(cx, baseY - 492 * s, 7 * s, 0, TAU);
  ctx.fill();
  ctx.fillRect(cx - 2 * s, baseY - 525 * s, 4 * s, 28 * s);
  ctx.fillRect(cx - 9 * s, baseY - 516 * s, 18 * s, 4 * s);
  ctx.restore();
  glow(cx, baseY - 300 * s, 360 * s, '#FFE2A8', o.glowA ?? 0.35);
}

function gherkin(cx, baseY, h, lit) {
  const w = h * 0.36, p = new Path2D();
  p.moveTo(cx - w * 0.38, baseY);
  p.bezierCurveTo(cx - w * 0.62, baseY - h * 0.45, cx - w * 0.42, baseY - h * 0.9, cx, baseY - h);
  p.bezierCurveTo(cx + w * 0.42, baseY - h * 0.9, cx + w * 0.62, baseY - h * 0.45, cx + w * 0.38, baseY);
  p.closePath();
  ctx.save();
  ctx.fillStyle = linear(cx - w / 2, 0, cx + w / 2, 0, [[0, '#3C5A9A'], [1, '#1B2A62']]);
  ctx.fill(p);
  ctx.clip(p);
  ctx.strokeStyle = 'rgba(20,30,70,0.55)';
  ctx.lineWidth = 9;
  ctx.beginPath();
  for (let k = -14; k < 14; k++) {
    ctx.moveTo(cx - w + k * 36, baseY);
    ctx.lineTo(cx + w + k * 36, baseY - h);
  }
  ctx.stroke();
  windows(cx - w / 2, baseY - h * 0.92, w, h * 0.92, 191, lit, { cw: 6, ch: 6, gx: 8, gy: 10, color: '#FFE2A8' });
  ctx.restore();
}

function walkieTalkie(cx, baseY, h, lit) {
  const b = h * 0.21, tp = h * 0.31, p = new Path2D();
  p.moveTo(cx - b, baseY);
  p.lineTo(cx - tp, baseY - h * 0.92);
  p.quadraticCurveTo(cx, baseY - h * 1.06, cx + tp, baseY - h * 0.92);
  p.lineTo(cx + b, baseY);
  p.closePath();
  ctx.save();
  ctx.fillStyle = linear(cx - tp, 0, cx + tp, 0, [[0, '#33468E'], [1, '#1A2558']]);
  ctx.fill(p);
  ctx.clip(p);
  windows(cx - tp, baseY - h, 2 * tp, h, 193, lit, { cw: 8, ch: 7, gx: 7, gy: 9, color: '#FFE2A8' });
  ctx.restore();
}

function cheesegrater(cx, baseY, h, lit) {
  const p = new Path2D();
  p.moveTo(cx - h * 0.2, baseY);
  p.lineTo(cx + h * 0.04, baseY - h);
  p.lineTo(cx + h * 0.14, baseY - h);
  p.lineTo(cx + h * 0.16, baseY);
  p.closePath();
  ctx.save();
  ctx.fillStyle = linear(cx - h * 0.2, 0, cx + h * 0.16, 0, [[0, '#4A5DA6'], [1, '#202C66']]);
  ctx.fill(p);
  ctx.clip(p);
  windows(cx - h * 0.2, baseY - h, h * 0.36, h, 197, lit, { cw: 7, ch: 6, gx: 6, gy: 12, color: '#FFE2A8' });
  ctx.restore();
}

function millenniumBridge(y, t) {
  ctx.save();
  ctx.fillStyle = '#AEB9D6';
  ctx.fillRect(-20, y, W + 40, 12);
  ctx.strokeStyle = '#8E9BC0';
  ctx.lineWidth = 5;
  for (const dy of [16, 26]) {
    ctx.beginPath();
    ctx.moveTo(-20, y + dy - 6);
    ctx.quadraticCurveTo(160, y + dy + 6, 330, y + dy - 4);
    ctx.quadraticCurveTo(540, y + dy + 10, 750, y + dy - 4);
    ctx.quadraticCurveTo(920, y + dy + 6, W + 20, y + dy - 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#8E9BC0';
  ctx.strokeStyle = '#8E9BC0';
  ctx.lineWidth = 9;
  for (const x of [330, 750]) {
    ctx.fillRect(x - 10, y + 50, 20, 170);
    ctx.beginPath();
    ctx.moveTo(x - 70, y + 14);
    ctx.lineTo(x, y + 56);
    ctx.lineTo(x + 70, y + 14);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowColor = C.neon;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = C.neon;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-20, y + 13);
  ctx.lineTo(W + 20, y + 13);
  ctx.stroke();
  ctx.restore();
  reflection(540, y + 40, y + 420, 1000, C.neon, t, 0.12, 401);
}

function lamp(x, baseY, s, t, o = {}) {
  const col = o.color || '#161A40';
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(s, s);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.roundRect(-24, -70, 48, 70, 8);
  ctx.roundRect(-15, -130, 30, 66, 8);
  ctx.fill();
  ctx.fillRect(-8, -430, 16, 310);
  ctx.beginPath();
  ctx.roundRect(-17, -440, 34, 16, 5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-30, -520); ctx.lineTo(30, -520); ctx.lineTo(20, -440); ctx.lineTo(-20, -440);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = linear(0, -515, 0, -446, [[0, '#FFF6DA'], [1, o.glass || '#FFC24F']]);
  ctx.beginPath();
  ctx.moveTo(-23, -512); ctx.lineTo(23, -512); ctx.lineTo(15, -448); ctx.lineTo(-15, -448);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(-38, -518);
  ctx.quadraticCurveTo(0, -565, 38, -518);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-4, -585, 8, 26);
  ctx.restore();
  glow(x, baseY - 480 * s, (o.r || 300) * s, o.hex || C.warm, (o.a ?? 0.55) + 0.04 * Math.sin(t * 9));
}

function tree(x, baseY, s, t, seed = 141) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(s, s);
  ctx.fillStyle = '#0E1230';
  ctx.fillRect(-12, -260, 24, 262);
  ctx.beginPath();
  for (const [dx, dy, rr] of [[0, -330, 150], [-95, -280, 100], [95, -290, 105]]) {
    ctx.moveTo(dx + rr, dy);
    ctx.arc(dx, dy, rr, 0, TAU);
  }
  ctx.fill();
  const r = rng(seed);
  for (let i = 0; i < 70; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * 150, ph = r() * TAU;
    const px = Math.cos(a) * d * 1.3, py = -310 + Math.sin(a) * d * 0.8;
    const on = 0.55 + 0.45 * Math.sin(t * 6 + ph);
    ctx.fillStyle = rgba('#FFE7A0', on);
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  glow(x, baseY - 310 * s, 230 * s, '#FFD27A', 0.18);
}

function person(x, y, s, col, phase = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
  const b = Math.abs(Math.sin(phase)) * 4, sw = Math.sin(phase) * 10;
  ctx.beginPath();
  ctx.roundRect(-14, -110 - b, 28, 62, 14);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -128 - b, 15, 0, TAU);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -52 - b);
  ctx.lineTo(-6 + sw, 0);
  ctx.moveTo(6, -52 - b);
  ctx.lineTo(6 - sw, 0);
  ctx.stroke();
  ctx.restore();
}

function bus(x, y, s, t, o = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,20,0.35)';
  ctx.beginPath();
  ctx.ellipse(450, 4, 450, 16, 0, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(0, o.bob || 0);
  ctx.fillStyle = linear(0, -440, 0, -50, [[0, '#FF3355'], [0.55, C.red], [1, '#B3001F']]);
  ctx.beginPath();
  ctx.roundRect(0, -440, 900, 390, [36, 64, 20, 20]);
  ctx.fill();
  ctx.fillStyle = C.cream;
  ctx.fillRect(8, -246, 884, 12);
  ctx.fillStyle = 'rgba(80,0,20,0.35)';
  ctx.fillRect(0, -92, 900, 40);
  for (let k = 0; k < 4; k++) litWindow(40 + k * 180, -410, 150, 120, k + 11);
  litWindow(760, -410, 110, 120, 19, 12);
  for (let k = 0; k < 3; k++) litWindow(40 + k * 180, -212, 150, 104, k + 21);
  litWindow(590, -212, 80, 160, 29, 8);
  litWindow(760, -222, 116, 140, 27, 14);
  ctx.fillStyle = '#111426';
  ctx.beginPath();
  ctx.roundRect(744, -436, 146, 26, 6);
  ctx.fill();
  ctx.fillStyle = C.amber;
  ctx.font = '900 19px Nunito';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SOUTH BANK', 817, -422);
  ctx.fillStyle = '#5E0012';
  for (const wx of [190, 720]) {
    ctx.beginPath();
    ctx.arc(wx, -50, 70, Math.PI, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#FFF6D0';
  ctx.beginPath();
  ctx.arc(884, -92, 13, 0, TAU);
  ctx.fill();
  glow(900, -92, 150, '#FFF0B0', 0.6);
  ctx.restore();
  for (const wx of [190, 720]) {
    ctx.fillStyle = '#141833';
    ctx.beginPath();
    ctx.arc(wx, -54, 54, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#9AA6C8';
    ctx.beginPath();
    ctx.arc(wx, -54, 24, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#141833';
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = (o.spin || 0) + k * TAU / 5;
      ctx.moveTo(wx, -54);
      ctx.lineTo(wx + Math.cos(a) * 22, -54 + Math.sin(a) * 22);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// Underground train side view, cab at x0 facing left
function tubeTrain(x0, yTop, s, o = {}) {
  const Hh = 440, L = 2300;
  ctx.save();
  ctx.translate(x0, yTop);
  ctx.scale(s, s);
  if (o.squash) {
    ctx.translate(0, Hh);
    ctx.scale(1 - 0.06 * o.squash, 1 + 0.05 * o.squash);
    ctx.translate(0, -Hh);
  }
  const body = new Path2D();
  body.roundRect(0, 0, L, Hh, [190, 0, 0, 50]);
  ctx.fillStyle = linear(0, 0, 0, Hh, [[0, '#F7F9FC'], [1, '#C5CFE2']]);
  ctx.fill(body);
  ctx.save();
  ctx.clip(body);
  ctx.fillStyle = linear(0, 0, 0, Hh, [[0, '#FF3355'], [1, '#B3001F']]);
  ctx.fillRect(0, 0, 175, Hh);
  ctx.fillStyle = '#1B3FA0';
  ctx.fillRect(0, Hh - 78, L, 34);
  ctx.fillStyle = 'rgba(30,40,80,0.18)';
  ctx.fillRect(0, 0, L, 26);
  ctx.restore();
  ctx.fillStyle = '#16204A';
  ctx.beginPath();
  ctx.roundRect(26, 70, 120, 160, [80, 12, 12, 12]);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.moveTo(40, 210); ctx.lineTo(90, 80); ctx.lineTo(112, 80); ctx.lineTo(62, 210);
  ctx.fill();
  ctx.fillStyle = '#FFF6D0';
  ctx.beginPath();
  ctx.arc(52, 320, 17, 0, TAU);
  ctx.fill();
  glow(30, 320, 160, '#FFF0B0', 0.65);
  for (let k = 0; k < 5; k++) {
    const dx = 300 + k * 470;
    ctx.fillStyle = C.red;
    ctx.beginPath();
    ctx.roundRect(dx, 52, 170, 330, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(dx + 83, 52, 4, 330);
    for (const j of [0, 1]) litWindow(dx + 18 + j * 78, 80, 56, 150, k * 2 + j, 8);
    litWindow(dx + 205, 80, 225, 150, 50 + k, 14);
  }
  ctx.restore();
}

function flashcard(x, y, s, rot, label, crumple = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s * (1 - 0.4 * crumple), s * (1 - 0.25 * crumple));
  ctx.fillStyle = 'rgba(0,0,20,0.25)';
  ctx.beginPath();
  ctx.roundRect(-64, -40, 140, 96, 14);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(-70, -48, 140, 96, 14);
  ctx.fill();
  ctx.fillStyle = '#4FA3FF';
  ctx.beginPath();
  ctx.roundRect(-70, -48, 140, 22, [14, 14, 0, 0]);
  ctx.fill();
  ctx.fillStyle = C.navy;
  ctx.font = '900 36px Nunito';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 12);
  if (crumple > 0) {
    ctx.strokeStyle = `rgba(11,31,75,${0.35 * crumple})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-60, -20); ctx.lineTo(-10, 10); ctx.lineTo(30, -30); ctx.lineTo(62, 30);
    ctx.moveTo(-50, 40); ctx.lineTo(0, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function chalkboard(x, y, s, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.strokeStyle = '#6E4520';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-90, 60); ctx.lineTo(-120, 230);
  ctx.moveTo(90, 60); ctx.lineTo(120, 230);
  ctx.stroke();
  ctx.fillStyle = '#8A5A2B';
  ctx.beginPath();
  ctx.roundRect(-130, -90, 260, 180, 14);
  ctx.fill();
  ctx.fillStyle = '#1F5E46';
  ctx.beginPath();
  ctx.roundRect(-114, -74, 228, 148, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '800 38px Nunito';
  ctx.textAlign = 'center';
  ctx.fillText('ABC', -20, -8);
  ctx.fillText('1 2 3', 14, 46);
  ctx.restore();
}

function poof(x, y, age, s = 1) {
  if (age < 0 || age > 0.45) return;
  const k = age / 0.45;
  const r = rng(321);
  ctx.save();
  ctx.globalAlpha = 1 - k * k;
  ctx.fillStyle = '#EEF2FA';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = i * TAU / 10 + r() * 0.4, d = (40 + 50 * r()) * s * easeOut(k * 1.6), rr = (30 + 22 * r()) * s * (1 - 0.55 * k);
    ctx.moveTo(x + Math.cos(a) * d + rr, y + Math.sin(a) * d);
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rr, 0, TAU);
  }
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6 + 0.3, d = 150 * s * easeOut(k * 1.3);
    sparkle(x + Math.cos(a) * d, y + Math.sin(a) * d, 16 * s * (1 - k), C.yellow, k * 3);
  }
}

// confetti + sparkles flying out from a point
function burst(x, y, age, seed, n = 24, spread = 520, cols = [C.yellow, '#FFFFFF', C.red, C.neon]) {
  if (age < 0) return;
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, v = (0.4 + 0.6 * r()) * spread, sz = 10 + r() * 18, kind = r();
    const col = cols[Math.floor(r() * cols.length)], spin = (r() - 0.5) * 8;
    const d = v * (1 - Math.exp(-age / 0.12));
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d + 300 * age * age;
    const al = clamp(1 - (age - 0.15) / 0.35);
    if (al <= 0) continue;
    ctx.save();
    ctx.globalAlpha = al;
    if (kind < 0.5) {
      sparkle(px, py, sz, col, spin * age);
    } else {
      ctx.fillStyle = col;
      ctx.translate(px, py);
      ctx.rotate(spin * age);
      ctx.fillRect(-sz * 0.35, -sz * 0.18, sz * 0.7, sz * 0.36);
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------- the mascot
// A chunky speech-bubble character in a red scarf, with a yellow "notification" antenna (echoes
// the app icon). Origin is the point between its feet. Options:
//   sq squash/stretch (1 = rest), lift jump height, rot lean, look [x, y] pupils,
//   eyes open|wide|happy|sparkle, mouth smile|open|o|grin, armL/armR angle from hanging (rad),
//   step walk phase (rad), wind scarf -1..1, wobble antenna bounce, shadow false to hide it
function mascot(x, y, s, o = {}) {
  const t = o.t || 0, sq = o.sq || 1, look = o.look || [0, 0];
  ctx.save();
  ctx.translate(x, y);
  if (o.shadow !== false) {
    ctx.fillStyle = 'rgba(0,0,20,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 125 * s * (o.shadowK ?? 1), 18 * s, 0, 0, TAU);
    ctx.fill();
  }
  ctx.translate(0, -(o.lift || 0));
  ctx.rotate(o.rot || 0);
  ctx.scale(s / Math.sqrt(sq), s * sq);

  for (const side of [-1, 1]) {
    const lift = o.step === undefined ? 0 : Math.max(0, Math.sin(o.step + (side > 0 ? Math.PI : 0))) * 24;
    ctx.fillStyle = C.navy;
    ctx.beginPath();
    ctx.roundRect(side * 46 - 19, -84 - lift, 38, 68, 19);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(side * 50 + 8, -14 - lift, 35, 17, 0, 0, TAU);
    ctx.fill();
  }

  const arm = (side, ang) => {
    ctx.save();
    ctx.translate(side * 112, -172);
    ctx.rotate(-side * ang);
    ctx.fillStyle = '#C9D4EA';
    ctx.beginPath();
    ctx.roundRect(-19, -8, 38, 98, 19);
    ctx.fill();
    ctx.fillStyle = '#F2F5FB';
    ctx.beginPath();
    ctx.roundRect(-19 - side * 4, -10, 34, 94, 17);
    ctx.fill();
    ctx.restore();
  };
  arm(-1, o.armL ?? 0.35);
  arm(1, o.armR ?? 0.35);

  const body = new Path2D();
  body.roundRect(-132, -312, 264, 242, 104);
  body.moveTo(-70, -92);
  body.quadraticCurveTo(-92, -48, -138, -36);
  body.quadraticCurveTo(-82, -42, -34, -80);
  body.closePath();
  ctx.fillStyle = '#C9D4EA';
  ctx.fill(body);
  ctx.save();
  ctx.clip(body);
  ctx.translate(-16, -14);
  ctx.fillStyle = linear(0, -312, 0, -60, [[0, '#FFFFFF'], [1, '#EEF2F9']]);
  ctx.fill(body);
  ctx.restore();

  // scarf
  ctx.save();
  ctx.clip(body);
  ctx.fillStyle = C.red;
  ctx.beginPath();
  ctx.moveTo(-150, -132);
  ctx.quadraticCurveTo(0, -112, 150, -136);
  ctx.lineTo(150, -100);
  ctx.quadraticCurveTo(0, -76, -150, -96);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#B0001F';
  ctx.beginPath();
  ctx.moveTo(-150, -104);
  ctx.quadraticCurveTo(0, -84, 150, -108);
  ctx.lineTo(150, -100);
  ctx.quadraticCurveTo(0, -76, -150, -96);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  const wind = o.wind || 0, n = 8, segLen = 15;
  const rest = Math.PI / 2 - 0.25, blown = wind < 0 ? Math.PI - 0.12 : 0.12;
  const base = lerp(rest, blown, Math.abs(wind));
  const pts = [[78, -108]];
  for (let i = 1; i <= n; i++) {
    const u = i / n, a = base + Math.sin(t * 22 - i * 0.9) * (0.08 + 0.3 * Math.abs(wind)) * u;
    const [px, py] = pts[i - 1];
    pts.push([px + Math.cos(a) * segLen, py + Math.sin(a) * segLen]);
  }
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, w = 19 - i * 0.6;
    ctx.fillStyle = i === 5 || i === 7 ? C.cream : C.red;
    ctx.beginPath();
    ctx.moveTo(ax + nx * w, ay + ny * w);
    ctx.lineTo(bx + nx * w, by + ny * w);
    ctx.lineTo(bx - nx * w, by - ny * w);
    ctx.lineTo(ax - nx * w, ay - ny * w);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#C8002A';
  ctx.beginPath();
  ctx.ellipse(78, -110, 26, 22, 0.3, 0, TAU);
  ctx.fill();

  // face
  ctx.fillStyle = 'rgba(255,122,150,0.5)';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(side * 92, -164, 22, 13, 0, 0, TAU);
    ctx.fill();
  }
  const eyes = o.eyes || 'open';
  ctx.strokeStyle = C.navy;
  ctx.fillStyle = C.navy;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    const ex = side * 50 + look[0] * 10, ey = -208 + look[1] * 10;
    if (eyes === 'happy') {
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.arc(ex, ey + 14, 22, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
      continue;
    }
    const big = eyes === 'wide' ? 1.15 : 1;
    ctx.fillStyle = C.navy;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 21 * big, 28 * big, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(ex - 7, ey - 10, 8, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + 7, ey + 9, 4, 0, TAU);
    ctx.fill();
    if (eyes === 'sparkle') sparkle(ex - 6, ey - 9, 13 + 4 * Math.sin(t * 14), '#FFFFFF', t * 2);
  }
  ctx.lineWidth = 8;
  const brow = eyes === 'wide' ? 10 : 0;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 50 - 18, -256 - brow + side * 2);
    ctx.quadraticCurveTo(side * 50, -264 - brow, side * 50 + 18, -256 - brow - side * 2);
    ctx.stroke();
  }
  const mouth = o.mouth || 'smile';
  if (mouth === 'smile') {
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, -172, 24, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  } else if (mouth === 'o') {
    ctx.fillStyle = '#7A1030';
    ctx.beginPath();
    ctx.ellipse(0, -156, 13, 16, 0, 0, TAU);
    ctx.fill();
  } else {
    const wide = mouth === 'grin' ? 40 : 28;
    const m = new Path2D();
    m.moveTo(-wide, -174);
    m.quadraticCurveTo(0, -112, wide, -174);
    m.closePath();
    ctx.fillStyle = '#7A1030';
    ctx.fill(m);
    ctx.save();
    ctx.clip(m);
    ctx.fillStyle = '#FF6F91';
    ctx.beginPath();
    ctx.ellipse(0, -136, 16, 11, 0, 0, TAU);
    ctx.fill();
    if (mouth === 'grin') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-wide, -180, wide * 2, 14);
    }
    ctx.restore();
  }

  // antenna
  const wob = (o.wobble || 0) * Math.sin(t * 16);
  const bx = 96 + wob * 26, by = -366 + Math.abs(wob) * 6;
  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(62, -304);
  ctx.quadraticCurveTo(72 + wob * 10, -342, bx, by);
  ctx.stroke();
  glow(bx, by, 70, C.yellow, 0.35);
  ctx.fillStyle = C.yellow;
  ctx.beginPath();
  ctx.arc(bx, by, 21, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(bx - 7, by - 7, 6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- scenes
// Each takes (lt, d, t): local time, shot duration, global time.

function sceneHello(lt) {
  const g = ctx.createRadialGradient(540, 1300, 40, 540, 1250, 1300);
  g.addColorStop(0, '#3446A8');
  g.addColorStop(0.45, C.navy);
  g.addColorStop(1, C.night0);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(540, 1300);
  ctx.rotate(lt * 0.5);
  ctx.fillStyle = rgba(C.yellow, 0.06);
  for (let k = 0; k < 14; k++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 1800, k * TAU / 14, k * TAU / 14 + TAU / 28);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  stars(11, 110, H, lt, 0.9);
  glow(540, 1350, 600, C.yellow, 0.3 * easeOut(lt / 0.2));
  const p = lt / 0.2;
  const y = lerp(2120, 1640, easeBack(p, 1.3));
  const sq = p < 1 ? 1.12 : 1 - settle(lt - 0.2, 0.16, 45, 0.06);
  burst(540, 1300, lt - 0.16, 7, 26, 560);
  mascot(540, y, 1.4, {
    t: lt, sq, eyes: 'happy', mouth: 'open', armR: 2.55 + 0.35 * Math.sin(lt * 24), armL: 0.6, wobble: 1, shadow: false,
  });
}

function sceneEscalator(lt) {
  const vx = 540, vy = 1180;
  const g = ctx.createRadialGradient(vx, vy, 0, vx, vy, 1500);
  g.addColorStop(0, '#FFF3CF');
  g.addColorStop(0.06, '#FFC86B');
  g.addColorStop(0.16, '#2F7384');
  g.addColorStop(0.45, '#123A58');
  g.addColorStop(1, '#061230');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const N = 12, speed = 9, zs = [];
  for (let k = 0; k < N; k++) zs.push((((k - lt * speed) % N) + N) % N + 0.4);
  zs.sort((a, b) => b - a);
  for (const z of zs) {
    const R = 820 / z, a = clamp(1.25 - z / N);
    ctx.strokeStyle = rgba('#A8E0E8', 0.55 * a);
    ctx.lineWidth = 60 / z;
    ctx.beginPath();
    ctx.arc(vx, vy, R, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba('#06142B', 0.5 * a);
    ctx.lineWidth = 18 / z;
    ctx.beginPath();
    ctx.arc(vx, vy, R + 40 / z, 0, TAU);
    ctx.stroke();
    for (const ang of [-2.25, -0.89]) glow(vx + Math.cos(ang) * R * 0.92, vy + Math.sin(ang) * R * 0.92, 140 / z, '#FFD27A', 0.9 * a);
  }
  const esc = new Path2D();
  esc.moveTo(vx - 26, vy + 30);
  esc.lineTo(vx + 26, vy + 30);
  esc.lineTo(vx + 470, H);
  esc.lineTo(vx - 470, H);
  esc.closePath();
  ctx.fillStyle = linear(0, vy, 0, H, [[0, '#6E8297'], [1, '#2C3B52']]);
  ctx.fill(esc);
  ctx.save();
  ctx.clip(esc);
  ctx.strokeStyle = 'rgba(10,20,40,0.55)';
  for (let j = 0; j < 30; j++) {
    const z = ((((j - lt * speed * 3) % 30) + 30) % 30) * 0.4 + 0.25, y = vy + 30 + 260 / z;
    if (y > H + 20) continue;
    ctx.lineWidth = 3 + 10 / z;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.strokeStyle = '#0B1020';
    ctx.lineWidth = 28;
    ctx.beginPath();
    ctx.moveTo(vx + s * 30, vy + 26);
    ctx.lineTo(vx + s * 520, H + 40);
    ctx.stroke();
    ctx.strokeStyle = rgba('#FFE9B8', 0.9);
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(vx + s * 44, vy + 24);
    ctx.lineTo(vx + s * 700, H + 40);
    ctx.stroke();
  }
  ctx.restore();
  const r = rng(77);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    const a = r() * TAU, k = (r() + lt * 2.4) % 1, r0 = 120 + k * k * 1300, len = 80 + k * 380;
    ctx.globalAlpha = 0.35 * k;
    ctx.lineWidth = 2 + 5 * k;
    ctx.beginPath();
    ctx.moveTo(vx + Math.cos(a) * r0, vy + Math.sin(a) * r0);
    ctx.lineTo(vx + Math.cos(a) * (r0 + len), vy + Math.sin(a) * (r0 + len));
    ctx.stroke();
  }
  ctx.restore();
}

function sceneTrain(lt) {
  fillSky([[0, '#0A1438'], [0.55, '#17266A'], [1, '#0E1840']]);
  ctx.fillStyle = '#1E2F70';
  ctx.beginPath();
  ctx.ellipse(540, 1420, 980, 900, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = '#16245C';
  ctx.beginPath();
  ctx.ellipse(540, 1420, 900, 830, 0, Math.PI, TAU);
  ctx.fill();
  for (const x of [150, 410, 670, 930]) {
    ctx.fillStyle = '#FFF1CC';
    ctx.beginPath();
    ctx.roundRect(x - 70, 420, 140, 14, 7);
    ctx.fill();
    glow(x, 430, 240, '#FFE2A0', 0.35);
  }
  const p = clamp(lt / 0.3), front = lerp(1250, 60, easeOut(p)), vel = Math.pow(1 - p, 2);
  tubeTrain(front, 960, 1, { squash: settle(lt - 0.3, 1, 50, 0.06) });
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.6 * vel;
  ctx.lineWidth = 6;
  for (let i = 0; i < 10; i++) {
    const yy = 990 + i * 42, x = front + 260 + ((i * 197) % 600);
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + 420 * vel + 40, yy);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = linear(0, 1400, 0, H, [[0, '#3B4A8E'], [1, '#18214F']]);
  ctx.fillRect(0, 1400, W, H - 1400);
  ctx.fillStyle = '#EAE3D2';
  ctx.fillRect(0, 1400, W, 20);
  ctx.fillStyle = C.yellow;
  ctx.fillRect(0, 1448, W, 16);
  pool(front + 600, 1520, 700, '#FFE2A0', 0.18);
  const arrived = p >= 1;
  mascot(800, 1770, 0.95, {
    t: lt, eyes: arrived ? 'happy' : 'wide', mouth: arrived ? 'open' : 'o', look: [-1, 0],
    wind: arrived ? -0.25 : -0.9, armL: arrived ? 2.3 : 0.9, armR: 0.5, rot: arrived ? 0 : -0.07, wobble: 1,
  });
}

function sceneBigBen(lt, d) {
  fillSky([[0, '#23225E'], [0.3, '#4B3A86'], [0.55, '#A0578E'], [0.72, '#F07C6E'], [0.82, '#FFB27E']], 0, 1460);
  ctx.save();
  cam(1 + 0.03 * lt / d, 540, 1300);
  stars(21, 60, 700, lt, 0.6);
  glow(250, 1150, 620, '#FFB27E', 0.55);
  ctx.fillStyle = linear(0, 1020, 0, 1280, [[0, '#FFF3CF'], [1, '#FFC48A']]);
  ctx.beginPath();
  ctx.arc(250, 1150, 130, 0, TAU);
  ctx.fill();
  cloud(200 + lt * 25, 520, 340, '#F4A3B4', 0.5);
  cloud(860 + lt * 18, 400, 280, '#E089A8', 0.45);
  cloud(760 + lt * 30, 1000, 420, '#FFB59C', 0.4);
  for (let i = 0; i < 6; i++) {
    bird(120 + i * 48 + lt * 90 + (i % 2) * 22, 600 - i * 14 + (i % 2) * 24 - lt * 30, 15, Math.sin(lt * 14 + i));
  }
  ctx.restore();
  ctx.save();
  cam(1 + 0.08 * lt / d, 640, 915);
  skyline(31, 1452, 60, 190, '#7A4C8E', { windows: 0.25, win: { color: '#FFD9A0' } });
  parliament(-40, 600, 1452, 210, { color: '#2E2558', seed: 4, lit: 0.55, towers: [[0.08, 1.6, 70], [0.55, 1.35, 40]] });
  const cy = bigBen(640, 1452, 820, { time: 7.1 });
  archBridge(690, 1140, 1440, 70, '#2B2254', 5, { lamps: true });
  bus(760 + lt * 140, 1430, 0.16, lt, { spin: lt * 20 });
  river(1460, H + 200, [[0, '#F6A07E'], [0.25, '#A5578A'], [1, '#2A2560']], lt, 41, 0.3);
  reflection(640, 1470, 1900, 60, C.warm, lt, 0.55, 3);
  reflection(250, 1470, 1800, 150, '#FFE3A8', lt, 0.4, 5);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const s0 of [0, 0.22, 0.44]) {
    const a = lt - s0;
    if (a < 0 || a > 1) continue;
    ctx.strokeStyle = rgba('#FFD27A', 0.55 * (1 - a));
    ctx.lineWidth = 10 * (1 - a) + 2;
    ctx.beginPath();
    ctx.arc(640, cy, 70 + a * 900, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

function sceneEmbankment(lt, d) {
  fillSky([[0, '#151B55'], [0.45, '#38378A'], [0.68, '#8E5A9E'], [0.8, '#E98581']], 0, 1270);
  stars(51, 90, 900, lt, 0.8);
  moon(860, 330, 46);
  ctx.save();
  cam(1 + 0.03 * lt / d, 700, 1000);
  skyline(61, 1262, 50, 150, '#5A3F86', { windows: 0.3, win: { color: '#FFD9A0' } });
  parliament(260, 770, 1262, 120, { color: '#2A2356', seed: 8, lit: 0.6, towers: [[0.1, 1.5, 40]] });
  bigBen(800, 1262, 680, { time: 7.2, glowA: 0.6 });
  archBridge(850, 1140, 1250, 40, '#241F4E', 3);
  river(1262, 1490, [[0, '#B4648F'], [1, '#2A2760']], lt, 61, 0.28);
  reflection(800, 1270, 1480, 30, C.warm, lt, 0.5, 7);
  ctx.restore();
  ctx.fillStyle = '#2C2F66';
  ctx.fillRect(0, 1480, W, 90);
  ctx.fillStyle = '#41468F';
  ctx.fillRect(0, 1480, W, 16);
  ctx.fillStyle = linear(0, 1570, 0, H, [[0, '#23285C'], [1, '#12163A']]);
  ctx.fillRect(0, 1570, W, H - 1570);
  lamp(150, 1600, 1.25, lt);
  pool(170, 1650, 420, '#FFC861', 0.3);
  const walking = lt < 0.78, ph = ((lt - 0.02) / 0.25) * Math.PI;
  const x = lerp(-160, 470, clamp(lt / 0.78));
  mascot(x, 1770, 1.15, {
    t: lt,
    step: walking ? ph : undefined,
    lift: walking ? Math.abs(Math.sin(ph)) * 16 : 0,
    eyes: walking ? 'open' : 'sparkle',
    look: walking ? [1, 0] : [0.8, -0.9],
    mouth: walking ? 'smile' : 'o',
    armL: walking ? 0.35 + 0.3 * Math.sin(ph) : 0.5,
    armR: walking ? 0.35 - 0.3 * Math.sin(ph) : 0.5,
    wobble: walking ? 0.6 : 0.3,
    wind: 0.15,
  });
  if (!walking) burst(650, 1290, lt - 0.8, 33, 9, 150, [C.yellow, '#FFFFFF']);
}

function scenePlatform(lt) {
  fillSky([[0, '#08113A'], [0.55, '#1A2A70'], [1, '#34418F']], 0, 1300);
  stars(71, 70, 900, lt + 4, 0.7);
  ctx.save();
  cam(1.06 - 0.06 * easeOut(lt / 0.3), 540, 900);
  skyline(73, 1272, 140, 460, '#15205A', { windows: 0.3, minW: 70 });
  shard(560, 1272, 1020, 380, lt + 4);
  tubeTrain(600, 1000, 0.98);
  ctx.restore();
  ctx.fillStyle = '#0D1333';
  ctx.fillRect(0, 0, W, 140);
  for (let x = 60; x < W; x += 160) {
    ctx.fillStyle = '#FFF0C8';
    ctx.fillRect(x, 128, 70, 8);
    glow(x + 35, 140, 110, '#FFE6A8', 0.35);
  }
  ctx.fillStyle = '#0D1333';
  for (const x of [70, 1010]) ctx.fillRect(x - 24, 140, 48, 1300);
  ctx.fillStyle = linear(0, 1430, 0, H, [[0, '#3A4686'], [1, '#161D49']]);
  ctx.fillRect(0, 1430, W, H - 1430);
  ctx.fillStyle = '#EAE3D2';
  ctx.fillRect(0, 1430, W, 20);
  ctx.fillStyle = C.yellow;
  ctx.fillRect(0, 1488, W, 18);
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = '900 84px Nunito';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '8px';
  ctx.fillText('MIND THE GAP', 540, 1640);
  ctx.restore();
  pool(540, 1560, 500, '#FFE6A8', 0.15);
}

function sceneGap(lt) {
  fillSky([[0, '#16225A'], [1, '#0B1236']]);
  ctx.fillStyle = '#1D2B6A';
  for (let y = 300, row = 0; y < 1040; y += 60, row++) {
    for (let x = -40 + (row % 2) * 45; x < 520; x += 90) {
      ctx.beginPath();
      ctx.roundRect(x, y, 84, 54, 8);
      ctx.fill();
    }
  }
  const tx = 540;
  ctx.fillStyle = linear(0, 220, 0, 1120, [[0, '#F7F9FC'], [1, '#C5CFE2']]);
  ctx.beginPath();
  ctx.roundRect(tx, 220, 700, 900, [40, 0, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#1B3FA0';
  ctx.fillRect(tx, 1060, 700, 34);
  ctx.fillStyle = linear(0, 330, 0, 1040, [[0, '#FFE9B0'], [1, '#F0A040']]);
  ctx.beginPath();
  ctx.roundRect(tx + 120, 330, 380, 712, [20, 20, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#1B3FA0';
  ctx.beginPath();
  ctx.roundRect(tx + 360, 760, 140, 150, 16);
  ctx.fill();
  ctx.fillStyle = C.red;
  ctx.fillRect(tx + 372, 776, 116, 10);
  ctx.fillStyle = C.gold;
  ctx.fillRect(tx + 300, 330, 14, 712);
  ctx.fillStyle = C.red;
  ctx.beginPath();
  ctx.roundRect(tx + 40, 320, 80, 730, 10);
  ctx.roundRect(tx + 500, 320, 80, 730, 10);
  ctx.fill();
  ctx.fillStyle = '#8E9AB8';
  ctx.fillRect(tx + 120, 1030, 380, 14);
  glow(tx + 310, 700, 420, '#FFE2A0', 0.35);
  ctx.fillStyle = linear(0, 1094, 0, H, [[0, '#04060F'], [1, '#141A3A']]);
  ctx.fillRect(0, 1094, W, H);
  ctx.fillStyle = '#20263F';
  for (let x = 480; x < W; x += 90) ctx.fillRect(x, 1640, 54, 120);
  ctx.fillStyle = '#9AA6C8';
  ctx.fillRect(470, 1650, W, 14);
  ctx.fillRect(470, 1740, W, 14);
  ctx.fillStyle = '#2C3878';
  ctx.fillRect(0, 1040, 470, H - 1040);
  ctx.fillStyle = '#34428A';
  for (let y = 1110, row = 0; y < H; y += 70, row++) {
    for (let x = -50 + (row % 2) * 55; x < 440; x += 110) {
      ctx.beginPath();
      ctx.roundRect(x, y, 100, 60, 8);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#EAE3D2';
  ctx.fillRect(0, 1040, 470, 18);
  ctx.fillStyle = C.yellow;
  ctx.fillRect(300, 1032, 150, 12);
  const u = clamp((lt - 0.07) / 0.28);
  const path = (k) => [lerp(250, 830, easeInOut(k)), lerp(1040, 1030, k) - Math.sin(Math.PI * k) * 300];
  ctx.save();
  ctx.setLineDash([18, 16]);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let k = 0; k <= 30; k++) {
    const [px, py] = path(k / 30);
    if (k) ctx.lineTo(px, py - 150); else ctx.moveTo(px, py - 150);
  }
  ctx.stroke();
  ctx.restore();
  let sq = 1;
  if (lt < 0.07) sq = 1 - 0.2 * (lt / 0.07);
  else if (u < 1) sq = lerp(1.15, 0.95, u);
  else sq = 1 - settle(lt - 0.35, 0.18, 40, 0.06);
  const [x] = path(u), air = u > 0 && u < 1;
  mascot(x, lerp(1040, 1030, u), 0.85, {
    t: lt, sq, lift: Math.sin(Math.PI * u) * 300, eyes: air ? 'wide' : (u >= 1 ? 'happy' : 'open'),
    mouth: u >= 1 ? 'open' : 'o', armL: air ? 2.4 : 0.4, armR: air ? 2.4 : 0.4, wobble: 1,
    shadowK: 1 - 0.6 * Math.sin(Math.PI * u),
  });
}

function sceneTowerAerial(lt, d) {
  fillSky([[0, '#0A1240'], [1, '#2A3A8C']], 0, 440);
  stars(91, 50, 400, lt + 5, 0.7);
  ctx.save();
  cam(1.05 - 0.05 * lt / d, 540, 900, 0, -24 * lt);
  skyline(93, 442, 30, 120, '#1E2A68', { windows: 0.4, minW: 30, varW: 50 });
  ctx.fillStyle = '#101A44';
  ctx.fillRect(-200, 440, W + 400, H);
  const rr = rng(95);
  for (let y = 452; y < H + 100;) {
    const k = (y - 440) / 1480, rowH = 18 + k * 120;
    let x = -60 + rr() * 40;
    while (x < W + 60) {
      const bw = (40 + rr() * 90) * (0.4 + k), seed = Math.floor(rr() * 1e6);
      ctx.fillStyle = '#1B2858';
      ctx.beginPath();
      ctx.roundRect(x, y, bw, rowH * 0.78, 4 + 6 * k);
      ctx.fill();
      windows(x + 4, y + 4, bw - 8, rowH * 0.78 - 8, seed, 0.35, { cw: 3 + 6 * k, ch: 3 + 6 * k, gx: 4 + 8 * k, gy: 4 + 8 * k });
      x += bw + 8 + 20 * k;
    }
    y += rowH;
  }
  const edge = (y, a, b) => lerp(a, b, Math.pow((y - 440) / 1480, 1.2)) + Math.sin((y - 440) / 260) * 25;
  const rp = new Path2D();
  rp.moveTo(edge(440, 430, -60), 440);
  for (let y = 440; y <= H + 80; y += 20) rp.lineTo(edge(y, 430, -60), y);
  for (let y = H + 80; y >= 440; y -= 20) rp.lineTo(edge(y, 650, 1140), y);
  rp.closePath();
  ctx.fillStyle = linear(0, 440, 0, H, [[0, '#2B4C8E'], [1, '#0E2650']]);
  ctx.fill(rp);
  ctx.save();
  ctx.clip(rp);
  river(440, H + 80, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0)']], lt, 97, 0.2);
  reflection(420, 860, 1700, 60, '#FFD9A0', lt, 0.4, 98);
  reflection(660, 860, 1700, 60, '#FFD9A0', lt, 0.4, 99);
  ctx.restore();
  for (let y = 460; y < H + 60; y += 26 + (y - 440) * 0.05) {
    for (const [a, b] of [[430, -60], [650, 1140]]) {
      const x = edge(y, a, b), s = 2 + (y - 440) / 400;
      ctx.fillStyle = '#FFE2A0';
      ctx.beginPath();
      ctx.arc(x, y, s, 0, TAU);
      ctx.fill();
    }
  }
  const by = 1720 - lt * 220;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(585, by, 34, 92, 14);
  ctx.fill();
  ctx.fillStyle = C.window;
  ctx.fillRect(593, by + 20, 18, 50);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(588, by + 90); ctx.lineTo(540, by + 260);
  ctx.moveTo(616, by + 90); ctx.lineTo(664, by + 260);
  ctx.stroke();
  towerBridge(540, 840, 0.55, lt);
  for (let k = 0; k < 6; k++) {
    const x = 200 + ((k * 130 + lt * 260) % 700);
    ctx.fillStyle = k % 2 ? '#FF5A5A' : '#FFF4C8';
    ctx.beginPath();
    ctx.arc(x, 832, 4, 0, TAU);
    ctx.fill();
  }
  towerOfLondon(200, 1560, 0.85);
  ctx.restore();
}

function sceneWestminster(lt, d) {
  fillSky([[0, '#070D33'], [0.6, '#16236A'], [1, '#2C3A8E']], 0, 1010);
  stars(101, 90, 800, lt, 0.85);
  ctx.save();
  cam(1 + 0.04 * lt / d, 540, 800, -30 * lt, 0);
  skyline(103, 1002, 60, 220, '#18225E', { windows: 0.45 });
  londonEye(880, 740, 230, lt * 0.1, { rim: C.pink, leg: '#2A2050' });
  parliament(-40, 345, 1002, 150, { color: '#C98C45', seed: 12, lit: 0.8, winColor: '#7A4A20', towers: [[0.15, 1.7, 60]] });
  bigBen(390, 1002, 660, { ...LIT, time: 9.9, glowA: 0.9 });
  glow(200, 920, 500, C.amber, 0.25);
  archBridge(440, 1140, 988, 40, '#14193F', 5, { lamps: true, lampHex: '#D8FFB0' });
  river(1010, H + 200, [[0, '#1E2A6E'], [1, '#070D2E']], lt, 105, 0.2);
  reflection(200, 1015, 1700, 260, C.amber, lt, 0.5, 11);
  reflection(390, 1015, 1600, 40, '#FFE3A6', lt, 0.5, 12);
  reflection(880, 1015, 1500, 200, C.pink, lt, 0.45, 13);
  ctx.restore();
}

function sceneEye(lt) {
  fillSky([[0, '#040824'], [0.5, '#101D5E'], [1, '#2A3C98']], 0, 1300);
  stars(111, 140, 1200, lt, 1);
  moon(190, 330, 44);
  ctx.save();
  cam(1.04 - 0.04 * easeOut(lt / 0.4), 540, 760);
  skyline(113, 1282, 40, 160, '#131C52', { windows: 0.4 });
  ctx.fillStyle = '#C79A5A';
  ctx.fillRect(-20, 1120, 330, 162);
  windows(-10, 1135, 310, 130, 117, 0.75, { color: '#FFF0C8' });
  londonEye(560, 720, 430, 0.3 + lt * 0.12);
  river(1285, H + 200, [[0, '#1A2A78'], [1, '#050A2A']], lt, 115, 0.25);
  reflection(560, 1290, 1900, 520, C.neon, lt, 0.3, 21);
  reflection(150, 1290, 1600, 260, C.amber, lt, 0.35, 22);
  ctx.restore();
}

function sceneTowerBridge(lt, d) {
  fillSky([[0, '#060B30'], [0.6, '#16236C'], [1, '#2C3B92']], 0, 1050);
  stars(121, 90, 900, lt, 0.8);
  ctx.save();
  cam(1.06 - 0.06 * easeOut(lt / 0.3), 540, 700);
  skyline(123, 1032, 50, 200, '#141D55', { windows: 0.45 });
  shard(985, 1032, 700, 240, lt, { windows: 140 });
  towerBridge(540, 1000, 1, lt);
  bus(lerp(-150, 520, lt / d), 968, 0.3, lt, { spin: lt * 20 });
  river(1050, H + 200, [[0, '#1C2A72'], [1, '#060B2C']], lt, 125, 0.22);
  for (const x of [300, 780]) reflection(x, 1060, 1800, 130, '#FFD9A0', lt, 0.45, x);
  reflection(540, 1060, 1500, 420, C.neon, lt, 0.25, 7);
  ctx.restore();
}

function sceneBus(lt, d) {
  fillSky([[0, '#070D33'], [0.7, '#1B2A70'], [1, '#33408F']], 0, 770);
  stars(131, 60, 600, lt, 0.7);
  skyline(133, 772, 40, 170, '#1A2460', { windows: 0.45 });
  stPauls(380, 772, 0.38);
  river(770, 880, [[0, '#2A3A86'], [1, '#141E52']], lt, 135, 0.3);
  ctx.fillStyle = '#10153A';
  ctx.fillRect(0, 870, W, 16);
  for (let x = 10; x < W; x += 28) ctx.fillRect(x, 870, 6, 70);
  ctx.fillRect(0, 930, W, 10);
  ctx.fillStyle = '#20275C';
  ctx.fillRect(0, 940, W, 150);
  ctx.fillStyle = '#161C46';
  ctx.fillRect(0, 1085, W, H - 1085);
  tree(110, 1010, 1, lt);
  lamp(330, 1010, 0.95, lt);
  lamp(900, 1010, 0.95, lt);
  ctx.fillStyle = '#F2E9D8';
  for (let x = -((lt * 900) % 200); x < W; x += 200) ctx.fillRect(x, 1500, 110, 12);
  const x = lerp(-380, 140, lt / d);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineCap = 'round';
  ctx.lineWidth = 6;
  for (let i = 0; i < 5; i++) {
    const yy = 760 + i * 60;
    ctx.beginPath();
    ctx.moveTo(x - 40 - (i % 2) * 60, yy);
    ctx.lineTo(x - 220 - (i % 2) * 60, yy);
    ctx.stroke();
  }
  ctx.restore();
  bus(x, 1085, 0.95, lt, { bob: Math.sin(lt * 30) * 4, spin: lt * 14 });
  pool(x + 800, 1100, 380, '#FFF0B0', 0.25);
}

function horse(x, y, s, dir, body = C.cream, mane = C.red) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  ctx.fillStyle = body;
  ctx.strokeStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 62, 30, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(38, -10); ctx.lineTo(70, -70); ctx.lineTo(92, -60); ctx.lineTo(62, 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(92, -66, 30, 16, 0.5, 0, TAU);
  ctx.fill();
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [a, b, c, e] of [[-40, 20, -72, 50], [-25, 22, -20, 62], [35, 20, 62, 44], [45, 18, 30, 62]]) {
    ctx.moveTo(a, b);
    ctx.lineTo(c, e);
  }
  ctx.stroke();
  ctx.strokeStyle = mane;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(-58, -8);
  ctx.quadraticCurveTo(-92, 0, -96, 34);
  ctx.stroke();
  ctx.fillStyle = mane;
  ctx.beginPath();
  ctx.moveTo(44, -16); ctx.lineTo(70, -78); ctx.lineTo(82, -72); ctx.lineTo(56, -8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = C.yellow;
  ctx.beginPath();
  ctx.ellipse(-4, -24, 26, 12, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = C.navy;
  ctx.beginPath();
  ctx.arc(100, -70, 4, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function carousel(cx, topY, baseY, t) {
  const R = 330, rimY = topY + 170, drumTop = rimY + 46, platY = baseY - 70, rot = t * 1.4;
  const horses = [];
  for (let i = 0; i < 6; i++) {
    const a = rot + i * TAU / 6;
    horses.push({ x: cx + Math.sin(a) * R * 0.8, z: Math.cos(a), bob: Math.sin(t * 7 + i * 1.3) * 26 });
  }
  horses.sort((p, q) => p.z - q.z);
  ctx.fillStyle = '#7A1530';
  ctx.beginPath();
  ctx.ellipse(cx, platY + 26, R + 40, 58, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#B0243F';
  ctx.beginPath();
  ctx.ellipse(cx, platY, R + 40, 58, 0, 0, TAU);
  ctx.fill();
  const drawHorse = (h, back) => {
    ctx.save();
    if (back) ctx.globalAlpha = 0.7;
    ctx.fillStyle = C.gold;
    ctx.fillRect(h.x - 5, drumTop, 10, platY - drumTop);
    horse(h.x, platY - 190 + h.bob, 0.85 + 0.15 * h.z, h.z > 0 ? 1 : -1, back ? '#CFC3B0' : C.cream);
    ctx.restore();
  };
  for (const h of horses) if (h.z < 0) drawHorse(h, true);
  ctx.fillStyle = linear(cx - 150, 0, cx + 150, 0, [[0, '#5A0F25'], [0.5, '#8A1C38'], [1, '#5A0F25']]);
  ctx.fillRect(cx - 150, drumTop, 300, platY - drumTop);
  for (let k = -2; k <= 2; k++) {
    ctx.fillStyle = C.gold;
    ctx.beginPath();
    ctx.roundRect(cx + k * 58 - 24, drumTop + 40, 48, 150, 24);
    ctx.fill();
    ctx.fillStyle = rgba('#FFE7A8', 0.75);
    ctx.beginPath();
    ctx.roundRect(cx + k * 58 - 18, drumTop + 46, 36, 138, 18);
    ctx.fill();
  }
  for (const h of horses) if (h.z >= 0) drawHorse(h, false);
  const span = 2 * R + 100;
  for (let i = 0; i < 12; i++) {
    const x0 = cx - R - 50 + i * span / 12;
    ctx.fillStyle = i % 2 ? C.cream : C.red;
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(x0, rimY);
    ctx.lineTo(x0 + span / 12, rimY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = C.gold;
  ctx.fillRect(cx - R - 50, rimY, span, 30);
  ctx.beginPath();
  for (let x = cx - R - 50; x < cx + R + 50; x += 40) {
    ctx.moveTo(x + 40, rimY + 30);
    ctx.arc(x + 20, rimY + 30, 20, 0, Math.PI);
  }
  ctx.fill();
  for (let k = 0; k < 18; k++) {
    const x = cx - R - 40 + k * (2 * R + 80) / 17, on = (Math.floor(t * 8) + k) % 2 ? 1 : 0.5;
    ctx.fillStyle = rgba('#FFF3C4', on);
    ctx.beginPath();
    ctx.arc(x, rimY + 14, 7, 0, TAU);
    ctx.fill();
    glow(x, rimY + 14, 36, '#FFD27A', 0.5 * on);
  }
  ctx.fillStyle = C.gold;
  ctx.fillRect(cx - 3, topY - 80, 6, 70);
  ctx.beginPath();
  ctx.arc(cx, topY - 8, 16, 0, TAU);
  ctx.fill();
  ctx.fillStyle = C.red;
  ctx.beginPath();
  ctx.moveTo(cx + 3, topY - 80);
  ctx.quadraticCurveTo(cx + 30, topY - 74 + Math.sin(t * 12) * 5, cx + 56, topY - 66);
  ctx.lineTo(cx + 3, topY - 52);
  ctx.closePath();
  ctx.fill();
}

function sceneCarousel(lt) {
  const g = ctx.createRadialGradient(540, 760, 50, 540, 760, 1300);
  g.addColorStop(0, '#5A2A5E');
  g.addColorStop(0.5, '#1E1A4E');
  g.addColorStop(1, '#070A26');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const r = rng(151);
  for (let i = 0; i < 26; i++) glow(r() * W, 200 + r() * 900, 40 + r() * 70, r() < 0.5 ? '#FFB547' : '#FF7AA8', 0.25);
  ctx.fillStyle = linear(0, 1080, 0, H, [[0, '#3A2A4A'], [1, '#120E2A']]);
  ctx.fillRect(0, 1080, W, H - 1080);
  tree(40, 1090, 1.2, lt, 152);
  tree(1050, 1090, 1.1, lt + 1, 153);
  pool(540, 1100, 560, '#FFC861', 0.4);
  ctx.save();
  cam(1.06 - 0.06 * easeOut(lt / 0.3), 540, 760);
  glow(540, 760, 700, C.amber, 0.3);
  carousel(540, 380, 1080, lt);
  ctx.restore();
  person(250 + lt * 60, 1600, 1.3, '#0C0A22', lt * 12);
  person(320 + lt * 60, 1606, 1.2, '#0C0A22', lt * 12 + 1.5);
  person(830 - lt * 50, 1640, 1.25, '#0C0A22', lt * 12 + 0.7);
}

function sceneShardUp(lt, d) {
  fillSky([[0, '#0D1652'], [0.6, '#2E3F9A'], [1, '#6E6FC4']]);
  ctx.save();
  cam(1.04 - 0.04 * lt / d, 540, 1000);
  ctx.translate(540, 1000);
  ctx.rotate(-0.03 + 0.03 * lt / d);
  ctx.translate(-540, -1000);
  stars(161, 40, 700, lt, 0.6);
  shard(540, 2000, 1800, 520, lt, { windows: 420 });
  for (const side of [-1, 1]) {
    const inB = 540 + side * 300, inT = 540 + side * 150, out = 540 + side * 760;
    const p = new Path2D();
    p.moveTo(out, H + 60); p.lineTo(inB, H + 60); p.lineTo(inT, -60); p.lineTo(out, -60);
    p.closePath();
    ctx.fillStyle = side < 0 ? '#121A48' : '#0D143A';
    ctx.fill(p);
    ctx.save();
    ctx.clip(p);
    ctx.strokeStyle = 'rgba(120,150,230,0.18)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = 0; k <= 8; k++) {
      ctx.moveTo(lerp(inB, out, k / 8), H + 60);
      ctx.lineTo(lerp(inT, out, k / 8), -60);
    }
    for (let y = H; y > -60; y -= 30 + Math.max(0, y / H) * 60) {
      ctx.moveTo(inB - side * 2000, y);
      ctx.lineTo(out, y);
    }
    ctx.stroke();
    const r = rng(170 + side);
    for (let i = 0; i < 90; i++) {
      const y = r() * H, f = r(), on = r();
      if (on > 0.5) continue;
      const x = lerp(lerp(inT, inB, y / H), out, f), sz = 0.5 + y / H;
      ctx.fillStyle = rgba(C.window, 0.5 + 0.8 * on);
      ctx.fillRect(x, y, 18 * sz, 12 * sz);
    }
    ctx.restore();
  }
  ctx.restore();
}

function sceneSkyline(lt, d) {
  fillSky([[0, '#0C1450'], [0.5, '#2B3C96'], [0.8, '#6B6CC0'], [1, '#B58AC9']], 0, 1090);
  stars(181, 50, 600, lt, 0.6);
  const wave = lerp(-150, 1250, lt / d);
  const lit = (x, y, k) => (x < wave && k < 0.6 ? clamp((wave - x) / 120) : 0);
  ctx.save();
  cam(1.03 - 0.03 * lt / d, 540, 900);
  skyline(183, 1092, 120, 330, '#3A3E8C', { windows: lit, win: { cw: 8, ch: 10, gx: 8, gy: 10, color: '#FFE2A8' } });
  gherkin(300, 1092, 520, lit);
  walkieTalkie(540, 1092, 430, lit);
  cheesegrater(735, 1092, 560, lit);
  shard(930, 1092, 850, 300, lt, { windows: 200 });
  skyline(187, 1092, 60, 200, '#141B4A', { windows: lit, minW: 80 });
  glow(wave, 950, 260, '#FFE2A8', 0.25);
  ctx.restore();
  river(1090, H + 200, [[0, '#46489A'], [1, '#0A0F36']], lt, 189, 0.3);
  reflection(Math.min(wave, 1000) / 2, 1100, 1600, Math.max(0, Math.min(wave, 1080)), '#FFE2A8', lt, 0.25, 190);
}

function sceneFlashcards(lt, d) {
  fillSky([[0, '#0A1240'], [0.6, '#24307E'], [1, '#43489A']], 0, 1250);
  stars(201, 80, 900, lt, 0.8);
  ctx.save();
  cam(1 + 0.05 * lt / d, 540, 1100);
  skyline(203, 1242, 50, 150, '#1E2766', { windows: 0.4 });
  parliament(-40, 130, 1242, 130, { color: '#C98C45', winColor: '#7A4A20', lit: 0.8, seed: 21 });
  bigBen(150, 1242, 780, { ...LIT, time: 10.2 });
  glow(140, 1100, 420, C.amber, 0.25);
  ctx.restore();
  ctx.fillStyle = '#1A2050';
  ctx.fillRect(0, 1240, W, 74);
  ctx.fillStyle = '#2A3170';
  for (let x = 20; x < W; x += 60) {
    ctx.beginPath();
    ctx.roundRect(x, 1256, 30, 50, 15);
    ctx.fill();
  }
  ctx.fillStyle = linear(0, 1314, 0, H, [[0, '#262C66'], [1, '#12163A']]);
  ctx.fillRect(0, 1314, W, H - 1314);
  lamp(900, 1330, 1.15, lt, { hex: '#E8FFB0', glass: '#E8FFB0' });
  pool(900, 1380, 380, '#E8FFB0', 0.25);
  const ca = lt - 0.5;
  if (ca < 0.12) chalkboard(210, 1470, 0.9 * (ca < 0 ? 1 : 1 - easeInOut(ca / 0.12)), ca < 0 ? -0.04 : -0.04 - ca * 8);
  poof(210, 1440, ca - 0.04, 1.4);
  const tossed = lt >= 0.08;
  mascot(600, 1780, 1.2, {
    t: lt, eyes: tossed ? 'happy' : 'open', mouth: tossed ? 'grin' : 'smile', look: [0.3, 0],
    armL: tossed ? 2.5 + 0.2 * Math.sin(lt * 18) : 1.0, armR: tossed ? 2.5 + 0.2 * Math.sin(lt * 18 + 1) : 1.0, wobble: 1,
  });
  const labels = ['Aa', 'verb', 'the', '?!', 'ABC'];
  for (let i = 0; i < 5; i++) {
    const age = lt - 0.08 - i * 0.035;
    if (age < 0) {
      flashcard(600 + i * 5, 1560 - i * 7, 1, -0.08 + i * 0.03, labels[i]);
      continue;
    }
    const vx = (i - 2) * 650 + 100, vy = -2500 - i * 200;
    flashcard(600 + vx * age, 1560 + vy * age + 600 * age * age, 1 + age * 0.4, age * (6 + i), labels[i], clamp(age * 3));
  }
}

function sceneShardStation(lt) {
  fillSky([[0, '#060A2E'], [0.6, '#1A2470'], [1, '#3A3F95']]);
  stars(211, 90, 1000, lt, 0.8);
  ctx.save();
  cam(1.12 - 0.12 * easeOut(lt / 0.3), 540, 900);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(530, 175);
  for (let k = 0; k < 16; k++) {
    const a = k * TAU / 16 + lt * 0.3;
    ctx.fillStyle = 'rgba(160,200,255,0.07)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a - 0.05) * 1900, Math.sin(a - 0.05) * 1900);
    ctx.lineTo(Math.cos(a + 0.05) * 1900, Math.sin(a + 0.05) * 1900);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  skyline(213, 1700, 200, 500, '#121A50', { windows: 0.4 });
  shard(540, 2060, 1880, 980, lt, { windows: 600 });
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = '#E8EEF8';
  ctx.lineWidth = 22;
  for (let k = 0; k < 6; k++) {
    ctx.globalAlpha = 0.9 - k * 0.1;
    ctx.beginPath();
    ctx.ellipse(540, 1560 + k * 90 + 520, 900 + k * 40, 520, 0, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  }
  ctx.restore();
}

function sceneArch(lt, d) {
  ctx.save();
  cam(1 + 0.06 * lt / d, 540, 1000);
  fillSky([[0, '#0A1242'], [0.5, '#22307E'], [0.8, '#5A4A9A'], [1, '#8A5A9E']], 0, 1600);
  stars(221, 60, 900, lt, 0.8);
  skyline(223, 1602, 60, 180, '#1E2766', { windows: 0.4 });
  bigBen(560, 1602, 900, { ...LIT, time: 10.5, glowA: 0.9 });
  glow(560, 1250, 520, C.amber, 0.2);
  ctx.fillStyle = linear(0, 1600, 0, H, [[0, '#2B2F6A'], [1, '#141838']]);
  ctx.fillRect(-100, 1600, W + 200, H);
  lamp(810, 1700, 0.9, lt);
  pool(810, 1730, 340, C.warm, 0.3);
  ctx.restore();
  ctx.save();
  cam(1 + 0.1 * lt / d, 540, 1000);
  const p = new Path2D();
  p.rect(-300, -300, W + 600, H + 600);
  p.moveTo(200, 1800);
  p.lineTo(200, 640);
  p.ellipse(540, 640, 340, 380, 0, Math.PI, TAU);
  p.lineTo(880, 1800);
  p.closePath();
  ctx.fillStyle = '#0A0D26';
  ctx.fill(p, 'evenodd');
  ctx.strokeStyle = 'rgba(80,90,170,0.35)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let k = 0; k <= 12; k++) {
    const a = Math.PI + k * Math.PI / 12;
    ctx.moveTo(540 + Math.cos(a) * 340, 640 + Math.sin(a) * 380);
    ctx.lineTo(540 + Math.cos(a) * 430, 640 + Math.sin(a) * 470);
  }
  ctx.moveTo(110, 640);
  ctx.ellipse(540, 640, 430, 470, 0, Math.PI, TAU);
  ctx.stroke();
  ctx.strokeStyle = rgba(C.amber, 0.35);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(200, 1800);
  ctx.lineTo(200, 640);
  ctx.ellipse(540, 640, 340, 380, 0, Math.PI, TAU);
  ctx.lineTo(880, 1800);
  ctx.stroke();
  ctx.restore();
}

function sceneMillennium(lt, d) {
  fillSky([[0, '#070C34'], [0.6, '#1A2672'], [1, '#2E3B8E']], 0, 1270);
  stars(231, 90, 1000, lt, 0.8);
  const vx = 540, vy = 1250;
  ctx.save();
  cam(1 + 0.08 * lt / d, vx, vy);
  skyline(233, 1272, 40, 160, '#18215C', { windows: 0.45 });
  stPauls(540, 1272, 0.75, { glowA: 0.45 });
  ctx.fillStyle = linear(0, 1270, 0, H, [[0, '#24307A'], [1, '#080C30']]);
  ctx.fillRect(-100, 1270, W + 200, H);
  reflection(540, 1280, 1700, 220, '#FFE2A8', lt, 0.35, 235);
  const deck = new Path2D();
  deck.moveTo(vx - 70, vy + 20);
  deck.lineTo(vx + 70, vy + 20);
  deck.lineTo(vx + 760, H + 50);
  deck.lineTo(vx - 760, H + 50);
  deck.closePath();
  ctx.fillStyle = linear(0, vy, 0, H, [[0, '#5F6E9E'], [1, '#2A3366']]);
  ctx.fill(deck);
  ctx.save();
  ctx.clip(deck);
  ctx.strokeStyle = 'rgba(15,20,50,0.35)';
  for (let j = 0; j < 40; j++) {
    const z = ((((j - lt * 14) % 40) + 40) % 40) * 0.25 + 0.2, y = vy + 20 + 420 / z;
    if (y > H + 20) continue;
    ctx.lineWidth = 2 + 6 / z;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();
  for (const s of [-1, 1]) {
    ctx.strokeStyle = '#C9D4EA';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(vx + s * 74, vy + 6);
    ctx.lineTo(vx + s * 860, H + 60);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = C.neon;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = C.neon;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(vx + s * 70, vy + 16);
    ctx.lineTo(vx + s * 840, H + 60);
    ctx.stroke();
    ctx.restore();
  }
  person(510, 1390, 0.45, '#0C0F2E', lt * 10);
  person(562, 1398, 0.42, '#0C0F2E', lt * 10 + 1);
  ctx.restore();
}

function sceneEyeStreaks(lt, d) {
  fillSky([[0, '#040720'], [1, '#141C55']]);
  stars(241, 100, H, lt, 0.6);
  ctx.save();
  cam(1 + 0.15 * easeInOut(lt / d), 540, 900);
  for (let k = 7; k >= 0; k--) {
    ctx.save();
    ctx.globalAlpha = (1 - k / 8) * 0.7;
    londonEye(540, 900, 520, lt * 2.2 - k * 0.05, { rim: k % 2 ? C.pink : C.neon, trail: k > 0 });
    ctx.restore();
  }
  ctx.restore();
  const r = rng(243);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 0; i < 36; i++) {
    const a = r() * TAU, k = (r() + lt * 2) % 1, r0 = 200 + k * 900;
    ctx.strokeStyle = r() < 0.5 ? C.neon : C.pink;
    ctx.globalAlpha = 0.4 * k;
    ctx.lineWidth = 3 + 4 * k;
    ctx.beginPath();
    ctx.moveTo(540 + Math.cos(a) * r0, 900 + Math.sin(a) * r0);
    ctx.lineTo(540 + Math.cos(a) * (r0 + 200 * k), 900 + Math.sin(a) * (r0 + 200 * k));
    ctx.stroke();
  }
  ctx.restore();
}

function sceneEnd(lt, d) {
  fillSky([[0, '#050A2A'], [0.55, '#121E62'], [1, '#2A3A8E']], 0, 1300);
  stars(251, 160, 1250, lt, 1);
  moon(900, 250, 40);
  ctx.save();
  cam(1 + 0.05 * lt / d, 540, 1100);
  skyline(253, 1302, 60, 240, '#141C52', { windows: 0.45 });
  stPauls(250, 1302, 0.5);
  shard(790, 1302, 1060, 340, lt, { windows: 260 });
  river(1300, H + 200, [[0, '#1E2A74'], [1, '#050A26']], lt, 255, 0.22);
  reflection(790, 1310, 1900, 120, '#9DB6EA', lt, 0.25, 31);
  reflection(250, 1310, 1700, 160, '#FFE2A8', lt, 0.25, 32);
  millenniumBridge(1480, lt);
  ctx.restore();
  ctx.fillStyle = linear(0, 0, 0, H, [[0, 'rgba(5,8,30,0.5)'], [0.6, 'rgba(5,8,30,0.35)'], [1, 'rgba(5,8,30,0.55)']]);
  ctx.fillRect(0, 0, W, H);
  const a = lt - 1.6;
  if (a > 0) {
    mascot(540, lerp(2260, 1975, easeBack(a / 0.3, 1.4)), 0.8, {
      t: lt, eyes: 'happy', mouth: 'open', armR: 2.5 + 0.35 * Math.sin(lt * 14), armL: 0.5, wobble: 1, shadow: false,
      sq: 1 - settle(a - 0.3, 0.14, 40, 0.06),
    });
  }
}

// ---------------------------------------------------------------- timeline
const SCENES = [
  [0.0, sceneHello], [0.5, sceneEscalator], [1.0, sceneTrain], [1.5, sceneBigBen], [3.0, sceneEmbankment],
  [4.0, scenePlatform], [4.5, sceneGap], [5.0, sceneTowerAerial], [5.5, sceneWestminster], [6.0, sceneEye],
  [6.5, sceneTowerBridge], [7.0, sceneBus], [7.5, sceneCarousel], [8.0, sceneShardUp], [8.5, sceneSkyline],
  [9.0, sceneFlashcards], [10.0, sceneShardStation], [10.5, sceneArch], [11.0, sceneMillennium],
  [11.5, sceneEyeStreaks], [12.0, sceneEnd],
];

const grain = document.createElement('canvas');
grain.width = grain.height = 256;
{
  const g = grain.getContext('2d'), img = g.createImageData(256, 256), r = rng(99);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(r() * 255);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

// vignette + a fixed paper grain (static, so it dithers gradients without costing bitrate)
function finish() {
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  v.addColorStop(0, 'rgba(0,0,10,0)');
  v.addColorStop(1, 'rgba(0,0,10,0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = ctx.createPattern(grain, 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

window.renderFrame = (fi) => {
  const t = fi / FPS;
  let k = SCENES.length - 1;
  while (k > 0 && t < SCENES[k][0] - 1e-9) k--;
  const t0 = SCENES[k][0], t1 = k + 1 < SCENES.length ? SCENES[k + 1][0] : DUR;
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  SCENES[k][1](t - t0, t1 - t0, t);
  ctx.restore();
  finish();
  return canvas.toDataURL('image/png');
};
