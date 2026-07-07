export default function DetailTabBar({ tabs, value, onChange }) {
  return (
    <div className="flex sticky top-0 z-10" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }} role="tablist">
      {tabs.map((tabItem) => {
        const active = value === tabItem.value;
        return (
          <button
            key={tabItem.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tabItem.value)}
            className="btn-press flex-1 py-3 font-mono text-xs font-semibold text-center"
            style={{
              color: active ? 'var(--text)' : 'var(--muted)',
              borderBottom: active ? '2px solid var(--amber)' : '2px solid transparent',
              letterSpacing: '0.06em',
            }}
          >
            {tabItem.label.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
