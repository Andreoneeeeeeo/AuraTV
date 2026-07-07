export default function MetaRow({ label, value, last }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-1.5" style={{ borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="font-body text-sm text-right">{value}</span>
    </div>
  );
}
