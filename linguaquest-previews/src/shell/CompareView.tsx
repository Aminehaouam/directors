import type { PreviewModel } from '../core/model';
import type { DesignId, Direction } from '../core/types';
import { Meter } from './DirectionNotes';
import { PhoneFrame, ScaledPhone } from './PhoneFrame';

export type CompareLayout = 'row' | 'grid';

interface Props {
  directions: Direction[];
  models: Record<DesignId, PreviewModel>;
  layout: CompareLayout;
  onFocus: (id: DesignId) => void;
}

export function CompareView({ directions, models, layout, onFocus }: Props) {
  return (
    <section id="sh-stage" className="sh-compare" data-layout={layout} aria-label="All four directions side by side">
      {directions.map((d) => (
        <figure key={d.id} className="sh-compare__item">
          <figcaption className="sh-compare__head">
            <span className="sh-compare__letter" aria-hidden>
              {d.letter}
            </span>
            <span className="sh-compare__name">{d.name}</span>
            <button type="button" className="sh-link" onClick={() => onFocus(d.id)}>
              Focus
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                <path d="M4 2h6v6M10 2 3 9" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
          </figcaption>
          <ScaledPhone>
            <PhoneFrame tone={d.statusTone} label={`${d.name} prototype`}>
              <d.App model={models[d.id]} />
            </PhoneFrame>
          </ScaledPhone>
          <div className="sh-compare__cost">
            <Meter label="Illustration" value={d.cost.illustration} />
            <Meter label="Engineering" value={d.cost.engineering} />
          </div>
        </figure>
      ))}
    </section>
  );
}
