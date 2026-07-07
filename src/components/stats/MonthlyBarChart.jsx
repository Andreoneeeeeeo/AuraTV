const MONTH_LABELS_IT = ['G', 'F', 'M', 'A', 'M', 'G', 'L', 'A', 'S', 'O', 'N', 'D'];
const MONTH_LABELS_EN = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export default function MonthlyBarChart({ data, lang }) {
  const labels = lang === 'en' ? MONTH_LABELS_EN : MONTH_LABELS_IT;
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex items-end gap-2" style={{ height: 100 }}>
      {data.map((d) => (
        <div key={d.key} className="flex-1 flex flex-col items-center justify-end" style={{ height: '100%' }}>
          <div
            className="progress-fill w-full rounded-t"
            style={{
              height: `${Math.max(4, (d.count / max) * 100)}%`,
              background: d.count > 0 ? 'var(--amber)' : 'var(--surface-alt)',
              minHeight: 4,
            }}
            title={`${d.count}`}
          />
          <span className="font-mono mt-1.5" style={{ fontSize: 10, color: 'var(--muted)' }}>{labels[d.month]}</span>
        </div>
      ))}
    </div>
  );
}
