// Usage: node render/render.js <A|B|C> [--frames 0,90,170] [--video] [--every N]
// Drives the compositor in headless Chromium and writes PNG frames / MP4.
const path = require('path'); const fs = require('fs'); const { execFileSync, spawn } = require('child_process');
const { chromium } = require('playwright'); const serve = require('../tools/serve');
const TL = require('../src/timeline');
const styles = require('../rive/styles.json');
const args = process.argv.slice(2); const style = args[0] || 'A'; const S = styles[style];
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const root = path.join(__dirname, '..');
(async () => {
  const port = 8200 + Math.floor(Math.random() * 500);
  const server = await serve(port);
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync'] });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://localhost:${port}/compositor/index.html?style=${style}${opt('--only') ? '&only=' + opt('--only') : ''}`);
  const layers = await page.evaluate(() => window.ready);
  console.log(style, 'layers:', layers.join(', '));
  const total = Math.round(TL.duration * TL.fps);
  const video = args.includes('--video');
  const want = opt('--frames') ? opt('--frames').split(',').map(Number) : null;
  const every = +(opt('--every') || 0);
    const kdir = path.join(root, 'out', 'stills'); fs.mkdirSync(kdir, { recursive: true });
  const t0 = Date.now();
  let ff = null, ffDone = null;
  const mp4 = path.join(root, 'out', `${S.slug}.mp4`);
  if (video) {
    ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(TL.fps), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(TL.fps), '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
    ffDone = new Promise((r) => ff.on('close', r));
  }
  const last = want ? Math.max(...want) : total - 1;
  for (let f = 0; f <= last; f++) {
    const keep = video || (want && want.includes(f)) || (every && f % every === 0);
    const data = await page.evaluate(([f, keep]) => { const c = comp.renderFrame(f); return keep ? c.toDataURL('image/png') : null; }, [f, keep]);
    if (!data) continue;
    const buf = Buffer.from(data.split(',')[1], 'base64');
    if (video && !ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((want && want.includes(f)) || (every && f % every === 0)) fs.writeFileSync(path.join(kdir, `${S.slug}-f${String(f).padStart(3, '0')}.png`), buf);
    if (f % 30 === 0) process.stdout.write(`  frame ${f}/${last}  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
  }
  await browser.close(); server.close();
  if (video) {
    ff.stdin.end(); await ffDone;
    console.log('wrote', mp4, (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
  }
})();
