// Fonts are vendored in public/fonts and loaded from local files only (no system fonts, no network).
export const FACES = [
  { family: 'Cormorant Garamond', weight: '500', style: 'normal', file: 'cormorant-garamond-latin-500-normal.woff2' },
  { family: 'Cormorant Garamond', weight: '600', style: 'normal', file: 'cormorant-garamond-latin-600-normal.woff2' },
  { family: 'Cormorant Garamond', weight: '500', style: 'italic', file: 'cormorant-garamond-latin-500-italic.woff2' },
  { family: 'Inter', weight: '500', style: 'normal', file: 'inter-latin-500-normal.woff2' },
  { family: 'Inter', weight: '600', style: 'normal', file: 'inter-latin-600-normal.woff2' },
  { family: 'Reenie Beanie', weight: '400', style: 'normal', file: 'reenie-beanie-latin-400-normal.woff2' },
  { family: 'Caveat', weight: '400', style: 'normal', file: 'caveat-latin-400-normal.woff2' },
];

export async function loadFonts() {
  for (const f of FACES) {
    const face = new FontFace(f.family, `url(/public/fonts/${f.file}) format("woff2")`, { weight: f.weight, style: f.style });
    try { await face.load(); } catch (e) { throw new Error(`Font failed to load: "${f.family}" ${f.weight} ${f.style} (public/fonts/${f.file}): ${e.message}`); }
    document.fonts.add(face);
  }
  await document.fonts.ready;
  const bad = [];
  for (const f of FACES) if (!document.fonts.check(`${f.style} ${f.weight} 32px "${f.family}"`, 'ABC abc 0123456789')) bad.push(`${f.family} ${f.weight} ${f.style}`);
  if (bad.length) throw new Error(`Fonts not available after loading: ${bad.join(', ')}`);
  return FACES.map((f) => `${f.family} ${f.weight}${f.style === 'italic' ? 'i' : ''}`);
}

/** Verify glyphs exist in the font by rasterising each one and comparing it with the font's missing-glyph box. */
export function glyphsPresent(fontCss, chars) {
  const c = document.createElement('canvas'); c.width = c.height = 48;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.font = fontCss; g.textBaseline = 'top';
  const raster = (ch) => { g.clearRect(0, 0, 48, 48); g.fillText(ch, 4, 4); return Array.from(g.getImageData(0, 0, 48, 48).data).join(','); };
  const tofu = raster('\u{10FFFF}');
  return [...chars].filter((ch) => raster(ch) !== tofu);
}
