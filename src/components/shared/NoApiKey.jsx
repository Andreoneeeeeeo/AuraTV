import { Tv } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

export default function NoApiKey({ onGo }) {
  const { t } = useI18n();
  return (
    <div className="text-center py-16">
      <Tv size={40} style={{ color: 'var(--muted)', margin: '0 auto' }} aria-hidden="true" />
      <p className="mt-4 font-body" style={{ color: 'var(--muted)', maxWidth: 300, marginInline: 'auto' }}>
        {t('discover.noApiKeyTitle')}
      </p>
      <button onClick={onGo} className="btn-press mt-5 px-5 py-2.5 rounded-full font-body font-bold"
        style={{ background: 'var(--amber)', color: 'var(--on-accent)' }}>
        {t('discover.goToSettings')}
      </button>
    </div>
  );
}
