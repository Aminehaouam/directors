import '@fontsource-variable/pixelify-sans';
import '@fontsource/silkscreen/400.css';
import './pixel.css';
import type { DesignProps } from '../../core/types';
import { useScrolled } from '../../core/useScrolled';
import { LearnScreen } from './LearnScreen';
import { LessonScreen } from './LessonScreen';
import { PracticeScreen, ProfileScreen, ProgressScreen } from './OtherScreens';
import { Nav } from './parts';
import { Sprite } from './Sprite';
import { BIRD } from './sprites';

export function PixelApp({ model }: DesignProps) {
  const { state, lesson } = model;
  const { scrolled, onScroll } = useScrolled(`${state.tab}:${lesson ? 1 : 0}`);
  if (lesson) {
    return (
      <div className="px-app">
        <LessonScreen model={model} lesson={lesson} />
      </div>
    );
  }
  return (
    <div className="px-app" data-scrolled={scrolled}>
      <main className="px-scroll" key={state.tab} onScroll={onScroll}>
        {state.tab === 'learn' && <LearnScreen model={model} />}
        {state.tab === 'practice' && <PracticeScreen model={model} />}
        {state.tab === 'progress' && <ProgressScreen model={model} />}
        {state.tab === 'profile' && <ProfileScreen model={model} />}
      </main>
      <Nav model={model} />
    </div>
  );
}

export function PixelThumb() {
  return <Sprite rows={BIRD} scale={3} />;
}
