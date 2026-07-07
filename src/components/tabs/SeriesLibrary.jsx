import { useState } from 'react';
import { Tv, List, LayoutGrid } from 'lucide-react';
import Poster from '../shared/Poster.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import SectionLabel from '../shared/SectionLabel.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { getShowWatchStatus, isShowCaughtUp } from '../../lib/watchStatus.js';

const SECTION_ORDER = ['watching', 'caught_up', 'planned', 'on_hold', 'completed', 'dropped'];

export default function SeriesLibrary({ library, watchedCountForShow, onOpen }) {
  const { t } = useI18n();
  const [view, setView] = useState('grid');
  const shows = Object.values(library).sort((a, b) => (b.lastWatchedAt || b.addedAt) - (a.lastWatchedAt || a.addedAt));
  if (shows.length === 0) {
    return <EmptyState icon={Tv} text={t('library.emptySeries')} />;
  }

  const labels = {
    watching: t('library.statusWatching'),
    caught_up: t('library.statusCaughtUp'),
    planned: t('library.statusPlanned'),
    on_hold: t('library.statusOnHold'),
    completed: t('library.statusCompleted'),
    dropped: t('library.statusDropped'),
  };

  function sectionOf(show) {
    const watched = watchedCountForShow(show);
    if (isShowCaughtUp(show, watched)) return 'caught_up';
    return getShowWatchStatus(show, watched);
  }

  const sections = SECTION_ORDER.map((key) => ({
    key,
    label: labels[key],
    shows: shows.filter((s) => sectionOf(s) === key),
  })).filter((s) => s.shows.length > 0);

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')} aria-label={t('library.toggleView')} className="btn-press p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
          {view === 'grid' ? <List size={16} style={{ color: 'var(--muted)' }} /> : <LayoutGrid size={16} style={{ color: 'var(--muted)' }} />}
        </button>
      </div>

      {sections.map((section) => (
        <div key={section.key} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel text={section.label} />
            <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{section.shows.length}</span>
          </div>

          {view === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {section.shows.map(show => {
                const watched = watchedCountForShow(show);
                const total = show.number_of_episodes || 1;
                const pct = Math.min(100, Math.round((watched / total) * 100));
                const onAir = show.status === 'Returning Series';
                return (
                  <button key={show.id} onClick={() => onOpen(show.id)} className="card-tap text-left">
                    <div className="relative">
                      <Poster path={show.poster_path} fill alt={show.name} />
                      {onAir && (
                        <span className="tally-dot absolute" style={{
                          top: 6, left: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--tally)',
                          boxShadow: '0 0 0 2px rgba(0,0,0,0.5)',
                        }} aria-hidden="true" />
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(0,0,0,0.5)' }}>
                        <div className="progress-fill" style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--watched)' : 'var(--amber)' }} />
                      </div>
                    </div>
                    <p className="font-body text-xs mt-1.5 truncate">{show.name}</p>
                    <p className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{watched}/{show.number_of_episodes || '?'}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {section.shows.map(show => {
                const watched = watchedCountForShow(show);
                const total = show.number_of_episodes || 1;
                const pct = Math.min(100, Math.round((watched / total) * 100));
                const onAir = show.status === 'Returning Series';
                return (
                  <button key={show.id} onClick={() => onOpen(show.id)} className="card-tap flex gap-3 items-center text-left p-2.5 rounded-xl"
                    style={{ background: 'var(--surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                    <Poster path={show.poster_path} w={52} alt={show.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {onAir && <span className="tally-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tally)', display: 'inline-block' }} aria-hidden="true" />}
                        <p className="font-body font-semibold text-sm truncate">{show.name}</p>
                      </div>
                      <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {t('library.watchedOf', { watched, total: show.number_of_episodes || '?' })} · {onAir ? t('library.onAir') : t('library.ended')}
                      </p>
                      <div style={{ height: 5, background: 'var(--surface-alt)', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                        <div className="progress-fill" style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--watched)' : 'var(--amber)', borderRadius: 3 }} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
