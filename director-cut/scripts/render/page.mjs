// Shared: static server + Playwright page pool for the deterministic frame renderer.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ROOT } from '../lib/config.mjs';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.wav': 'audio/wav' };

export function startServer() {
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const f = path.join(ROOT, u === '/' ? 'src/index.html' : u);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

export async function launch() {
  try {
    return await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text', '--no-sandbox', '--disable-gpu', '--disable-features=ScrollbarThemeFadeout'] });
  } catch (e) {
    throw new Error(`Cannot launch Chromium via Playwright: ${e.message.split('\n')[0]}. Install a browser ("npx playwright install chromium") or set PLAYWRIGHT_BROWSERS_PATH to an existing one.`);
  }
}

/** Open a page that has booted the engine. Throws with the page's own error text if boot fails. */
export async function openPage(browser, port, scale) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${port}/src/index.html?scale=${scale}`);
  const r = await page.evaluate(() => window.__ready);
  if (!r.ok) throw new Error(`Engine failed to boot: ${r.error}${errors.length ? `\n  page errors: ${errors.join(' | ')}` : ''}`);
  page.__errors = errors;
  return page;
}
