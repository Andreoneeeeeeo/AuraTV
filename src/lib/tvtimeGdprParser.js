import Papa from 'papaparse';

// L'export ufficiale GDPR di TV Time (gdpr.tvtime.com) è uno zip con decine
// di file CSV "grezzi" del loro database interno — non pensati per essere
// letti da altre app. Questo file isola la logica di lettura dei pochi file
// che contengono dati utili per noi. Copre SOLO le serie TV: i film in
// questo export sono identificati da UUID interni senza alcun nome o ID
// esterno associato, quindi non sono recuperabili da qui.

function parseCsv(text) {
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
  return data;
}

// Le "liste" di TV Time sono salvate come stringhe in stile Go
// ( "[map[id:123 type:series] map[id:456 type:series]]" ), non JSON.
// Non serve un parser completo: basta estrarre le coppie "id:NNN type:series".
function extractSeriesIds(objectsRaw) {
  if (!objectsRaw) return [];
  const ids = [];
  const re = /id:(\d+)\s+type:series/g;
  let m;
  while ((m = re.exec(objectsRaw)) !== null) ids.push(Number(m[1]));
  return ids;
}

export async function parseTvTimeGdprZip(zipFile) {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(zipFile);

  async function readCsv(name) {
    const entry = zip.file(name);
    if (!entry) return [];
    const text = await entry.async('string');
    return parseCsv(text);
  }

  const [followed, showData, watchRecords, rewatches, lists] = await Promise.all([
    readCsv('followed_tv_show.csv'),
    readCsv('user_tv_show_data.csv'),
    readCsv('tracking-prod-records-v2.csv'),
    readCsv('rewatched_episode.csv'),
    readCsv('lists-prod-lists.csv'),
  ]);

  // --- Serie: unione di "seguite" e "con almeno un episodio visto" ---
  const showsById = new Map();
  for (const row of followed) {
    const id = Number(row.tv_show_id);
    if (!id) continue;
    showsById.set(id, { tvdbId: id, name: row.tv_show_name || '' });
  }
  for (const row of showData) {
    const id = Number(row.tv_show_id);
    if (!id) continue;
    if (!showsById.has(id)) showsById.set(id, { tvdbId: id, name: row.tv_show_name || '' });
  }

  // --- Episodi visti, con data reale, raggruppati per nome serie ---
  const episodesByShowName = new Map();
  for (const row of watchRecords) {
    const name = (row.series_name || '').trim();
    if (!name) continue;
    const season = Number(row.season_number ?? row.s_no);
    const episode = Number(row.episode_number ?? row.ep_no);
    if (!Number.isFinite(season) || !Number.isFinite(episode)) continue;
    const at = row.created_at ? new Date(row.created_at.replace(' ', 'T') + 'Z').getTime() : Date.now();
    if (!episodesByShowName.has(name)) episodesByShowName.set(name, []);
    episodesByShowName.get(name).push({ season, episode, at });
  }

  // --- Rewatch per serie (conteggio approssimato) ---
  const rewatchByShowName = new Map();
  for (const row of rewatches) {
    const name = (row.tv_show_name || '').trim();
    if (!name) continue;
    rewatchByShowName.set(name, (rewatchByShowName.get(name) || 0) + 1);
  }

  // --- Liste (solo quelle con almeno una serie identificabile) ---
  const parsedLists = [];
  for (const row of lists) {
    if (row.s_key === 'collection' || row.type !== 'list') continue;
    const seriesIds = extractSeriesIds(row.objects);
    if (seriesIds.length === 0) continue;
    let name = (row.name || '').trim();
    if (!name && row.s_key === 'favorite-series') name = 'Preferite (da TV Time)';
    if (!name) name = 'Lista TV Time';
    parsedLists.push({
      name,
      description: row.description && row.description !== '<nil>' ? row.description : '',
      isPublic: row.is_public === 'true',
      createdAt: row.created_at ? new Date(row.created_at.replace(' ', 'T') + 'Z').getTime() : Date.now(),
      seriesTvdbIds: seriesIds,
    });
  }

  const shows = Array.from(showsById.values()).map((s) => ({
    ...s,
    episodes: episodesByShowName.get(s.name) || [],
    rewatchCount: rewatchByShowName.get(s.name) || 0,
  }));

  return { shows, lists: parsedLists };
}
