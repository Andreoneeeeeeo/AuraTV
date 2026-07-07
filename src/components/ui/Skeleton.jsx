export function SkeletonBlock({ width = '100%', height = 16, radius = 6, style = {} }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} aria-hidden="true" />;
}

export function SkeletonPosterGrid({ count = 9 }) {
  return (
    <div className="grid grid-cols-3 gap-3" role="status" aria-label="Caricamento">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <SkeletonBlock height={0} style={{ aspectRatio: '2 / 3', borderRadius: 6 }} />
          <SkeletonBlock height={10} width="80%" style={{ marginTop: 6 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 4, height = 64 }) {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Caricamento">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} height={height} radius={12} />
      ))}
    </div>
  );
}
