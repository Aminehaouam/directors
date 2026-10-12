import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { abs } from '../scripts/lib/config.mjs';

const run = (args) => spawnSync('node', [abs('scripts/cues/cues.mjs'), ...args], { encoding: 'utf8' });
const tmp = (obj) => { const f = path.join(os.tmpdir(), `cues-${process.pid}-${Math.random().toString(36).slice(2)}.json`); fs.writeFileSync(f, JSON.stringify(obj)); return f; };

test('cues tool previews a re-timing without touching the config', () => {
  const before = fs.readFileSync(abs('config/episode.json'), 'utf8');
  const r = run([tmp({ c1: { start: 0.4, end: 4.9 } })]);
  assert.equal(r.status, 0); assert.match(r.stdout, /c1\s+0.30 ->\s+0.40/); assert.match(r.stdout, /preview only/);
  assert.equal(fs.readFileSync(abs('config/episode.json'), 'utf8'), before);
});
test('cues tool rejects unknown cues and impossible times with a clear message', () => {
  assert.match(run([tmp({ zz: { start: 1, end: 2 } })]).stderr, /unknown cue "zz"/);
  assert.match(run([tmp({ c1: { start: 3, end: 2 } })]).stderr, /need 0 <= start < end/);
});
test('config validation reports every problem readably', async () => {
  const { loadConfig } = await import('../scripts/lib/config.mjs');
  const orig = fs.readFileSync(abs('config/episode.json'), 'utf8'), c = JSON.parse(orig);
  c.fps = 'fast'; c.scenes[0].module = 'nope'; fs.writeFileSync(abs('config/episode.json'), JSON.stringify(c));
  try { assert.throws(() => loadConfig(), (e) => /Invalid config \(\d+ problems?\)/.test(e.message) && /fps/.test(e.message) && /nope/.test(e.message)); }
  finally { fs.writeFileSync(abs('config/episode.json'), orig); }
});
