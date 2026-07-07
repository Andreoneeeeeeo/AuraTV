export default function StatCard({ label, value }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--surface)' }}>
      <p className="font-mono text-3xl font-bold" style={{ color: 'var(--amber)' }}>{value}</p>
      <p className="font-body text-xs mt-1" style={{ color: 'var(--muted)' }}>{label}</p>
    </div>
  );
}
