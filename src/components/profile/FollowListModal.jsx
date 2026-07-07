import { useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';
import { useI18n } from '../../i18n/index.jsx';

export default function FollowListModal({ kind, data, onClose }) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: 'var(--overlay-strong)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="modal-sheet w-full rounded-t-2xl p-4 overflow-y-auto" style={{ background: 'var(--bg)', maxWidth: 480, maxHeight: '70vh', border: '1px solid var(--border)', borderBottom: 'none' }}>
        <p className="font-display text-xl mb-3">{t(kind === 'followers' ? 'follow.followers' : 'follow.followingCount').toUpperCase()}</p>
        {data.length === 0 ? (
          <p className="font-body text-sm" style={{ color: 'var(--muted)' }}>{t(kind === 'followers' ? 'follow.noFollowers' : 'follow.noFollowing')}</p>
        ) : (
          data.map((p) => (
            <button
              key={p.id}
              onClick={() => { onClose(); navigate(`/profile/${p.username}`); }}
              className="btn-press flex items-center gap-3 p-2.5 rounded-xl mb-1 w-full text-left"
              style={{ background: 'var(--surface)' }}
            >
              <Avatar url={p.avatar_url} name={p.display_name || p.username} size={36} />
              <div className="min-w-0">
                <p className="font-body text-sm font-semibold truncate">{p.display_name || p.username}</p>
                <p className="font-mono text-xs truncate" style={{ color: 'var(--muted)' }}>@{p.username}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
