import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import Poster from '../shared/Poster.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import { SkeletonPosterGrid } from '../ui/Skeleton.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { listFavorites } from '../../lib/favorites.js';

export default function FavoritesSection({ onOpenRelated, onOpenRelatedGame }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    listFavorites(user.id).then(setFavorites).catch(() => {}).finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <SkeletonPosterGrid count={6} />;
  if (favorites.length === 0) return <EmptyState icon={Heart} text={t('publicProfile.noFavorites')} />;

  const shows = favorites.filter((f) => f.media_type === 'show');
  const films = favorites.filter((f) => f.media_type === 'film');
  const games = favorites.filter((f) => f.media_type === 'game');

  function openItem(f) {
    if (f.media_type === 'game') onOpenRelatedGame({ id: f.media_id, name: f.media_title, background_image: f.media_poster });
    else onOpenRelated(f.media_type, { id: f.media_id, name: f.media_title, title: f.media_title, poster_path: f.media_poster });
  }

  function Row({ title, items }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-5">
        <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>{title.toUpperCase()}</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {items.map((f) => (
            <button key={f.id} onClick={() => openItem(f)} className="card-tap text-left">
              <Poster path={f.media_poster} fill alt={f.media_title} />
              <p className="font-body text-xs mt-1.5 truncate">{f.media_title}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Row title={t('publicProfile.showsTitle')} items={shows} />
      <Row title={t('publicProfile.filmsTitle')} items={films} />
      <Row title={t('games.navLabel')} items={games} />
    </div>
  );
}
