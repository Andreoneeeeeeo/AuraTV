import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Check, X, Clock, Users, ListChecks, UserSquare2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Poster from '../shared/Poster.jsx';
import SharedListModal from '../detail/SharedListModal.jsx';
import SectionLabel from '../shared/SectionLabel.jsx';
import SegmentedControl from '../shared/SegmentedControl.jsx';
import { SkeletonPosterGrid } from '../ui/Skeleton.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { tmdb, searchPersons, IMG_PROFILE } from '../../lib/tmdb.js';
import { searchProfiles } from '../../lib/profiles.js';
import { searchPublicLists } from '../../lib/publicLists.js';
import { translateTmdbError } from '../../lib/errors.js';

const RECENT_KEY = 'tvtracker-recent-searches';
const MAX_RECENT = 8;

function readRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; }
}
function saveRecent(list) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT))); } catch (e) {}
}

export default function DiscoverTab({ apiKey, library, filmLibrary, onAdd, onAddFilm, onOpenRelated, setError }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [mediaType, setMediaType] = useState('serie');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState(readRecent);
  const [people, setPeople] = useState([]);
  const [users, setUsers] = useState([]);
  const [sharedLists, setSharedLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const recentSaveTimer = useRef(null);

  useEffect(() => {
    const path = mediaType === 'serie' ? '/trending/tv/week' : '/trending/movie/week';
    tmdb(path, apiKey, lang).then(d => setTrending(d.results || [])).catch(e => setError(translateTmdbError(e, t)));
    setResults([]);
    setQuery('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, mediaType, lang]);

  // Ricerca istantanea con debounce
  useEffect(() => {
    if (!query.trim()) { setResults([]); setPeople([]); setUsers([]); setSharedLists([]); setLoading(false); return; }
    setLoading(true);
    const handle = setTimeout(async () => {
      const q = query.trim();
      try {
        const path = mediaType === 'serie' ? '/search/tv' : '/search/movie';
        const data = await tmdb(`${path}?query=${encodeURIComponent(q)}`, apiKey, lang);
        setResults(data.results || []);
      } catch (e) { setError(translateTmdbError(e, t)); }
      searchPersons(q, apiKey, lang).then(setPeople).catch(() => setPeople([]));
      if (user) searchProfiles(q, user.id).then(setUsers).catch(() => setUsers([]));
      searchPublicLists(q).then(setSharedLists).catch(() => setSharedLists([]));
      setLoading(false);
    }, 400);

    // Salva nelle ricerche recenti solo dopo che l'utente si è fermato per bene
    clearTimeout(recentSaveTimer.current);
    recentSaveTimer.current = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed.length < 3) return;
      setRecent(prev => {
        const next = [trimmed, ...prev.filter(r => r.toLowerCase() !== trimmed.toLowerCase())];
        saveRecent(next);
        return next.slice(0, MAX_RECENT);
      });
    }, 2200);

    return () => { clearTimeout(handle); clearTimeout(recentSaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mediaType, apiKey, lang]);

  function clearRecent() {
    setRecent([]);
    saveRecent([]);
  }

  const list = query.trim() ? results : trending;
  const inLib = (item) => mediaType === 'serie' ? !!library[item.id] : !!filmLibrary[item.id];
  const handleAdd = (item) => mediaType === 'serie' ? onAdd(item.id) : onAddFilm(item.id);

  return (
    <div>
      <SegmentedControl
        value={mediaType}
        onChange={setMediaType}
        options={[{ value: 'serie', label: t('library.segSeries') }, { value: 'film', label: t('library.segFilms') }]}
      />
      <div className="relative mb-3" role="search">
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <label htmlFor="discover-search" className="sr-only">{t('common.search')}</label>
        <input
          id="discover-search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={mediaType === 'serie' ? t('discover.searchSeriesPlaceholder') : t('discover.searchFilmsPlaceholder')}
          className="w-full pl-9 pr-9 py-2.5 rounded-lg font-body text-sm outline-none"
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label={t('common.close')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <X size={15} style={{ color: 'var(--muted)' }} />
          </button>
        )}
      </div>

      {!query.trim() && recent.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: 'var(--muted)' }}>
              <Clock size={12} /> {t('discover.recentSearches')}
            </span>
            <button onClick={clearRecent} className="font-mono text-xs" style={{ color: 'var(--amber)' }}>{t('discover.clearRecent')}</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {recent.map(r => (
              <button key={r} onClick={() => setQuery(r)}
                className="btn-press px-3 py-1.5 rounded-full font-body text-xs"
                style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {!query.trim() && <SectionLabel text={t('discover.trending')} />}
      {loading ? (
        <div className="mt-3"><SkeletonPosterGrid count={9} /></div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-3">
          {list.map(item => {
            const inLibrary = inLib(item);
            const title = mediaType === 'serie' ? item.name : item.title;
            const date = mediaType === 'serie' ? item.first_air_date : item.release_date;
            return (
              <div key={item.id} className="relative">
                <button onClick={() => onOpenRelated(mediaType === 'serie' ? 'show' : 'film', item)} className="card-tap w-full text-left block">
                  <Poster path={item.poster_path} fill alt={title} />
                </button>
                <p className="font-body text-xs mt-1 truncate">{title}</p>
                <p className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>
                  {(date || '').slice(0, 4) || '—'}
                </p>
                <button
                  onClick={() => inLibrary ? null : handleAdd(item)}
                  aria-label={inLibrary ? t('library.segSeries') : t('common.confirm')}
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
      {!loading && list.length === 0 && query.trim() && (
        <p className="font-body text-sm mt-4" style={{ color: 'var(--muted)' }}>{t('discover.noResultsFor', { query })}</p>
      )}

      {query.trim() && !loading && (
        <>
          {people.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-1.5 mb-3">
                <UserSquare2 size={14} style={{ color: 'var(--muted)' }} />
                <SectionLabel text={t('discover.people')} />
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {people.map((p) => (
                  <div key={p.id} className="flex-shrink-0 text-center" style={{ width: 76 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-alt)', margin: '0 auto' }}>
                      {p.profile_path && <img src={`${IMG_PROFILE}${p.profile_path}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <p className="font-body text-xs mt-1.5 truncate">{p.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {users.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-1.5 mb-3">
                <Users size={14} style={{ color: 'var(--muted)' }} />
                <SectionLabel text={t('discover.usersSection')} />
              </div>
              <div className="flex flex-col gap-2">
                {users.map((u) => (
                  <Link key={u.id} to={`/profile/${u.username}`} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'var(--surface)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-alt)', flexShrink: 0 }}>
                      {u.avatar_url && <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm font-semibold truncate">{u.display_name || u.username}</p>
                      <p className="font-mono text-xs truncate" style={{ color: 'var(--muted)' }}>@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {sharedLists.length > 0 && (
            <div className="mt-6 mb-4">
              <div className="flex items-center gap-1.5 mb-3">
                <ListChecks size={14} style={{ color: 'var(--muted)' }} />
                <SectionLabel text={t('discover.listsSection')} />
              </div>
              <div className="flex flex-col gap-2">
                {sharedLists.map((l) => (
                  <button key={l.id} onClick={() => setSelectedList(l)} className="btn-press flex items-center gap-3 p-2.5 rounded-xl text-left" style={{ background: 'var(--surface)' }}>
                    <Poster path={l.cover_poster} w={40} alt={l.name} />
                    <div className="min-w-0 flex-1">
                      <p className="font-body text-sm font-semibold truncate">{l.name}</p>
                      <p className="font-mono text-xs truncate" style={{ color: 'var(--muted)' }}>
                        @{l.author?.username} · {(l.items || []).length}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selectedList && (
        <SharedListModal list={selectedList} onClose={() => setSelectedList(null)} onOpenShow={(item) => onOpenRelated('show', item)} onOpenFilm={(item) => onOpenRelated('film', item)} />
      )}
    </div>
  );
}
