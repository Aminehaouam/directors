import type { LessonView, PreviewModel } from '../../core/model';
import { milestones } from '../../data/sample';
import { SIcon } from './icons';
import { SoftBird } from './Mascot';
import { WorldScene } from './World';

export function LessonScreen({ model, lesson }: { model: PreviewModel; lesson: LessonView }) {
  const { session, question, total, verdict } = lesson;
  if (session.result) return <ResultScreen model={model} lesson={lesson} />;

  const pct = ((session.step + (session.checked ? 1 : 0)) / total) * 100;
  return (
    <div className="sf-lesson-screen">
      <div className="sf-lesson-top">
        <button type="button" className="sf-round" aria-label="Quit lesson" onClick={model.actions.exit}>
          <SIcon name="close" size={20} />
        </button>
        <div className="sf-bar sf-bar--green" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={session.step}>
          <i style={{ width: `${Math.max(pct, 6)}%` }} />
        </div>
        <span className="sf-chip sf-chip--gem" style={{ height: 34 }}>
          <SIcon name="gem" size={18} />
          {model.state.gems}
        </span>
      </div>

      <div className="sf-ask">
        <SoftBird size={104} mood={verdict === 'correct' ? 'cheer' : 'idle'} />
        <div className="sf-bubble">
          <p>{question.instruction}</p>
          <div className="sf-bubble__focus sf-display">
            <span lang={question.focusLang}>{question.focus}</span>
            <button type="button" className="sf-round sf-round--lilac" aria-label={`Hear “${question.focus}”`}>
              <SIcon name="sound" size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="sf-tiles" role="radiogroup" aria-label="Answers">
        {question.options.map((o, i) => {
          const picked = session.picked === o.id;
          const right = session.checked && o.id === question.answerId;
          const wrong = session.checked && picked && !right;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={picked}
              disabled={session.checked}
              className={`sf-tile${right ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}`}
              onClick={() => model.actions.pick(o.id)}
            >
              <span className="sf-tile__key">{i + 1}</span>
              {o.label}
            </button>
          );
        })}
      </div>

      {verdict ? (
        <div className={`sf-feedback sf-feedback--${verdict}`} role="status">
          <div className="sf-feedback__head">
            <SIcon name={verdict === 'correct' ? 'check' : 'close'} size={26} />
            <h3 className="sf-display">{verdict === 'correct' ? 'Magnifique!' : `It’s “${lesson.answerLabel}”`}</h3>
          </div>
          <p>{question.explain}</p>
          <button type="button" className={`sf-btn sf-btn--block ${verdict === 'correct' ? 'sf-btn--go' : 'sf-btn--coral'}`} onClick={model.actions.next}>
            Continue
          </button>
        </div>
      ) : (
        <div className="sf-foot">
          <button type="button" className="sf-btn sf-btn--go sf-btn--block" disabled={!session.picked} onClick={model.actions.check}>
            Check
          </button>
        </div>
      )}
    </div>
  );
}

const CONFETTI = ['#ffc248', '#ff7f63', '#9a83ff', '#49c164', '#5b8def', '#ff9ab0'];

function ResultScreen({ model, lesson }: { model: PreviewModel; lesson: LessonView }) {
  const result = lesson.session.result!;
  const { state, dailyGoal } = model;
  const unlocked = result.advancedPath ? milestones[state.completed] : null;
  const pct = Math.min(state.lessonsToday / dailyGoal, 1) * 100;
  return (
    <div className="sf-result">
      <div className="sf-result__scene">
        <WorldScene birdMood="cheer" />
        <div className="sf-confetti" aria-hidden>
          {Array.from({ length: 14 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 37) % 100}%`,
                background: CONFETTI[i % CONFETTI.length],
                animationDelay: `${(i % 5) * 0.18}s`,
                borderRadius: i % 3 === 0 ? '50%' : undefined,
              }}
            />
          ))}
        </div>
        <div className="sf-result__title">
          <h1 className="sf-display">Lesson complete!</h1>
          <p>
            {lesson.session.correct} of {lesson.total} right · {lesson.milestone.title}
          </p>
        </div>
      </div>

      <div className="sf-result__body">
        <div className="sf-rewards">
          <div className="sf-card sf-reward">
            <span className="sf-reward__icon" style={{ background: 'var(--sf-lilac-tint)', color: 'var(--sf-lilac)' }}>
              <SIcon name="gem" size={22} />
            </span>
            <b>+{result.gemsEarned}</b>
            <span>{state.gems} gems total</span>
          </div>
          <div className="sf-card sf-reward">
            <span className="sf-reward__icon" style={{ background: '#fff1d6', color: '#e39a2a' }}>
              <SIcon name="chest" size={22} />
            </span>
            <b>
              {Math.min(state.lessonsToday, dailyGoal)}/{dailyGoal}
            </b>
            <div className="sf-bar" style={{ height: 10 }}>
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
        {unlocked && (
          <div className="sf-unlock">
            <SIcon name="star" size={22} /> New stop unlocked: {unlocked.place} · {unlocked.title}
          </div>
        )}
        <button type="button" className="sf-btn sf-btn--go sf-btn--block" style={{ marginTop: 'auto' }} onClick={model.actions.exit}>
          Back to my world
        </button>
      </div>
    </div>
  );
}

