export default function KeywordChips({ keywords }) {
  if (!keywords || keywords.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-5">
      {keywords.slice(0, 12).map((k) => (
        <span
          key={k.id}
          className="font-mono px-2.5 py-1 rounded-full"
          style={{ fontSize: 11, background: 'var(--surface-alt)', color: 'var(--muted)' }}
        >
          {k.name}
        </span>
      ))}
    </div>
  );
}
