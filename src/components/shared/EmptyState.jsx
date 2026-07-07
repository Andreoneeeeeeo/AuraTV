export default function EmptyState({ icon: Icon, text }) {
  return (
    <div className="text-center py-16">
      <Icon size={36} style={{ color: 'var(--muted)', margin: '0 auto' }} aria-hidden="true" />
      <p className="mt-4 font-body text-sm" style={{ color: 'var(--muted)', maxWidth: 280, marginInline: 'auto' }}>{text}</p>
    </div>
  );
}
