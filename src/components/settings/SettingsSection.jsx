import { ChevronDown } from 'lucide-react';

export default function SettingsSection({ icon: Icon, title, isOpen, onToggle, children }) {
  return (
    <div className="rounded-xl overflow-hidden mb-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <button
        onClick={onToggle}
        className="episode-row w-full flex items-center justify-between p-4"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-3 font-body text-sm font-semibold">
          <Icon size={17} style={{ color: 'var(--muted)' }} aria-hidden="true" />
          {title}
        </span>
        <ChevronDown size={16} className="chevron" style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {isOpen && (
        <div className="fade-in p-4" style={{ borderTop: '1px solid var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
