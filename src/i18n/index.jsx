import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { it } from './locales/it.js';
import { en } from './locales/en.js';

export const LOCALES = {
  it: { label: 'Italiano', flag: '🇮🇹', dict: it },
  en: { label: 'English', flag: '🇬🇧', dict: en },
};

export const SUPPORTED_LANGS = Object.keys(LOCALES);
const STORAGE_KEY = 'tvtracker-lang';
const FALLBACK_LANG = 'it';

const I18nContext = createContext(null);

function resolveInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LOCALES[saved]) return saved;
  } catch (e) {}
  return null; // null = not chosen yet -> triggers onboarding
}

function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(resolveInitialLang);

  useEffect(() => {
    if (lang) document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const setLang = useCallback((next) => {
    if (!LOCALES[next]) return;
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
  }, []);

  const t = useCallback((key, vars) => {
    const activeLang = lang || FALLBACK_LANG;
    const dict = LOCALES[activeLang]?.dict || LOCALES[FALLBACK_LANG].dict;
    let value = getPath(dict, key);
    if (value === undefined) value = getPath(LOCALES[FALLBACK_LANG].dict, key);
    if (value === undefined) return key;
    return typeof value === 'string' ? interpolate(value, vars) : value;
  }, [lang]);

  const value = useMemo(() => ({
    lang: lang || FALLBACK_LANG,
    languageChosen: !!lang,
    setLang,
    t,
    locales: LOCALES,
  }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
