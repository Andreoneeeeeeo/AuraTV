import { useState, useEffect } from 'react';
import { Search, Plus, Check, Gamepad2, ChevronDown } from 'lucide-react';
import Poster from '../shared/Poster.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import SectionLabel from '../shared/SectionLabel.jsx';
import SegmentedControl from '../shared/SegmentedControl.jsx';
import { SkeletonPosterGrid } from '../ui/Skeleton.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { searchGames, trendingGames } from '../../lib/rawg.js';
import { getGameWatchStatus } from '../../lib/watchStatus.js';

const SECTION_ORDER = ['watching', 'planned', 'on_hold', 'completed', 'dropped'];

export default function GamesTab({ gameLibrary, onAdd, onOpen, onOpenRelated }) {
  const { t } = useI18n();
  const [segment, setSegment] = useState('library');
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (segment !== 'discover') return;
    trendingGames().then(setTrending).catch(() => {});
  }, [segment]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const handle = setTimeout(() => {
      searchGames(query).then(setResults).catch(() => {}).finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(handle);
  }, [query]);

  const games = Object.values(gameLibrary);
  const labels = {
    watching: t('games.statusPlaying'),
    planned: t('games.statusPlanned'),
    on_hold: t('games.statusOnHold'),
    completed: t('games.statusCompleted'),
    dropped: t('games.statusDropped'),
  };
  const sections = SECTION_ORDER.map((key) => ({
    key, label: labels[key], games: games.filter((g) => getGameWatchStatus(g) === key),
  })).filter((s) => s.games.length > 0);

  const discoverList = query.trim() ? results : trending;

  return (
    <div>
      <SegmentedControl
        value={segment}
        onChange={setSegment}
        options={[
          { value: 'library', label: t('games.tabLibrary') },
          { value: 'discover', label: t('games.tabDiscover') },
        ]}
      />

      {segment === 'library' ? (
        games.length === 0 ? (
          <EmptyState icon={Gamepad2} text={t('games.emptyLibrary')} />
        ) : (
          sections.map((section) => {
            const isOpen = !collapsed.has(section.key);
            function toggle() {
              setCollapsed((prev) => {
                const next = new Set(prev);
                isOpen ? next.add(section.key) : next.delete(section.key);
                return next;
              });
            }
            return (
              <div key={section.key} className="mb-7">
                <button onClick={toggle} aria-expanded={isOpen} className="btn-press flex items-center gap-2 mb-3 w-full">
                  <SectionLabel text={section.label} />
                  <span
                    className="font-mono flex items-center justify-center"
                    style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--surface-alt)', minWidth: 18, height: 18, borderRadius: 9, padding: '0 6px' }}
                  >
                    {section.games.length}
                  </span>
                  <ChevronDown size={15} className="chevron" style={{ color: 'var(--muted)', marginLeft: 'auto', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                {isOpen && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {section.games.map((g) => (
                      <button key={g.id} onClick={() => onOpen(g.id)} className="card-tap text-left">
                        <div style={{ borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                          <Poster path={g.background_image} fill alt={g.name} />
                        </div>
                        <p className="font-body text-xs mt-1.5 truncate">{g.name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )
      ) : (
        <>
          <div className="relative mb-3" role="search">
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('games.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg font-body text-sm outline-none"
              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
          </div>
          {!query.trim() && <SectionLabel text={t('games.trending')} />}
          {loading ? (
            <div className="mt-3"><SkeletonPosterGrid count={9} /></div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-3">
              {discoverList.map((item) => {
                const inLibrary = !!gameLibrary[item.id];
                return (
                  <div key={item.id} className="relative">
                    <button onClick={() => onOpenRelated(item)} className="card-tap w-full text-left block">
                      <Poster path={item.background_image} fill alt={item.name} />
                    </button>
                    <p className="font-body text-xs mt-1 truncate">{item.name}</p>
                    <p className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{(item.released || '').slice(0, 4) || '—'}</p>
                    <button
                      onClick={() => inLibrary ? null : onAdd(item.id)}
                      aria-label={inLibrary ? t('games.tabLibrary') : t('common.confirm')}
                      className="absolute top-1 right-1 rounded-full p-1"
                      style={{ background: inLibrary ? 'var(--watched)' : 'rgba(0,0,0,0.6)' }}
                    >
                      {inLibrary ? <Check size={13} color="#fff" /> : <Plus size={13} color="#fff" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
