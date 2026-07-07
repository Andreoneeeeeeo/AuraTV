import { Check, Film } from 'lucide-react';
import { IMG_SM } from '../../lib/tmdb.js';
import { useI18n } from '../../i18n/index.jsx';

export default function ContinueWatchingCard({ episode, seasonNumber, onToggle }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 rounded-xl overflow-hidden flex-shrink-0" style={{ width: 260, background: 'var(--surface)' }}>
      <div style={{ width: 72, height: 72, flexShrink: 0, background: 'var(--surface-alt)' }} className="flex items-center justify-center">
        {episode.still_path ? (
          <img src={`${IMG_SM}${episode.still_path}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Film size={22} style={{ color: 'var(--muted)' }} />
        )}
      </div>
      <div className="flex-1 min-w-0 py-2">
        <p className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
          S{String(seasonNumber).padStart(2, '0')} | E{String(episode.episode_number).padStart(2, '0')}
        </p>
        <p className="font-body text-sm font-semibold truncate">{episode.name}</p>
      </div>
      <button
        onClick={onToggle}
        aria-label={t('filmDetail.markWatched')}
        className="btn-press flex items-center justify-center flex-shrink-0 mr-3"
        style={{ width: 26, height: 26, borderRadius: '50%', border: '1.5px solid var(--muted)', background: 'transparent' }}
      >
        <Check size={13} style={{ color: 'var(--muted)' }} />
      </button>
    </div>
  );
}
