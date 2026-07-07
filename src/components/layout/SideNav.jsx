import { Tv } from 'lucide-react';
import { useNavItems } from './BottomNav.jsx';

export default function SideNav({ tab, setTab, showGames }) {
  const items = useNavItems(showGames);
  return (
    <nav
      aria-label="Navigazione principale"
      className="hidden md:flex flex-col gap-1 py-6 px-3"
      style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, height: '100vh' }}
    >
      <div className="flex items-center gap-2 px-3 mb-6">
        <Tv size={22} style={{ color: 'var(--amber)' }} aria-hidden="true" />
        <span className="font-display text-xl" style={{ letterSpacing: '0.04em' }}>AURATV</span>
      </div>
      {items.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          aria-current={tab === id ? 'page' : undefined}
          className="nav-btn flex items-center gap-3 px-3 py-2.5 rounded-xl font-body text-sm font-semibold text-left"
          style={{ background: tab === id ? 'var(--surface-alt)' : 'transparent', color: tab === id ? 'var(--amber)' : 'var(--muted)' }}
        >
          <Icon size={19} aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  );
}
