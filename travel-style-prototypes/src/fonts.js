// Text is converted to vector outlines at build time so each .riv is
// self-contained (no font assets to ship or load).
'use strict';
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const FILES = {
  serif: 'dm-serif-display/files/dm-serif-display-latin-400-normal.woff',
  serifItalic: 'dm-serif-display/files/dm-serif-display-latin-400-italic.woff',
  sans: 'josefin-sans/files/josefin-sans-latin-600-normal.woff',
  sansBold: 'josefin-sans/files/josefin-sans-latin-700-normal.woff',
  hand: 'caveat/files/caveat-latin-500-normal.woff',
  pixel: 'silkscreen/files/silkscreen-latin-400-normal.woff',
  pixelBold: 'silkscreen/files/silkscreen-latin-700-normal.woff',
};
const cache = {};
function font(name) {
  if (!cache[name]) {
    const p = path.join(__dirname, '..', 'node_modules', '@fontsource', FILES[name]);
    const b = fs.readFileSync(p);
    cache[name] = opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
  }
  return cache[name];
}

// Returns {d, width}. anchor: 'start' | 'middle' | 'end'. tracking in em/1000.
function text(fontName, str, x, y, size, { anchor = 'start', tracking = 0 } = {}) {
  const fo = font(fontName);
  const glyphs = fo.stringToGlyphs(str);
  const scale = size / fo.unitsPerEm;
  let w = 0;
  const adv = glyphs.map((g, i) => {
    let a = g.advanceWidth * scale + (tracking / 1000) * size;
    if (i < glyphs.length - 1) a += fo.getKerningValue(g, glyphs[i + 1]) * scale;
    return a;
  });
  w = adv.reduce((s, a) => s + a, 0) - (tracking / 1000) * size;
  let cx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  const parts = [];
  glyphs.forEach((g, i) => { const d = g.getPath(cx, y, size).toPathData(2); if (d) parts.push(d); cx += adv[i]; });
  return { d: parts.join(' '), width: w };
}

module.exports = { text, font };
