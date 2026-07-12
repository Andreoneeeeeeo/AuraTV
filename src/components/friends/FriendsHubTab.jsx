import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Clock, Check, X, Search, Loader2 } from 'lucide-react';
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
import { useToast } from '../../contexts/ToastContext.jsx';
import { followingActivity } from '../../lib/follows.js';
import { toggleLike, getMyLikedReviewIds } from '../../lib/reviews.js';
import { searchProfiles } from '../../lib/profiles.js';
import { relationshipWith, sendFriendRequest, cancelFriendRequest, respondFriendRequest } from '../../lib/friends.js';

export default function FriendsHubTab() {
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const [segment, setSegment] = useState('activity');
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [friendStatus, setFriendStatus] = useState({});

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
      searchProfiles(query, user.id)
        .then(async (results) => {
          setSearchResults(results);
          const entries = await Promise.all(results.map(async (p) => [p.id, await relationshipWith(user.id, p.id).catch(() => null)]));
          setFriendStatus(Object.fromEntries(entries));
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
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

  async function handleSendRequest(targetId) {
    try {
      const row = await sendFriendRequest(user.id, targetId);
      setFriendStatus((prev) => ({ ...prev, [targetId]: row }));
    } catch (e) { toast.error(t('common.somethingWrong')); }
  }

  async function handleCancelRequest(targetId, requestId) {
    try {
      await cancelFriendRequest(requestId);
      setFriendStatus((prev) => ({ ...prev, [targetId]: null }));
    } catch (e) { toast.error(t('common.somethingWrong')); }
  }

  async function handleRespond(targetId, requestId, accept) {
    try {
      const row = await respondFriendRequest(requestId, accept, user.id);
      setFriendStatus((prev) => ({ ...prev, [targetId]: row }));
    } catch (e) { toast.error(t('common.somethingWrong')); }
  }

  function renderFriendAction(p) {
    const rel = friendStatus[p.id];
    if (rel === undefined) return null;
    if (!rel) {
      return (
        <button onClick={() => handleSendRequest(p.id)} className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs font-semibold"
          style={{ background: 'var(--surface-alt)', color: 'var(--text)', border: '1px solid var(--border)' }}>
          <UserPlus size={13} /> {t('friends.sendRequest')}
        </button>
      );
    }
    if (rel.status === 'accepted') {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs font-semibold" style={{ color: 'var(--watched)' }}>
          <UserCheck size={13} /> {t('friends.alreadyFriends')}
        </span>
      );
    }
    if (rel.requester_id === user.id) {
      return (
        <button onClick={() => handleCancelRequest(p.id, rel.id)} className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-xs font-semibold"
          style={{ background: 'var(--surface-alt)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
          <Clock size={13} /> {t('friends.requestSent')}
        </button>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <button onClick={() => handleRespond(p.id, rel.id, true)} aria-label={t('friends.accept')} className="btn-press flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--watched)' }}>
          <Check size={14} color="var(--bg)" />
        </button>
        <button onClick={() => handleRespond(p.id, rel.id, false)} aria-label={t('friends.decline')} className="btn-press flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--surface-alt)', border: '1px solid var(--border)' }}>
          <X size={14} style={{ color: 'var(--muted)' }} />
        </button>
      </div>
    );
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
              <div key={p.id} className="flex flex-col gap-2.5 p-2.5 rounded-xl" style={{ background: 'var(--surface)' }}>
                <div className="flex items-center gap-3">
                  <Link to={`/profile/${p.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar url={p.avatar_url} name={p.display_name || p.username} size={40} />
                    <div className="min-w-0">
                      <p className="font-body text-sm font-semibold truncate">{p.display_name || p.username}</p>
                      <p className="font-mono text-xs truncate" style={{ color: 'var(--muted)' }}>@{p.username}</p>
                    </div>
                  </Link>
                  <FollowButton targetUserId={p.id} targetName={p.display_name || p.username} />
                </div>
                <div className="flex justify-end" style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  {renderFriendAction(p)}
                </div>
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
