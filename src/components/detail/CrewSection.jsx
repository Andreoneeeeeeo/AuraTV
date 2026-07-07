import { useI18n } from '../../i18n/index.jsx';
import { pickCrew } from '../../lib/tmdb.js';

const ROLES = [
  { jobs: ['Director'], key: 'director' },
  { jobs: ['Screenplay', 'Writer'], key: 'writer' },
  { jobs: ['Producer'], key: 'producer' },
  { jobs: ['Original Music Composer'], key: 'composer' },
  { jobs: ['Director of Photography'], key: 'cinematography' },
  { jobs: ['Editor'], key: 'editor' },
];

export default function CrewSection({ crew }) {
  const { t } = useI18n();
  if (!crew || crew.length === 0) return null;

  const rows = ROLES.map(({ jobs, key }) => ({
    key,
    label: t(`detail.role.${key}`),
    people: pickCrew(crew, jobs),
  })).filter((r) => r.people.length > 0);

  if (rows.length === 0) return null;

  return (
    <div className="mb-5">
      <h3 className="font-body text-sm font-semibold mb-2">{t('detail.crew')}</h3>
      <div className="rounded-xl p-3" style={{ background: 'var(--surface)' }}>
        {rows.map((row, i) => (
          <div key={row.key} className="flex items-start justify-between gap-3 py-1.5" style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--muted)', width: 100 }}>{row.label}</span>
            <span className="font-body text-sm text-right">{row.people.map((p) => p.name).join(', ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
