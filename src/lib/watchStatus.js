export const WATCH_STATUSES = ['watching', 'planned', 'on_hold', 'completed', 'dropped'];

// Una serie senza watchStatus esplicito (aggiunta prima di questa funzione,
// o mai toccata dall'utente) riceve uno stato dedotto in modo intelligente
// dal suo avanzamento, così le liste esistenti non "spariscono" da nessuna parte.
export function getShowWatchStatus(show, watchedCount) {
  const total = show.number_of_episodes || 0;
  const hasUnwatched = total > 0 && watchedCount < total;
  // Se era segnata come completata ma sono usciti nuovi episodi non ancora
  // visti, torna automaticamente "in visione" invece di restare bloccata
  // su "completata".
  if (show.watchStatus === 'completed' && hasUnwatched) return 'watching';
  if (show.watchStatus) return show.watchStatus;
  if (total > 0 && watchedCount >= total) return 'completed';
  if (watchedCount > 0) return 'watching';
  return 'planned';
}

// "In pari": la serie è stata guardata fino all'ultimo episodio disponibile,
// ma è ancora in produzione/onda — diverso da "Completata" (conclusa per sempre).
export function isShowCaughtUp(show, watchedCount) {
  return getShowWatchStatus(show, watchedCount) === 'completed' && show.status === 'Returning Series';
}

// Calcola quali serie devono passare automaticamente a "In pausa" perché non
// aggiornate da troppo tempo. Ritorna solo le modifiche da applicare (non
// tocca le serie già "completate", "abbandonate" o già "in pausa").
export function computeAutoPauseUpdates(library, autoPauseMonths, now = Date.now()) {
  if (!autoPauseMonths) return {};
  const thresholdMs = autoPauseMonths * 30 * 24 * 60 * 60 * 1000;
  const updates = {};
  Object.values(library).forEach((show) => {
    const watchedCount = Object.values(show.watched || {}).reduce((sum, arr) => sum + arr.length, 0);
    const status = getShowWatchStatus(show, watchedCount);
    if (status === 'completed' || status === 'dropped' || status === 'on_hold' || status === 'planned') return;
    const lastActivity = show.lastWatchedAt || show.addedAt || 0;
    if (now - lastActivity > thresholdMs) {
      updates[show.id] = { ...show, watchStatus: 'on_hold' };
    }
  });
  return updates;
}

export function getFilmWatchStatus(film) {
  if (film.watchStatus) return film.watchStatus;
  return film.watched ? 'completed' : 'planned';
}

export function getGameWatchStatus(game) {
  if (game.watchStatus) return game.watchStatus;
  return 'planned';
}
