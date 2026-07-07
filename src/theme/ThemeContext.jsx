import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'tvtracker-theme'; // 'light' | 'dark' | 'system'
const ACCENT_KEY = 'tvtracker-accent'; // 'amber' | 'crimson' | 'ocean' | 'emerald' | 'violet'
const TEXTSIZE_KEY = 'tvtracker-textsize'; // 'small' | 'normal' | 'large'

export const ACCENTS = ['amber', 'crimson', 'ocean', 'emerald', 'violet'];
export const ACCENT_PREVIEW = {
  amber: '#F5C518', crimson: '#E63946', ocean: '#4EA8DE', emerald: '#52B788', violet: '#B197FC',
};
export const TEXT_SIZES = ['small', 'normal', 'large'];

function resolveSystemPref() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function readStored(key, fallback, valid) {
  try {
    const v = localStorage.getItem(key);
    if (v && (!valid || valid.includes(v))) return v;
  } catch (e) {}
  return fallback;
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(() => readStored(STORAGE_KEY, 'dark'));
  const [accent, setAccentState] = useState(() => readStored(ACCENT_KEY, 'amber', ACCENTS));
  const [textSize, setTextSizeState] = useState(() => readStored(TEXTSIZE_KEY, 'normal', TEXT_SIZES));
  const [resolved, setResolved] = useState(() => (mode === 'system' ? resolveSystemPref() : mode));

  useEffect(() => {
    const applied = mode === 'system' ? resolveSystemPref() : mode;
    setResolved(applied);
    document.documentElement.setAttribute('data-theme', applied);
  }, [mode]);

  useEffect(() => {
    if (accent === 'amber') document.documentElement.removeAttribute('data-accent');
    else document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  useEffect(() => {
    if (textSize === 'normal') document.documentElement.removeAttribute('data-textsize');
    else document.documentElement.setAttribute('data-textsize', textSize);
  }, [textSize]);

  useEffect(() => {
    if (mode !== 'system' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      const applied = resolveSystemPref();
      setResolved(applied);
      document.documentElement.setAttribute('data-theme', applied);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [mode]);

  const setMode = useCallback((next) => {
    setModeState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
  }, []);

  const setAccent = useCallback((next) => {
    if (!ACCENTS.includes(next)) return;
    setAccentState(next);
    try { localStorage.setItem(ACCENT_KEY, next); } catch (e) {}
  }, []);

  const setTextSize = useCallback((next) => {
    if (!TEXT_SIZES.includes(next)) return;
    setTextSizeState(next);
    try { localStorage.setItem(TEXTSIZE_KEY, next); } catch (e) {}
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme: resolved, setMode, accent, setAccent, textSize, setTextSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
