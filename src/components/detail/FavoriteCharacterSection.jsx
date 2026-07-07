import { useState, useEffect } from 'react';
import { Star, X, Pencil } from 'lucide-react';
import { IMG_PROFILE } from '../../lib/tmdb.js';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { getFavoriteCharacter, setFavoriteCharacter, removeFavoriteCharacter } from '../../lib/favoriteCharacter.js';

export default function FavoriteCharacterSection({ mediaType, mediaId, cast }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const [favorite, setFavorite] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getFavoriteCharacter(user.id, mediaType, mediaId).then(setFavorite).catch(() => {}).finally(() => setLoading(false));
  }, [user, mediaType, mediaId]);

  if (!user || loading || !cast || cast.length === 0) return null;

  async function handlePick(person) {
    try {
      await setFavoriteCharacter(user.id, mediaType, mediaId, {
        characterName: person.character || person.name,
        actorName: person.name,
        profilePath: person.profile_path,
      });
      setFavorite({ character_name: person.character || person.name, actor_name: person.name, profile_path: person.profile_path });
      setPickerOpen(false);
      toast.success(t('favoriteCharacter.saved'));
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
  }

  async function handleRemove() {
    try {
      await removeFavoriteCharacter(user.id, mediaType, mediaId);
      setFavorite(null);
      toast.info(t('favoriteCharacter.removed'));
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
  }

  return (
    <div className="mb-5">
      <h3 className="font-body text-sm font-semibold mb-3 flex items-center gap-1.5">
        <Star size={14} style={{ color: 'var(--amber)' }} fill="var(--amber)" /> {t('favoriteCharacter.title')}
      </h3>

      {favorite ? (
        <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'var(--surface)' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-alt)', flexShrink: 0 }}>
            {favorite.profile_path && <img src={`${IMG_PROFILE}${favorite.profile_path}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-semibold truncate">{favorite.character_name}</p>
            <p className="font-mono text-xs truncate" style={{ color: 'var(--muted)' }}>{favorite.actor_name}</p>
          </div>
          <button onClick={() => setPickerOpen(true)} aria-label={t('favoriteCharacter.change')} className="flex-shrink-0 p-1.5">
            <Pencil size={14} style={{ color: 'var(--muted)' }} />
          </button>
          <button onClick={handleRemove} aria-label={t('favoriteCharacter.remove')} className="flex-shrink-0 p-1.5">
            <X size={14} style={{ color: 'var(--tally)' }} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setPickerOpen(true)}
          className="btn-press w-full py-3 rounded-full font-body font-semibold text-sm"
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px dashed var(--border)' }}
        >
          {t('favoriteCharacter.choose')}
        </button>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: 'var(--overlay-strong)' }} onClick={() => setPickerOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="modal-sheet w-full rounded-t-2xl overflow-y-auto" style={{ background: 'var(--bg)', maxWidth: 480, maxHeight: '75vh', border: '1px solid var(--border)', borderBottom: 'none' }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="font-display text-xl">{t('favoriteCharacter.pickerTitle')}</p>
              <button onClick={() => setPickerOpen(false)} aria-label={t('common.close')}><X size={20} style={{ color: 'var(--muted)' }} /></button>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {cast.map((person) => (
                <button key={person.id} onClick={() => handlePick(person)} className="btn-press text-center">
                  <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-alt)' }}>
                    {person.profile_path && <img src={`${IMG_PROFILE}${person.profile_path}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <p className="font-body text-xs font-semibold mt-1.5 truncate">{person.character}</p>
                  <p className="font-mono truncate" style={{ fontSize: 10, color: 'var(--muted)' }}>{person.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
