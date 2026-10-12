import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { resolveTimeline } from '../../src/animations/timeline.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const abs = (p) => path.resolve(ROOT, p);

export function readJson(p) {
  try { return JSON.parse(fs.readFileSync(abs(p), 'utf8')); }
  catch (e) { throw new Error(`Cannot read ${p}: ${e.message}. Check the file exists and is valid JSON.`); }
}

/** Load and validate config/episode.json. Throws one readable Error listing every problem. */
export function loadConfig(file = 'config/episode.json') {
  const cfg = readJson(file);
  const schema = readJson('config/episode.schema.json');
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema), ok = validate(cfg);
  const problems = [];
  if (!ok) {
    for (const e of validate.errors) problems.push(`${file}${e.instancePath || ''} ${e.message}${e.params && e.params.additionalProperty ? ` (${e.params.additionalProperty})` : ''}`);
  }
  let tl = null;
  if (!problems.length) {
    try { tl = resolveTimeline(cfg); } catch (e) { problems.push(e.message); }
  }
  if (tl) {
    const ease = new Set(Object.keys(cfg.easing));
    for (const e of cfg.events) if (!ease.has(e.easing)) problems.push(`event "${e.id}" uses unknown easing "${e.easing}" (known: ${[...ease].join(', ')})`);
    for (const s of cfg.sfx) if (s.atCue) { try { tl.wordTime(s.atCue, s.atWord); } catch (e) { problems.push(`sfx "${s.id}": ${e.message}`); } }
    if (Math.abs(cfg.duration * cfg.fps - Math.round(cfg.duration * cfg.fps)) > 1e-6) problems.push('duration x fps must be a whole number of frames');
  }
  if (Array.isArray(cfg.scenes) && cfg.scenes.every((s) => typeof s.start === 'number' && typeof s.end === 'number')) {
    const sorted = [...cfg.scenes].sort((a, b) => a.start - b.start);
    sorted.forEach((s, i) => {
      if (s.end <= s.start) problems.push(`scene ${s.id} ends before it starts`);
      if (i > 0 && Math.abs(s.start - sorted[i - 1].end) > 1e-6) problems.push(`scene ${s.id} does not start where ${sorted[i - 1].id} ends (${sorted[i - 1].end} vs ${s.start})`);
      if (typeof s.module === 'string' && !fs.existsSync(abs(`src/scenes/${s.module}.js`))) problems.push(`scene ${s.id}: module src/scenes/${s.module}.js does not exist`);
    });
    if (Math.abs(sorted[0].start) > 1e-6 || Math.abs(sorted[sorted.length - 1].end - cfg.duration) > 1e-6) problems.push(`scenes must cover 0..${cfg.duration}s exactly`);
  }
  if (problems.length) {
    throw new Error(`Invalid config (${problems.length} problem${problems.length > 1 ? 's' : ''}):\n  - ${problems.join('\n  - ')}\nFix config/episode.json (schema: config/episode.schema.json).`);
  }
  cfg._palette = readJson(cfg.palette);
  cfg._timeline = tl;
  cfg._frames = Math.round(cfg.duration * cfg.fps);
  return cfg;
}

/** Warnings are collected and printed at the end of each run. */
export class Warnings {
  constructor() { this.items = []; }
  add(m) { if (!this.items.includes(m)) this.items.push(m); }
  print() {
    if (!this.items.length) { console.log('\nNo warnings.'); return; }
    console.log(`\nWARNINGS (${this.items.length}):`);
    for (const w of this.items) console.log(`  ! ${w}`);
  }
}
