import Avatar from '../ui/Avatar.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function Header({ tab, onOpenProfile }) {
  const { t } = useI18n();
  const { profile } = useAuth();

  const titles = {
    friends: t('nav.friends'),
    library: t('nav.library'),
    discover: t('nav.discover'),
    games: t('games.navLabel'),
    profile: t('nav.profile'),
  };

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border)',
        background: `radial-gradient(120% 100% at 15% 0%, rgba(var(--amber-rgb), 0.10), transparent 60%), var(--bg)`,
      }}
      className="px-4 pt-5 pb-3 sticky top-0 z-10"
    >
      <div className="flex items-center justify-between" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div>
          <h1 className="font-display text-3xl" style={{ color: 'var(--text)' }}>
            {titles[tab]}
          </h1>
          <div style={{ height: 3, width: 36, background: 'var(--amber)', marginTop: 4 }} />
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={onOpenProfile} aria-label={t('header.openProfile')} className="btn-press">
            <Avatar url={profile?.avatar_url} name={profile?.display_name || profile?.username} size={34} />
          </button>
        </div>
      </div>
    </header>
  );
}
