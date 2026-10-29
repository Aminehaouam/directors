import { useLayoutEffect, useRef } from 'react';
import type { MilestoneView, PreviewModel } from '../../core/model';
import { app, LESSON_REWARD } from '../../data/sample';
import { SIcon } from './icons';
import { SoftBird } from './Mascot';
import { WorldScene } from './World';

export function Hud({ model }: { model: PreviewModel }) {
  return (
    <div className="sf-hud">
      <span className="sf-chip">
        <span className="sf-flag" aria-hidden>
          <i style={{ background: '#3d63c9' }} />
          <i style={{ background: '#fff' }} />
          <i style={{ background: '#ef5a4c' }} />
        </span>
        {app.language}
      </span>
      <span className="sf-chips">
        <span className="sf-chip sf-chip--flame" aria-label={`${model.state.streak} day streak`}>
          <SIcon name="flame" size={20} />
          {model.state.streak}
        </span>
        <span className="sf-chip sf-chip--gem" aria-label={`${model.state.gems} gems`}>
          <SIcon name="gem" size={20} />
          {model.state.gems}
        </span>
      </span>
    </div>
  );
}

export function LearnScreen({ model }: { model: PreviewModel }) {
  const { state, current, actions, dailyGoal, goalReached } = model;
  const pct = Math.min(state.lessonsToday / dailyGoal, 1) * 100;

  return (
    <>
      <section className="sf-scene" aria-label="Your world">
        <WorldScene />
        <Hud model={model} />
        <div className="sf-greet">
          <h1 className="sf-display">Bonjour, {app.learner}!</h1>
          <p>
            {app.level} · Day {state.streak} streak
          </p>
        </div>
      </section>

      <div className="sf-sheet">
        <div className="sf-goal">
          <span className="sf-goal__icon">
            <SIcon name="chest" size={26} />
          </span>
          <div className="sf-goal__body">
            <div className="sf-goal__row">
              {goalReached ? 'Daily goal reached!' : 'Today’s goal'}
              <span>
                {Math.min(state.lessonsToday, dailyGoal)} of {dailyGoal} lessons
              </span>
            </div>
            <div className="sf-bar" role="progressbar" aria-valuemin={0} aria-valuemax={dailyGoal} aria-valuenow={state.lessonsToday}>
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <section className="sf-card sf-lesson" aria-labelledby="sf-next">
          <div className="sf-lesson__head">
            <span className="sf-medal">
              <SIcon name="chat" size={30} />
            </span>
            <div>
              <span className="sf-kicker">
                Lesson {current.number} · {current.place}
              </span>
              <h2 id="sf-next" className="sf-display">
                {current.title}
              </h2>
            </div>
          </div>
          <ul className="sf-words" aria-label="New words">
            {current.words.map((w) => (
              <li key={w} lang="fr">
                {w}
              </li>
            ))}
          </ul>
          <div className="sf-meta">
            <span>{current.minutes} min</span>
            <span>
              <SIcon name="gem" size={16} /> +{LESSON_REWARD} gems
            </span>
          </div>
          <button type="button" className="sf-btn sf-btn--go sf-btn--block" onClick={() => actions.start(current.id)}>
            {app.primaryAction}
            <SIcon name="play" size={20} />
          </button>
          <button type="button" className="sf-btn sf-btn--soft sf-btn--block" onClick={() => actions.setTab('practice')}>
            {app.secondaryAction}
          </button>
        </section>

        <section aria-labelledby="sf-journey">
          <div className="sf-head">
            <h2 id="sf-journey" className="sf-display">
              Journey to {app.destination}
            </h2>
            <span>
              {model.milestones.filter((m) => m.status === 'completed').length}/{model.milestones.length} stops
            </span>
          </div>
          <Journey model={model} />
          <Detail model={model} m={model.selected} />
        </section>
      </div>
    </>
  );
}

const STEP = 100;
const PAD = 14;
const posOf = (i: number) => ({ x: PAD + i * STEP, y: i % 2 ? 46 : 14 });

function Journey({ model }: { model: PreviewModel }) {
  const ref = useRef<HTMLDivElement>(null);
  const currentIndex = model.current.index;

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollLeft = Math.max(0, posOf(currentIndex).x - STEP * 1.2);
  }, [currentIndex]);

  const width = PAD * 2 + model.milestones.length * STEP;
  const centers = model.milestones.map((_, i) => {
    const p = posOf(i);
    return { x: p.x + 48, y: p.y + 32 };
  });

  return (
    <div className="sf-journey" ref={ref}>
      <div className="sf-journey__track" style={{ width }}>
        <svg className="sf-journey__path" width={width} height={156} aria-hidden>
          {centers.slice(0, -1).map((a, i) => {
            const b = centers[i + 1];
            const done = i + 1 <= currentIndex;
            const d = `M${a.x} ${a.y} C${a.x + 50} ${a.y}, ${b.x - 50} ${b.y}, ${b.x} ${b.y}`;
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={done ? '#ffd27a' : '#e6d9c4'}
                strokeWidth={done ? 8 : 5}
                strokeLinecap="round"
                strokeDasharray={done ? undefined : '2 12'}
              />
            );
          })}
        </svg>
        {model.milestones.map((m, i) => (
          <Stone key={m.id} m={m} pos={posOf(i)} onSelect={model.actions.select} />
        ))}
      </div>
    </div>
  );
}

function Stone({ m, pos, onSelect }: { m: MilestoneView; pos: { x: number; y: number }; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      className={`sf-stone sf-stone--${m.status}${m.selected ? ' is-selected' : ''}`}
      style={{ left: pos.x, top: pos.y }}
      aria-pressed={m.selected}
      aria-label={`${m.title}, ${m.status}`}
      onClick={() => onSelect(m.id)}
    >
      <span className="sf-stone__btn">
        {m.status === 'completed' && <SIcon name="star" size={30} />}
        {m.status === 'current' && <SIcon name="play" size={28} />}
        {m.status === 'locked' && <SIcon name={m.index === 5 ? 'chest' : 'lock'} size={26} />}
        {m.status === 'current' && (
          <span className="sf-stone__avatar" aria-hidden>
            <SoftBird size={58} float={false} />
          </span>
        )}
      </span>
      <span className="sf-stone__label">{m.place}</span>
    </button>
  );
}

function Detail({ model, m }: { model: PreviewModel; m: MilestoneView }) {
  const { actions, current } = model;
  return (
    <div className="sf-card sf-detail" key={m.id} aria-live="polite">
      <div className="sf-detail__text">
        <strong>{m.title}</strong>
        <span>
          {m.status === 'completed' && `Completed · ${m.place}`}
          {m.status === 'current' && `You’re here · ${m.minutes} min`}
          {m.status === 'locked' && `Unlocks after “${current.title}”`}
        </span>
      </div>
      {m.status === 'completed' && (
        <button type="button" className="sf-btn sf-btn--soft sf-btn--sm" onClick={() => actions.start(m.id)}>
          Replay
        </button>
      )}
      {m.status === 'current' && (
        <button type="button" className="sf-btn sf-btn--go sf-btn--sm" onClick={() => actions.start(m.id)}>
          Start
        </button>
      )}
      {m.status === 'locked' && (
        <button type="button" className="sf-btn sf-btn--sm" disabled>
          <SIcon name="lock" size={16} /> Locked
        </button>
      )}
    </div>
  );
}
