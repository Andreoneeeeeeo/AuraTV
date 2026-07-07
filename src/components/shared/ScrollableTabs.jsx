export default function ScrollableTabs({ value, onChange, options }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: 'none' }} role="tablist">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className="btn-press flex-shrink-0 px-4 py-1.5 rounded-full font-body text-sm font-semibold whitespace-nowrap"
            style={{ background: active ? 'var(--amber)' : 'var(--surface)', color: active ? 'var(--on-accent)' : 'var(--muted)' }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
