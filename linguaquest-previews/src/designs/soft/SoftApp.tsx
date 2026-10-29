import '@fontsource-variable/fredoka';
import '@fontsource-variable/nunito';
import './soft.css';
import { TABS, type TabId } from '../../core/model';
import type { DesignProps } from '../../core/types';
import { useScrolled } from '../../core/useScrolled';
import { SIcon, type SoftIconName } from './icons';
import { LearnScreen } from './LearnScreen';
import { LessonScreen } from './LessonScreen';
import { SoftBird } from './Mascot';
import { PracticeScreen, ProfileScreen, ProgressScreen } from './OtherScreens';

const NAV_ICONS: Record<TabId, SoftIconName> = {
  learn: 'learn',
  practice: 'practice',
  progress: 'progress',
  profile: 'profile',
};

export function SoftApp({ model }: DesignProps) {
  const { state, lesson } = model;
  const { scrolled, onScroll } = useScrolled(`${state.tab}:${lesson ? 1 : 0}`);
  if (lesson) {
    return (
      <div className="sf-app">
        <LessonScreen model={model} lesson={lesson} />
      </div>
    );
  }
  return (
    <div className="sf-app" data-scrolled={scrolled}>
      <main className="sf-scroll" key={state.tab} onScroll={onScroll}>
        {state.tab === 'learn' && <LearnScreen model={model} />}
        {state.tab === 'practice' && <PracticeScreen model={model} />}
        {state.tab === 'progress' && <ProgressScreen model={model} />}
        {state.tab === 'profile' && <ProfileScreen />}
      </main>
      <nav className="sf-nav" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="sf-nav__item"
            aria-current={state.tab === t.id ? 'page' : undefined}
            onClick={() => model.actions.setTab(t.id)}
          >
            <SIcon name={NAV_ICONS[t.id]} size={26} />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function SoftThumb() {
  return <SoftBird size={60} float={false} />;
}
