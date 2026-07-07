import { PlayCircle } from 'lucide-react';
import Poster from '../shared/Poster.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { getShowWatchStatus, getFilmWatchStatus, getGameWatchStatus } from '../../lib/watchStatus.js';

function Row({ title, items, getPoster, getLabel, onOpen }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-5">
      <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>{title.toUpperCase()}</p>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {items.map((item) => (
          <button key={item.id} onClick={() => onOpen(item.id)} className="card-tap text-left flex-shrink-0" style={{ width: 100 }}>
            <Poster path={getPoster(item)} fill alt={getLabel(item)} />
            <p className="font-body text-xs mt-1.5 truncate">{getLabel(item)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function InProgressSection({ library, filmLibrary, gameLibrary, watchedCountForShow, showGames, onOpenShow, onOpenFilm, onOpenGame }) {
  const { t } = useI18n();

  const shows = Object.values(library)
    .filter((s) => ['watching'].includes(getShowWatchStatus(s, watchedCountForShow(s))))
    .sort((a, b) => (b.lastWatchedAt || b.addedAt) - (a.lastWatchedAt || a.addedAt))
    .slice(0, 12);

  const films = Object.values(filmLibrary)
    .filter((f) => getFilmWatchStatus(f) === 'watching')
    .sort((a, b) => (b.lastWatchedAt || b.addedAt) - (a.lastWatchedAt || a.addedAt))
    .slice(0, 12);

  const recentlyWatched = [
    ...Object.values(library).filter((s) => getShowWatchStatus(s, watchedCountForShow(s)) === 'completed'),
    ...Object.values(filmLibrary).filter((f) => f.watched),
  ]
    .sort((a, b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0))
    .slice(0, 12);

  const games = Object.values(gameLibrary || {})
    .filter((g) => getGameWatchStatus(g) === 'watching')
    .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
    .slice(0, 12);

  const recentGames = Object.values(gameLibrary || {})
    .filter((g) => getGameWatchStatus(g) === 'completed')
    .slice(0, 12);

  const nothing = shows.length === 0 && films.length === 0 && recentlyWatched.length === 0 && games.length === 0 && recentGames.length === 0;
  if (nothing) return <EmptyState icon={PlayCircle} text={t('profile.noInProgress')} />;

  return (
    <div>
      <Row title={t('profile.watchingNow')} items={[...shows, ...films]} getPoster={(i) => i.poster_path} getLabel={(i) => i.name || i.title} onOpen={(id) => (library[id] ? onOpenShow(id) : onOpenFilm(id))} />
      <Row title={t('profile.recentlyWatched')} items={recentlyWatched} getPoster={(i) => i.poster_path} getLabel={(i) => i.name || i.title} onOpen={(id) => (library[id] ? onOpenShow(id) : onOpenFilm(id))} />
      {showGames && (
        <>
          <Row title={t('profile.playingNow')} items={games} getPoster={(i) => i.background_image} getLabel={(i) => i.name} onOpen={onOpenGame} />
          <Row title={t('profile.recentlyPlayed')} items={recentGames} getPoster={(i) => i.background_image} getLabel={(i) => i.name} onOpen={onOpenGame} />
        </>
      )}
    </div>
  );
}
