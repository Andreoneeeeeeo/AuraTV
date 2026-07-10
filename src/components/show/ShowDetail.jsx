import { useState, useEffect } from 'react';
import { ChevronDown, Check, Loader2, Star, CheckCheck, RotateCcw, Image as ImageIcon } from 'lucide-react';
import DetailHero from '../detail/DetailHero.jsx';
import DetailTabBar from '../detail/DetailTabBar.jsx';
import WatchProviders from '../detail/WatchProviders.jsx';
import CastRow from '../detail/CastRow.jsx';
import CrewSection from '../detail/CrewSection.jsx';
import KeywordChips from '../detail/KeywordChips.jsx';
import ImageGallery from '../detail/ImageGallery.jsx';
import MediaRow from '../detail/MediaRow.jsx';
import MetaRow from '../detail/MetaRow.jsx';
import FavoriteCharacterSection from '../detail/FavoriteCharacterSection.jsx';
import BannerPicker from '../detail/BannerPicker.jsx';
import TrailerCard from '../detail/TrailerCard.jsx';
import ContinueWatchingCard from '../detail/ContinueWatchingCard.jsx';
import WatchStatusPicker from '../shared/WatchStatusPicker.jsx';
import FavoriteButton from '../shared/FavoriteButton.jsx';
import Centered from '../shared/Centered.jsx';
import ListPicker from '../tabs/ListPicker.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import ReviewsSection from '../reviews/ReviewsSection.jsx';
import ExternalReviews from '../reviews/ExternalReviews.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { tmdb, fetchFullDetails, IMG_STILL } from '../../lib/tmdb.js';
import { fmtDate } from '../../lib/format.js';
import { translateTmdbError } from '../../lib/errors.js';
import { getShowWatchStatus, isShowCaughtUp } from '../../lib/watchStatus.js';
import { getCustomBanner } from '../../lib/customBanners.js';
import { isAnimeTitle } from '../../lib/anilist.js';

export default function ShowDetail({
  show, apiKey, onClose, onToggleEpisode, onMarkUpTo, onSetSeasonWatched, onSetWatchStatus, onMarkAllWatched, onRewatch,
  onRemove, onOpenRelated, setError, lists, onCreateList, onToggleListMembership, isPreview, onAddToLibrary,
}) {
  const { t, lang } = useI18n();
  useBackHandler(onClose);
  const [scrollY, setScrollY] = useState(0);
  const { user } = useAuth();
  const [tab, setTab] = useState('info');
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [customBanner, setCustomBannerState] = useState(null);
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false);
  const [seasonCache, setSeasonCache] = useState({});
  const [loadingSeason, setLoadingSeason] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [confirmPrompt, setConfirmPrompt] = useState(null);
  const [confirmMarkAll, setConfirmMarkAll] = useState(false);
  const [confirmSeasonAction, setConfirmSeasonAction] = useState(null);
  const [listPickerOpen, setListPickerOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingDetails(true);
    fetchFullDetails('show', show.id, apiKey, lang)
      .then((d) => { if (!cancelled) setDetails(d); })
      .catch((e) => setError(translateTmdbError(e, t)))
      .finally(() => { if (!cancelled) setLoadingDetails(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show.id, apiKey, lang]);

  useEffect(() => {
    if (!user) return;
    getCustomBanner(user.id, 'show', show.id).then((b) => setCustomBannerState(b?.banner_url || null)).catch(() => {});
  }, [user, show.id]);

  const showSeasons = show.seasons || [];
  const showWatched = show.watched || {};
  const watchedCount = Object.values(showWatched).reduce((sum, arr) => sum + arr.length, 0);
  const regularSeasons = [...showSeasons].filter((s) => s.season_number > 0).sort((a, b) => a.season_number - b.season_number);
  const specialsSeason = showSeasons.find((s) => s.season_number === 0);
  const currentSeason = regularSeasons.find((s) => (showWatched[s.season_number] || []).length < s.episode_count) || null;

  async function handleAddToLibrary() {
    setAdding(true);
    try { await onAddToLibrary(); } finally { setAdding(false); }
  }

  useEffect(() => {
    if (!currentSeason || seasonCache[currentSeason.season_number]) return;
    (async () => {
      try {
        const data = await tmdb(`/tv/${show.id}/season/${currentSeason.season_number}`, apiKey, lang);
        setSeasonCache((prev) => ({ ...prev, [currentSeason.season_number]: data.episodes || [] }));
      } catch (e) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSeason?.season_number, show.id, apiKey, lang]);

  const nextEpisodes = currentSeason
    ? (seasonCache[currentSeason.season_number] || [])
      .filter((e) => !(showWatched[currentSeason.season_number] || []).includes(e.episode_number))
      .slice(0, 8)
    : [];

  function hasPriorGap(seasonNum, epNum) {
    for (const season of showSeasons) {
      if (season.season_number === 0) continue;
      if (season.season_number < seasonNum) {
        const watchedCountForSeason = (showWatched[season.season_number] || []).length;
        if (watchedCountForSeason < season.episode_count) return true;
      } else if (season.season_number === seasonNum) {
        const watchedSet = new Set(showWatched[season.season_number] || []);
        for (let n = 1; n < epNum; n++) {
          if (!watchedSet.has(n)) return true;
        }
      }
    }
    return false;
  }

  function handleEpisodeClick(seasonNum, epNum, isWatched) {
    if (isWatched) { onToggleEpisode(show.id, seasonNum, epNum); return; }
    if (hasPriorGap(seasonNum, epNum)) setConfirmPrompt({ seasonNum, epNum });
    else onToggleEpisode(show.id, seasonNum, epNum);
  }

  async function toggleSeason(seasonNum) {
    if (expanded === seasonNum) { setExpanded(null); return; }
    setExpanded(seasonNum);
    if (!seasonCache[seasonNum]) {
      setLoadingSeason(seasonNum);
      try {
        const data = await tmdb(`/tv/${show.id}/season/${seasonNum}`, apiKey, lang);
        setSeasonCache((prev) => ({ ...prev, [seasonNum]: data.episodes || [] }));
      } catch (e) { setError(translateTmdbError(e, t)); }
      setLoadingSeason(null);
    }
  }

  async function markSeasonWatched(seasonNum, unmark = false) {
    if (unmark) {
      onSetSeasonWatched(show.id, seasonNum, []);
      return;
    }
    let episodes = seasonCache[seasonNum];
    if (!episodes) {
      try {
        const data = await tmdb(`/tv/${show.id}/season/${seasonNum}`, apiKey, lang);
        episodes = data.episodes || [];
        setSeasonCache((prev) => ({ ...prev, [seasonNum]: episodes }));
      } catch (e) { setError(translateTmdbError(e, t)); return; }
    }
    onSetSeasonWatched(show.id, seasonNum, episodes.map((e) => e.episode_number));
  }

  const allSeasonsForList = [...regularSeasons, ...(specialsSeason ? [specialsSeason] : [])];
  const year = (show.first_air_date || '').slice(0, 4);
  const seasonsLabel = regularSeasons.length === 1
    ? t('detail.seasonCount', { n: regularSeasons.length })
    : t('detail.seasonsCount', { n: regularSeasons.length });
  const subtitle = [seasonsLabel, details?.networks?.[0]?.name].filter(Boolean).join(' · ');

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto" style={{ background: 'var(--bg)' }} onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}>
      <DetailHero
        scrollY={scrollY}
        backdropPath={customBanner || details?.backdrop_path}
        title={show.name}
        subtitle={subtitle}
        onClose={onClose}
        onRemove={onRemove}
        onAddToList={() => setListPickerOpen(true)}
        showRemove={!isPreview}
        favoriteSlot={<FavoriteButton mediaType="show" mediaId={show.id} mediaTitle={show.name} mediaPoster={show.poster_path} />}
        extraMenuItems={user ? [{ label: t('customBanner.changeBanner'), icon: ImageIcon, onClick: () => setBannerPickerOpen(true) }] : []}
      />

      <DetailTabBar
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'info', label: t('detail.tabInfo') },
          { value: 'episodes', label: t('detail.tabEpisodes') },
        ]}
      />

      <div className="px-4 py-4" style={{ maxWidth: 720, margin: '0 auto' }}>
        {tab === 'info' ? (
          <>
            <div className="mb-5">
              {isPreview ? (
                <button
                  onClick={handleAddToLibrary}
                  disabled={adding}
                  className="btn-press w-full flex items-center justify-center gap-2 py-3 rounded-full font-body font-bold text-sm"
                  style={{ background: 'var(--amber)', color: 'var(--on-accent)', opacity: adding ? 0.7 : 1 }}
                >
                  {adding && <Loader2 size={15} className="animate-spin" />}
                  {t('detail.addToLibrary')}
                </button>
              ) : (
                <>
                  <WatchStatusPicker
                    value={getShowWatchStatus(show, watchedCount)}
                    onChange={onSetWatchStatus}
                    completedLabel={isShowCaughtUp(show, watchedCount) ? t('library.statusCaughtUp') : undefined}
                  />
                  {getShowWatchStatus(show, watchedCount) === 'completed' && (
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={onRewatch} className="btn-press flex items-center gap-1.5 font-body text-xs font-semibold" style={{ color: 'var(--amber)' }}>
                        <RotateCcw size={13} /> {t('library.rewatchShow')}
                      </button>
                      {show.rewatchCount > 0 && (
                        <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('library.rewatchCount', { count: show.rewatchCount })}</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {loadingDetails ? (
              <SkeletonRows count={3} height={90} />
            ) : (
              <>
                <WatchProviders providers={details?.providers} />
                <TrailerCard trailer={details?.trailer} />

                <div className="mb-5">
                  {details?.tagline && (
                    <p className="font-body text-sm italic mb-2" style={{ color: 'var(--muted)' }}>&ldquo;{details.tagline}&rdquo;</p>
                  )}
                  <h3 className="font-body text-sm font-semibold mb-2">{t('detail.infoSectionShow')}</h3>
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <p className="font-body text-xs" style={{ color: 'var(--muted)' }}>
                      {[year, (details?.genres || []).map((g) => g.name).join(', ')].filter(Boolean).join(' · ')}
                    </p>
                    {details?.certification && (
                      <span className="font-mono px-1.5 py-0.5 rounded" style={{ fontSize: 10, border: '1px solid var(--muted)', color: 'var(--muted)' }}>
                        {details.certification}
                      </span>
                    )}
                  </div>
                  {details?.vote_average > 0 && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Star size={14} fill="var(--amber)" color="var(--amber)" />
                      <span className="font-mono text-sm font-semibold">{details.vote_average.toFixed(1)}/10</span>
                      <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                        · {t('detail.tmdbRating')} · {t('detail.votes', { count: details.vote_count })}
                      </span>
                    </div>
                  )}
                  <p className="font-body text-sm mb-3" style={{ color: 'var(--text)' }}>
                    {details?.overview || t('detail.noOverview')}
                  </p>

                  <div className="rounded-lg p-3" style={{ background: 'var(--surface)' }}>
                    {details?.name && details.name !== details.original_name && (
                      <MetaRow label={t('detail.originalTitle')} value={details.original_name} />
                    )}
                    <MetaRow label={t('detail.status')} value={details?.status} />
                    <MetaRow label={t('detail.networks')} value={(details?.networks || []).map((n) => n.name).join(', ')} />
                    <MetaRow label={t('detail.countries')} value={(details?.production_countries || []).map((c) => c.name).join(', ')} />
                    <MetaRow label={t('detail.languages')} value={(details?.spoken_languages || []).map((l) => l.english_name).join(', ')} last />
                  </div>
                </div>

                <KeywordChips keywords={details?.keywords} />
                <CrewSection crew={details?.crew} />
                <ImageGallery backdrops={details?.backdrops} />
                <CastRow cast={details?.cast} />
                <FavoriteCharacterSection
                  mediaType="show"
                  mediaId={show.id}
                  cast={details?.cast}
                  title={show.name}
                  isAnime={details ? isAnimeTitle({ genres: details.genres, originalLanguage: details.original_language, originCountries: details.origin_country }) : false}
                />
                <MediaRow title={t('detail.recommended')} items={details?.recommendations} mediaType="show" onOpen={onOpenRelated} />
                <MediaRow title={t('detail.similar')} items={details?.similar} mediaType="show" onOpen={onOpenRelated} />
              </>
            )}

            <ReviewsSection mediaType="show" mediaId={show.id} mediaTitle={show.name} mediaPoster={show.poster_path} />
            <ExternalReviews mediaType="show" mediaId={show.id} apiKey={apiKey} />
          </>
        ) : isPreview ? (
          <div className="text-center py-10">
            <p className="font-body text-sm mb-4" style={{ color: 'var(--muted)' }}>{t('detail.previewEpisodesHint')}</p>
            <button
              onClick={handleAddToLibrary}
              disabled={adding}
              className="btn-press px-6 py-3 rounded-full font-body font-bold text-sm inline-flex items-center gap-2"
              style={{ background: 'var(--amber)', color: 'var(--on-accent)', opacity: adding ? 0.7 : 1 }}
            >
              {adding && <Loader2 size={15} className="animate-spin" />}
              {t('detail.addToLibrary')}
            </button>
          </div>
        ) : (
          <>
            {nextEpisodes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-body text-sm font-semibold mb-3">{t('detail.continueWatching')}</h3>
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {nextEpisodes.map((ep) => (
                    <ContinueWatchingCard
                      key={ep.id}
                      episode={ep}
                      seasonNumber={currentSeason.season_number}
                      onToggle={() => handleEpisodeClick(currentSeason.season_number, ep.episode_number, false)}
                    />
                  ))}
                </div>
              </div>
            )}
            {!currentSeason && (
              <p className="font-body text-sm mb-6" style={{ color: 'var(--muted)' }}>{t('detail.caughtUp')}</p>
            )}

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-body text-sm font-semibold">{t('detail.allEpisodes')}</h3>
              <button onClick={() => setConfirmMarkAll(true)} aria-label={t('detail.markAllShow')} className="btn-press p-1.5 rounded-lg" style={{ background: 'var(--surface)' }}>
                <CheckCheck size={16} style={{ color: 'var(--muted)' }} />
              </button>
            </div>

            {allSeasonsForList.map((season) => {
              const watchedNums = new Set(showWatched[season.season_number] || []);
              const isOpen = expanded === season.season_number;
              const pct = season.episode_count > 0 ? Math.min(100, Math.round((watchedNums.size / season.episode_count) * 100)) : 0;
              const isSpecials = season.season_number === 0;
              return (
                <div key={season.season_number} className="season-card mb-2 rounded-lg overflow-hidden" style={{ background: 'var(--surface)', boxShadow: isOpen ? '0 4px 16px rgba(0,0,0,0.3)' : 'none' }}>
                  <button onClick={() => toggleSeason(season.season_number)} className="episode-row w-full flex items-center justify-between p-3" aria-expanded={isOpen}>
                    <div className="text-left">
                      <p className="font-body font-semibold text-sm">{isSpecials ? t('detail.specials') : season.name}</p>
                      <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                        {t('showDetail.watchedOfSeason', { watched: watchedNums.size, total: season.episode_count })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        onClick={(e) => { e.stopPropagation(); setConfirmSeasonAction({ seasonNum: season.season_number, unmark: pct >= 100 }); }}
                        role="checkbox"
                        aria-checked={pct >= 100}
                        aria-label={t('showDetail.markAllSeason')}
                        className="btn-press flex items-center justify-center"
                        style={{
                          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                          border: `1.5px solid ${pct >= 100 ? 'var(--watched)' : 'var(--muted)'}`,
                          background: pct >= 100 ? 'var(--watched)' : 'transparent',
                          boxShadow: pct >= 100 ? '0 0 8px rgba(var(--watched-rgb), 0.4)' : 'none',
                        }}
                      >
                        {pct >= 100 && <Check size={14} color="var(--bg)" />}
                      </span>
                      <ChevronDown size={16} className="chevron" style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </div>
                  </button>
                  <div style={{ height: 3, background: 'var(--border)' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--watched)' : 'var(--amber)' }} />
                  </div>
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      {loadingSeason === season.season_number ? (
                        <Centered><Loader2 className="animate-spin" size={18} /></Centered>
                      ) : (seasonCache[season.season_number] || []).map((ep) => {
                        const isWatched = watchedNums.has(ep.episode_number);
                        const isFuture = !!ep.air_date && new Date(ep.air_date) > new Date();
                        return (
                          <button key={ep.id} onClick={() => handleEpisodeClick(season.season_number, ep.episode_number, isWatched)}
                            className="episode-row w-full flex items-center gap-3 p-3 text-left" style={{ borderBottom: '1px solid var(--border)' }}>
                            {ep.still_path ? (
                              <img
                                src={`${IMG_STILL}${ep.still_path}`}
                                alt=""
                                loading="lazy"
                                style={{ width: 84, height: 47, objectFit: 'cover', borderRadius: 8, flexShrink: 0, opacity: isWatched ? 0.6 : 1 }}
                              />
                            ) : (
                              <div style={{ width: 84, height: 47, borderRadius: 8, flexShrink: 0, background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ImageIcon size={16} style={{ color: 'var(--muted)' }} aria-hidden="true" />
                              </div>
                            )}
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                              border: `1.5px solid ${isWatched ? 'var(--watched)' : 'var(--muted)'}`,
                              background: isWatched ? 'var(--watched)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: isWatched ? '0 0 8px rgba(var(--watched-rgb), 0.4)' : 'none',
                            }}>
                              {isWatched && <Check size={12} color="var(--bg)" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-sm truncate" style={{ color: isWatched ? 'var(--muted)' : 'var(--text)' }}>
                                {ep.episode_number}. {ep.name}
                              </p>
                              {!isFuture && ep.air_date && (
                                <p className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{fmtDate(ep.air_date, lang)}</p>
                              )}
                            </div>
                            {isFuture && ep.air_date && (
                              <div className="flex-shrink-0 text-right" style={{ paddingLeft: 8 }}>
                                <p className="font-mono font-bold" style={{ fontSize: 15, color: 'var(--amber)', lineHeight: 1.1 }}>
                                  {fmtDate(ep.air_date, lang)}
                                </p>
                                <p className="font-mono" style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.04em' }}>
                                  {t('showDetail.upcoming')}
                                </p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {bannerPickerOpen && (
        <BannerPicker
          mediaType="show"
          mediaId={show.id}
          officialBackdrop={details?.backdrop_path}
          alternativeBackdrops={details?.backdrops}
          currentBanner={customBanner}
          onChange={setCustomBannerState}
          onClose={() => setBannerPickerOpen(false)}
        />
      )}

      {listPickerOpen && (
        <ListPicker
          lists={lists}
          itemType="show"
          itemId={show.id}
          onToggleMembership={onToggleListMembership}
          onCreateList={onCreateList}
          onClose={() => setListPickerOpen(false)}
        />
      )}

      {confirmPrompt && (
        <ConfirmDialog
          title={t('showDetail.skippedTitle')}
          body={t('showDetail.skippedBody')}
          confirmLabel={t('showDetail.markAllUpTo')}
          cancelLabel={t('showDetail.onlyThis')}
          onCancel={() => { onToggleEpisode(show.id, confirmPrompt.seasonNum, confirmPrompt.epNum); setConfirmPrompt(null); }}
          onConfirm={() => { onMarkUpTo(show.id, confirmPrompt.seasonNum, confirmPrompt.epNum); setConfirmPrompt(null); }}
        />
      )}

      {confirmMarkAll && (
        <ConfirmDialog
          title={t('detail.markAllShow')}
          body={t('detail.markAllShowConfirm')}
          confirmLabel={t('common.confirm')}
          cancelLabel={t('common.cancel')}
          onCancel={() => setConfirmMarkAll(false)}
          onConfirm={() => { onMarkAllWatched(); setConfirmMarkAll(false); }}
        />
      )}
      {confirmSeasonAction && (
        <ConfirmDialog
          title={confirmSeasonAction.unmark ? t('showDetail.unmarkSeasonTitle') : t('showDetail.markSeasonTitle')}
          body={confirmSeasonAction.unmark ? t('showDetail.unmarkSeasonBody') : t('showDetail.markSeasonBody')}
          confirmLabel={t('common.confirm')}
          cancelLabel={t('common.cancel')}
          onCancel={() => setConfirmSeasonAction(null)}
          onConfirm={() => { markSeasonWatched(confirmSeasonAction.seasonNum, confirmSeasonAction.unmark); setConfirmSeasonAction(null); }}
        />
      )}
    </div>
  );
}
