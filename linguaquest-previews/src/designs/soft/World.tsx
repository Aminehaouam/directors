import { useId, type ReactNode } from 'react';
import { SoftBird } from './Mascot';

/* Small reusable scenery pieces. Each is a handful of SVG primitives. */

export function Cloud({ x, y, scale = 1, className }: { x: number; y: number; scale?: number; className?: string }) {
  return (
    <g className={className}>
      <g transform={`translate(${x} ${y}) scale(${scale})`}>
        <ellipse cx="34" cy="26" rx="34" ry="10" fill="#dfeaf8" />
        <circle cx="18" cy="18" r="12" fill="#fff" />
        <circle cx="36" cy="12" r="16" fill="#fff" />
        <circle cx="54" cy="19" r="11" fill="#fff" />
        <rect x="8" y="16" width="54" height="10" rx="5" fill="#fff" />
        <ellipse cx="30" cy="8" rx="8" ry="4" fill="#fff" opacity="0.9" />
      </g>
    </g>
  );
}

export function Tree({ x, y, s = 1, tone = '#5cbf63' }: { x: number; y: number; s?: number; tone?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-2" y="0" width="4" height="12" rx="2" fill="#b98457" />
      <circle cx="0" cy="-4" r="10" fill={tone} />
      <circle cx="-3" cy="-8" r="4" fill="#fff" opacity="0.25" />
    </g>
  );
}

export function Tower({ x, y, s = 1, fill = '#b9b3e6' }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <path d="M16 0h1.6l1.6 14 2.5 15 5 17 6.3 16h-8.4c-2-7-5.2-10.5-8.4-10.5S10.2 55 8.2 62H0l6.3-16 5-17 2.6-15L16 0Z" />
      <rect x="9.5" y="28" width="14" height="3" rx="1.5" />
      <rect x="4" y="44" width="25" height="3.5" rx="1.75" />
    </g>
  );
}

/** Floating island with grass cap, layered earth, a bush and a signpost. */
export function Island({ children }: { children?: ReactNode }) {
  const id = useId().replace(/:/g, '');
  return (
    <g className="sf-island">
      <defs>
        <linearGradient id={`earth-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4cf9f" />
          <stop offset="1" stopColor="#c98c5f" />
        </linearGradient>
        <linearGradient id={`grass-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b2ef98" />
          <stop offset="1" stopColor="#71cc6c" />
        </linearGradient>
      </defs>
      <path d="M190 214c8 36 30 56 62 62 26 5 52-6 72-30 12-14 22-26 26-32H190Z" fill={`url(#earth-${id})`} />
      <path d="M210 240c30 10 90 10 124-2" stroke="#e7b682" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M232 262c20 6 50 4 72-6" stroke="#d9a271" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="270" cy="214" rx="80" ry="17" fill={`url(#grass-${id})`} />
      <path d="M190 214c0 7 4 11 10 13 40 14 100 14 140 0 6-2 10-6 10-13-12 10-44 17-80 17s-68-7-80-17Z" fill="#5cb85e" />
      <ellipse cx="252" cy="208" rx="40" ry="5" fill="#fff" opacity="0.28" />
      <circle cx="208" cy="208" r="9" fill="#4fb05a" />
      <circle cx="220" cy="203" r="11" fill="#5cc064" />
      <circle cx="216" cy="199" r="4" fill="#fff" opacity="0.3" />
      <g transform="translate(320 176)">
        <rect x="10" y="8" width="4" height="30" rx="2" fill="#b07a4b" />
        <rect x="-6" y="2" width="40" height="16" rx="5" fill="#f7dcae" stroke="#d3a46d" strokeWidth="1.5" />
        <text x="14" y="13.5" textAnchor="middle" fontFamily="Fredoka Variable, sans-serif" fontSize="9" fontWeight="600" fill="#8a5a2f">
          Paris →
        </text>
      </g>
      {children}
    </g>
  );
}

/** The illustrated upper half of the Learn screen. */
export function WorldScene({ birdMood = 'idle' }: { birdMood?: 'idle' | 'cheer' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="sf-scene__art" viewBox="0 0 390 300" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <radialGradient id={`sun-${id}`}>
          <stop offset="0" stopColor="#fff6d2" stopOpacity="1" />
          <stop offset="1" stopColor="#fff6d2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`drop-${id}`}>
          <stop offset="0" stopColor="#2d3a4a" stopOpacity="0.22" />
          <stop offset="1" stopColor="#2d3a4a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="336" cy="70" r="86" fill={`url(#sun-${id})`} />
      <circle cx="336" cy="70" r="22" fill="#ffe79a" />

      <Cloud className="sf-drift-slow" x={-6} y={128} scale={0.7} />
      <Tower x={128} y={150} s={0.95} />
      <path d="M0 214c60-24 120-18 180-6s120-18 210-2v94H0Z" fill="#d3eecf" />
      <Cloud className="sf-drift" x={236} y={62} scale={0.8} />
      <path d="M0 236c50-22 110-20 160-4s120-12 230 4v64H0Z" fill="#b3e4a9" />
      <Tree x={36} y={222} s={1} tone="#7dcf74" />
      <Tree x={58} y={228} s={0.8} tone="#6cc56a" />
      <path d="M0 262c80-16 160-10 230 4s110-14 160-4v38H0Z" fill="#96d78d" />
      <ellipse cx="270" cy="292" rx="72" ry="7" fill={`url(#drop-${id})`} />

      <Island>
        <SoftBird size={128} x={206} y={100} mood={birdMood} />
      </Island>
    </svg>
  );
}
