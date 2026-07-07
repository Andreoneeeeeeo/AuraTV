import Papa from 'papaparse';

export function serializeSeasons(seasons) {
  return (seasons || []).map(s => `${s.season_number}:${s.episode_count}:${(s.name || '').replace(/[|:]/g, ' ')}`).join('|');
}

export function parseSeasons(str) {
  if (!str) return [];
  return str.split('|').filter(Boolean).map(part => {
    const [season_number, episode_count, ...nameParts] = part.split(':');
    return {
      season_number: Number(season_number),
      episode_count: Number(episode_count),
      name: nameParts.join(':') || `Stagione ${season_number}`,
    };
  });
}

export function serializeWatched(watched) {
  return Object.entries(watched || {}).map(([season, eps]) => `${season}:${eps.join(',')}`).join(';');
}

export function parseWatched(str) {
  const watched = {};
  if (!str) return watched;
  str.split(';').filter(Boolean).forEach(part => {
    const [season, eps] = part.split(':');
    watched[season] = eps ? eps.split(',').filter(Boolean).map(Number) : [];
  });
  return watched;
}

export function downloadCSV(rows, filename) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export { Papa };
