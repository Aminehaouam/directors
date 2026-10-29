import { useMemo } from 'react';
import { PALETTE, type SpriteRows } from './sprites';

interface Run {
  x: number;
  y: number;
  w: number;
  c: string;
}

const cache = new WeakMap<SpriteRows, Run[]>();

/** Merge horizontal runs of the same colour so a 16×16 sprite is ~40 rects, not 256. */
function toRuns(rows: SpriteRows): Run[] {
  const hit = cache.get(rows);
  if (hit) return hit;
  const runs: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let w = 1;
      while (row[x + w] === c) w++;
      if (c !== '.') runs.push({ x, y, w, c });
      x += w;
    }
  });
  cache.set(rows, runs);
  return runs;
}

interface SpriteProps {
  rows: SpriteRows;
  /** CSS pixels per sprite pixel. Keep it an integer so edges stay crisp. */
  scale?: number;
  className?: string;
  label?: string;
  colors?: Record<string, string>;
}

export function Sprite({ rows, scale = 4, className, label, colors }: SpriteProps) {
  const runs = useMemo(() => toRuns(rows), [rows]);
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      width={w * scale}
      height={h * scale}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {runs.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.w}
          height={1}
          fill={r.c === 'x' ? 'currentColor' : (colors?.[r.c] ?? PALETTE[r.c])}
        />
      ))}
    </svg>
  );
}
