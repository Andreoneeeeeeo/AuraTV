const KEY = 'tvtracker-tvtime-prompt-seen';
const KEY_UNIFIED = 'tvtracker-tvtime-onboarding-seen';

export function hasSeenTvTimePrompt() {
  try { return localStorage.getItem(KEY_UNIFIED) === '1'; } catch (e) { return true; }
}

export function markTvTimePromptSeen() {
  try { localStorage.setItem(KEY_UNIFIED, '1'); } catch (e) {}
}
