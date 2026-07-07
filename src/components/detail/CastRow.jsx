import { User } from 'lucide-react';
import { IMG_PROFILE } from '../../lib/tmdb.js';
import { useI18n } from '../../i18n/index.jsx';

export default function CastRow({ cast }) {
  const { t } = useI18n();
  if (!cast || cast.length === 0) return null;

  return (
    <div className="mb-5">
      <h3 className="font-body text-sm font-semibold mb-3">{t('detail.cast')}</h3>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {cast.map((person) => (
          <div key={person.id} style={{ width: 76, flexShrink: 0 }}>
            <div style={{ width: 76, height: 76, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {person.profile_path ? (
                <img src={`${IMG_PROFILE}${person.profile_path}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={28} style={{ color: 'var(--muted)' }} />
              )}
            </div>
            <p className="font-body text-xs font-semibold mt-1.5 text-center truncate">{person.name}</p>
            {person.character && (
              <p className="font-mono text-center truncate" style={{ fontSize: 10, color: 'var(--muted)' }}>{person.character}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
