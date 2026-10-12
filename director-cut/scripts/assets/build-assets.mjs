// npm run assets : textures + SVG illustrations + footage frame cache + font check.
import fs from 'node:fs';
import { loadConfig, abs, Warnings } from '../lib/config.mjs';
import { buildTextures } from './textures.mjs';
import { buildSvgs } from './svgs.mjs';
import { extractFootage } from './footage.mjs';

const force = process.argv.includes('--force');
const warnings = new Warnings();
try {
  const cfg = loadConfig();
  const P = cfg._palette;
  const need = ['cormorant-garamond-latin-500-normal.woff2', 'cormorant-garamond-latin-600-normal.woff2', 'cormorant-garamond-latin-500-italic.woff2', 'inter-latin-500-normal.woff2', 'inter-latin-600-normal.woff2', 'reenie-beanie-latin-400-normal.woff2', 'caveat-latin-400-normal.woff2'];
  const missing = need.filter((f) => !fs.existsSync(abs(`public/fonts/${f}`)));
  if (missing.length) throw new Error(`Vendored font files missing from public/fonts: ${missing.join(', ')}. Run "npm install" then copy them from node_modules/@fontsource/<family>/files/ (see README).`);

  const texDir = abs('public/textures');
  const have = ['wood.png', 'parchment.png', 'paper-ivory.png', 'paper-aged.png'].every((f) => fs.existsSync(`${texDir}/${f}`));
  if (!have || force) { console.log('Generating textures at 2x (seeded)...'); console.log(`  done in ${(buildTextures(texDir, P) / 1000).toFixed(1)}s`); }
  else console.log('Textures up to date (use --force to rebuild).');

  buildSvgs(abs('public/illustrations'), P);
  console.log('SVG illustrations written to public/illustrations/');

  fs.mkdirSync(abs('public/footage'), { recursive: true });
  const fx = extractFootage(cfg, warnings, { force });
  for (const [s, v] of Object.entries(fx)) console.log(`Footage ${s}: ${v.present ? `${v.count} frames cached` : 'MISSING (stand-in)'}`);
  if (!fs.existsSync(abs(cfg.voiceover.path))) warnings.add(`Voiceover missing (${cfg.voiceover.path}): the render will use a silent 30 s track.`);
  warnings.print();
} catch (e) { console.error(`ERROR: ${e.message}`); process.exit(1); }
