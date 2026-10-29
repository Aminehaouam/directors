import type { MilestoneView, PreviewModel } from '../../core/model';
import { app, LESSON_REWARD } from '../../data/sample';
import { PIcon } from './icons';
import { HeroScene, ROUTE_H, ROUTE_POS, ROUTE_W, RouteArt } from './scenes';

const pad = (n: number) => String(n).padStart(2, '0');

export function Hud({ model }: { model: PreviewModel }) {
  return (
    <div className="lp-hud">
      <span className="lp-chip">
        {app.languageCode} · {app.level}
      </span>
      <span className="lp-hud__group">
        <span className="lp-chip" aria-label={`${model.state.streak} day streak`}>
          <PIcon name="flame" size={17} className="lp-flame" />
          {model.state.streak}
        </span>
        <span className="lp-chip" aria-label={`${model.state.gems} gems`}>
          <PIcon name="gem" size={17} className="lp-gem" />
          {model.state.gems}
        </span>
      </span>
    </div>
  );
}

export function Diamonds({ value, total, fresh = -1 }: { value: number; total: number; fresh?: number }) {
  return (
    <span className="lp-diamonds" role="img" aria-label={`${Math.min(value, total)} of ${total} lessons today`}>
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={`${i < value ? 'is-on' : ''}${i === fresh ? ' is-new' : ''}`} />
      ))}
    </span>
  );
}

export function LearnScreen({ model }: { model: PreviewModel }) {
  const { state, current, actions, dailyGoal, goalReached } = model;
  const total = model.milestones.length;
  const stopsToParis = total - 1 - current.index;

  return (
    <>
      <section className="lp-scene" aria-label="Expedition map">
        <HeroScene stopsToParis={stopsToParis} />
        <Hud model={model} />
        <div className="lp-greet">
          <span className="lp-caps">Day {state.streak} · Expedition French</span>
          <h1>Bonjour, {app.learner}</h1>
          <div className="lp-route-mini">
            <Diamonds value={state.lessonsToday} total={dailyGoal} />
            <span className="lp-caps">{goalReached ? 'Daily route done' : `Today ${state.lessonsToday}/${dailyGoal}`}</span>
          </div>
        </div>
      </section>

      <div className="lp-content">
        <div className="lp-elev">
          <section className="lp-cut" aria-labelledby="lp-next">
            <header className="lp-lesson__bar">
              <span className="lp-caps">
                Current stop {pad(current.number)}/{pad(total)}
              </span>
              <span className="lp-caps">{current.place}</span>
            </header>
            <div className="lp-lesson__body">
              <h2 id="lp-next">{current.title}</h2>
              <ul className="lp-words" aria-label="New words">
                {current.words.map((w) => (
                  <li key={w} lang="fr">
                    {w}
                  </li>
                ))}
              </ul>
              <div className="lp-meta">
                <span>
                  <PIcon name="clock" size={16} />
                  {current.minutes} min
                </span>
                <span>
                  <PIcon name="gem" size={16} />+{LESSON_REWARD} gems
                </span>
              </div>
              <div className="lp-actions">
                <button type="button" className="lp-btn lp-btn--go lp-btn--block" onClick={() => actions.start(current.id)}>
                  {app.primaryAction}
                  <PIcon name="arrow" size={20} />
                </button>
                <button type="button" className="lp-cut lp-btn lp-btn--ghost lp-btn--block" onClick={() => actions.setTab('practice')}>
                  {app.secondaryAction}
                </button>
              </div>
            </div>
          </section>
        </div>

        <section aria-labelledby="lp-route">
          <div className="lp-head">
            <h2 id="lp-route">Route to {app.destination}</h2>
            <span className="lp-caps">
              {model.milestones.filter((m) => m.status === 'completed').length}/{total} stops
            </span>
          </div>
          <div className="lp-route">
            <RouteArt milestones={model.milestones} />
            {model.milestones.map((m, i) => (
              <Stop key={m.id} m={m} i={i} onSelect={actions.select} />
            ))}
          </div>
          <div className="lp-elev" style={{ marginTop: 34 }}>
            <StopDetail model={model} m={model.selected} />
          </div>
        </section>
      </div>
    </>
  );
}

function Stop({ m, i, onSelect }: { m: MilestoneView; i: number; onSelect: (id: string) => void }) {
  const [x, y] = ROUTE_POS[i];
  return (
    <button
      type="button"
      className={`lp-stop lp-stop--${m.status}${m.selected ? ' is-selected' : ''}`}
      style={{ left: `${(x / ROUTE_W) * 100}%`, top: `${(y / ROUTE_H) * 100}%` }}
      aria-pressed={m.selected}
      aria-label={`Stop ${m.number}, ${m.place}: ${m.title}, ${m.status}`}
      onClick={() => onSelect(m.id)}
    >
      <span className="lp-stop__label">
        <span className="lp-hexnum">
          {m.status === 'completed' ? <PIcon name="check" size={12} /> : m.status === 'locked' ? <PIcon name="lock" size={11} /> : pad(m.number)}
        </span>
        {m.place}
      </span>
    </button>
  );
}

function StopDetail({ model, m }: { model: PreviewModel; m: MilestoneView }) {
  const { actions, current } = model;
  return (
    <div className="lp-cut lp-detail" aria-live="polite">
      <div className="lp-detail__text">
        <span className="lp-caps">
          Stop {pad(m.number)} · {m.place}
        </span>
        <strong>{m.title}</strong>
        <span>
          {m.status === 'completed' && 'Reached · bridge built'}
          {m.status === 'current' && `You are here · ${m.minutes} min`}
          {m.status === 'locked' && `Reach ${current.place} first`}
        </span>
      </div>
      {m.status === 'locked' ? (
        <button type="button" className="lp-btn lp-btn--sm" disabled>
          <PIcon name="lock" size={16} /> Locked
        </button>
      ) : (
        <button
          type="button"
          className={`lp-btn lp-btn--sm ${m.status === 'current' ? 'lp-btn--go' : 'lp-cut lp-btn--ghost'}`}
          onClick={() => actions.start(m.id)}
        >
          {m.status === 'current' ? 'Go' : 'Revisit'}
        </button>
      )}
    </div>
  );
}
