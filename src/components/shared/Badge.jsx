import { Award } from 'lucide-react';

export default function Badge({ achieved, label }) {
  return (
    <div className="flex items-center gap-2 rounded-lg p-3" style={{ background: achieved ? 'var(--surface-alt)' : 'var(--surface)', opacity: achieved ? 1 : 0.4 }}>
      <Award size={18} style={{ color: achieved ? 'var(--amber)' : 'var(--muted)' }} aria-hidden="true" />
      <span className="font-body text-xs font-medium">{label}</span>
    </div>
  );
}
