import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer, launch, openPage } from '../scripts/render/page.mjs';

test('frames 0, 450 and 899 are pixel-identical across two fresh renders (half scale)', { timeout: 180000 }, async () => {
  const { server, port } = await startServer(), browser = await launch();
  try {
    const run = async () => { const page = await openPage(browser, port, 0.5), out = []; for (const f of [0, 450, 899]) { await page.evaluate((i) => window.renderFrame(i), f); out.push(await page.evaluate(() => window.frameHash())); } await page.close(); return out; };
    assert.deepEqual(await run(), await run());
  } finally { await browser.close(); server.close(); }
});

test('rendering out of order gives the same pixels (a frame is a pure function of its index)', { timeout: 180000 }, async () => {
  const { server, port } = await startServer(), browser = await launch();
  try {
    const page = await openPage(browser, port, 0.5), h = {};
    for (const f of [300, 10, 300, 700, 10]) { await page.evaluate((i) => window.renderFrame(i), f); const x = await page.evaluate(() => window.frameHash()); if (h[f]) assert.equal(x, h[f], `frame ${f} changed between visits`); h[f] = x; }
  } finally { await browser.close(); server.close(); }
});
