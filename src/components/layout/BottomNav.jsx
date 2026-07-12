import { Users, Tv, Search, User, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '../../i18n/index.jsx';
import { hapticSelection } from '../../lib/haptics.js';

export function useNavItems(showGames) {
  const { t } = useI18n();
  const items = [
    { id: 'friends', icon: Users, label: t('nav.friends') },
    { id: 'library', icon: Tv, label: t('nav.library') },
    { id: 'discover', icon: Search, label: t('nav.discover') },
  ];
  if (showGames) items.push({ id: 'games', icon: Gamepad2, label: t('games.navLabel') });
  items.push({ id: 'profile', icon: User, label: t('nav.profile') });
  return items;
}

const SPRING = { type: 'spring', stiffness: 500, damping: 32, mass: 0.9 };

export default function BottomNav({ tab, setTab, showGames }) {
  const items = useNavItems(showGames);

  function handleTap(id) {
    if (id !== tab) hapticSelection();
    setTab(id);
  }

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed left-0 right-0 flex justify-center"
      style={{ bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))', zIndex: 20, paddingInline: 12 }}
    >
      <div
        className="glass-strong flex items-center gap-1 w-full"
        style={{ maxWidth: 480, margin: '0 auto', padding: 6, borderRadius: 28, boxShadow: 'var(--shadow-lg)' }}
      >
        {items.map(({ id, icon: Icon, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => handleTap(id)}
              aria-current={active ? 'page' : undefined}
              className="relative flex-1 flex flex-col items-center gap-0.5 py-2 rounded-full"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {active && (
                <motion.div
                  layoutId="bottomNavActivePill"
                  transition={SPRING}
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'color-mix(in srgb, var(--amber) 18%, transparent)' }}
                />
              )}
              <motion.div
                className="relative flex flex-col items-center gap-0.5"
                animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }}
                transition={SPRING}
              >
                <Icon size={19} style={{ color: active ? 'var(--amber)' : 'var(--muted)' }} aria-hidden="true" />
                <span className="font-mono" style={{ fontSize: 9, color: active ? 'var(--amber)' : 'var(--muted)' }}>{label}</span>
              </motion.div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
