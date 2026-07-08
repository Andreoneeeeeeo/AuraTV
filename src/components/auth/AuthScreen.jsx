import { useState } from 'react';
import { Tv, Loader2, AlertCircle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient.js';
import { useI18n, LOCALES, SUPPORTED_LANGS } from '../../i18n/index.jsx';

export default function AuthScreen({ onAuthenticated }) {
  const { t, lang, setLang } = useI18n();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  function translateError(msg) {
    if (!msg) return t('auth.errGeneric');
    if (msg.includes('Invalid login credentials')) return t('auth.errInvalidCredentials');
    if (msg.includes('User already registered')) return t('auth.errAlreadyRegistered');
    if (msg.includes('Password should be at least')) return t('auth.errPasswordLength');
    if (msg.includes('Unable to validate email')) return t('auth.errInvalidEmail');
    return msg;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');

    if (mode === 'reset') {
      if (!email.trim()) { setError(t('auth.errFillFields')); return; }
      setLoading(true);
      try {
        await supabase.auth.resetPasswordForEmail(email.trim());
        setInfo(t('auth.resetSent'));
      } catch (err) {
        setError(translateError(err.message));
      }
      setLoading(false);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError(t('auth.errFillFields'));
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim() || email.trim().split('@')[0] } },
        });
        if (error) throw error;
        if (data.session) {
          onAuthenticated();
        } else {
          setInfo(t('auth.signupSuccess'));
          setMode('login');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onAuthenticated();
      }
    } catch (err) {
      setError(translateError(err.message));
    }
    setLoading(false);
  }

  return (
    <div
      className="font-body fade-in"
      style={{
        background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: 480, height: 480, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--amber) 16%, transparent), transparent 70%)',
          filter: 'blur(10px)',
        }}
      />

      <div style={{ maxWidth: 360, margin: '0 auto', width: '100%', position: 'relative' }}>
        <div className="flex justify-end mb-2">
          <LangSwitcher lang={lang} setLang={setLang} />
        </div>

        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
            className="flex items-center justify-center mx-auto"
            style={{
              width: 76, height: 76, borderRadius: 22,
              background: 'linear-gradient(145deg, color-mix(in srgb, var(--amber) 22%, var(--surface)), var(--surface))',
              border: '1px solid color-mix(in srgb, var(--amber) 25%, var(--border))',
              boxShadow: 'var(--shadow-amber)',
            }}
          >
            <Tv size={34} style={{ color: 'var(--amber)' }} aria-hidden="true" />
          </motion.div>
          <h1 className="font-display text-4xl mt-4">AURATV</h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={mode}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="font-body text-sm mt-1.5"
              style={{ color: 'var(--muted)' }}
            >
              {mode === 'login' ? t('auth.loginSubtitle') : mode === 'signup' ? t('auth.signupSubtitle') : t('auth.forgotPassword')}
            </motion.p>
          </AnimatePresence>
        </div>

        {error && (
          <div role="alert" className="fade-in flex items-start gap-2 px-3 py-2.5 rounded-lg mb-4 text-sm" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}
        {info && (
          <div role="status" className="fade-in px-3 py-2.5 rounded-lg mb-4 text-sm" style={{ background: 'var(--surface-alt)', color: 'var(--watched)' }}>
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div>
              <label htmlFor="displayName" className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('auth.nameLabel')} {t('common.optional')}</label>
              <input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('auth.namePlaceholder')}
                className="w-full mt-1.5 px-3 py-2.5 rounded-lg font-body text-sm outline-none"
                style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('auth.emailLabel')}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              className="w-full mt-1.5 px-3 py-2.5 rounded-lg font-body text-sm outline-none"
              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
          </div>
          {mode !== 'reset' && (
            <div>
              <label htmlFor="password" className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{t('auth.passwordLabel')}</label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full mt-1.5 px-3 py-2.5 rounded-lg font-body text-sm outline-none"
                style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
            </div>
          )}

          {mode === 'login' && (
            <button type="button" onClick={() => { setMode('reset'); setError(''); setInfo(''); }} className="text-right font-body text-xs" style={{ color: 'var(--muted)' }}>
              {t('auth.forgotPassword')}
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-press mt-2 py-3 rounded-full font-body font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: 'var(--amber)', color: 'var(--on-accent)', opacity: loading ? 0.7 : 1, boxShadow: 'var(--shadow-amber)' }}
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {mode === 'login' ? t('auth.loginCta') : mode === 'signup' ? t('auth.signupCta') : t('common.confirm')}
          </button>
        </form>

        {mode !== 'reset' ? (
          <p className="text-center font-body text-sm mt-5" style={{ color: 'var(--muted)' }}>
            {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo(''); }}
              className="font-semibold"
              style={{ color: 'var(--amber)' }}
            >
              {mode === 'login' ? t('auth.signupCta') : t('auth.loginCta')}
            </button>
          </p>
        ) : (
          <p className="text-center font-body text-sm mt-5" style={{ color: 'var(--muted)' }}>
            <button onClick={() => { setMode('login'); setError(''); setInfo(''); }} className="font-semibold" style={{ color: 'var(--amber)' }}>
              {t('common.back')}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function LangSwitcher({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs"
        style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        <Globe size={13} /> {LOCALES[lang].flag} {lang.toUpperCase()}
      </button>
      {open && (
        <div
          role="listbox"
          className="fade-slide-down absolute right-0 mt-1 rounded-lg overflow-hidden z-10"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 140 }}
        >
          {SUPPORTED_LANGS.map((code) => (
            <button
              key={code}
              role="option"
              aria-selected={lang === code}
              onClick={() => { setLang(code); setOpen(false); }}
              className="w-full text-left px-3 py-2 font-body text-sm flex items-center gap-2"
              style={{ background: lang === code ? 'var(--surface-alt)' : 'transparent', color: 'var(--text)' }}
            >
              <span aria-hidden="true">{LOCALES[code].flag}</span> {LOCALES[code].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
