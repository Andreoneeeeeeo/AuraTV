import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tv, Bell, Gamepad2, ArrowRight, Sparkles } from 'lucide-react';
import { useI18n } from '../../i18n/index.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { upsertProfile } from '../../lib/profiles.js';
import { hasSeenTvTimePrompt, markTvTimePromptSeen } from '../../lib/tvTimePrompt.js';
import { hasSeenPushOnboarding, markPushOnboardingSeen } from '../../lib/pushOnboardingSetting.js';
import { isPushSupported, enablePushNotifications } from '../../lib/pushNotifications.js';

const EASE = [0.16, 1, 0.3, 1];

// Calcola quali passi servono davvero per questo utente — se ha già
// risposto a tutto in precedenza, quei passi vengono saltati.
function buildSteps(profile) {
  const steps = ['welcome'];
  if (!hasSeenPushOnboarding()) steps.push('notifications');
  if (!hasSeenTvTimePrompt()) steps.push('tvtime');
  if (profile?.tracks_games === null || profile?.tracks_games === undefined) steps.push('games');
  return steps;
}

export default function OnboardingFlow({ onDone, onOpenSettings, onEnableGames }) {
  const { t } = useI18n();
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [steps] = useState(() => buildSteps(profile));
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const stepId = steps[index];
  const isLast = index === steps.length - 1;

  function goNext() {
    if (isLast) { onDone(); return; }
    setIndex((i) => i + 1);
  }

  async function handleEnableNotifications() {
    setBusy(true);
    try {
      await enablePushNotifications(user.id);
      await upsertProfile(user.id, { push_notification_prefs: { enabled: true, friend_request: true, friend_accept: true, new_follower: true, friend_review: true, review_like: true, review_comment: true, new_episode: true } });
      await refreshProfile();
      toast.success(t('onboarding.notificationsEnabledToast'));
    } catch (e) {
      toast.error(t('onboarding.notificationsFailedToast'));
    }
    setBusy(false);
    markPushOnboardingSeen();
    goNext();
  }

  function handleSkipNotifications() {
    markPushOnboardingSeen();
    goNext();
  }

  function handleTvTimeExtension() {
    markTvTimePromptSeen();
    onOpenSettings();
    onDone();
  }

  function handleSkipTvTime() {
    markTvTimePromptSeen();
    goNext();
  }

  async function handleGamesAnswer(answer) {
    if (user) {
      try {
        await upsertProfile(user.id, { tracks_games: answer });
        await refreshProfile();
        if (answer) onEnableGames?.();
      } catch (e) {}
    }
    goNext();
  }

  return (
    <div className="fixed inset-0 z-50 font-body fade-in flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ maxWidth: 380, width: '100%' }}>
        {steps.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mb-8" aria-hidden="true">
            {steps.map((_, i) => (
              <span key={i} style={{
                width: i === index ? 22 : 6, height: 6, borderRadius: 3,
                background: i <= index ? 'var(--amber)' : 'var(--surface-alt)',
                transition: 'width 0.3s var(--ease-out-smooth), background 0.3s ease',
              }} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={stepId}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
            transition={{ duration: 0.3, ease: EASE }}
            className="text-center"
          >
            {stepId === 'welcome' && (
              <>
                <Sparkles size={40} style={{ color: 'var(--amber)', margin: '0 auto' }} aria-hidden="true" />
                <h1 className="font-display text-3xl mt-4">{t('onboarding.welcomeTitle')}</h1>
                <p className="font-body text-sm mt-3" style={{ color: 'var(--muted)' }}>{t('onboarding.welcomeBody')}</p>
                <button onClick={goNext} className="btn-press w-full flex items-center justify-center gap-2 py-3 rounded-full font-body font-bold text-sm mt-8" style={{ background: 'var(--amber)', color: 'var(--on-accent)', boxShadow: 'var(--shadow-amber)' }}>
                  {t('onboarding.getStarted')} <ArrowRight size={15} />
                </button>
              </>
            )}

            {stepId === 'notifications' && (
              <>
                <Bell size={40} style={{ color: 'var(--amber)', margin: '0 auto' }} aria-hidden="true" />
                <h1 className="font-display text-2xl mt-4">{t('onboarding.notifTitle')}</h1>
                <p className="font-body text-sm mt-3" style={{ color: 'var(--muted)' }}>
                  {isPushSupported() ? t('onboarding.notifBody') : t('onboarding.notifBodyUnsupported')}
                </p>
                <div className="flex flex-col gap-3 mt-8">
                  {isPushSupported() && (
                    <button onClick={handleEnableNotifications} disabled={busy} className="btn-press py-3 rounded-full font-body font-bold text-sm" style={{ background: 'var(--amber)', color: 'var(--on-accent)', opacity: busy ? 0.7 : 1 }}>
                      {t('onboarding.notifEnable')}
                    </button>
                  )}
                  <button onClick={handleSkipNotifications} className="btn-press py-3 rounded-full font-body font-semibold text-sm" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                    {t('onboarding.notifLater')}
                  </button>
                </div>
              </>
            )}

            {stepId === 'tvtime' && (
              <>
                <Tv size={40} style={{ color: 'var(--amber)', margin: '0 auto' }} aria-hidden="true" />
                <h1 className="font-display text-2xl mt-4">{t('tvtimePrompt.title')}</h1>
                <p className="font-body text-sm mt-3" style={{ color: 'var(--muted)' }}>{t('tvtimePrompt.body')}</p>
                <div className="flex flex-col gap-3 mt-8">
                  <button onClick={handleTvTimeExtension} className="btn-press py-3 rounded-full font-body font-bold text-sm" style={{ background: 'var(--amber)', color: 'var(--on-accent)' }}>
                    {t('onboarding.tvtimeGo')}
                  </button>
                  <button onClick={handleSkipTvTime} className="btn-press py-3 rounded-full font-body font-semibold text-sm" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                    {t('tvtimePrompt.dismiss')}
                  </button>
                </div>
              </>
            )}

            {stepId === 'games' && (
              <>
                <Gamepad2 size={40} style={{ color: 'var(--amber)', margin: '0 auto' }} aria-hidden="true" />
                <h1 className="font-display text-2xl mt-4">{t('games.onboardingTitle')}</h1>
                <p className="font-body text-sm mt-3" style={{ color: 'var(--muted)' }}>{t('games.onboardingBody')}</p>
                <div className="flex flex-col gap-3 mt-8">
                  <button onClick={() => handleGamesAnswer(true)} className="btn-press py-3 rounded-full font-body font-bold text-sm" style={{ background: 'var(--amber)', color: 'var(--on-accent)' }}>
                    {t('games.onboardingYes')}
                  </button>
                  <button onClick={() => handleGamesAnswer(false)} className="btn-press py-3 rounded-full font-body font-semibold text-sm" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                    {t('games.onboardingNo')}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
