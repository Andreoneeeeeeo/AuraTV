import { Star, StarHalf } from 'lucide-react';

// rating: 0.5 - 5, step 0.5
export default function StarRating({ value = 0, onChange, size = 22, readOnly = false, label }) {
  const stars = [1, 2, 3, 4, 5];

  function handleClick(starIndex, half) {
    if (readOnly || !onChange) return;
    const next = half ? starIndex - 0.5 : starIndex;
    onChange(next === value ? next : next);
  }

  return (
    <div
      className="flex items-center gap-1"
      role={readOnly ? undefined : 'slider'}
      aria-label={label}
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={value}
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={(e) => {
        if (readOnly || !onChange) return;
        if (e.key === 'ArrowRight') onChange(Math.min(5, value + 0.5));
        if (e.key === 'ArrowLeft') onChange(Math.max(0.5, value - 0.5));
      }}
    >
      {stars.map((s) => {
        const filled = value >= s;
        const halfFilled = !filled && value >= s - 0.5;
        return (
          <span key={s} className="relative" style={{ width: size, height: size, display: 'inline-block' }}>
            {!readOnly ? (
              <>
                <button
                  type="button"
                  aria-label={`${s - 0.5} stelle`}
                  onClick={() => handleClick(s, true)}
                  style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', zIndex: 2 }}
                />
                <button
                  type="button"
                  aria-label={`${s} stelle`}
                  onClick={() => handleClick(s, false)}
                  style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', zIndex: 2 }}
                />
              </>
            ) : null}
            {halfFilled ? (
              <StarHalf size={size} fill="var(--amber)" color="var(--amber)" style={{ position: 'absolute' }} aria-hidden="true" />
            ) : (
              <Star size={size} fill={filled ? 'var(--amber)' : 'none'} color={filled ? 'var(--amber)' : 'var(--muted)'} style={{ position: 'absolute' }} aria-hidden="true" />
            )}
          </span>
        );
      })}
    </div>
  );
}
