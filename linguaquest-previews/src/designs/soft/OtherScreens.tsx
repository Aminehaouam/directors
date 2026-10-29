import { useState, type CSSProperties } from 'react';
import type { PreviewModel } from '../../core/model';
import { app, badges, LESSONS_BEFORE_TODAY, profile, vocabulary, week, WORDS_LEARNED } from '../../data/sample';
import { SIcon, type SoftIconName } from './icons';
import { SoftBird } from './Mascot';

const CARD_TOPS = ['#8ee58a', '#ffb199', '#b9a7ff', '#7fc3ff', '#ffd56d', '#ff9ab0'];

export function PracticeScreen({ model }: { model: PreviewModel }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="sf-page">
      <div className="sf-page-head">
        <SoftBird size={64} float={false} />
        <div>
          <h1 className="sf-display">Word garden</h1>
          <p>Tap a card to peek at its meaning.</p>
        </div>
      </div>
      <div className="sf-garden">
        {vocabulary.map((v, i) => {
          const isOpen = open === v.id;
          return (
            <button
              key={v.id}
              type="button"
              className="sf-card sf-wcard"
              aria-pressed={isOpen}
              onClick={() => setOpen(isOpen ? null : v.id)}
            >
              <span className="sf-wcard__top" style={{ background: CARD_TOPS[i % CARD_TOPS.length] }} />
              <span className="sf-wcard__body">
                {isOpen ? (
                  <>
                    <span className="sf-wcard__en">{v.en}</span>
                    <span className="sf-wcard__say">“{v.say}”</span>
                  </>
                ) : (
                  <span className="sf-wcard__fr" lang="fr">
                    {v.fr}
                  </span>
                )}
                <span className="sf-hearts" aria-label={`Strength ${v.strength} of 4`}>
                  {[0, 1, 2, 3].map((h) => (
                    <SIcon key={h} name="star" size={14} className={h < v.strength ? '' : 'is-off'} />
                  ))}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <button type="button" className="sf-btn sf-btn--blue sf-btn--block" onClick={() => model.actions.start(model.current.id)}>
        Water my words · 5 min
      </button>
    </div>
  );
}

export function ProgressScreen({ model }: { model: PreviewModel }) {
  const today = model.state.lessonsToday;
  const days = week.map((d) => (d.isToday ? { ...d, lessons: today } : d));
  return (
    <div className="sf-page">
      <div className="sf-page-head">
        <div>
          <h1 className="sf-display">Your week</h1>
          <p>{model.state.streak}-day streak — keep the flame warm!</p>
        </div>
      </div>
      <section className="sf-card" style={{ padding: 18 }} aria-label="Streak calendar">
        <div className="sf-week">
          {days.map((d, i) => {
            const lit = (d.lessons ?? 0) > 0;
            return (
              <div key={i} className={`sf-week__day${d.isToday ? ' is-today' : ''}`}>
                <span className={`sf-week__orb${lit ? ' is-lit' : ''}${d.lessons === null ? ' is-future' : ''}`}>
                  <SIcon name="flame" size={20} />
                </span>
                {d.short}
              </div>
            );
          })}
        </div>
      </section>
      <div className="sf-stats">
        <div className="sf-card sf-stat">
          <b>{LESSONS_BEFORE_TODAY + today}</b>
          <span>Lessons</span>
        </div>
        <div className="sf-card sf-stat">
          <b>{WORDS_LEARNED}</b>
          <span>Words</span>
        </div>
        <div className="sf-card sf-stat">
          <b>{model.state.gems}</b>
          <span>Gems</span>
        </div>
      </div>
      <section className="sf-card" style={{ padding: 18 }}>
        <div className="sf-goal__row">
          Daily goal
          <span>
            {Math.min(today, model.dailyGoal)} of {model.dailyGoal}
          </span>
        </div>
        <div className="sf-bar">
          <i style={{ width: `${Math.min(today / model.dailyGoal, 1) * 100}%` }} />
        </div>
      </section>
    </div>
  );
}

const MEDALS: { icon: SoftIconName; face: string; edge: string }[] = [
  { icon: 'star', face: 'radial-gradient(circle at 35% 30%, #ffe28c, #ffc248 70%)', edge: '#e09a1f' },
  { icon: 'flame', face: 'radial-gradient(circle at 35% 30%, #ffb199, #ff7f63 70%)', edge: '#db5c41' },
  { icon: 'chat', face: 'radial-gradient(circle at 35% 30%, #c9bcff, #9a83ff 70%)', edge: '#7056e0' },
  { icon: 'chest', face: 'radial-gradient(circle at 35% 30%, #a6d4ff, #5b8def 70%)', edge: '#3a67c7' },
];

export function ProfileScreen() {
  return (
    <div className="sf-page">
      <section className="sf-card sf-hero-card">
        <span className="sf-portrait">
          <SoftBird size={84} float={false} />
        </span>
        <div>
          <h1 className="sf-display" style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>
            {app.learner}
          </h1>
          <p style={{ margin: '2px 0 8px', fontWeight: 700, color: 'var(--sf-ink-2)' }}>{profile.handle}</p>
          <span className="sf-chip" style={{ height: 30, background: 'var(--sf-green-tint)', color: 'var(--sf-green)', boxShadow: 'none' }}>
            {app.language} · {app.level}
          </span>
        </div>
      </section>
      <section>
        <div className="sf-head" style={{ marginBottom: 14 }}>
          <h2 className="sf-display">Badges</h2>
          <span>
            {badges.filter((b) => b.earned).length}/{badges.length}
          </span>
        </div>
        <div className="sf-badges">
          {badges.map((b, i) => (
            <div key={b.id} className={`sf-medallion${b.earned ? '' : ' is-locked'}`} title={b.detail}>
              <span
                className="sf-medallion__disc"
                style={
                  b.earned
                    ? ({ background: MEDALS[i].face, '--edge': MEDALS[i].edge } as CSSProperties)
                    : ({ background: '#e9edf3', color: '#aab5c6', '--edge': '#cfd6e2' } as CSSProperties)
                }
              >
                <SIcon name={b.earned ? MEDALS[i].icon : 'lock'} size={26} />
              </span>
              {b.name}
            </div>
          ))}
        </div>
      </section>
      <section className="sf-card sf-settings" aria-label="Settings">
        <div>
          <span>Daily goal</span>
          <span>{profile.goalLabel}</span>
        </div>
        <div>
          <span>Reminder</span>
          <span>8:00</span>
        </div>
        <div>
          <span>Member since</span>
          <span>October 2026</span>
        </div>
      </section>
    </div>
  );
}
