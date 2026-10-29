import type { KeyboardEvent } from 'react';
import type { DesignId, Direction } from '../core/types';

interface Props {
  directions: Direction[];
  active: DesignId | null;
  onSelect: (id: DesignId) => void;
}

/** The four direction cards. Arrow keys move between them (WAI-ARIA tabs). */
export function DirectionTabs({ directions, active, onSelect }: Props) {
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = directions[(i + delta + directions.length) % directions.length];
    onSelect(next.id);
    document.getElementById(`sh-tab-${next.id}`)?.focus();
  };

  return (
    <div className="sh-tabs" role="tablist" aria-label="Visual directions">
      {directions.map((d, i) => {
        const selected = active === d.id;
        return (
          <button
            key={d.id}
            id={`sh-tab-${d.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="sh-stage"
            tabIndex={active === null ? 0 : selected ? 0 : -1}
            className="sh-tab"
            onClick={() => onSelect(d.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            <span className="sh-tab__thumb" style={{ background: d.thumbBg }} aria-hidden>
              <d.Thumb />
            </span>
            <span className="sh-tab__text">
              <span className="sh-mono sh-tab__index">
                {d.letter} <span aria-hidden>/</span> 0{i + 1}
              </span>
              <span className="sh-tab__name">{d.name}</span>
              <span className="sh-tab__tagline">{d.tagline}</span>
            </span>
            <span className="sh-tab__palette" aria-hidden>
              {d.palette.slice(0, 6).map((s) => (
                <i key={s.hex} style={{ background: s.hex }} />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
