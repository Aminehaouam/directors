import { TABS, type PreviewModel, type TabId } from '../../core/model';
import { app } from '../../data/sample';
import { Icon, type IconName } from './icons';

export function GoalRing({ value, total, size = 60 }: { value: number; total: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / total, 1);
  return (
    <div className="mn-ring" style={{ width: size, height: size }} role="img" aria-label={`Daily goal: ${value} of ${total} lessons`}>
      <svg width={size} height={size}>
        <circle className="mn-ring__track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className="mn-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span className="mn-ring__label">
        {Math.min(value, total)}/{total}
      </span>
    </div>
  );
}

export function TopBar({ model }: { model: PreviewModel }) {
  return (
    <header className="mn-top">
      <div className="mn-lang">
        <span className="mn-flag" aria-hidden>
          <i style={{ background: '#2b4fa3' }} />
          <i style={{ background: '#fff' }} />
          <i style={{ background: '#d8423a' }} />
        </span>
        <span>
          {app.language}
          <small>{app.level}</small>
        </span>
      </div>
      <div className="mn-stats">
        <span className="mn-stat-inline" aria-label={`${model.state.streak} day streak`}>
          <Icon name="flame" size={20} />
          {model.state.streak}
        </span>
        <span className="mn-stat-inline" aria-label={`${model.state.gems} gems`}>
          <Icon name="gem" size={20} />
          {model.state.gems}
        </span>
      </div>
    </header>
  );
}

const NAV_ICONS: Record<TabId, IconName> = {
  learn: 'learn',
  practice: 'practice',
  progress: 'progress',
  profile: 'profile',
};

export function Nav({ model }: { model: PreviewModel }) {
  return (
    <nav className="mn-nav" aria-label="Main">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className="mn-nav__item"
          aria-current={model.state.tab === t.id ? 'page' : undefined}
          onClick={() => model.actions.setTab(t.id)}
        >
          <Icon name={NAV_ICONS[t.id]} />
          {t.label}
        </button>
      ))}
    </nav>
  );
}
