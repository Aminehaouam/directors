import '@fontsource-variable/fraunces';
import '@fontsource-variable/manrope';
import './minimal.css';
import type { DesignProps } from '../../core/types';
import { useScrolled } from '../../core/useScrolled';
import { LearnScreen } from './LearnScreen';
import { LessonScreen } from './LessonScreen';
import { Mascot } from './Mascot';
import { PracticeScreen, ProfileScreen, ProgressScreen } from './OtherScreens';
import { Nav } from './parts';

export function MinimalApp({ model }: DesignProps) {
  const { state, lesson } = model;
  const { scrolled, onScroll } = useScrolled(`${state.tab}:${lesson ? 1 : 0}`);
  if (lesson) {
    return (
      <div className="mn-app">
        <LessonScreen model={model} lesson={lesson} />
      </div>
    );
  }
  return (
    <div className="mn-app" data-scrolled={scrolled}>
      <main className="mn-scroll" key={state.tab} onScroll={onScroll}>
        {state.tab === 'learn' && <LearnScreen model={model} />}
        {state.tab === 'practice' && <PracticeScreen model={model} />}
        {state.tab === 'progress' && <ProgressScreen model={model} />}
        {state.tab === 'profile' && <ProfileScreen model={model} />}
      </main>
      <Nav model={model} />
    </div>
  );
}

export function MinimalThumb() {
  return (
    <span className="mn-app" style={{ background: 'transparent', height: 'auto', display: 'block' }}>
      <Mascot size={48} />
    </span>
  );
}
