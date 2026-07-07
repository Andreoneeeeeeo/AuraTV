import { motion } from 'framer-motion';
import Avatar from '../ui/Avatar.jsx';
import NotificationBell from '../notifications/NotificationBell.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function Header({ tab, onOpenProfile, scrolled }) {
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
    <motion.header
      animate={{
        backgroundColor: scrolled ? 'color-mix(in srgb, var(--bg) 78%, transparent)' : 'rgba(0,0,0,0)',
        borderBottomColor: scrolled ? 'var(--border)' : 'rgba(0,0,0,0)',
        boxShadow: scrolled ? 'var(--shadow-xs)' : '0 0 0 rgba(0,0,0,0)',
      }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{
        borderBottomWidth: 1, borderBottomStyle: 'solid',
        backgroundImage: !scrolled ? `radial-gradient(120% 100% at 15% 0%, rgba(var(--amber-rgb), 0.10), transparent 60%)` : 'none',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
      }}
      className="px-4 pt-5 pb-3 sticky top-0 z-10"
    >
      <div className="flex items-center justify-between" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div>
          <motion.h1
            key={tab}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-3xl"
            style={{ color: 'var(--text)' }}
          >
            {titles[tab]}
          </motion.h1>
          <div style={{ height: 3, width: 36, background: 'var(--amber)', marginTop: 4, borderRadius: 2 }} />
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={onOpenProfile} aria-label={t('header.openProfile')} className="btn-press">
            <Avatar url={profile?.avatar_url} name={profile?.display_name || profile?.username} size={34} />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
