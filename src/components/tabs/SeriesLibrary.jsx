import { Tv, List, LayoutGrid, ChevronDown } from 'lucide-react';
import Poster from '../shared/Poster.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import SectionLabel from '../shared/SectionLabel.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { getShowWatchStatus, isShowCaughtUp } from '../../lib/watchStatus.js';

const SECTION_ORDER = ['watching', 'caught_up', 'planned', 'on_hold', 'completed', 'dropped'];

export default function SeriesLibrary({ library, watchedCountForShow, onOpen, collapsed = [], onToggleSection, view = 'grid', onSetView }) {
  const { t } = useI18n();
  const collapsedSet = new Set(collapsed);
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
        <button
          onClick={() => onSetView(view === 'grid' ? 'list' : 'grid')}
          aria-label={t('library.toggleView')}
          className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}
        >
          {view === 'grid' ? <List size={14} /> : <LayoutGrid size={14} />}
          {view === 'grid' ? t('library.viewList') : t('library.viewGrid')}
        </button>
      </div>

      {sections.map((section) => {
        const isOpen = !collapsedSet.has(section.key);
        function toggle() { onToggleSection(section.key); }
        return (
        <div key={section.key} className="mb-7">
          <button onClick={toggle} aria-expanded={isOpen} className="btn-press flex items-center gap-2 mb-3 w-full">
            <SectionLabel text={section.label} />
            <span
              className="font-mono flex items-center justify-center"
              style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--surface-alt)', minWidth: 18, height: 18, borderRadius: 9, padding: '0 6px' }}
            >
              {section.shows.length}
            </span>
            <ChevronDown size={15} className="chevron" style={{ color: 'var(--muted)', marginLeft: 'auto', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>

          {isOpen && (view === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {section.shows.map(show => {
                const watched = watchedCountForShow(show);
                const total = show.number_of_episodes || 1;
                const pct = Math.min(100, Math.round((watched / total) * 100));
                const onAir = show.status === 'Returning Series';
                return (
                  <button key={show.id} onClick={() => onOpen(show.id)} className="card-tap text-left">
                    <div className="relative" style={{ borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                      <Poster path={show.poster_path} fill alt={show.name} />
                      {onAir && (
                        <span className="tally-dot absolute" style={{
                          top: 6, left: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--tally)',
                          boxShadow: '0 0 0 2px rgba(0,0,0,0.5)',
                        }} aria-hidden="true" />
                      )}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 26, background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.55))', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.18)' }}>
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
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
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
          ))}
        </div>
        );
      })}
    </div>
  );
}
