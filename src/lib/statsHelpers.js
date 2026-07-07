function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function computeStreak(watchLog) {
  if (!watchLog || watchLog.length === 0) return { current: 0, best: 0 };
  const days = [...new Set(watchLog.map((e) => dayKey(e.at)))].sort();
  let best = 1, run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const cur = new Date(days[i]);
    const diff = Math.round((cur - prev) / 86400000);
    if (diff === 1) { run += 1; best = Math.max(best, run); }
    else if (diff > 1) { run = 1; }
  }
  const todayKey = dayKey(Date.now());
  const yesterdayKey = dayKey(Date.now() - 86400000);
  const daysSet = new Set(days);
  let current = 0;
  if (daysSet.has(todayKey) || daysSet.has(yesterdayKey)) {
    let cursor = daysSet.has(todayKey) ? new Date(todayKey) : new Date(yesterdayKey);
    while (daysSet.has(dayKey(cursor.getTime()))) {
      current += 1;
      cursor = new Date(cursor.getTime() - 86400000);
    }
  }
  return { current, best };
}

// Griglia stile "contributi" delle ultime N settimane (7 x N), un valore per giorno
export function computeHeatmap(watchLog, weeks = 13) {
  const counts = {};
  (watchLog || []).forEach((e) => {
    const k = dayKey(e.at);
    counts[k] = (counts[k] || 0) + 1;
  });
  const days = [];
  const totalDays = weeks * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const k = dayKey(d.getTime());
    days.push({ date: k, count: counts[k] || 0 });
  }
  return days;
}

// Attività per mese (ultimi N mesi)
export function computeMonthlyActivity(watchLog, months = 6) {
  const counts = {};
  (watchLog || []).forEach((e) => {
    const d = new Date(e.at);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts[k] = (counts[k] || 0) + 1;
  });
  const result = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({ key: k, month: d.getMonth(), year: d.getFullYear(), count: counts[k] || 0 });
  }
  return result;
}

function topN(counter, n) {
  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

export function computeTopGenres(library, filmLibrary, n = 6) {
  const counter = {};
  [...Object.values(library), ...Object.values(filmLibrary)].forEach((item) => {
    (item.genres || []).forEach((g) => { counter[g] = (counter[g] || 0) + 1; });
  });
  return topN(counter, n);
}

export function computeTopCast(library, filmLibrary, n = 6) {
  const counter = {};
  [...Object.values(library), ...Object.values(filmLibrary)].forEach((item) => {
    (item.topCast || []).forEach((name) => { counter[name] = (counter[name] || 0) + 1; });
  });
  return topN(counter, n);
}

export function computeTopDirectors(library, filmLibrary, n = 6) {
  const counter = {};
  Object.values(library).forEach((item) => {
    (item.creators || []).forEach((name) => { counter[name] = (counter[name] || 0) + 1; });
  });
  Object.values(filmLibrary).forEach((item) => {
    (item.directors || []).forEach((name) => { counter[name] = (counter[name] || 0) + 1; });
  });
  return topN(counter, n);
}

export function computeBestDay(watchLog) {
  const counts = {};
  (watchLog || []).forEach((e) => {
    const k = dayKey(e.at);
    counts[k] = (counts[k] || 0) + 1;
  });
  let bestDay = null, bestCount = 0;
  Object.entries(counts).forEach(([day, count]) => {
    if (count > bestCount) { bestCount = count; bestDay = day; }
  });
  return { day: bestDay, count: bestCount };
}
