const KEY = 'tvtracker-collapsed-sections';

// Forma: { series: ['dropped'], films: [], games: ['completed'] }
export function getCollapsedSections() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { series: [], films: [], games: [] };
  } catch (e) {
    return { series: [], films: [], games: [] };
  }
}

export function setCollapsedSections(value) {
  try { localStorage.setItem(KEY, JSON.stringify(value)); } catch (e) {}
}
