import { IMG_BACKDROP } from '../../lib/tmdb.js';
import { useI18n } from '../../i18n/index.jsx';

export default function ImageGallery({ backdrops }) {
  const { t } = useI18n();
  if (!backdrops || backdrops.length < 2) return null;
  return (
    <div className="mb-5">
      <h3 className="font-body text-sm font-semibold mb-3">{t('detail.gallery')}</h3>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {backdrops.map((img, i) => (
          <div key={i} className="flex-shrink-0" style={{ width: 200, height: 112, borderRadius: 10, overflow: 'hidden', background: 'var(--surface-alt)' }}>
            <img src={`${IMG_BACKDROP}${img.file_path}`} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
