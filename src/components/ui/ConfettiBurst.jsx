import { useEffect, useMemo } from 'react';

const COLORS = ['var(--amber)', 'var(--tally)', 'var(--watched)', '#4EA8DE', '#B197FC', '#F0EDE6'];

export default function ConfettiBurst({ onDone }) {
  const pieces = useMemo(() =>
    Array.from({ length: 44 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.7,
      duration: 2 + Math.random() * 1.2,
      color: COLORS[i % COLORS.length],
      rotate: Math.random() * 360,
      scale: 0.7 + Math.random() * 0.8,
    })),
  []);

  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), 3200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div aria-hidden="true" className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg) scale(${p.scale})`,
          }}
        />
      ))}
    </div>
  );
}
