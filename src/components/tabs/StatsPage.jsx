import { X, BarChart3 } from 'lucide-react';
import StatsTab from './StatsTab.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { useBackHandler } from '../../hooks/useBackHandler.js';

export default function StatsPage({ onClose, ...statsProps }) {
  const { t } = useI18n();
  useBackHandler(onClose);

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div
        className="flex items-center justify-between p-4 sticky top-0 z-10"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' }}
      >
        <h2 className="font-display text-2xl flex items-center gap-2"><BarChart3 size={20} /> {t('profile.statsTab')}</h2>
        <button onClick={onClose} aria-label={t('common.close')}><X size={20} style={{ color: 'var(--muted)' }} /></button>
      </div>
      <div className="p-4" style={{ maxWidth: 640, margin: '0 auto' }}>
        <StatsTab {...statsProps} />
      </div>
    </div>
  );
}
