// Animation controller for parrot.svg. Targets the SVG's own named groups and
// reads each group's pivot from its data-pivot="x y" attribute (viewBox units).
// Transforms are layered with composite:"add", so animations combine without fighting.

const EASE = 'cubic-bezier(.45,0,.55,1)';

export function createCoco(svg) {
  const $ = (id) => svg.querySelector('#' + id);
  const part = {};
  for (const id of [
    'parrot', 'shadow', 'tail', 'body', 'head', 'left-wing', 'right-wing', 'upper-beak', 'lower-beak', 'mouth',
    'left-eyelid', 'right-eyelid', 'left-pupil', 'right-pupil',
  ]) {
    const el = $(id);
    if (!el) throw new Error(`parrot.svg is missing #${id}`);
    const pivot = el.dataset.pivot;
    el.style.transformBox = 'view-box';
    if (pivot) el.style.transformOrigin = pivot.split(' ').map((n) => n + 'px').join(' ');
    part[id] = el;
  }

  const active = new Map(); // name -> Animation[]
  let paused = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const go = (el, frames, opts) =>
    el.animate(frames, { duration: 1000, easing: 'linear', iterations: Infinity, composite: 'add', ...opts });
  const T = (t) => ({ transform: t });
  // Easing is applied between keyframes (not across the whole timeline) so offsets stay meaningful.
const keys = (list, offsets, easing = EASE) =>
  list.map((t, i) => ({ ...T(t), easing, ...(offsets ? { offset: offsets[i] } : {}) }));

  const builders = {
    idle() {
      const a = [];
      a.push(go(part.body, keys(['scale(1,1)', 'scale(1.012,1.026)', 'scale(1,1)']), { duration: 3600 }));
      a.push(go(part.head, keys(['translateY(0)', 'translateY(-2px) rotate(.6deg)', 'translateY(0)']), { duration: 3600 }));
      a.push(go(part.parrot, keys(['translateX(0)', 'translateX(2px)', 'translateX(0)', 'translateX(-2px)', 'translateX(0)']), { duration: 7200 }));
      a.push(go(part.tail, keys(['rotate(-1.5deg)', 'rotate(1.5deg)', 'rotate(-1.5deg)']), { duration: 4400 }));
      a.push(go(part['left-wing'], keys(['rotate(0)', 'rotate(1.5deg)', 'rotate(0)']), { duration: 3600 }));
      a.push(go(part['right-wing'], keys(['rotate(0)', 'rotate(-1.5deg)', 'rotate(0)']), { duration: 3600 }));
      // Blink (+ an occasional quick double blink), composited multiplicatively on scaleY.
      for (const id of ['left-eyelid', 'right-eyelid']) {
        a.push(go(part[id], keys(['scaleY(0)', 'scaleY(0)', 'scaleY(1)', 'scaleY(0)', 'scaleY(0)', 'scaleY(1)', 'scaleY(0)', 'scaleY(0)'],
          [0, .9, .925, .95, .965, .98, .995, 1], 'ease-in-out'), { duration: 5200, composite: 'replace' }));
      }
      return a;
    },
    look() {
      const swing = [0, -9, -9, 0, 9, 9, 0];
      const off = [0, .18, .3, .5, .68, .82, 1];
      const a = [go(part.head, keys(swing.map((d) => `rotate(${d}deg)`), off), { duration: 5200 })];
      for (const id of ['left-pupil', 'right-pupil']) {
        a.push(go(part[id], keys(swing.map((d) => `translate(${d * 0.38}px,0)`), off), { duration: 5200 }));
      }
      return a;
    },
    talk() {
      const open = [0, 14, 5, 21, 4, 13, 0, 0];
      const off = [0, .12, .22, .36, .46, .6, .72, 1];
      return [
        go(part['lower-beak'], keys(open.map((y) => `translateY(${y}px) scaleY(${1 + y * 0.006})`), off), { duration: 1500 }),
        go(part.mouth, keys(open.map((y) => `translateY(${y * 0.6}px) scaleY(${1 + y * 0.03})`), off), { duration: 1500 }),
        go(part['upper-beak'], keys(open.map((y) => `translateY(${-y * 0.18}px)`), off), { duration: 1500 }),
        go(part.head, keys(open.map((y) => `rotate(${-y * 0.16}deg)`), off), { duration: 1500 }),
      ];
    },
    flap() {
      const w = (sign) => keys(
        ['rotate(0)', `rotate(${sign * 34}deg)`, 'rotate(0)', `rotate(${sign * 30}deg)`, 'rotate(0)', 'rotate(0)'],
        [0, .16, .32, .48, .64, 1]);
      return [
        go(part['left-wing'], w(1), { duration: 1800 }),
        go(part['right-wing'], w(-1), { duration: 1800 }),
        go(part.body, keys(['scale(1)', 'scale(1.01,.99)', 'scale(1)'], undefined), { duration: 900 }),
      ];
    },
    celebrate() {
      const d = 1000;
      const wing = (s) => keys(['rotate(0)', `rotate(${s * 38}deg)`, 'rotate(0)'], [0, .5, 1]);
      return [
        go(part.parrot, keys(['translateY(0)', 'translateY(2px)', 'translateY(-20px)', 'translateY(0)'], [0, .12, .55, 1]), { duration: d }),
        go(part.body, keys(['scale(1,1)', 'scale(1.04,.96)', 'scale(.98,1.04)', 'scale(1,1)'], [0, .12, .55, 1]), { duration: d }),
        go(part['left-wing'], wing(1), { duration: d }),
        go(part['right-wing'], wing(-1), { duration: d }),
        go(part.tail, keys(['rotate(-7deg)', 'rotate(7deg)', 'rotate(-7deg)'], [0, .5, 1]), { duration: d }),
        go(part.head, keys(['rotate(-3deg)', 'rotate(3deg) translateY(-2px)', 'rotate(-3deg)'], [0, .5, 1]), { duration: d }),
        go(part.shadow, keys(['scale(1)', 'scale(.82)', 'scale(1)'], [0, .55, 1]), { duration: d, composite: 'replace' }),
      ];
    },
    curious() {
      const f = { duration: 900, iterations: 1, fill: 'forwards', easing: 'cubic-bezier(.3,.7,.3,1)' };
      return [
        go(part.head, [T('rotate(0)'), T('rotate(-13deg) translate(-3px,1px)')], f),
        go(part['left-pupil'], [T('translate(0,0) scale(1)'), T('translate(-3px,-3px) scale(1.18)')], f),
        go(part['right-pupil'], [T('translate(0,0) scale(1)'), T('translate(-3px,-3px) scale(1.18)')], f),
        go(part['upper-beak'], [T('rotate(0)'), T('rotate(-2deg)')], f),
      ];
    },
  };

  function start(name) {
    if (active.has(name) || !builders[name]) return;
    const anims = builders[name]();
    if (paused) anims.forEach((a) => a.pause());
    active.set(name, anims);
  }
  function stop(name) {
    const anims = active.get(name);
    if (!anims) return;
    // Ease parts back to rest rather than snapping.
    anims.forEach((a) => a.cancel());
    active.delete(name);
  }

  return {
    names: Object.keys(builders),
    isActive: (n) => active.has(n),
    start, stop,
    toggle(n) { active.has(n) ? stop(n) : start(n); return active.has(n); },
    get paused() { return paused; },
    pause() { paused = true; active.forEach((l) => l.forEach((a) => a.pause())); },
    resume() { paused = false; active.forEach((l) => l.forEach((a) => a.play())); },
    reset() { [...active.keys()].forEach(stop); paused = false; if (!reduced) start('idle'); },
    reduced,
  };
}
