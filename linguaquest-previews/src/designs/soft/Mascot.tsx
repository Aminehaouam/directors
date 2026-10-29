import { useId } from 'react';

type Mood = 'idle' | 'cheer';

/**
 * Pip as a soft toy: one body ellipse with a radial "clay" gradient, a belly,
 * two wings, big glossy eyes and a rounded beak. Every shape is a plain SVG
 * primitive so an illustrator can swap it for a rendered asset later.
 */
interface SoftBirdProps {
  size?: number;
  mood?: Mood;
  float?: boolean;
  /** Position when nested inside another SVG scene. */
  x?: number;
  y?: number;
}

export function SoftBird({ size = 140, mood = 'idle', float = true, x, y }: SoftBirdProps) {
  const id = useId().replace(/:/g, '');
  const u = (name: string) => `url(#${name}-${id})`;
  const cheer = mood === 'cheer';
  return (
    <svg
      className={`sf-bird${float ? ' sf-bird--float' : ''}${cheer ? ' sf-bird--cheer' : ''}`}
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 160 160"
      role="img"
      aria-label="Pip the bird"
    >
      <defs>
        <radialGradient id={`body-${id}`} cx="38%" cy="30%" r="75%">
          <stop offset="0" stopColor="#a7ee93" />
          <stop offset="0.55" stopColor="#5cc864" />
          <stop offset="1" stopColor="#2f9a4c" />
        </radialGradient>
        <radialGradient id={`belly-${id}`} cx="50%" cy="25%" r="80%">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="1" stopColor="#ffe4b5" />
        </radialGradient>
        <linearGradient id={`beak-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc867" />
          <stop offset="1" stopColor="#ff8a3d" />
        </linearGradient>
        <linearGradient id={`wing-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#57bf5f" />
          <stop offset="1" stopColor="#2a8a45" />
        </linearGradient>
        <radialGradient id={`shadow-${id}`}>
          <stop offset="0" stopColor="#2d3a4a" stopOpacity="0.3" />
          <stop offset="1" stopColor="#2d3a4a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse className="sf-bird__shadow" cx="80" cy="149" rx="44" ry="8" fill={u('shadow')} />

      <g className="sf-bird__body">
        {/* feet */}
        <path d="M60 132c-6 0-9 5-6 8h16c2-4-4-8-10-8Z" fill="#ff9a45" />
        <path d="M100 132c6 0 9 5 6 8H90c-2-4 4-8 10-8Z" fill="#ff9a45" />
        {/* tuft */}
        <path d="M78 44c-6-12-2-22 8-26-1 10-2 18-8 26Z" fill="#4cbb5a" />
        <path d="M82 44c4-10 12-14 20-12-5 7-11 11-20 12Z" fill="#3da650" />
        {/* wings */}
        <g className="sf-bird__wing sf-bird__wing--l">
          <path d={cheer ? 'M38 84C20 70 14 52 22 44c10 8 22 22 26 36Z' : 'M36 84c-12 8-14 26-4 34 8-2 14-14 14-30Z'} fill={u('wing')} />
        </g>
        <g className="sf-bird__wing sf-bird__wing--r">
          <path d={cheer ? 'M122 84c18-14 24-32 16-40-10 8-22 22-26 36Z' : 'M124 84c12 8 14 26 4 34-8-2-14-14-14-30Z'} fill={u('wing')} />
        </g>
        {/* body + belly */}
        <ellipse cx="80" cy="90" rx="48" ry="47" fill={u('body')} />
        <ellipse cx="80" cy="108" rx="29" ry="25" fill={u('belly')} />
        <ellipse cx="60" cy="62" rx="15" ry="9" fill="#ffffff" opacity="0.32" transform="rotate(-28 60 62)" />
        {/* cheeks */}
        <ellipse cx="50" cy="97" rx="8" ry="5" fill="#ff8f9c" opacity="0.45" />
        <ellipse cx="110" cy="97" rx="8" ry="5" fill="#ff8f9c" opacity="0.45" />
        {/* eyes */}
        <g className="sf-bird__eyes">
          {cheer ? (
            <>
              <path d="M56 82q8-10 16 0" fill="none" stroke="#1f2a37" strokeWidth="5" strokeLinecap="round" />
              <path d="M88 82q8-10 16 0" fill="none" stroke="#1f2a37" strokeWidth="5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="64" cy="80" rx="11" ry="13" fill="#fff" />
              <ellipse cx="96" cy="80" rx="11" ry="13" fill="#fff" />
              <ellipse cx="65.5" cy="82" rx="7" ry="8.5" fill="#1f2a37" />
              <ellipse cx="94.5" cy="82" rx="7" ry="8.5" fill="#1f2a37" />
              <circle cx="68" cy="78" r="2.8" fill="#fff" />
              <circle cx="97" cy="78" r="2.8" fill="#fff" />
              <circle cx="63.5" cy="86.5" r="1.2" fill="#fff" opacity="0.8" />
              <circle cx="92.5" cy="86.5" r="1.2" fill="#fff" opacity="0.8" />
            </>
          )}
        </g>
        {/* beak */}
        <path d="M70 93c6-5 14-5 20 0-2 8-6 12-10 13-4-1-8-5-10-13Z" fill={u('beak')} />
        <path d="M72 94c5-3 11-3 16 0" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}
