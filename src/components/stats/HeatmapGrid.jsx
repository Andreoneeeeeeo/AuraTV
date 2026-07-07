import { useI18n } from '../../i18n/index.jsx';

function levelColor(count) {
  if (count === 0) return 'var(--surface-alt)';
  if (count === 1) return 'rgba(var(--amber-rgb), 0.35)';
  if (count === 2) return 'rgba(var(--amber-rgb), 0.6)';
  if (count === 3) return 'rgba(var(--amber-rgb), 0.85)';
  return 'var(--amber)';
}

export default function HeatmapGrid({ days }) {
  const { t } = useI18n();
  // Raggruppa in colonne di 7 giorni (settimane)
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div>
      <p className="font-body text-sm font-semibold mb-3">{t('stats.heatmapTitle')}</p>
      <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count}`}
                style={{ width: 11, height: 11, borderRadius: 3, background: levelColor(d.count) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
