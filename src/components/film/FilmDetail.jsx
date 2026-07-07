import { useState, useEffect } from 'react';
import { Star, RotateCcw, Image as ImageIcon, Loader2 } from 'lucide-react';
import DetailHero from '../detail/DetailHero.jsx';
import DetailTabBar from '../detail/DetailTabBar.jsx';
import WatchProviders from '../detail/WatchProviders.jsx';
import CastRow from '../detail/CastRow.jsx';
import CrewSection from '../detail/CrewSection.jsx';
import KeywordChips from '../detail/KeywordChips.jsx';
import ImageGallery from '../detail/ImageGallery.jsx';
import MediaRow from '../detail/MediaRow.jsx';
import MetaRow from '../detail/MetaRow.jsx';
import CollectionBanner from '../detail/CollectionBanner.jsx';
import FavoriteCharacterSection from '../detail/FavoriteCharacterSection.jsx';
import BannerPicker from '../detail/BannerPicker.jsx';
import TrailerCard from '../detail/TrailerCard.jsx';
import WatchStatusPicker from '../shared/WatchStatusPicker.jsx';
import FavoriteButton from '../shared/FavoriteButton.jsx';
import ListPicker from '../tabs/ListPicker.jsx';
import ReviewsSection from '../reviews/ReviewsSection.jsx';
import ExternalReviews from '../reviews/ExternalReviews.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { fetchFullDetails } from '../../lib/tmdb.js';
import { getCustomBanner } from '../../lib/customBanners.js';
import { isAnimeTitle } from '../../lib/anilist.js';
import { fmtDate } from '../../lib/format.js';
import { translateTmdbError } from '../../lib/errors.js';
import { getFilmWatchStatus } from '../../lib/watchStatus.js';

function fmtCurrency(n, lang) {
  if (!n) return null;
  try {
    return new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  } catch (e) { return `$${n}`; }
}

export default function FilmDetail({ film, apiKey, onClose, onSetWatchStatus, onRewatch, onRemove, onOpenRelated, lists, onCreateList, onToggleListMembership, setError, isPreview, onAddToLibrary }) {
  const { t, lang } = useI18n();
  useBackHandler(onClose);
  const [scrollY, setScrollY] = useState(0);
  const { user } = useAuth();
  const [tab, setTab] = useState('info');
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [listPickerOpen, setListPickerOpen] = useState(false);
  const [customBanner, setCustomBannerState] = useState(null);
  const [bannerPickerOpen, setBannerPickerOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  async function handleAddToLibrary() {
    setAdding(true);
    try { await onAddToLibrary(); } finally { setAdding(false); }
  }

  useEffect(() => {
    let cancelled = false;
    setLoadingDetails(true);
    fetchFullDetails('film', film.id, apiKey, lang)
      .then((d) => { if (!cancelled) setDetails(d); })
      .catch((e) => setError?.(translateTmdbError(e, t)))
      .finally(() => { if (!cancelled) setLoadingDetails(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [film.id, apiKey, lang]);

  useEffect(() => {
    if (!user) return;
    getCustomBanner(user.id, 'film', film.id).then((b) => setCustomBannerState(b?.banner_url || null)).catch(() => {});
  }, [user, film.id]);

  const year = (film.release_date || '').slice(0, 4);
  const subtitle = [`${film.runtime} ${t('common.minutes')}`, (details?.genres || []).map((g) => g.name).join(', ')].filter(Boolean).join(' · ');

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto" style={{ background: 'var(--bg)' }} onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}>
      <DetailHero
        scrollY={scrollY}
        backdropPath={customBanner || details?.backdrop_path}
        title={film.title}
        subtitle={subtitle}
        onClose={onClose}
        onRemove={onRemove}
        onAddToList={() => setListPickerOpen(true)}
        showRemove={!isPreview}
        favoriteSlot={<FavoriteButton mediaType="film" mediaId={film.id} mediaTitle={film.title} mediaPoster={film.poster_path} />}
        extraMenuItems={user ? [{ label: t('customBanner.changeBanner'), icon: ImageIcon, onClick: () => setBannerPickerOpen(true) }] : []}
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
            <div className="mb-2">
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
                  <WatchStatusPicker value={getFilmWatchStatus(film)} onChange={onSetWatchStatus} />
                  {film.watched && (
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={onRewatch} className="btn-press flex items-center gap-1.5 font-body text-xs font-semibold" style={{ color: 'var(--amber)' }}>
                        <RotateCcw size={13} /> {t('library.rewatchFilm')}
                      </button>
                      {film.rewatchCount > 0 && (
                        <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('library.rewatchCount', { count: film.rewatchCount })}</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            {film.watched && film.watchedAt && (
              <p className="font-mono text-xs mt-2 mb-3" style={{ color: 'var(--muted)' }}>
                {t('filmDetail.watchedOn', { date: fmtDate(new Date(film.watchedAt).toISOString(), lang) })}
              </p>
            )}

            {loadingDetails ? (
              <SkeletonRows count={3} height={90} />
            ) : (
              <>
                <div className="mt-3"><WatchProviders providers={details?.providers} /></div>
                <TrailerCard trailer={details?.trailer} />

                <div className="mb-5">
                  {details?.tagline && (
                    <p className="font-body text-sm italic mb-2" style={{ color: 'var(--muted)' }}>&ldquo;{details.tagline}&rdquo;</p>
                  )}
                  <h3 className="font-body text-sm font-semibold mb-2">{t('detail.infoSectionFilm')}</h3>
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <p className="font-body text-xs" style={{ color: 'var(--muted)' }}>{year}</p>
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
                    {details?.title && details.title !== details.original_title && (
                      <MetaRow label={t('detail.originalTitle')} value={details.original_title} />
                    )}
                    <MetaRow label={t('detail.status')} value={details?.status} />
                    <MetaRow label={t('detail.studios')} value={(details?.production_companies || []).map((c) => c.name).join(', ')} />
                    <MetaRow label={t('detail.countries')} value={(details?.production_countries || []).map((c) => c.name).join(', ')} />
                    <MetaRow label={t('detail.languages')} value={(details?.spoken_languages || []).map((l) => l.english_name).join(', ')} />
                    <MetaRow label={t('detail.budget')} value={fmtCurrency(details?.budget, lang)} />
                    <MetaRow label={t('detail.revenue')} value={fmtCurrency(details?.revenue, lang)} last />
                  </div>
                </div>

                <CollectionBanner collection={details?.belongs_to_collection} apiKey={apiKey} onOpen={onOpenRelated} />
                <KeywordChips keywords={details?.keywords} />
                <CrewSection crew={details?.crew} />
                <ImageGallery backdrops={details?.backdrops} />
                <CastRow cast={details?.cast} />
                <FavoriteCharacterSection
                  mediaType="film"
                  mediaId={film.id}
                  cast={details?.cast}
                  title={film.title}
                  isAnime={details ? isAnimeTitle({ genres: details.genres, originalLanguage: details.original_language }) : false}
                />
                <MediaRow title={t('detail.recommended')} items={details?.recommendations} mediaType="film" onOpen={onOpenRelated} />
                <MediaRow title={t('detail.similar')} items={details?.similar} mediaType="film" onOpen={onOpenRelated} />
              </>
            )}
          </>
        ) : (
          <>
            <ReviewsSection mediaType="film" mediaId={film.id} mediaTitle={film.title} mediaPoster={film.poster_path} />
            <ExternalReviews mediaType="film" mediaId={film.id} apiKey={apiKey} />
          </>
        )}
      </div>

      {bannerPickerOpen && (
        <BannerPicker
          mediaType="film"
          mediaId={film.id}
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
          itemType="film"
          itemId={film.id}
          onToggleMembership={onToggleListMembership}
          onCreateList={onCreateList}
          onClose={() => setListPickerOpen(false)}
        />
      )}
    </div>
  );
}
