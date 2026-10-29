import type { PreviewModel } from '../../core/model';
import { app, LESSON_REWARD } from '../../data/sample';
import { Sprite } from './Sprite';
import { Hud, Seg } from './parts';
import { BubbleTail, HeroScene, WorldMap } from './scenery';
import { CHEST, GEM, LOCK, PLAY, STAR } from './sprites';

export function LearnScreen({ model }: { model: PreviewModel }) {
  const { state, current, selected, actions, dailyGoal, goalReached } = model;
  const cleared = model.milestones.filter((m) => m.status === 'completed').length;

  return (
    <div className="px-stack">
      <Hud model={model} />

      <section className="px-hero px-frame" aria-label="Today">
        <HeroScene>
          <div className="px-bubble px-frame">
            <BubbleTail />
            <h1>Bonjour, {app.learner}!</h1>
            <p>
              Day {state.streak} of your quest. {state.lessonsToday} of {dailyGoal} lessons done today.
            </p>
          </div>
        </HeroScene>
        <div className="px-quest">
          <Sprite rows={CHEST} scale={3} />
          <div className="px-quest__text">
            <strong>{goalReached ? 'Daily quest complete!' : 'Daily quest'}</strong>
            <span className="px-label">
              {Math.min(state.lessonsToday, dailyGoal)}/{dailyGoal} lessons · chest at {dailyGoal}
            </span>
          </div>
          <Seg total={dailyGoal} filled={Math.min(state.lessonsToday, dailyGoal)} />
        </div>
      </section>

      <section className="px-card px-frame px-lesson-card" aria-labelledby="px-next">
        <span className="px-tag px-label">
          Stage {current.number} · {current.place}
        </span>
        <h2 id="px-next">{current.title}</h2>
        <ul className="px-chips" aria-label="New words">
          {current.words.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        <div className="px-lesson-card__meta px-label">
          <span>{current.minutes} min</span>
          <span>
            <Sprite rows={GEM} scale={2} /> +{LESSON_REWARD}
          </span>
          <span>3 quests</span>
        </div>
        <div className="px-lesson-card__actions">
          <button type="button" className="px-btn px-btn--block" onClick={() => actions.start(current.id)}>
            <Sprite rows={PLAY} scale={3} />
            {app.primaryAction}
          </button>
          <button type="button" className="px-btn px-btn--paper px-btn--block" onClick={() => actions.setTab('practice')}>
            {app.secondaryAction}
          </button>
        </div>
      </section>

      <section aria-labelledby="px-world">
        <div className="px-section-head">
          <h2 id="px-world">World 1 · Road to {app.destination}</h2>
          <span className="px-label">
            {cleared}/{model.milestones.length} cleared
          </span>
        </div>
        <WorldMap milestones={model.milestones} onSelect={actions.select} />

        <div className="px-dialog" aria-live="polite">
          <span className="px-label">
            Stage {selected.number} · {selected.place}
          </span>
          <strong>{selected.title}</strong>
          <span className="px-dialog__status px-label">
            {selected.status === 'completed' && (
              <>
                <Sprite rows={STAR} scale={2} /> Cleared
              </>
            )}
            {selected.status === 'current' && <>▸ You are here</>}
            {selected.status === 'locked' && (
              <>
                <Sprite rows={LOCK} scale={2} /> Clear stage {current.number} first
              </>
            )}
          </span>
          <button
            type="button"
            className={`px-btn ${selected.status === 'completed' ? 'px-btn--gold' : ''}`}
            disabled={selected.status === 'locked'}
            onClick={() => actions.start(selected.id)}
          >
            {selected.status === 'locked' ? 'Locked' : selected.status === 'completed' ? 'Replay' : 'Play'}
          </button>
        </div>
      </section>
    </div>
  );
}
