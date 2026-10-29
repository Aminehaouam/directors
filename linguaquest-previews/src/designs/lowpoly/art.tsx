/**
 * Low-poly kit. Every piece is parametric: facets are generated from a few
 * anchor points and shaded with a light-from-top-left rule (left/top facets
 * lighter, right/bottom darker). Compose scenes from these instead of
 * hand-placing hundreds of polygons.
 */
import type { ReactNode } from 'react';

type Pt = [number, number];
const pts = (p: Pt[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export function Facet({ p, f, o }: { p: Pt[]; f: string; o?: number }) {
  return <polygon points={pts(p)} fill={f} opacity={o} />;
}

export const LP = {
  ink: '#1d2b36',
  slate: '#1c2b3a',
  cream: '#f6eedc',
  orange: '#e0894b',
  orangeLight: '#f2a66b',
  orangeDark: '#b8652c',
  grass: ['#8cc56b', '#79b85e', '#6aa955', '#5d9c4c', '#72b25a', '#84c066'],
  rock: ['#a86c43', '#8a5535', '#9c6240', '#7a4a2e', '#6e4129'],
} as const;

/* --- Terrain ---------------------------------------------------------------- */

export function Mountain({
  x,
  y,
  w,
  h,
  peak = 0.48,
  light,
  dark,
  snow = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  peak?: number;
  light: string;
  dark: string;
  snow?: boolean;
}) {
  const L: Pt = [x, y];
  const R: Pt = [x + w, y];
  const P: Pt = [x + w * peak, y - h];
  const M: Pt = [x + w * (peak + 0.08), y];
  const cap = 0.3;
  return (
    <g>
      <Facet p={[L, P, M]} f={light} />
      <Facet p={[P, R, M]} f={dark} />
      {snow && (
        <>
          <Facet p={[P, lerp(P, L, cap), lerp(P, lerp(L, M, 0.5), cap * 0.8), lerp(P, M, cap * 1.1)]} f="#f4f1ea" />
          <Facet p={[P, lerp(P, M, cap * 1.1), lerp(P, lerp(M, R, 0.5), cap * 0.75), lerp(P, R, cap)]} f="#d6dbe4" />
        </>
      )}
    </g>
  );
}

export function Pine({ x, y, s = 1, tone = 0 }: { x: number; y: number; s?: number; tone?: 0 | 1 }) {
  const c = tone ? ['#5bb36a', '#2f7d4f', '#6cc27a', '#3e9a5c'] : ['#3e9a5c', '#24603c', '#4fae66', '#2f7d4f'];
  const k = (dx: number, dy: number): Pt => [x + dx * s, y + dy * s];
  return (
    <g>
      <rect x={x - 1.6 * s} y={y - 6 * s} width={3.2 * s} height={6 * s} fill="#7a4a2b" />
      <Facet p={[k(-13, -6), k(0, -30), k(0, -6)]} f={c[0]} />
      <Facet p={[k(0, -30), k(13, -6), k(0, -6)]} f={c[1]} />
      <Facet p={[k(-9, -19), k(0, -42), k(0, -19)]} f={c[2]} />
      <Facet p={[k(0, -42), k(9, -19), k(0, -19)]} f={c[3]} />
    </g>
  );
}

/** Floating island: faceted grass cap + inverted crystal of rock. */
export function Island({ cx, y, w, d = 46, children, dim = false }: { cx: number; y: number; w: number; d?: number; children?: ReactNode; dim?: boolean }) {
  const top: Pt[] = [
    [cx - w / 2, y],
    [cx - w * 0.3, y - 8],
    [cx + w * 0.25, y - 9],
    [cx + w / 2, y - 1],
    [cx + w * 0.3, y + 7],
    [cx - w * 0.28, y + 7],
  ];
  const O: Pt = [cx - w * 0.04, y - 1];
  const lipL: Pt = [cx - w / 2 + 3, y + 9];
  const lipA: Pt = [cx - w * 0.28, y + 15];
  const lipB: Pt = [cx + w * 0.3, y + 15];
  const lipR: Pt = [cx + w / 2 - 4, y + 8];
  const mid: Pt = [cx + w * 0.04, y + 15];
  const tipA: Pt = [cx - w * 0.1, y + d];
  const tipB: Pt = [cx + w * 0.14, y + d * 0.68];
  return (
    <g className={dim ? 'lp-dim' : undefined}>
      <Facet p={[top[0], top[5], lipA, lipL]} f="#b77a4a" />
      <Facet p={[top[5], top[4], lipB, lipA]} f="#a46a3d" />
      <Facet p={[top[4], top[3], lipR, lipB]} f="#8d5a33" />
      <Facet p={[lipL, lipA, tipA]} f={LP.rock[0]} />
      <Facet p={[lipA, mid, tipA]} f={LP.rock[1]} />
      <Facet p={[mid, lipB, tipB]} f={LP.rock[2]} />
      <Facet p={[lipB, lipR, tipB]} f={LP.rock[3]} />
      <Facet p={[mid, tipB, tipA]} f={LP.rock[4]} />
      {top.map((p, i) => (
        <Facet key={i} p={[O, p, top[(i + 1) % top.length]]} f={LP.grass[i]} />
      ))}
      {children}
    </g>
  );
}

export function Sun({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const v: Pt[] = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const shades = ['#ffe3a3', '#ffd27a', '#f5b955', '#eaa944', '#f5bf5e', '#ffdc8e'];
  return (
    <g>
      {v.map((p, i) => (
        <Facet key={i} p={[[cx, cy], p, v[(i + 1) % 6]]} f={shades[i]} />
      ))}
    </g>
  );
}

export function PolyCloud({ x, y, s = 1, className }: { x: number; y: number; s?: number; className?: string }) {
  const k = (dx: number, dy: number): Pt => [x + dx * s, y + dy * s];
  return (
    <g className={className} opacity="0.95">
      <Facet p={[k(0, 12), k(10, 3), k(20, 12)]} f="#ffffff" />
      <Facet p={[k(10, 3), k(26, -4), k(20, 12)]} f="#f4f8fa" />
      <Facet p={[k(26, -4), k(40, 4), k(20, 12)]} f="#e6eff3" />
      <Facet p={[k(20, 12), k(40, 4), k(50, 12)]} f="#dbe7ec" />
    </g>
  );
}

/* --- Landmarks (origin = base centre) ------------------------------------- */

function at(x: number, y: number, s: number, children: ReactNode) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>{children}</g>;
}

export function EiffelTower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const a = '#6b7d8b';
  const c = '#465662';
  const archShade = 'rgba(70, 86, 98, 0.5)';
  return at(
    x,
    y,
    s,
    <>
      <Facet p={[[-14, 0], [-5, 0], [-3, -22], [-7, -22]]} f={a} />
      <Facet p={[[5, 0], [14, 0], [7, -22], [3, -22]]} f={c} />
      <rect x="-10" y="-23" width="20" height="3" fill={c} />
      <Facet p={[[-6, -20], [0, -20], [0, -42], [-3, -42]]} f={a} />
      <Facet p={[[0, -20], [6, -20], [3, -42], [0, -42]]} f={c} />
      <rect x="-5" y="-43" width="10" height="2.5" fill={c} />
      <Facet p={[[-3, -41], [0, -41], [0, -66]]} f={a} />
      <Facet p={[[0, -41], [3, -41], [0, -66]]} f={c} />
      <Facet p={[[-5, 0], [5, 0], [0, -10]]} f={archShade} />
    </>,
  );
}

export function Tent({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const base = [-17, -8.5, 0, 8.5, 17];
  return at(
    x,
    y,
    s,
    <>
      <rect x="-14" y="-14" width="28" height="14" fill="#c98a5a" />
      <rect x="-14" y="-6" width="28" height="6" fill="#a86c43" />
      <Facet p={[[4, -14], [14, -14], [14, 0], [4, 0]]} f="#000" o={0.12} />
      {base.slice(0, -1).map((bx, i) => (
        <Facet key={i} p={[[0, -32], [bx, -14], [base[i + 1], -14]]} f={i % 2 ? LP.cream : i < 2 ? LP.orangeLight : LP.orange} />
      ))}
    </>,
  );
}

export function House({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return at(
    x,
    y,
    s,
    <>
      <Facet p={[[-11, 0], [-11, -14], [4, -14], [4, 0]]} f={LP.cream} />
      <Facet p={[[4, 0], [4, -14], [14, -18], [14, -4]]} f="#d6c8ab" />
      <Facet p={[[-13, -14], [-3.5, -27], [6, -14]]} f="#d07a3e" />
      <Facet p={[[-3.5, -27], [6, -14], [16, -18], [6.5, -31]]} f="#a85a2a" />
      <rect x="-6" y="-7" width="4" height="7" fill="#8a5535" />
    </>,
  );
}

export function Boat({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return at(
    x,
    y,
    s,
    <>
      <Facet p={[[-16, -6], [0, -6], [0, 0], [-11, 0]]} f="#9c6240" />
      <Facet p={[[0, -6], [16, -6], [11, 0], [0, 0]]} f="#7a4a2e" />
      <rect x="-0.8" y="-32" width="1.6" height="26" fill="#5a3a24" />
      <Facet p={[[1.5, -29], [1.5, -8], [14, -9]]} f={LP.cream} />
      <Facet p={[[-1.5, -26], [-1.5, -9], [-11, -10]]} f="#e6dcc4" />
      <Facet p={[[0, -32], [7, -30], [0, -28]]} f={LP.orange} />
    </>,
  );
}

export function Umbrella({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return at(
    x,
    y,
    s,
    <>
      <rect x="-0.8" y="-22" width="1.6" height="22" fill="#5a3a24" />
      <Facet p={[[-16, -19], [0, -30], [0, -19]]} f={LP.orangeLight} />
      <Facet p={[[0, -30], [16, -19], [0, -19]]} f={LP.orangeDark} />
      <rect x="-9" y="-8" width="18" height="2.5" fill="#8a5535" />
      <rect x="-7" y="-6" width="1.6" height="6" fill="#5a3a24" />
      <rect x="5.4" y="-6" width="1.6" height="6" fill="#5a3a24" />
    </>,
  );
}

export function ClockTower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return at(
    x,
    y,
    s,
    <>
      <Facet p={[[-6, 0], [-6, -30], [0, -30], [0, 0]]} f="#d6c8ab" />
      <Facet p={[[0, 0], [0, -30], [6, -30], [6, 0]]} f="#b3a385" />
      <Facet p={[[-8, -30], [0, -44], [0, -30]]} f="#5a7d8f" />
      <Facet p={[[0, -44], [8, -30], [0, -30]]} f="#3f5f70" />
      <circle cx="0" cy="-22" r="3.6" fill={LP.cream} stroke="#5a3a24" strokeWidth="1" />
      <path d="M0 -22v-2.4M0 -22h1.8" stroke="#5a3a24" strokeWidth="0.9" />
    </>,
  );
}

export const LANDMARKS = [Boat, House, Tent, Umbrella, ClockTower, EiffelTower] as const;

/* --- Mascot ----------------------------------------------------------------- */

/** Pip, low-poly: ~20 triangles shaded from a single top-left light. */
export function PolyBird({ size = 120, x, y, cheer = false }: { size?: number; x?: number; y?: number; cheer?: boolean }) {
  return (
    <svg className="lp-bird" x={x} y={y} width={size} height={size * (104 / 120)} viewBox="0 0 120 104" role="img" aria-label="Pip the bird">
      <Facet p={[[36, 98], [50, 94], [82, 94], [96, 98], [82, 102], [50, 102]]} f={LP.ink} o={0.16} />
      <g className="lp-bird__body">
        <path d="M60 81 58 94M70 79l2 15" stroke={LP.orangeDark} strokeWidth="3" />
        <Facet p={[[52, 97], [64, 97], [58, 92]]} f="#c96f35" />
        <Facet p={[[66, 97], [78, 97], [72, 92]]} f="#c96f35" />
        <Facet p={[[6, 42], [34, 38], [30, 60]]} f="#3a8744" />
        <Facet p={[[6, 42], [30, 60], [10, 62]]} f="#2c6e39" />
        <Facet p={[[58, 20], [56, 5], [68, 15]]} f="#8fd679" />
        <Facet p={[[66, 15], [77, 3], [75, 18]]} f="#6cc35f" />
        <Facet p={[[52, 22], [70, 14], [72, 40]]} f="#9bdc84" />
        <Facet p={[[70, 14], [88, 22], [72, 40]]} f="#7fcf6c" />
        <Facet p={[[88, 22], [96, 34], [72, 40]]} f="#5fb85a" />
        <Facet p={[[96, 34], [94, 48], [72, 40]]} f="#4a9e4c" />
        <Facet p={[[34, 36], [52, 22], [72, 40]]} f="#6ec463" />
        <Facet p={[[34, 36], [72, 40], [56, 58]]} f="#58b056" />
        <Facet p={[[72, 40], [94, 48], [84, 66]]} f="#3f9147" />
        <Facet p={[[72, 40], [84, 66], [56, 58]]} f="#4fa64f" />
        <Facet p={[[56, 58], [84, 66], [64, 82]]} f="#a9d98a" />
        <Facet p={[[34, 36], [56, 58], [36, 70]]} f="#4a9a4a" />
        <Facet p={[[36, 70], [56, 58], [64, 82]]} f="#2f7a3d" />
        {cheer ? (
          <>
            <Facet p={[[34, 50], [44, 18], [56, 52]]} f="#2c6f3a" />
            <Facet p={[[44, 18], [50, 30], [56, 52]]} f="#3e8b46" />
          </>
        ) : (
          <>
            <Facet p={[[36, 52], [64, 54], [46, 72]]} f="#2c6f3a" />
            <Facet p={[[36, 52], [46, 72], [30, 66]]} f="#24603c" />
            <Facet p={[[40, 52], [64, 54], [52, 58]]} f="#3e8b46" />
          </>
        )}
        <Facet p={[[96, 33], [114, 42], [97, 41]]} f={LP.orangeLight} />
        <Facet p={[[97, 41], [114, 42], [94, 48]]} f="#d97a3d" />
        <Facet p={[[80, 30], [84, 25.5], [88, 30], [84, 34.5]]} f={LP.ink} />
        <Facet p={[[82.6, 28.4], [85.6, 27], [84.2, 30]]} f="#ffffff" />
      </g>
    </svg>
  );
}
