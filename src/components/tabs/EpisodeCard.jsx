import { Check } from 'lucide-react';
import Poster from '../shared/Poster.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { fmtDate } from '../../lib/format.js';

export default function EpisodeCard({ show, ep, isRecent, onToggle }) {
  const { t, lang } = useI18n();
  const isWatched = (show.watched[ep.season_number] || []).includes(ep.episode_number);
  const badges = [];
  if (isRecent) {
    badges.push({ label: t('calendar.last'), color: 'var(--muted)' });
  } else {
    badges.push({ label: t('calendar.new'), color: 'var(--amber)' });
    if (ep.episode_number === 1) badges.push({ label: t('calendar.premiere'), color: 'var(--tally)' });
  }
  return (
    <div className="season-card flex gap-3 p-2.5 mb-2 rounded-xl items-center" style={{ background: 'var(--surface)' }}>
      <Poster path={show.poster_path} w={64} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1 mb-1">
          {badges.map(b => (
            <span key={b.label} className="font-mono font-semibold" style={{
              fontSize: 9, color: b.color, border: `1px solid ${b.color}`, borderRadius: 999, padding: '1px 6px', letterSpacing: '0.04em', opacity: 0.9,
            }}>{b.label}</span>
          ))}
        </div>
        <p className="font-body font-semibold text-sm truncate">{show.name}</p>
        <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
          S{String(ep.season_number).padStart(2, '0')}E{String(ep.episode_number).padStart(2, '0')} · {ep.name}
        </p>
      </div>
      {isRecent && (
        <button
          onClick={onToggle}
          aria-label={isWatched ? t('common.remove') : t('common.confirm')}
          className="btn-press flex items-center justify-center flex-shrink-0"
          style={{
            width: 30, height: 30, borderRadius: '50%',
            border: `1.5px solid ${isWatched ? 'var(--watched)' : 'var(--muted)'}`,
            background: isWatched ? 'var(--watched)' : 'transparent',
          }}
        >
          {isWatched && <Check size={15} color="var(--bg)" />}
        </button>
      )}
    </div>
  );
}
