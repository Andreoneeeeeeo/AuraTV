export function translateTmdbError(err, t) {
  const msg = err?.message || '';
  if (msg === 'TMDB_INVALID_KEY') return t('errors.TMDB_INVALID_KEY');
  if (msg.startsWith('TMDB_ERROR_')) return t('errors.TMDB_GENERIC', { status: msg.replace('TMDB_ERROR_', '') });
  return msg || t('common.somethingWrong');
}
