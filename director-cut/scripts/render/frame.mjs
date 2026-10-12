// Dev helper: node scripts/render/frame.mjs <scale> <outDir> <frame> [frame...]
import fs from 'node:fs';
import { startServer, launch, openPage } from './page.mjs';
const [scale, outDir, ...frames] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const { server, port } = await startServer(); const browser = await launch();
try {
  const page = await openPage(browser, port, parseFloat(scale));
  for (const f of frames) {
    const t0 = Date.now();
    await page.evaluate((i) => window.renderFrame(i), +f);
    const url = await page.evaluate(() => window.grab());
    fs.writeFileSync(`${outDir}/f${String(f).padStart(4, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`frame ${f} ${Date.now() - t0}ms`);
  }
  if (page.__errors.length) console.log('page errors:', page.__errors);
} catch (e) { console.error(e.message); process.exitCode = 1; } finally { await browser.close(); server.close(); }
