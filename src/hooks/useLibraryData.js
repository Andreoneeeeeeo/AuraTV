import { useState, useCallback } from 'react';
import { tmdb } from '../lib/tmdb.js';
import {
  serializeSeasons, parseSeasons, serializeWatched, parseWatched,
  downloadCSV, downloadJSON, Papa,
} from '../lib/csv.js';
import { upsertPublicLibraryItem, removePublicLibraryItem } from '../lib/publicLibrary.js';
import { upsertPublicList, removePublicList } from '../lib/publicLists.js';
import { getShowWatchStatus, getFilmWatchStatus, getGameWatchStatus } from '../lib/watchStatus.js';
import { fetchGameDetails, gameGenres, gamePlatforms, gameDevelopers, gamePublishers } from '../lib/rawg.js';
import { parseTvTimeGdprZip } from '../lib/tvtimeGdprParser.js';

export function useLibraryData({ apiKey, lang, t, setError, setImportProgress, onShowCompleted, userId }) {
  const [library, setLibrary] = useState({});
  const [filmLibrary, setFilmLibrary] = useState({});
  const [gameLibrary, setGameLibrary] = useState({});
  const [lists, setLists] = useState({});
  const [watchLog, setWatchLog] = useState([]);
  const [ready, setReady] = useState(false);

  async function logWatchEvents(entries) {
    if (!entries || entries.length === 0) return;
    setWatchLog((prev) => {
      const next = [...prev, ...entries].slice(-5000);
      window.storage.set('watch-log', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }

  function syncPublicShow(show) {
    if (!userId) return;
    const watchedCount = Object.values(show.watched || {}).reduce((sum, arr) => sum + arr.length, 0);
    const status = getShowWatchStatus(show, watchedCount);
    upsertPublicLibraryItem(userId, 'show', show.id, show.name, show.poster_path, status).catch(() => {});
  }

  function syncPublicFilm(film) {
    if (!userId) return;
    const status = getFilmWatchStatus(film);
    upsertPublicLibraryItem(userId, 'film', film.id, film.title, film.poster_path, status).catch(() => {});
  }

  function syncPublicGame(game) {
    if (!userId) return;
    const status = getGameWatchStatus(game);
    upsertPublicLibraryItem(userId, 'game', game.id, game.name, game.background_image, status).catch(() => {});
  }

  const loadAll = useCallback(async () => {
    try {
      const l = await window.storage.get('library');
      if (l?.value) setLibrary(JSON.parse(l.value));
    } catch (e) {}
    try {
      const f = await window.storage.get('film-library');
      if (f?.value) setFilmLibrary(JSON.parse(f.value));
    } catch (e) {}
    try {
      const g = await window.storage.get('game-library');
      if (g?.value) setGameLibrary(JSON.parse(g.value));
    } catch (e) {}
    try {
      const ls = await window.storage.get('lists');
      if (ls?.value) setLists(JSON.parse(ls.value));
    } catch (e) {}
    try {
      const wl = await window.storage.get('watch-log');
      if (wl?.value) setWatchLog(JSON.parse(wl.value));
    } catch (e) {}
    setReady(true);
  }, []);

  async function persistLibrary(next) {
    setLibrary(next);
    try { await window.storage.set('library', JSON.stringify(next)); }
    catch (e) { setError(t('errors.saveLibraryFailed')); }
  }

  async function addShow(showId) {
    try {
      const data = await tmdb(`/tv/${showId}?append_to_response=credits`, apiKey, lang);
      const entry = {
        id: data.id,
        name: data.name,
        poster_path: data.poster_path,
        status: data.status,
        first_air_date: data.first_air_date,
        episode_run_time: (data.episode_run_time && data.episode_run_time[0]) || (data.last_episode_to_air && data.last_episode_to_air.runtime) || 45,
        number_of_episodes: data.number_of_episodes || 0,
        genres: (data.genres || []).map(g => g.name),
        creators: (data.created_by || []).map(c => c.name),
        topCast: (data.credits?.cast || []).slice(0, 5).map(c => c.name),
        seasons: (data.seasons || []).map(s => ({
          season_number: s.season_number, episode_count: s.episode_count, name: s.name,
        })),
        watched: {},
        watchStatus: 'watching',
        addedAt: Date.now(),
        tmdbSyncedAt: Date.now(),
      };
      await persistLibrary({ ...library, [entry.id]: entry });
      syncPublicShow(entry);
    } catch (e) { setError(e.message); }
  }

  function removeShow(id) {
    const next = { ...library };
    delete next[id];
    persistLibrary(next);
    if (userId) removePublicLibraryItem(userId, 'show', id).catch(() => {});
  }

  function isComplete(show, watched) {
    const total = show.number_of_episodes || 0;
    if (total <= 0) return false;
    const count = Object.entries(watched || {})
      .filter(([season]) => Number(season) !== 0)
      .reduce((sum, [, arr]) => sum + arr.length, 0);
    return count >= total;
  }

  function maybeCelebrate(show, prevWatched, nextWatched) {
    if (!isComplete(show, prevWatched) && isComplete(show, nextWatched)) {
      onShowCompleted?.(show);
    }
  }

  function diffNewEpisodes(prevWatched, nextWatched) {
    const newly = [];
    Object.keys(nextWatched).forEach(season => {
      const prevSet = new Set((prevWatched?.[season]) || []);
      (nextWatched[season] || []).forEach(ep => {
        if (!prevSet.has(ep)) newly.push({ season: Number(season), episode: ep });
      });
    });
    return newly;
  }

  function setEpisodesWatched(showId, seasonNum, episodeNumbers) {
    const show = library[showId];
    if (!show) return;
    const nextWatched = { ...show.watched, [seasonNum]: episodeNumbers };
    maybeCelebrate(show, show.watched, nextWatched);
    const newly = diffNewEpisodes(show.watched, nextWatched);
    const nextShow = { ...show, watched: nextWatched, ...(newly.length ? { lastWatchedAt: Date.now() } : {}) };
    persistLibrary({ ...library, [showId]: nextShow });
    syncPublicShow(nextShow);
    if (newly.length) {
      const now = Date.now();
      logWatchEvents(newly.map(n => ({ type: 'episode', mediaId: showId, season: n.season, episode: n.episode, at: now, runtime: show.episode_run_time || 45 })));
    }
  }

  function toggleEpisode(showId, seasonNum, epNum) {
    const show = library[showId];
    const current = new Set(show.watched[seasonNum] || []);
    if (current.has(epNum)) current.delete(epNum); else current.add(epNum);
    setEpisodesWatched(showId, seasonNum, Array.from(current));
  }

  function markUpTo(showId, seasonNum, epNum) {
    const show = library[showId];
    if (!show) return;
    const nextWatched = { ...show.watched };
    show.seasons.forEach(season => {
      if (season.season_number === 0) return;
      if (season.season_number < seasonNum) {
        nextWatched[season.season_number] = Array.from({ length: season.episode_count }, (_, i) => i + 1);
      } else if (season.season_number === seasonNum) {
        const existing = new Set(nextWatched[season.season_number] || []);
        for (let n = 1; n <= epNum; n++) existing.add(n);
        nextWatched[season.season_number] = Array.from(existing);
      }
    });
    maybeCelebrate(show, show.watched, nextWatched);
    const newly = diffNewEpisodes(show.watched, nextWatched);
    const nextShow = { ...show, watched: nextWatched, ...(newly.length ? { lastWatchedAt: Date.now() } : {}) };
    persistLibrary({ ...library, [showId]: nextShow });
    syncPublicShow(nextShow);
    if (newly.length) {
      const now = Date.now();
      logWatchEvents(newly.map(n => ({ type: 'episode', mediaId: showId, season: n.season, episode: n.episode, at: now, runtime: show.episode_run_time || 45 })));
    }
  }

  function setShowWatchStatus(showId, watchStatus) {
    const show = library[showId];
    if (!show) return;
    const nextShow = { ...show, watchStatus };
    persistLibrary({ ...library, [showId]: nextShow });
    syncPublicShow(nextShow);
  }

  function markAllWatched(showId) {
    const show = library[showId];
    if (!show) return;
    const nextWatched = { ...show.watched };
    show.seasons.forEach(season => {
      if (season.season_number === 0) return;
      nextWatched[season.season_number] = Array.from({ length: season.episode_count }, (_, i) => i + 1);
    });
    const nextShow = { ...show, watched: nextWatched, watchStatus: 'completed', lastWatchedAt: Date.now() };
    persistLibrary({ ...library, [showId]: nextShow });
    syncPublicShow(nextShow);
    const newly = diffNewEpisodes(show.watched, nextWatched);
    if (newly.length) {
      const now = Date.now();
      logWatchEvents(newly.map(n => ({ type: 'episode', mediaId: showId, season: n.season, episode: n.episode, at: now, runtime: show.episode_run_time || 45 })));
    }
  }

  function bulkUpdateShows(updates) {
    if (!updates || Object.keys(updates).length === 0) return;
    const next = { ...library, ...updates };
    persistLibrary(next);
    Object.values(updates).forEach(syncPublicShow);
  }

  async function refreshOnAirShows() {
    const onAir = Object.values(library).filter((s) => s.status === 'Returning Series');
    if (onAir.length === 0 || !apiKey) return;
    const results = await Promise.all(onAir.map((s) => tmdb(`/tv/${s.id}`, apiKey, lang).catch(() => null)));
    const updates = {};
    results.forEach((data, i) => {
      if (!data) return;
      const show = onAir[i];
      if (data.number_of_episodes !== show.number_of_episodes || data.status !== show.status) {
        updates[show.id] = {
          ...show,
          status: data.status,
          number_of_episodes: data.number_of_episodes || show.number_of_episodes,
          seasons: (data.seasons || []).map((s) => ({ season_number: s.season_number, episode_count: s.episode_count, name: s.name })),
        };
      }
    });
    if (Object.keys(updates).length > 0) bulkUpdateShows(updates);
  }

  // TMDB richiede che i dati usati con la chiave gratuita non restino in
  // cache per più di 6 mesi senza un ricontrollo. Ad ogni avvio aggiorniamo
  // solo un piccolo gruppo di voci "scadute" (non tutte insieme, per non
  // sovraccaricare l'API): con l'uso normale dell'app, nell'arco di poche
  // settimane l'intera libreria viene ricontrollata senza che l'utente se
  // ne accorga.
  async function refreshStaleTmdbCache() {
    if (!apiKey) return;
    const SIX_MONTHS = 183 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - SIX_MONTHS;
    const isStale = (entry) => !entry.tmdbSyncedAt || entry.tmdbSyncedAt < cutoff;

    const staleShows = Object.values(library).filter(isStale).slice(0, 5);
    const staleFilms = Object.values(filmLibrary).filter(isStale).slice(0, 5);
    if (staleShows.length === 0 && staleFilms.length === 0) return;

    const showUpdates = {};
    for (const show of staleShows) {
      try {
        const data = await tmdb(`/tv/${show.id}?append_to_response=credits`, apiKey, lang);
        showUpdates[show.id] = {
          ...show,
          name: data.name, poster_path: data.poster_path, status: data.status,
          first_air_date: data.first_air_date, number_of_episodes: data.number_of_episodes || show.number_of_episodes,
          genres: (data.genres || []).map(g => g.name),
          creators: (data.created_by || []).map(c => c.name),
          topCast: (data.credits?.cast || []).slice(0, 5).map(c => c.name),
          seasons: (data.seasons || []).map(s => ({ season_number: s.season_number, episode_count: s.episode_count, name: s.name })),
          tmdbSyncedAt: Date.now(),
        };
      } catch (e) {
        showUpdates[show.id] = { ...show, tmdbSyncedAt: Date.now() }; // evita di ritentare all'infinito se il titolo non esiste più
      }
    }
    if (Object.keys(showUpdates).length > 0) bulkUpdateShows(showUpdates);

    const filmUpdates = {};
    for (const film of staleFilms) {
      try {
        const data = await tmdb(`/movie/${film.id}?append_to_response=credits`, apiKey, lang);
        filmUpdates[film.id] = {
          ...film,
          title: data.title, poster_path: data.poster_path, release_date: data.release_date || film.release_date,
          runtime: data.runtime || film.runtime,
          genres: (data.genres || []).map(g => g.name),
          directors: (data.credits?.crew || []).filter(c => c.job === 'Director').map(c => c.name),
          topCast: (data.credits?.cast || []).slice(0, 5).map(c => c.name),
          tmdbSyncedAt: Date.now(),
        };
      } catch (e) {
        filmUpdates[film.id] = { ...film, tmdbSyncedAt: Date.now() };
      }
    }
    if (Object.keys(filmUpdates).length > 0) {
      await persistFilmLibrary({ ...filmLibrary, ...filmUpdates });
    }
  }

  function rewatchShow(showId) {
    const show = library[showId];
    if (!show) return;
    const nextShow = { ...show, rewatchCount: (show.rewatchCount || 0) + 1 };
    persistLibrary({ ...library, [showId]: nextShow });
    logWatchEvents([{ type: 'rewatch-show', mediaId: showId, at: Date.now() }]);
  }

  async function persistFilmLibrary(next) {
    setFilmLibrary(next);
    try { await window.storage.set('film-library', JSON.stringify(next)); }
    catch (e) { setError(t('errors.saveFilmsFailed')); }
  }

  async function addFilm(movieId) {
    try {
      const data = await tmdb(`/movie/${movieId}?append_to_response=credits`, apiKey, lang);
      const entry = {
        id: data.id,
        title: data.title,
        poster_path: data.poster_path,
        release_date: data.release_date || '',
        runtime: data.runtime || 100,
        genres: (data.genres || []).map(g => g.name),
        directors: (data.credits?.crew || []).filter(c => c.job === 'Director').map(c => c.name),
        topCast: (data.credits?.cast || []).slice(0, 5).map(c => c.name),
        watched: false,
        watchedAt: null,
        watchStatus: 'planned',
        rewatchCount: 0,
        addedAt: Date.now(),
        tmdbSyncedAt: Date.now(),
      };
      await persistFilmLibrary({ ...filmLibrary, [entry.id]: entry });
      syncPublicFilm(entry);
    } catch (e) { setError(e.message); }
  }

  function toggleFilmWatched(id) {
    const film = filmLibrary[id];
    if (!film) return;
    const nowWatched = !film.watched;
    const nextFilm = { ...film, watched: nowWatched, watchedAt: nowWatched ? Date.now() : null, ...(nowWatched ? { lastWatchedAt: Date.now() } : {}) };
    persistFilmLibrary({ ...filmLibrary, [id]: nextFilm });
    syncPublicFilm(nextFilm);
    if (nowWatched) logWatchEvents([{ type: 'film', mediaId: id, at: Date.now(), runtime: film.runtime || 100 }]);
  }

  function setFilmWatchStatus(id, watchStatus) {
    const film = filmLibrary[id];
    if (!film) return;
    const becomesCompleted = watchStatus === 'completed' && !film.watched;
    const nextFilm = {
      ...film,
      watchStatus,
      watched: watchStatus === 'completed',
      watchedAt: watchStatus === 'completed' ? (film.watchedAt || Date.now()) : film.watchedAt,
      ...(becomesCompleted ? { lastWatchedAt: Date.now() } : {}),
    };
    persistFilmLibrary({ ...filmLibrary, [id]: nextFilm });
    syncPublicFilm(nextFilm);
    if (becomesCompleted) logWatchEvents([{ type: 'film', mediaId: id, at: Date.now(), runtime: film.runtime || 100 }]);
  }

  function rewatchFilm(id) {
    const film = filmLibrary[id];
    if (!film) return;
    const nextFilm = { ...film, rewatchCount: (film.rewatchCount || 0) + 1, watchedAt: Date.now(), watched: true, watchStatus: 'completed' };
    persistFilmLibrary({ ...filmLibrary, [id]: nextFilm });
    syncPublicFilm(nextFilm);
    logWatchEvents([{ type: 'rewatch-film', mediaId: id, at: Date.now(), runtime: film.runtime || 100 }]);
  }

  function removeFilm(id) {
    const next = { ...filmLibrary };
    delete next[id];
    persistFilmLibrary(next);
    if (userId) removePublicLibraryItem(userId, 'film', id).catch(() => {});
  }

  async function persistGameLibrary(next) {
    setGameLibrary(next);
    try { await window.storage.set('game-library', JSON.stringify(next)); }
    catch (e) { setError(t('errors.saveGamesFailed')); }
  }

  async function addGame(gameId) {
    try {
      const data = await fetchGameDetails(gameId);
      const entry = {
        id: data.id,
        name: data.name,
        background_image: data.background_image,
        released: data.released || '',
        playtime: data.playtime || 0,
        genres: gameGenres(data),
        platforms: gamePlatforms(data),
        developers: gameDevelopers(data),
        publishers: gamePublishers(data),
        esrb: data.esrb_rating?.name || null,
        metacritic: data.metacritic || null,
        watchStatus: 'planned',
        hoursPlayed: 0,
        completed100: false,
        platinum: false,
        rewatchCount: 0,
        addedAt: Date.now(),
      };
      await persistGameLibrary({ ...gameLibrary, [entry.id]: entry });
      syncPublicGame(entry);
    } catch (e) { setError(e.message); }
  }

  function removeGame(id) {
    const next = { ...gameLibrary };
    delete next[id];
    persistGameLibrary(next);
    if (userId) removePublicLibraryItem(userId, 'game', id).catch(() => {});
  }

  function setGameWatchStatus(id, watchStatus) {
    const game = gameLibrary[id];
    if (!game) return;
    const becomesCompleted = watchStatus === 'completed' && game.watchStatus !== 'completed';
    const nextGame = { ...game, watchStatus };
    persistGameLibrary({ ...gameLibrary, [id]: nextGame });
    syncPublicGame(nextGame);
    if (becomesCompleted) logWatchEvents([{ type: 'game', mediaId: id, at: Date.now(), hours: game.hoursPlayed || 0 }]);
  }

  function setGameHoursPlayed(id, hours) {
    const game = gameLibrary[id];
    if (!game) return;
    const nextGame = { ...game, hoursPlayed: Math.max(0, Number(hours) || 0) };
    persistGameLibrary({ ...gameLibrary, [id]: nextGame });
  }

  function toggleGameCompleted100(id) {
    const game = gameLibrary[id];
    if (!game) return;
    persistGameLibrary({ ...gameLibrary, [id]: { ...game, completed100: !game.completed100 } });
  }

  function toggleGamePlatinum(id) {
    const game = gameLibrary[id];
    if (!game) return;
    persistGameLibrary({ ...gameLibrary, [id]: { ...game, platinum: !game.platinum } });
  }

  function rewatchGame(id) {
    const game = gameLibrary[id];
    if (!game) return;
    const nextGame = { ...game, rewatchCount: (game.rewatchCount || 0) + 1 };
    persistGameLibrary({ ...gameLibrary, [id]: nextGame });
    logWatchEvents([{ type: 'rewatch-game', mediaId: id, at: Date.now() }]);
  }

  async function persistLists(next) {
    setLists(next);
    try { await window.storage.set('lists', JSON.stringify(next)); }
    catch (e) { setError(t('errors.saveListsFailed')); }
  }

  function buildPublicItems(items) {
    return (items || []).map((it) => {
      const source = it.type === 'show' ? library[it.id] : filmLibrary[it.id];
      return {
        type: it.type, id: it.id,
        title: source ? (it.type === 'show' ? source.name : source.title) : '',
        poster: source ? source.poster_path : null,
      };
    });
  }

  function syncPublicListIfNeeded(list) {
    if (!userId || !list.isPublic) return;
    const items = buildPublicItems(list.items);
    upsertPublicList(list.id, userId, {
      name: list.name, description: list.description, tags: list.tags,
      items, coverPoster: items[0]?.poster || null,
    }).catch(() => {});
  }

  function createList(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    const id = 'list-' + Date.now();
    persistLists({ ...lists, [id]: { id, name: trimmed, description: '', tags: [], isPublic: false, createdAt: Date.now(), items: [] } });
  }

  function deleteList(id) {
    const next = { ...lists };
    delete next[id];
    persistLists(next);
    if (userId) removePublicList(id).catch(() => {});
  }

  function updateListMeta(listId, fields) {
    const list = lists[listId];
    if (!list) return;
    const wasPublic = list.isPublic;
    const nextList = { ...list, ...fields };
    persistLists({ ...lists, [listId]: nextList });
    if (nextList.isPublic) syncPublicListIfNeeded(nextList);
    else if (wasPublic && userId) removePublicList(listId).catch(() => {});
  }

  function toggleListMembership(listId, type, itemId) {
    const list = lists[listId];
    if (!list) return;
    const exists = list.items.some(it => it.type === type && it.id === itemId);
    const nextItems = exists
      ? list.items.filter(it => !(it.type === type && it.id === itemId))
      : [...list.items, { type, id: itemId }];
    const nextList = { ...list, items: nextItems };
    persistLists({ ...lists, [listId]: nextList });
    syncPublicListIfNeeded(nextList);
  }

  function removeFromList(listId, type, itemId) {
    const list = lists[listId];
    if (!list) return;
    const nextList = { ...list, items: list.items.filter(it => !(it.type === type && it.id === itemId)) };
    persistLists({ ...lists, [listId]: nextList });
    syncPublicListIfNeeded(nextList);
  }

  function exportCSV() {
    const rows = Object.values(library).map(show => ({
      id: show.id, name: show.name, poster_path: show.poster_path || '', status: show.status || '',
      first_air_date: show.first_air_date || '', episode_run_time: show.episode_run_time || '',
      number_of_episodes: show.number_of_episodes || '', seasons: serializeSeasons(show.seasons), watched: serializeWatched(show.watched),
    }));
    downloadCSV(rows, `serie-tv-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  async function importCSV(file) {
    try {
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      const next = { ...library };
      let count = 0;
      parsed.data.forEach(row => {
        if (!row.id || !row.name) return;
        const id = Number(row.id);
        next[id] = {
          ...(next[id] || {}),
          id, name: row.name, poster_path: row.poster_path || (next[id]?.poster_path ?? null), status: row.status || 'Ended',
          first_air_date: row.first_air_date || '', episode_run_time: Number(row.episode_run_time) || 45,
          number_of_episodes: Number(row.number_of_episodes) || 0, seasons: parseSeasons(row.seasons),
          watched: parseWatched(row.watched), addedAt: (next[id] && next[id].addedAt) || Date.now(),
        };
        count += 1;
      });
      if (count === 0) { setError(t('errors.csvNoValidRows')); return; }
      await persistLibrary(next);
    } catch (e) { setError(t('errors.csvReadFailed')); }
  }

  function exportShowsJSON() {
    downloadJSON(Object.values(library), `serie-tv-${new Date().toISOString().slice(0, 10)}.json`);
  }

  async function importShowsJSON(file) {
    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('formato non valido');
      if (arr.length === 0) { setError(t('errors.jsonNoValidShows')); return; }

      const looksLikeTvTime = arr[0] && arr[0].id && typeof arr[0].id === 'object';
      if (looksLikeTvTime) {
        await importFromTvTime(arr);
        return;
      }

      const next = { ...library };
      let count = 0;
      arr.forEach(item => {
        if (!item || !item.id || !item.name) return;
        const id = Number(item.id);
        next[id] = {
          ...(next[id] || {}),
          ...item,
          id, name: item.name, poster_path: item.poster_path || (next[id]?.poster_path ?? null), status: item.status || 'Ended',
          first_air_date: item.first_air_date || '', episode_run_time: Number(item.episode_run_time) || 45,
          number_of_episodes: Number(item.number_of_episodes) || 0,
          seasons: Array.isArray(item.seasons) ? item.seasons : (next[id]?.seasons || []),
          watched: item.watched && typeof item.watched === 'object' ? item.watched : (next[id]?.watched || {}),
          addedAt: (next[id] && next[id].addedAt) || item.addedAt || Date.now(),
        };
        count += 1;
      });
      if (count === 0) { setError(t('errors.jsonNoValidShows')); return; }
      await persistLibrary(next);
    } catch (e) { setError(t('errors.jsonReadFailed')); }
  }

  async function importFromTvTime(arr) {
    if (!apiKey) {
      setError(t('errors.tvtimeNeedsApiKey'));
      return;
    }
    let next = { ...library };
    let matched = 0, skipped = 0;
    const total = arr.length;

    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      setImportProgress({ done: i, total, matched, skipped });
      const tvdbId = item && item.id && item.id.tvdb;
      if (!tvdbId) { skipped++; continue; }

      let tmdbId = null;
      try {
        const found = await tmdb(`/find/${tvdbId}?external_source=tvdb_id`, apiKey, lang);
        const match = found.tv_results && found.tv_results[0];
        if (!match) { skipped++; continue; }
        tmdbId = match.id;
      } catch (e) { skipped++; continue; }

      if (!next[tmdbId]) {
        try {
          const data = await tmdb(`/tv/${tmdbId}`, apiKey, lang);
          next[tmdbId] = {
            id: data.id, name: data.name, poster_path: data.poster_path, status: data.status,
            first_air_date: data.first_air_date, episode_run_time: (data.episode_run_time && data.episode_run_time[0]) || 45,
            number_of_episodes: data.number_of_episodes || 0,
            seasons: (data.seasons || []).map(s => ({
              season_number: s.season_number, episode_count: s.episode_count, name: s.name,
            })),
            watched: {}, addedAt: Date.now(),
          };
        } catch (e) { skipped++; continue; }
      }

      const watched = { ...next[tmdbId].watched };
      (item.seasons || []).forEach(season => {
        if (season.is_specials) return;
        const epsWatched = (season.episodes || []).filter(e => e.is_watched).map(e => e.number);
        if (epsWatched.length) {
          const set = new Set(watched[season.number] || []);
          epsWatched.forEach(n => set.add(n));
          watched[season.number] = Array.from(set);
        }
      });
      next[tmdbId] = { ...next[tmdbId], watched };
      matched++;
    }

    setImportProgress(null);
    await persistLibrary(next);
    if (matched === 0) {
      setError(t('errors.tvtimeNoneMatched'));
    } else if (skipped > 0) {
      setError(t('errors.tvtimeCompletedWithSkipped', { matched, skipped }));
    } else {
      setError(t('errors.tvtimeCompleted', { matched }));
    }
  }

  function exportFilmsCSV() {
    const rows = Object.values(filmLibrary).map(f => ({
      id: f.id, title: f.title, poster_path: f.poster_path || '', release_date: f.release_date || '',
      runtime: f.runtime || '', watched: f.watched ? 'si' : 'no',
      watched_at: f.watchedAt ? new Date(f.watchedAt).toISOString().slice(0, 10) : '',
    }));
    downloadCSV(rows, `film-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  async function importFilmsCSV(file) {
    try {
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      const next = { ...filmLibrary };
      let count = 0;
      parsed.data.forEach(row => {
        if (!row.id || !row.title) return;
        const id = Number(row.id);
        next[id] = {
          ...(next[id] || {}),
          id, title: row.title, poster_path: row.poster_path || (next[id]?.poster_path ?? null), release_date: row.release_date || '',
          runtime: Number(row.runtime) || 100, watched: (row.watched || '').toLowerCase() === 'si',
          watchedAt: row.watched_at ? new Date(row.watched_at).getTime() : null,
          addedAt: (next[id] && next[id].addedAt) || Date.now(),
        };
        count += 1;
      });
      if (count === 0) { setError(t('errors.csvNoValidRows')); return; }
      await persistFilmLibrary(next);
    } catch (e) { setError(t('errors.csvReadFilmsFailed')); }
  }

  async function resolveMovieTmdbId(item) {
    const imdbId = item?.id?.imdb;
    if (imdbId) {
      try {
        const found = await tmdb(`/find/${imdbId}?external_source=imdb_id`, apiKey, lang);
        const match = found.movie_results && found.movie_results[0];
        if (match) return match.id;
      } catch (e) {}
    }
    const title = item.title || item.name;
    if (!title) return null;
    try {
      const data = await tmdb(`/search/movie?query=${encodeURIComponent(title)}`, apiKey, lang);
      const results = data.results || [];
      if (item.year) {
        const withYear = results.find(r => (r.release_date || '').slice(0, 4) === String(item.year));
        if (withYear) return withYear.id;
      }
      return results[0]?.id || null;
    } catch (e) { return null; }
  }

  async function importMoviesFromTvTime(arr) {
    if (!apiKey) { setError(t('errors.tvtimeNeedsApiKey')); return; }
    let next = { ...filmLibrary };
    let matched = 0, skipped = 0;
    const total = arr.length;
    const touched = [];

    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      setImportProgress({ done: i, total, matched, skipped });
      const tmdbId = await resolveMovieTmdbId(item);
      if (!tmdbId) { skipped++; continue; }

      if (!next[tmdbId]) {
        try {
          const data = await tmdb(`/movie/${tmdbId}?append_to_response=credits`, apiKey, lang);
          next[tmdbId] = {
            id: data.id, title: data.title, poster_path: data.poster_path,
            release_date: data.release_date || '', runtime: data.runtime || 100,
            genres: (data.genres || []).map(g => g.name),
            directors: (data.credits?.crew || []).filter(c => c.job === 'Director').map(c => c.name),
            topCast: (data.credits?.cast || []).slice(0, 5).map(c => c.name),
            watched: false, watchedAt: null, watchStatus: 'planned', rewatchCount: 0, addedAt: Date.now(),
          };
        } catch (e) { skipped++; continue; }
      }

      const isWatched = !!item.is_watched;
      next[tmdbId] = {
        ...next[tmdbId],
        watched: isWatched || next[tmdbId].watched,
        watchedAt: item.watched_at ? new Date(item.watched_at).getTime() : next[tmdbId].watchedAt,
        watchStatus: isWatched ? 'completed' : (next[tmdbId].watchStatus || 'planned'),
        rewatchCount: Math.max(item.rewatch_count || 0, next[tmdbId].rewatchCount || 0),
      };
      touched.push(tmdbId);
      matched++;
    }

    setImportProgress(null);
    await persistFilmLibrary(next);
    touched.forEach((id) => syncPublicFilm(next[id]));
    if (matched === 0) {
      setError(t('errors.tvtimeMoviesNoneMatched'));
    } else if (skipped > 0) {
      setError(t('errors.tvtimeMoviesCompletedWithSkipped', { matched, skipped }));
    } else {
      setError(t('errors.tvtimeMoviesCompleted', { matched }));
    }
  }

  function exportFilmsJSON() {
    downloadJSON(Object.values(filmLibrary), `film-${new Date().toISOString().slice(0, 10)}.json`);
  }

  async function importFilmsJSON(file) {
    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('formato non valido');
      if (arr.length === 0) { setError(t('errors.jsonNoValidFilms')); return; }

      const looksLikeTvTime = arr[0] && arr[0].id && typeof arr[0].id === 'object';
      if (looksLikeTvTime) {
        await importMoviesFromTvTime(arr);
        return;
      }

      const next = { ...filmLibrary };
      let count = 0;
      arr.forEach(item => {
        if (!item || !item.id || !item.title) return;
        const id = Number(item.id);
        next[id] = {
          ...(next[id] || {}),
          ...item,
          id, title: item.title, poster_path: item.poster_path || (next[id]?.poster_path ?? null), release_date: item.release_date || '',
          runtime: Number(item.runtime) || 100, watched: !!item.watched, watchedAt: item.watchedAt || null,
          addedAt: (next[id] && next[id].addedAt) || item.addedAt || Date.now(),
        };
        count += 1;
      });
      if (count === 0) { setError(t('errors.jsonNoValidFilms')); return; }
      await persistFilmLibrary(next);
    } catch (e) { setError(t('errors.jsonReadFailed')); }
  }

  function exportListsCSV() {
    const rows = [];
    Object.values(lists).forEach(list => {
      if (list.items.length === 0) {
        rows.push({ lista: list.name, tipo: '', id: '', titolo: '' });
      }
      list.items.forEach(item => {
        const titolo = item.type === 'show' ? (library[item.id]?.name || '') : (filmLibrary[item.id]?.title || '');
        rows.push({ lista: list.name, tipo: item.type, id: item.id, titolo });
      });
    });
    downloadCSV(rows, `liste-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  async function importListsCSV(file) {
    try {
      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      const next = { ...lists };
      const byName = {};
      Object.values(next).forEach(l => { byName[l.name] = l.id; });
      let count = 0;
      parsed.data.forEach(row => {
        if (!row.lista) return;
        let listId = byName[row.lista];
        if (!listId) {
          listId = 'list-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
          next[listId] = { id: listId, name: row.lista, createdAt: Date.now(), items: [] };
          byName[row.lista] = listId;
        }
        if (row.tipo && row.id) {
          const exists = next[listId].items.some(it => it.type === row.tipo && String(it.id) === String(row.id));
          if (!exists) next[listId] = { ...next[listId], items: [...next[listId].items, { type: row.tipo, id: Number(row.id) }] };
        }
        count += 1;
      });
      if (count === 0) { setError(t('errors.csvNoValidRows')); return; }
      await persistLists(next);
    } catch (e) { setError(t('errors.csvReadListsFailed')); }
  }

  function exportListsJSON() {
    downloadJSON(Object.values(lists), `liste-${new Date().toISOString().slice(0, 10)}.json`);
  }

  async function importListsFromTvTime(arr) {
    if (!apiKey) { setError(t('errors.tvtimeNeedsApiKey')); return; }
    let nextLists = { ...lists };
    let nextLibrary = { ...library };
    let nextFilmLibrary = { ...filmLibrary };
    let matched = 0, skipped = 0;
    const totalItems = arr.reduce((sum, l) => sum + ((l.items || []).length), 0);
    let done = 0;

    for (const tvList of arr) {
      const listId = 'list-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      const listItems = [];

      for (const it of (tvList.items || [])) {
        setImportProgress({ done, total: totalItems, matched, skipped });
        done++;

        if (it.type === 'series') {
          const tvdbId = it.tvdb_id;
          if (!tvdbId) { skipped++; continue; }
          let tmdbId = null;
          try {
            const found = await tmdb(`/find/${tvdbId}?external_source=tvdb_id`, apiKey, lang);
            tmdbId = found.tv_results?.[0]?.id || null;
          } catch (e) {}
          if (!tmdbId) { skipped++; continue; }

          if (!nextLibrary[tmdbId]) {
            try {
              const data = await tmdb(`/tv/${tmdbId}?append_to_response=credits`, apiKey, lang);
              nextLibrary[tmdbId] = {
                id: data.id, name: data.name, poster_path: data.poster_path, status: data.status,
                first_air_date: data.first_air_date, episode_run_time: (data.episode_run_time && data.episode_run_time[0]) || 45,
                number_of_episodes: data.number_of_episodes || 0,
                genres: (data.genres || []).map(g => g.name),
                creators: (data.created_by || []).map(c => c.name),
                topCast: (data.credits?.cast || []).slice(0, 5).map(c => c.name),
                seasons: (data.seasons || []).map(s => ({ season_number: s.season_number, episode_count: s.episode_count, name: s.name })),
                watched: {}, watchStatus: 'planned', addedAt: Date.now(),
              };
            } catch (e) { skipped++; continue; }
          }
          listItems.push({ type: 'show', id: tmdbId });
          matched++;
        } else if (it.type === 'movie') {
          let tmdbId = null;
          try {
            const data = await tmdb(`/search/movie?query=${encodeURIComponent(it.name || '')}`, apiKey, lang);
            tmdbId = data.results?.[0]?.id || null;
          } catch (e) {}
          if (!tmdbId) { skipped++; continue; }

          if (!nextFilmLibrary[tmdbId]) {
            try {
              const data = await tmdb(`/movie/${tmdbId}?append_to_response=credits`, apiKey, lang);
              nextFilmLibrary[tmdbId] = {
                id: data.id, title: data.title, poster_path: data.poster_path,
                release_date: data.release_date || '', runtime: data.runtime || 100,
                genres: (data.genres || []).map(g => g.name),
                directors: (data.credits?.crew || []).filter(c => c.job === 'Director').map(c => c.name),
                topCast: (data.credits?.cast || []).slice(0, 5).map(c => c.name),
                watched: false, watchedAt: null, watchStatus: 'planned', rewatchCount: 0, addedAt: Date.now(),
              };
            } catch (e) { skipped++; continue; }
          }
          listItems.push({ type: 'film', id: tmdbId });
          matched++;
        } else {
          skipped++;
        }
      }

      nextLists[listId] = {
        id: listId, name: (tvList.name || 'Lista TV Time').trim(), description: tvList.description || '',
        tags: [], isPublic: false,
        createdAt: tvList.created_at ? new Date(tvList.created_at).getTime() : Date.now(),
        items: listItems,
      };
    }

    setImportProgress(null);
    await persistLibrary(nextLibrary);
    await persistFilmLibrary(nextFilmLibrary);
    await persistLists(nextLists);
    if (matched === 0) {
      setError(t('errors.tvtimeListsNoneMatched'));
    } else if (skipped > 0) {
      setError(t('errors.tvtimeListsCompletedWithSkipped', { matched, skipped }));
    } else {
      setError(t('errors.tvtimeListsCompleted', { matched }));
    }
  }

  async function importTvTimeGdprZip(file) {
    if (!apiKey) { setError(t('errors.tvtimeNeedsApiKey')); return; }
    let parsed;
    try {
      parsed = await parseTvTimeGdprZip(file);
    } catch (e) {
      setError(t('errors.tvtimeGdprBadFile'));
      return;
    }

    let nextLibrary = { ...library };
    let nextLists = { ...lists };
    const tvdbToTmdb = {};
    let matchedShows = 0, skippedShows = 0;
    const totalSteps = parsed.shows.length + parsed.lists.length;
    let done = 0;

    for (const show of parsed.shows) {
      setImportProgress({ done, total: totalSteps, matched: matchedShows, skipped: skippedShows });
      done++;

      let tmdbId = null;
      try {
        const found = await tmdb(`/find/${show.tvdbId}?external_source=tvdb_id`, apiKey, lang);
        tmdbId = found.tv_results?.[0]?.id || null;
      } catch (e) {}
      if (!tmdbId) { skippedShows++; continue; }
      tvdbToTmdb[show.tvdbId] = tmdbId;

      if (!nextLibrary[tmdbId]) {
        try {
          const data = await tmdb(`/tv/${tmdbId}?append_to_response=credits`, apiKey, lang);
          nextLibrary[tmdbId] = {
            id: data.id, name: data.name, poster_path: data.poster_path, status: data.status,
            first_air_date: data.first_air_date, episode_run_time: (data.episode_run_time && data.episode_run_time[0]) || 45,
            number_of_episodes: data.number_of_episodes || 0,
            genres: (data.genres || []).map(g => g.name),
            creators: (data.created_by || []).map(c => c.name),
            topCast: (data.credits?.cast || []).slice(0, 5).map(c => c.name),
            seasons: (data.seasons || []).map(s => ({ season_number: s.season_number, episode_count: s.episode_count, name: s.name })),
            watched: {}, watchStatus: null, addedAt: Date.now(),
          };
        } catch (e) { skippedShows++; continue; }
      }

      const entry = nextLibrary[tmdbId];
      const nextWatched = { ...entry.watched };
      const logEntries = [];
      let lastAt = entry.lastWatchedAt || 0;
      for (const ep of show.episodes) {
        const set = new Set(nextWatched[ep.season] || []);
        if (!set.has(ep.episode)) {
          set.add(ep.episode);
          nextWatched[ep.season] = Array.from(set);
          logEntries.push({ type: 'episode', mediaId: tmdbId, season: ep.season, episode: ep.episode, at: ep.at, runtime: entry.episode_run_time || 45 });
          if (ep.at > lastAt) lastAt = ep.at;
        }
      }
      nextLibrary[tmdbId] = {
        ...entry,
        watched: nextWatched,
        rewatchCount: Math.max(entry.rewatchCount || 0, show.rewatchCount || 0),
        lastWatchedAt: lastAt || entry.lastWatchedAt,
      };
      if (logEntries.length) logWatchEvents(logEntries);
      matchedShows++;
    }

    let matchedListItems = 0;
    for (const l of parsed.lists) {
      setImportProgress({ done, total: totalSteps, matched: matchedShows, skipped: skippedShows });
      done++;
      const items = [];
      for (const tvdbId of l.seriesTvdbIds) {
        let tmdbId = tvdbToTmdb[tvdbId];
        if (!tmdbId) {
          try {
            const found = await tmdb(`/find/${tvdbId}?external_source=tvdb_id`, apiKey, lang);
            tmdbId = found.tv_results?.[0]?.id || null;
          } catch (e) {}
        }
        if (!tmdbId) continue;
        tvdbToTmdb[tvdbId] = tmdbId;
        if (!nextLibrary[tmdbId]) {
          try {
            const data = await tmdb(`/tv/${tmdbId}?append_to_response=credits`, apiKey, lang);
            nextLibrary[tmdbId] = {
              id: data.id, name: data.name, poster_path: data.poster_path, status: data.status,
              first_air_date: data.first_air_date, episode_run_time: (data.episode_run_time && data.episode_run_time[0]) || 45,
              number_of_episodes: data.number_of_episodes || 0,
              genres: (data.genres || []).map(g => g.name),
              creators: (data.created_by || []).map(c => c.name),
              topCast: (data.credits?.cast || []).slice(0, 5).map(c => c.name),
              seasons: (data.seasons || []).map(s => ({ season_number: s.season_number, episode_count: s.episode_count, name: s.name })),
              watched: {}, watchStatus: null, addedAt: Date.now(),
            };
          } catch (e) { continue; }
        }
        items.push({ type: 'show', id: tmdbId });
        matchedListItems++;
      }
      if (items.length === 0) continue;
      const listId = 'list-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      nextLists[listId] = {
        id: listId, name: l.name, description: l.description, tags: [], isPublic: l.isPublic,
        createdAt: l.createdAt, items,
      };
    }

    setImportProgress(null);
    await persistLibrary(nextLibrary);
    await persistLists(nextLists);

    if (matchedShows === 0 && matchedListItems === 0) {
      setError(t('errors.tvtimeGdprNoneMatched'));
    } else {
      setError(t('errors.tvtimeGdprCompleted', { shows: matchedShows, lists: parsed.lists.length, skipped: skippedShows }));
    }
  }

  async function importListsJSON(file) {
    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('formato non valido');
      if (arr.length === 0) { setError(t('errors.jsonNoValidLists')); return; }

      const looksLikeTvTime = arr.some(l => Array.isArray(l.items) && l.items.some(it => it && it.tvdb_id !== undefined));
      if (looksLikeTvTime) {
        await importListsFromTvTime(arr);
        return;
      }

      const next = { ...lists };
      let count = 0;
      arr.forEach(l => {
        if (!l || !l.name) return;
        const id = l.id || ('list-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7));
        next[id] = {
          ...(next[id] || {}),
          ...l,
          id, name: l.name, createdAt: l.createdAt || (next[id]?.createdAt) || Date.now(),
          items: Array.isArray(l.items) ? l.items.filter(it => it && it.type && it.id != null).map(it => ({ type: it.type, id: Number(it.id) })) : (next[id]?.items || []),
        };
        count += 1;
      });
      if (count === 0) { setError(t('errors.jsonNoValidLists')); return; }
      await persistLists(next);
    } catch (e) { setError(t('errors.jsonReadFailed')); }
  }

  const watchedCountForShow = (show) => Object.values(show.watched || {}).reduce((sum, arr) => sum + arr.length, 0);

  return {
    library, filmLibrary, gameLibrary, lists, watchLog, ready, loadAll, watchedCountForShow,
    addShow, removeShow, toggleEpisode, markUpTo, setEpisodesWatched, setShowWatchStatus, markAllWatched, rewatchShow, bulkUpdateShows, refreshOnAirShows, refreshStaleTmdbCache,
    addFilm, toggleFilmWatched, removeFilm, setFilmWatchStatus, rewatchFilm,
    addGame, removeGame, setGameWatchStatus, setGameHoursPlayed, toggleGameCompleted100, toggleGamePlatinum, rewatchGame,
    createList, deleteList, updateListMeta, toggleListMembership, removeFromList,
    exportCSV, importCSV, exportShowsJSON, importShowsJSON,
    exportFilmsCSV, importFilmsCSV, exportFilmsJSON, importFilmsJSON,
    exportListsCSV, importListsCSV, exportListsJSON, importListsJSON, importTvTimeGdprZip,
  };
}
