import type { LessonView, PreviewModel } from '../../core/model';
import { milestones } from '../../data/sample';
import { Mountain } from './art';
import { PIcon } from './icons';
import { Diamonds } from './LearnScreen';
import { HeroScene } from './scenes';

export function LessonScreen({ model, lesson }: { model: PreviewModel; lesson: LessonView }) {
  const { session, question, total, verdict } = lesson;
  if (session.result) return <ResultScreen model={model} lesson={lesson} />;

  const done = session.step + (session.checked ? 1 : 0);
  return (
    <div className="lp-lesson-screen">
      <div className="lp-lesson-screen__sky" aria-hidden>
        <svg viewBox="0 0 390 120" preserveAspectRatio="xMidYMax slice">
          <Mountain x={-30} y={122} w={170} h={92} light="#b3c8da" dark="#93adc5" snow />
          <Mountain x={210} y={122} w={210} h={104} light="#b3c8da" dark="#93adc5" snow />
          <Mountain x={90} y={122} w={180} h={116} light="#9db7d0" dark="#7c99b5" snow />
        </svg>
      </div>

      <div className="lp-ltop">
        <button type="button" className="lp-square" aria-label="Quit lesson" onClick={model.actions.exit}>
          <PIcon name="close" size={20} />
        </button>
        <div className="lp-segs" role="img" aria-label={`${done} of ${total} answered`}>
          {Array.from({ length: total }, (_, i) => (
            <i key={i} className={i < done ? 'is-on' : ''} />
          ))}
        </div>
        <span className="lp-chip">
          {session.step + 1}/{total}
        </span>
      </div>

      <div className="lp-elev">
        <div className="lp-cut lp-qcard">
          <span className="lp-caps">
            {lesson.milestone.place} · {lesson.milestone.title}
          </span>
          <p>{question.instruction}</p>
          <div className="lp-focus">
            <span lang={question.focusLang}>{question.focus}</span>
            <button type="button" className="lp-square lp-square--orange" aria-label={`Hear “${question.focus}”`}>
              <PIcon name="sound" size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="lp-opts" role="radiogroup" aria-label="Answers">
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
              className={`lp-cut lp-opt${right ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}`}
              onClick={() => model.actions.pick(o.id)}
            >
              <span className="lp-opt__idx">0{i + 1}</span>
              {o.label}
              {right && <PIcon name="check" size={20} className="lp-opt__mark" />}
              {wrong && <PIcon name="close" size={20} className="lp-opt__mark" />}
            </button>
          );
        })}
      </div>

      {verdict ? (
        <div className={`lp-panel lp-panel--${verdict}`} role="status">
          <h3>
            <PIcon name={verdict === 'correct' ? 'check' : 'flag'} size={22} />
            {verdict === 'correct' ? 'Correct' : `Answer: ${lesson.answerLabel}`}
          </h3>
          <p>{question.explain}</p>
          <button type="button" className="lp-btn lp-btn--go lp-btn--block" onClick={model.actions.next}>
            Continue
            <PIcon name="arrow" size={20} />
          </button>
        </div>
      ) : (
        <div className="lp-lfoot">
          <button type="button" className="lp-btn lp-btn--go lp-btn--block" disabled={!session.picked} onClick={model.actions.check}>
            Check answer
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
  const stopsToParis = milestones.length - 1 - Math.min(state.completed, milestones.length - 1);
  return (
    <div className="lp-result">
      <section className="lp-scene">
        <HeroScene stopsToParis={stopsToParis} cheer label={false} />
        <div className="lp-banner">
          <span className="lp-banner__plate">Stop reached</span>
          <span className="lp-caps">{lesson.milestone.place}</span>
        </div>
      </section>
      <div className="lp-result__body">
        <div className="lp-tiles lp-elev">
          <div className="lp-cut lp-tile">
            <PIcon name="gem" size={20} />
            <b>+{result.gemsEarned}</b>
            <span className="lp-caps">{state.gems} gems</span>
          </div>
          <div className="lp-cut lp-tile">
            <PIcon name="star" size={20} />
            <b>
              {lesson.session.correct}/{lesson.total}
            </b>
            <span className="lp-caps">Accuracy</span>
          </div>
          <div className="lp-cut lp-tile">
            <Diamonds value={state.lessonsToday} total={dailyGoal} fresh={result.lessonsBefore} />
            <b>
              {Math.min(state.lessonsToday, dailyGoal)}/{dailyGoal}
            </b>
            <span className="lp-caps">Today</span>
          </div>
        </div>
        {unlocked && (
          <div className="lp-cut lp-next">
            <PIcon name="flag" size={20} />
            Bridge built to {unlocked.place} — “{unlocked.title}” unlocked
          </div>
        )}
        <button type="button" className="lp-btn lp-btn--go lp-btn--block" style={{ marginTop: 'auto' }} onClick={model.actions.exit}>
          Continue the journey
          <PIcon name="arrow" size={20} />
        </button>
      </div>
    </div>
  );
}
