import type { LessonView, PreviewModel } from '../../core/model';
import { Sprite } from './Sprite';
import { Bird, Seg } from './parts';
import { BIRD_CHEER, CHEST, CHECK, CLOSE, CLOUD, GEM, PLAY, SPEAKER, STAR, STAR_EMPTY } from './sprites';
import { milestones } from '../../data/sample';

export function LessonScreen({ model, lesson }: { model: PreviewModel; lesson: LessonView }) {
  const { session, question, total, verdict } = lesson;
  if (session.result) return <ResultScreen model={model} lesson={lesson} />;

  const done = session.step + (session.checked ? 1 : 0);
  return (
    <div className="px-lesson">
      <div className="px-lesson__top">
        <button type="button" className="px-icon-btn px-frame" aria-label="Quit lesson" onClick={model.actions.exit}>
          <Sprite rows={CLOSE} scale={3} />
        </button>
        <Seg total={total} filled={done} wide />
        <span className="px-label" aria-label={`Question ${session.step + 1} of ${total}`}>
          {session.step + 1}/{total}
        </span>
      </div>

      <div className="px-lesson__ask">
        <Bird scale={5} />
        <div className="px-bubble-static px-frame">
          <span className="px-label">{question.instruction}</span>
          <div className="px-focus">
            <button type="button" className="px-icon-btn px-frame" aria-label={`Hear “${question.focus}”`}>
              <Sprite rows={SPEAKER} scale={2} />
            </button>
            <span lang={question.focusLang}>{question.focus}</span>
          </div>
        </div>
      </div>

      <div className="px-options" role="radiogroup" aria-label="Answers">
        {question.options.map((o, i) => {
          const isPicked = session.picked === o.id;
          const reveal = session.checked && (o.id === question.answerId ? ' is-right' : isPicked ? ' is-wrong' : '');
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={session.checked}
              className={`px-opt${reveal || ''}`}
              onClick={() => model.actions.pick(o.id)}
            >
              <span className="px-opt__cursor">
                <Sprite rows={PLAY} scale={2} />
              </span>
              <span className="px-opt__key">{String.fromCharCode(65 + i)}</span>
              {o.label}
            </button>
          );
        })}
      </div>

      {verdict ? (
        <div className={`px-feedback px-feedback--${verdict}`} role="status">
          <div className="px-feedback__head">
            {verdict === 'correct' ? (
              <>
                <Sprite rows={STAR} scale={2} /> Très bien!
              </>
            ) : (
              <>Not quite — it’s “{lesson.answerLabel}”</>
            )}
          </div>
          <p>{question.explain}</p>
          <button type="button" className={`px-btn px-btn--block ${verdict === 'wrong' ? 'px-btn--flame' : ''}`} onClick={model.actions.next}>
            Continue
          </button>
        </div>
      ) : (
        <div className="px-lesson__foot">
          <button type="button" className="px-btn px-btn--block" disabled={!session.picked} onClick={model.actions.check}>
            <Sprite rows={CHECK} scale={3} /> Check
          </button>
        </div>
      )}
    </div>
  );
}

function ResultScreen({ model, lesson }: { model: PreviewModel; lesson: LessonView }) {
  const result = lesson.session.result!;
  const { state, dailyGoal } = model;
  const stars = lesson.session.correct;
  const unlocked = result.advancedPath ? milestones[state.completed] : null;
  return (
    <div className="px-result">
      <div className="px-result__sky">
        <span className="px-cloud-a px-cloud">
          <Sprite rows={CLOUD} scale={4} />
        </span>
        <span className="px-cloud-b px-cloud px-cloud--slow">
          <Sprite rows={CLOUD} scale={3} />
        </span>
        <div className="px-result__banner px-frame">Stage clear!</div>
        <div className="px-result__stars" aria-label={`${stars} of ${lesson.total} correct`}>
          {Array.from({ length: lesson.total }, (_, i) => (
            <Sprite key={i} rows={i < stars ? STAR : STAR_EMPTY} scale={4} />
          ))}
        </div>
        <div className="px-result__hero">
          <Sprite rows={BIRD_CHEER} scale={5} label="Pip cheering" />
        </div>
      </div>

      <div className="px-result__body">
        <div className="px-result__panel px-card px-frame">
          <div className="px-reward-row">
            <Sprite rows={GEM} scale={3} />
            <strong>Gems</strong>
            <span className="px-num px-counter is-bump">
              {state.gems - result.gemsEarned} → {state.gems}
            </span>
          </div>
          <div className="px-reward-row">
            <Sprite rows={CHEST} scale={3} />
            <strong>Daily quest</strong>
            <span className="px-num">
              {Math.min(state.lessonsToday, dailyGoal)}/{dailyGoal}
            </span>
          </div>
          <Seg total={dailyGoal} filled={Math.min(state.lessonsToday, dailyGoal)} fresh={result.lessonsBefore} wide />
          {unlocked && (
            <div className="px-unlock">
              <Sprite rows={PLAY} scale={2} /> New stage unlocked: <b>{unlocked.title}</b>
            </div>
          )}
        </div>

        <button type="button" className="px-btn px-btn--block" style={{ marginTop: 16 }} onClick={model.actions.exit}>
          Back to map
        </button>
      </div>
    </div>
  );
}
