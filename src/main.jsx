import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './lib/storage.js';
import './index.css';

import { I18nProvider, useI18n } from './i18n/index.jsx';
import { ThemeProvider, useTheme } from './theme/ThemeContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { triggerTopBackHandler, handleGlobalPopState } from './lib/backHandlerStack.js';

import ToastStack from './components/ui/ToastStack.jsx';
import LanguageOnboarding from './components/onboarding/LanguageOnboarding.jsx';
import AuthScreen from './components/auth/AuthScreen.jsx';
import PublicProfilePage from './components/profile/PublicProfilePage.jsx';
import App from './App.jsx';

// Collega il sistema di chiusura "a stack" (useBackHandler) sia al tasto
// fisico Indietro di Android (nativo, via Capacitor) sia al tasto/gesto
// Indietro del browser — quest'ultimo copre il web normale e le PWA
// installate, dove non esiste alcun bridge nativo.
function BackNavigationBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationRef = useRef(location);
  locationRef.current = location;

  // Web / PWA: il tasto o gesto Indietro del browser genera un evento
  // "popstate", che intercettiamo per chiudere la schermata più recente.
  useEffect(() => {
    window.addEventListener('popstate', handleGlobalPopState);
    return () => window.removeEventListener('popstate', handleGlobalPopState);
  }, []);

  // Android nativo: il tasto fisico Indietro non genera un "popstate" del
  // browser, va intercettato separatamente tramite il bridge di Capacitor.
  useEffect(() => {
    let listenerHandle;
    let cancelled = false;
    (async () => {
      try {
        const { App: CapacitorApp } = await import('@capacitor/app');
        const handle = await CapacitorApp.addListener('backButton', () => {
          // 1. Chiude la schermata/modale più in cima allo stack, se presente
          if (triggerTopBackHandler()) return;
          // 2. Se siamo su una route diversa dalla shell principale (es. un profilo pubblico), torna indietro
          if (locationRef.current.pathname !== '/') {
            navigate(-1);
            return;
          }
          // 3. Altrimenti siamo davvero sulla schermata principale: esci dall'app
          CapacitorApp.exitApp();
        });
        if (cancelled) handle.remove(); else listenerHandle = handle;
      } catch (e) {
        // Non in ambiente Capacitor (Web/Electron): nessun listener nativo da collegare
      }
    })();
    return () => { cancelled = true; listenerHandle?.remove(); };
  }, [navigate]);

  return null;
}

function ProfileSync() {
  const { profile } = useAuth();
  const { setLang } = useI18n();
  const { setMode, setAccent, setTextSize } = useTheme();
  const synced = useRef(false);

  useEffect(() => {
    if (!profile || synced.current) return;
    synced.current = true;
    if (profile.language) setLang(profile.language);
    if (profile.theme) setMode(profile.theme);
    if (profile.accent_color) setAccent(profile.accent_color);
    if (profile.text_size) setTextSize(profile.text_size);
  }, [profile, setLang, setMode, setAccent, setTextSize]);

  return null;
}

function Root() {
  const { languageChosen } = useI18n();
  const { session } = useAuth();

  if (!languageChosen) {
    return <LanguageOnboarding />;
  }

  if (session === undefined) {
    return <div style={{ background: 'var(--bg)', minHeight: '100vh' }} />;
  }

  if (!session) {
    return <AuthScreen onAuthenticated={() => {}} />;
  }

  return (
    <>
      <BackNavigationBridge />
      <ProfileSync />
      <Routes>
        <Route path="/profile/:username" element={<PublicProfilePage />} />
        <Route path="*" element={<App key={session.user.id} />} />
      </Routes>
    </>
  );
}

function Providers() {
  return (
    <HashRouter>
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <Root />
              <ToastStack />
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

createRoot(document.getElementById('root')).render(<Providers />);
