import type { CSSProperties, ReactNode } from 'react';
import type { MilestoneView } from '../../core/model';
import { Sprite } from './Sprite';
import { Bird } from './parts';
import { BIRD, CHEST, CLOUD, FLAG_FR, FLOWER, LOCK, PLAY, STAR, TAIL, TOWER, TOWER_MINI, TREE } from './sprites';

/* ---------------------------------------------------------------------------
 * Hero scene. The background is one SVG in "world pixels" (1 unit = 4px):
 * stepped sky bands, two layers of stepped hills, grass and a tiled dirt
 * pattern. Hills are sampled from sine waves and quantised to whole units,
 * so the silhouette is deliberate and repeatable (no random noise).
 * ------------------------------------------------------------------------- */

const W = 112;
const H = 52;
const GROUND = 44;

function steppedHill(base: number, height: (x: number) => number): string {
  let d = `M0 ${base}`;
  for (let x = 0; x < W; x++) {
    const top = base - Math.round(height(x));
    d += ` V${top} H${x + 1}`;
  }
  return `${d} V${base} Z`;
}

const FAR_HILLS = steppedHill(GROUND, (x) => 9 + 3.5 * Math.sin(x / 8.5) + 1.5 * Math.sin(x / 3.7 + 1));
const NEAR_HILLS = steppedHill(GROUND, (x) => 4 + 2.5 * Math.sin(x / 6 + 2) + 1 * Math.sin(x / 2.9));

function SceneBackdrop() {
  return (
    <svg className="px-scene__bg" width={W * 4} height={H * 4} viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" aria-hidden>
      <defs>
        <pattern id="px-dirt" width="12" height="6" patternUnits="userSpaceOnUse">
          <rect width="12" height="6" fill="#e3ad6f" />
          <rect x="2" y="1" width="2" height="1" fill="#b97c45" />
          <rect x="8" y="4" width="2" height="1" fill="#b97c45" />
          <rect x="6" y="2" width="1" height="1" fill="#f2c88f" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="#8fd3ff" />
      <rect y="26" width={W} height="6" fill="#a3dcff" />
      <rect y="32" width={W} height={GROUND - 32} fill="#b9e5ff" />
      <path d={FAR_HILLS} fill="#bfe9a0" />
      <path d={NEAR_HILLS} fill="#97d76c" />
      <rect y={GROUND} width={W} height="1" fill="#c4f07a" />
      <rect y={GROUND + 1} width={W} height="3" fill="#74cc4c" />
      {Array.from({ length: W / 4 }, (_, i) => (
        <rect key={i} x={i * 4 + 1} y={GROUND + 3} width="2" height="1" fill="#3f9e3c" />
      ))}
      <rect y={GROUND + 4} width={W} height={H - GROUND - 4} fill="url(#px-dirt)" />
    </svg>
  );
}

function Placed({ children, style }: { children: ReactNode; style: CSSProperties }) {
  return (
    <div className="px-scene__sprite" style={style}>
      {children}
    </div>
  );
}

export function BubbleTail() {
  return (
    <span className="px-bubble__tail">
      <Sprite rows={TAIL} scale={3} colors={{ w: '#fffdf6' }} />
    </span>
  );
}

export function HeroScene({ children }: { children: ReactNode }) {
  return (
    <div className="px-scene">
      <SceneBackdrop />
      <Placed style={{ left: 12, top: 16 }}>
        <div className="px-cloud">
          <Sprite rows={CLOUD} scale={4} />
        </div>
      </Placed>
      <Placed style={{ left: '46%', top: 116 }}>
        <div className="px-cloud px-cloud--slow">
          <Sprite rows={CLOUD} scale={3} />
        </div>
      </Placed>
      <Placed style={{ right: 100, bottom: 52 }}>
        <Sprite rows={TOWER_MINI} scale={4} colors={{ k: '#7f93c4', K: '#aebfe2' }} />
      </Placed>
      <Placed style={{ right: 16, bottom: 32 }}>
        <Sprite rows={TREE} scale={4} />
      </Placed>
      <Placed style={{ right: 52, bottom: 32 }}>
        <Sprite rows={TREE} scale={4} />
      </Placed>
      <Placed style={{ left: 100, bottom: 32 }}>
        <Sprite rows={FLAG_FR} scale={4} />
      </Placed>
      <Placed style={{ left: 24, bottom: 32 }}>
        <Bird scale={4} />
      </Placed>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * World map: a snake-shaped road between six stages, like a retro overworld.
 * Fixed 320×232 canvas so every sprite sits on whole pixels.
 * ------------------------------------------------------------------------- */

const NODE_POS: [number, number][] = [
  [48, 56],
  [160, 56],
  [272, 56],
  [272, 168],
  [160, 168],
  [48, 168],
];

const SHORT_PLACE = ['Port', 'Village', 'Marché', 'Café', 'Gare', 'Paris'];

function Road({ reached }: { reached: number }) {
  const parts = [];
  for (let i = 0; i < NODE_POS.length - 1; i++) {
    const [x1, y1] = NODE_POS[i];
    const [x2, y2] = NODE_POS[i + 1];
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const horizontal = y1 === y2;
    const len = horizontal ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
    const traveled = i + 1 <= reached;
    if (traveled) {
      parts.push(
        horizontal ? (
          <g key={i}>
            <rect x={x} y={y - 8} width={len} height={16} fill="#b98a4e" />
            <rect x={x} y={y - 6} width={len} height={12} fill="#f6dca2" />
            <rect x={x} y={y + 3} width={len} height={3} fill="#e7c486" />
          </g>
        ) : (
          <g key={i}>
            <rect x={x - 8} y={y} width={16} height={len} fill="#b98a4e" />
            <rect x={x - 6} y={y} width={12} height={len} fill="#f6dca2" />
            <rect x={x + 3} y={y} width={3} height={len} fill="#e7c486" />
          </g>
        ),
      );
    } else {
      const stones = [];
      for (let s = 12; s < len; s += 16) {
        stones.push(
          horizontal ? (
            <rect key={s} x={x + s} y={y - 3} width={8} height={6} fill="#e9e5f2" stroke="#8f88a6" strokeWidth={2} />
          ) : (
            <rect key={s} x={x - 4} y={y + s} width={8} height={6} fill="#e9e5f2" stroke="#8f88a6" strokeWidth={2} />
          ),
        );
      }
      parts.push(<g key={i}>{stones}</g>);
    }
  }
  return (
    <svg className="px-map__road" width="320" height="232" viewBox="0 0 320 232" shapeRendering="crispEdges" aria-hidden>
      {/* pond */}
      <rect x="116" y="96" width="88" height="28" fill="#3e9be0" />
      <rect x="112" y="100" width="96" height="20" fill="#3e9be0" />
      <rect x="120" y="100" width="80" height="20" fill="#8fd3ff" />
      <rect x="132" y="106" width="16" height="3" fill="#ffffff" />
      <rect x="172" y="112" width="12" height="3" fill="#d3efff" />
      {parts}
    </svg>
  );
}

function NodeIcon({ m, last }: { m: MilestoneView; last: boolean }) {
  if (last) return <Sprite rows={CHEST} scale={3} />;
  if (m.status === 'completed') return <Sprite rows={STAR} scale={3} />;
  if (m.status === 'current') return <Sprite rows={PLAY} scale={4} />;
  return <Sprite rows={LOCK} scale={3} />;
}

const STATUS_WORD = { completed: 'cleared', current: 'you are here', locked: 'locked' } as const;

export function WorldMap({ milestones, onSelect }: { milestones: MilestoneView[]; onSelect: (id: string) => void }) {
  const reached = milestones.findIndex((m) => m.status === 'current');
  return (
    <div className="px-map px-frame">
      <div className="px-map__canvas">
        <Road reached={reached < 0 ? milestones.length - 1 : reached} />
        <div className="px-map__deco" style={{ left: 8, top: 96 }}>
          <Sprite rows={TREE} scale={3} />
        </div>
        <div className="px-map__deco" style={{ left: 224, top: 92 }}>
          <Sprite rows={TREE} scale={3} />
        </div>
        <div className="px-map__deco" style={{ left: 290, top: 100 }}>
          <Sprite rows={FLOWER} scale={3} />
        </div>
        <div className="px-map__deco" style={{ left: 196, top: 6 }}>
          <Sprite rows={FLOWER} scale={3} />
        </div>
        <div className="px-map__deco" style={{ left: 68, top: 90 }}>
          <Sprite rows={TOWER} scale={3} />
        </div>
        {milestones.map((m, i) => {
          const [x, y] = NODE_POS[i];
          const last = i === milestones.length - 1;
          return (
            <button
              key={m.id}
              type="button"
              className={`px-node px-node--${m.status}`}
              style={{ left: x, top: y }}
              aria-pressed={m.selected}
              aria-label={`Stage ${m.number}: ${m.title}, ${STATUS_WORD[m.status]}`}
              onClick={() => onSelect(m.id)}
            >
              <span style={last && m.status === 'locked' ? { filter: 'grayscale(1)', opacity: 0.6 } : undefined}>
                <NodeIcon m={m} last={last} />
              </span>
              <span className="px-node__num px-label">{SHORT_PLACE[i]}</span>
              {m.status === 'current' && (
                <span className="px-node__marker">
                  <span className="px-bird">
                    <Sprite rows={BIRD} scale={2} />
                  </span>
                </span>
              )}
              {m.selected && <span className="px-node__reticle" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
