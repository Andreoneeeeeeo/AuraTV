export default function TmdbAttributionBadge({ height = 14 }) {
  // Badge di attribuzione per TMDB, nei loro colori ufficiali (verde/blu).
  // Non è il file vettoriale esatto di TMDB (la mia rete non riesce a
  // raggiungerlo), ma un marchio testuale pulito nei loro colori — visibile,
  // leggibile e chiaramente distinto dal marchio dell'app, come richiesto
  // dalle loro linee guida di attribuzione.
  return (
    <svg height={height} viewBox="0 0 200 32" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="TMDB">
      <rect x="0" y="4" width="24" height="24" rx="6" fill="#90CEA1" />
      <rect x="26" y="4" width="24" height="24" rx="6" fill="#01B4E4" />
      <rect x="13" y="4" width="24" height="24" rx="6" fill="#0D253F" opacity="0.85" />
      <text x="58" y="23" fontFamily="Arial, Helvetica, sans-serif" fontSize="20" fontWeight="700" fill="currentColor">TMDB</text>
    </svg>
  );
}
