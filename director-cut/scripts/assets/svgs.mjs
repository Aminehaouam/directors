// Original, editable engraving-style SVG illustrations (generated with a seeded script, saved as plain .svg).
import fs from 'node:fs';
import path from 'node:path';
import { mulberry32 } from '../../src/animations/rng.js';

let uid = 0;
const f = (n) => Math.round(n * 10) / 10;

/** Parallel-line hatch clipped to `clip` (an SVG path d-string). */
function hatch({ clip, bbox: [x, y, w, h], angle = 45, spacing = 6, width = 1.1, color = '#171714', opacity = 0.8, seed = 1, wobble = 0.35 }) {
  const r = mulberry32(seed), id = `hc${++uid}`, cx = x + w / 2, cy = y + h / 2, d = Math.hypot(w, h) / 2 + 4;
  let lines = '';
  for (let o = -d; o <= d; o += spacing) {
    const j = (r() - 0.5) * spacing * wobble, wd = width * (0.7 + r() * 0.6);
    lines += `<line x1="${f(cx - d)}" y1="${f(cy + o + j)}" x2="${f(cx + d)}" y2="${f(cy + o + j + (r() - 0.5) * 1.5)}" stroke-width="${f(wd)}"/>`;
  }
  return `<clipPath id="${id}"><path d="${clip}"/></clipPath><g clip-path="url(#${id})" stroke="${color}" stroke-opacity="${opacity}" stroke-linecap="round" fill="none"><g transform="rotate(${angle} ${f(cx)} ${f(cy)})">${lines}</g></g>`;
}
function stipple({ clip, bbox: [x, y, w, h], count = 160, color = '#171714', seed = 1, r0 = 0.9, opacity = 0.7 }) {
  const r = mulberry32(seed), id = `sc${++uid}`;
  let dots = '';
  for (let i = 0; i < count; i++) dots += `<circle cx="${f(x + r() * w)}" cy="${f(y + r() * h)}" r="${f(r0 * (0.5 + r() * 0.8))}"/>`;
  return `<clipPath id="${id}"><path d="${clip}"/></clipPath><g clip-path="url(#${id})" fill="${color}" fill-opacity="${opacity}">${dots}</g>`;
}
const wrap = (w, h, body, title) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><title>${title}</title>${body}</svg>\n`;
const rr = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

export function buildSvgs(outDir, P) {
  fs.mkdirSync(outDir, { recursive: true });
  const put = (name, s) => fs.writeFileSync(path.join(outDir, name), s);
  const ink = P.ink, ivory = P.ivory, brass = P.brass, walnut = P.walnut, shadow = P.shadow, olive = P.olive;

  // ---- candle (flame is drawn live in the engine) -------------------------------------------------
  {
    const dish = 'M18 392Q100 440 182 392L170 372H30Z', body = 'M70 134Q100 126 130 134V384H70Z';
    put('candle.svg', wrap(200, 440,
      `<path d="${dish}" fill="${brass}" stroke="${ink}" stroke-width="3"/>` + hatch({ clip: dish, bbox: [18, 372, 164, 68], angle: 60, spacing: 5, seed: 3, opacity: 0.55 }) +
      `<path d="${body}" fill="${ivory}" stroke="${ink}" stroke-width="3"/>` + hatch({ clip: body, bbox: [100, 130, 30, 254], angle: 70, spacing: 4.5, seed: 4, opacity: 0.6 }) +
      `<path d="M78 134Q76 168 82 190Q88 204 94 186Q96 160 94 133Z" fill="${P.parchment}" stroke="${ink}" stroke-width="2"/>` +
      `<ellipse cx="100" cy="134" rx="30" ry="5" fill="${P.aged}" stroke="${ink}" stroke-width="2.4"/>` +
      `<path d="M100 132V108" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"/>`, 'candle'));
  }
  // ---- fountain pen --------------------------------------------------------------------------------
  {
    const barrel = rr(160, 14, 400, 42, 20), cap = rr(540, 12, 140, 46, 22), nib = 'M12 35L150 18V52Z';
    put('pen.svg', wrap(700, 70,
      `<path d="${nib}" fill="${brass}" stroke="${ink}" stroke-width="2.5"/><path d="M14 35L120 35" stroke="${ink}" stroke-width="1.6"/><circle cx="100" cy="35" r="3" fill="${ink}"/>` +
      `<path d="M150 20H170V50H150Z" fill="${ink}"/>` +
      `<path d="${barrel}" fill="${ink}" stroke="${ink}" stroke-width="2"/>` + hatch({ clip: barrel, bbox: [160, 14, 400, 42], angle: 0, spacing: 4, seed: 8, color: P.parchment, opacity: 0.18 }) +
      `<path d="M176 20H540" stroke="${P.parchment}" stroke-opacity="0.55" stroke-width="2.4" stroke-linecap="round"/>` +
      `<path d="${cap}" fill="${ink}" stroke="${ink}" stroke-width="2"/><rect x="536" y="12" width="9" height="46" fill="${brass}" stroke="${ink}" stroke-width="1.5"/><rect x="590" y="12" width="7" height="46" fill="${brass}" stroke="${ink}" stroke-width="1.5"/>` +
      `<path d="M552 19H670" stroke="${P.parchment}" stroke-opacity="0.5" stroke-width="2.2" stroke-linecap="round"/>`, 'pen'));
  }
  // ---- film reel with a trailing strip -----------------------------------------------------------------
  {
    const cx = 220, cy = 220;
    let holes = '';
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.26; holes += `M${f(cx + Math.cos(a) * 120 + 52)} ${f(cy + Math.sin(a) * 120)}A52 52 0 1 0 ${f(cx + Math.cos(a) * 120 - 52)} ${f(cy + Math.sin(a) * 120)}A52 52 0 1 0 ${f(cx + Math.cos(a) * 120 + 52)} ${f(cy + Math.sin(a) * 120)}Z`; }
    const ring = `M${cx - 200} ${cy}A200 200 0 1 0 ${cx + 200} ${cy}A200 200 0 1 0 ${cx - 200} ${cy}Z${holes}M${cx + 14} ${cy}A14 14 0 1 0 ${cx - 14} ${cy}A14 14 0 1 0 ${cx + 14} ${cy}Z`;
    // strip: quadratic bezier ribbon with sprocket holes
    const P0 = [150, 410], P1 = [330, 470], P2 = [690, 380];
    let ribbon = '', spr = '';
    const pt = (t) => [(1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0], (1 - t) * (1 - t) * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]];
    const tan = (t) => { const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]); const l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
    const top = [], bot = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40, [x, y] = pt(t), [tx, ty] = tan(t); top.push([x - ty * 24, y + tx * 24]); bot.push([x + ty * 24, y - tx * 24]); }
    ribbon = `M${top.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}L${bot.reverse().map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
    for (let i = 1; i < 40; i++) { const t = i / 40, [x, y] = pt(t), [tx, ty] = tan(t); for (const s of [-17, 17]) { const px = x - ty * s, py = y + tx * s; spr += `<rect x="${f(px - 3.5)}" y="${f(py - 3.5)}" width="7" height="7" rx="1.5" fill="${P.parchment}" transform="rotate(${f(Math.atan2(ty, tx) * 180 / Math.PI)} ${f(px)} ${f(py)})"/>`; } }
    put('reel.svg', wrap(700, 480,
      `<path d="${ribbon}" fill="${ink}" stroke="${ink}" stroke-width="2"/>${spr}` +
      `<path d="${ring}" fill="${brass}" fill-rule="evenodd" stroke="${ink}" stroke-width="3.5"/>` + hatch({ clip: ring, bbox: [20, 20, 400, 400], angle: 135, spacing: 6, seed: 12, opacity: 0.5 }) +
      `<circle cx="${cx}" cy="${cy}" r="190" fill="none" stroke="${ink}" stroke-opacity="0.6" stroke-width="1.6"/><circle cx="${cx}" cy="${cy}" r="62" fill="none" stroke="${ink}" stroke-opacity="0.6" stroke-width="1.6"/>`, 'reel'));
  }
  // ---- stack of books -------------------------------------------------------------------------------------
  {
    const bk = (x, y, w, h, fill, seed) => {
      const body = rr(x, y, w, h, 6), pages = `M${x + w - 18} ${y + 6}H${x + w - 3}V${y + h - 6}H${x + w - 18}Z`;
      let lines = '';
      for (let i = 0; i < 6; i++) lines += `<path d="M${x + w - 17} ${y + 11 + i * ((h - 22) / 5)}H${x + w - 4}" stroke="${ink}" stroke-opacity="0.55" stroke-width="1"/>`;
      return `<path d="${body}" fill="${fill}" stroke="${ink}" stroke-width="3"/>` + hatch({ clip: body, bbox: [x, y, w, h], angle: 50, spacing: 5.5, seed, opacity: 0.45, color: ink }) +
        `<path d="${pages}" fill="${ivory}" stroke="${ink}" stroke-width="1.6"/>${lines}` +
        `<path d="M${x + 26} ${y + 3}V${y + h - 3}M${x + 40} ${y + 3}V${y + h - 3}" stroke="${brass}" stroke-width="3"/>`;
    };
    put('books.svg', wrap(460, 330, bk(10, 226, 440, 92, walnut, 21) + bk(44, 138, 372, 88, olive, 22) + bk(78, 64, 306, 74, shadow, 23), 'books'));
  }
  // ---- shared body shapes ----------------------------------------------------------------------------------
  const head = (cx, cy, rx, ry) => `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
  // ---- standing figure (diagram) -------------------------------------------------------------------------
  {
    const shape = head(130, 66, 44, 50) + rr(112, 112, 36, 30, 10) + rr(58, 132, 144, 232, 44) + rr(26, 150, 34, 200, 17) + rr(200, 150, 34, 200, 17) + rr(70, 350, 58, 270, 26) + rr(132, 350, 58, 270, 26);
    put('figure.svg', wrap(260, 640,
      `<path d="${shape}" fill="${P.ivory}" stroke="${ink}" stroke-width="3.2" stroke-linejoin="round"/>` +
      hatch({ clip: shape, bbox: [0, 0, 260, 640], angle: 52, spacing: 5, width: 1.2, seed: 31, opacity: 0.55 }) +
      hatch({ clip: shape, bbox: [0, 0, 260, 640], angle: 118, spacing: 9, width: 1, seed: 32, opacity: 0.4 }) +
      stipple({ clip: shape, bbox: [0, 0, 260, 640], count: 500, seed: 33, opacity: 0.45 }), 'figure'));
  }
  // ---- bust silhouette (awakening) --------------------------------------------------------------------------
  {
    const shape = head(210, 182, 92, 112) + 'M176 280H244V330Q330 346 372 420Q396 470 400 560H20Q24 470 48 420Q90 346 176 330Z';
    put('silhouette.svg', wrap(420, 560,
      `<path d="${shape}" fill="${ink}" stroke="${ink}" stroke-width="3"/>` +
      hatch({ clip: shape, bbox: [0, 60, 420, 500], angle: 62, spacing: 7, width: 1.3, seed: 41, color: P.parchment, opacity: 0.28 }) +
      `<path d="M130 120Q150 78 214 74" fill="none" stroke="${P.parchment}" stroke-opacity="0.6" stroke-width="2.4" stroke-linecap="round"/>`, 'silhouette'));
  }
  // ---- eye -------------------------------------------------------------------------------------------------
  {
    const almond = 'M20 110Q200 -34 380 110Q200 254 20 110Z';
    let iris = '';
    for (let i = 1; i <= 7; i++) iris += `<circle cx="200" cy="110" r="${i * 9}" fill="none" stroke="${ink}" stroke-width="1.3" stroke-opacity="0.8"/>`;
    for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; iris += `<line x1="${f(200 + Math.cos(a) * 18)}" y1="${f(110 + Math.sin(a) * 18)}" x2="${f(200 + Math.cos(a) * 64)}" y2="${f(110 + Math.sin(a) * 64)}" stroke="${ink}" stroke-width="0.9" stroke-opacity="0.6"/>`; }
    put('eye.svg', wrap(400, 220,
      `<path d="${almond}" fill="${ivory}" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>` +
      hatch({ clip: almond, bbox: [20, 0, 360, 110], angle: 20, spacing: 5, seed: 51, opacity: 0.4 }) +
      `<clipPath id="eyeclip"><path d="${almond}"/></clipPath><g clip-path="url(#eyeclip)"><circle cx="200" cy="110" r="66" fill="${olive}" stroke="${ink}" stroke-width="3"/>${iris}<circle cx="200" cy="110" r="22" fill="${ink}"/><circle cx="188" cy="98" r="7" fill="${ivory}"/></g>`, 'eye'));
  }
}
