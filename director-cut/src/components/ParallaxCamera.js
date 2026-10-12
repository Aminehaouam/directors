// One camera move, applied to each layer at its own factor: back 0.6x, mid 1.0x, front 1.4x of the move.
export class ParallaxCamera {
  constructor(ctx, ax, ay) { this.ctx = ctx; this.ax = ax ?? ctx.W / 2; this.ay = ay ?? ctx.H / 2; this.zoom = 1; this.px = 0; this.py = 0; }
  set(zoom, px = 0, py = 0) { this.zoom = zoom; this.px = px; this.py = py; return this; }
  factor(name) { return typeof name === 'number' ? name : this.ctx.cfg.motion.parallax[name]; }
  apply(g, layer = 'mid') {
    const k = this.factor(layer), s = 1 + (this.zoom - 1) * k;
    g.translate(this.ax, this.ay); g.scale(s, s); g.translate(-this.ax + this.px * k, -this.ay + this.py * k);
  }
  /** Where a world point lands on screen for a layer. */
  project(x, y, layer = 'mid') {
    const k = this.factor(layer), s = 1 + (this.zoom - 1) * k;
    return [this.ax + (x - this.ax + this.px * k) * s, this.ay + (y - this.ay + this.py * k) * s];
  }
  /** A camera move over [t0,t1] with the camera easing (never linear). */
  static move(ctx, t, t0, t1, z0, z1) { const p = ctx.easeFns.camera(Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))); return z0 + (z1 - z0) * p; }
}
