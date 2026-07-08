const KEY = 'tvtracker-tvtime-prompt-seen';

export function hasSeenTvTimePrompt() {
  try { return localStorage.getItem(KEY) === '1'; } catch (e) { return true; }
}

export function markTvTimePromptSeen() {
  try { localStorage.setItem(KEY, '1'); } catch (e) {}
}
