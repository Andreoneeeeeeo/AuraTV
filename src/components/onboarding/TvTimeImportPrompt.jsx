import { ArrowRight, Clock, Smartphone } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

export default function TvTimeImportPrompt({ onOpenSettings, onDismiss }) {
  const { t } = useI18n();

  function handleExport() {
    window.open('https://chromewebstore.google.com/detail/tv-time-out-by-refract/pmejpdpjbkjklfceogdkolmgclldogbi', '_blank', 'noopener,noreferrer');
  }

  function handleGdprExport() {
    window.open('https://gdpr.tvtime.com/gdpr/self-service', '_blank', 'noopener,noreferrer');
  }

  return (
    <div
      className="fixed inset-0 z-50 font-body fade-in flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--overlay-strong)' }}
    >
      <div className="glass-strong scale-in rounded-2xl p-6" style={{ maxWidth: 400, width: '100%', boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center gap-2 mb-1" style={{ color: 'var(--tally)' }}>
          <Clock size={15} />
          <span className="font-mono" style={{ fontSize: 11 }}>{t('tvtimePrompt.deadline')}</span>
        </div>
        <h1 className="font-display text-2xl mt-2">{t('tvtimePrompt.title')}</h1>
        <p className="font-body text-sm mt-2" style={{ color: 'var(--muted)' }}>{t('tvtimePrompt.body')}</p>

        <div className="mt-4 flex flex-col gap-2.5">
          <Step n={1} text={t('tvtimePrompt.step1')} />
          <Step n={2} text={t('tvtimePrompt.step2')} />
          <Step n={3} text={t('tvtimePrompt.step3')} />
        </div>

        <button
          onClick={handleExport}
          className="btn-press w-full flex items-center justify-center gap-2 py-3 rounded-full font-body font-bold text-sm mt-5"
          style={{ background: 'var(--amber)', color: 'var(--on-accent)', boxShadow: 'var(--shadow-amber)' }}
        >
          {t('tvtimePrompt.cta')} <ArrowRight size={15} />
        </button>

        <div className="flex items-center gap-2 my-3" aria-hidden="true">
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{t('tvtimePrompt.or')}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <button
          onClick={handleGdprExport}
          className="btn-press w-full flex items-center justify-center gap-2 py-3 rounded-full font-body font-semibold text-sm"
          style={{ background: 'var(--surface-alt)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          <Smartphone size={15} /> {t('tvtimePrompt.ctaMobile')}
        </button>
        <p className="font-body text-xs mt-1.5" style={{ color: 'var(--muted)' }}>{t('tvtimePrompt.mobileNote')}</p>

        <button
          onClick={onOpenSettings}
          className="btn-press w-full py-3 rounded-full font-body font-semibold text-sm mt-4"
          style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          {t('tvtimePrompt.goToImport')}
        </button>
        <button onClick={onDismiss} className="btn-press w-full py-2.5 mt-1 font-body text-sm" style={{ color: 'var(--muted)' }}>
          {t('tvtimePrompt.dismiss')}
        </button>
      </div>
    </div>
  );
}

function Step({ n, text }) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className="flex-shrink-0 flex items-center justify-center font-mono font-semibold"
        style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--surface-alt)', color: 'var(--amber)', fontSize: 11, marginTop: 1 }}
      >
        {n}
      </span>
      <p className="font-body text-sm" style={{ color: 'var(--text)' }}>{text}</p>
    </div>
  );
}
