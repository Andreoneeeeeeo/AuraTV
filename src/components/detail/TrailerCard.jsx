import { Play } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

export default function TrailerCard({ trailer }) {
  const { t } = useI18n();
  if (!trailer) return null;
  const thumbnail = `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`;

  return (
    <a
      href={`https://www.youtube.com/watch?v=${trailer.key}`}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-press flex items-center gap-3 mb-5 rounded-xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="relative flex-shrink-0" style={{ width: 110, height: 62 }}>
        <img src={thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div className="absolute flex items-center justify-center" style={{ inset: 0, background: 'rgba(0,0,0,0.35)' }}>
          <div className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--amber)' }}>
            <Play size={14} fill="var(--on-accent)" color="var(--on-accent)" style={{ marginLeft: 2 }} />
          </div>
        </div>
      </div>
      <span className="font-body text-sm font-semibold pr-3">{t('detail.watchTrailer')}</span>
    </a>
  );
}
