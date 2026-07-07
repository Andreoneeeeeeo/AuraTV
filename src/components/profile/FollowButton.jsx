import { useState, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { followUser, unfollowUser, isFollowing } from '../../lib/follows.js';

export default function FollowButton({ targetUserId, targetName, onChange }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const [following, setFollowing] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || user.id === targetUserId) return;
    isFollowing(user.id, targetUserId).then(setFollowing).catch(() => setFollowing(false));
  }, [user, targetUserId]);

  if (!user || user.id === targetUserId || following === null) return null;

  async function handleClick() {
    setBusy(true);
    try {
      if (following) {
        await unfollowUser(user.id, targetUserId);
        setFollowing(false);
        toast.info(t('follow.unfollowedToast', { name: targetName }));
      } else {
        await followUser(user.id, targetUserId);
        setFollowing(true);
        toast.success(t('follow.followedToast', { name: targetName }));
      }
      onChange?.(!following);
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
    setBusy(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="btn-press flex items-center gap-1.5 px-4 py-1.5 rounded-full font-body text-xs font-semibold"
      style={{
        background: following ? 'var(--surface-alt)' : 'var(--amber)',
        color: following ? 'var(--text)' : 'var(--on-accent)',
        border: following ? '1px solid var(--border)' : 'none',
        opacity: busy ? 0.7 : 1,
      }}
    >
      {following ? <UserCheck size={13} /> : <UserPlus size={13} />}
      {following ? t('follow.following') : t('follow.follow')}
    </button>
  );
}
