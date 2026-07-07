export default function SegmentedControl({ value, onChange, options }) {
  return (
    <div className="flex gap-1 p-1 rounded-full mb-4" style={{ background: 'var(--surface)' }} role="tablist">
      {options.map(opt => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className="btn-press flex-1 py-1.5 rounded-full font-body text-sm font-semibold"
          style={{ background: value === opt.value ? 'var(--amber)' : 'transparent', color: value === opt.value ? 'var(--on-accent)' : 'var(--muted)' }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
