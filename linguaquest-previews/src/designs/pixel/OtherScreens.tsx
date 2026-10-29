import { useState } from 'react';
import type { PreviewModel } from '../../core/model';
import { app, badges, LESSONS_BEFORE_TODAY, profile, vocabulary, week, WORDS_LEARNED } from '../../data/sample';
import { Sprite } from './Sprite';
import { Hud } from './parts';
import { BIRD, CHEST, FLAME, GEM, HEART, PLAY, STAR, type SpriteRows } from './sprites';

export function PracticeScreen({ model }: { model: PreviewModel }) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="px-stack">
      <Hud model={model} />
      <div>
        <h1 className="px-page-title">Word bag</h1>
        <p className="px-page-sub">Tap a card to flip it. Weak words glow less.</p>
      </div>
      <div className="px-bag">
        {vocabulary.map((v) => {
          const isFlipped = flipped.has(v.id);
          return (
            <button
              key={v.id}
              type="button"
              className={`px-word px-frame${isFlipped ? ' is-flipped' : ''}`}
              aria-pressed={isFlipped}
              onClick={() => toggle(v.id)}
            >
              {v.featured && <span className="px-tag px-tag--sky px-label">New</span>}
              {isFlipped ? (
                <>
                  <span className="px-word__en">{v.en}</span>
                  <span className="px-word__say">“{v.say}”</span>
                </>
              ) : (
                <span className="px-word__fr" lang="fr">
                  {v.fr}
                </span>
              )}
              <span className="px-word__foot">
                <span className="px-pips" aria-label={`Strength ${v.strength} of 4`}>
                  {[0, 1, 2, 3].map((i) => (
                    <i key={i} className={i < v.strength ? 'is-on' : ''} />
                  ))}
                </span>
                <span className="px-label">{isFlipped ? 'Back' : 'Flip'}</span>
              </span>
            </button>
          );
        })}
      </div>
      <button type="button" className="px-btn px-btn--sky px-btn--block" onClick={() => model.actions.start(model.current.id)}>
        <Sprite rows={PLAY} scale={3} /> Start review · 6 words
      </button>
    </div>
  );
}

export function ProgressScreen({ model }: { model: PreviewModel }) {
  const today = model.state.lessonsToday;
  const days = week.map((d) => (d.isToday ? { ...d, lessons: today } : d));
  const max = 5;
  return (
    <div className="px-stack">
      <Hud model={model} />
      <h1 className="px-page-title">Stats</h1>

      <section className="px-card px-frame" aria-label="Streak">
        <div className="px-reward-row" style={{ marginBottom: 12 }}>
          <Sprite rows={FLAME} scale={3} />
          <strong style={{ fontSize: 20 }}>{model.state.streak}-day streak</strong>
          <span className="px-label">Best: 4</span>
        </div>
        <div className="px-week">
          {days.map((d, i) => {
            const lit = d.lessons !== null && d.lessons > 0;
            return (
              <div key={i} className="px-week__day">
                <span
                  className={`px-week__cell${lit ? ' is-lit' : ''}${d.isToday ? ' is-today' : ''}${d.lessons === null ? ' is-future' : ''}`}
                  aria-label={`${d.day}: ${d.lessons ?? 'upcoming'}`}
                >
                  {lit && <Sprite rows={FLAME} scale={2} />}
                </span>
                <span className="px-label">{d.short}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-card px-frame" aria-label="Lessons this week">
        <div className="px-section-head">
          <h2>Lessons this week</h2>
          <span className="px-label">1 block = 1 lesson</span>
        </div>
        <div className="px-bars">
          {days.map((d, i) => (
            <div key={i} className={`px-bars__col${d.isToday ? ' is-today' : ''}`}>
              {Array.from({ length: Math.min(d.lessons ?? 0, max) }, (_, j) => (
                <span key={j} className="px-bars__block" />
              ))}
            </div>
          ))}
        </div>
        <div className="px-bars__labels px-label">
          {days.map((d, i) => (
            <span key={i}>{d.short}</span>
          ))}
        </div>
      </section>

      <div className="px-statgrid">
        <Stat icon={STAR} value={LESSONS_BEFORE_TODAY + today} label="Lessons" />
        <Stat icon={HEART} value={WORDS_LEARNED} label="Words" />
        <Stat icon={GEM} value={model.state.gems} label="Gems" />
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: SpriteRows; value: number; label: string }) {
  return (
    <div className="px-stat px-card px-frame">
      <Sprite rows={icon} scale={2} />
      <span className="px-stat__num">{value}</span>
      <span className="px-label">{label}</span>
    </div>
  );
}

const BADGE_ART: SpriteRows[] = [STAR, FLAME, GEM, CHEST];

export function ProfileScreen({ model }: { model: PreviewModel }) {
  return (
    <div className="px-stack">
      <Hud model={model} />
      <section className="px-card px-frame px-player">
        <div className="px-player__portrait px-frame">
          <Sprite rows={BIRD} scale={4} />
        </div>
        <div>
          <h2>{app.learner}</h2>
          <span className="px-label" style={{ display: 'block', marginBottom: 6 }}>
            {profile.handle}
          </span>
          <span className="px-tag px-label">
            Lv. {app.level} · {app.language}
          </span>
        </div>
      </section>

      <section>
        <div className="px-section-head">
          <h2>Badges</h2>
          <span className="px-label">{badges.filter((b) => b.earned).length}/{badges.length}</span>
        </div>
        <div className="px-badges">
          {badges.map((b, i) => (
            <div key={b.id} className={`px-badge${b.earned ? '' : ' is-locked'}`} title={b.detail}>
              <span className="px-badge__slot px-frame">
                <Sprite rows={BADGE_ART[i]} scale={3} />
              </span>
              <span className="px-label">{b.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-card px-frame px-rows" aria-label="Settings">
        <div className="px-row">
          <span>Daily goal</span>
          <span>{profile.goalLabel}</span>
        </div>
        <div className="px-row">
          <span>Reminder</span>
          <span>8:00</span>
        </div>
        <div className="px-row">
          <span>Learning</span>
          <span>
            {app.language} · {app.level}
          </span>
        </div>
        <div className="px-row">
          <span>Member since</span>
          <span>Oct 2026</span>
        </div>
      </section>
    </div>
  );
}
