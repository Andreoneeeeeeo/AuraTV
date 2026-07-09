import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Bell, UserPlus, UserCheck, Heart, MessageSquare } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import { SkeletonRows } from '../ui/Skeleton.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useBackHandler } from '../../hooks/useBackHandler.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../../lib/notifications.js';
import { timeAgo } from '../../lib/format.js';

const ICONS = {
  friend_request: UserPlus,
  friend_accept: UserCheck,
  review_like: Heart,
  friend_review: MessageSquare,
  new_follower: UserPlus,
  review_comment: MessageSquare,
};

export default function NotificationsPanel({ onClose, onChangeUnread }) {
  const { t } = useI18n();
  useBackHandler(onClose);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await listNotifications(user.id);
        setItems(list);
      } catch (e) {}
      setLoading(false);
    })();
  }, [user.id]);

  async function handleMarkAll() {
    setItems(prev => prev.map(i => ({ ...i, read: true })));
    onChangeUnread?.(0);
    try { await markAllNotificationsRead(user.id); } catch (e) {}
  }

  async function handleItemClick(item) {
    if (!item.read) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, read: true } : i));
      try { await markNotificationRead(item.id); } catch (e) {}
    }
  }

  function messageFor(item) {
    const name = item.actor?.display_name || item.actor?.username || t('common.unknown');
    if (item.type === 'friend_request') return t('notifications.friendRequestReceived', { name });
    if (item.type === 'friend_accept') return t('notifications.friendRequestAccepted', { name });
    if (item.type === 'review_like') return t('notifications.reviewLiked', { name, title: item.data?.mediaTitle || '' });
    if (item.type === 'friend_review') return t('notifications.friendNewReview', { name, title: item.data?.mediaTitle || '' });
    if (item.type === 'new_follower') return t('notifications.newFollower', { name });
    if (item.type === 'review_comment') return t('notifications.reviewCommented', { name, title: item.data?.mediaTitle || '' });
    return '';
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center sm:justify-end" style={{ background: 'var(--overlay)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-slide-down w-full rounded-b-2xl sm:rounded-2xl overflow-y-auto"
        style={{ background: 'var(--bg)', maxWidth: 400, maxHeight: '80vh', border: '1px solid var(--border)', marginTop: 0 }}
      >
        <div
          className="flex items-center justify-between p-4 sticky top-0"
          style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
        >
          <h2 className="font-display text-xl flex items-center gap-2"><Bell size={18} /> {t('notifications.title')}</h2>
          <button onClick={onClose} aria-label={t('common.close')}><X size={19} style={{ color: 'var(--muted)' }} /></button>
        </div>

        {items.some(i => !i.read) && (
          <div className="px-4 pt-3">
            <button onClick={handleMarkAll} className="font-mono text-xs" style={{ color: 'var(--amber)' }}>{t('notifications.markAllRead')}</button>
          </div>
        )}

        <div className="p-4">
          {loading ? (
            <SkeletonRows count={4} height={56} />
          ) : items.length === 0 ? (
            <EmptyState icon={Bell} text={t('notifications.empty')} />
          ) : (
            items.map((item) => {
              const Icon = ICONS[item.type] || Bell;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="btn-press w-full flex items-start gap-3 p-3 rounded-xl mb-2 text-left"
                  style={{ background: item.read ? 'transparent' : 'var(--surface)' }}
                >
                  <Link to={item.actor?.username ? `/profile/${item.actor.username}` : '#'} onClick={(e) => e.stopPropagation()}>
                    <Avatar url={item.actor?.avatar_url} name={item.actor?.display_name || item.actor?.username} size={34} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm">{messageFor(item)}</p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{timeAgo(item.created_at, t)}</p>
                  </div>
                  {!item.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0, marginTop: 4 }} aria-hidden="true" />}
                  <Icon size={14} style={{ color: 'var(--muted)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
