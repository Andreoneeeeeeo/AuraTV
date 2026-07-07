import { useState, useEffect, lazy, Suspense } from 'react';
import { Settings as SettingsIcon, Users, Pencil, Star, Loader2 } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import FollowListModal from './FollowListModal.jsx';
import FavoritesSection from './FavoritesSection.jsx';
import InProgressSection from './InProgressSection.jsx';
import StatsPreviewCard from './StatsPreviewCard.jsx';
import ScrollableTabs from '../shared/ScrollableTabs.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import StarRating from '../reviews/StarRating.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { listReviewsByUser, computeReviewStats } from '../../lib/reviews.js';
import { resolvePosterUrl } from '../../lib/tmdb.js';
import { countFollowers, countFollowing, listFollowers, listFollowing } from '../../lib/follows.js';
import { fmtDate } from '../../lib/format.js';

const EditProfileModal = lazy(() => import('./EditProfileModal.jsx'));
const StatsPage = lazy(() => import('../tabs/StatsPage.jsx'));

function ModalFallback() {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center" style={{ background: 'var(--overlay)' }}>
      <Loader2 className="animate-spin" size={24} style={{ color: 'var(--amber)' }} />
    </div>
  );
}

export default function ProfilePage({
  onOpenSettings, onGoToFriends, library, filmLibrary, gameLibrary, watchedCountForShow, watchLog, showGames,
  onOpenShow, onOpenFilm, onOpenGame, onOpenRelated, onOpenRelatedGame,
}) {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [tab, setTab] = useState('favorites');
  const [reviews, setReviews] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [listPanel, setListPanel] = useState(null);
  const [listPanelData, setListPanelData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rev, followers, following] = await Promise.all([
          listReviewsByUser(user.id),
          countFollowers(user.id),
          countFollowing(user.id),
        ]);
        setReviews(rev);
        setFollowerCount(followers);
        setFollowingCount(following);
      } catch (e) {}
      setLoading(false);
    })();
  }, [user.id]);

  async function openFollowList(kind) {
    setListPanel(kind);
    const data = kind === 'followers' ? await listFollowers(user.id) : await listFollowing(user.id);
    setListPanelData(data);
  }

  const reviewStats = computeReviewStats(reviews);
  const mostReviewed = [...reviews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);

  const shows = Object.values(library);
  const films = Object.values(filmLibrary || {});
  const totalWatched = shows.reduce((sum, s) => sum + watchedCountForShow(s), 0);
  const totalMinutes = shows.reduce((sum, s) => sum + watchedCountForShow(s) * (s.episode_run_time || 45), 0);
  const totalHours = Math.round(totalMinutes / 60);
  const completed = shows.filter((s) => s.number_of_episodes > 0 && watchedCountForShow(s) >= s.number_of_episodes).length;
  const filmsWatched = films.filter((f) => f.watched).length;

  return (
    <div className="fade-in">
      <div className="relative">
        <div
          style={{
            height: 128, borderRadius: 16, overflow: 'hidden', background: profile?.banner_url ? 'transparent' : 'var(--surface-alt)',
            backgroundImage: profile?.banner_url ? `url(${profile.banner_url})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        />
        <div className="absolute" style={{ left: 16, bottom: -28 }}>
          <Avatar url={profile?.avatar_url} name={profile?.display_name || profile?.username} size={72} ring />
        </div>
        <button
          onClick={onOpenSettings}
          aria-label={t('nav.settings')}
          className="btn-press absolute p-2 rounded-full"
          style={{ top: 10, right: 10, background: 'rgba(0,0,0,0.45)' }}
        >
          <SettingsIcon size={17} color="#fff" />
        </button>
      </div>

      <div className="mt-9 px-1">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl leading-tight">{profile?.display_name || profile?.username}</h2>
            <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>@{profile?.username}</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs font-semibold"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            <Pencil size={13} /> {t('common.edit')}
          </button>
        </div>

        {profile?.bio && <p className="font-body text-sm mt-3" style={{ color: 'var(--text)' }}>{profile.bio}</p>}

        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <button onClick={onGoToFriends} className="btn-press flex items-center gap-1.5 font-body text-sm font-medium">
            <Users size={15} style={{ color: 'var(--muted)' }} />
            {t('nav.friends')}
          </button>
          <button onClick={() => openFollowList('followers')} className="btn-press font-body text-sm font-medium">
            <b>{followerCount}</b> {t('follow.followers')}
          </button>
          <button onClick={() => openFollowList('following')} className="btn-press font-body text-sm font-medium">
            <b>{followingCount}</b> {t('follow.followingCount')}
          </button>
          <span className="flex items-center gap-1.5 font-body text-sm font-medium">
            <Star size={15} style={{ color: 'var(--muted)' }} />
            {t('profile.reviewsCount', { count: reviewStats.count })}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <StatsPreviewCard
          onOpen={() => setStatsOpen(true)}
          totalWatched={totalWatched}
          totalHours={totalHours}
          filmsWatched={filmsWatched}
          completed={completed}
        />

        <ScrollableTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'favorites', label: t('profile.favoritesTab') },
            { value: 'progress', label: t('profile.inProgressTab') },
            { value: 'reviews', label: t('profile.reviewsTab') },
          ]}
        />

        {tab === 'favorites' && (
          <FavoritesSection onOpenRelated={onOpenRelated} onOpenRelatedGame={onOpenRelatedGame} />
        )}

        {tab === 'progress' && (
          <InProgressSection
            library={library} filmLibrary={filmLibrary} gameLibrary={gameLibrary}
            watchedCountForShow={watchedCountForShow} showGames={showGames}
            onOpenShow={onOpenShow} onOpenFilm={onOpenFilm} onOpenGame={onOpenGame}
          />
        )}

        {tab === 'reviews' && (
          loading ? (
            <SkeletonRows count={3} height={90} />
          ) : reviews.length === 0 ? (
            <EmptyState icon={Star} text={t('profile.noReviewsYet')} />
          ) : (
            mostReviewed.map((r) => (
              <div key={r.id} className="rounded-xl p-3 mb-2 flex gap-3" style={{ background: 'var(--surface)' }}>
                {r.media_poster && (
                  <img src={resolvePosterUrl(r.media_poster)} alt="" style={{ width: 42, height: 63, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold truncate">{r.media_title}</p>
                  <StarRating value={Number(r.rating)} readOnly size={13} label={t('reviews.yourRating')} />
                  <p className="font-mono text-xs mt-1" style={{ color: 'var(--muted)' }}>{fmtDate(r.created_at, lang)}</p>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {editing && (
        <Suspense fallback={<ModalFallback />}>
          <EditProfileModal onClose={() => setEditing(false)} />
        </Suspense>
      )}
      {statsOpen && (
        <Suspense fallback={<ModalFallback />}>
          <StatsPage
            onClose={() => setStatsOpen(false)}
            library={library} filmLibrary={filmLibrary} gameLibrary={gameLibrary}
            watchedCountForShow={watchedCountForShow} watchLog={watchLog} showGames={showGames}
          />
        </Suspense>
      )}
      {listPanel && (
        <FollowListModal kind={listPanel} data={listPanelData} onClose={() => setListPanel(null)} />
      )}
    </div>
  );
}
