import { useEffect, useState } from 'react';
import { ExternalLink, Star } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { fetchTmdbReviews, resolveTmdbAvatarUrl } from '../../lib/tmdb.js';
import { fmtDate } from '../../lib/format.js';

const TRUNCATE_AT = 320;

export default function ExternalReviews({ mediaType, mediaId, apiKey }) {
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!apiKey) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    fetchTmdbReviews(mediaType, mediaId, apiKey, lang)
      .then((list) => { if (!cancelled) setReviews(list); })
      .catch(() => { if (!cancelled) setReviews([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [mediaType, mediaId, apiKey, lang]);

  if (!apiKey) return null;

  return (
    <div className="mt-6">
      <h3 className="font-display text-lg mb-1" style={{ letterSpacing: '0.04em' }}>{t('reviews.tmdbSectionTitle').toUpperCase()}</h3>
      <p className="font-body text-xs mb-3" style={{ color: 'var(--muted)' }}>{t('reviews.tmdbAttributionShort')}</p>

      {loading ? (
        <SkeletonRows count={2} height={100} />
      ) : reviews.length === 0 ? (
        <p className="font-body text-sm" style={{ color: 'var(--muted)' }}>{t('reviews.tmdbEmpty')}</p>
      ) : (
        reviews.map((r) => {
          const isExpanded = expanded[r.id];
          const isLong = (r.content || '').length > TRUNCATE_AT;
          const shownText = isExpanded || !isLong ? r.content : r.content.slice(0, TRUNCATE_AT).trim() + '…';
          const rating = r.author_details?.rating;
          return (
            <div key={r.id} className="rounded-xl p-4 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-3">
                <Avatar url={resolveTmdbAvatarUrl(r.author_details?.avatar_path)} name={r.author_details?.name || r.author} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-body text-sm font-semibold truncate">{r.author_details?.name || r.author}</p>
                    <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>{fmtDate(r.created_at, lang)}</span>
                  </div>
                  {rating != null && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={12} fill="var(--amber)" color="var(--amber)" />
                      <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{rating}/10</span>
                    </div>
                  )}
                </div>
              </div>

              {r.content && (
                <p className="font-body text-sm mt-3" style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                  {shownText}
                  {isLong && (
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [r.id]: !isExpanded }))}
                      className="font-body text-xs font-semibold ml-1.5"
                      style={{ color: 'var(--amber)' }}
                    >
                      {isExpanded ? t('reviews.readLess') : t('reviews.readMore')}
                    </button>
                  )}
                </p>
              )}

              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-press inline-flex items-center gap-1 mt-3 font-body text-xs font-medium"
                  style={{ color: 'var(--muted)' }}
                >
                  {t('reviews.readOnTmdb')} <ExternalLink size={12} />
                </a>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
