// npm run render | render:draft | preview
//   --final (1920x1080, default) | --draft (960x540 + audio) | --preview (960x540 quick, silent)
//   --from N --to N (frame range, inclusive-exclusive)  --workers N  --require-footage  --force  --keep-frames  --no-validate
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { loadConfig, abs, Warnings, ROOT } from '../lib/config.mjs';
import { extractFootage } from '../assets/footage.mjs';
import { startServer, launch, openPage } from './page.mjs';
import { buildMix } from './mix.mjs';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const mode = flag('preview') ? 'preview' : flag('draft') ? 'draft' : 'final';
const scale = mode === 'final' ? 1 : 0.5;
const warnings = new Warnings();

function sourceStamp(cfg) {
  const h = crypto.createHash('sha1');
  const walk = (d) => { for (const f of fs.readdirSync(d).sort()) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : h.update(p).update(fs.readFileSync(p)); } };
  for (const d of ['src', 'config', 'public/illustrations']) walk(abs(d));
  for (const s of Object.keys(cfg.footageSlots)) { const m = abs(`${cfg.output.cache}/footage/${s}/manifest.json`); h.update(fs.existsSync(m) ? fs.readFileSync(m) : 'none'); }
  h.update(String(scale));
  return h.digest('hex');
}

async function main() {
  const t0 = Date.now();
  const cfg = loadConfig();
  if (spawnSync('ffmpeg', ['-version']).status !== 0) throw new Error('ffmpeg not found on PATH. Install it (apt install ffmpeg) or place a static build (ffmpeg-static) on PATH.');
  for (const f of ['public/textures/wood.png', 'public/textures/parchment.png', 'public/illustrations/candle.svg']) {
    if (!fs.existsSync(abs(f))) { console.log('Assets missing, running "npm run assets" first...'); const r = spawnSync('node', [abs('scripts/assets/build-assets.mjs')], { stdio: 'inherit' }); if (r.status !== 0) throw new Error('npm run assets failed'); break; }
  }
  const fx = extractFootage(cfg, warnings);
  if (flag('require-footage') && mode === 'final') {
    const miss = Object.entries(cfg.footageSlots).filter(([k, s]) => !fx[k].present && !s.optional).map(([k]) => k);
    if (miss.length) throw new Error(`--require-footage: footage slot(s) ${miss.join(', ')} missing. Place the clips in public/footage/ and set inSeconds/crop in config/episode.json.`);
  }
  const total = cfg._frames, from = +opt('from', 0), to = +opt('to', total);
  if (!(from >= 0 && to <= total && from < to)) throw new Error(`Bad frame range ${from}..${to} (valid 0..${total})`);
  const dir = abs(`${cfg.output.frames}/${mode === 'final' ? 'final' : 'half'}`);
  const stamp = sourceStamp(cfg), stampFile = path.join(dir, '.stamp');
  fs.mkdirSync(dir, { recursive: true });
  if (flag('force') || !fs.existsSync(stampFile) || fs.readFileSync(stampFile, 'utf8') !== stamp) { for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f), { force: true }); fs.writeFileSync(stampFile, stamp); console.log('Source changed since the last render: frame cache cleared.'); }
  const file = (i) => path.join(dir, `${String(i).padStart(4, '0')}.png`);
  const todo = []; for (let i = from; i < to; i++) if (!(fs.existsSync(file(i)) && fs.statSync(file(i)).size > 1000)) todo.push(i);
  console.log(`${mode}: ${to - from} frames (${todo.length} to render, ${to - from - todo.length} cached) at ${Math.round(1920 * scale)}x${Math.round(1080 * scale)}`);

  if (todo.length) {
    const { server, port } = await startServer(); const browser = await launch();
    const n = Math.max(1, Math.min(+opt('workers', Math.min(4, os.cpus().length)), todo.length));
    try {
      const pages = await Promise.all(Array.from({ length: n }, () => openPage(browser, port, scale)));
      const queue = [...todo]; let done = 0; const tStart = Date.now();
      await Promise.all(pages.map(async (page) => {
        for (;;) {
          const i = queue.shift(); if (i === undefined) return;
          try {
            await page.evaluate((k) => window.renderFrame(k), i);
            const url = await page.evaluate(() => window.grab());
            await fsp.writeFile(file(i), Buffer.from(url.split(',')[1], 'base64'));
          } catch (e) { throw new Error(`Frame ${i} (t=${(i / cfg.fps).toFixed(2)}s) failed: ${e.message.split('\n')[0]}${page.__errors.length ? ` | page: ${page.__errors.slice(-2).join(' | ')}` : ''}`); }
          done++;
          if (done % 30 === 0 || done === todo.length) { const el = (Date.now() - tStart) / 1000; process.stdout.write(`\r  ${done}/${todo.length} frames  ${(done / el).toFixed(1)} fps  eta ${Math.max(0, Math.round((todo.length - done) / (done / el)))}s   `); }
        }
      }));
      process.stdout.write('\n');
    } finally { await browser.close(); server.close(); }
  }
  if (from !== 0 || to !== total) { console.log('Partial range rendered; skipping encode.'); return; }

  const mix = mode === 'preview' ? null : buildMix(cfg, warnings);
  const outFile = abs(cfg.output[mode === 'final' ? 'final' : mode === 'draft' ? 'draft' : 'preview']);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const base = ['-y', '-v', 'error', '-framerate', String(cfg.fps), '-start_number', '0', '-i', path.join(dir, '%04d.png')];
  const enc = mode === 'final' ? ['-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '14'] : mode === 'draft' ? ['-c:v', 'libx264', '-profile:v', 'high', '-preset', 'medium', '-crf', '20'] : ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '26'];
  const aud = mix ? ['-i', mix, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', mode === 'final' ? '320k' : '192k', '-ar', '48000', '-ac', '2'] : ['-an'];
  console.log(`Encoding ${path.relative(ROOT, outFile)} ...`);
  let r = spawnSync('ffmpeg', [...base, ...aud, ...enc, '-pix_fmt', 'yuv420p', '-r', String(cfg.fps), '-frames:v', String(total), '-movflags', '+faststart', outFile], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg encode failed: ${(r.stderr || '').trim().split('\n').slice(-3).join(' | ')}`);
  if (mode === 'final') {
    const inter = abs(cfg.output.intermediate);
    r = spawnSync('ffmpeg', [...base, '-i', mix, '-map', '0:v', '-map', '1:a', '-c:v', 'prores_ks', '-profile:v', '3', '-pix_fmt', 'yuv422p10le', '-c:a', 'pcm_s24le', '-frames:v', String(total), inter], { encoding: 'utf8' });
    if (r.status !== 0) warnings.add(`ProRes intermediate failed: ${(r.stderr || '').trim().split('\n').pop()}`); else console.log(`Intermediate: ${path.relative(ROOT, inter)} (ProRes 422 HQ)`);
  }
  console.log(`Done in ${Math.round((Date.now() - t0) / 1000)}s -> ${path.relative(ROOT, outFile)}`);
  if (mode === 'final' && !flag('no-validate')) {
    const v = spawnSync('node', [abs('scripts/validate/validate.mjs')], { stdio: 'inherit' });
    if (v.status !== 0) process.exitCode = v.status;
  }
}
main().then(() => warnings.print(), (e) => { console.error(`\nERROR: ${e.message}`); warnings.print(); process.exit(1); });
