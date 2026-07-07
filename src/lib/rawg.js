// Chiave RAWG condivisa: usata da tutti gli utenti dell'app (a differenza della
// chiave TMDB, che ogni persona inserisce singolarmente nelle impostazioni).
export const RAWG_API_KEY = 'f6023bcc56884b48a102eddb654dc06b';

const BASE = 'https://api.rawg.io/api';

async function rawg(path) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}key=${RAWG_API_KEY}`);
  if (!res.ok) throw new Error('RAWG_ERROR_' + res.status);
  return res.json();
}

export const RAWG_IMG_FALLBACK = null;

export async function searchGames(query) {
  if (!query || !query.trim()) return [];
  const data = await rawg(`/games?search=${encodeURIComponent(query.trim())}&page_size=20`);
  return data.results || [];
}

export async function trendingGames() {
  const data = await rawg('/games?ordering=-added&page_size=20');
  return data.results || [];
}

export async function fetchGameDetails(id) {
  const [game, screenshots, series, additions] = await Promise.all([
    rawg(`/games/${id}`),
    rawg(`/games/${id}/screenshots`).catch(() => ({ results: [] })),
    rawg(`/games/${id}/game-series`).catch(() => ({ results: [] })),
    rawg(`/games/${id}/additions`).catch(() => ({ results: [] })),
  ]);
  return {
    ...game,
    screenshots: screenshots.results || [],
    series: series.results || [],
    additions: additions.results || [],
  };
}

export function gameGenres(game) {
  return (game.genres || []).map((g) => g.name);
}

export function gamePlatforms(game) {
  return (game.platforms || []).map((p) => p.platform.name);
}

export function gameDevelopers(game) {
  return (game.developers || []).map((d) => d.name);
}

export function gamePublishers(game) {
  return (game.publishers || []).map((p) => p.name);
}
