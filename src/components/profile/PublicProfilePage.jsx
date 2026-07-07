import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Star, Lock, Loader2, Heart, Tv, Film, Gamepad2 } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import Poster from '../shared/Poster.jsx';
import FollowButton from './FollowButton.jsx';
import FollowListModal from './FollowListModal.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import SegmentedControl from '../shared/SegmentedControl.jsx';
import StarRating from '../reviews/StarRating.jsx';
import Centered from '../shared/Centered.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { getProfileByUsername } from '../../lib/profiles.js';
import { listReviewsByUser, computeReviewStats } from '../../lib/reviews.js';
import { countFollowers, countFollowing, listFollowers, listFollowing } from '../../lib/follows.js';
import { relationshipWith } from '../../lib/friends.js';
import { listFavorites } from '../../lib/favorites.js';
import { listPublicLibrary } from '../../lib/publicLibrary.js';
import { fmtDate } from '../../lib/format.js';
import { resolvePosterUrl } from '../../lib/tmdb.js';

export default function PublicProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [publicLibrary, setPublicLibrary] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [canView, setCanView] = useState(true);
  const [listPanel, setListPanel] = useState(null);
  const [listPanelData, setListPanelData] = useState([]);
  const [segment, setSegment] = useState('reviews');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const p = await getProfileByUsername(username);
        if (!p) { if (!cancelled) setNotFound(true); setLoading(false); return; }
        if (cancelled) return;
        setProfile(p);

        const isSelf = currentUser?.id === p.id;
        const visibility = p.privacy?.visibility || 'public';
        let allowed = true;
        if (!isSelf && visibility === 'private') allowed = false;
        else if (!isSelf && visibility === 'friends') {
          const rel = await relationshipWith(currentUser.id, p.id).catch(() => null);
          allowed = rel?.status === 'accepted';
        }
        setCanView(allowed);

        const [followers, following] = await Promise.all([countFollowers(p.id), countFollowing(p.id)]);
        if (cancelled) return;
        setFollowerCount(followers);
        setFollowingCount(following);

        if (allowed) {
          const [rev, favs, lib] = await Promise.all([
            listReviewsByUser(p.id),
            listFavorites(p.id),
            listPublicLibrary(p.id),
          ]);
          if (!cancelled) { setReviews(rev); setFavorites(favs); setPublicLibrary(lib); }
        }
      } catch (e) {
        if (!cancelled) setNotFound(true);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [username, currentUser]);

  async function openFollowList(kind) {
    setListPanel(kind);
    const data = kind === 'followers' ? await listFollowers(profile.id) : await listFollowing(profile.id);
    setListPanelData(data);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-20 overflow-y-auto" style={{ background: 'var(--bg)' }}>
        <div className="px-4 py-4" style={{ maxWidth: 640, margin: '0 auto' }}>
          <Centered><Loader2 className="animate-spin" size={26} /></Centered>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="fixed inset-0 z-20 overflow-y-auto" style={{ background: 'var(--bg)' }}>
        <div className="px-4 py-6" style={{ maxWidth: 640, margin: '0 auto' }}>
          <BackButton onBack={() => navigate(-1)} />
          <EmptyState icon={Users} text={t('publicProfile.notFound')} />
        </div>
      </div>
    );
  }

  const reviewStats = computeReviewStats(reviews);
  const isSelf = currentUser?.id === profile.id;
  const shows = publicLibrary.filter((i) => i.media_type === 'show');
  const films = publicLibrary.filter((i) => i.media_type === 'film');
  const games = publicLibrary.filter((i) => i.media_type === 'game');

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div className="relative">
        <div style={{
          height: 128, background: profile.banner_url ? `url(${profile.banner_url})` : 'var(--surface-alt)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
        <BackButton onBack={() => navigate(-1)} overlay />
        <div className="absolute" style={{ left: 16, bottom: -28 }}>
          <Avatar url={profile.avatar_url} name={profile.display_name || profile.username} size={72} ring />
        </div>
      </div>

      <div className="px-4" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="mt-9 flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl leading-tight">{profile.display_name || profile.username}</h2>
            <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>@{profile.username}</p>
          </div>
          {!isSelf && <FollowButton targetUserId={profile.id} targetName={profile.display_name || profile.username} onChange={(nowFollowing) => setFollowerCount((c) => c + (nowFollowing ? 1 : -1))} />}
        </div>

        {profile.bio && canView && <p className="font-body text-sm mt-3">{profile.bio}</p>}
        {profile.created_at && (
          <p className="font-mono text-xs mt-2" style={{ color: 'var(--muted)' }}>
            {t('publicProfile.memberSince', { date: fmtDate(profile.created_at, lang) })}
          </p>
        )}

        <div className="flex items-center gap-4 mt-4">
          <button onClick={() => openFollowList('followers')} className="btn-press font-body text-sm font-medium">
            <b>{followerCount}</b> {t('follow.followers')}
          </button>
          <button onClick={() => openFollowList('following')} className="btn-press font-body text-sm font-medium">
            <b>{followingCount}</b> {t('follow.followingCount')}
          </button>
          {canView && (
            <span className="flex items-center gap-1.5 font-body text-sm font-medium">
              <Star size={15} style={{ color: 'var(--muted)' }} />
              {t('profile.reviewsCount', { count: reviewStats.count })}
            </span>
          )}
        </div>

        <div className="mt-6 pb-8">
          {!canView ? (
            <EmptyState icon={Lock} text={t('publicProfile.private')} />
          ) : (
            <>
              <SegmentedControl
                value={segment}
                onChange={setSegment}
                options={[
                  { value: 'reviews', label: t('profile.reviewsTab') },
                  { value: 'favorites', label: t('publicProfile.favoritesTitle') },
                  { value: 'shows', label: t('publicProfile.showsTitle') },
                  { value: 'films', label: t('publicProfile.filmsTitle') },
                  { value: 'games', label: t('games.navLabel') },
                ]}
              />

              {segment === 'reviews' && (
                reviews.length === 0 ? (
                  <EmptyState icon={Star} text={t('profile.noReviewsYet')} />
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="rounded-xl p-3 mb-2 flex gap-3" style={{ background: 'var(--surface)' }}>
                      {r.media_poster && (
                        <img src={resolvePosterUrl(r.media_poster)} alt="" style={{ width: 42, height: 63, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-semibold truncate">{r.media_title}</p>
                        <StarRating value={Number(r.rating)} readOnly size={13} label="" />
                        <p className="font-mono text-xs mt-1" style={{ color: 'var(--muted)' }}>{fmtDate(r.created_at, lang)}</p>
                      </div>
                    </div>
                  ))
                )
              )}

              {segment === 'favorites' && (
                favorites.length === 0 ? (
                  <EmptyState icon={Heart} text={t('publicProfile.noFavorites')} />
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {favorites.map((f) => (
                      <div key={f.id}>
                        <Poster path={f.media_poster} fill alt={f.media_title} />
                        <p className="font-body text-xs mt-1.5 truncate">{f.media_title}</p>
                      </div>
                    ))}
                  </div>
                )
              )}

              {segment === 'shows' && (
                shows.length === 0 ? (
                  <EmptyState icon={Tv} text={t('publicProfile.noLibraryShows')} />
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {shows.map((s) => (
                      <div key={s.media_id}>
                        <Poster path={s.media_poster} fill alt={s.media_title} />
                        <p className="font-body text-xs mt-1.5 truncate">{s.media_title}</p>
                      </div>
                    ))}
                  </div>
                )
              )}

              {segment === 'films' && (
                films.length === 0 ? (
                  <EmptyState icon={Film} text={t('publicProfile.noLibraryFilms')} />
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {films.map((f) => (
                      <div key={f.media_id}>
                        <Poster path={f.media_poster} fill alt={f.media_title} />
                        <p className="font-body text-xs mt-1.5 truncate">{f.media_title}</p>
                      </div>
                    ))}
                  </div>
                )
              )}

              {segment === 'games' && (
                games.length === 0 ? (
                  <EmptyState icon={Gamepad2} text={t('publicProfile.noLibraryGames')} />
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {games.map((g) => (
                      <div key={g.media_id}>
                        <Poster path={g.media_poster} fill alt={g.media_title} />
                        <p className="font-body text-xs mt-1.5 truncate">{g.media_title}</p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>

      {listPanel && (
        <FollowListModal kind={listPanel} data={listPanelData} onClose={() => setListPanel(null)} />
      )}
    </div>
  );
}

function BackButton({ onBack, overlay }) {
  return (
    <button
      onClick={onBack}
      aria-label="Indietro"
      className="btn-press flex items-center justify-center absolute"
      style={{
        top: 14, left: 14, width: 34, height: 34, borderRadius: '50%',
        background: overlay ? 'rgba(0,0,0,0.5)' : 'var(--surface)', zIndex: 5,
      }}
    >
      <ChevronLeft size={19} color={overlay ? '#fff' : 'var(--text)'} />
    </button>
  );
}
