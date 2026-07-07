import { ChevronRight, BarChart3 } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

export default function StatsPreviewCard({ onOpen, totalWatched, totalHours, filmsWatched, completed }) {
  const { t } = useI18n();

  return (
    <button
      onClick={onOpen}
      className="btn-press w-full rounded-2xl p-4 text-left mb-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-body text-sm font-semibold flex items-center gap-1.5">
          <BarChart3 size={15} style={{ color: 'var(--amber)' }} /> {t('profile.statsTab')}
        </span>
        <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <MiniStat value={totalWatched} label={t('stats.episodesWatched')} />
        <MiniStat value={totalHours} label={t('stats.hoursShows')} />
        <MiniStat value={filmsWatched} label={t('stats.filmsWatched')} />
        <MiniStat value={completed} label={t('stats.seriesCompleted')} />
      </div>
    </button>
  );
}

function MiniStat({ value, label }) {
  return (
    <div className="text-center">
      <p className="font-mono text-lg font-bold" style={{ color: 'var(--amber)' }}>{value}</p>
      <p className="font-body" style={{ fontSize: 10, color: 'var(--muted)' }}>{label}</p>
    </div>
  );
}
