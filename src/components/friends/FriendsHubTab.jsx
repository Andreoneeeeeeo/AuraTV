import { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import FollowButton from '../profile/FollowButton.jsx';
import ReviewCard from '../reviews/ReviewCard.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import SegmentedControl from '../shared/SegmentedControl.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';
import FriendsPage from './FriendsPage.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { followingActivity, suggestedUsers } from '../../lib/follows.js';
import { toggleLike, getMyLikedReviewIds } from '../../lib/reviews.js';

export default function FriendsHubTab() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [segment, setSegment] = useState('activity');
  const [activity, setActivity] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());

  useEffect(() => {
    if (segment !== 'activity') return;
    setLoading(true);
    Promise.all([followingActivity(user.id), suggestedUsers(user.id)])
      .then(async ([feed, sugg]) => {
        setActivity(feed);
        setSuggested(sugg);
        const liked = await getMyLikedReviewIds(user.id, feed.map((r) => r.id));
        setLikedIds(liked);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [segment, user.id]);

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
        ) : (
          <>
            {suggested.length > 0 && (
              <div className="mb-5">
                <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>{t('follow.suggested').toUpperCase()}</p>
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {suggested.map((p) => (
                    <div key={p.id} className="rounded-xl p-3 flex-shrink-0 text-center" style={{ width: 110, background: 'var(--surface)' }}>
                      <Avatar url={p.avatar_url} name={p.display_name || p.username} size={48} />
                      <p className="font-body text-xs font-semibold mt-2 truncate">{p.display_name || p.username}</p>
                      <div className="mt-2 flex justify-center">
                        <FollowButton targetUserId={p.id} targetName={p.display_name || p.username} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activity.length === 0 ? (
              <EmptyState icon={UserPlus} text={t('activity.empty')} />
            ) : (
              activity.map((r) => (
                <ReviewCard key={r.id} review={r} isOwn={false} isLiked={likedIds.has(r.id)} onLike={() => handleLike(r)} />
              ))
            )}
          </>
        )
      ) : (
        <FriendsPage embedded />
      )}
    </div>
  );
}
