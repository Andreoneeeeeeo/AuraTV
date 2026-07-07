export default function Avatar({ url, name, size = 40, ring = false }) {
  const initials = (name || '?').trim().slice(0, 1).toUpperCase();
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: url ? 'transparent' : 'var(--surface-alt)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', border: ring ? '2px solid var(--amber)' : '1px solid var(--border)',
      }}
    >
      {url ? (
        <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span className="font-display" style={{ color: 'var(--muted)', fontSize: size * 0.42 }} aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}
