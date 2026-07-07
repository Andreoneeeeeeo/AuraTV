import { useState, useEffect, useCallback } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import Centered from '../shared/Centered.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import EpisodeCard from './EpisodeCard.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { tmdb } from '../../lib/tmdb.js';
import { dayLabel, daysFromToday } from '../../lib/format.js';
import { translateTmdbError } from '../../lib/errors.js';

export default function CalendarTab({ library, apiKey, setError, onToggleEpisode }) {
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);

  const shows = Object.values(library);

  const refresh = useCallback(async () => {
    if (shows.length === 0) { setLoading(false); return; }
    setLoading(true);
    try {
      const results = await Promise.all(shows.map(s => tmdb(`/tv/${s.id}`, apiKey, lang).catch(() => null)));
      const items = [];
      results.forEach((data, i) => {
        if (!data) return;
        const show = shows[i];
        if (data.next_episode_to_air) {
          items.push({ show, ep: data.next_episode_to_air, isRecent: false, days: daysFromToday(data.next_episode_to_air.air_date) });
        }
        if (data.last_episode_to_air) {
          const d = daysFromToday(data.last_episode_to_air.air_date);
          if (d !== null && d <= 0 && d >= -21) {
            items.push({ show, ep: data.last_episode_to_air, isRecent: true, days: d });
          }
        }
      });
      items.sort((a, b) => new Date(a.ep.air_date) - new Date(b.ep.air_date));
      const grouped = [];
      let currentLabel = null;
      items.forEach(item => {
        const label = dayLabel(item.ep.air_date, lang, t);
        if (label !== currentLabel) {
          grouped.push({ label, items: [] });
          currentLabel = label;
        }
        grouped[grouped.length - 1].items.push(item);
      });
      setGroups(grouped);
    } catch (e) { setError(translateTmdbError(e, t)); }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(shows.map(s => s.id)), apiKey, lang]);

  useEffect(() => { refresh(); }, [refresh]);

  if (shows.length === 0) {
    return <EmptyState icon={Calendar} text={t('calendar.empty')} />;
  }
  if (loading) return <SkeletonRows count={4} height={80} />;

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button onClick={refresh} aria-label={t('calendar.refresh')} className="btn-press p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
          <RefreshCw size={15} style={{ color: 'var(--muted)' }} />
        </button>
      </div>
      {groups.length === 0 ? (
        <p className="font-body text-sm" style={{ color: 'var(--muted)' }}>{t('calendar.emptySchedule')}</p>
      ) : groups.map(group => (
        <div key={group.label} className="mb-5">
          <span className="inline-block px-3 py-1 rounded-full font-mono font-semibold text-xs mb-3" style={{ background: 'var(--surface-alt)', color: 'var(--amber)', letterSpacing: '0.05em' }}>
            {group.label}
          </span>
          {group.items.map(({ show, ep, isRecent }) => {
            const freshShow = library[show.id] || show;
            return (
              <EpisodeCard
                key={freshShow.id + '-' + ep.season_number + '-' + ep.episode_number}
                show={freshShow}
                ep={ep}
                isRecent={isRecent}
                onToggle={() => onToggleEpisode(freshShow.id, ep.season_number, ep.episode_number)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
