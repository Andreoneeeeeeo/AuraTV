export default function TopList({ title, items }) {
  if (!items || items.length === 0) return null;
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="mb-5">
      <p className="font-body text-sm font-semibold mb-3">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="font-body text-xs flex-shrink-0 truncate" style={{ width: 100, color: 'var(--text)' }}>{item.name}</span>
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: 'var(--surface-alt)' }}>
              <div className="progress-fill" style={{ height: '100%', width: `${(item.count / max) * 100}%`, background: 'var(--amber)', borderRadius: 999 }} />
            </div>
            <span className="font-mono flex-shrink-0" style={{ fontSize: 10, color: 'var(--muted)' }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
