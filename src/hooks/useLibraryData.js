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

  function exportFilmsJSON() {
    downloadJSON(Object.values(filmLibrary), `film-${new Date().toISOString().slice(0, 10)}.json`);
  }

  async function importFilmsJSON(file) {
    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('formato non valido');
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

  async function importListsJSON(file) {
    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('formato non valido');
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
    addShow, removeShow, toggleEpisode, markUpTo, setEpisodesWatched, setShowWatchStatus, markAllWatched, rewatchShow, bulkUpdateShows, refreshOnAirShows,
    addFilm, toggleFilmWatched, removeFilm, setFilmWatchStatus, rewatchFilm,
    addGame, removeGame, setGameWatchStatus, setGameHoursPlayed, toggleGameCompleted100, toggleGamePlatinum, rewatchGame,
    createList, deleteList, updateListMeta, toggleListMembership, removeFromList,
    exportCSV, importCSV, exportShowsJSON, importShowsJSON,
    exportFilmsCSV, importFilmsCSV, exportFilmsJSON, importFilmsJSON,
    exportListsCSV, importListsCSV, exportListsJSON, importListsJSON,
  };
}
