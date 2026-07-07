import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';

export default function FriendRow({ profile, children }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: 'var(--surface)' }}>
      <Link to={`/profile/${profile.username}`} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar url={profile.avatar_url} name={profile.display_name || profile.username} size={40} />
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm font-semibold truncate">{profile.display_name || profile.username}</p>
          <p className="font-mono text-xs truncate" style={{ color: 'var(--muted)' }}>@{profile.username}</p>
        </div>
      </Link>
      <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
    </div>
  );
}
