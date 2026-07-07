import { tmdbLocale } from './tmdb.js';

export function fmtDate(d, lang = 'it') {
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat(tmdbLocale(lang), { day: 'numeric', month: 'short' }).format(new Date(d));
  } catch (e) { return d; }
}

export function daysFromToday(d) {
  if (!d) return null;
  const diff = (new Date(d) - new Date(new Date().toDateString())) / 86400000;
  return Math.round(diff);
}

export function dayLabel(dateStr, lang, t) {
  const days = daysFromToday(dateStr);
  if (days === 0) return t('common.today');
  if (days === 1) return t('common.tomorrow');
  if (days === -1) return t('common.yesterday');
  if (days > 1 && days <= 6) return new Intl.DateTimeFormat(tmdbLocale(lang), { weekday: 'long' }).format(new Date(dateStr)).toUpperCase();
  if (days < -1 && days >= -6) return new Intl.DateTimeFormat(tmdbLocale(lang), { weekday: 'long' }).format(new Date(dateStr)).toUpperCase();
  return new Intl.DateTimeFormat(tmdbLocale(lang), { day: 'numeric', month: 'short' }).format(new Date(dateStr)).toUpperCase();
}

export function timeAgo(dateStr, t) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t('notifications.justNow');
  if (mins < 60) return t('notifications.minutesAgo', { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('notifications.hoursAgo', { n: hours });
  const days = Math.floor(hours / 24);
  return t('notifications.daysAgo', { n: days });
}
