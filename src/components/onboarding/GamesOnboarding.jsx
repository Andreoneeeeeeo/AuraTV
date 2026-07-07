import { Gamepad2 } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';

export default function GamesOnboarding({ onAnswer }) {
  const { t } = useI18n();

  return (
    <div
      className="fixed inset-0 z-50 font-body fade-in flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div style={{ maxWidth: 380, width: '100%' }} className="text-center">
        <Gamepad2 size={40} style={{ color: 'var(--amber)', margin: '0 auto' }} aria-hidden="true" />
        <h1 className="font-display text-2xl mt-4">{t('games.onboardingTitle')}</h1>
        <p className="font-body text-sm mt-3" style={{ color: 'var(--muted)' }}>{t('games.onboardingBody')}</p>

        <div className="flex flex-col gap-3 mt-8">
          <button
            onClick={() => onAnswer(true)}
            className="btn-press py-3 rounded-full font-body font-bold text-sm"
            style={{ background: 'var(--amber)', color: 'var(--on-accent)' }}
          >
            {t('games.onboardingYes')}
          </button>
          <button
            onClick={() => onAnswer(false)}
            className="btn-press py-3 rounded-full font-body font-semibold text-sm"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            {t('games.onboardingNo')}
          </button>
        </div>
      </div>
    </div>
  );
}
