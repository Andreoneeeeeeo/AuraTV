import { Film, Check } from 'lucide-react';
import Poster from '../shared/Poster.jsx';
import EmptyState from '../shared/EmptyState.jsx';
import SectionLabel from '../shared/SectionLabel.jsx';
import { useI18n } from '../../i18n/index.jsx';
import { getFilmWatchStatus } from '../../lib/watchStatus.js';

const SECTION_ORDER = ['watching', 'planned', 'on_hold', 'completed', 'dropped'];

export default function FilmLibrary({ filmLibrary, onOpen }) {
  const { t } = useI18n();
  const films = Object.values(filmLibrary).sort((a, b) => (b.lastWatchedAt || b.addedAt) - (a.lastWatchedAt || a.addedAt));
  if (films.length === 0) {
    return <EmptyState icon={Film} text={t('library.emptyFilms')} />;
  }

  const labels = {
    watching: t('library.statusWatching'),
    planned: t('library.statusPlanned'),
    on_hold: t('library.statusOnHold'),
    completed: t('library.statusCompleted'),
    dropped: t('library.statusDropped'),
  };

  const sections = SECTION_ORDER.map((key) => ({
    key,
    label: labels[key],
    films: films.filter((f) => getFilmWatchStatus(f) === key),
  })).filter((s) => s.films.length > 0);

  return (
    <div>
      {sections.map((section) => (
        <div key={section.key} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel text={section.label} />
            <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>{section.films.length}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {section.films.map(film => (
              <button key={film.id} onClick={() => onOpen(film.id)} className="card-tap text-left">
                <div className="relative">
                  <Poster path={film.poster_path} fill alt={film.title} />
                  {film.watched && (
                    <span className="absolute flex items-center justify-center" style={{
                      top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: 'var(--watched)',
                    }}>
                      <Check size={12} color="var(--bg)" />
                    </span>
                  )}
                </div>
                <p className="font-body text-xs mt-1.5 truncate">{film.title}</p>
                <p className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{(film.release_date || '').slice(0, 4) || '—'}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
