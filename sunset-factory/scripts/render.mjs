// Deterministic frame renderer: headless Chromium draws window.renderFrame(i); frames are written as PNG.
//   node scripts/render.mjs                      full 1080x1920 render -> out/frames, then encode (needs out/audio.wav, else silent)
//   node scripts/render.mjs --scale 0.5          half-size preview render -> out/frames-0.5
//   node scripts/render.mjs --stills 0,90,300    render only these frames -> out/stills (add --scale)
//   node scripts/render.mjs --encode-only        skip rendering, just encode existing frames
//   --workers N   --from N --to N   --force
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('playwright')); }

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const scale = parseFloat(opt('scale', '1'));
const { FPS, DURATION } = await import(path.join(ROOT, 'src/story.js'));
const TOTAL = Math.round(FPS * DURATION);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
function startServer() {
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const f = path.join(ROOT, u === '/' ? 'src/index.html' : u);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 400, height: 400 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${port}/src/index.html?scale=${scale}`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 30000 });
  const r = await page.evaluate(() => window.__ready);
  if (!r.ok) throw new Error(`Renderer failed to boot: ${r.error}${errors.length ? `\n  page errors: ${errors.join(' | ')}` : ''}`);
  page.__errors = errors;
  return page;
}

async function renderFrames(list, file) {
  const { server, port } = await startServer();
  const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--disable-lcd-text', '--no-sandbox', '--disable-gpu'] });
  const n = Math.max(1, Math.min(+opt('workers', Math.min(4, os.cpus().length)), list.length));
  try {
    const pages = await Promise.all(Array.from({ length: n }, () => openPage(browser, port)));
    const queue = [...list]; let done = 0; const t0 = Date.now();
    await Promise.all(pages.map(async (page) => {
      for (;;) {
        const i = queue.shift(); if (i === undefined) return;
        try {
          const url = await page.evaluate((k) => { window.renderFrame(k); return window.grab(); }, i);
          await fsp.writeFile(file(i), Buffer.from(url.split(',')[1], 'base64'));
        } catch (e) { throw new Error(`Frame ${i} (t=${(i / FPS).toFixed(2)}s) failed: ${e.message.split('\n')[0]}${page.__errors.length ? ` | page: ${page.__errors.slice(-2).join(' | ')}` : ''}`); }
        done++;
        if (done % 20 === 0 || done === list.length) { const el = (Date.now() - t0) / 1000; process.stdout.write(`\r  ${done}/${list.length} frames  ${(done / el).toFixed(1)} fps   `); }
      }
    }));
    process.stdout.write('\n');
  } finally { await browser.close(); server.close(); }
}

function encode(dir) {
  const out = path.join(ROOT, scale === 1 ? 'export/sunset-factory_1080x1920.mp4' : `out/preview-${scale}.mp4`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const audio = path.join(ROOT, 'out/audio.wav');
  const hasAudio = fs.existsSync(audio);
  const args = ['-y', '-v', 'error', '-framerate', String(FPS), '-start_number', '0', '-i', path.join(dir, '%04d.png')];
  if (hasAudio) args.push('-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-ac', '2');
  else args.push('-an');
  const crf = scale === 1 ? '16' : '22';
  args.push('-c:v', 'libx264', '-profile:v', 'high', '-level:v', '4.2', '-preset', scale === 1 ? 'slow' : 'medium', '-crf', crf, '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-r', String(FPS), '-frames:v', String(TOTAL), '-t', String(DURATION), '-movflags', '+faststart', out);
  console.log(`Encoding ${path.relative(ROOT, out)}${hasAudio ? ' with audio' : ' (silent: run scripts/audio.mjs first)'} ...`);
  const r = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${(r.stderr || '').trim().split('\n').slice(-4).join(' | ')}`);
  console.log(`-> ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
}

async function main() {
  const t0 = Date.now();
  if (opt('stills')) {
    const list = opt('stills').split(',').map((v) => (v.endsWith('s') ? Math.round(parseFloat(v) * FPS) : parseInt(v, 10)));
    const dir = path.join(ROOT, 'out/stills'); fs.mkdirSync(dir, { recursive: true });
    await renderFrames(list, (i) => path.join(dir, `f${String(i).padStart(4, '0')}.png`));
    console.log(`stills -> out/stills (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    return;
  }
  const dir = path.join(ROOT, scale === 1 ? 'out/frames' : `out/frames-${scale}`);
  fs.mkdirSync(dir, { recursive: true });
  const file = (i) => path.join(dir, `${String(i).padStart(4, '0')}.png`);
  if (!flag('encode-only')) {
    const from = +opt('from', 0), to = +opt('to', TOTAL);
    const todo = [];
    for (let i = from; i < to; i++) if (flag('force') || !(fs.existsSync(file(i)) && fs.statSync(file(i)).size > 1000)) todo.push(i);
    console.log(`Rendering ${todo.length} of ${to - from} frames at ${Math.round(1080 * scale)}x${Math.round(1920 * scale)}`);
    if (todo.length) await renderFrames(todo, file);
    if (from !== 0 || to !== TOTAL) { console.log('Partial range rendered; skipping encode.'); return; }
  }
  encode(dir);
  console.log(`Done in ${Math.round((Date.now() - t0) / 1000)}s`);
}
main().catch((e) => { console.error(`\nERROR: ${e.message}`); process.exit(1); });
