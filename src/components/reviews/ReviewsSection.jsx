import { useEffect, useState, useCallback } from 'react';
import { ChevronDown, Star } from 'lucide-react';
import ReviewForm from './ReviewForm.jsx';
import ReviewCard from './ReviewCard.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import {
  getMyReview, listReviewsForMedia, upsertReview, deleteReview,
  toggleLike, getMyLikedReviewIds, computeReviewStats,
} from '../../lib/reviews.js';

const SORTS = ['recent', 'popular', 'highest', 'lowest'];

export default function ReviewsSection({ mediaType, mediaId, mediaTitle, mediaPoster }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [likedIds, setLikedIds] = useState(new Set());
  const [sort, setSort] = useState('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listReviewsForMedia(mediaType, mediaId, sort);
      setReviews(list);
      if (user) {
        const mine = list.find(r => r.user_id === user.id) || await getMyReview(user.id, mediaType, mediaId);
        setMyReview(mine);
        const liked = await getMyLikedReviewIds(user.id, list.map(r => r.id));
        setLikedIds(liked);
      }
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, mediaId, sort, user]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmitReview({ rating, body, hasSpoilers }) {
    try {
      await upsertReview({
        userId: user.id, mediaType, mediaId, mediaTitle, mediaPoster,
        rating, body, hasSpoilers, notifyFriendIds: [],
      });
      toast.success(myReview ? t('reviews.updated') : t('reviews.published'));
      setEditing(false);
      load();
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
  }

  async function handleDelete() {
    if (!myReview) return;
    if (!window.confirm(t('reviews.deleteConfirm'))) return;
    try {
      await deleteReview(myReview.id);
      toast.success(t('reviews.deleted'));
      setMyReview(null);
      load();
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
  }

  async function handleLike(review) {
    if (!user) { toast.error(t('reviews.loginRequired')); return; }
    const currentlyLiked = likedIds.has(review.id);
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, likes_count: (r.likes_count || 0) + (currentlyLiked ? -1 : 1) } : r));
    setLikedIds(prev => {
      const next = new Set(prev);
      currentlyLiked ? next.delete(review.id) : next.add(review.id);
      return next;
    });
    try {
      await toggleLike(review.id, user.id, currentlyLiked, review.user_id, mediaTitle);
    } catch (e) {
      load();
    }
  }

  const stats = computeReviewStats(reviews);
  const otherReviews = reviews.filter(r => !user || r.user_id !== user.id);

  const sortLabels = {
    recent: t('reviews.sortRecent'), popular: t('reviews.sortPopular'),
    highest: t('reviews.sortHighest'), lowest: t('reviews.sortLowest'),
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg" style={{ letterSpacing: '0.04em' }}>{t('showDetail.reviewsSectionTitle').toUpperCase()}</h3>
        <div className="relative">
          <button
            onClick={() => setSortOpen(o => !o)}
            className="btn-press flex items-center gap-1 px-3 py-1.5 rounded-full font-mono text-xs"
            style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            {sortLabels[sort]} <ChevronDown size={13} />
          </button>
          {sortOpen && (
            <div className="fade-slide-down absolute right-0 mt-1 rounded-lg overflow-hidden z-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 150 }}>
              {SORTS.map(s => (
                <button key={s} onClick={() => { setSort(s); setSortOpen(false); }} className="w-full text-left px-3 py-2 font-body text-sm" style={{ background: sort === s ? 'var(--surface-alt)' : 'transparent' }}>
                  {sortLabels[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!loading && reviews.length > 0 && (
        <div className="flex items-center gap-2 mb-4 font-body text-sm" style={{ color: 'var(--muted)' }}>
          <Star size={14} fill="var(--amber)" color="var(--amber)" />
          <span>{t('reviews.averageRating', { avg: stats.avg })}</span>
          <span>· {t('reviews.totalReviews', { count: stats.count })}</span>
        </div>
      )}

      {user && (
        editing || (!myReview && reviews.length === 0 && false) ? (
          <div className="mb-4">
            <ReviewForm existing={myReview} onSubmit={handleSubmitReview} onCancel={() => setEditing(false)} />
          </div>
        ) : myReview ? (
          <div className="mb-4">
            <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>{t('reviews.yourReview').toUpperCase()}</p>
            <ReviewCard
              review={myReview}
              isOwn
              isLiked={likedIds.has(myReview.id)}
              onLike={() => handleLike(myReview)}
              onEdit={() => setEditing(true)}
              onDelete={handleDelete}
            />
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="btn-press w-full py-3 rounded-full font-body font-bold text-sm mb-4"
            style={{ background: 'var(--amber)', color: 'var(--on-accent)' }}
          >
            {t('reviews.writeReview')}
          </button>
        )
      )}

      {loading ? (
        <SkeletonRows count={2} height={120} />
      ) : otherReviews.length === 0 ? (
        <p className="font-body text-sm" style={{ color: 'var(--muted)' }}>{t('reviews.noReviewsForMedia')}</p>
      ) : (
        otherReviews.map(r => (
          <ReviewCard
            key={r.id}
            review={r}
            isOwn={false}
            isLiked={likedIds.has(r.id)}
            onLike={() => handleLike(r)}
          />
        ))
      )}
    </div>
  );
}
