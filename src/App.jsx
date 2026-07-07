import { useState, useEffect, lazy, Suspense } from 'react';
import { Loader2, AlertCircle, X } from 'lucide-react';
import Header from './components/layout/Header.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import SideNav from './components/layout/SideNav.jsx';
import Centered from './components/shared/Centered.jsx';
import NoApiKey from './components/shared/NoApiKey.jsx';
import LibraryTab from './components/tabs/LibraryTab.jsx';
import DiscoverTab from './components/tabs/DiscoverTab.jsx';
import GamesTab from './components/tabs/GamesTab.jsx';
import FriendsHubTab from './components/friends/FriendsHubTab.jsx';
import ProfilePage from './components/profile/ProfilePage.jsx';
import GamesOnboarding from './components/onboarding/GamesOnboarding.jsx';
import ConfettiBurst from './components/ui/ConfettiBurst.jsx';
import { useToast } from './contexts/ToastContext.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { useI18n } from './i18n/index.jsx';
import { useLibraryData } from './hooks/useLibraryData.js';
import { useBackHandler } from './hooks/useBackHandler.js';
import { upsertProfile } from './lib/profiles.js';
import { getAutoPauseMonths, setAutoPauseMonths } from './lib/autoPauseSetting.js';
import { computeAutoPauseUpdates } from './lib/watchStatus.js';

const ShowDetail = lazy(() => import('./components/show/ShowDetail.jsx'));
const FilmDetail = lazy(() => import('./components/film/FilmDetail.jsx'));
const GameDetail = lazy(() => import('./components/game/GameDetail.jsx'));
const SettingsPage = lazy(() => import('./components/settings/SettingsPage.jsx'));

function ModalFallback() {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center" style={{ background: 'var(--overlay)' }}>
      <Loader2 className="animate-spin" size={26} style={{ color: 'var(--amber)' }} />
    </div>
  );
}

export default function TVTracker() {
  const { t, lang } = useI18n();
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [celebrating, setCelebrating] = useState(false);

  const [apiKey, setApiKeyState] = useState('');
  const [tab, setTab] = useState('library');
  const [ready, setReady] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [filmDetailId, setFilmDetailId] = useState(null);
  const [gameDetailId, setGameDetailId] = useState(null);
  const [error, setError] = useState('');
  const [importProgress, setImportProgress] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoPauseMonths, setAutoPauseMonthsState] = useState(getAutoPauseMonths);

  const data = useLibraryData({
    apiKey, lang, t, setError, setImportProgress, userId: user?.id,
    onShowCompleted: (show) => {
      setCelebrating(true);
      toast.success(t('detail.completedCelebration', { title: show.name }));
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const s = await window.storage.get('tmdb-settings');
        if (s?.value) setApiKeyState(JSON.parse(s.value).apiKey || '');
      } catch (e) {}
      await data.loadAll();
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !data.ready) return;
    const updates = computeAutoPauseUpdates(data.library, autoPauseMonths);
    if (Object.keys(updates).length > 0) data.bulkUpdateShows(updates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data.ready, autoPauseMonths]);

  useEffect(() => {
    if (!ready || !data.ready || !apiKey) return;
    data.refreshOnAirShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, data.ready, apiKey]);

  function handleSetAutoPauseMonths(months) {
    setAutoPauseMonths(months);
    setAutoPauseMonthsState(months);
  }

  async function saveApiKey(key) {
    setApiKeyState(key);
    try { await window.storage.set('tmdb-settings', JSON.stringify({ apiKey: key })); }
    catch (e) { setError(t('errors.saveApiKeyFailed')); }
  }

  const [previewShow, setPreviewShow] = useState(null);
  const [previewFilm, setPreviewFilm] = useState(null);
  const [previewGame, setPreviewGame] = useState(null);

  // Apre l'anteprima di una serie/film senza aggiungerlo alla libreria.
  // L'aggiunta avviene solo se l'utente tocca esplicitamente "Aggiungi alla libreria".
  function openRelated(mediaType, item) {
    const posterPath = item.poster_path ?? item.poster ?? null;
    if (mediaType === 'show') {
      setFilmDetailId(null); setPreviewFilm(null);
      setPreviewShow(data.library[item.id] ? null : { id: item.id, name: item.name || item.title, poster_path: posterPath });
      setDetailId(item.id);
    } else {
      setDetailId(null); setPreviewShow(null);
      setPreviewFilm(data.filmLibrary[item.id] ? null : { id: item.id, title: item.title || item.name, poster_path: posterPath });
      setFilmDetailId(item.id);
    }
  }

  function openRelatedGame(item) {
    setPreviewGame(data.gameLibrary[item.id] ? null : { id: item.id, name: item.name, background_image: item.background_image });
    setGameDetailId(item.id);
  }

  async function confirmAddShow(id) {
    if (!data.library[id]) await data.addShow(id);
    setPreviewShow(null);
  }

  async function confirmAddFilm(id) {
    if (!data.filmLibrary[id]) await data.addFilm(id);
    setPreviewFilm(null);
  }

  async function confirmAddGame(id) {
    if (!data.gameLibrary[id]) await data.addGame(id);
    setPreviewGame(null);
  }

  async function handleGamesOnboardingAnswer(answer) {
    if (!user) return;
    try {
      await upsertProfile(user.id, { tracks_games: answer });
      await refreshProfile();
      if (answer) setTab('games');
    } catch (e) {}
  }

  const detailShow = detailId ? (data.library[detailId] || previewShow) : null;
  const detailFilm = filmDetailId ? (data.filmLibrary[filmDetailId] || previewFilm) : null;
  const detailGame = gameDetailId ? (data.gameLibrary[gameDetailId] || previewGame) : null;
  const isShowPreview = !!(detailShow && !data.library[detailId]);
  const isFilmPreview = !!(detailFilm && !data.filmLibrary[filmDetailId]);
  const isGamePreview = !!(detailGame && !data.gameLibrary[gameDetailId]);
  const showGames = profile?.tracks_games === true;

  useBackHandler(() => {
    if (tab !== 'library') { setTab('library'); return; }
    import('@capacitor/app').then(({ App: CapacitorApp }) => CapacitorApp.exitApp()).catch(() => {});
  });

  function renderTab() {
    if (!ready || !data.ready) return <Centered><Loader2 className="animate-spin" size={28} /></Centered>;
    if (!apiKey && tab !== 'profile' && tab !== 'games' && tab !== 'friends') return <NoApiKey onGo={() => setSettingsOpen(true)} />;

    if (tab === 'friends') {
      return <FriendsHubTab />;
    }

    if (tab === 'library') {
      return (
        <LibraryTab
          library={data.library} watchedCountForShow={data.watchedCountForShow} onOpen={setDetailId}
          filmLibrary={data.filmLibrary} onOpenFilm={setFilmDetailId}
          lists={data.lists} onCreateList={data.createList} onDeleteList={data.deleteList} onRemoveFromList={data.removeFromList} onUpdateListMeta={data.updateListMeta}
          apiKey={apiKey} setError={setError} onToggleEpisode={data.toggleEpisode}
        />
      );
    }
    if (tab === 'discover') {
      return (
        <DiscoverTab
          apiKey={apiKey} library={data.library} filmLibrary={data.filmLibrary}
          onAdd={data.addShow} onAddFilm={data.addFilm} onOpenRelated={openRelated} setError={setError}
        />
      );
    }
    if (tab === 'games') {
      return <GamesTab gameLibrary={data.gameLibrary} onAdd={data.addGame} onOpen={setGameDetailId} onOpenRelated={openRelatedGame} />;
    }
    return (
      <ProfilePage
        onOpenSettings={() => setSettingsOpen(true)}
        onGoToFriends={() => setTab('friends')}
        library={data.library} filmLibrary={data.filmLibrary} gameLibrary={data.gameLibrary}
        watchedCountForShow={data.watchedCountForShow} watchLog={data.watchLog} showGames={showGames}
        onOpenShow={setDetailId} onOpenFilm={setFilmDetailId} onOpenGame={setGameDetailId}
        onOpenRelated={openRelated} onOpenRelatedGame={openRelatedGame}
      />
    );
  }

  return (
    <div className="app-shell font-body flex flex-col md:flex-row">
      <SideNav tab={tab} setTab={setTab} showGames={showGames} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header tab={tab} onOpenProfile={() => setTab('profile')} />

        {error && (
          <div role="alert" className="fade-in flex items-center gap-2 px-4 py-2 text-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
            <AlertCircle size={16} />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} aria-label={t('common.close')}><X size={16} /></button>
          </div>
        )}

        {importProgress && (
          <div className="px-4 py-2.5" style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Loader2 className="animate-spin" size={14} style={{ color: 'var(--amber)' }} />
              <span className="font-mono text-xs" style={{ color: 'var(--text)' }}>
                {importProgress.done}/{importProgress.total} · {importProgress.matched}
              </span>
            </div>
            <div style={{ height: 4, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
              <div className="progress-fill" style={{
                height: '100%', borderRadius: 3, background: 'var(--amber)',
                width: `${Math.round((importProgress.done / Math.max(importProgress.total, 1)) * 100)}%`,
              }} />
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 pb-24 md:pb-8 pt-4" style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
          {renderTab()}
        </main>

        <BottomNav tab={tab} setTab={setTab} showGames={showGames} />
      </div>

      {celebrating && <ConfettiBurst onDone={() => setCelebrating(false)} />}

      {profile && profile.tracks_games === null && (
        <GamesOnboarding onAnswer={handleGamesOnboardingAnswer} />
      )}

      {detailShow && (
        <Suspense fallback={<ModalFallback />}>
          <ShowDetail
            key={detailId}
            show={detailShow}
            apiKey={apiKey}
            isPreview={isShowPreview}
            onAddToLibrary={() => confirmAddShow(detailId)}
            onClose={() => { setDetailId(null); setPreviewShow(null); }}
            onToggleEpisode={data.toggleEpisode}
            onMarkUpTo={data.markUpTo}
            onSetSeasonWatched={data.setEpisodesWatched}
            onSetWatchStatus={(status) => data.setShowWatchStatus(detailId, status)}
            onMarkAllWatched={() => data.markAllWatched(detailId)}
            onRewatch={() => { data.rewatchShow(detailId); toast.success(t('library.rewatchToast', { title: detailShow?.name })); }}
            onRemove={() => { data.removeShow(detailId); setDetailId(null); }}
            onOpenRelated={openRelated}
            setError={setError}
            lists={data.lists}
            onCreateList={data.createList}
            onToggleListMembership={data.toggleListMembership}
          />
        </Suspense>
      )}

      {detailFilm && (
        <Suspense fallback={<ModalFallback />}>
          <FilmDetail
            key={filmDetailId}
            film={detailFilm}
            apiKey={apiKey}
            isPreview={isFilmPreview}
            onAddToLibrary={() => confirmAddFilm(filmDetailId)}
            onClose={() => { setFilmDetailId(null); setPreviewFilm(null); }}
            onSetWatchStatus={(status) => data.setFilmWatchStatus(filmDetailId, status)}
            onRewatch={() => { data.rewatchFilm(filmDetailId); toast.success(t('library.rewatchToast', { title: detailFilm?.title })); }}
            onRemove={() => { data.removeFilm(filmDetailId); setFilmDetailId(null); }}
            onOpenRelated={openRelated}
            setError={setError}
            lists={data.lists}
            onCreateList={data.createList}
            onToggleListMembership={data.toggleListMembership}
          />
        </Suspense>
      )}

      {detailGame && (
        <Suspense fallback={<ModalFallback />}>
          <GameDetail
            key={gameDetailId}
            game={detailGame}
            isPreview={isGamePreview}
            onAddToLibrary={() => confirmAddGame(gameDetailId)}
            onClose={() => { setGameDetailId(null); setPreviewGame(null); }}
            onSetWatchStatus={(status) => data.setGameWatchStatus(gameDetailId, status)}
            onSetHoursPlayed={(hours) => data.setGameHoursPlayed(gameDetailId, hours)}
            onToggleCompleted100={() => data.toggleGameCompleted100(gameDetailId)}
            onTogglePlatinum={() => data.toggleGamePlatinum(gameDetailId)}
            onRewatch={() => { data.rewatchGame(gameDetailId); toast.success(t('library.rewatchToast', { title: detailGame?.name })); }}
            onRemove={() => { data.removeGame(gameDetailId); setGameDetailId(null); }}
            onOpenRelated={openRelatedGame}
            setError={setError}
          />
        </Suspense>
      )}

      {settingsOpen && (
        <Suspense fallback={<ModalFallback />}>
          <SettingsPage
            onClose={() => setSettingsOpen(false)}
            apiKey={apiKey} onSaveApiKey={saveApiKey}
            onExport={data.exportCSV} onImport={data.importCSV} onExportJSON={data.exportShowsJSON} onImportJSON={data.importShowsJSON} showCount={Object.keys(data.library).length}
            onExportFilms={data.exportFilmsCSV} onImportFilms={data.importFilmsCSV} onExportFilmsJSON={data.exportFilmsJSON} onImportFilmsJSON={data.importFilmsJSON} filmCount={Object.keys(data.filmLibrary).length}
            onExportLists={data.exportListsCSV} onImportLists={data.importListsCSV} onExportListsJSON={data.exportListsJSON} onImportListsJSON={data.importListsJSON} listCount={Object.keys(data.lists).length}
            autoPauseMonths={autoPauseMonths} onSetAutoPauseMonths={handleSetAutoPauseMonths}
          />
        </Suspense>
      )}
    </div>
  );
}
