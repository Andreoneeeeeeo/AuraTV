export default function SectionLabel({ text }) {
  return (
    <h2 className="flex items-center gap-2 font-display text-lg" style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>
      <span style={{ width: 3, height: 14, borderRadius: 2, background: 'var(--amber)', flexShrink: 0 }} aria-hidden="true" />
      {text.toUpperCase()}
    </h2>
  );
}
