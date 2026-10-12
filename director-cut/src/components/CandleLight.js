import { noise1 } from '../animations/rng.js';
import { setShadow, clearShadow } from './util.js';

/** Deterministic flicker: a sine sum plus seeded value noise. Never live random. */
export function flicker(t, seed = 3, amount = 1) {
  return 1 + amount * (0.045 * Math.sin(t * 7.3 + seed) + 0.03 * Math.sin(t * 13.9 + seed * 1.7) + 0.07 * (noise1(t * 8.5, seed) - 0.5));
}

/** Warm light pool + a small flame and thin smoke wisps (lines, not particles). */
export function candleLight(ctx, g, { x, y, r = 700, t, intensity = 0.4, seed = 3, amount = 1, flame = true, smoke = true, flameScale = 1 }) {
  const f = flicker(t, seed, amount);
  g.save();
  g.globalCompositeOperation = 'screen';
  const gr = g.createRadialGradient(x, y, 4, x, y, r * (0.96 + 0.04 * f));
  gr.addColorStop(0, `rgba(255,214,150,${intensity * f})`); gr.addColorStop(0.35, `rgba(214,160,90,${intensity * 0.45 * f})`); gr.addColorStop(1, 'rgba(120,70,30,0)');
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
  if (smoke) {
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      const ph = i * 2.1 + seed;
      for (let s = 0; s <= 40; s++) {
        const u = s / 40, sx = x + (noise1(u * 3 + t * 0.35 + ph, seed + i) - 0.5) * 70 * u + Math.sin(u * 5 + t * 0.8 + ph) * 12 * u;
        const sy = y - 24 - u * 230;
        s ? g.lineTo(sx, sy) : g.moveTo(sx, sy);
      }
      g.strokeStyle = `rgba(244,233,210,${0.10 - i * 0.02})`; g.lineWidth = 2.4 - i * 0.5; g.stroke();
    }
    g.restore();
  }
  if (flame) {
    const sway = (noise1(t * 6, seed + 9) - 0.5) * 5, hgt = 34 * flameScale * (0.94 + 0.1 * f);
    g.save(); g.translate(x, y);
    const fg = g.createLinearGradient(0, -hgt, 0, 6);
    fg.addColorStop(0, 'rgba(173,135,80,0.0)'); fg.addColorStop(0.3, 'rgba(240,200,130,0.95)'); fg.addColorStop(1, 'rgba(244,233,210,1)');
    g.fillStyle = fg;
    g.beginPath(); g.moveTo(0, 4); g.bezierCurveTo(-13 * flameScale, -4, -9 * flameScale + sway * 0.2, -hgt * 0.6, sway, -hgt); g.bezierCurveTo(9 * flameScale + sway * 0.2, -hgt * 0.6, 13 * flameScale, -4, 0, 4); g.fill();
    g.restore();
  }
}
