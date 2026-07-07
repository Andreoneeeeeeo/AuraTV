import { useState, useEffect } from 'react';
import Poster from '../shared/Poster.jsx';
import { IMG_BACKDROP } from '../../lib/tmdb.js';
import { tmdb } from '../../lib/tmdb.js';
import { useI18n } from '../../i18n/index.jsx';

export default function CollectionBanner({ collection, apiKey, onOpen }) {
  const { t, lang } = useI18n();
  const [parts, setParts] = useState([]);

  useEffect(() => {
    if (!collection?.id) return;
    let cancelled = false;
    tmdb(`/collection/${collection.id}`, apiKey, lang)
      .then((data) => { if (!cancelled) setParts(data.parts || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [collection?.id, apiKey, lang]);

  if (!collection?.id) return null;

  return (
    <div className="mb-5 rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {collection.backdrop_path && (
        <div style={{ height: 90, position: 'relative' }}>
          <img src={`${IMG_BACKDROP}${collection.backdrop_path}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1), var(--surface))' }} />
        </div>
      )}
      <div className="p-3">
        <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>{t('detail.partOfCollection')}</p>
        <p className="font-body text-sm font-semibold mb-3">{collection.name}</p>
        {parts.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {parts.map((p) => (
              <button key={p.id} onClick={() => onOpen('film', p)} className="card-tap text-left flex-shrink-0" style={{ width: 90 }}>
                <Poster path={p.poster_path} fill alt={p.title} />
                <p className="font-body text-xs mt-1.5 truncate">{p.title}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
