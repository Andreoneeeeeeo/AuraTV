import { useId } from 'react';
import { motion } from 'framer-motion';

const SPRING = { type: 'spring', stiffness: 520, damping: 36, mass: 0.85 };

export default function SegmentedControl({ value, onChange, options }) {
  const layoutId = useId();
  return (
    <div className="flex gap-1 p-1 rounded-full mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} role="tablist">
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className="relative flex-1 py-1.5 rounded-full font-body text-sm font-semibold"
          >
            {active && (
              <motion.div
                layoutId={`segpill-${layoutId}`}
                transition={SPRING}
                className="absolute inset-0 rounded-full"
                style={{ background: 'var(--amber)', boxShadow: 'var(--shadow-xs)' }}
              />
            )}
            <span className="relative" style={{ color: active ? 'var(--on-accent)' : 'var(--muted)', transition: 'color 0.2s ease' }}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
