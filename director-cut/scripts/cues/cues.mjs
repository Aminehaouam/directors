// Re-time the voiceover after recording. Only cue start/end times change; every event follows.
//   node scripts/cues/cues.mjs times.json            (preview the change)
//   node scripts/cues/cues.mjs times.json --write    (update config/episode.json, keeps a .bak)
//   node scripts/cues/cues.mjs --whisper out.json [--write]   (Whisper JSON: segments, optional word timestamps)
// times.json: {"c1":{"start":0.35,"end":4.6}, ...}  or  [{"id":"c1","start":0.35,"end":4.6}, ...]
import fs from 'node:fs';
import { abs, readJson } from '../lib/config.mjs';
import { resolveTimeline } from '../../src/animations/timeline.js';

const argv = process.argv.slice(2), write = argv.includes('--write');
const wi = argv.indexOf('--whisper'), whisper = wi >= 0 ? argv[wi + 1] : null, file = argv.find((a) => !a.startsWith('--') && a !== whisper);
const norm = (s) => s.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
const fail = (m) => { console.error(`ERROR: ${m}`); process.exit(1); };

if (!file && !whisper) fail('usage: cues.mjs <times.json> [--write]   |   cues.mjs --whisper <whisper.json> [--write]');
const cfg = readJson('config/episode.json'), cues = cfg.voiceover.cues, next = {};

if (file) {
  let t; try { t = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { fail(`cannot read ${file}: ${e.message}`); }
  for (const c of Array.isArray(t) ? t : Object.entries(t).map(([id, v]) => ({ id, ...v }))) {
    if (!cues.find((x) => x.id === c.id)) fail(`unknown cue "${c.id}" (known: ${cues.map((x) => x.id).join(', ')})`);
    if (!(c.end > c.start && c.start >= 0)) fail(`cue ${c.id}: need 0 <= start < end (got ${c.start}..${c.end})`);
    next[c.id] = { start: c.start, end: c.end };
  }
} else {
  let w; try { w = JSON.parse(fs.readFileSync(whisper, 'utf8')); } catch (e) { fail(`cannot read ${whisper}: ${e.message}`); }
  const segs = w.segments || []; if (!segs.length) fail('whisper JSON has no "segments"');
  for (const c of cues) {
    const cw = new Set(norm(c.text || ''));
    let best = null, score = 0;
    for (const s of segs) { const sw = new Set(norm(s.text)), j = [...cw].filter((x) => sw.has(x)).length / Math.max(1, new Set([...cw, ...sw]).size); if (j > score) { score = j; best = s; } }
    if (!best || score < 0.35) { console.warn(`  ! cue ${c.id}: no whisper segment matches "${c.text}" (best score ${score.toFixed(2)}); left unchanged`); continue; }
    next[c.id] = { start: +(best.words?.[0]?.start ?? best.start).toFixed(2), end: +(best.words?.[best.words.length - 1]?.end ?? best.end).toFixed(2) };
    if (best.words?.length) { // refresh word markers (as fractions of the cue) for words that exist in the transcript
      const dur = next[c.id].end - next[c.id].start, toks = best.words.map((x) => ({ w: norm(x.word)[0], t: x.start }));
      for (const key of Object.keys(c.words || {})) { const base = key.replace(/\d+$/, ''), occ = +(key.match(/\d+$/)?.[0] || 1), hits = toks.filter((x) => x.w === base); if (hits[occ - 1]) c.words[key] = +((hits[occ - 1].t - next[c.id].start) / dur).toFixed(3); }
    }
  }
}
for (const c of cues) if (next[c.id]) Object.assign(c, next[c.id]);
const ordered = [...cues].sort((a, b) => a.start - b.start);
ordered.forEach((c, i) => { if (i && c.start < ordered[i - 1].end) console.warn(`  ! cue ${c.id} starts (${c.start}) before ${ordered[i - 1].id} ends (${ordered[i - 1].end})`); });
try { resolveTimeline(cfg); } catch (e) { fail(e.message); }
const wasCues = readJson('config/episode.json').voiceover.cues;
console.log('cue   start -> new     end -> new');
for (const c of cues) { const o = wasCues.find((x) => x.id === c.id); console.log(`${c.id.padEnd(4)}  ${o.start.toFixed(2).padStart(5)} -> ${c.start.toFixed(2).padStart(5)}   ${o.end.toFixed(2).padStart(5)} -> ${c.end.toFixed(2).padStart(5)}`); }
if (cues[cues.length - 1].end > cfg.duration) console.warn(`  ! last cue ends at ${cues[cues.length - 1].end}s, past the ${cfg.duration}s film. Shorten the read or see README "timing".`);
if (write) {
  fs.copyFileSync(abs('config/episode.json'), abs('config/episode.json.bak'));
  // rewrite only the cue lines so the rest of the file's formatting is untouched
  let txt = fs.readFileSync(abs('config/episode.json'), 'utf8');
  for (const c of cues) txt = txt.replace(new RegExp(`("id": "${c.id}",\\s*"start": )[\\d.]+(,\\s*"end": )[\\d.]+`), `$1${c.start}$2${c.end}`);
  fs.writeFileSync(abs('config/episode.json'), txt);
  const again = readJson('config/episode.json').voiceover.cues;
  if (again.some((c) => Math.abs(c.start - cues.find((x) => x.id === c.id).start) > 1e-9)) fail('could not rewrite cue lines automatically; edit config/episode.json by hand');
  console.log('Wrote config/episode.json (backup: config/episode.json.bak). Re-render to apply.');
} else console.log('(preview only; add --write to apply)');
