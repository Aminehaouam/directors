import { useState } from 'react';
import type { PreviewModel } from '../../core/model';
import { app, badges, LESSONS_BEFORE_TODAY, profile, vocabulary, week, WORDS_LEARNED } from '../../data/sample';
import { PolyBird } from './art';
import { PIcon, type PolyIconName } from './icons';

const pad = (n: number) => String(n).padStart(2, '0');

function Hexes({ value }: { value: number }) {
  return (
    <span className="lp-hexes" role="img" aria-label={`Strength ${value} of 4`}>
      {[0, 1, 2, 3].map((i) => (
        <i key={i} className={i < value ? 'is-on' : ''} />
      ))}
    </span>
  );
}

export function PracticeScreen({ model }: { model: PreviewModel }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="lp-page">
      <div className="lp-page-head">
        <span className="lp-caps">{vocabulary.length} entries · tap to translate</span>
        <h1>Field journal</h1>
      </div>
      <div className="lp-journal lp-elev">
        {vocabulary.map((v, i) => {
          const isOpen = open === v.id;
          return (
            <button key={v.id} type="button" className={`lp-cut lp-entry${isOpen ? ' is-open' : ''}`} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : v.id)}>
              <span className="lp-entry__num">{pad(i + 1)}</span>
              <span className="lp-entry__main">
                <span className="lp-entry__fr" lang="fr">
                  {v.fr}
                </span>
                <span className="lp-entry__en">{isOpen ? `${v.en} · “${v.say}”` : '· · ·'}</span>
              </span>
              <Hexes value={v.strength} />
            </button>
          );
        })}
      </div>
      <button type="button" className="lp-btn lp-btn--go lp-btn--block" onClick={() => model.actions.start(model.current.id)}>
        Start review run
        <PIcon name="arrow" size={20} />
      </button>
    </div>
  );
}

export function ProgressScreen({ model }: { model: PreviewModel }) {
  const today = model.state.lessonsToday;
  const days = week.map((d) => (d.isToday ? { ...d, lessons: today } : d));
  const stats: { icon: PolyIconName; value: number; label: string }[] = [
    { icon: 'flame', value: model.state.streak, label: 'Day streak' },
    { icon: 'flag', value: LESSONS_BEFORE_TODAY + today, label: 'Lessons' },
    { icon: 'star', value: WORDS_LEARNED, label: 'Words' },
  ];
  const H = 110;
  const colW = 34;
  const gap = 12;
  return (
    <div className="lp-page">
      <div className="lp-page-head">
        <span className="lp-caps">Week 44 · Day {model.state.streak} of streak</span>
        <h1>Expedition log</h1>
      </div>
      <div className="lp-stats lp-elev">
        {stats.map((s) => (
          <div key={s.label} className="lp-cut lp-tile">
            <PIcon name={s.icon} size={20} />
            <b>{s.value}</b>
            <span className="lp-caps">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="lp-elev">
        <section className="lp-cut lp-chart" aria-label="Lessons this week">
          <div className="lp-head">
            <h2>Altitude this week</h2>
          </div>
          <svg viewBox={`0 0 ${7 * colW + 6 * gap} ${H + 26}`} role="img" aria-label="Lessons per day">
            {days.map((d, i) => {
              const x = i * (colW + gap);
              const h = d.lessons === null ? 0 : Math.max(6, (d.lessons / 5) * (H - 14));
              const top = H - h;
              const lit = d.isToday ? ['#f2a66b', '#e0894b', '#b8652c'] : ['#7aa994', '#5f8f7b', '#456f5e'];
              return (
                <g key={i}>
                  {d.lessons === null ? (
                    <polygon points={`${x},${H} ${x + colW},${H} ${x + colW - 6},${H - 6} ${x + 6},${H - 6}`} fill="#ddd5c4" />
                  ) : (
                    <>
                      <polygon points={`${x},${H} ${x},${top + 8} ${x + colW / 2},${top} ${x + colW / 2},${H}`} fill={lit[0]} />
                      <polygon points={`${x + colW / 2},${H} ${x + colW / 2},${top} ${x + colW},${top + 8} ${x + colW},${H}`} fill={lit[2]} />
                    </>
                  )}
                  <text x={x + colW / 2} y={H + 18} textAnchor="middle" className="lp-svg-label" fill={d.isToday ? '#b8652c' : '#7b8790'}>
                    {d.day.slice(0, 3).toUpperCase()}
                  </text>
                </g>
              );
            })}
          </svg>
        </section>
      </div>
    </div>
  );
}

const BADGE_ICONS: PolyIconName[] = ['flag', 'flame', 'star', 'gem'];

export function ProfileScreen() {
  return (
    <div className="lp-page">
      <div className="lp-elev">
        <section className="lp-cut lp-explorer">
          <span className="lp-hexframe">
            <PolyBird size={74} />
          </span>
          <div>
            <span className="lp-caps" style={{ color: 'var(--lp-orange-lo)' }}>
              Explorer · {app.level}
            </span>
            <h1 className="lp-display" style={{ margin: '2px 0', fontSize: 28, lineHeight: 1 }}>
              {app.learner}
            </h1>
            <span style={{ color: 'var(--lp-ink-2)' }}>{profile.handle}</span>
          </div>
        </section>
      </div>
      <section>
        <div className="lp-head">
          <h2>Insignia</h2>
          <span className="lp-caps">
            {badges.filter((b) => b.earned).length}/{badges.length}
          </span>
        </div>
        <div className="lp-badges">
          {badges.map((b, i) => (
            <div key={b.id} className={`lp-badge${b.earned ? '' : ' is-locked'}`} title={b.detail}>
              <span className="lp-badge__hex">
                <PIcon name={b.earned ? BADGE_ICONS[i] : 'lock'} size={22} />
              </span>
              {b.name}
            </div>
          ))}
        </div>
      </section>
      <div className="lp-elev">
        <section className="lp-cut lp-rows" aria-label="Settings">
          <div>
            <span>Route</span>
            <span>
              {app.language} · {app.level}
            </span>
          </div>
          <div>
            <span>Daily goal</span>
            <span>{profile.goalLabel}</span>
          </div>
          <div>
            <span>Reminder</span>
            <span>8:00</span>
          </div>
        </section>
      </div>
    </div>
  );
}
