import { useState, useEffect } from 'react';
import { Star, Trophy, Award, RotateCcw, Loader2 } from 'lucide-react';
import DetailHero from '../detail/DetailHero.jsx';
import DetailTabBar from '../detail/DetailTabBar.jsx';
import MetaRow from '../detail/MetaRow.jsx';
import MediaRow from '../detail/MediaRow.jsx';
import WatchStatusPicker from '../shared/WatchStatusPicker.jsx';
import FavoriteButton from '../shared/FavoriteButton.jsx';
import Centered from '../shared/Centered.jsx';
import ReviewsSection from '../reviews/ReviewsSection.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { fetchGameDetails, gameGenres, gamePlatforms, gameDevelopers, gamePublishers } from '../../lib/rawg.js';
import { getGameWatchStatus } from '../../lib/watchStatus.js';

export default function GameDetail({
  game, onClose, onSetWatchStatus, onSetHoursPlayed, onToggleCompleted100, onTogglePlatinum, onRewatch,
  onRemove, onOpenRelated, setError, isPreview, onAddToLibrary,
}) {
  const { t } = useI18n();
  useBackHandler(onClose);
  const [scrollY, setScrollY] = useState(0);
  const [tab, setTab] = useState('info');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoursInput, setHoursInput] = useState(game.hoursPlayed || 0);
  const [adding, setAdding] = useState(false);

  async function handleAddToLibrary() {
    setAdding(true);
    try { await onAddToLibrary(); } finally { setAdding(false); }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGameDetails(game.id)
      .then((d) => { if (!cancelled) setDetails(d); })
      .catch(() => setError?.(t('common.somethingWrong')))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.id]);

  const year = (game.released || '').slice(0, 4);
  const subtitle = [year, (game.platforms || []).slice(0, 3).join(', ')].filter(Boolean).join(' · ');

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto" style={{ background: 'var(--bg)' }} onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}>
      <DetailHero
        scrollY={scrollY}
        backdropPath={game.background_image}
        title={game.name}
        subtitle={subtitle}
        onClose={onClose}
        onRemove={onRemove}
        onAddToList={() => {}}
        showAddToList={false}
        showRemove={!isPreview}
        favoriteSlot={<FavoriteButton mediaType="game" mediaId={game.id} mediaTitle={game.name} mediaPoster={game.background_image} />}
      />

      <DetailTabBar
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'info', label: t('detail.tabInfo') },
          { value: 'other', label: t('detail.tabOther') },
        ]}
      />

      <div className="px-4 py-4" style={{ maxWidth: 720, margin: '0 auto' }}>
        {tab === 'info' ? (
          <>
            {isPreview ? (
              <button
                onClick={handleAddToLibrary}
                disabled={adding}
                className="btn-press w-full flex items-center justify-center gap-2 py-3 rounded-full font-body font-bold text-sm mb-5"
                style={{ background: 'var(--amber)', color: 'var(--on-accent)', opacity: adding ? 0.7 : 1 }}
              >
                {adding && <Loader2 size={15} className="animate-spin" />}
                {t('detail.addToLibrary')}
              </button>
            ) : (
              <>
                <div className="mb-3">
                  <WatchStatusPicker kind="game" value={getGameWatchStatus(game)} onChange={onSetWatchStatus} />
                </div>

                <div className="rounded-xl p-3 mb-3 flex items-center gap-3" style={{ background: 'var(--surface)' }}>
                  <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>{t('games.hoursPlayedLabel')}</span>
                  <input
                    type="number"
                    min="0"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(e.target.value)}
                    onBlur={() => onSetHoursPlayed(Number(hoursInput) || 0)}
                    className="flex-1 px-3 py-1.5 rounded-lg font-mono text-sm outline-none"
                    style={{ background: 'var(--surface-alt)', color: 'var(--text)', border: '1px solid var(--border)', maxWidth: 80 }}
                  />
                </div>

                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  <button
                    onClick={onToggleCompleted100}
                    className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs font-semibold"
                    style={{ background: game.completed100 ? 'var(--amber)' : 'var(--surface-alt)', color: game.completed100 ? 'var(--on-accent)' : 'var(--muted)' }}
                  >
                    <Award size={13} /> {t('games.completed100')}
                  </button>
                  <button
                    onClick={onTogglePlatinum}
                    className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs font-semibold"
                    style={{ background: game.platinum ? 'var(--amber)' : 'var(--surface-alt)', color: game.platinum ? 'var(--on-accent)' : 'var(--muted)' }}
                  >
                    <Trophy size={13} /> {t('games.platinum')}
                  </button>
                  <button onClick={onRewatch} className="btn-press flex items-center gap-1.5 font-body text-xs font-semibold" style={{ color: 'var(--amber)' }}>
                    <RotateCcw size={13} /> {t('games.rewatch')}
                  </button>
                  {game.rewatchCount > 0 && (
                    <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('games.rewatchCount', { count: game.rewatchCount })}</span>
                  )}
                </div>
              </>
            )}

            {loading ? (
              <SkeletonRows count={3} height={90} />
            ) : (
              <>
                <div className="mb-5">
                  <h3 className="font-body text-sm font-semibold mb-2">{t('games.aboutTitle')}</h3>
                  {details?.metacritic > 0 && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Star size={14} fill="var(--amber)" color="var(--amber)" />
                      <span className="font-mono text-sm font-semibold">{details.metacritic}/100</span>
                      <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>· {t('games.metacritic')}</span>
                    </div>
                  )}
                  <p className="font-body text-sm mb-3" style={{ color: 'var(--text)' }}>
                    {details?.description_raw?.slice(0, 600) || t('detail.noOverview')}
                  </p>
                  <div className="rounded-lg p-3" style={{ background: 'var(--surface)' }}>
                    <MetaRow label={t('games.platforms')} value={gamePlatforms(details || game).join(', ')} />
                    <MetaRow label={t('games.developers')} value={gameDevelopers(details || game).join(', ')} />
                    <MetaRow label={t('games.publishers')} value={gamePublishers(details || game).join(', ')} />
                    <MetaRow label={t('games.esrb')} value={details?.esrb_rating?.name} />
                    <MetaRow label={t('games.avgPlaytime')} value={details?.playtime ? t('games.hoursValue', { n: details.playtime }) : null} last />
                  </div>
                </div>

                {details?.screenshots?.length > 0 && (
                  <div className="mb-5">
                    <h3 className="font-body text-sm font-semibold mb-3">{t('games.screenshotsTitle')}</h3>
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                      {details.screenshots.slice(0, 8).map((s) => (
                        <div key={s.id} className="flex-shrink-0" style={{ width: 200, height: 112, borderRadius: 10, overflow: 'hidden', background: 'var(--surface-alt)' }}>
                          <img src={s.image} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {details?.additions?.length > 0 && (
                  <MediaGameRow title={t('games.dlcTitle')} items={details.additions} onOpen={onOpenRelated} />
                )}
                {details?.series?.length > 0 && (
                  <MediaGameRow title={t('games.seriesTitle')} items={details.series} onOpen={onOpenRelated} />
                )}
              </>
            )}
          </>
        ) : (
          <ReviewsSection mediaType="game" mediaId={game.id} mediaTitle={game.name} mediaPoster={game.background_image} />
        )}
      </div>
    </div>
  );
}

function MediaGameRow({ title, items, onOpen }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-5">
      <h3 className="font-body text-sm font-semibold mb-3">{title}</h3>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {items.map((item) => (
          <button key={item.id} onClick={() => onOpen(item)} className="card-tap text-left flex-shrink-0" style={{ width: 130 }}>
            <div style={{ width: 130, height: 73, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-alt)' }}>
              {item.background_image && <img src={item.background_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <p className="font-body text-xs mt-1.5 truncate">{item.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
