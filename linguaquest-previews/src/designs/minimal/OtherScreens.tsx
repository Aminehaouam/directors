import { useState } from 'react';
import type { PreviewModel } from '../../core/model';
import { app, badges, LESSONS_BEFORE_TODAY, profile, vocabulary, week, WORDS_LEARNED } from '../../data/sample';
import { Icon, type IconName } from './icons';
import { TopBar } from './parts';

function Strength({ value }: { value: number }) {
  return (
    <span className="mn-strength" role="img" aria-label={`Strength ${value} of 4`}>
      {[0, 1, 2, 3].map((i) => (
        <i key={i} className={i < value ? 'is-on' : ''} />
      ))}
    </span>
  );
}

export function PracticeScreen({ model }: { model: PreviewModel }) {
  const featured = vocabulary.filter((v) => v.featured);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = featured[index];
  const weak = vocabulary.filter((v) => v.strength <= 2).length;

  const go = (delta: number) => {
    setIndex((i) => (i + delta + featured.length) % featured.length);
    setRevealed(false);
  };

  return (
    <div className="mn-stack">
      <TopBar model={model} />
      <div>
        <h1 className="mn-page-title mn-serif">Review</h1>
        <p className="mn-muted" style={{ margin: 0 }}>
          {vocabulary.length} words · {weak} could use practice
        </p>
      </div>

      <div>
        <button type="button" className="mn-card mn-flash" aria-pressed={revealed} onClick={() => setRevealed((r) => !r)}>
          {revealed ? (
            <>
              <span className="mn-flash__en">{card.en}</span>
              <span className="mn-muted">“{card.say}” · {card.note}</span>
            </>
          ) : (
            <span className="mn-flash__word" lang="fr">
              {card.fr}
            </span>
          )}
          <span className="mn-flash__hint">{revealed ? 'Tap to hide' : 'Tap to reveal'}</span>
        </button>
        <div className="mn-flash-nav">
          <button type="button" className="mn-icon-btn" aria-label="Previous word" onClick={() => go(-1)}>
            <Icon name="chevron" className="mn-flip-x" />
          </button>
          <span className="mn-dots" aria-label={`Word ${index + 1} of ${featured.length}`}>
            {featured.map((v, i) => (
              <i key={v.id} className={i === index ? 'is-on' : ''} />
            ))}
          </span>
          <button type="button" className="mn-icon-btn" aria-label="Next word" onClick={() => go(1)}>
            <Icon name="chevron" />
          </button>
        </div>
      </div>

      <section>
        <div className="mn-section-head">
          <h2>All words</h2>
          <span>Strength</span>
        </div>
        <ul className="mn-list">
          {vocabulary.map((v) => (
            <li key={v.id}>
              <span className="mn-list__main">
                <span className="mn-list__fr" lang="fr">
                  {v.fr}
                </span>
                <span className="mn-list__en">{v.en}</span>
              </span>
              <Strength value={v.strength} />
            </li>
          ))}
        </ul>
      </section>

      <button type="button" className="mn-btn mn-btn--primary mn-btn--block" onClick={() => model.actions.start(model.current.id)}>
        Start 5-minute review
      </button>
    </div>
  );
}

export function ProgressScreen({ model }: { model: PreviewModel }) {
  const today = model.state.lessonsToday;
  const days = week.map((d) => (d.isToday ? { ...d, lessons: today } : d));
  const max = Math.max(5, ...days.map((d) => d.lessons ?? 0));
  const kpis: { icon: IconName; value: number; label: string }[] = [
    { icon: 'flame', value: model.state.streak, label: 'Day streak' },
    { icon: 'learn', value: LESSONS_BEFORE_TODAY + today, label: 'Lessons' },
    { icon: 'star', value: WORDS_LEARNED, label: 'Words learned' },
    { icon: 'gem', value: model.state.gems, label: 'Gems' },
  ];
  return (
    <div className="mn-stack">
      <TopBar model={model} />
      <h1 className="mn-page-title mn-serif">Progress</h1>
      <div className="mn-grid2">
        {kpis.map((k) => (
          <div key={k.label} className="mn-card mn-kpi">
            <Icon name={k.icon} size={20} />
            <b>{k.value}</b>
            <span>{k.label}</span>
          </div>
        ))}
      </div>
      <section className="mn-card mn-chart" aria-label="Lessons this week">
        <div className="mn-section-head" style={{ margin: 0 }}>
          <h2>This week</h2>
          <span>Best streak · 4 days</span>
        </div>
        <div className="mn-chart__bars">
          {days.map((d, i) => (
            <div
              key={i}
              className={`mn-chart__bar${d.isToday ? ' is-today' : ''}${d.lessons === null ? ' is-future' : ''}`}
              style={d.lessons === null ? undefined : { height: `${Math.max((d.lessons / max) * 100, 4)}%` }}
              title={`${d.day}: ${d.lessons ?? '—'}`}
            />
          ))}
        </div>
        <div className="mn-chart__labels">
          {days.map((d, i) => (
            <span key={i} className={d.isToday ? 'is-today' : ''}>
              {d.short}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

const BADGE_ICONS: IconName[] = ['star', 'flame', 'learn', 'gem'];

export function ProfileScreen({ model }: { model: PreviewModel }) {
  const rows: { icon: IconName; label: string; value: string }[] = [
    { icon: 'globe', label: 'Learning', value: `${app.language} · ${app.level}` },
    { icon: 'target', label: 'Daily goal', value: profile.goalLabel },
    { icon: 'bell', label: 'Reminder', value: '8:00' },
  ];
  return (
    <div className="mn-stack">
      <TopBar model={model} />
      <div className="mn-profile-head">
        <span className="mn-avatar" aria-hidden>
          A
        </span>
        <div>
          <h1 className="mn-serif">{app.learner}</h1>
          <span className="mn-muted">
            {profile.handle} · {profile.joined}
          </span>
        </div>
      </div>

      <section>
        <div className="mn-section-head">
          <h2>Badges</h2>
          <span>
            {badges.filter((b) => b.earned).length} of {badges.length}
          </span>
        </div>
        <div className="mn-badges">
          {badges.map((b, i) => (
            <div key={b.id} className={`mn-badge${b.earned ? '' : ' is-locked'}`} title={b.detail}>
              <span className="mn-badge__disc">
                <Icon name={b.earned ? BADGE_ICONS[i] : 'lock'} />
              </span>
              {b.name}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mn-section-head">
          <h2>Settings</h2>
        </div>
        <ul className="mn-list mn-card mn-settings">
          {rows.map((r) => (
            <li key={r.label}>
              <Icon name={r.icon} size={20} />
              <span className="mn-list__main" style={{ fontWeight: 600 }}>
                {r.label}
              </span>
              <span>{r.value}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
