// Renders illustrated/scenes.js with headless Chromium.
//   node render.js OUT.mp4                     full 15 s video (450 frames, lossless-ish H.264)
//   node render.js --stills DIR 0.1,2.4,...    PNG stills at the given times in seconds
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

async function main() {
  const args = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => { console.error('page error:', e.message); process.exitCode = 1; });
  await page.goto(pathToFileURL(path.join(__dirname, 'index.html')).href);
  await page.evaluate(async () => {
    await document.fonts.load('900 40px Nunito');
    await document.fonts.load('800 40px Nunito');
    await document.fonts.ready;
  });
  const frame = async (i) => {
    const url = await page.evaluate((n) => window.renderFrame(n), i);
    return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  };

  if (args[0] === '--stills') {
    fs.mkdirSync(args[1], { recursive: true });
    for (const s of args[2].split(',')) {
      const t = parseFloat(s);
      fs.writeFileSync(path.join(args[1], `ill_${t.toFixed(2)}.png`), await frame(Math.round(t * 30)));
    }
  } else {
    const n = await page.evaluate(() => window.TOTAL_FRAMES);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-pix_fmt', 'yuv420p', args[0]],
    { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
    for (let i = 0; i < n; i++) {
      if (!ff.stdin.write(await frame(i))) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await done;
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
