import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { isFavorite, addFavorite, removeFavorite } from '../../lib/favorites.js';

export default function FavoriteButton({ mediaType, mediaId, mediaTitle, mediaPoster }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const [favorite, setFavorite] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    isFavorite(user.id, mediaType, mediaId).then(setFavorite).catch(() => setFavorite(false));
  }, [user, mediaType, mediaId]);

  if (!user || favorite === null) return null;

  async function handleClick() {
    setBusy(true);
    try {
      if (favorite) {
        await removeFavorite(user.id, mediaType, mediaId);
        setFavorite(false);
        toast.info(t('favorites.removed'));
      } else {
        await addFavorite(user.id, mediaType, mediaId, mediaTitle, mediaPoster);
        setFavorite(true);
        toast.success(t('favorites.added'));
      }
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
    setBusy(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      aria-pressed={favorite}
      aria-label={favorite ? t('favorites.remove') : t('favorites.add')}
      className="btn-press flex items-center justify-center flex-shrink-0"
      style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', opacity: busy ? 0.7 : 1 }}
    >
      <Heart size={17} fill={favorite ? 'var(--tally)' : 'none'} color={favorite ? 'var(--tally)' : '#fff'} />
    </button>
  );
}
