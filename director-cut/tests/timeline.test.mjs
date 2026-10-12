import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, readJson } from '../scripts/lib/config.mjs';
import { resolveTimeline } from '../src/animations/timeline.js';
import { cubicBezier } from '../src/animations/easing.js';
import { mulberry32, rngFor, hash2 } from '../src/animations/rng.js';

test('the shipped config validates against the schema', () => { assert.doesNotThrow(() => loadConfig()); });

test('events resolve against cue times and words', () => {
  const cfg = readJson('config/episode.json'), tl = resolveTimeline(cfg);
  const c6 = tl.cues.c6, nat = c6.start + c6.words.natural * (c6.end - c6.start);
  assert.ok(Math.abs(tl.wordTime('c6', 'natural') - nat) < 1e-9);
  assert.ok(Math.abs(tl.events['stamp-obedience'].t0 - (nat - 0.115)) < 1e-9);
});

test('re-timing a cue moves every event that references it (and only those)', () => {
  const cfg = readJson('config/episode.json'), before = resolveTimeline(cfg);
  cfg.voiceover.cues.find((c) => c.id === 'c3').start += 1; cfg.voiceover.cues.find((c) => c.id === 'c3').end += 1;
  const after = resolveTimeline(cfg);
  assert.ok(Math.abs(after.events['label-routine'].t0 - before.events['label-routine'].t0 - 1) < 1e-9);
  assert.equal(after.events['title-ink'].t0, before.events['title-ink'].t0);
});

test('unknown cue/word/scene references give readable errors', () => {
  const mk = (f) => { const c = readJson('config/episode.json'); f(c); return c; };
  assert.throws(() => resolveTimeline(mk((c) => { c.events[0].atCue = 'zz'; delete c.events[0].atSeconds; })), /unknown cue "zz"/);
  assert.throws(() => resolveTimeline(mk((c) => { c.events.find((e) => e.atWord).atWord = 'nope'; })), /no word marker "nope"/);
  assert.throws(() => resolveTimeline(mk((c) => { c.events[0].scene = 'sX'; })), /unknown scene "sX"/);
});

test('text entrances are configured 80-120 ms before the word (incl. one-frame quantisation)', () => {
  const tl = resolveTimeline(readJson('config/episode.json'));
  for (const e of Object.values(tl.events).filter((x) => x.text && x.wordAt !== null && x.align !== 'end')) {
    const lead = e.wordAt - e.t0; assert.ok(lead >= 0.1 && lead <= 0.12, `${e.id} lead ${lead}`);
  }
});

test('cubic-bezier easing: endpoints, monotonic, never linear for the camera', () => {
  const f = cubicBezier(0.45, 0, 0.2, 1);
  assert.equal(f(0), 0); assert.equal(f(1), 1);
  let prev = 0; for (let i = 1; i <= 100; i++) { const y = f(i / 100); assert.ok(y >= prev - 1e-9); prev = y; }
  assert.ok(Math.abs(f(0.25) - 0.25) > 0.02 || Math.abs(f(0.5) - 0.5) > 0.02);
});

test('seeded randomness is stable', () => {
  assert.equal(mulberry32(5)(), mulberry32(5)());
  assert.equal(rngFor('title')(), rngFor('title')());
  assert.notEqual(rngFor('a')(), rngFor('b')());
  assert.equal(hash2(3, 4, 5), hash2(3, 4, 5));
});

test('engine source never uses forbidden nondeterministic APIs', async () => {
  const fs = await import('node:fs'), path = await import('node:path');
  const walk = (d) => fs.readdirSync(d).flatMap((f) => { const p = path.join(d, f); return fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
  for (const f of walk('src')) {
    const s = fs.readFileSync(f, 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const bad of ['Math.random', 'Date.now', 'requestAnimationFrame', 'performance.now', 'new Date']) assert.ok(!s.includes(bad), `${f} uses ${bad}`);
  }
});
