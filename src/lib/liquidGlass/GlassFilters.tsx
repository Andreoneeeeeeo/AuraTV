// Definizioni SVG condivise da ogni <LiquidGlass>. Montate UNA sola volta
// alla radice dell'app (vedi main.jsx) e referenziate tramite
// `filter: url(#liquid-glass-refraction-N)` — evita di duplicare gli stessi
// <filter> decine di volte nel DOM.
//
// Tecnica: feTurbulence genera un campo di rumore organico; feDisplacementMap
// lo usa per "spostare" leggermente i pixel dello sfondo, simulando la
// rifrazione ottica di una superficie di vetro non perfettamente piatta.
// Tre varianti con intensità diverse, scelte a runtime in base alla
// "qualità" rilevata del dispositivo (vedi deviceQuality.ts).
export default function GlassFilters() {
  return (
    <svg aria-hidden="true" focusable="false" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        <filter id="liquid-glass-refraction-high" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.010 0.014" numOctaves="2" seed="7" result="noise" />
          <feGaussianBlur in="noise" stdDeviation="2" result="softNoise" />
          <feDisplacementMap in="SourceGraphic" in2="softNoise" scale="14" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="liquid-glass-refraction-medium" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.016" numOctaves="1" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
