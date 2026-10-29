import type { LessonView, PreviewModel } from '../../core/model';
import { milestones } from '../../data/sample';
import { Icon } from './icons';
import { Mascot } from './Mascot';
import { GoalRing } from './parts';

export function LessonScreen({ model, lesson }: { model: PreviewModel; lesson: LessonView }) {
  const { session, question, total, verdict } = lesson;
  if (session.result) return <ResultScreen model={model} lesson={lesson} />;

  const progress = (session.step + (session.checked ? 1 : 0)) / total;
  return (
    <div className="mn-lesson">
      <div className="mn-lesson__top">
        <button type="button" className="mn-icon-btn" aria-label="Quit lesson" onClick={model.actions.exit}>
          <Icon name="close" />
        </button>
        <div className="mn-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={session.step}>
          <i style={{ width: `${Math.max(progress * 100, 3)}%` }} />
        </div>
        <span className="mn-lesson__count">
          {session.step + 1} / {total}
        </span>
      </div>

      <div className="mn-prompt">
        <span className="mn-eyebrow">{lesson.milestone.title}</span>
        <p>{question.instruction}</p>
        <div className="mn-prompt__focus mn-serif">
          <span lang={question.focusLang}>{question.focus}</span>
          <button type="button" className="mn-icon-btn mn-icon-btn--ring" aria-label={`Hear “${question.focus}”`}>
            <Icon name="sound" size={20} />
          </button>
        </div>
      </div>

      <div className="mn-options" role="radiogroup" aria-label="Answers">
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
              className={`mn-opt${right ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}`}
              onClick={() => model.actions.pick(o.id)}
            >
              <span className="mn-opt__key">{String.fromCharCode(65 + i)}</span>
              {o.label}
              {right && <Icon name="check" size={20} className="mn-opt__mark" />}
              {wrong && <Icon name="close" size={20} className="mn-opt__mark" />}
            </button>
          );
        })}
      </div>

      {verdict ? (
        <div className={`mn-sheet mn-sheet--${verdict}`} role="status">
          <div className="mn-sheet__head">
            <span className="mn-sheet__badge">
              <Icon name={verdict === 'correct' ? 'check' : 'close'} size={20} />
            </span>
            <h3 className="mn-serif">{verdict === 'correct' ? 'Correct' : `Answer: ${lesson.answerLabel}`}</h3>
          </div>
          <p>{question.explain}</p>
          <button
            type="button"
            className={`mn-btn mn-btn--block ${verdict === 'correct' ? 'mn-btn--primary' : 'mn-btn--danger'}`}
            onClick={model.actions.next}
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="mn-lesson__foot">
          <button type="button" className="mn-btn mn-btn--primary mn-btn--block" disabled={!session.picked} onClick={model.actions.check}>
            Check
          </button>
        </div>
      )}
    </div>
  );
}

function ResultScreen({ model, lesson }: { model: PreviewModel; lesson: LessonView }) {
  const result = lesson.session.result!;
  const { state, dailyGoal } = model;
  const unlocked = result.advancedPath ? milestones[state.completed] : null;
  return (
    <div className="mn-result">
      <div className="mn-result__content">
        <span className="mn-eyebrow">Lesson complete</span>
        <div className="mn-result__mark">
          <Mascot size={84} mood="happy" />
        </div>
        <h1 className="mn-serif">Bien joué, Alex.</h1>
        <p className="mn-result__sub">{lesson.milestone.title}</p>

        <div className="mn-tiles">
          <div className="mn-tile">
            <Icon name="gem" size={20} />
            <b>+{result.gemsEarned}</b>
            <span>{state.gems} gems</span>
          </div>
          <div className="mn-tile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <GoalRing value={state.lessonsToday} total={dailyGoal} size={40} />
            <span style={{ marginTop: 8 }}>Daily goal</span>
          </div>
          <div className="mn-tile">
            <Icon name="target" size={20} />
            <b>
              {lesson.session.correct}/{lesson.total}
            </b>
            <span>correct</span>
          </div>
        </div>

        {unlocked && (
          <div className="mn-unlock">
            <Icon name="check" size={20} />
            <span>
              Unlocked
              <b>{unlocked.title}</b>
            </span>
          </div>
        )}
      </div>

      <button type="button" className="mn-btn mn-btn--primary mn-btn--block" onClick={model.actions.exit}>
        Back to path
      </button>
    </div>
  );
}
