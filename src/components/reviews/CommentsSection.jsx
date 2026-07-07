import { useState, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { listComments, addComment, deleteComment } from '../../lib/comments.js';
import { fmtDate } from '../../lib/format.js';

export default function CommentsSection({ reviewId, reviewAuthorId, mediaTitle }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    listComments(reviewId).then(setComments).catch(() => {}).finally(() => setLoading(false));
  }, [reviewId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!body.trim() || !user) return;
    setSending(true);
    try {
      const created = await addComment(reviewId, user.id, body.trim(), reviewAuthorId, mediaTitle);
      setComments((prev) => [...prev, created]);
      setBody('');
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
    setSending(false);
  }

  async function handleDelete(commentId) {
    if (!window.confirm(t('comments.deleteConfirm'))) return;
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
  }

  if (loading) return null;

  return (
    <div className="mt-3 pl-3" style={{ borderLeft: '2px solid var(--border)' }}>
      {comments.length === 0 ? (
        <p className="font-body text-xs" style={{ color: 'var(--muted)' }}>{t('comments.noComments')}</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2 mb-2">
            <Avatar url={c.author?.avatar_url} name={c.author?.display_name || c.author?.username} size={24} />
            <div className="flex-1 min-w-0">
              <p className="font-body text-xs">
                <span className="font-semibold">{c.author?.display_name || c.author?.username}</span>{' '}
                <span style={{ color: 'var(--text)' }}>{c.body}</span>
              </p>
              <p className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{fmtDate(c.created_at, lang)}</p>
            </div>
            {user?.id === c.user_id && (
              <button onClick={() => handleDelete(c.id)} aria-label={t('common.delete')} className="flex-shrink-0">
                <Trash2 size={12} style={{ color: 'var(--muted)' }} />
              </button>
            )}
          </div>
        ))
      )}

      {user && (
        <form onSubmit={handleSend} className="flex items-center gap-2 mt-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('comments.placeholder')}
            className="flex-1 px-3 py-1.5 rounded-full font-body text-xs outline-none"
            style={{ background: 'var(--surface-alt)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            aria-label={t('comments.send')}
            className="btn-press p-1.5 rounded-full flex-shrink-0"
            style={{ background: 'var(--amber)', opacity: sending || !body.trim() ? 0.5 : 1 }}
          >
            <Send size={12} color="var(--on-accent)" />
          </button>
        </form>
      )}
    </div>
  );
}
