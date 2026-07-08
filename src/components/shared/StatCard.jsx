export default function StatCard({ label, value }) {
  return (
    <div
      className="card-tap rounded-2xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="font-mono text-3xl font-bold" style={{ color: 'var(--amber)', letterSpacing: '-0.02em' }}>{value}</p>
      <p className="font-body text-xs mt-1" style={{ color: 'var(--muted)' }}>{label}</p>
    </div>
  );
}
