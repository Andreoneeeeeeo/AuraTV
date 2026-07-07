import { useEffect, useState, lazy, Suspense } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { countUnread, subscribeToNotifications } from '../../lib/notifications.js';

const NotificationsPanel = lazy(() => import('./NotificationsPanel.jsx'));

export default function NotificationBell() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    countUnread(user.id).then(setUnread).catch(() => {});
    const unsubscribe = subscribeToNotifications(user.id, () => setUnread((n) => n + 1));
    return unsubscribe;
  }, [user]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('header.notifications')}
        className="btn-press relative p-2 rounded-full"
        style={{ background: 'var(--surface)' }}
      >
        <Bell size={17} style={{ color: 'var(--muted)' }} />
        {unread > 0 && (
          <span
            className="absolute flex items-center justify-center font-mono"
            style={{
              top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, background: 'var(--tally)',
              color: '#fff', fontSize: 9, padding: '0 3px',
            }}
            aria-hidden="true"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <Suspense fallback={
          <div className="fixed inset-0 z-40 flex items-start justify-center pt-20" style={{ background: 'var(--overlay)' }}>
            <Loader2 className="animate-spin" size={22} style={{ color: 'var(--amber)' }} />
          </div>
        }>
          <NotificationsPanel onClose={() => setOpen(false)} onChangeUnread={setUnread} />
        </Suspense>
      )}
    </>
  );
}
