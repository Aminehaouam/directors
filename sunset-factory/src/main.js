// Frame compositor: window.renderFrame(i) draws frame i (t = i / FPS) onto the canvas.
import { W, H, FPS, DURATION, T, L, camera, sun, belt, oven, lever, crane, craneMotor, roller, jar, night, workers, STARS } from './story.js';
import { prog, E, clamp } from './lib.js';
import { makePaperTexture, Paper } from './paper.js';
import { buildWorker, drawWorker } from './rig.js';
import * as SET from './set.js';

const FINAL_STAR = STARS.filter((q) => q.target[1] > 640).sort((a, b) => Math.abs(a.target[0] - 600) - Math.abs(b.target[0] - 600))[0];

function boot({ scale = 1 } = {}) {
  const canvas = document.getElementById('c');
  canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
  const g = canvas.getContext('2d');
  const P = new Paper(g, makePaperTexture());
  const S = SET.buildSet();
  const WK = { rosie: buildWorker('rosie'), tam: buildWorker('tam'), gus: buildWorker('gus') };
  // integrated machinery spin for the foreground gears
  const spin = [0];
  for (let k = 1; k <= DURATION * 120 + 240; k++) { const t = k / 120; spin.push(spin[k - 1] + (0.12 + 1.6 * craneMotor(t)) / 120); }
  const spinAt = (t) => spin[clamp(Math.round(t * 120), 0, spin.length - 1)];

  function renderFrame(i) {
    const t = i / FPS;
    const cam = camera(t), z = cam.z * scale;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#000'; g.fillRect(0, 0, canvas.width, canvas.height);
    g.setTransform(z, 0, 0, z, (W / 2 - cam.cx * cam.z) * scale, (H / 2 - cam.cy * cam.z) * scale);
    P.z = z;
    const nt = night(t);
    P.grade.set(nt.warm * 0.75, nt.n);
    const s = sun(t), bt = belt(t), ov = oven(t), cr = crane(t), jr = jar(t);
    const rO = roller(t, 'orange'), rP = roller(t, 'pink');
    const ws = workers(t);
    const held = (id) => { const w = ws.find((q) => q.id === id); return w.hold && w.hold.w > 0.5; };

    // --- sky
    SET.drawSky(P, S);
    SET.drawPaint(P, S, rO, rP);
    SET.drawNight(P, S, t, nt);
    SET.drawDots(P, S, t, nt);
    SET.drawStars(P, S, t, 'sky');
    SET.drawTarget(P, t);
    // glow crossfades from the small 'on the belt' halo to the big sky glow while the crane lifts it
    const kSky = E.inOutSine(prog(t, T.hoist[0] + 0.5, T.lower[1]));
    if (kSky > 0 && s.visible) {
      SET.drawGlow(g, s.x, s.y, s.r * 9, '255,190,110', 0.22 * s.glow * kSky);
      SET.drawRays(P, S, s, t);
      SET.drawGlow(g, s.x, s.y, s.r * 4.2, '255,206,110', 0.55 * s.glow * kSky);
    }
    if (s.layer === 'sky' && s.visible) SET.drawSunBody(P, S, s);
    SET.drawClouds(P, S, t, nt.warm);
    SET.drawCraneBack(P, S, t, cr);
    // --- land
    SET.drawHills(P, S, clamp((nt.n - 0.4) * 2));
    SET.drawSmoke(P, t);
    SET.drawBuilding(P, S, t, ov, s, nt.n);
    SET.drawOven(P, S, t, ov, s, s.layer === 'oven' ? () => SET.drawSunBody(P, S, s) : null);
    SET.drawCraneTower(P, S);
    SET.drawFloor(P, S);
    SET.drawBelt(P, S, t, bt, lever(t));
    if (!held('tam')) SET.drawRoller(P, rP, SET.C.magenta);
    if (!held('rosie')) SET.drawRoller(P, rO, SET.C.orange);
    SET.drawBucket(P, S, 345, 1450, SET.C.magenta);
    SET.drawBucket(P, S, 392, 1454, SET.C.orange);
    const halo = 0.5 * s.glow * (1 - kSky) * E.inOutSine(prog(t, T.sunOut[0], T.sunOut[1]));
    if (halo > 0) SET.drawGlow(g, s.x, s.y, s.r * 2.8, '255,196,90', halo);
    if (s.layer === 'stage') SET.drawSunBody(P, S, s);
    SET.drawHook(P, S, t, cr);
    // --- workers, back to front (kept a little brighter than the set at night so faces stay readable)
    P.grade.set(nt.warm * 0.75, nt.n * 0.62);
    for (const w of [...ws].sort((a, b) => a.y - b.y)) {
      const r = w.hold && w.hold.w > 0.5 ? (w.hold.key === 'orange' ? rO : rP) : null;
      drawWorker(P, WK[w.id], w, r ? () => SET.drawRoller(P, r, r.key === 'orange' ? SET.C.orange : SET.C.magenta) : null);
    }
    P.grade.set(nt.warm * 0.75, nt.n * 0.85);
    const launched = STARS.filter((q) => t >= q.launch).length;
    SET.drawCrate(P, S, jr);
    SET.drawJar(P, S, t, jr, 16 * (1 - launched / STARS.length) * (jr.open ? 0 : 1));
    // --- foreground
    P.grade.set(nt.warm * 0.75, nt.n);
    P.fill(S.lip, SET.C.lip, 3, 0.8);
    P.fill(S.lipHi, SET.C.lipHi, 0, 0.5);
    SET.drawMachineRoom(P, S, t, bt.gear * 0.2 + spinAt(t), clamp(0.15 + 0.6 * Math.max(bt.run, craneMotor(t)) + 0.04 * Math.sin(t * 13)));
    SET.drawStars(P, S, t, 'air');
    // closing twinkle as they smile
    const tw = Math.sin(Math.PI * prog(t, 19.42, 19.95));
    if (tw > 0) { const q = FINAL_STAR.target; SET.drawGlow(g, q[0], q[1], 90, '255,236,180', 0.6 * tw); SET.sparkle(g, q[0], q[1], 70 * tw, tw, 0.2); }
    SET.drawPopBurst(P, t);

    // --- light, in screen space
    g.setTransform(scale, 0, 0, scale, 0, 0);
    if (nt.warm > 0) {
      g.save(); g.globalCompositeOperation = 'soft-light';
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, `rgba(255,120,150,${0.35 * nt.warm})`); gr.addColorStop(0.5, `rgba(255,160,80,${0.3 * nt.warm})`); gr.addColorStop(1, `rgba(255,140,60,${0.2 * nt.warm})`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
    }
    g.save(); g.globalCompositeOperation = 'multiply';
    const vg = g.createRadialGradient(W / 2, H * 0.48, W * 0.35, W / 2, H * 0.48, H * 0.75);
    vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, `rgba(${Math.round(120 - 60 * nt.n)},${Math.round(80 - 30 * nt.n)},${Math.round(110 + 10 * nt.n)},0.55)`);
    g.fillStyle = vg; g.fillRect(0, 0, W, H); g.restore();
  }
  return { info: { frames: Math.round(DURATION * FPS), fps: FPS, w: canvas.width, h: canvas.height }, renderFrame, grab: () => canvas.toDataURL('image/png') };
}

const q = new URLSearchParams(location.search);
try {
  const api = boot({ scale: parseFloat(q.get('scale') || '1') });
  Object.assign(window, api);
  window.__ready = { ok: true, info: api.info };
} catch (e) {
  window.__ready = { ok: false, error: `${e && e.stack ? e.stack : e}` };
}
