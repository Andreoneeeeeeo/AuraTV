import { Tv } from 'lucide-react';
import { useI18n, LOCALES, SUPPORTED_LANGS } from '../../i18n/index.jsx';

export default function LanguageOnboarding() {
  const { setLang, t } = useI18n();

  return (
    <div
      className="font-body fade-in"
      style={{
        background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24,
      }}
    >
      <div style={{ maxWidth: 380, margin: '0 auto', width: '100%' }}>
        <div className="text-center mb-8">
          <Tv size={40} style={{ color: 'var(--amber)', margin: '0 auto' }} aria-hidden="true" />
          <h1 className="font-display text-3xl mt-4">
            {t('onboarding.title')}
          </h1>
          <p className="font-body text-sm mt-2" style={{ color: 'var(--muted)' }}>
            {t('onboarding.subtitle')}
          </p>
        </div>

        <div className="flex flex-col gap-3" role="group" aria-label={t('onboarding.title')}>
          {SUPPORTED_LANGS.map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className="btn-press flex items-center gap-3 px-5 py-4 rounded-2xl font-body text-base font-semibold"
              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              <span style={{ fontSize: 24 }} aria-hidden="true">{LOCALES[code].flag}</span>
              {LOCALES[code].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
