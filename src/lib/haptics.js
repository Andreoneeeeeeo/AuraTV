// Feedback tattile leggero sulle interazioni principali. Su web/Electron
// (dove l'API nativa non esiste) fallisce silenziosamente: nessun errore,
// semplicemente nessuna vibrazione.
let hapticsModule = null;
let loadAttempted = false;

async function getHaptics() {
  if (loadAttempted) return hapticsModule;
  loadAttempted = true;
  try {
    const mod = await import('@capacitor/haptics');
    hapticsModule = mod;
  } catch (e) {
    hapticsModule = null;
  }
  return hapticsModule;
}

export async function hapticLight() {
  const mod = await getHaptics();
  try { await mod?.Haptics.impact({ style: mod.ImpactStyle.Light }); } catch (e) {}
}

export async function hapticMedium() {
  const mod = await getHaptics();
  try { await mod?.Haptics.impact({ style: mod.ImpactStyle.Medium }); } catch (e) {}
}

export async function hapticSelection() {
  const mod = await getHaptics();
  try { await mod?.Haptics.selectionStart(); } catch (e) {}
}

export async function hapticSuccess() {
  const mod = await getHaptics();
  try { await mod?.Haptics.notification({ type: mod.NotificationType.Success }); } catch (e) {}
}
