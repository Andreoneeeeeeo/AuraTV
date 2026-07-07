import { Tv } from 'lucide-react';
import { IMG_LOGO } from '../../lib/tmdb.js';
import { useI18n } from '../../i18n/index.jsx';

export default function WatchProviders({ providers }) {
  const { t } = useI18n();
  const list = [
    ...(providers?.flatrate || []),
    ...(providers?.free || []),
    ...(providers?.ads || []),
  ];
  const rentBuy = [...(providers?.rent || []), ...(providers?.buy || [])];
  const combined = list.length > 0 ? list : rentBuy;

  const seen = new Set();
  const unique = combined.filter((p) => {
    if (seen.has(p.provider_id)) return false;
    seen.add(p.provider_id);
    return true;
  });

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Tv size={16} style={{ color: 'var(--muted)' }} />
        <h3 className="font-body text-sm font-semibold">{t('detail.whereToWatch')}</h3>
      </div>

      {unique.length === 0 ? (
        <p className="font-body text-sm" style={{ color: 'var(--muted)' }}>{t('detail.noProviders')}</p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {unique.map((p) => (
              <div
                key={p.provider_id}
                className="flex items-center gap-2 px-3 py-2 rounded-full flex-shrink-0"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                {p.logo_path ? (
                  <img src={`${IMG_LOGO}${p.logo_path}`} alt="" style={{ width: 20, height: 20, borderRadius: 5 }} />
                ) : (
                  <Tv size={16} style={{ color: 'var(--muted)' }} />
                )}
                <span className="font-body text-xs font-medium whitespace-nowrap">{p.provider_name}</span>
              </div>
            ))}
          </div>
          <p className="font-mono mt-2" style={{ fontSize: 10, color: 'var(--muted)' }}>{t('detail.watchAttribution')}</p>
        </>
      )}
    </div>
  );
}
