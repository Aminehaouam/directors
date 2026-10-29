import { TABS, type PreviewModel, type TabId } from '../../core/model';
import { Sprite } from './Sprite';
import {
  BIRD,
  BIRD_BLINK,
  FLAG_BADGE,
  FLAME,
  GEM,
  ICON_LEARN,
  ICON_PRACTICE,
  ICON_PROFILE,
  ICON_PROGRESS,
  type SpriteRows,
} from './sprites';
import { app } from '../../data/sample';

export function Bird({ scale = 4, still = false }: { scale?: number; still?: boolean }) {
  return (
    <span className={`px-bird${still ? ' px-bird--still' : ''}`} role="img" aria-label="Pip the pixel bird">
      <Sprite rows={BIRD} scale={scale} />
      <span className="px-bird__blink">
        <Sprite rows={BIRD_BLINK} scale={scale} />
      </span>
    </span>
  );
}

export function Seg({ total, filled, fresh = -1, wide = false }: { total: number; filled: number; fresh?: number; wide?: boolean }) {
  return (
    <div className={`px-seg${wide ? ' px-seg--wide' : ''}`} role="img" aria-label={`${filled} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`px-seg__cell${i < filled ? ' is-on' : ''}${i === fresh ? ' is-new' : ''}`} />
      ))}
    </div>
  );
}

export function Hud({ model }: { model: PreviewModel }) {
  const { streak, gems } = model.state;
  return (
    <header className="px-hud">
      <div className="px-hud__lang">
        <Sprite rows={FLAG_BADGE} scale={3} />
        <div>
          <strong>{app.language}</strong>
          <span className="px-label">Lv. {app.level}</span>
        </div>
      </div>
      <div className="px-hud__counters">
        <span className="px-counter px-frame" aria-label={`${streak} day streak`}>
          <Sprite rows={FLAME} scale={2} />
          {streak}
        </span>
        <span className="px-counter px-frame" aria-label={`${gems} gems`}>
          <Sprite rows={GEM} scale={2} />
          {gems}
        </span>
      </div>
    </header>
  );
}

const NAV_ICONS: Record<TabId, SpriteRows> = {
  learn: ICON_LEARN,
  practice: ICON_PRACTICE,
  progress: ICON_PROGRESS,
  profile: ICON_PROFILE,
};

export function Nav({ model }: { model: PreviewModel }) {
  return (
    <nav className="px-nav" aria-label="Main">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className="px-nav__item"
          aria-current={model.state.tab === t.id ? 'page' : undefined}
          onClick={() => model.actions.setTab(t.id)}
        >
          <Sprite rows={NAV_ICONS[t.id]} scale={3} />
          <span className="px-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
