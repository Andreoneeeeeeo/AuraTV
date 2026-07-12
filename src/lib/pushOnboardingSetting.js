const KEY = 'tvtracker-push-onboarding-seen';

export function hasSeenPushOnboarding() {
  try { return localStorage.getItem(KEY) === '1'; } catch (e) { return true; }
}

export function markPushOnboardingSeen() {
  try { localStorage.setItem(KEY, '1'); } catch (e) {}
}
