import { SUPABASE_URL } from './supabaseConfig.js';

const TMDB_LOCALE = { it: 'it-IT', en: 'en-US' };
const TMDB_PROXY_URL = `${SUPABASE_URL}/functions/v1/tmdb-proxy`;

export function tmdbLocale(lang) {
  return TMDB_LOCALE[lang] || TMDB_LOCALE.it;
}

// Tutte le chiamate a TMDB passano da qui verso la Edge Function "tmdb-proxy":
// la vera chiave API di TMDB non è mai presente nel codice dell'app, resta
// solo lato server. Il secondo parametro (un tempo la chiave TMDB personale
// dell'utente) non è più necessario ed è mantenuto solo per compatibilità
// con le chiamate esistenti in giro per l'app.
export async function tmdb(path, _unusedApiKey, lang = 'it') {
  const sep = path.includes('?') ? '&' : '?';
  const fullPath = `${path}${sep}language=${tmdbLocale(lang)}`;
  const res = await fetch(`${TMDB_PROXY_URL}?path=${encodeURIComponent(fullPath)}`);
  if (!res.ok) {
    if (res.status === 401) throw new Error('TMDB_INVALID_KEY');
    throw new Error('TMDB_ERROR_' + res.status);
  }
  return res.json();
}

export const IMG = 'https://image.tmdb.org/t/p/w342';
export const IMG_SM = 'https://image.tmdb.org/t/p/w185';
export const IMG_BACKDROP = 'https://image.tmdb.org/t/p/w780';
export const IMG_STILL = 'https://image.tmdb.org/t/p/w300';
export const IMG_PROFILE = 'https://image.tmdb.org/t/p/w185';
export const IMG_LOGO = 'https://image.tmdb.org/t/p/w92';

export async function fetchTmdbReviews(mediaType, mediaId, apiKey, lang = 'it') {
  const path = mediaType === 'film' ? `/movie/${mediaId}/reviews` : `/tv/${mediaId}/reviews`;
  const data = await tmdb(path, apiKey, lang);
  return data.results || [];
}

export function resolveTmdbAvatarUrl(avatarPath) {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('/http')) return avatarPath.slice(1);
  return `https://image.tmdb.org/t/p/w45${avatarPath}`;
}

export function resolvePosterUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${IMG_SM}${path}`;
}

export const WATCH_REGION = { it: 'IT', en: 'US' };

// Recupera in un'unica chiamata i dettagli completi di una serie/film:
// generi, cast, trailer, dove guardarlo in streaming, parole chiave,
// titoli simili/consigliati, immagini e classificazione per età.
export async function fetchFullDetails(mediaType, mediaId, apiKey, lang = 'it') {
  const path = mediaType === 'film' ? `/movie/${mediaId}` : `/tv/${mediaId}`;
  const extra = mediaType === 'film'
    ? 'credits,videos,watch/providers,keywords,recommendations,similar,images,release_dates'
    : 'credits,videos,watch/providers,keywords,recommendations,similar,images,content_ratings';
  const data = await tmdb(`${path}?append_to_response=${extra}&include_image_language=${lang},null`, apiKey, lang);
  const region = WATCH_REGION[lang] || 'US';
  const providers = data['watch/providers']?.results?.[region] || null;
  const videos = data.videos?.results || [];
  const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') || videos.find(v => v.site === 'YouTube') || null;

  let certification = null;
  if (mediaType === 'film') {
    const releaseInfo = (data.release_dates?.results || []).find(r => r.iso_3166_1 === region);
    certification = releaseInfo?.release_dates?.find(r => r.certification)?.certification || null;
  } else {
    const ratingInfo = (data.content_ratings?.results || []).find(r => r.iso_3166_1 === region);
    certification = ratingInfo?.rating || null;
  }

  return {
    ...data,
    cast: (data.credits?.cast || []).slice(0, 20),
    crew: data.credits?.crew || [],
    trailer,
    providers,
    keywords: data.keywords?.keywords || data.keywords?.results || [],
    recommendations: (data.recommendations?.results || []).slice(0, 12),
    similar: (data.similar?.results || []).slice(0, 12),
    backdrops: (data.images?.backdrops || []).slice(0, 10),
    logos: data.images?.logos || [],
    certification,
  };
}

export async function searchPersons(query, apiKey, lang = 'it') {
  if (!query || !query.trim()) return [];
  const data = await tmdb(`/search/person?query=${encodeURIComponent(query.trim())}`, apiKey, lang);
  return (data.results || []).filter((p) => p.profile_path || p.known_for?.length).slice(0, 10);
}

export function pickCrew(crew, jobs) {
  const wanted = Array.isArray(jobs) ? jobs : [jobs];
  const seen = new Set();
  return crew.filter(c => wanted.includes(c.job) && !seen.has(c.id + c.job) && seen.add(c.id + c.job));
}
