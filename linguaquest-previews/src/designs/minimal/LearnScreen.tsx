import type { MilestoneView, PreviewModel } from '../../core/model';
import { app } from '../../data/sample';
import { Icon } from './icons';
import { Mascot } from './Mascot';
import { GoalRing, TopBar } from './parts';

const STATUS_LABEL = { completed: 'Done', current: 'Up next', locked: 'Locked' } as const;

export function LearnScreen({ model }: { model: PreviewModel }) {
  const { state, current, actions, dailyGoal, goalReached } = model;
  const done = model.milestones.filter((m) => m.status === 'completed').length;
  const left = Math.max(dailyGoal - state.lessonsToday, 0);

  return (
    <div className="mn-stack">
      <TopBar model={model} />

      <section className="mn-greet">
        <div>
          <h1 className="mn-serif">Bonjour, {app.learner}.</h1>
          <p>
            {goalReached ? (
              <>Daily goal reached. Anything more is a bonus.</>
            ) : (
              <>
                <strong>
                  {state.lessonsToday} of {dailyGoal} lessons
                </strong>{' '}
                today · {left} to go
              </>
            )}
          </p>
        </div>
        <GoalRing value={state.lessonsToday} total={dailyGoal} />
      </section>

      <section className="mn-card mn-next" aria-labelledby="mn-next-title">
        <span className="mn-next__mascot">
          <Mascot size={56} />
        </span>
        <span className="mn-eyebrow">
          Lesson {current.number} of {model.milestones.length}
        </span>
        <h2 id="mn-next-title" className="mn-serif">
          {current.title}
        </h2>
        <div className="mn-meta">
          <span>
            <Icon name="clock" size={16} />
            {current.minutes} min
          </span>
          <span>
            <Icon name="star" size={16} />
            {current.words.length} new words
          </span>
        </div>
        <ul className="mn-words" aria-label="New words">
          {current.words.map((w) => (
            <li key={w} lang="fr">
              {w}
            </li>
          ))}
        </ul>
        <div className="mn-next__actions">
          <button type="button" className="mn-btn mn-btn--primary mn-btn--block mn-btn--split" onClick={() => actions.start(current.id)}>
            {app.primaryAction}
            <Icon name="arrow" size={20} />
          </button>
          <button type="button" className="mn-btn mn-btn--quiet mn-btn--block" onClick={() => actions.setTab('practice')}>
            {app.secondaryAction}
          </button>
        </div>
      </section>

      <section aria-labelledby="mn-path-title">
        <div className="mn-section-head">
          <h2 id="mn-path-title">{app.unit}</h2>
          <span>
            {done} of {model.milestones.length}
          </span>
        </div>
        <ol className="mn-path">
          {model.milestones.map((m) => (
            <Step key={m.id} m={m} model={model} />
          ))}
        </ol>
      </section>
    </div>
  );
}

function Step({ m, model }: { m: MilestoneView; model: PreviewModel }) {
  const { actions, current } = model;
  return (
    <li className={`mn-step mn-step--${m.status}${m.selected ? ' is-selected' : ''}`}>
      <button type="button" className="mn-step__row" aria-expanded={m.selected} onClick={() => actions.select(m.id)}>
        <span className="mn-dot" aria-hidden>
          {m.status === 'completed' && <Icon name="check" size={18} />}
          {m.status === 'locked' && <Icon name="lock" size={15} />}
        </span>
        <span className="mn-step__text">
          <span className="mn-step__title">{m.title}</span>
          <span className="mn-step__sub">
            {m.minutes} min · {m.place}
          </span>
        </span>
        <span className={`mn-pill mn-pill--${m.status}`}>{STATUS_LABEL[m.status]}</span>
      </button>
      {m.selected && (
        <div className="mn-step__detail">
          {m.status === 'completed' && (
            <>
              <span>Completed · 3 of 3 correct</span>
              <button type="button" className="mn-btn mn-btn--quiet mn-btn--sm" onClick={() => actions.start(m.id)}>
                <Icon name="refresh" size={18} />
                Practice again
              </button>
            </>
          )}
          {m.status === 'current' && (
            <>
              <span>{m.words.length ? m.words.join(' · ') : 'Unit review'}</span>
              <button type="button" className="mn-btn mn-btn--primary mn-btn--sm" onClick={() => actions.start(m.id)}>
                Start
              </button>
            </>
          )}
          {m.status === 'locked' && (
            <>
              <span>Finish “{current.title}” to unlock.</span>
              <button type="button" className="mn-btn mn-btn--sm" disabled>
                Locked
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
