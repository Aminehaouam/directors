import type { Direction } from '../core/types';

export function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div className="sh-meter">
      <span>{label}</span>
      <span className="sh-meter__dots" role="img" aria-label={`${label}: ${value} of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={i <= value ? 'is-on' : ''} />
        ))}
      </span>
    </div>
  );
}

/** Left column: what the direction is for, and how it might fail. */
export function DirectionBrief({ d }: { d: Direction }) {
  return (
    <aside className="sh-notes sh-notes--brief" aria-label={`${d.name} brief`}>
      <p className="sh-mono sh-kicker">Direction {d.letter}</p>
      <h2 className="sh-notes__title">{d.name}</h2>
      <p className="sh-notes__intent">{d.intent}</p>
      <ul className="sh-chips" aria-label="Keywords">
        {d.keywords.map((k) => (
          <li key={k}>{k}</li>
        ))}
      </ul>
      <h3 className="sh-mono sh-h3">Where it shines</h3>
      <ul className="sh-list sh-list--plus">
        {d.strengths.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <h3 className="sh-mono sh-h3">Watch-outs</h3>
      <ul className="sh-list sh-list--minus">
        {d.risks.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </aside>
  );
}

const TRY = [
  'Tap a milestone on the path — completed, current and locked behave differently.',
  'Press “Continue learning” and answer the three questions.',
  'Finish to see gems and today’s goal tick from 2/5 to 3/5, and the next stop unlock.',
  'Use the bottom bar: Practice (flip words), Progress, Profile.',
];

/** Right column: the system behind the screen and what it costs to build. */
export function DirectionSystem({ d }: { d: Direction }) {
  return (
    <aside className="sh-notes sh-notes--system" aria-label={`${d.name} system`}>
      <h3 className="sh-mono sh-h3">Palette</h3>
      <ul className="sh-swatches">
        {d.palette.map((s) => (
          <li key={s.hex}>
            <i style={{ background: s.hex }} />
            <span>{s.name}</span>
            <span className="sh-mono">{s.hex}</span>
          </li>
        ))}
      </ul>

      <h3 className="sh-mono sh-h3">Type</h3>
      <div className="sh-type">
        <span className="sh-type__aa" style={{ fontFamily: d.type.displayFamily }}>
          Aa
        </span>
        <div>
          <span className="sh-type__sample" style={{ fontFamily: d.type.displayFamily }}>
            Bonjour, Alex!
          </span>
          <span className="sh-type__names">
            {d.type.display} <span aria-hidden>·</span> <span style={{ fontFamily: d.type.bodyFamily }}>{d.type.body}</span>
          </span>
        </div>
      </div>

      <h3 className="sh-mono sh-h3">Production cost</h3>
      <div className="sh-meters">
        <Meter label="Illustration" value={d.cost.illustration} />
        <Meter label="Engineering" value={d.cost.engineering} />
        <Meter label="Motion" value={d.cost.motion} />
      </div>

      <h3 className="sh-mono sh-h3">Try it</h3>
      <ol className="sh-try">
        {TRY.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ol>
    </aside>
  );
}
