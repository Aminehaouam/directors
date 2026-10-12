/** Candlelit-shadow vignette. strength 0..1. */
export function drawVignette(ctx, g, strength = 0.7, inner = 0.42) {
  const { W, H } = ctx, r = Math.hypot(W, H) / 2;
  const gr = g.createRadialGradient(W / 2, H / 2, r * inner, W / 2, H / 2, r);
  gr.addColorStop(0, 'rgba(33,24,18,0)'); gr.addColorStop(1, `rgba(33,24,18,${strength})`);
  g.save(); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
}
