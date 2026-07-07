import { Play, Bookmark, Pause, CheckCircle2, XCircle } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

const OPTIONS = [
  { value: 'watching', icon: Play },
  { value: 'planned', icon: Bookmark },
  { value: 'on_hold', icon: Pause },
  { value: 'completed', icon: CheckCircle2 },
  { value: 'dropped', icon: XCircle },
];

const LABEL_KEYS = {
  watching: 'library.statusWatching',
  planned: 'library.statusPlanned',
  on_hold: 'library.statusOnHold',
  completed: 'library.statusCompleted',
  dropped: 'library.statusDropped',
};

const GAME_LABEL_KEYS = {
  watching: 'games.statusPlaying',
  planned: 'games.statusPlanned',
  on_hold: 'games.statusOnHold',
  completed: 'games.statusCompleted',
  dropped: 'games.statusDropped',
};

export default function WatchStatusPicker({ value, onChange, kind = 'media', completedLabel }) {
  const { t } = useI18n();
  const keys = kind === 'game' ? GAME_LABEL_KEYS : LABEL_KEYS;
  return (
    <div className="flex gap-1.5 flex-wrap" role="radiogroup" aria-label={t('library.changeStatus')}>
      {OPTIONS.map(({ value: v, icon: Icon }) => {
        const active = value === v;
        const label = v === 'completed' && completedLabel ? completedLabel : t(keys[v]);
        return (
          <button
            key={v}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs font-semibold"
            style={{
              background: active ? 'var(--amber)' : 'var(--surface-alt)',
              color: active ? 'var(--on-accent)' : 'var(--muted)',
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
