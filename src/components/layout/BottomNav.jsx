import { Users, Tv, Search, User, Gamepad2 } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

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

export default function BottomNav({ tab, setTab, showGames }) {
  const items = useNavItems(showGames);
  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed left-0 right-0 flex justify-center md:hidden"
      style={{ bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))', zIndex: 20, paddingInline: 12 }}
    >
      <div
        className="flex items-center gap-1 w-full"
        style={{
          maxWidth: 480, margin: '0 auto', padding: 6, borderRadius: 28,
          background: 'color-mix(in srgb, var(--surface) 72%, transparent)',
          backdropFilter: 'blur(22px) saturate(160%)',
          WebkitBackdropFilter: 'blur(22px) saturate(160%)',
          border: '1px solid color-mix(in srgb, var(--border) 70%, transparent)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
        }}
      >
        {items.map(({ id, icon: Icon, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={active ? 'page' : undefined}
              className="nav-btn flex-1 flex flex-col items-center gap-0.5 py-2 rounded-full"
              style={{
                background: active ? 'color-mix(in srgb, var(--amber) 18%, transparent)' : 'transparent',
                transition: 'background 0.25s ease',
              }}
            >
              <Icon size={19} style={{ color: active ? 'var(--amber)' : 'var(--muted)' }} aria-hidden="true" />
              <span className="font-mono" style={{ fontSize: 9, color: active ? 'var(--amber)' : 'var(--muted)' }}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
