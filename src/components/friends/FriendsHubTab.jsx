import { useState, useEffect } from 'react';
import { UserPlus, Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';
import FollowButton from '../profile/FollowButton.jsx';
import ReviewCard from '../reviews/ReviewCard.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import SegmentedControl from '../shared/SegmentedControl.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';
import FriendsPage from './FriendsPage.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { followingActivity } from '../../lib/follows.js';
import { toggleLike, getMyLikedReviewIds } from '../../lib/reviews.js';
import { searchProfiles } from '../../lib/profiles.js';

export default function FriendsHubTab() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [segment, setSegment] = useState('activity');
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (segment !== 'activity') return;
    setLoading(true);
    followingActivity(user.id)
      .then(async (feed) => {
        setActivity(feed);
        const liked = await getMyLikedReviewIds(user.id, feed.map((r) => r.id));
        setLikedIds(liked);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [segment, user.id]);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const handle = setTimeout(() => {
      searchProfiles(query, user.id).then(setSearchResults).catch(() => setSearchResults([])).finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(handle);
  }, [query, user.id]);

  async function handleLike(review) {
    const currentlyLiked = likedIds.has(review.id);
    setActivity((prev) => prev.map((r) => r.id === review.id ? { ...r, likes_count: (r.likes_count || 0) + (currentlyLiked ? -1 : 1) } : r));
    setLikedIds((prev) => {
      const next = new Set(prev);
      currentlyLiked ? next.delete(review.id) : next.add(review.id);
      return next;
    });
    try {
      await toggleLike(review.id, user.id, currentlyLiked, review.user_id, review.media_title);
    } catch (e) {}
  }

  return (
    <div>
      <div className="relative mb-4" role="search">
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('friends.searchPlaceholder')}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg font-body text-sm outline-none"
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
        />
      </div>

      {query.trim() ? (
        searching ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={20} /></div>
        ) : searchResults.length === 0 ? (
          <EmptyState icon={Search} text={t('friends.noUsersFound')} />
        ) : (
          <div className="flex flex-col gap-2">
            {searchResults.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'var(--surface)' }}>
                <Link to={`/profile/${p.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar url={p.avatar_url} name={p.display_name || p.username} size={40} />
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold truncate">{p.display_name || p.username}</p>
                    <p className="font-mono text-xs truncate" style={{ color: 'var(--muted)' }}>@{p.username}</p>
                  </div>
                </Link>
                <FollowButton targetUserId={p.id} targetName={p.display_name || p.username} />
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          <SegmentedControl
            value={segment}
            onChange={setSegment}
            options={[
              { value: 'activity', label: t('activity.tabLabel') },
              { value: 'friends', label: t('friends.title') },
            ]}
          />

          {segment === 'activity' ? (
            loading ? (
              <SkeletonRows count={3} height={110} />
            ) : activity.length === 0 ? (
              <EmptyState icon={UserPlus} text={t('activity.empty')} />
            ) : (
              activity.map((r) => (
                <ReviewCard key={r.id} review={r} isOwn={false} isLiked={likedIds.has(r.id)} onLike={() => handleLike(r)} />
              ))
            )
          ) : (
            <FriendsPage embedded />
          )}
        </>
      )}
    </div>
  );
}
