const KEY = 'tvtracker-library-view-mode';

export function getLibraryViewMode() {
  try { return localStorage.getItem(KEY) || 'grid'; } catch (e) { return 'grid'; }
}

export function setLibraryViewMode(value) {
  try { localStorage.setItem(KEY, value); } catch (e) {}
}
