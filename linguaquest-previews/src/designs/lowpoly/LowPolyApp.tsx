import '@fontsource/chakra-petch/600.css';
import '@fontsource/chakra-petch/700.css';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import './lowpoly.css';
import { TABS, type TabId } from '../../core/model';
import type { DesignProps } from '../../core/types';
import { useScrolled } from '../../core/useScrolled';
import { PolyBird } from './art';
import { PIcon, type PolyIconName } from './icons';
import { LearnScreen } from './LearnScreen';
import { LessonScreen } from './LessonScreen';
import { PracticeScreen, ProfileScreen, ProgressScreen } from './OtherScreens';

const NAV_ICONS: Record<TabId, PolyIconName> = {
  learn: 'learn',
  practice: 'practice',
  progress: 'progress',
  profile: 'profile',
};

export function LowPolyApp({ model }: DesignProps) {
  const { state, lesson } = model;
  const { scrolled, onScroll } = useScrolled(`${state.tab}:${lesson ? 1 : 0}`);
  if (lesson) {
    return (
      <div className="lp-app">
        <LessonScreen model={model} lesson={lesson} />
      </div>
    );
  }
  return (
    <div className="lp-app" data-scrolled={scrolled}>
      <main className="lp-scroll" key={state.tab} onScroll={onScroll}>
        {state.tab === 'learn' && <LearnScreen model={model} />}
        {state.tab === 'practice' && <PracticeScreen model={model} />}
        {state.tab === 'progress' && <ProgressScreen model={model} />}
        {state.tab === 'profile' && <ProfileScreen />}
      </main>
      <nav className="lp-nav" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="lp-nav__item"
            aria-current={state.tab === t.id ? 'page' : undefined}
            onClick={() => model.actions.setTab(t.id)}
          >
            <PIcon name={NAV_ICONS[t.id]} />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function LowPolyThumb() {
  return <PolyBird size={60} />;
}
