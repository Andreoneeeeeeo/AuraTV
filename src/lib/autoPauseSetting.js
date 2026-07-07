const KEY = 'tvtracker-autopause-months';

export function getAutoPauseMonths() {
  try {
    const v = Number(localStorage.getItem(KEY));
    return [0, 1, 2, 3].includes(v) ? v : 0;
  } catch (e) { return 0; }
}

export function setAutoPauseMonths(months) {
  try { localStorage.setItem(KEY, String(months)); } catch (e) {}
}
