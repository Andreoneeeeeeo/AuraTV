import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Pencil, Trash2, EyeOff, MessageCircle } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import StarRating from './StarRating.jsx';
import CommentsSection from './CommentsSection.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { fmtDate } from '../../lib/format.js';

export default function ReviewCard({ review, isOwn, isLiked, onLike, onEdit, onDelete }) {
  const { t, lang } = useI18n();
  const [revealed, setRevealed] = useState(!review.has_spoilers);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const author = review.author || {};

  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-start gap-3">
        <Link to={author.username ? `/profile/${author.username}` : '#'}>
          <Avatar url={author.avatar_url} name={author.display_name || author.username} size={36} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <Link to={author.username ? `/profile/${author.username}` : '#'} className="font-body text-sm font-semibold truncate">
              {author.display_name || author.username || t('common.unknown')}
            </Link>
            <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>{fmtDate(review.created_at, lang)}</span>
          </div>
          <StarRating value={Number(review.rating)} readOnly size={14} label={t('reviews.yourRating')} />
        </div>
      </div>

      <div className="mt-3">
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="btn-press w-full flex items-center justify-center gap-2 py-3 rounded-lg font-body text-sm font-medium"
            style={{ background: 'var(--surface-alt)', color: 'var(--muted)', border: '1px dashed var(--border)' }}
          >
            <EyeOff size={15} /> {t('reviews.spoilerWarning')} · {t('reviews.showSpoiler')}
          </button>
        ) : (
          review.body && <p className="font-body text-sm" style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{review.body}</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-4">
          <button
            onClick={onLike}
            className="btn-press flex items-center gap-1.5 font-body text-xs font-medium"
            style={{ color: isLiked ? 'var(--tally)' : 'var(--muted)' }}
            aria-pressed={isLiked}
          >
            <Heart size={15} fill={isLiked ? 'var(--tally)' : 'none'} /> {review.likes_count || 0}
          </button>
          <button
            onClick={() => setCommentsOpen((o) => !o)}
            className="btn-press flex items-center gap-1.5 font-body text-xs font-medium"
            style={{ color: 'var(--muted)' }}
            aria-pressed={commentsOpen}
          >
            <MessageCircle size={15} /> {t('comments.title')}
          </button>
        </div>

        {isOwn && (
          <div className="flex items-center gap-3">
            <button onClick={onEdit} className="btn-press flex items-center gap-1 font-body text-xs" style={{ color: 'var(--muted)' }}>
              <Pencil size={13} /> {t('common.edit')}
            </button>
            <button onClick={onDelete} className="btn-press flex items-center gap-1 font-body text-xs" style={{ color: 'var(--tally)' }}>
              <Trash2 size={13} /> {t('common.delete')}
            </button>
          </div>
        )}
      </div>

      {commentsOpen && <CommentsSection reviewId={review.id} reviewAuthorId={review.user_id} mediaTitle={review.media_title} />}
    </div>
  );
}
