export default function SectionLabel({ text }) {
  return <h2 className="font-display text-lg" style={{ color: 'var(--muted)', letterSpacing: '0.06em' }}>{text.toUpperCase()}</h2>;
}
