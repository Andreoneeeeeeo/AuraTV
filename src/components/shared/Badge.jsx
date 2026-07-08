import { Award, Lock } from 'lucide-react';

export default function Badge({ achieved, label }) {
  return (
    <div
      className="card-tap flex items-center gap-2.5 rounded-xl p-3"
      style={{
        background: achieved ? 'color-mix(in srgb, var(--amber) 10%, var(--surface-alt))' : 'var(--surface)',
        border: achieved ? '1px solid color-mix(in srgb, var(--amber) 35%, transparent)' : '1px solid var(--border)',
        opacity: achieved ? 1 : 0.55,
      }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 30, height: 30, borderRadius: '50%', background: achieved ? 'color-mix(in srgb, var(--amber) 20%, transparent)' : 'var(--surface-alt)' }}
      >
        {achieved ? (
          <Award size={15} style={{ color: 'var(--amber)' }} aria-hidden="true" />
        ) : (
          <Lock size={13} style={{ color: 'var(--muted)' }} aria-hidden="true" />
        )}
      </div>
      <span className="font-body text-xs font-medium leading-snug">{label}</span>
    </div>
  );
}
