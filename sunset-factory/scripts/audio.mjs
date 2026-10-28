// Procedural sound design, synced to the same story timeline the renderer uses.
// Gentle mechanical effects (bell, hinges, belt, gears, rollers, crane winch, clamps) and a magical sparkle
// when the stars spill. No narration, no music. Writes out/audio.wav (48 kHz stereo, loudness-normalised).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mulberry32, clamp, prog, lerp } from '../src/lib.js';
import { T, DURATION, STARS, camera, belt, craneMotor, roller, jar, workers } from '../src/story.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SR = 48000, N = Math.round(DURATION * SR);
const dryL = new Float32Array(N), dryR = new Float32Array(N), sendL = new Float32Array(N), sendR = new Float32Array(N);
const rnd = mulberry32(20261028);

/* ---------------------------------------------------------------- mixing */
function add(buf, t0, gain = 1, pan = 0, send = 0.12) {
  const i0 = Math.round(t0 * SR), a = ((clamp(pan, -1, 1) + 1) * Math.PI) / 4, gl = Math.cos(a) * gain, gr = Math.sin(a) * gain;
  for (let k = 0; k < buf.length; k++) {
    const i = i0 + k; if (i < 0) continue; if (i >= N) break;
    const v = buf[k];
    dryL[i] += v * gl; dryR[i] += v * gr; sendL[i] += v * gl * send; sendR[i] += v * gr * send;
  }
}
// pan from world x, relative to where the camera looks at time t
const panAt = (x, t) => { const c = camera(t); return clamp(((x - c.cx) * c.z) / 540, -1, 1) * 0.7; };

/* ---------------------------------------------------------------- synthesis primitives */
const len = (d) => Math.max(1, Math.round(d * SR));
function noise(d) { const b = new Float32Array(len(d)); for (let i = 0; i < b.length; i++) b[i] = rnd() * 2 - 1; return b; }
function brown(d) { const b = new Float32Array(len(d)); let v = 0; for (let i = 0; i < b.length; i++) { v = (v + (rnd() * 2 - 1) * 0.02) * 0.998; b[i] = v * 3; } return b; }
/** RBJ biquad, in place. f may be a number or a function of time (s). */
function biquad(b, type, f, q = 0.707) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const ff = typeof f === 'function' ? f : () => f;
  let c = null;
  for (let i = 0; i < b.length; i++) {
    if (c === null || (typeof f === 'function' && i % 32 === 0)) {
      const w = (2 * Math.PI * clamp(ff(i / SR), 10, SR * 0.45)) / SR, cw = Math.cos(w), al = Math.sin(w) / (2 * q);
      let b0, b1, b2, a0, a1, a2;
      if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; }
      else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; }
      else { b0 = al; b1 = 0; b2 = -al; }
      a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al;
      c = [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
    }
    const x = b[i], y = c[0] * x + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2;
    x2 = x1; x1 = x; y2 = y1; y1 = y; b[i] = y;
  }
  return b;
}
function env(b, fn) { for (let i = 0; i < b.length; i++) b[i] *= fn(i / SR, i / b.length); return b; }
const ad = (a, d) => (t) => (t < a ? t / a : Math.exp(-(t - a) / d));
function mixInto(dst, src, g = 1, off = 0) { const o = Math.round(off * SR); for (let i = 0; i < src.length && i + o < dst.length; i++) dst[i + o] += src[i] * g; return dst; }
function norm(b, peak = 1) { let m = 0; for (const v of b) m = Math.max(m, Math.abs(v)); if (m > 0) for (let i = 0; i < b.length; i++) b[i] *= peak / m; return b; }

/** Sum of damped partials: bells, glass, metal. */
function modal(freqs, decays, amps, d, attack = 0.001) {
  const b = new Float32Array(len(d));
  freqs.forEach((f, k) => { const ph = rnd() * 6.28; for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] += amps[k] * Math.sin(2 * Math.PI * f * t + ph) * Math.exp(-t / decays[k]) * Math.min(1, t / attack); } });
  return b;
}
function thud(f0, f1, d, noiseAmt = 0.3) {
  const b = new Float32Array(len(d)); let ph = 0;
  for (let i = 0; i < b.length; i++) { const t = i / SR, f = f1 + (f0 - f1) * Math.exp(-t * 30); ph += (2 * Math.PI * f) / SR; b[i] = Math.sin(ph) * Math.exp(-t / (d * 0.3)); }
  const n = biquad(noise(d), 'lp', 600); env(n, ad(0.001, 0.02));
  return mixInto(b, n, noiseAmt);
}
function click(d, f, q = 1.5) { return env(biquad(noise(d), 'bp', f, q), ad(0.0005, d * 0.25)); }
/** FM bell for magical chimes. */
function bell(f, d, idx = 2.2, ratio = 3.5) {
  const b = new Float32Array(len(d));
  for (let i = 0; i < b.length; i++) { const t = i / SR, I = idx * Math.exp(-t * 6); b[i] = Math.sin(2 * Math.PI * f * t + I * Math.sin(2 * Math.PI * f * ratio * t)) * Math.exp(-t / (d * 0.35)) * Math.min(1, t / 0.002); }
  return b;
}
function sweepNoise(d, f0, f1, q, shape = ad(0.1, 0.2)) { return env(biquad(noise(d), 'bp', (t) => f0 * Math.pow(f1 / f0, t / d), q), shape); }
/** Hinge creak: irregular stick-slip impulses through resonances. */
function creak(d, r0, r1) {
  const b = new Float32Array(len(d)); let next = 0;
  for (let i = 0; i < b.length; i++) { const t = i / SR; if (i >= next) { b[i] = 1; next = i + Math.round(SR / lerp(r0, r1, t / d) * (0.8 + rnd() * 0.4)); } }
  const a = biquad(Float32Array.from(b), 'bp', 820, 7), c = biquad(Float32Array.from(b), 'bp', 1650, 9);
  const out = new Float32Array(b.length); for (let i = 0; i < b.length; i++) out[i] = a[i] + c[i] * 0.6;
  return env(out, (t, u) => Math.sin(Math.PI * u) ** 0.6);
}
/** Motor whir with a pitch curve f(t) and amplitude curve a(t), absolute time t0..t1. */
function motor(t0, t1, fFn, aFn, bright = 700) {
  const d = t1 - t0, b = new Float32Array(len(d)); let ph = 0, ph2 = 0;
  for (let i = 0; i < b.length; i++) {
    const t = t0 + i / SR, f = fFn(t); ph += f / SR; ph2 += (f * 2.01) / SR;
    const saw = 2 * (ph % 1) - 1, saw2 = 2 * (ph2 % 1) - 1;
    b[i] = (saw * 0.6 + saw2 * 0.3) * aFn(t);
  }
  biquad(b, 'lp', bright, 0.9);
  const n = biquad(noise(d), 'bp', 1400, 2); for (let i = 0; i < b.length; i++) b[i] += n[i] * 0.25 * aFn(t0 + i / SR);
  return b;
}

/* ---------------------------------------------------------------- the cues */
const OVEN_X = 200;

// room tone (very low) that gives way to crickets at night
{ const b = biquad(biquad(brown(DURATION), 'lp', 260), 'hp', 45); env(b, (t) => 0.5 * (1 - 0.6 * prog(t, 16, 18))); add(b, 0, 0.014, 0, 0); }

// oven bell + door
add(modal([1760, 4830, 9400], [0.9, 0.35, 0.12], [1, 0.3, 0.1], 1.6), T.bell, 0.055, panAt(OVEN_X, T.bell), 0.25);
add(modal([1760, 4830, 9400], [0.7, 0.3, 0.1], [1, 0.3, 0.1], 1.2), T.bell + 0.17, 0.022, panAt(OVEN_X, T.bell), 0.25);
add(mixInto(click(0.03, 2600), thud(150, 90, 0.12), 0.5), T.doorOpen[0], 0.22, panAt(OVEN_X, T.doorOpen[0]));
add(creak(0.42, 50, 120), T.doorOpen[0] + 0.02, 0.07, panAt(OVEN_X - 60, 0.6), 0.2);
add(thud(95, 55, 0.25), T.doorOpen[1], 0.22, panAt(OVEN_X - 100, T.doorOpen[1]));
// the sun comes out: warm whoosh + soft glow hum
{ const w = sweepNoise(0.8, 280, 1300, 1.2, (t, u) => Math.sin(Math.PI * u) ** 1.5); add(w, T.sunOut[0] - 0.15, 0.09, panAt(OVEN_X, 0.8), 0.3); }
{ const h = new Float32Array(len(1.6)); for (const [f, a] of [[196, 1], [294, 0.6], [392, 0.35]]) for (let i = 0; i < h.length; i++) h[i] += a * Math.sin(2 * Math.PI * f * i / SR); env(h, (t, u) => Math.min(1, t / 0.25) * (1 - u) ** 2); add(h, T.sunOut[0], 0.035, panAt(OVEN_X, 0.9), 0.4); }
add(thud(80, 50, 0.3, 0.4), T.sunOut[1], 0.32, panAt(OVEN_X, T.sunOut[1]));
// door swings shut again (bounces)
add(creak(0.3, 70, 40), T.doorClose[0], 0.05, panAt(OVEN_X - 80, T.doorClose[0]), 0.2);
add(thud(100, 60, 0.22), T.doorClose[0] + 0.3, 0.2, panAt(OVEN_X, T.doorClose[0] + 0.3));
add(thud(110, 70, 0.12), T.doorClose[0] + 0.39, 0.07, panAt(OVEN_X, T.doorClose[0] + 0.39));

// belt motor, rumble and gear ticks
{
  const t0 = T.beltRun[0] - 0.1, t1 = T.beltRun[1] + 0.6;
  const a = (t) => belt(t).run;
  add(motor(t0, t1, (t) => 48 + 18 * belt(t).run, (t) => a(t)), t0, 0.1, 0, 0.1);
  const r = biquad(noise(t1 - t0), 'lp', 170); env(r, (tt) => a(t0 + tt)); add(r, t0, 0.18, 0, 0.05);
  let last = belt(t0).offset;
  for (let t = t0; t < t1; t += 1 / 400) {
    const o = belt(t).offset;
    if (Math.floor(o / 26) !== Math.floor(last / 26)) add(click(0.025, 2600 + rnd() * 800, 2), t, 0.05 * (0.6 + 0.4 * a(t)), (Math.floor(o / 26) % 2 ? -0.25 : 0.25), 0.1);
    last = o;
  }
}
// lever + stop clunk
for (let k = 0; k < 3; k++) add(click(0.02, 3200, 2.5), T.lever - 0.08 + k * 0.035, 0.09, panAt(698, T.lever));
add(mixInto(modal([320, 870, 1530], [0.22, 0.1, 0.06], [1, 0.5, 0.25], 0.5), thud(90, 60, 0.2), 0.8), T.beltStop, 0.2, panAt(560, T.beltStop));

// footsteps (from the walk cycles)
{
  const lastStep = {};
  for (let t = 0; t < DURATION; t += 1 / 240) {
    for (const w of workers(t)) {
      const k = Math.floor(w.phase / Math.PI);
      if (lastStep[w.id] !== undefined && k !== lastStep[w.id] && w.walk > 0.3 && w.air < 2) {
        const b = mixInto(env(biquad(noise(0.05), 'lp', 900), ad(0.001, 0.012)), thud(170, 110, 0.06, 0), 0.5);
        add(b, t, 0.05 + 0.03 * rnd(), panAt(w.x, t), 0.06);
      }
      lastStep[w.id] = k;
    }
  }
}

// rollers: grab, telescope, paint, retract, lean
for (const [key, off] of [['pink', 0], ['orange', 0.06]]) {
  const x0 = roller(T.grab[1], key).base[0];
  add(modal([900, 2300], [0.06, 0.03], [1, 0.4], 0.15), T.grab[1] - 0.05 + off, 0.12, panAt(x0, T.grab[1]));
  const n = 9;
  for (let k = 0; k < n; k++) { const u = k / (n - 1); add(click(0.018, 3800, 3), T.telescope[0] + off + (T.telescope[1] - T.telescope[0]) * Math.sqrt(u), 0.06, panAt(x0, T.telescope[0])); }
  add(sweepNoise(0.35, 1800, 6000, 3, (t, u) => Math.sin(Math.PI * u)), T.telescope[0] + off, 0.04, panAt(x0, T.telescope[0]));
  for (let k = 0; k < 7; k++) add(click(0.018, 3400, 3), T.retract[0] + off + k * 0.04, 0.045, panAt(1000, T.retract[0]));
  add(sweepNoise(0.3, 5000, 1600, 3, (t, u) => Math.sin(Math.PI * u)), T.retract[0] + off, 0.035, panAt(1000, T.retract[0]));
  add(modal([700, 1900], [0.07, 0.03], [1, 0.4], 0.15), T.lean[1] + off, 0.1, panAt(950, T.lean[1]));
  // wet sticky roll, amplitude-modulated by the roller's spin, panned with the head
  const p0 = T.paint[0] - 0.05, p1 = T.paint[1] + 0.1, segs = 24;
  for (let sgi = 0; sgi < segs; sgi++) {
    const a = p0 + ((p1 - p0) * sgi) / segs, d = (p1 - p0) / segs + 0.04;
    const b = biquad(noise(d), 'bp', key === 'pink' ? 1100 : 1500, 1.1);
    env(b, (tt, u) => { const t = a + tt, r = roller(t, key); return r.painting * (0.55 + 0.45 * Math.abs(Math.sin(r.spin * 1.2))) * Math.min(1, u * 8) * Math.min(1, (1 - u) * 8); });
    for (let c = 0; c < 6; c++) mixInto(b, click(0.008, 2400, 1.2), 0.25 * roller(a, key).painting, rnd() * d);
    add(b, a, 0.06, panAt(roller(a + d / 2, key).head[0], a), 0.12);
  }
}

// crane
const remoteClick = (t) => add(mixInto(click(0.012, 5200, 3), click(0.02, 1800, 2), 0.5), t, 0.07, panAt(706, t));
for (const t of [T.remote + 0.2, T.trolley[0] - 0.05, T.hookDown[0] - 0.05, T.hoist[0] - 0.05, T.lower[0] - 0.05, T.hookUp[0] - 0.05]) remoteClick(t);
{
  const t0 = T.trolley[0] - 0.1, t1 = T.hookUp[1] + 0.3;
  const pitch = (t) => (t < T.hookDown[0] ? 120 : t < T.hoist[0] ? 150 - 40 * prog(t, ...T.hookDown) : t < T.lower[0] ? 105 + 65 * prog(t, ...T.hoist) : t < T.hookUp[0] ? 135 - 15 * prog(t, ...T.lower) : 120 + 40 * prog(t, ...T.hookUp));
  add(motor(t0, t1, pitch, (t) => craneMotor(t), 900), t0, 0.075, 0, 0.12);
  // winch ratchet
  for (let t = t0; t < t1; t += 1 / 13) { const m = craneMotor(t); if (m > 0.2 && t > T.hookDown[0]) add(click(0.015, 2200 + rnd() * 400, 4), t, 0.035 * m, 0.1, 0.1); }
}
add(modal([520, 1210, 2300, 3700], [0.3, 0.18, 0.09, 0.05], [1, 0.6, 0.35, 0.2], 0.8), T.clawClose[1] - 0.02, 0.16, panAt(540, T.clawClose[1]), 0.2);
// lock into place: ka-chunk + warm glow swell
add(click(0.015, 3000, 2), T.click - 0.06, 0.14, 0, 0.2);
add(mixInto(modal([180, 410, 960], [0.3, 0.15, 0.08], [1, 0.5, 0.3], 0.7), thud(85, 50, 0.3), 0.9), T.click, 0.26, 0, 0.25);
{
  const d = 2.4, h = new Float32Array(len(d));
  for (const [f, a] of [[220, 1], [277.2, 0.7], [329.6, 0.6], [440, 0.4], [659.3, 0.15]]) for (let i = 0; i < h.length; i++) h[i] += a * Math.sin(2 * Math.PI * f * (i / SR) * (1 + 0.002 * Math.sin(i / SR * 9)));
  env(h, (t) => Math.min(1, t / 0.2) * Math.exp(-t / 0.9));
  add(h, T.click + 0.02, 0.03, 0, 0.5);
}
add(modal([800, 1900, 3100], [0.15, 0.08, 0.04], [1, 0.5, 0.2], 0.4), T.clawOpen[0], 0.09, 0, 0.2);

// evening birds while they admire
for (const [t0, pan] of [[11.55, -0.5], [12.35, 0.45], [12.6, 0.45]]) {
  const d = 0.32, b = new Float32Array(len(d));
  let ph = 0;
  for (let i = 0; i < b.length; i++) { const t = i / SR, u = t / d, f = 3200 + 1300 * Math.sin(Math.PI * u) + 400 * Math.sin(t * 90); ph += f / SR; b[i] = Math.sin(2 * Math.PI * ph) * Math.sin(Math.PI * Math.min(1, (u * 3) % 1)) * (1 - u); }
  add(b, t0, 0.025, pan, 0.5);
}

// the accident
add(mixInto(modal([170, 420, 760], [0.15, 0.08, 0.05], [1, 0.5, 0.3], 0.4), thud(120, 70, 0.15), 0.8), T.bump, 0.22, panAt(825, T.bump));
{
  // glass tinks at each rock of the wobbling jar
  let prev = jar(T.bump).rot, dPrev = 0;
  for (let t = T.bump + 0.01; t < T.relief[0]; t += 1 / 400) {
    const r = jar(t).rot, d = r - prev;
    if (dPrev * d < 0 || (prev * r < 0)) add(modal([2350, 4100, 6400], [0.22, 0.1, 0.05], [1, 0.4, 0.2], 0.5), t, 0.03 + 0.25 * Math.abs(r), panAt(825, t), 0.2);
    if (prev * r < 0) for (let k = 0; k < 3; k++) add(modal([5200 + rnd() * 2000], [0.05], [1], 0.15), t + rnd() * 0.05, 0.02, panAt(825, t), 0.3);
    dPrev = d; prev = r;
  }
}
add(modal([2350, 4100], [0.15, 0.06], [1, 0.4], 0.3), T.relief[0] + 0.02, 0.025, panAt(825, T.relief[0]), 0.2);
add(sweepNoise(0.25, 600, 1800, 1.5, (t, u) => u * u), T.tip[0] + 0.05, 0.03, panAt(800, T.tip[0]));
add(mixInto(thud(110, 65, 0.2), modal([1500, 2900, 4700], [0.3, 0.15, 0.08], [1, 0.5, 0.3], 0.6), 0.5), T.tip[1], 0.24, panAt(760, T.tip[1]), 0.2);
add(modal([1700, 3300], [0.12, 0.06], [1, 0.4], 0.3), T.tip[1] + 0.2, 0.06, panAt(760, T.tip[1]), 0.2);
{ // cork pop
  const d = 0.12, b = new Float32Array(len(d)); let ph = 0;
  for (let i = 0; i < b.length; i++) { const t = i / SR, f = 250 + 1100 * Math.exp(-t * 90); ph += f / SR; b[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t / 0.025); }
  mixInto(b, click(0.02, 2500, 0.8), 0.6);
  add(b, T.pop + 0.01, 0.34, panAt(700, T.pop), 0.25);
}

// MAGIC: sparkle wash, rising glissando, a chime per star leaving and a ting per star landing
{
  const t0 = T.pop, d = 2.9;
  for (const [buf, pan] of [[dryL, -1], [dryR, 1]]) {
    const b = new Float32Array(len(d));
    for (let g = 0; g < d * 220; g++) { const at = Math.round(rnd() * b.length), amp = rnd() ** 2; for (let k = 0; k < 600 && at + k < b.length; k++) b[at + k] += amp * (rnd() * 2 - 1) * Math.exp(-k / 90); }
    biquad(b, 'hp', 5200, 0.7);
    env(b, (t) => Math.min(1, t / 0.25) * Math.exp(-Math.max(0, t - 0.4) / 0.9));
    add(b, t0, 0.07, pan * 0.8, 0.5);
  }
  add(sweepNoise(0.9, 350, 3200, 1.4, (t, u) => Math.sin(Math.PI * u) ** 1.2), t0 - 0.02, 0.08, -0.1, 0.4);
  const penta = [0, 2, 4, 7, 9];
  const note = (n) => 1046.5 * Math.pow(2, (Math.floor(n / 5) * 12 + penta[((n % 5) + 5) % 5]) / 12);
  for (let k = 0; k < 13; k++) add(bell(note(k), 0.9), t0 + 0.03 + k * 0.038, 0.045, -0.5 + k * 0.08, 0.5);
  for (const s of STARS) {
    const n = Math.floor(rnd() * 9);
    add(bell(note(n), 1.3, 1.6), s.launch + 0.02, 0.022, panAt(s.target[0], s.launch), 0.5);
    add(bell(note(n + 5), 0.7, 1.0, 2.0), s.arrive, 0.016, panAt(s.target[0], s.arrive) * 1.2, 0.6);
  }
}
// night settles: a soft low breath
{ const d = 3.0, h = new Float32Array(len(d)); for (const [f, a] of [[98, 1], [147, 0.5]]) for (let i = 0; i < h.length; i++) h[i] += a * Math.sin(2 * Math.PI * f * i / SR); env(h, (t, u) => Math.sin(Math.PI * u) ** 2); add(h, 15.9, 0.035, 0, 0.3); }
// crickets
for (const [f, pan, per, ph] of [[4400, -0.55, 0.74, 0.1], [4950, 0.6, 0.9, 0.4]]) {
  for (let t = 16.9 + ph; t < DURATION; t += per * (0.9 + rnd() * 0.2)) {
    const d = 0.16, b = new Float32Array(len(d));
    for (let i = 0; i < b.length; i++) { const tt = i / SR, pulse = Math.floor(tt / 0.045), inP = tt - pulse * 0.045; b[i] = pulse < 3 && inP < 0.024 ? Math.sin(2 * Math.PI * f * tt) * Math.sin(Math.PI * inP / 0.024) : 0; }
    add(b, t, 0.022 * prog(t, 16.9, 17.8), pan, 0.3);
  }
}
// eye darts and the shrug
for (const t of [17.68, 17.8, 17.92, 18.1, 18.18, 18.24]) add(modal([2900], [0.02], [1], 0.06), t, 0.035, 0, 0.1);
for (const [x, off] of [[392, 0], [550, 0.03], [712, 0.06]]) {
  const b = env(biquad(noise(0.24), 'bp', 3200, 0.8), (t, u) => Math.sin(Math.PI * u) ** 0.7);
  for (let c = 0; c < 8; c++) mixInto(b, click(0.006, 4000, 1), 0.4, rnd() * 0.22);
  add(b, T.shrug[0] + off, 0.05, panAt(x, T.shrug[0]), 0.15);
}
// a last little twinkle as they smile
add(bell(2093, 1.6, 1.4), 19.45, 0.035, 0.3, 0.6);
add(bell(3136, 1.2, 1.0), 19.52, 0.02, 0.35, 0.6);

/* ---------------------------------------------------------------- reverb (Freeverb-style) */
function freeverb(inp, spread) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((n) => Math.round(((n + spread) * SR) / 44100));
  const alls = [556, 441, 341, 225].map((n) => Math.round(((n + spread) * SR) / 44100));
  const out = new Float32Array(inp.length), fb = 0.8, damp = 0.35;
  for (const L of combs) {
    const buf = new Float32Array(L); let idx = 0, store = 0;
    for (let i = 0; i < inp.length; i++) { const y = buf[idx]; store = y * (1 - damp) + store * damp; buf[idx] = inp[i] * 0.015 + store * fb; out[i] += y; idx = (idx + 1) % L; }
  }
  for (const L of alls) {
    const buf = new Float32Array(L); let idx = 0;
    for (let i = 0; i < out.length; i++) { const b = buf[idx], y = -out[i] + b; buf[idx] = out[i] + b * 0.5; out[i] = y; idx = (idx + 1) % L; }
  }
  return out;
}
const wetL = freeverb(sendL, 0), wetR = freeverb(sendR, 23);
const outL = new Float32Array(N), outR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const fadeIn = Math.min(1, i / (0.03 * SR)), fadeOut = Math.min(1, (N - i) / (0.35 * SR));
  outL[i] = (dryL[i] + wetL[i] * 1.6) * fadeIn * fadeOut;
  outR[i] = (dryR[i] + wetR[i] * 1.6) * fadeIn * fadeOut;
}

/* ---------------------------------------------------------------- write + loudness */
function writeWav(file, L, R) {
  const n = L.length, buf = Buffer.alloc(44 + n * 6);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 6, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 6, 28); buf.writeUInt16LE(6, 32); buf.writeUInt16LE(24, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 6, 40);
  let o = 44;
  for (let i = 0; i < n; i++) for (const v of [L[i], R[i]]) { const s = Math.round(clamp(v, -1, 1) * 8388607); buf.writeIntLE(s, o, 3); o += 3; }
  fs.writeFileSync(file, buf);
}
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));
const pre = 0.5 / peak;
for (let i = 0; i < N; i++) { outL[i] *= pre; outR[i] *= pre; }
fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
const raw = path.join(ROOT, 'out/audio_raw.wav'), out = path.join(ROOT, 'out/audio.wav');
writeWav(raw, outL, outR);
const target = 'I=-16:TP=-2:LRA=14';
const m = spawnSync('ffmpeg', ['-hide_banner', '-i', raw, '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
const js = JSON.parse(m.stderr.slice(m.stderr.lastIndexOf('{'), m.stderr.lastIndexOf('}') + 1));
const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-af',
  `loudnorm=${target}:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true,aresample=48000`,
  '-ar', '48000', '-c:a', 'pcm_s24le', out], { encoding: 'utf8' });
if (r.status !== 0) throw new Error(`loudnorm failed: ${r.stderr}`);
console.log(`audio -> out/audio.wav  (measured ${js.input_i} LUFS, peak ${js.input_tp} dBTP before normalisation)`);
