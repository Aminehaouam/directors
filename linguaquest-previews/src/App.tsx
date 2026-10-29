import { useEffect, useState } from 'react';
import { usePreviewStore } from './core/store';
import type { DesignId } from './core/types';
import { DIRECTIONS } from './designs/registry';
import { CompareView, type CompareLayout } from './shell/CompareView';
import { DirectionBrief, DirectionSystem } from './shell/DirectionNotes';
import { DirectionTabs } from './shell/DirectionTabs';
import { PhoneFrame } from './shell/PhoneFrame';
import { useHashRoute, type View } from './shell/useHashRoute';

export default function App() {
  const [route, navigate] = useHashRoute(DIRECTIONS[0].id);
  const [linked, setLinked] = useState(true);
  const [layout, setLayout] = useState<CompareLayout>(() => (window.innerWidth >= 1280 ? 'row' : 'grid'));
  const isCompare = route.view === 'compare';
  const { models, align, resetAll } = usePreviewStore(linked && isCompare);

  const direction = DIRECTIONS.find((d) => d.id === route.design) ?? DIRECTIONS[0];

  const setView = (view: View) => {
    if (view === 'compare' && linked) align(route.design);
    navigate({ view, design: route.design });
  };
  const focus = (id: DesignId) => navigate({ view: 'focus', design: id });
  const toggleLinked = () => {
    if (!linked) align(route.design);
    setLinked(!linked);
  };

  // 1–4 pick a direction, C toggles compare.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest('input, textarea, [contenteditable]')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= DIRECTIONS.length) focus(DIRECTIONS[n - 1].id);
      else if (e.key.toLowerCase() === 'c') setView(isCompare ? 'focus' : 'compare');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="sh-page">
      <header className="sh-header">
        <div className="sh-header__top">
          <p className="sh-mono sh-eyebrow">
            LinguaQuest <span aria-hidden>—</span> Visual direction review · Round 1
          </p>
          <div className="sh-toolbar">
            <div className="sh-seg" role="group" aria-label="View">
              <button type="button" aria-pressed={!isCompare} onClick={() => setView('focus')}>
                Focus
              </button>
              <button type="button" aria-pressed={isCompare} onClick={() => setView('compare')}>
                Compare all 4
              </button>
            </div>
            <button type="button" className="sh-btn" onClick={resetAll}>
              Reset demo
            </button>
          </div>
        </div>
        <h1 className="sh-title">Choose Your Learning World</h1>
        <p className="sh-subtitle">Four visual directions. One language-learning adventure.</p>
      </header>

      <DirectionTabs directions={DIRECTIONS} active={isCompare ? null : direction.id} onSelect={focus} />

      {isCompare ? (
        <>
          <div className="sh-compare-bar">
            <p className="sh-compare-bar__note">
              Same content, same state machine. {linked ? 'Phones are linked: tap one and all four follow.' : 'Phones run independently.'}
            </p>
            <div className="sh-toolbar">
              <button type="button" className="sh-btn" aria-pressed={linked} onClick={toggleLinked}>
                <span className="sh-switch" aria-hidden />
                Link phones
              </button>
              <div className="sh-seg" role="group" aria-label="Layout">
                <button type="button" aria-pressed={layout === 'row'} onClick={() => setLayout('row')}>
                  4 across
                </button>
                <button type="button" aria-pressed={layout === 'grid'} onClick={() => setLayout('grid')}>
                  2 × 2
                </button>
              </div>
            </div>
          </div>
          <CompareView directions={DIRECTIONS} models={models} layout={layout} onFocus={focus} />
        </>
      ) : (
        <section
          id="sh-stage"
          className="sh-focus"
          role="tabpanel"
          aria-labelledby={`sh-tab-${direction.id}`}
          key={direction.id}
        >
          <DirectionBrief d={direction} />
          <div className="sh-focus__phone">
            <PhoneFrame tone={direction.statusTone} label={`${direction.name} prototype`} fluid>
              <direction.App model={models[direction.id]} />
            </PhoneFrame>
            <p className="sh-mono sh-caption">Interactive prototype · mock data</p>
          </div>
          <DirectionSystem d={direction} />
        </section>
      )}

      <footer className="sh-footer">
        <p>
          Prototype for a visual decision — no backend, accounts or real lessons. Shortcuts: <kbd>1</kbd>–<kbd>4</kbd> switch direction, <kbd>C</kbd> toggles
          compare.
        </p>
      </footer>
    </div>
  );
}
