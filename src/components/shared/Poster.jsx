import { Tv } from 'lucide-react';
import { IMG_SM } from '../../lib/tmdb.js';

export default function Poster({ path, w = 60, fill = false, alt = '' }) {
  const boxStyle = fill
    ? { width: '100%', aspectRatio: '2 / 3', borderRadius: 6, flexShrink: 0, background: 'var(--surface-alt)', overflow: 'hidden' }
    : { width: w, height: w * 1.5, borderRadius: 6, flexShrink: 0, background: 'var(--surface-alt)', overflow: 'hidden' };
  const src = path ? (path.startsWith('http') ? path : `${IMG_SM}${path}`) : null;
  return (
    <div style={boxStyle} className="flex items-center justify-center">
      {src ? (
        <img src={src} alt={alt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Tv size={fill ? 24 : w * 0.35} style={{ color: 'var(--muted)' }} aria-hidden="true" />
      )}
    </div>
  );
}
