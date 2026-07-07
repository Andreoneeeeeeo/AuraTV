export default function EmptyState({ icon: Icon, text, action }) {
  return (
    <div className="fade-in text-center py-16 px-6">
      <div
        className="empty-icon flex items-center justify-center mx-auto"
        style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-alt)' }}
      >
        <Icon size={26} style={{ color: 'var(--muted)' }} aria-hidden="true" />
      </div>
      <p className="mt-4 font-body text-sm" style={{ color: 'var(--muted)', maxWidth: 280, marginInline: 'auto', lineHeight: 1.5 }}>{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
