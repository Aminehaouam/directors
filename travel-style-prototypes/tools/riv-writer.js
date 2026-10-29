// Minimal .riv (Rive runtime format v7) encoder.
//
// Rive's editor is a GUI app with no headless authoring CLI, so the Rive
// source files for these prototypes are produced programmatically. The
// property/type keys come from rive-runtime's generated headers
// (tools/rive-defs.json, extracted by tools/extract-defs.js) so the output is
// the same binary format the official runtimes load.
'use strict';
const defs = require('./rive-defs.json');

// ---------------------------------------------------------------- encoding --
class ByteWriter {
  constructor() { this.buf = Buffer.alloc(1 << 16); this.len = 0; }
  ensure(n) {
    if (this.len + n <= this.buf.length) return;
    let size = this.buf.length * 2;
    while (size < this.len + n) size *= 2;
    const b = Buffer.alloc(size); this.buf.copy(b, 0, 0, this.len); this.buf = b;
  }
  byte(v) { this.ensure(1); this.buf[this.len++] = v & 0xff; }
  varuint(v) {
    v = Math.floor(v);
    if (v < 0) throw new Error('negative varuint ' + v);
    do { let b = v % 128; v = Math.floor(v / 128); if (v > 0) b |= 0x80; this.byte(b); } while (v > 0);
  }
  float(v) { this.ensure(4); this.buf.writeFloatLE(v, this.len); this.len += 4; }
  uint32(v) { this.ensure(4); this.buf.writeUInt32LE(v >>> 0, this.len); this.len += 4; }
  string(s) { const b = Buffer.from(s, 'utf8'); this.varuint(b.length); this.ensure(b.length); b.copy(this.buf, this.len); this.len += b.length; }
  bytes(b) { this.varuint(b.length); this.ensure(b.length); Buffer.from(b).copy(this.buf, this.len); this.len += b.length; }
  result() { return this.buf.subarray(0, this.len); }
}

// Resolve a property name for a class by walking its inheritance chain.
const propCache = {};
function prop(cls, name) {
  const ck = cls + '.' + name;
  if (propCache[ck]) return propCache[ck];
  let c = cls;
  while (c && defs[c]) {
    if (defs[c].props[name]) return (propCache[ck] = defs[c].props[name]);
    c = defs[c].super;
  }
  throw new Error(`Unknown property ${name} on ${cls}`);
}
function typeKey(cls) {
  if (!defs[cls] || defs[cls].typeKey == null) throw new Error('Unknown class ' + cls);
  return defs[cls].typeKey;
}
function writeValue(w, type, v) {
  switch (type) {
    case 'CoreDoubleType': w.float(v); break;
    case 'CoreUintType': case 'CoreIdType': w.varuint(v); break;
    case 'CoreIntType': w.varuint(v >= 0 ? v * 2 : -v * 2 - 1); break;
    case 'CoreBoolType': w.byte(v ? 1 : 0); break;
    case 'CoreStringType': w.string(v); break;
    case 'CoreColorType': w.uint32(v); break;
    case 'CoreBytesType': w.bytes(v); break;
    default: throw new Error('Unsupported field type ' + type);
  }
}
function writeObject(w, cls, props) {
  w.varuint(typeKey(cls));
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null) continue;
    const p = prop(cls, k);
    w.varuint(p.key);
    writeValue(w, p.type, typeof v === 'function' ? v() : v);
  }
  w.varuint(0);
}

// ------------------------------------------------------------------ colors --
function color(hex, alpha = 1) {
  if (typeof hex === 'number') return hex >>> 0;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  let a = Math.round(alpha * 255);
  if (h.length === 8) { a = Math.round(parseInt(h.slice(6, 8), 16) * alpha); h = h.slice(0, 6); }
  return ((a << 24) | parseInt(h, 16)) >>> 0;
}

// ------------------------------------------------------------- path parsing --
// Accepts an array of commands: ['M',x,y] ['L',x,y] ['C',x1,y1,x2,y2,x,y]
// ['Q',x1,y1,x,y] ['Z'] — or an SVG path string with absolute commands.
function parseSvgPath(d) {
  const toks = d.match(/[MLCQZHVmlcqzhv]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
  const out = []; let i = 0, cmd = null, cx = 0, cy = 0;
  const num = () => parseFloat(toks[i++]);
  while (i < toks.length) {
    if (/[A-Za-z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase(); const C = cmd.toUpperCase();
    const ox = rel ? cx : 0, oy = rel ? cy : 0;
    if (C === 'Z') { out.push(['Z']); continue; }
    if (C === 'M') { cx = ox + num(); cy = oy + num(); out.push(['M', cx, cy]); cmd = rel ? 'l' : 'L'; }
    else if (C === 'L') { cx = ox + num(); cy = oy + num(); out.push(['L', cx, cy]); }
    else if (C === 'H') { cx = ox + num(); out.push(['L', cx, cy]); }
    else if (C === 'V') { cy = oy + num(); out.push(['L', cx, cy]); }
    else if (C === 'C') { const a = [ox + num(), oy + num(), ox + num(), oy + num(), ox + num(), oy + num()]; cx = a[4]; cy = a[5]; out.push(['C', ...a]); }
    else if (C === 'Q') { const a = [ox + num(), oy + num(), ox + num(), oy + num()]; cx = a[2]; cy = a[3]; out.push(['Q', ...a]); }
    else throw new Error('bad path cmd ' + cmd);
  }
  return out;
}

// Split commands into subpaths of Rive vertices.
function toContours(cmds) {
  if (typeof cmds === 'string') cmds = parseSvgPath(cmds);
  const contours = []; let cur = null; let px = 0, py = 0;
  const start = (x, y) => { cur = { closed: false, verts: [{ x, y, ix: x, iy: y, ox: x, oy: y }] }; contours.push(cur); px = x; py = y; };
  for (const c of cmds) {
    if (c[0] === 'M') start(c[1], c[2]);
    else if (c[0] === 'L') { if (!cur) start(px, py); cur.verts.push({ x: c[1], y: c[2], ix: c[1], iy: c[2], ox: c[1], oy: c[2] }); px = c[1]; py = c[2]; }
    else if (c[0] === 'C' || c[0] === 'Q') {
      if (!cur) start(px, py);
      let x1, y1, x2, y2, x, y;
      if (c[0] === 'Q') { x = c[3]; y = c[4]; x1 = px + (2 / 3) * (c[1] - px); y1 = py + (2 / 3) * (c[2] - py); x2 = x + (2 / 3) * (c[1] - x); y2 = y + (2 / 3) * (c[2] - y); }
      else { [x1, y1, x2, y2, x, y] = c.slice(1); }
      const last = cur.verts[cur.verts.length - 1]; last.ox = x1; last.oy = y1;
      cur.verts.push({ x, y, ix: x2, iy: y2, ox: x, oy: y }); px = x; py = y;
    } else if (c[0] === 'Z') {
      if (!cur) continue;
      cur.closed = true;
      const v = cur.verts; const f = v[0], l = v[v.length - 1];
      if (v.length > 1 && Math.abs(f.x - l.x) < 1e-3 && Math.abs(f.y - l.y) < 1e-3) { f.ix = l.ix; f.iy = l.iy; v.pop(); }
      px = f.x; py = f.y; cur = null;
    }
  }
  return contours.filter((c) => c.verts.length > 1);
}

// --------------------------------------------------------------- artboards --
class Artboard {
  constructor(file, name, opts) {
    this.file = file; this.name = name; this.objects = []; this.animations = []; this.stateMachines = []; this.byName = {};
    this.root = { cls: 'Artboard', idx: 0, props: { name, width: opts.width, height: opts.height, originX: 0, originY: 0, clip: opts.clip !== false, x: 0, y: 0 } };
    this.objects.push(this.root);
    this.interps = []; this.interpKeys = {};
  }
  add(cls, parent, props = {}) {
    const o = { cls, idx: this.objects.length, props: { ...props } };
    o.props.parentId = parent ? parent.idx : 0;
    this.objects.push(o);
    if (props.name) this.byName[props.name] = o;
    return o;
  }
  node(name, parent, t = {}) { return this.add('Node', parent, { name, ...tf(t) }); }
  shape(name, parent, t = {}) { return this.add('Shape', parent, { name, ...tf(t), blendModeValue: t.blend }); }
  // Adds one PointsPath per contour of `cmds` to `shape`.
  path(shape, cmds, name) {
    const out = [];
    for (const c of toContours(cmds)) {
      const p = this.add('PointsPath', shape, { name, isClosed: c.closed });
      for (const v of c.verts) {
        const hasIn = Math.hypot(v.ix - v.x, v.iy - v.y) > 1e-3, hasOut = Math.hypot(v.ox - v.x, v.oy - v.y) > 1e-3;
        if (!hasIn && !hasOut) this.add('StraightVertex', p, { x: v.x, y: v.y, radius: 0 });
        else this.add('CubicDetachedVertex', p, {
          x: v.x, y: v.y,
          inRotation: hasIn ? Math.atan2(v.iy - v.y, v.ix - v.x) : Math.atan2(v.oy - v.y, v.ox - v.x) + Math.PI,
          inDistance: Math.hypot(v.ix - v.x, v.iy - v.y),
          outRotation: hasOut ? Math.atan2(v.oy - v.y, v.ox - v.x) : Math.atan2(v.iy - v.y, v.ix - v.x) + Math.PI,
          outDistance: Math.hypot(v.ox - v.x, v.oy - v.y),
        });
      }
      out.push(p);
    }
    return out;
  }
  rect(shape, x, y, w, h, r = 0, name) {
    return this.add('Rectangle', shape, { name, x: x + w / 2, y: y + h / 2, width: w, height: h, cornerRadiusTL: r, cornerRadiusTR: r, cornerRadiusBL: r, cornerRadiusBR: r, linkCornerRadius: true, originX: 0.5, originY: 0.5 });
  }
  ellipse(shape, cx, cy, w, h, name) { return this.add('Ellipse', shape, { name, x: cx, y: cy, width: w, height: h, originX: 0.5, originY: 0.5 }); }
  // paint: '#hex' | {hex, a} | {linear:[x0,y0,x1,y1], stops:[[pos,'#hex',a],...]} | {radial:[cx,cy,r], stops}
  fill(shape, paint, opts = {}) {
    const f = this.add('Fill', shape, { name: opts.name, fillRule: opts.evenOdd ? 1 : 0, isVisible: true, blendModeValue: opts.blend });
    this.paint(f, paint);
    return f;
  }
  stroke(shape, paint, thickness, opts = {}) {
    const s = this.add('Stroke', shape, { name: opts.name, thickness, cap: opts.cap ?? 1, join: opts.join ?? 1, transformAffectsStroke: true, isVisible: true });
    this.paint(s, paint);
    if (opts.trim) s.trim = this.add('TrimPath', s, { name: opts.trim.name, start: opts.trim.start ?? 0, end: opts.trim.end ?? 1, offset: 0, modeValue: 1 });
    if (opts.dash) {
      const dp = this.add('DashPath', s, { offset: 0, offsetIsPercentage: false });
      for (const len of opts.dash) this.add('Dash', dp, { length: len, lengthIsPercentage: false });
    }
    return s;
  }
  paint(owner, paint) {
    if (typeof paint === 'string' || typeof paint === 'number') return (owner.color = this.add('SolidColor', owner, { colorValue: color(paint) }));
    if (paint.hex) return (owner.color = this.add('SolidColor', owner, { name: paint.name, colorValue: color(paint.hex, paint.a ?? 1) }));
    const radial = !!paint.radial;
    const g = radial
      ? this.add('RadialGradient', owner, { startX: paint.radial[0], startY: paint.radial[1], endX: paint.radial[0] + paint.radial[2], endY: paint.radial[1], opacity: 1 })
      : this.add('LinearGradient', owner, { startX: paint.linear[0], startY: paint.linear[1], endX: paint.linear[2], endY: paint.linear[3], opacity: 1 });
    for (const [pos, hex, a] of paint.stops) this.add('GradientStop', g, { position: pos, colorValue: color(hex, a ?? 1) });
    return g;
  }
  clip(target, source) { return this.add('ClippingShape', target, { sourceId: source.idx, fillRule: 0, isVisible: true }); }

  interpolator(ease) {
    const k = ease.join(',');
    if (this.interpKeys[k] === undefined) { this.interpKeys[k] = this.interps.length; this.interps.push(ease); }
    return this.interpKeys[k];
  }
  animation(name, { fps = 60, duration, loop = 'oneShot' }) {
    const a = new Animation(this, name, fps, duration, { oneShot: 0, loop: 1, pingPong: 2 }[loop]);
    this.animations.push(a);
    return a;
  }
  stateMachine(name) { const sm = new StateMachine(this, name); this.stateMachines.push(sm); return sm; }

  serialize(w) {
    const nComp = this.objects.length;
    for (const a of this.animations) a.collectInterpolators();
    // Rive draws objects that come earlier in the file on top. The art code is
    // authored painter-style (later = on top), so emit Node/Shape siblings in
    // reverse, depth-first, and remap every id to the new slot.
    const kids = new Map(this.objects.map((o) => [o, []]));
    for (const o of this.objects.slice(1)) kids.get(this.objects[o.props.parentId]).push(o);
    const order = [];
    const isNode = (o) => o.cls === 'Node' || o.cls === 'Shape';
    const visit = (o) => {
      order.push(o);
      const c = kids.get(o);
      const nodes = c.filter(isNode).reverse();
      for (const k of c.filter((k) => !isNode(k))) visit(k);
      for (const k of nodes) visit(k);
    };
    visit(this.root);
    order.forEach((o, i) => { o.newIdx = i; });
    for (const o of order) {
      const props = { ...o.props };
      if (o !== this.root) props.parentId = this.objects[o.props.parentId].newIdx;
      else delete props.parentId;
      if (props.sourceId !== undefined) props.sourceId = this.objects[props.sourceId].newIdx;
      writeObject(w, o.cls, props);
    }
    for (const e of this.interps) writeObject(w, 'CubicEaseInterpolator', { x1: e[0], y1: e[1], x2: e[2], y2: e[3] });
    for (const a of this.animations) a.serialize(w, nComp);
    for (const sm of this.stateMachines) sm.serialize(w);
  }
}

function tf(t) {
  return { x: t.x, y: t.y, rotation: t.rotation, scaleX: t.scaleX ?? t.scale, scaleY: t.scaleY ?? t.scale, opacity: t.opacity };
}

// Easing presets (cubic-bezier control points).
const EASE = {
  linear: null,
  inOut: [0.42, 0, 0.58, 1],
  out: [0.16, 1, 0.3, 1],          // expo-ish out
  outSoft: [0.25, 0.8, 0.35, 1],
  in: [0.55, 0, 0.85, 0.35],
  inOutSoft: [0.65, 0, 0.35, 1],
  outBack: [0.34, 1.45, 0.64, 1],  // overshoot
  outBackSmall: [0.3, 1.25, 0.6, 1],
  hold: 'hold',
};

class Animation {
  constructor(ab, name, fps, duration, loop) { Object.assign(this, { ab, name, fps, duration, loop }); this.tracks = []; }
  // keys: [[timeSeconds, value, easeName?], ...]; ease applies to the segment leaving that key.
  key(obj, propName, keys) {
    if (!obj) throw new Error(`key(${propName}) on missing object in ${this.name}`);
    let p;
    if (propName === 'vx') p = prop('Vertex', 'x'); else if (propName === 'vy') p = prop('Vertex', 'y');
    else if (propName === 'dashOffset') p = prop('DashPath', 'offset');
    else p = prop(obj.cls, propName);
    this.tracks.push({ obj, p, isColor: propName === 'colorValue', keys });
    return this;
  }
  collectInterpolators() {
    for (const t of this.tracks) for (const [, , e = 'inOut'] of t.keys) {
      const ease = EASE[e] !== undefined ? EASE[e] : e;
      if (Array.isArray(ease)) this.ab.interpolator(ease);
    }
  }
  serialize(w, nComp) {
    writeObject(w, 'LinearAnimation', { name: this.name, fps: this.fps, duration: Math.round(this.duration * this.fps), speed: 1, loopValue: this.loop });
    const byObj = new Map();
    for (const t of this.tracks) { if (!byObj.has(t.obj)) byObj.set(t.obj, []); byObj.get(t.obj).push(t); }
    for (const [obj, tracks] of byObj) {
      writeObject(w, 'KeyedObject', { objectId: obj.newIdx });
      for (const t of tracks) {
        writeObject(w, 'KeyedProperty', { propertyKey: t.p.key });
        const keys = [...t.keys].sort((a, b) => a[0] - b[0]);
        for (const [time, value, easeName = 'inOut'] of keys) {
          const ease = EASE[easeName] !== undefined ? EASE[easeName] : easeName;
          const props = { frame: Math.round(time * this.fps), value: t.isColor ? color(value) : value };
          if (ease === 'hold') props.interpolationType = 0;
          else if (ease === null) props.interpolationType = 1;
          else { props.interpolationType = 2; props.interpolatorId = nComp + this.ab.interpolator(ease); }
          writeObject(w, t.isColor ? 'KeyFrameColor' : 'KeyFrameDouble', props);
        }
      }
    }
  }
}

class StateMachine {
  constructor(ab, name) { this.ab = ab; this.name = name; this.inputs = []; this.layers = []; }
  trigger(name) { const i = { cls: 'StateMachineTrigger', name, idx: this.inputs.length }; this.inputs.push(i); return i; }
  bool(name, value = false) { const i = { cls: 'StateMachineBool', name, value, idx: this.inputs.length }; this.inputs.push(i); return i; }
  number(name, value = 0) { const i = { cls: 'StateMachineNumber', name, value, idx: this.inputs.length }; this.inputs.push(i); return i; }
  layer(name) {
    const L = { name, states: [] };
    const addState = (cls, extra = {}) => { const s = { cls, idx: L.states.length, transitions: [], ...extra }; L.states.push(s); return s; };
    L.entry = addState('EntryState'); L.any = addState('AnyState'); L.exit = addState('ExitState');
    L.anim = (animation, opts = {}) => addState('AnimationState', { animation, speed: opts.speed });
    // opts: {trigger, bool:[input, value], exitTime: 0..1 (fraction of the anim), mix: ms}
    L.transition = (from, to, opts = {}) => { from.transitions.push({ to, ...opts }); };
    this.layers.push(L);
    return L;
  }
  serialize(w) {
    writeObject(w, 'StateMachine', { name: this.name });
    for (const i of this.inputs) writeObject(w, i.cls, { name: i.name, ...(i.cls === 'StateMachineTrigger' ? {} : { value: i.value }) });
    for (const L of this.layers) {
      writeObject(w, 'StateMachineLayer', { name: L.name });
      for (const s of L.states) {
        if (s.cls === 'AnimationState') writeObject(w, 'AnimationState', { animationId: this.ab.animations.indexOf(s.animation), speed: s.speed });
        else writeObject(w, s.cls, {});
        for (const t of s.transitions) {
          let flags = 0;
          if (t.exitTime !== undefined) flags |= 4 | 8; // EnableExitTime | ExitTimeIsPercentage
          writeObject(w, 'StateTransition', { stateToId: t.to.idx, flags, duration: t.mix ?? 0, exitTime: t.exitTime !== undefined ? Math.round(t.exitTime * 100) : undefined });
          if (t.trigger) writeObject(w, 'TransitionTriggerCondition', { inputId: t.trigger.idx });
          if (t.bool) writeObject(w, 'TransitionBoolCondition', { inputId: t.bool[0].idx, opValue: t.bool[1] ? 0 : 1 });
        }
      }
    }
  }
}

class RivFile {
  constructor() { this.artboards = []; }
  artboard(name, opts) { const a = new Artboard(this, name, opts); this.artboards.push(a); return a; }
  toBuffer() {
    const w = new ByteWriter();
    for (const c of 'RIVE') w.byte(c.charCodeAt(0));
    w.varuint(7); w.varuint(0); w.varuint(0); // major, minor, file id
    w.varuint(0);                              // empty property ToC (all keys are known to the runtime)
    writeObject(w, 'Backboard', {});
    for (const a of this.artboards) a.serialize(w);
    return w.result();
  }
}

module.exports = { RivFile, color, EASE, parseSvgPath, toContours };
