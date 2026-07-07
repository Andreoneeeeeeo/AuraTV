import { useState, useRef } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { IMG_BACKDROP } from '../../lib/tmdb.js';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { setCustomBanner, removeCustomBanner, uploadCustomBannerImage } from '../../lib/customBanners.js';

export default function BannerPicker({ mediaType, mediaId, officialBackdrop, alternativeBackdrops, currentBanner, onClose, onChange }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  async function pick(url, source) {
    try {
      await setCustomBanner(user.id, mediaType, mediaId, url, source);
      onChange(url);
      toast.success(t('customBanner.saved'));
      onClose();
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCustomBannerImage(user.id, file);
      await pick(url, 'custom_upload');
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
    setUploading(false);
  }

  async function handleReset() {
    try {
      await removeCustomBanner(user.id, mediaType, mediaId);
      onChange(null);
      toast.info(t('customBanner.reset'));
      onClose();
    } catch (e) {
      toast.error(t('common.somethingWrong'));
    }
  }

  const thumbs = [officialBackdrop, ...(alternativeBackdrops || []).map((b) => b.file_path)].filter(Boolean);
  const uniqueThumbs = [...new Set(thumbs)].slice(0, 9);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" style={{ background: 'var(--overlay-strong)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="modal-sheet w-full rounded-t-2xl overflow-y-auto" style={{ background: 'var(--bg)', maxWidth: 480, maxHeight: '85vh', border: '1px solid var(--border)', borderBottom: 'none' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-display text-xl">{t('customBanner.changeBanner')}</p>
          <button onClick={onClose} aria-label={t('common.close')}><X size={20} style={{ color: 'var(--muted)' }} /></button>
        </div>

        <div className="p-4">
          {uniqueThumbs.length > 0 && (
            <>
              <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>{t('customBanner.alternativesTitle')}</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {uniqueThumbs.map((path) => {
                  const url = `${IMG_BACKDROP}${path}`;
                  const active = currentBanner === url || (!currentBanner && path === officialBackdrop);
                  return (
                    <button key={path} onClick={() => pick(url, path === officialBackdrop ? 'tmdb_backdrop' : 'tmdb_backdrop')} className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '16 / 9', border: active ? '2px solid var(--amber)' : '1px solid var(--border)' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {active && (
                        <div className="absolute flex items-center justify-center" style={{ inset: 0, background: 'rgba(0,0,0,0.35)' }}>
                          <Check size={18} color="var(--amber)" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <p className="font-mono text-xs mb-2" style={{ color: 'var(--muted)' }}>{t('customBanner.uploadTitle')}</p>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="btn-press w-full flex items-center justify-center gap-2 py-3 rounded-full font-body font-semibold text-sm mb-3"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            {uploading && <Loader2 size={15} className="animate-spin" />}
            {uploading ? t('customBanner.uploading') : t('customBanner.uploadButton')}
          </button>
          <input ref={fileInput} type="file" accept="image/*" onChange={handleUpload} className="sr-only" />

          <button
            onClick={handleReset}
            className="btn-press w-full py-3 rounded-full font-body font-semibold text-sm"
            style={{ background: 'var(--surface-alt)', color: 'var(--tally)' }}
          >
            {t('customBanner.resetButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
