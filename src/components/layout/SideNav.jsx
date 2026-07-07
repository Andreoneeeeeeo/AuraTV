import { Tv } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavItems } from './BottomNav.jsx';

const SPRING = { type: 'spring', stiffness: 500, damping: 34, mass: 0.9 };

export default function SideNav({ tab, setTab, showGames }) {
  const items = useNavItems(showGames);
  return (
    <nav
      aria-label="Navigazione principale"
      className="hidden md:flex flex-col gap-1 py-6 px-3"
      style={{ width: 232, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, height: '100vh' }}
    >
      <div className="flex items-center gap-2 px-3 mb-6">
        <Tv size={22} style={{ color: 'var(--amber)' }} aria-hidden="true" />
        <span className="font-display text-xl" style={{ letterSpacing: '0.04em' }}>AURATV</span>
      </div>
      {items.map(({ id, icon: Icon, label }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-current={active ? 'page' : undefined}
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm font-semibold text-left"
            style={{ color: active ? 'var(--amber)' : 'var(--muted)' }}
          >
            {active && (
              <motion.div
                layoutId="sideNavActivePill"
                transition={SPRING}
                className="absolute inset-0 rounded-xl"
                style={{ background: 'var(--surface-alt)' }}
              />
            )}
            <Icon size={19} className="relative" aria-hidden="true" />
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
