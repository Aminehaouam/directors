/** Offscreen canvases at render scale. Scenes draw in logical 1920x1080 units; the base transform maps them to pixels. */
export function makeBuffers(ctx) {
  const pool = {};
  ctx.buffer = (name) => {
    let b = pool[name];
    if (!b) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(ctx.W * ctx.S); canvas.height = Math.round(ctx.H * ctx.S);
      b = pool[name] = { canvas, g: canvas.getContext('2d') };
    }
    b.g.setTransform(1, 0, 0, 1, 0, 0);
    b.g.globalAlpha = 1; b.g.globalCompositeOperation = 'source-over'; b.g.shadowColor = 'transparent'; b.g.filter = 'none';
    b.g.clearRect(0, 0, b.canvas.width, b.canvas.height);
    b.g.setTransform(ctx.S, 0, 0, ctx.S, 0, 0);
    return b;
  };
}
