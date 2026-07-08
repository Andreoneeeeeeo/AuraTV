import { useId } from 'react';
import { motion } from 'framer-motion';

const SPRING = { type: 'spring', stiffness: 520, damping: 36, mass: 0.85 };

export default function ScrollableTabs({ value, onChange, options }) {
  const layoutId = useId();
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4" style={{ scrollbarWidth: 'none' }} role="tablist">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className="relative flex-shrink-0 px-4 py-1.5 rounded-full font-body text-sm font-semibold whitespace-nowrap"
            style={{ background: active ? undefined : 'var(--surface)', border: active ? undefined : '1px solid var(--border)' }}
          >
            {active && (
              <motion.div
                layoutId={`scrolltab-${layoutId}`}
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
