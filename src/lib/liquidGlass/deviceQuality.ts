import type { GlassQuality } from './types.ts';

// Rilevata una volta sola per sessione (non cambia mentre l'app è aperta) e
// condivisa da ogni istanza di LiquidGlass, per evitare di ripetere il
// calcolo ad ogni componente montato.
let cachedQuality: GlassQuality | null = null;
let liveDowngraded = false;

function detectQuality(): GlassQuality {
  if (typeof window === 'undefined') return 'high';

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'low';

  const cores = (navigator as any).hardwareConcurrency || 4;
  const mem = (navigator as any).deviceMemory; // solo Chrome/Android, undefined altrove
  const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches;

  // Nessun deviceMemory disponibile (Safari/iOS/Windows): usa i core come proxy.
  if (mem !== undefined) {
    if (mem <= 3) return 'low';
    if (mem <= 6) return 'medium';
    return 'high';
  }
  if (cores <= 3) return isCoarsePointer ? 'low' : 'medium';
  if (cores <= 4) return 'medium';
  return 'high';
}

export function getGlassQuality(): GlassQuality {
  if (cachedQuality === null) cachedQuality = detectQuality();
  if (liveDowngraded && cachedQuality === 'high') return 'medium';
  if (liveDowngraded && cachedQuality === 'medium') return 'low';
  return cachedQuality;
}

// Se rileviamo frame lenti a runtime (vedi useFrameRateGuard), degradiamo
// la qualità per TUTTE le istanze future, indipendentemente da cosa avevamo
// stimato in partenza — meglio un vetro più semplice che un'app che scatta.
export function forceQualityDowngrade() {
  liveDowngraded = true;
}

export function resetQualityDetectionForTests() {
  cachedQuality = null;
  liveDowngraded = false;
}
